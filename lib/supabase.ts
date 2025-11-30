import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dcirvexmyhpjqavnigre.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjaXJ2ZXhteWhwanFhdm5pZ3JlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MDEwMTksImV4cCI6MjA4MDA3NzAxOX0.LO4YpxMI9l1IgQhF6HOaXk0dXYlpMtEVxZ8n5xpA6yc";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  grade: string;
  created_at: string;
  updated_at: string;
}

export interface SubjectProgress {
  id: string;
  user_id: string;
  subject: string;
  current_chapter: string;
  confidence_level: number;
  stuck_points: string | null;
  status: string;
  mastery_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  id: string;
  user_id: string;
  total_xp: number;
  current_level: number;
  streak_count: number;
  concepts_mastered: number;
  last_activity: string;
  created_at: string;
  updated_at: string;
}
