'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useCart } from '@/app/lib/CartContext'
import { useToast } from '@/app/lib/ToastContext'
import type { Product } from '@/app/lib/types'
import { isSoldOut, isNew, firstAvailableSize } from '@/app/lib/products'

export type { Product }

export default function ProductCard({
  product,
  index = 0,
}: {
  product: Product
  index?: number
}) {
  const { addItem, openCart } = useCart()
  const { toast } = useToast()

  const soldOut = isSoldOut(product) || product.isSoldOut === true
  const newBadge = isNew(product)
  const heroImage = product.images?.[0]
  const href = `/product/${product.id}`

  function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (soldOut) return
    const size = firstAvailableSize(product) ?? product.sizes?.[0] ?? 'M'
    addItem({
      productId: product.id,
      slug: product.slug ?? product.id,
      name: product.name,
      price: product.price,
      size,
      image: product.images?.[0] ?? '',
    })
    toast(`${product.name} (${size}) added to cart`, 'success')
    openCart()
  }

  const displayCategory = product.category.replace(/-/g, ' ').toUpperCase()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay: index * 0.045, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Link href={href} className="group block">

        {/* ── Image container ── */}
        <div className="relative aspect-[3/4] bg-zinc-900 border border-rc-border rounded-sm overflow-hidden mb-3">

          {heroImage ? (
            <Image
              src={heroImage}
              alt={product.name}
              fill
              className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center select-none">
              <span className="font-display text-[5rem] text-zinc-800 leading-none">RC</span>
            </div>
          )}

          {/* Hover wash */}
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.04] transition-colors duration-300" />

          {/* Sold-out overlay */}
          {soldOut && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span
                className="font-mono text-[10px] tracking-[0.25em] text-white/40 border border-white/20 px-3 py-1 rounded-sm"
                style={{ transform: 'rotate(-20deg)' }}
              >
                SOLD OUT
              </span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
            {newBadge && !soldOut && (
              <span className="font-mono text-[8px] tracking-[0.2em] font-bold bg-white text-black px-1.5 py-0.5 rounded-sm">
                NEW
              </span>
            )}
            {product.originalPrice && !soldOut && (
              <span className="font-mono text-[8px] tracking-[0.2em] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded-sm">
                SALE
              </span>
            )}
          </div>

          {/* Quick-add on hover */}
          {!soldOut && (
            <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200 ease-out">
              <button
                onClick={handleQuickAdd}
                className="w-full py-2.5 bg-white text-black font-mono text-[10px] tracking-[0.18em] hover:bg-zinc-100 transition-colors active:bg-zinc-200"
              >
                QUICK ADD
              </button>
            </div>
          )}
        </div>

        {/* ── Meta ── */}
        <div>
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <p className="font-mono text-[11px] text-white leading-snug group-hover:text-white/60 transition-colors">
              {product.name}
            </p>
            <div className="flex flex-col items-end shrink-0">
              <p className="font-mono text-[11px] text-white">${product.price.toFixed(2)}</p>
              {product.originalPrice && (
                <p className="font-mono text-[9px] text-rc-muted line-through">
                  ${product.originalPrice.toFixed(2)}
                </p>
              )}
            </div>
          </div>
          <p className="font-mono text-[9px] text-rc-muted tracking-[0.12em]">
            {displayCategory}
            {product.colorways && product.colorways > 1
              ? ` · ${product.colorways} COLORS`
              : ''}
          </p>
        </div>

      </Link>
    </motion.div>
  )
}
