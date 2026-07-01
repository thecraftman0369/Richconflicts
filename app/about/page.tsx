import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Rich Conflicts is an independent underground streetwear label built on serious construction, graphic subculture, and zero compromises.',
}

const VALUES = [
  {
    label: 'MATERIAL FIRST',
    body: '300gsm minimum on every tee. 400gsm on outerwear. We pay the premium so you don\'t wear the compromise.',
  },
  {
    label: 'NO RESTOCKS',
    body: 'Every unit is the last unit. When it\'s gone, it\'s gone. This isn\'t scarcity theatre — it\'s how we stay focused.',
  },
  {
    label: 'MADE IN PORTUGAL',
    body: 'We\'ve worked with the same factory in Porto since day one. They know us by now. That matters.',
  },
  {
    label: 'SCREEN PRINT ONLY',
    body: 'No DTG. No sublimation. Screen print ages the way clothes are supposed to age — with character.',
  },
]

export default function AboutPage() {
  return (
    <div className="pt-14">

      {/* ═══════════════════════ HEADER ═══════════════════════ */}
      <div className="border-b border-rc-border">
        <div className="max-w-[1600px] mx-auto px-5 py-10 md:py-14">
          <p className="font-mono text-[9px] tracking-[0.32em] text-rc-muted mb-2">THE LABEL</p>
          <h1 className="font-display text-display-lg text-white">ABOUT</h1>
        </div>
      </div>

      {/* ═══════════════════════ MANIFESTO ═══════════════════════ */}
      <section className="border-b border-rc-border">
        <div className="max-w-[1600px] mx-auto grid md:grid-cols-2">
          {/* Left: big text */}
          <div className="p-8 md:p-14 border-b md:border-b-0 md:border-r border-rc-border flex flex-col justify-center">
            <p className="font-display text-[clamp(2.2rem,5vw,4.5rem)] text-white leading-[0.95] mb-6">
              WE EXIST IN THE OVERLAP BETWEEN
              <br />
              <span className="text-stroke"> CONTRADICTION</span>
              <br />
              AND CRAFT.
            </p>
            <p className="font-mono text-[10px] text-rc-muted tracking-[0.18em]">
              — RICH CONFLICTS, EST. MMXXIV
            </p>
          </div>

          {/* Right: body copy */}
          <div className="p-8 md:p-14 flex flex-col justify-center">
            <div className="space-y-5 max-w-md">
              <p className="font-mono text-[12px] text-zinc-300 leading-[1.85]">
                Rich Conflicts is a London-based independent streetwear label. We make clothes
                for people who've thought too hard about what they wear.
              </p>
              <p className="font-mono text-[12px] text-zinc-400 leading-[1.85]">
                The name came first. The contradiction built everything around it. We dress in
                conflict — between the underground and the mainstream, between craft and
                subculture, between restraint and noise.
              </p>
              <p className="font-mono text-[12px] text-zinc-400 leading-[1.85]">
                Every piece we release is built to outlast the season it launched in. We don't
                do trends. We do opinions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ VALUES GRID ═══════════════════════ */}
      <section className="border-b border-rc-border">
        <div className="max-w-[1600px] mx-auto px-5 py-12">
          <p className="font-mono text-[9px] tracking-[0.3em] text-rc-muted mb-8">PRINCIPLES</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {VALUES.map((v, i) => (
              <div
                key={v.label}
                className="border border-rc-border rounded-sm p-6"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <p className="font-mono text-[9px] tracking-[0.22em] text-white mb-4">
                  {String(i + 1).padStart(2, '0')} — {v.label}
                </p>
                <p className="font-mono text-[11px] text-zinc-400 leading-[1.8]">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ PRODUCTION ═══════════════════════ */}
      <section className="border-b border-rc-border">
        <div className="max-w-[1600px] mx-auto px-5 py-12 md:py-16">
          <div className="grid md:grid-cols-[1fr_480px] gap-8 md:gap-16 items-center">
            <div>
              <p className="font-mono text-[9px] tracking-[0.3em] text-rc-muted mb-4">
                HOW WE BUILD
              </p>
              <h2 className="font-display text-[clamp(2rem,5vw,4rem)] text-white leading-none mb-6">
                THE PROCESS
              </h2>
              <div className="space-y-4">
                {[
                  'Concept to sketch on paper — no digital shortcuts in the early phase.',
                  'Fabric sourced from our mill in Porto. 300gsm minimum. Non-negotiable.',
                  'Three sample rounds before we cut a full run. Sometimes seven.',
                  'Specialty screen printing at a North London facility with 30+ years of experience.',
                  '48-hour drop window. No restocks. No exceptions.',
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <span className="font-mono text-[9px] text-rc-muted mt-0.5 shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p className="font-mono text-[11px] text-zinc-400 leading-[1.7]">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Image placeholder */}
            <div className="aspect-square bg-zinc-900 rounded-sm border border-rc-border flex items-center justify-center select-none">
              <span className="font-display text-[8rem] text-zinc-800">RC</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ CONTACT ═══════════════════════ */}
      <section className="py-12 md:py-16">
        <div className="max-w-[1600px] mx-auto px-5">
          <div className="grid md:grid-cols-2 gap-8 md:gap-16">
            <div>
              <p className="font-mono text-[9px] tracking-[0.3em] text-rc-muted mb-4">CONTACT</p>
              <div className="space-y-3">
                {[
                  { label: 'GENERAL', value: 'hello@richconflicts.com' },
                  { label: 'PRESS', value: 'press@richconflicts.com' },
                  { label: 'STOCKIST', value: 'trade@richconflicts.com' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center gap-4">
                    <span className="font-mono text-[9px] text-rc-muted tracking-[0.18em] w-20 shrink-0">
                      {label}
                    </span>
                    <a
                      href={`mailto:${value}`}
                      className="font-mono text-[11px] text-white hover:text-white/60 transition-colors"
                    >
                      {value}
                    </a>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="font-mono text-[9px] tracking-[0.3em] text-rc-muted mb-4">
                READY TO SHOP?
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center gap-3 border border-white text-white font-mono text-[10px] tracking-[0.22em] px-6 py-3 rounded-sm hover:bg-white hover:text-black transition-all"
              >
                VIEW ALL PRODUCTS <ArrowRight size={10} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
