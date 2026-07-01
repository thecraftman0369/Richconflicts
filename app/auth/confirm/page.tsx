'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/app/supabase/client'

export default function ConfirmPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const supabase = createClient()

    const run = async () => {
      const params = new URLSearchParams(window.location.search)
      const code       = params.get('code')
      const token_hash = params.get('token_hash')
      const type       = params.get('type') as 'signup' | 'recovery' | null

      try {
        if (code) {
          // PKCE flow — exchange code for session
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        } else if (token_hash && type) {
          // Token-hash flow
          const { error } = await supabase.auth.verifyOtp({ token_hash, type })
          if (error) throw error
        } else {
          // Implicit/hash flow — supabase-js auto-handles tokens in the URL hash;
          // just check if there's already a valid session after the redirect
          const { data } = await supabase.auth.getSession()
          if (!data.session) throw new Error('No confirmation token found.')
        }

        setStatus('success')
        setTimeout(() => router.push('/dashboard'), 1500)
      } catch (err: unknown) {
        setStatus('error')
        setErrorMsg(err instanceof Error ? err.message : 'Confirmation failed.')
      }
    }

    run()
  }, [router])

  return (
    <div className="pt-14 min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-sm text-center">
        {status === 'verifying' && (
          <>
            <div className="w-6 h-6 border border-white/30 border-t-white rounded-full animate-spin mx-auto mb-6" />
            <p className="font-mono text-[10px] tracking-[0.22em] text-rc-muted">CONFIRMING YOUR ACCOUNT...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <p className="font-display text-6xl text-white mb-4">✓</p>
            <p className="font-mono text-[10px] tracking-[0.22em] text-white mb-2">EMAIL CONFIRMED.</p>
            <p className="font-mono text-[11px] text-zinc-400">Taking you to your dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <p className="font-display text-5xl text-white mb-4">!</p>
            <p className="font-mono text-[10px] tracking-[0.22em] text-white mb-3">CONFIRMATION FAILED.</p>
            <p className="font-mono text-[11px] text-zinc-400 mb-8">{errorMsg}</p>
            <Link
              href="/auth/login"
              className="inline-block font-mono text-[10px] tracking-[0.22em] border border-rc-border text-white px-6 py-3 rounded-sm hover:border-zinc-500 transition-colors"
            >
              BACK TO SIGN IN
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
