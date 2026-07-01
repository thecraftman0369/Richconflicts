'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Lock } from 'lucide-react'

/* ─── Data ─── */
const NEXT_DROP_DATE = new Date('2026-07-15T12:00:00Z')

const UPCOMING = [
  {
    id: 'drop-002',
    name: 'DROP 002 — SIGNAL SERIES',
    date: 'JULY 15, 2026',
    time: '12:00 GMT',
    pieces: 6,
    teaser: 'Noise-print longsleeves and a heavyweight cargo cut. Built for overlap.',
    status: 'upcoming' as const,
  },
  {
    id: 'drop-003',
    name: 'DROP 003 — STATIC ARCHIVE',
    date: 'AUG 09, 2026',
    time: '12:00 GMT',
    pieces: 4,
    teaser: 'TBA. Sign up for early access.',
    status: 'tba' as const,
  },
]

const PAST_DROPS = [
  {
    id: 'drop-001',
    name: 'DROP 001 — ARCHIVE SERIES',
    date: 'MAY 01, 2026',
    pieces: 5,
    soldOut: true,
    slug: '/shop',
  },
  {
    id: 'drop-000',
    name: 'DROP 000 — CONFLICT ORIGIN',
    date: 'FEB 14, 2026',
    pieces: 3,
    soldOut: true,
    slug: '/shop',
  },
]

/* ─── Countdown hook ─── */
type TimeLeft = { days: number; hours: number; minutes: number; seconds: number }

function useCountdown(target: Date): TimeLeft {
  const calc = (): TimeLeft => {
    const diff = target.getTime() - Date.now()
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    }
  }

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calc)

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(calc()), 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return timeLeft
}

function Pad(n: number) {
  return String(n).padStart(2, '0')
}

/* ─── Page ─── */
export default function DropsPage() {
  const timeLeft = useCountdown(NEXT_DROP_DATE)
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setSubmitted(true)
  }

  return (
    <div className="pt-14">

      {/* ═══════════════════════ HEADER ═══════════════════════ */}
      <div className="border-b border-rc-border">
        <div className="max-w-[1600px] mx-auto px-5 py-10 md:py-14">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42 }}
          >
            <p className="font-mono text-[9px] tracking-[0.32em] text-rc-muted mb-2">SCHEDULE</p>
            <h1 className="font-display text-display-lg text-white">DROPS</h1>
          </motion.div>
        </div>
      </div>

      {/* ═══════════════════════ COUNTDOWN ═══════════════════════ */}
      <section className="border-b border-rc-border">
        <div className="max-w-[1600px] mx-auto px-5 py-12 md:py-16">
          <p className="font-mono text-[9px] tracking-[0.3em] text-rc-muted mb-8">NEXT DROP IN</p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-4 gap-3 md:gap-6 max-w-2xl mb-8"
          >
            {[
              { label: 'DAYS', value: timeLeft.days },
              { label: 'HRS', value: timeLeft.hours },
              { label: 'MIN', value: timeLeft.minutes },
              { label: 'SEC', value: timeLeft.seconds },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="border border-rc-border rounded-sm p-4 md:p-6 text-center"
              >
                <p className="font-display text-[clamp(2.5rem,8vw,6rem)] text-white leading-none tabular-nums">
                  {Pad(value)}
                </p>
                <p className="font-mono text-[8px] tracking-[0.28em] text-rc-muted mt-2">
                  {label}
                </p>
              </div>
            ))}
          </motion.div>

          <div className="border border-rc-border rounded-sm p-5 max-w-2xl">
            <p className="font-mono text-[10px] text-white tracking-[0.15em] mb-1">
              DROP 002 — SIGNAL SERIES
            </p>
            <p className="font-mono text-[10px] text-rc-muted mb-1">JULY 15, 2026 · 12:00 GMT</p>
            <p className="font-mono text-[10px] text-rc-muted leading-relaxed">
              Noise-print longsleeves and a heavyweight cargo cut. 6 pieces total. No restocks.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ UPCOMING DROPS ═══════════════════════ */}
      <section className="border-b border-rc-border">
        <div className="max-w-[1600px] mx-auto px-5 py-12">
          <p className="font-mono text-[9px] tracking-[0.3em] text-rc-muted mb-6">UPCOMING</p>

          <div className="space-y-2">
            {UPCOMING.map((drop, i) => (
              <motion.div
                key={drop.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.4 }}
                className="border border-rc-border rounded-sm p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-zinc-600 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-display text-xl text-white">{drop.name}</p>
                    {drop.status === 'tba' && (
                      <span className="flex items-center gap-1 font-mono text-[8px] text-rc-muted border border-rc-border px-2 py-0.5 rounded-sm tracking-[0.15em]">
                        <Lock size={8} />
                        TBA
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-[9px] text-rc-muted tracking-[0.12em] mb-1.5">
                    {drop.date} · {drop.time} · {drop.pieces} PIECES
                  </p>
                  <p className="font-mono text-[10px] text-zinc-500 leading-relaxed">
                    {drop.teaser}
                  </p>
                </div>

                {drop.status === 'upcoming' && (
                  <Link
                    href={`/shop`}
                    className="shrink-0 inline-flex items-center gap-2 border border-white text-white font-mono text-[9px] tracking-[0.2em] px-4 py-2.5 rounded-sm hover:bg-white hover:text-black transition-all"
                  >
                    NOTIFY ME <ArrowRight size={9} />
                  </Link>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ EMAIL SIGNUP ═══════════════════════ */}
      <section className="border-b border-rc-border">
        <div className="max-w-[1600px] mx-auto px-5 py-12 md:py-16">
          <div className="max-w-xl">
            <p className="font-mono text-[9px] tracking-[0.3em] text-rc-muted mb-3">EARLY ACCESS</p>
            <h2 className="font-display text-[2.5rem] md:text-[3.5rem] text-white leading-none mb-4">
              GET THE DROP
              <br />
              <span className="text-stroke">FIRST.</span>
            </h2>
            <p className="font-mono text-[11px] text-zinc-400 leading-relaxed mb-7">
              Join the list. Drop alerts 24 hours before anyone else.
              No spam, no brand partnerships, no noise.
            </p>

            {submitted ? (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-mono text-[10px] text-white tracking-[0.18em]"
              >
                ✓ YOU'RE ON THE LIST. WE'LL BE IN TOUCH.
              </motion.p>
            ) : (
              <form onSubmit={handleSignup} className="flex gap-2 max-w-sm">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="flex-1 bg-transparent border border-rc-border rounded-sm px-4 h-11 font-mono text-[11px] text-white placeholder:text-rc-muted focus:outline-none focus:border-zinc-500 transition-colors"
                />
                <button
                  type="submit"
                  className="shrink-0 h-11 px-5 bg-white text-black font-mono text-[10px] tracking-[0.2em] rounded-sm hover:bg-zinc-100 transition-colors"
                >
                  JOIN
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ DROP ARCHIVE ═══════════════════════ */}
      <section className="py-12">
        <div className="max-w-[1600px] mx-auto px-5">
          <p className="font-mono text-[9px] tracking-[0.3em] text-rc-muted mb-6">ARCHIVE</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PAST_DROPS.map((drop, i) => (
              <motion.div
                key={drop.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.4 }}
              >
                <Link
                  href={drop.slug}
                  className="group block border border-rc-border rounded-md overflow-hidden hover:border-zinc-600 transition-colors"
                >
                  <div className="aspect-[16/7] bg-zinc-900 relative">
                    <div className="absolute inset-0 flex items-center justify-center select-none">
                      <span className="font-display text-[5rem] text-zinc-800">{drop.id.split('-')[1]?.toUpperCase()}</span>
                    </div>
                    {drop.soldOut && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="font-mono text-[9px] tracking-[0.3em] text-white/30">
                          SOLD OUT
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex items-center justify-between border-t border-rc-border">
                    <div>
                      <p className="font-display text-lg text-white">{drop.name}</p>
                      <p className="font-mono text-[9px] text-rc-muted mt-0.5 tracking-[0.1em]">
                        {drop.date} · {drop.pieces} PIECES
                      </p>
                    </div>
                    <ArrowRight
                      size={11}
                      className="text-rc-muted group-hover:text-white transition-colors"
                    />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
