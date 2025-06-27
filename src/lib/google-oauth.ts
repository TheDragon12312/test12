// Google OAuth Configuration (Legacy - for backward compatibility)
// This file exists for backward compatibility but Google OAuth has been removed from the app

export const GOOGLE_CONFIG = {
  clientId: "demo-google-client-id",
  clientSecret: "demo-google-secret",
  redirectUri: `${window.location.origin}/auth/google/callback`,
  scope: "openid profile email",
};

export interface GoogleProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
  expires_at?: number;
}

class GoogleOAuthService {
  private readonly STORAGE_KEY = "google_oauth_tokens";
  private readonly CONNECTION_KEY = "google_connected";

  // Legacy method - always returns null since Google OAuth is removed
  async signIn(): Promise<{
    profile: GoogleProfile;
    tokens: GoogleTokens;
  } | null> {
    console.warn(
      "Google OAuth has been removed from FocusFlow. Please use email or GitHub authentication.",
    );
    return null;
  }

  // Legacy method - no-op
  async signOut(): Promise<void> {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.CONNECTION_KEY);
  }

  // Legacy method - always returns null
  async getValidAccessToken(): Promise<string | null> {
    return null;
  }

  // Legacy method - always returns false
  isSignedIn(): boolean {
    return false;
  }

  // Legacy method - always returns false
  isConnected(): boolean {
    return false;
  }
}

export const googleOAuth = new GoogleOAuthService();

// Make it available globally for debugging
(window as any).googleOAuth = googleOAuth;
