'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

/* ─── Data ─── */
const POSTS = [
  {
    slug: 'death-of-clean-aesthetic',
    category: 'CULTURE',
    date: 'JUN 12, 2026',
    readTime: '6 MIN',
    title: 'The Death of the Clean Aesthetic',
    excerpt:
      'Why raw, imperfect design is the only honest language left in streetwear. An exploration of anti-polish in graphic subculture.',
    featured: true,
  },
  {
    slug: 'how-we-build-a-drop',
    category: 'PROCESS',
    date: 'MAY 28, 2026',
    readTime: '4 MIN',
    title: 'How We Build a Drop',
    excerpt:
      'From concept sketch to cut and sew — a look inside the RC production cycle.',
    featured: false,
  },
  {
    slug: 'the-100-percent-cotton-argument',
    category: 'MATERIAL',
    date: 'MAY 10, 2026',
    readTime: '5 MIN',
    title: 'The 100% Cotton Argument',
    excerpt:
      'Why we refuse to cut corners on fabric, and what that actually means for your wardrobe long-term.',
    featured: false,
  },
  {
    slug: 'raf-simons-and-the-underground',
    category: 'REFERENCE',
    date: 'APR 22, 2026',
    readTime: '8 MIN',
    title: 'Raf Simons and the Underground Condition',
    excerpt:
      'What the early Raf archives tell us about building a brand on the margins.',
    featured: false,
  },
  {
    slug: 'screen-print-vs-dtg',
    category: 'PROCESS',
    date: 'APR 5, 2026',
    readTime: '3 MIN',
    title: 'Screen Print vs DTG: No Contest',
    excerpt:
      "We test both methods across 100 washes. The results are exactly what you'd expect.",
    featured: false,
  },
]

/* ─── Page ─── */
export default function BlogPage() {
  const featured = POSTS.find((p) => p.featured)!
  const rest = POSTS.filter((p) => !p.featured)

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
            <p className="font-mono text-[9px] tracking-[0.32em] text-rc-muted mb-2">DISPATCHES</p>
            <h1 className="font-display text-display-lg text-white">FIELD NOTES</h1>
          </motion.div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-5 py-10">

        {/* ═══════════════════════ FEATURED ═══════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.48 }}
          className="mb-8"
        >
          <Link
            href={`/blog/${featured.slug}`}
            className="group block border border-rc-border rounded-md overflow-hidden hover:border-zinc-600 transition-colors"
          >
            <div className="grid md:grid-cols-2">
              {/* Image placeholder */}
              <div className="aspect-[16/9] md:aspect-auto md:min-h-[320px] bg-zinc-900 relative">
                <div className="absolute inset-0 flex items-center justify-center select-none">
                  <span className="font-display text-[7rem] text-zinc-800">RC</span>
                </div>
                <div className="absolute top-4 left-4">
                  <span className="font-mono text-[8px] tracking-[0.22em] bg-white text-black px-2 py-0.5 rounded-sm">
                    FEATURED
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-7 md:p-10 flex flex-col justify-between border-t md:border-t-0 md:border-l border-rc-border">
                <div>
                  <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mb-5">
                    <span className="font-mono text-[9px] tracking-[0.22em] text-rc-muted">
                      {featured.category}
                    </span>
                    <span className="w-0.5 h-0.5 bg-rc-muted rounded-full" />
                    <span className="font-mono text-[9px] tracking-[0.22em] text-rc-muted">
                      {featured.date}
                    </span>
                    <span className="w-0.5 h-0.5 bg-rc-muted rounded-full" />
                    <span className="font-mono text-[9px] tracking-[0.22em] text-rc-muted">
                      {featured.readTime}
                    </span>
                  </div>

                  <h2 className="font-display text-[2.2rem] md:text-[2.8rem] text-white leading-none mb-4 group-hover:text-white/75 transition-colors">
                    {featured.title}
                  </h2>

                  <p className="font-mono text-[11px] text-zinc-400 leading-[1.75]">
                    {featured.excerpt}
                  </p>
                </div>

                <div className="mt-8 flex items-center gap-2 font-mono text-[9px] tracking-[0.22em] text-white group-hover:text-white/60 transition-colors">
                  READ ARTICLE <ArrowRight size={9} />
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* ═══════════════════════ ARTICLE GRID ═══════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {rest.map((post, i) => (
            <motion.article
              key={post.slug}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.4 }}
            >
              <Link
                href={`/blog/${post.slug}`}
                className="group flex flex-col border border-rc-border rounded-md overflow-hidden hover:border-zinc-600 transition-colors h-full"
              >
                {/* Image placeholder */}
                <div className="aspect-[16/7] bg-zinc-900 relative shrink-0">
                  <div className="absolute inset-0 flex items-center justify-center select-none">
                    <span className="font-mono text-[9px] tracking-[0.3em] text-zinc-700">
                      {post.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mb-3">
                    <span className="font-mono text-[9px] tracking-[0.18em] text-rc-muted">
                      {post.category}
                    </span>
                    <span className="w-0.5 h-0.5 bg-rc-muted rounded-full" />
                    <span className="font-mono text-[9px] tracking-[0.18em] text-rc-muted">
                      {post.date}
                    </span>
                    <span className="w-0.5 h-0.5 bg-rc-muted rounded-full" />
                    <span className="font-mono text-[9px] tracking-[0.18em] text-rc-muted">
                      {post.readTime}
                    </span>
                  </div>

                  <h3 className="font-display text-xl text-white group-hover:text-white/70 transition-colors leading-tight mb-2">
                    {post.title}
                  </h3>

                  <p className="font-mono text-[10px] text-zinc-500 leading-relaxed flex-1">
                    {post.excerpt}
                  </p>

                  <div className="mt-4 flex items-center gap-1.5 font-mono text-[9px] text-rc-muted group-hover:text-white transition-colors tracking-[0.18em]">
                    READ <ArrowRight size={8} />
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </div>
  )
}
