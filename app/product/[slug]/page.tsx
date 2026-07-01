'use client'

import { useState, useEffect, use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, Minus, Share2, ArrowLeft } from 'lucide-react'
import { useCart } from '@/app/lib/CartContext'
import { useToast } from '@/app/lib/ToastContext'
import { useProductTracker } from '@/app/lib/useProductTracker'
import RecommendationSidebar from '@/components/RecommendationSidebar'
import { isSoldOut, isInStock, isNew } from '@/app/lib/products'
import { createClient } from '@/app/supabase/client'
import type { Product } from '@/app/lib/types'

type DBProduct = {
  id: string; name: string; description: string | null; price: number
  original_price: number | null; category: string | null; categories: string[] | null
  images: string[] | null; image_url: string | null; sizes: string[] | null
  stock: number | null; slug: string | null; featured: boolean | null
  is_new: boolean | null; inventory: Record<string, number> | null
}

function toProduct(p: DBProduct): Product {
  const images = p.images?.length ? p.images : (p.image_url ? [p.image_url] : [])
  return {
    id: p.id, name: p.name, description: p.description ?? undefined, price: p.price,
    originalPrice: p.original_price ?? undefined, category: p.category ?? 'uncategorized',
    categories: p.categories ?? (p.category ? [p.category] : []), images,
    sizes: p.sizes ?? ['XS', 'S', 'M', 'L', 'XL'], stock: p.stock ?? 0,
    slug: p.slug ?? undefined, featured: p.featured ?? false, isNew: p.is_new ?? false,
    inventory: p.inventory ?? {},
  }
}

/* ─── Page ─── */
export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const supabase = createClient()

  const { addItem, openCart } = useCart()
  const { toast }             = useToast()
  const { track }             = useProductTracker()

  const [product,      setProduct]      = useState<Product | null>(null)
  const [notFound,     setNotFound]     = useState(false)
  const [activeImage,  setActiveImage]  = useState(0)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [detailsOpen,  setDetailsOpen]  = useState(false)
  const [sizeError,    setSizeError]    = useState(false)
  const [addedToCart,  setAddedToCart]  = useState(false)

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .eq('id', slug)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) { setNotFound(true); return }
        const p = toProduct(data as DBProduct)
        setProduct(p)
        track({
          productId: p.id,
          slug:      p.slug ?? p.id,
          name:      p.name,
          category:  p.category,
          tags:      [],
          price:     p.price,
          eventType: 'view',
        })
      })
  }, [slug]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Loading ── */
  if (!product && !notFound) {
    return (
      <div className="pt-14 min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 border border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  /* ── 404 ── */
  if (notFound || !product) {
    return (
      <div className="pt-14 min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="font-display text-[6rem] text-white leading-none">404</p>
          <p className="font-mono text-[11px] text-rc-muted tracking-[0.25em]">PRODUCT NOT FOUND</p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] border border-rc-border text-white px-4 py-2 rounded-sm hover:bg-white hover:text-black transition-all duration-150"
          >
            <ArrowLeft size={10} />
            BACK TO SHOP
          </Link>
        </div>
      </div>
    )
  }

  const images     = product.images ?? []
  const imageCount = images.length
  const hasImages  = imageCount > 0
  const sizes      = product.sizes ?? []
  const soldOut    = isSoldOut(product)
  const newBadge   = isNew(product)

  const handlePrevImage = () => setActiveImage((v) => (v - 1 + imageCount) % imageCount)
  const handleNextImage = () => setActiveImage((v) => (v + 1) % imageCount)

  const handleAddToCart = () => {
    if (!selectedSize) {
      setSizeError(true)
      setTimeout(() => setSizeError(false), 2200)
      return
    }
    addItem({
      productId: product.id,
      slug:      product.slug ?? product.id,
      name:      product.name,
      price:     product.price,
      size:      selectedSize,
      image:     images[activeImage],
    })
    track({
      productId: product.id,
      slug:      product.slug ?? product.id,
      name:      product.name,
      category:  product.category,
      tags:      [],
      price:     product.price,
      eventType: 'add_to_cart',
    })
    toast(`${product.name} (${selectedSize}) added to cart`, 'success')
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2500)
    openCart()
  }

  return (
    <div className="pt-14 min-h-screen">
      <RecommendationSidebar
        currentProductId={product.id}
        currentSlug={product.slug ?? product.id}
        autoOpenDelay={5000}
      />

      {/* ── Breadcrumb ── constrained to same max-width as content */}
      <div className="border-b border-rc-border">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 h-10 flex items-center gap-2">
          <Link
            href="/shop"
            className="font-mono text-[9px] text-rc-muted hover:text-white transition-colors tracking-[0.12em] flex items-center gap-1.5"
          >
            <ArrowLeft size={9} />
            SHOP
          </Link>
          <span className="text-rc-border">/</span>
          <span className="font-mono text-[9px] text-white tracking-[0.12em] truncate max-w-[260px]">
            {product.name}
          </span>
        </div>
      </div>

      {/* ── Main split panel ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-6 md:py-10">
        <div className="lg:grid lg:grid-cols-12 gap-8 lg:gap-16 items-start">

          {/* ══════════════════ LEFT — GALLERY (7 cols) ══════════════════ */}
          <div className="lg:col-span-7 mb-8 lg:mb-0">

            {/* ── Framed image box ── */}
            <div className="border border-[#262626] rounded-md bg-[#0a0a0a] overflow-hidden">
              <div className="relative w-full h-[400px] md:h-[540px] lg:h-[600px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeImage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.28 }}
                    className="absolute inset-0"
                  >
                    {hasImages ? (
                      <Image
                        src={images[activeImage]}
                        alt={`${product.name} — view ${activeImage + 1}`}
                        fill
                        className="object-contain"
                        sizes="(max-width: 1024px) 100vw, 58vw"
                        priority={activeImage === 0}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center select-none">
                        <span className="font-display text-[clamp(5rem,14vw,12rem)] text-zinc-800 leading-none">
                          RC
                        </span>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Image counter */}
                {hasImages && imageCount > 1 && (
                  <span className="absolute bottom-3 right-3 font-mono text-[9px] text-white/50 tracking-[0.18em] bg-black/60 px-2 py-0.5 rounded-sm select-none z-10">
                    {String(activeImage + 1).padStart(2, '0')} / {String(imageCount).padStart(2, '0')}
                  </span>
                )}

                {/* Prev / Next — centered on the contained box */}
                {imageCount > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 border border-[#333] bg-black/80 flex items-center justify-center rounded-sm hover:bg-white hover:border-white hover:text-black transition-all duration-150 z-10"
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 border border-[#333] bg-black/80 flex items-center justify-center rounded-sm hover:bg-white hover:border-white hover:text-black transition-all duration-150 z-10"
                      aria-label="Next image"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </>
                )}

                {/* Sold-out overlay */}
                {soldOut && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none z-10">
                    <span
                      className="font-mono text-[12px] tracking-[0.3em] text-white/50 border border-white/20 px-4 py-2 rounded-sm"
                      style={{ transform: 'rotate(-20deg)' }}
                    >
                      SOLD OUT
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Thumbnail strip — outside the frame ── */}
            {hasImages && imageCount > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-none">
                {images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`relative shrink-0 w-[64px] h-[64px] bg-[#0a0a0a] rounded-md border overflow-hidden transition-all duration-150 ${
                      activeImage === i
                        ? 'border-white'
                        : 'border-[#262626] hover:border-zinc-500'
                    }`}
                    aria-label={`View image ${i + 1}`}
                  >
                    <Image
                      src={src}
                      alt={`${product.name} thumbnail ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ══════════════════ RIGHT — PRODUCT INFO (5 cols, sticky) ══════════════════ */}
          <div className="lg:col-span-5 lg:sticky lg:top-[calc(56px+32px)]">

            {/* Category + badges */}
            <div className="flex items-center gap-2 mb-4">
              <span className="font-mono text-[9px] tracking-[0.25em] text-rc-muted uppercase">
                {product.category.replace(/-/g, ' ')}
              </span>
              {newBadge && !soldOut && (
                <span className="font-mono text-[8px] tracking-[0.18em] font-bold bg-white text-black px-2 py-0.5 rounded-sm">
                  NEW
                </span>
              )}
              {soldOut && (
                <span className="font-mono text-[8px] tracking-[0.18em] border border-zinc-700 text-zinc-500 px-2 py-0.5 rounded-sm">
                  SOLD OUT
                </span>
              )}
            </div>

            {/* Name */}
            <h1 className="font-display text-[2.6rem] xl:text-[3.2rem] text-white leading-none mb-5">
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-3 pb-5 mb-5 border-b border-rc-border">
              <p className="font-mono text-2xl text-white">${product.price.toFixed(2)}</p>
              {product.originalPrice && (
                <p className="font-mono text-sm text-rc-muted line-through">
                  ${product.originalPrice.toFixed(2)}
                </p>
              )}
              <p className="font-mono text-[9px] text-rc-muted tracking-[0.1em]">USD INCL. TAX</p>
            </div>

            {/* Description */}
            {product.description && (
              <p className="font-mono text-[11px] text-zinc-400 leading-[1.8] mb-6">
                {product.description}
              </p>
            )}

            {/* ── Size matrix ── */}
            {sizes.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-mono text-[10px] tracking-[0.22em] text-white">SELECT SIZE</p>
                  <button className="font-mono text-[9px] text-rc-muted hover:text-white transition-colors underline underline-offset-2 decoration-rc-border">
                    SIZE GUIDE
                  </button>
                </div>

                <div className={`grid gap-1.5 ${sizes.length <= 5 ? 'grid-cols-5' : 'grid-cols-6'}`}>
                  {sizes.map((size) => {
                    const inStock  = isInStock(product, size)
                    const selected = selectedSize === size
                    return (
                      <button
                        key={size}
                        disabled={!inStock}
                        onClick={() => setSelectedSize(size)}
                        className={`relative h-10 rounded-sm border font-mono text-[10px] transition-all duration-150 ${
                          !inStock
                            ? 'border-rc-border text-zinc-700 cursor-not-allowed overflow-hidden'
                            : selected
                            ? 'bg-white text-black border-white'
                            : 'border-rc-border text-white hover:border-zinc-500'
                        }`}
                      >
                        {size}
                        {!inStock && (
                          <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span
                              className="absolute w-[120%] h-px bg-zinc-700"
                              style={{ transform: 'rotate(-22deg)' }}
                            />
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Low-stock warning */}
                {(product.stock ?? 0) > 0 && (product.stock ?? 0) <= 3 && (
                  <p className="font-mono text-[9px] text-amber-500/80 mt-2 tracking-[0.12em]">
                    — ONLY {product.stock} LEFT IN STOCK
                  </p>
                )}

                <AnimatePresence>
                  {sizeError && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="font-mono text-[9px] text-red-400/80 mt-2 tracking-[0.12em]"
                    >
                      — PLEASE SELECT A SIZE TO CONTINUE
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* CTA buttons */}
            <div className="flex flex-col gap-2 mb-6">
              <button
                onClick={handleAddToCart}
                disabled={soldOut}
                className={`w-full h-12 font-mono text-[10px] tracking-[0.22em] rounded-sm transition-all duration-200 ${
                  soldOut
                    ? 'bg-zinc-900 text-zinc-600 border border-rc-border cursor-not-allowed'
                    : addedToCart
                    ? 'bg-zinc-800 text-white border border-rc-border'
                    : 'bg-white text-black hover:bg-zinc-100 active:bg-zinc-200'
                }`}
              >
                {soldOut ? 'SOLD OUT' : addedToCart ? '✓ ADDED TO CART' : 'ADD TO CART'}
              </button>

              <button className="w-full h-10 border border-rc-border text-white font-mono text-[10px] tracking-[0.22em] rounded-sm hover:border-zinc-500 transition-colors flex items-center justify-center gap-2">
                <Share2 size={11} strokeWidth={1.5} />
                SHARE
              </button>
            </div>

            {/* Details accordion */}
            {product.details && product.details.length > 0 && (
              <div className="border-t border-rc-border">
                <button
                  onClick={() => setDetailsOpen((v) => !v)}
                  className="w-full flex items-center justify-between py-3 group"
                >
                  <span className="font-mono text-[10px] tracking-[0.22em] text-white group-hover:text-white/70 transition-colors">
                    PRODUCT DETAILS
                  </span>
                  {detailsOpen ? <Minus size={11} className="text-rc-muted" /> : <Plus size={11} className="text-rc-muted" />}
                </button>

                <AnimatePresence initial={false}>
                  {detailsOpen && (
                    <motion.ul
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      className="overflow-hidden pb-4"
                    >
                      {product.details.map((detail) => (
                        <li key={detail} className="flex items-start gap-2 py-1">
                          <span className="font-mono text-[10px] text-rc-muted mt-0.5 shrink-0">—</span>
                          <span className="font-mono text-[10px] text-zinc-400">{detail}</span>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Shipping note */}
            <div className="border border-rc-border rounded-md p-3 mt-4">
              <p className="font-mono text-[9px] text-rc-muted tracking-[0.08em] leading-[1.7]">
                FREE SHIPPING OVER $150 · SHIPS 3–5 BUSINESS DAYS · NO RESTOCKS · ALL SALES FINAL ON SALE ITEMS
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
