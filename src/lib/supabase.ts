import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wlzftftdbivdcnaubqny.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_aWUqk0RB7n_5-IOsZeeOOw_vLaG6gBP'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    detectSessionInUrl: true, // Crucial for capturing the session after OAuth redirect
    persistSession: true,
    autoRefreshToken: true
  }
})

// Test connection on load
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('Supabase connection error:', error.message)
  } else {
    console.log('Supabase connected. Session:', data.session ? 'YES' : 'NO')
  }
})