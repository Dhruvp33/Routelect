import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const SUPABASE_KEY  = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

// Diagnostic Logging (visible in browser F12 Console)
if (!SUPABASE_URL) {
  console.warn('❌ [Supabase] VITE_SUPABASE_URL is MISSING or EMPTY in the current build.')
}
if (!SUPABASE_KEY) {
  console.warn('❌ [Supabase] VITE_SUPABASE_ANON_KEY is MISSING or EMPTY in the current build.')
}

export const supabase = (SUPABASE_URL && SUPABASE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null

if (!supabase) {
  console.error('⚠️ [Auth-Init] SDK will not initialize: Missing required environment variables.')
} else {
  console.log('✅ [Supabase] Client initialized successfully.')
}