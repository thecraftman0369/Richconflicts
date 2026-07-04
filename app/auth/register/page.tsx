'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/app/supabase/client'

export default function RegisterPage() {
  const [form, setForm]     = useState({ email: '', password: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'done'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const update = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirm) {
      setStatus('error')
      setErrorMsg('PASSWORDS DO NOT MATCH.')
      return
    }
    setStatus('loading')
    setErrorMsg('')

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    })

    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
      return
    }

    // Auto-subscribe to newsletter — silent, never blocks registration
    await supabase
      .from('newsletter_subscribers')
      .upsert(
        { email: form.email.trim().toLowerCase(), user_id: data.user?.id ?? null },
        { onConflict: 'email', ignoreDuplicates: true }
      )

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
          <h2 className="font-display text-3xl text-white mb-3">ACCOUNT CREATED.</h2>
          <p className="font-mono text-[11px] text-zinc-400 leading-relaxed mb-8">
            Check your email to confirm your address, then sign in.
          </p>
          <Link
            href="/auth/login"
            className="inline-block font-mono text-[10px] tracking-[0.22em] bg-white text-black px-6 py-3 rounded-sm hover:bg-zinc-100 transition-colors"
          >
            SIGN IN
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
          <p className="font-mono text-[9px] tracking-[0.3em] text-rc-muted mb-2">NEW MEMBER</p>
          <h1 className="font-display text-4xl text-white">CREATE ACCOUNT</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block font-mono text-[9px] tracking-[0.2em] text-rc-muted mb-1.5">EMAIL</label>
            <input
              type="email"
              value={form.email}
              onChange={update('email')}
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
                value={form.password}
                onChange={update('password')}
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
            <label className="block font-mono text-[9px] tracking-[0.2em] text-rc-muted mb-1.5">CONFIRM PASSWORD</label>
            <input
              type={showPw ? 'text' : 'password'}
              value={form.confirm}
              onChange={update('confirm')}
              required
              autoComplete="new-password"
              placeholder="Re-enter password"
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
            {status === 'loading' ? 'CREATING...' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <p className="mt-4 font-mono text-[9px] text-rc-muted tracking-[0.08em] leading-relaxed">
          By creating an account you agree to our{' '}
          <Link href="/terms" className="text-white underline underline-offset-2">Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-white underline underline-offset-2">Privacy Policy</Link>.
        </p>

        <div className="mt-8 pt-6 border-t border-rc-border">
          <Link href="/auth/login" className="font-mono text-[9px] text-rc-muted hover:text-white transition-colors tracking-[0.12em]">
            ALREADY HAVE AN ACCOUNT? SIGN IN →
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
