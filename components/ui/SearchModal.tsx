'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Search, X, ArrowRight } from 'lucide-react'
import { useSearch } from '@/app/lib/SearchContext'

/* Flat search index — mirrors shop page products */
const SEARCH_INDEX = [
  { id: '1',  slug: 'conflict-tee-001',  name: 'CONFLICT TEE 001',  price: 68,  category: 'TEES' },
  { id: '4',  slug: 'static-longsleeve', name: 'STATIC L/S',        price: 78,  category: 'LONGSLEEVES' },
  { id: '5',  slug: 'conflict-tee-002',  name: 'CONFLICT TEE 002',  price: 68,  category: 'TEES' },
  { id: '7',  slug: 'blank-tee-white',   name: 'BLANK TEE WHITE',   price: 48,  category: 'TEES' },
]

const QUICK_LINKS = [
  { label: 'NEW ARRIVALS', href: '/shop?sort=new' },
  { label: 'TEES',         href: '/shop?category=tees' },
  { label: 'HOODIES',      href: '/shop?category=hoodies' },
  { label: 'SWEATSUITS',   href: '/shop?category=sweatsuits' },
]

export default function SearchModal() {
  const { isOpen, query, setQuery, close } = useSearch()
  const inputRef = useRef<HTMLInputElement>(null)

  /* Focus input when modal opens */
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50)
  }, [isOpen])

  /* Escape key closes */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [close])

  /* Lock body scroll */
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const results = query.trim().length > 1
    ? SEARCH_INDEX.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.category.toLowerCase().includes(query.toLowerCase())
      )
    : []

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] bg-black/98 flex flex-col"
        >
          {/* Search input bar */}
          <div className="border-b border-rc-border">
            <div className="max-w-[1600px] mx-auto px-5 h-14 flex items-center gap-4">
              <Search size={16} className="text-rc-muted shrink-0" strokeWidth={1.5} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="SEARCH PRODUCTS..."
                className="flex-1 bg-transparent font-mono text-[13px] text-white placeholder:text-rc-muted focus:outline-none tracking-[0.1em]"
              />
              <button
                onClick={close}
                className="shrink-0 p-1 text-rc-muted hover:text-white transition-colors"
                aria-label="Close search"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Results area */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-[1600px] mx-auto px-5 py-8">
              {query.trim().length > 1 ? (
                /* Search results */
                <div>
                  <p className="font-mono text-[9px] tracking-[0.3em] text-rc-muted mb-6">
                    {results.length} RESULT{results.length !== 1 ? 'S' : ''} FOR "{query.toUpperCase()}"
                  </p>

                  {results.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {results.map((product, i) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                        >
                          <Link
                            href={`/product/${product.slug}`}
                            onClick={close}
                            className="group block"
                          >
                            <div className="aspect-[3/4] bg-zinc-900 border border-rc-border rounded-sm flex items-center justify-center mb-3 group-hover:border-zinc-600 transition-colors">
                              <span className="font-display text-4xl text-zinc-800">RC</span>
                            </div>
                            <p className="font-mono text-[11px] text-white group-hover:text-white/60 transition-colors">
                              {product.name}
                            </p>
                            <p className="font-mono text-[9px] text-rc-muted mt-0.5">
                              {product.category} · ${product.price}
                            </p>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-16 text-center">
                      <p className="font-mono text-[11px] text-rc-muted tracking-[0.2em]">
                        NO RESULTS. TRY A DIFFERENT TERM.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* Quick links */
                <div>
                  <p className="font-mono text-[9px] tracking-[0.3em] text-rc-muted mb-6">
                    QUICK LINKS
                  </p>
                  <div className="flex flex-col gap-1 max-w-sm">
                    {QUICK_LINKS.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={close}
                        className="group flex items-center justify-between py-3 border-b border-rc-border hover:border-zinc-600 transition-colors"
                      >
                        <span className="font-mono text-[12px] text-white group-hover:text-white/60 transition-colors tracking-[0.15em]">
                          {link.label}
                        </span>
                        <ArrowRight size={11} className="text-rc-muted group-hover:text-white transition-colors" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
