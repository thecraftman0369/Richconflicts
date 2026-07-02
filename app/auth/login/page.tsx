'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/app/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [status, setStatus]     = useState<'idle' | 'loading' | 'error' | 'unconfirmed' | 'resent'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        setStatus('unconfirmed')
      } else {
        setStatus('error')
        setErrorMsg(error.message)
      }
      return
    }

    const isAdmin = data.user?.app_metadata?.role === 'master_admin'
    router.push(isAdmin ? '/rc-admin-2024' : '/dashboard')
    router.refresh()
  }

  const resendConfirmation = async () => {
    const supabase = createClient()
    await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    })
    setStatus('resent')
  }

  return (
    <div className="pt-14 min-h-screen flex items-center justify-center px-5 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <Link href="/" className="block font-display text-5xl text-white mb-10 hover:opacity-60 transition-opacity">
          RC
        </Link>

        <div className="mb-8">
          <p className="font-mono text-[9px] tracking-[0.3em] text-rc-muted mb-2">WELCOME BACK</p>
          <h1 className="font-display text-5xl text-white">SIGN IN</h1>
        </div>

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

          <div>
            <label className="block font-mono text-[9px] tracking-[0.2em] text-rc-muted mb-1.5">PASSWORD</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
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

          <AnimatePresence mode="wait">
            {status === 'error' && (
              <motion.p
                key="error"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="font-mono text-[9px] text-red-400/80 tracking-[0.1em]"
              >
                {errorMsg}
              </motion.p>
            )}

            {status === 'unconfirmed' && (
              <motion.div
                key="unconfirmed"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="border border-zinc-700 rounded-sm p-4 space-y-2"
              >
                <p className="font-mono text-[9px] text-white tracking-[0.1em]">EMAIL NOT CONFIRMED.</p>
                <p className="font-mono text-[10px] text-zinc-400 leading-relaxed">
                  Check your inbox for the confirmation email, or resend it below.
                </p>
                <button
                  type="button"
                  onClick={resendConfirmation}
                  className="font-mono text-[9px] text-white underline underline-offset-2 hover:opacity-60 transition-opacity tracking-[0.1em]"
                >
                  RESEND CONFIRMATION EMAIL
                </button>
              </motion.div>
            )}

            {status === 'resent' && (
              <motion.p
                key="resent"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="font-mono text-[9px] text-white/60 tracking-[0.1em]"
              >
                CONFIRMATION EMAIL SENT. CHECK YOUR INBOX.
              </motion.p>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full h-14 bg-white text-black font-mono text-[11px] tracking-[0.22em] rounded-sm hover:bg-zinc-100 transition-colors disabled:opacity-60 mt-2"
          >
            {status === 'loading' ? 'SIGNING IN...' : 'SIGN IN'}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between">
          <Link href="/auth/register" className="font-mono text-[9px] text-rc-muted hover:text-white transition-colors tracking-[0.12em]">
            CREATE ACCOUNT
          </Link>
          <Link href="/auth/forgot" className="font-mono text-[9px] text-rc-muted hover:text-white transition-colors tracking-[0.12em]">
            FORGOT PASSWORD?
          </Link>
        </div>

        <div className="mt-10 pt-8 border-t border-rc-border">
          <Link href="/shop" className="font-mono text-[9px] text-rc-muted hover:text-white transition-colors tracking-[0.12em]">
            ← CONTINUE AS GUEST
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
