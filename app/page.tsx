'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import ProductCard from '@/components/product/ProductCard'
import NewsletterBanner from '@/components/newsletter/NewsletterBanner'
import { createClient } from '@/app/supabase/client'
import type { Product } from '@/app/lib/types'

type DBProduct = {
  id: string; name: string; description: string | null; price: number
  original_price: number | null; category: string | null; categories: string[] | null
  images: string[] | null; image_url: string | null; sizes: string[] | null
  stock: number | null; slug: string | null; featured: boolean | null; is_new: boolean | null
}

function toProduct(p: DBProduct): Product {
  const images = p.images?.length ? p.images : (p.image_url ? [p.image_url] : [])
  return {
    id: p.id, name: p.name, description: p.description ?? undefined, price: p.price,
    originalPrice: p.original_price ?? undefined, category: p.category ?? 'uncategorized',
    categories: p.categories ?? (p.category ? [p.category] : []), images,
    sizes: p.sizes ?? ['XS','S','M','L','XL'], stock: p.stock ?? 0,
    slug: p.slug ?? undefined, featured: p.featured ?? false, isNew: p.is_new ?? false,
  }
}

const BLOG_PREVIEWS = [
  {
    slug: 'death-of-clean-aesthetic',
    category: 'CULTURE',
    date: 'JUN 2026',
    title: 'The Death of the Clean Aesthetic',
    excerpt: 'Why raw, imperfect design is the only honest language left in streetwear.',
  },
  {
    slug: 'how-we-build-a-drop',
    category: 'PROCESS',
    date: 'MAY 2026',
    title: 'How We Build a Drop',
    excerpt: 'From concept sketch to cut and sew — inside the RC production cycle.',
  },
]

const TICKER = ['RICH CONFLICTS', 'UNDERGROUND', 'SS26', 'NO RESTOCKS', 'LIMITED RUNS', 'EST. MMXXIV']

/* ─── Page ─── */
export default function HomePage() {
  const supabase = createClient()
  const [featured,  setFeatured]  = useState<Product[]>([])
  const [allCount,  setAllCount]  = useState(0)
  const [setsCount, setSetsCount] = useState(0)

  useEffect(() => {
    supabase.from('products').select('*').then(({ data }) => {
      const all = (data ?? []) as DBProduct[]
      const products = all.map(toProduct)
      setAllCount(products.length)
      setSetsCount(products.filter(p => p.category === 'sweatsuits' || p.categories?.includes('sweatsuits')).length)
      const feat = products.filter(p => p.isNew || p.featured).slice(0, 4)
      setFeatured(feat.length ? feat : products.slice(0, 4))
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const COLLECTIONS = [
    { name: 'ALL PRODUCTS', slug: '',          sub: 'Every current drop',          count: allCount },
    { name: 'SETS',         slug: 'sweatsuits', sub: 'Sweatsuits & matching sets', count: setsCount },
  ]

  return (
    <div className="pt-14">

      {/* ═══════════════════════ HERO ═══════════════════════ */}
      <section className="relative min-h-[calc(100vh-56px)] flex flex-col justify-between border-b border-rc-border overflow-hidden px-6 md:px-14 py-12">

        {/* Background RC watermark */}
        <span
          aria-hidden
          className="pointer-events-none select-none absolute right-[-4vw] top-1/2 -translate-y-1/2 font-display leading-none text-zinc-900"
          style={{ fontSize: 'clamp(14rem, 38vw, 44rem)' }}
        >
          RC
        </span>

        {/* Season label */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="font-mono text-[10px] tracking-[0.3em] text-rc-muted relative z-10"
        >
          SS26 — UNDERGROUND COLLECTION
        </motion.p>

        {/* Main headline */}
        <div className="relative z-10 my-auto py-16">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="font-display leading-none text-white"
            style={{ fontSize: 'clamp(5rem, 16vw, 18rem)' }}
          >
            RICH
          </motion.h1>
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="font-display leading-none text-stroke"
            style={{ fontSize: 'clamp(5rem, 16vw, 18rem)' }}
          >
            CONFLICTS
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="font-mono text-[10px] text-rc-muted tracking-[0.22em] mt-6"
          >
            GRAPHIC SUBCULTURE APPAREL
          </motion.p>
        </div>

        {/* CTA row */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.52, duration: 0.38 }}
          className="relative z-10 flex items-center gap-6"
        >
          <Link
            href="/shop"
            className="inline-flex items-center gap-3 border border-white text-white font-mono text-[10px] tracking-[0.22em] px-6 py-3 rounded-sm hover:bg-white hover:text-black transition-all duration-200"
          >
            SHOP THE DROP
            <ArrowRight size={11} strokeWidth={1.5} />
          </Link>
          <a
            href="#newsletter"
            className="font-mono text-[10px] text-rc-muted tracking-[0.22em] hover:text-white transition-colors"
          >
            JOIN THE LIST
          </a>
        </motion.div>
      </section>

      {/* ═══════════════════════ TICKER ═══════════════════════ */}
      <div className="border-b border-rc-border overflow-hidden py-3 bg-rc-subtle">
        <motion.div
          animate={{ x: [0, '-50%'] }}
          transition={{ repeat: Infinity, duration: 22, ease: 'linear' }}
          className="flex gap-12 whitespace-nowrap w-max"
        >
          {[...TICKER, ...TICKER].map((item, i) => (
            <span key={i} className="font-mono text-[9px] tracking-[0.35em] text-rc-muted">
              {item}
            </span>
          ))}
        </motion.div>
      </div>

      {/* ═══════════════════════ NEW ARRIVALS ═══════════════════════ */}
      <section className="py-14 border-b border-rc-border">
        <div className="max-w-[1600px] mx-auto px-5">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="font-mono text-[9px] tracking-[0.3em] text-rc-muted mb-1.5">JUST DROPPED</p>
              <h2 className="font-display text-display-md text-white">NEW ARRIVALS</h2>
            </div>
            <Link
              href="/shop"
              className="font-mono text-[9px] tracking-[0.2em] text-rc-muted hover:text-white transition-colors flex items-center gap-1.5"
            >
              VIEW ALL <ArrowRight size={9} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
            {featured.length > 0
              ? featured.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)
              : Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-white/[0.03] rounded-sm animate-pulse" />
                ))
            }
          </div>
        </div>
      </section>

      {/* ═══════════════════════ EDITORIAL PULL QUOTE ═══════════════════════ */}
      <section className="py-20 md:py-28 border-b border-rc-border">
        <div className="max-w-[1600px] mx-auto px-5">
          <motion.p
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7 }}
            className="font-display text-[clamp(2.2rem,6.5vw,6rem)] leading-[0.92] text-white max-w-5xl"
          >
            "DRESSED IN CONTRADICTION,
            <br />
            <span className="text-stroke">BUILT FOR THE OVERLAP."</span>
          </motion.p>
          <p className="font-mono text-[10px] text-rc-muted tracking-[0.2em] mt-7">
            — RICH CONFLICTS, SS26 LOOKBOOK
          </p>
        </div>
      </section>

      {/* ═══════════════════════ COLLECTIONS ═══════════════════════ */}
      <section className="py-14 border-b border-rc-border">
        <div className="max-w-[1600px] mx-auto px-5">
          <div className="mb-8">
            <p className="font-mono text-[9px] tracking-[0.3em] text-rc-muted mb-1.5">BROWSE BY</p>
            <h2 className="font-display text-display-md text-white">COLLECTIONS</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {COLLECTIONS.map((col, i) => (
              <motion.div
                key={col.name}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.45 }}
                className="flex-1"
              >
                <Link
                  href={col.slug ? `/shop?category=${col.slug}` : '/shop'}
                  className="group flex items-center justify-between border border-rc-border rounded-sm px-6 py-5 hover:border-zinc-600 transition-colors"
                >
                  <div>
                    <p className="font-display text-3xl text-white">{col.name}</p>
                    <p className="font-mono text-[9px] text-rc-muted mt-1">{col.sub}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="font-mono text-[9px] text-rc-muted">{col.count} ITEMS</p>
                    <ArrowRight size={11} className="text-rc-muted group-hover:text-white transition-colors" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ NEWSLETTER ═══════════════════════ */}
      <div id="newsletter">
        <NewsletterBanner />
      </div>

      {/* ═══════════════════════ BLOG PREVIEW ═══════════════════════ */}
      <section className="py-14">
        <div className="max-w-[1600px] mx-auto px-5">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="font-mono text-[9px] tracking-[0.3em] text-rc-muted mb-1.5">DISPATCHES</p>
              <h2 className="font-display text-display-md text-white">FIELD NOTES</h2>
            </div>
            <Link
              href="/blog"
              className="font-mono text-[9px] tracking-[0.2em] text-rc-muted hover:text-white transition-colors flex items-center gap-1.5"
            >
              ALL POSTS <ArrowRight size={9} />
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {BLOG_PREVIEWS.map((post, i) => (
              <motion.article
                key={post.slug}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.45 }}
                className="flex-1"
              >
                <Link
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col border border-rc-border rounded-sm overflow-hidden hover:border-zinc-600 transition-colors h-full"
                >
                  <div className="aspect-[16/7] bg-zinc-900 relative">
                    <div className="absolute inset-0 flex items-center justify-center select-none">
                      <span className="font-mono text-[9px] tracking-[0.35em] text-zinc-700">{post.category}</span>
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-mono text-[9px] tracking-[0.2em] text-rc-muted">{post.category}</span>
                      <span className="w-0.5 h-0.5 bg-rc-muted rounded-full" />
                      <span className="font-mono text-[9px] tracking-[0.2em] text-rc-muted">{post.date}</span>
                    </div>
                    <h3 className="font-display text-2xl text-white group-hover:text-white/70 transition-colors mb-2 leading-tight">
                      {post.title}
                    </h3>
                    <p className="font-mono text-[11px] text-rc-muted leading-relaxed">{post.excerpt}</p>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
