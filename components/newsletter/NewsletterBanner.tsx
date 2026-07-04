'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { createClient } from '@/app/supabase/client'

export default function NewsletterBanner() {
  const [email,     setEmail]     = useState('')
  const [status,    setStatus]    = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg,  setErrorMsg]  = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    setErrorMsg('')

    const supabase = createClient()
    const { error } = await supabase
      .from('newsletter_subscribers')
      .upsert({ email: email.trim().toLowerCase() }, { onConflict: 'email', ignoreDuplicates: true })

    if (error) {
      setStatus('error')
      setErrorMsg('Something went wrong. Try again.')
      return
    }

    setStatus('done')
  }

  return (
    <section className="border-b border-rc-border bg-rc-subtle">
      <div className="max-w-[1600px] mx-auto px-5 py-14 md:py-20">
        <div className="max-w-2xl">
          <p className="font-mono text-[9px] tracking-[0.32em] text-rc-muted mb-3">EARLY ACCESS</p>

          <h2 className="font-display leading-none text-white mb-4"
            style={{ fontSize: 'clamp(2.8rem, 7vw, 6rem)' }}>
            GET THE DROP<br />
            <span className="text-stroke">FIRST.</span>
          </h2>

          <p className="font-mono text-[11px] text-zinc-400 leading-relaxed mb-8 max-w-md">
            Drop alerts 24 hours before anyone else. No spam, no noise — just the drop.
          </p>

          <AnimatePresence mode="wait">
            {status === 'done' ? (
              <motion.p
                key="done"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-mono text-[10px] text-white tracking-[0.18em]"
              >
                ✓ YOU'RE ON THE LIST. WE'LL BE IN TOUCH.
              </motion.p>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-2 max-w-sm"
              >
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  disabled={status === 'loading'}
                  className="flex-1 bg-transparent border border-rc-border rounded-sm px-4 h-11 font-mono text-[11px] text-white placeholder:text-rc-muted focus:outline-none focus:border-zinc-500 transition-colors disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="shrink-0 h-11 px-5 bg-white text-black font-mono text-[10px] tracking-[0.2em] rounded-sm hover:bg-zinc-100 transition-colors disabled:opacity-60 flex items-center gap-2"
                >
                  {status === 'loading' ? 'JOINING...' : (
                    <><span>JOIN</span><ArrowRight size={10} /></>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {status === 'error' && (
            <p className="font-mono text-[9px] text-red-400/80 mt-2 tracking-[0.1em]">{errorMsg}</p>
          )}
        </div>
      </div>
    </section>
  )
}
