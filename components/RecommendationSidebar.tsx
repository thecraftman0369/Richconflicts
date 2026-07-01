'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap, ArrowUpRight } from 'lucide-react'
import { useProductTracker, type ScoredProduct } from '@/app/lib/useProductTracker'
import { useCart } from '@/app/lib/CartContext'
import { createClient } from '@/app/supabase/client'

type DBProduct = {
  id: string
  slug: string | null
  name: string
  price: number
  category: string | null
  categories: string[] | null
  images: string[] | null
  image_url: string | null
  is_new: boolean | null
  stock: number | null
}

type CatalogEntry = Omit<ScoredProduct, 'score' | 'reason'> & { imageUrl?: string }

type Props = {
  currentProductId: string
  currentSlug: string
  autoOpenDelay?: number
}

function ProductRow({
  product,
  index,
  onNavigate,
}: {
  product: ScoredProduct & { imageUrl?: string }
  index: number
  onNavigate: () => void
}) {
  return (
    <motion.li
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
      className="border-b border-rc-border last:border-b-0"
    >
      <Link
        href={`/product/${product.slug}`}
        onClick={onNavigate}
        className="group flex gap-4 p-4 hover:bg-white/[0.025] transition-colors"
      >
        {/* Product image */}
        <div className="relative w-[56px] h-[70px] bg-zinc-900 border border-rc-border rounded-sm shrink-0 overflow-hidden group-hover:border-zinc-600 transition-colors">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              sizes="56px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-display text-base text-zinc-700">RC</span>
            </div>
          )}
          {product.isNew && (
            <span className="absolute top-0.5 left-0.5 font-mono text-[6px] bg-white text-black px-1 py-px rounded-sm tracking-[0.1em]">
              NEW
            </span>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-px">
          <div>
            <div className="flex items-start justify-between gap-2">
              <p className="font-mono text-[10px] text-white leading-snug group-hover:text-white/60 transition-colors truncate">
                {product.name}
              </p>
              <ArrowUpRight
                size={10}
                className="text-rc-muted group-hover:text-white transition-colors shrink-0 mt-0.5"
              />
            </div>
            <p className="font-mono text-[8px] text-rc-muted tracking-[0.14em] mt-0.5">
              {product.category}
            </p>
          </div>

          <div className="flex items-center justify-between mt-2">
            <p className="font-mono text-[11px] text-white">
              ${product.price}
              {product.isSoldOut && (
                <span className="ml-1.5 text-[8px] text-rc-muted tracking-[0.1em]">SOLD OUT</span>
              )}
            </p>
            <p className="font-mono text-[8px] text-zinc-600 leading-relaxed text-right max-w-[100px] truncate">
              {product.reason}
            </p>
          </div>
        </div>
      </Link>
    </motion.li>
  )
}

export default function RecommendationSidebar({
  currentProductId,
  currentSlug,
  autoOpenDelay = 5000,
}: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [catalog, setCatalog] = useState<CatalogEntry[]>([])
  const { getRecommendations, hasHistory } = useProductTracker()
  const { items } = useCart()

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('products')
      .select('id, slug, name, price, category, categories, images, image_url, is_new, stock')
      .then(({ data }) => {
        if (!data) return
        const entries: CatalogEntry[] = (data as DBProduct[]).map(p => ({
          id:       p.id,
          slug:     p.slug ?? p.id,
          name:     p.name,
          price:    p.price,
          category: (p.category ?? 'UNCATEGORIZED').toUpperCase(),
          tags:     p.categories ?? [],
          isNew:    p.is_new ?? false,
          isSoldOut: (p.stock ?? 1) === 0,
          imageUrl: p.images?.[0] ?? p.image_url ?? undefined,
        }))
        setCatalog(entries)
      })
  }, [])

  const excludeIds: string[] = [
    currentProductId,
    currentSlug,
    ...items.flatMap((i) => [i.productId, i.slug]),
  ]

  const recommendations = getRecommendations(excludeIds, 5, catalog.length > 0 ? catalog : undefined) as (ScoredProduct & { imageUrl?: string })[]

  // Attach imageUrl from catalog to each scored product
  const enriched = recommendations.map(r => {
    const entry = catalog.find(c => c.id === r.id || c.slug === r.slug)
    return { ...r, imageUrl: entry?.imageUrl }
  })

  useEffect(() => {
    if (!autoOpenDelay || !hasHistory || enriched.length === 0) return
    const t = setTimeout(() => setIsOpen(true), autoOpenDelay)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!hasHistory || enriched.length === 0) return null

  return (
    <>
      {/* Left-edge trigger tab */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="tab"
            initial={{ x: -48, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -48, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            onClick={() => setIsOpen(true)}
            aria-label="Open recommendations"
            className="fixed left-0 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-2 bg-black border border-l-0 border-rc-border rounded-r-sm px-2 py-4 hover:bg-white/5 transition-colors group"
          >
            <Zap size={11} strokeWidth={1.8} className="text-white group-hover:text-white/60 transition-colors" />
            <span
              className="font-mono text-[8px] tracking-[0.22em] text-white/70 group-hover:text-white/40 transition-colors select-none"
              style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}
            >
              FOR YOU · {enriched.length}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Panel + backdrop */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/55"
            />

            <motion.aside
              key="panel"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
              className="fixed left-0 top-0 bottom-0 z-50 w-full max-w-[340px] bg-black border-r border-rc-border flex flex-col"
            >
              <div className="shrink-0 flex items-center justify-between h-14 px-5 border-b border-rc-border">
                <div className="flex items-center gap-2.5">
                  <Zap size={11} strokeWidth={1.8} className="text-white" />
                  <p className="font-mono text-[10px] tracking-[0.22em] text-white">FOR YOU</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Close recommendations"
                  className="p-1 text-rc-muted hover:text-white transition-colors"
                >
                  <X size={14} strokeWidth={1.5} />
                </button>
              </div>

              <div className="shrink-0 px-5 py-2.5 border-b border-rc-border">
                <p className="font-mono text-[8px] text-rc-muted tracking-[0.18em]">
                  RECOMMENDED BASED ON YOUR BROWSING
                </p>
              </div>

              <ul className="flex-1 overflow-y-auto scrollbar-none">
                {enriched.map((product, i) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    index={i}
                    onNavigate={() => setIsOpen(false)}
                  />
                ))}
              </ul>

              <div className="shrink-0 border-t border-rc-border p-4 space-y-2">
                <Link
                  href="/shop"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center w-full h-10 border border-rc-border text-white font-mono text-[9px] tracking-[0.22em] rounded-sm hover:border-zinc-500 hover:bg-white/[0.025] transition-colors"
                >
                  VIEW ALL PRODUCTS
                </Link>
                <p className="font-mono text-[7px] text-zinc-700 text-center tracking-[0.1em]">
                  BASED ON YOUR BROWSING · NEVER SHARED
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
