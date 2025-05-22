

// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  let message = "Supabase URL or anon key is missing. ";
  if (import.meta.env.DEV) { // Only show detailed message in local development
    message += "Did you forget to create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY? You can copy .env.example to .env and fill in your credentials.";
  } else {
    message += "Check your hosting provider's environment variable settings.";
  }
  throw new Error(message);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)