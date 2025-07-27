import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'placeholder-key'

if (supabaseUrl === 'https://placeholder.supabase.co') {
  console.warn('⚠️ Supabase not configured. Please update .env file with your Supabase credentials.')
}

export const supabase = createClient(supabaseUrl, supabaseKey)