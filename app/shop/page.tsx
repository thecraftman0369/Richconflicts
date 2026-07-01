'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { SlidersHorizontal, ChevronDown, X } from 'lucide-react'
import ProductCard from '@/components/product/ProductCard'
import { createClient } from '@/app/supabase/client'
import type { Product } from '@/app/lib/types'

const SORT_OPTIONS = [
  { label: 'NEW ARRIVALS', value: 'new' },
  { label: 'PRICE: LOW → HIGH', value: 'price-asc' },
  { label: 'PRICE: HIGH → LOW', value: 'price-desc' },
  { label: 'A → Z', value: 'alpha' },
]

type DBProduct = {
  id: string
  name: string
  description: string | null
  price: number
  original_price: number | null
  category: string | null
  categories: string[] | null
  images: string[] | null
  image_url: string | null
  sizes: string[] | null
  stock: number | null
  slug: string | null
  featured: boolean | null
  is_new: boolean | null
  created_at: string
}

function toProduct(p: DBProduct): Product {
  const images = p.images?.length ? p.images : (p.image_url ? [p.image_url] : [])
  return {
    id:            p.id,
    name:          p.name,
    description:   p.description ?? undefined,
    price:         p.price,
    originalPrice: p.original_price ?? undefined,
    category:      p.category ?? 'uncategorized',
    categories:    p.categories ?? (p.category ? [p.category] : []),
    images,
    sizes:         p.sizes ?? ['XS', 'S', 'M', 'L', 'XL'],
    stock:         p.stock ?? 0,
    slug:          p.slug ?? undefined,
    featured:      p.featured ?? false,
    isNew:         p.is_new ?? false,
  }
}

export default function ShopPage() {
  const supabase     = createClient()
  const searchParams = useSearchParams()

  const [dbProducts,     setDbProducts]     = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [activeCategory, setActiveCategory] = useState('ALL')
  const [sortValue,      setSortValue]      = useState('new')
  const [sortOpen,       setSortOpen]       = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)

  // Fetch products from Supabase
  useEffect(() => {
    supabase.from('products').select('*').then(({ data }) => {
      setDbProducts((data ?? []).map(p => toProduct(p as DBProduct)))
      setLoadingProducts(false)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Derive category labels from DB products
  const CATEGORY_LABELS = useMemo(() => {
    const seen = new Set<string>()
    const out: string[] = []
    dbProducts.forEach(p => {
      const cats = p.categories?.length ? p.categories : [p.category]
      cats.forEach(c => {
        if (c && !seen.has(c)) { seen.add(c); out.push(c.toUpperCase().replace(/-/g, ' ')) }
      })
    })
    return out
  }, [dbProducts])

  // Pick up ?category= from URL
  useEffect(() => {
    const raw = searchParams.get('category')
    if (!raw) return
    const label = raw.toUpperCase().replace(/-/g, ' ')
    setActiveCategory(label)
  }, [searchParams, CATEGORY_LABELS])

  // Close sort dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = useMemo(() => {
    if (activeCategory === 'ALL') return dbProducts
    const raw = activeCategory.toLowerCase().replace(/\s+/g, '-')
    return dbProducts.filter(p => p.category === raw || p.categories?.includes(raw))
  }, [activeCategory, dbProducts])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortValue === 'price-asc')  return a.price - b.price
      if (sortValue === 'price-desc') return b.price - a.price
      if (sortValue === 'alpha')      return a.name.localeCompare(b.name)
      return 0
    })
  }, [filtered, sortValue])

  const activeSortLabel = SORT_OPTIONS.find(o => o.value === sortValue)?.label ?? 'NEW ARRIVALS'

  return (
    <div className="pt-14">

      {/* ═══════════════════════ STICKY FILTER BAR ═══════════════════════ */}
      <div className="sticky top-14 z-30 bg-black/96 backdrop-blur-sm border-b border-rc-border">
        <div className="max-w-[1600px] mx-auto px-5 h-12 flex items-center justify-between gap-4">

          {/* Category pills */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            <SlidersHorizontal size={11} className="text-rc-muted shrink-0 mr-2" />
            <button
              onClick={() => setActiveCategory('ALL')}
              className={`shrink-0 font-mono text-[9px] tracking-[0.18em] px-3 py-1.5 rounded-sm transition-all duration-150 ${
                activeCategory === 'ALL' ? 'bg-white text-black' : 'text-rc-muted hover:text-white'
              }`}
            >
              ALL
            </button>
            {CATEGORY_LABELS.map(label => (
              <button
                key={label}
                onClick={() => setActiveCategory(label)}
                className={`shrink-0 font-mono text-[9px] tracking-[0.18em] px-3 py-1.5 rounded-sm transition-all duration-150 ${
                  activeCategory === label ? 'bg-white text-black' : 'text-rc-muted hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Sort dropdown */}
          <div className="relative shrink-0" ref={sortRef}>
            <button
              onClick={() => setSortOpen(v => !v)}
              className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.18em] text-rc-muted hover:text-white transition-colors"
            >
              {activeSortLabel}
              <ChevronDown size={9} className={`transition-transform duration-200 ${sortOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {sortOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-52 bg-zinc-950 border border-rc-border rounded-sm overflow-hidden shadow-2xl z-50"
                >
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setSortValue(opt.value); setSortOpen(false) }}
                      className={`w-full text-left px-4 py-2.5 font-mono text-[9px] tracking-[0.18em] hover:bg-white/5 transition-colors ${
                        sortValue === opt.value ? 'text-white' : 'text-rc-muted'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ═══════════════════════ PAGE HEADER ═══════════════════════ */}
      <div className="max-w-[1600px] mx-auto px-5 pt-10 pb-7 border-b border-rc-border">
        <div className="flex items-end justify-between">
          <div>
            <motion.h1
              key={activeCategory}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="font-display text-display-lg text-white"
            >
              {activeCategory === 'ALL' ? 'ALL PRODUCTS' : activeCategory}
            </motion.h1>
            <p className="font-mono text-[9px] text-rc-muted mt-1 tracking-[0.1em]">
              {loadingProducts ? '—' : `${sorted.length} ITEM${sorted.length !== 1 ? 'S' : ''}`}
            </p>
          </div>
          {activeCategory !== 'ALL' && (
            <button
              onClick={() => setActiveCategory('ALL')}
              className="flex items-center gap-1.5 font-mono text-[9px] text-rc-muted hover:text-white transition-colors tracking-[0.15em]"
            >
              <X size={9} />
              CLEAR FILTER
            </button>
          )}
        </div>
      </div>

      {/* ═══════════════════════ PRODUCT GRID ═══════════════════════ */}
      <div className="max-w-[1600px] mx-auto px-5 py-8">
        {loadingProducts ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-white/[0.03] rounded-sm animate-pulse" />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {sorted.length > 0 ? (
              <motion.div
                key={activeCategory + sortValue}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5"
              >
                {sorted.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-32 text-center"
              >
                <p className="font-mono text-[11px] text-rc-muted tracking-[0.2em]">
                  NO ITEMS IN THIS CATEGORY.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
