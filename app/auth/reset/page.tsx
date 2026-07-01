'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/app/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [ready, setReady]       = useState(false)  // true once code is exchanged
  const [status, setStatus]     = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  /* Establish a live session from the reset link before showing the form.
   * Supabase's default client uses the implicit flow, which puts tokens in
   * the URL hash (#access_token=...&type=recovery) and fires a
   * PASSWORD_RECOVERY auth event once the client parses it — it does NOT
   * use a ?code= query param. We listen for that event, but also handle
   * the PKCE ?code= case and an already-active session as fallbacks. */
  useEffect(() => {
    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setReady(true)
      }
    })

    const code = new URLSearchParams(window.location.search).get('code')

    const init = async () => {
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          setStatus('error')
          setErrorMsg('This reset link has expired. Please request a new one.')
        } else {
          setReady(true)
        }
        return
      }

      // Give the implicit-flow hash a moment to be parsed and fire PASSWORD_RECOVERY
      await new Promise((r) => setTimeout(r, 600))
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        setReady(true)
      } else {
        setStatus((s) => (s === 'idle' ? 'error' : s))
        setErrorMsg((m) => m || 'Invalid or expired reset link. Please request a new one.')
      }
    }

    init()

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setStatus('error')
      setErrorMsg('PASSWORDS DO NOT MATCH.')
      return
    }
    setStatus('loading')
    setErrorMsg('')

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
      return
    }

    setStatus('done')
    setTimeout(() => router.push('/auth/login'), 2000)
  }

  if (status === 'done') {
    return (
      <div className="pt-14 min-h-screen flex items-center justify-center px-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm text-center"
        >
          <p className="font-display text-6xl text-white mb-4">✓</p>
          <h2 className="font-display text-3xl text-white mb-3">PASSWORD UPDATED.</h2>
          <p className="font-mono text-[11px] text-zinc-400 leading-relaxed mb-8">
            Your password has been changed. Redirecting you to sign in...
          </p>
          <Link
            href="/auth/login"
            className="inline-block font-mono text-[10px] tracking-[0.22em] bg-white text-black px-6 py-3 rounded-sm hover:bg-zinc-100 transition-colors"
          >
            SIGN IN NOW
          </Link>
        </motion.div>
      </div>
    )
  }

  /* Show error if code was invalid / expired */
  if (status === 'error' && !ready) {
    return (
      <div className="pt-14 min-h-screen flex items-center justify-center px-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm text-center"
        >
          <p className="font-display text-5xl text-white mb-4">!</p>
          <p className="font-mono text-[10px] tracking-[0.22em] text-white mb-3">LINK INVALID.</p>
          <p className="font-mono text-[11px] text-zinc-400 mb-8">{errorMsg}</p>
          <Link
            href="/auth/forgot"
            className="inline-block font-mono text-[10px] tracking-[0.22em] bg-white text-black px-6 py-3 rounded-sm hover:bg-zinc-100 transition-colors"
          >
            REQUEST NEW LINK
          </Link>
        </motion.div>
      </div>
    )
  }

  /* Waiting for code exchange */
  if (!ready) {
    return (
      <div className="pt-14 min-h-screen flex items-center justify-center px-5">
        <div className="text-center">
          <div className="w-6 h-6 border border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="font-mono text-[10px] tracking-[0.22em] text-rc-muted">VERIFYING LINK...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-14 min-h-screen flex items-center justify-center px-5">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <Link href="/" className="block font-display text-4xl text-white mb-10 hover:opacity-60 transition-opacity">
          RC
        </Link>

        <div className="mb-8">
          <p className="font-mono text-[9px] tracking-[0.3em] text-rc-muted mb-2">ACCOUNT RECOVERY</p>
          <h1 className="font-display text-4xl text-white">NEW PASSWORD</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block font-mono text-[9px] tracking-[0.2em] text-rc-muted mb-1.5">NEW PASSWORD</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                className="w-full bg-transparent border border-rc-border rounded-sm px-4 pr-12 h-11 font-mono text-[11px] text-white placeholder:text-rc-muted focus:outline-none focus:border-zinc-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-rc-muted hover:text-white transition-colors"
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block font-mono text-[9px] tracking-[0.2em] text-rc-muted mb-1.5">CONFIRM NEW PASSWORD</label>
            <input
              type={showPw ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="Re-enter new password"
              className="w-full bg-transparent border border-rc-border rounded-sm px-4 h-11 font-mono text-[11px] text-white placeholder:text-rc-muted focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>

          {status === 'error' && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-mono text-[9px] text-red-400/80 tracking-[0.1em]"
            >
              {errorMsg}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full h-12 bg-white text-black font-mono text-[10px] tracking-[0.22em] rounded-sm hover:bg-zinc-100 transition-colors disabled:opacity-60 mt-2"
          >
            {status === 'loading' ? 'UPDATING...' : 'UPDATE PASSWORD'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
