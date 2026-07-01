import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/* Server-only client — bypasses RLS when service role key is set.
   Never import this from client components. */
export const supabaseAdmin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})
