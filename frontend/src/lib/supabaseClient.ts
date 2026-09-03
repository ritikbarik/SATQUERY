import { createClient } from "@supabase/supabase-js";

// Fallback dummy credentials to prevent crashes if .env is missing or unconfigured
const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  envUrl && 
  envKey && 
  envUrl !== "your-supabase-url" && 
  !envUrl.includes("placeholder")
);

const supabaseUrl = isSupabaseConfigured ? envUrl : "https://placeholder-project.supabase.co";
const supabaseAnonKey = isSupabaseConfigured ? envKey : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
