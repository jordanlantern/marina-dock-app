// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pgabnmxuaogzrysnhcof.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnYWJubXh1YW9nenJ5c25oY29mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MDY5NjYsImV4cCI6MjA2MzM4Mjk2Nn0.hJWFj4_cUfJBH5a5tAQRqjKfDdfP7wL0hVmP4yQWXQg';

if (!supabaseUrl || !supabaseAnonKey) {
  // This first check is still good to ensure they are not empty
  throw new Error("Supabase URL or anon key is missing or empty. Check your supabaseClient.ts file.");
}

// The problematic warning 'if' block has been removed.

export const supabase = createClient(supabaseUrl, supabaseAnonKey)