import { createClient as _create } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gfkbfouhlctmmlgehbgt.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2Jmb3VobGN0bW1sZ2VoYmd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NDA3OTAsImV4cCI6MjA5MDExNjc5MH0.XfHDzfzEmEyrHRD18-i781Jrh4HXPidDX74sgCw7glg'

const _supabase = _create(supabaseUrl, supabaseAnonKey)

export const supabase = _supabase

/** Factory alias — returns the singleton; lets components call createClient() */
export const createClient = () => _supabase
