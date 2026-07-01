'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

export default function ContactPage() {
  const [form, setForm]     = useState({ name: '', email: '', subject: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  const update = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    /* Wire to your email provider or Supabase edge function when ready */
    await new Promise((r) => setTimeout(r, 800))
    setStatus('done')
  }

  const inputClass = "w-full bg-transparent border border-rc-border rounded-sm px-4 h-11 font-mono text-[11px] text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-500 transition-colors"
  const labelClass = "block font-mono text-[9px] tracking-[0.2em] text-rc-muted mb-1.5"

  return (
    <div className="pt-14 min-h-screen">
      <div className="max-w-[900px] mx-auto px-5 py-14">
        <p className="font-mono text-[9px] tracking-[0.3em] text-rc-muted mb-2">GET IN TOUCH</p>
        <h1 className="font-display text-display-md text-white mb-4">CONTACT</h1>
        <p className="font-mono text-[11px] text-zinc-400 leading-relaxed mb-10 max-w-lg">
          For order issues, sizing queries, or general enquiries. We aim to respond within 48 hours.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10">

          {/* Form */}
          {status === 'done' ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-16 text-center"
            >
              <p className="font-display text-5xl text-white mb-4">✓</p>
              <p className="font-mono text-[10px] tracking-[0.22em] text-white mb-2">MESSAGE SENT.</p>
              <p className="font-mono text-[11px] text-zinc-400">We'll be in touch within 48 hours.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Name</label>
                  <input type="text" value={form.name} onChange={update('name')} required placeholder="Your name" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input type="email" value={form.email} onChange={update('email')} required placeholder="your@email.com" className={inputClass} autoComplete="email" />
                </div>
              </div>

              <div>
                <label className={labelClass}>Subject</label>
                <div className="relative">
                  <select
                    value={form.subject}
                    onChange={update('subject')}
                    required
                    className="w-full appearance-none bg-black border border-rc-border rounded-sm px-4 h-11 font-mono text-[11px] text-white focus:outline-none focus:border-zinc-500 transition-colors pr-10"
                  >
                    <option value="" disabled>Select a subject</option>
                    <option>Order enquiry</option>
                    <option>Return / refund</option>
                    <option>Sizing help</option>
                    <option>Shipping question</option>
                    <option>General enquiry</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Message</label>
                <textarea
                  value={form.message}
                  onChange={update('message')}
                  required
                  rows={5}
                  placeholder="Tell us how we can help…"
                  className="w-full bg-transparent border border-rc-border rounded-sm px-4 py-3 font-mono text-[11px] text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-500 transition-colors resize-none leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="h-12 px-8 bg-white text-black font-mono text-[10px] tracking-[0.22em] rounded-sm hover:bg-zinc-100 transition-colors disabled:opacity-60"
              >
                {status === 'loading' ? 'SENDING...' : 'SEND MESSAGE'}
              </button>
            </form>
          )}

          {/* Sidebar */}
          <div className="space-y-6 font-mono text-[11px] text-zinc-400">
            <div>
              <p className="text-[9px] tracking-[0.22em] text-rc-muted mb-2">RESPONSE TIME</p>
              <p>Within 48 hours, Mon–Fri.</p>
            </div>
            <div>
              <p className="text-[9px] tracking-[0.22em] text-rc-muted mb-2">EMAIL</p>
              <a href="mailto:support@richconflicts.com" className="text-white hover:opacity-60 transition-opacity">
                support@richconflicts.com
              </a>
            </div>
            <div>
              <p className="text-[9px] tracking-[0.22em] text-rc-muted mb-2">ORDER ISSUES</p>
              <p>For faster support on orders, use the Returns/Refund button on your order in your account dashboard.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
