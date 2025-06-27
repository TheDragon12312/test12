
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          avatar_url?: string;
          created_at: string;
          updated_at: string;
          subscription_type?: string;
          team_id?: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          avatar_url?: string;
          created_at?: string;
          updated_at?: string;
          subscription_type?: string;
          team_id?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          avatar_url?: string;
          created_at?: string;
          updated_at?: string;
          subscription_type?: string;
          team_id?: string;
        };
      };
      daily_stats: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          focus_score: number;
          completed_focus_blocks: number;
          total_focus_time: number;
          distraction_count: number;
          distraction_time: number;
          mood_rating?: number;
          mood_notes?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          focus_score?: number;
          completed_focus_blocks?: number;
          total_focus_time?: number;
          distraction_count?: number;
          distraction_time?: number;
          mood_rating?: number;
          mood_notes?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          focus_score?: number;
          completed_focus_blocks?: number;
          total_focus_time?: number;
          distraction_count?: number;
          distraction_time?: number;
          mood_rating?: number;
          mood_notes?: string;
          created_at?: string;
        };
      };
    };
  };
}
