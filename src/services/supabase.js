import { createClient } from '@supabase/supabase-js'

// Get keys from localStorage or environment variables
const supabaseUrl = localStorage.getItem('supabase_url') || import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = localStorage.getItem('supabase_anon_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Export the client (fallback to placeholders if completely missing to prevent runtime crash on import)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
)

// Helper to check if keys are configured
export const isSupabaseConfigured = () => {
  return !!(localStorage.getItem('supabase_url') || import.meta.env.VITE_SUPABASE_URL) &&
         !!(localStorage.getItem('supabase_anon_key') || import.meta.env.VITE_SUPABASE_ANON_KEY)
}
