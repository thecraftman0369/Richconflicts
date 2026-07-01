'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

type Props = {
  heading?: string
  subheading?: string
  compact?: boolean
}

export default function Newsletter({
  heading = 'GET ON THE LIST.',
  subheading = 'Drop alerts before anyone else. No noise.',
  compact = false,
}: Props) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    /* TODO: wire to Supabase or email provider */
    await new Promise((r) => setTimeout(r, 800))
    setStatus('done')
  }

  if (compact) {
    return (
      <div className="border border-rc-border rounded-sm p-4">
        <p className="font-mono text-[10px] tracking-[0.2em] text-white mb-3">{heading}</p>
        {status === 'done' ? (
          <p className="font-mono text-[10px] text-white tracking-[0.15em]">
            ✓ YOU'RE ON THE LIST.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="EMAIL"
              required
              className="flex-1 bg-transparent border border-rc-border rounded-sm px-3 h-9 font-mono text-[10px] text-white placeholder:text-rc-muted focus:outline-none focus:border-zinc-500 transition-colors tracking-[0.1em] min-w-0"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="shrink-0 h-9 px-3 bg-white text-black font-mono text-[9px] tracking-[0.18em] rounded-sm hover:bg-zinc-100 transition-colors disabled:opacity-60"
            >
              {status === 'loading' ? '...' : 'JOIN'}
            </button>
          </form>
        )}
      </div>
    )
  }

  return (
    <section className="border-t border-rc-border py-16 md:py-20">
      <div className="max-w-[1600px] mx-auto px-5">
        <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
          <div>
            <p className="font-mono text-[9px] tracking-[0.32em] text-rc-muted mb-3">
              EARLY ACCESS
            </p>
            <h2 className="font-display text-[clamp(2.2rem,5vw,4.5rem)] text-white leading-none mb-4">
              {heading}
              <br />
              <span className="text-stroke">FIRST.</span>
            </h2>
            <p className="font-mono text-[11px] text-zinc-400 leading-relaxed">{subheading}</p>
          </div>

          <div>
            {status === 'done' ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-rc-border rounded-sm p-6"
              >
                <p className="font-mono text-[10px] text-white tracking-[0.2em]">
                  ✓ YOU'RE ON THE LIST. WE'LL BE IN TOUCH.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full bg-transparent border border-rc-border rounded-sm px-4 h-12 font-mono text-[11px] text-white placeholder:text-rc-muted focus:outline-none focus:border-zinc-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full h-12 bg-white text-black font-mono text-[10px] tracking-[0.22em] rounded-sm hover:bg-zinc-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {status === 'loading' ? 'SUBMITTING...' : (
                    <>JOIN THE DROP LIST <ArrowRight size={10} /></>
                  )}
                </button>
                <p className="font-mono text-[8px] text-rc-muted tracking-[0.08em]">
                  No spam. No partner brand BS. Just drops.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
