import React, {
  useState,
  useEffect,
  useContext,
  createContext,
  useCallback,
} from "react";
import {
  Session,
  User,
  AuthChangeEvent,
} from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithMicrosoft: () => Promise<void>;
  loginWithGitHub: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isLoading: true,
  isInitialized: false,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  loginWithMicrosoft: async () => {},
  loginWithGitHub: async () => {},
  loginWithGoogle: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const handleUserProfile = async (user: User) => {
  try {
    if (!user?.id) {
      console.error("User ID is missing");
      return;
    }

    const { data: existingProfile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("Error checking profile:", profileError);
      return;
    }

    if (existingProfile) {
      console.log("Existing profile:", existingProfile);
      return;
    }

    const email = user.email || "example@email.com";
    const username = email.split("@")[0];

    const { data, error } = await supabase.from("profiles").insert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata.full_name || username,
      avatar_url: user.user_metadata.avatar_url,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Could not create user profile:", error);
      toast.error("Could not create user profile. Please try again.");
    } else {
      console.log("User profile created successfully!", data);
      toast.success("Welcome to FocusFlow! 🎉");
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    toast.error("An unexpected error occurred. Please try again.");
  }
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      if (data.user) {
        toast.success("Successfully logged in!");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Login failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        }
      });
      
      if (error) throw error;
      
      if (data.user) {
        toast.success("Account created successfully! Please check your email to verify your account.");
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error.message || "Signup failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithMicrosoft = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        }
      });
      if (error) throw error;
    } catch (error: any) {
      console.error("Microsoft login error:", error);
      toast.error(error.message || "Microsoft login failed");
    } finally {
      setLoading(false);
    }
  };

  const loginWithGitHub = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        }
      });
      if (error) throw error;
    } catch (error: any) {
      console.error("GitHub login error:", error);
      toast.error(error.message || "GitHub login failed");
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/calendar-integration`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      console.error("Google login error:", error);
      toast.error(error.message || "Google login failed");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      toast.success("Logged out successfully!");
    } catch (error: any) {
      toast.error(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    isLoading: loading,
    isInitialized,
    login,
    signup,
    logout,
    loginWithMicrosoft,
    loginWithGitHub,
    loginWithGoogle,
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!mounted) return;
            
            console.log("Auth state changed:", event, session?.user?.email);
            setSession(session);
            setUser(session?.user ?? null);
            
            if (event === 'SIGNED_IN' && session?.user) {
              // Handle user profile creation/update after sign in
              setTimeout(() => {
                handleUserProfile(session.user);
              }, 0);
            }
          }
        );

        // Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          
          if (initialSession?.user) {
            handleUserProfile(initialSession.user);
          }
        }

        return subscription;
      } catch (error) {
        console.error("Auth initialization error:", error);
        if (mounted) {
          setUser(null);
          setSession(null);
        }
        return null;
      } finally {
        if (mounted) {
          setLoading(false);
          setIsInitialized(true);
        }
      }
    };

    const subscriptionPromise = initializeAuth();

    return () => {
      mounted = false;
      subscriptionPromise.then((subscription) => {
        subscription?.unsubscribe();
      });
    };
  }, []);

  return (
    <AuthContext.Provider value={value}>
      {!loading || isInitialized ? children : <div>Loading...</div>}
    </AuthContext.Provider>
  );
};

export { AuthProvider };
