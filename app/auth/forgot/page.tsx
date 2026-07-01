'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/app/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [status, setStatus]   = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    })

    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
      return
    }

    setStatus('done')
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
          <h2 className="font-display text-3xl text-white mb-3">CHECK YOUR EMAIL.</h2>
          <p className="font-mono text-[11px] text-zinc-400 leading-relaxed mb-8">
            We sent a password reset link to <span className="text-white">{email}</span>.
            Check your inbox and follow the link to set a new password.
          </p>
          <Link
            href="/auth/login"
            className="inline-block font-mono text-[10px] tracking-[0.22em] border border-rc-border text-white px-6 py-3 rounded-sm hover:border-zinc-500 transition-colors"
          >
            BACK TO SIGN IN
          </Link>
        </motion.div>
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
          <h1 className="font-display text-4xl text-white">RESET PASSWORD</h1>
        </div>

        <p className="font-mono text-[11px] text-zinc-400 leading-relaxed mb-6">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block font-mono text-[9px] tracking-[0.2em] text-rc-muted mb-1.5">EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="your@email.com"
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
            {status === 'loading' ? 'SENDING...' : 'SEND RESET LINK'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-rc-border">
          <Link href="/auth/login" className="font-mono text-[9px] text-rc-muted hover:text-white transition-colors tracking-[0.12em]">
            ← BACK TO SIGN IN
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
