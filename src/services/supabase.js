import { createClient } from '@supabase/supabase-js'

// Embed user's Supabase credentials directly
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uwuxauetmaqardjlbluw.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3dXhhdWV0bWFxYXJkamxibHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4Mzc3NzgsImV4cCI6MjEwMjQxMzc3OH0.D0JigRnOzxQwDGHWICkV04wKxXyEasy06sInvkAtz8M'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Configured state is always true now since we have default embedded keys
export const isSupabaseConfigured = () => {
  return true
}
