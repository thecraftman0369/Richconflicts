'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Minus, Plus, X, ArrowLeft, ArrowRight, ShoppingBag } from 'lucide-react'
import { useCart } from '@/app/lib/CartContext'
import { useState } from 'react'

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal, clearCart } = useCart()
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)

  const shipping = subtotal >= 150 ? 0 : 9.95
  const discount = promoApplied ? subtotal * 0.1 : 0
  const total = subtotal - discount + shipping

  const handlePromo = (e: React.FormEvent) => {
    e.preventDefault()
    if (promoCode.trim().toUpperCase() === 'CONFLICT') {
      setPromoApplied(true)
    }
  }

  return (
    <div className="pt-14 min-h-screen">

      {/* Breadcrumb */}
      <div className="border-b border-rc-border">
        <div className="max-w-[1600px] mx-auto px-5 h-10 flex items-center gap-2">
          <Link
            href="/shop"
            className="font-mono text-[9px] text-rc-muted hover:text-white transition-colors tracking-[0.12em] flex items-center gap-1.5"
          >
            <ArrowLeft size={9} />
            CONTINUE SHOPPING
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="border-b border-rc-border">
        <div className="max-w-[1600px] mx-auto px-5 py-8 flex items-end justify-between">
          <div>
            <h1 className="font-display text-display-md text-white">YOUR CART</h1>
            <p className="font-mono text-[9px] text-rc-muted mt-1 tracking-[0.1em]">
              {items.length === 0 ? 'EMPTY' : `${items.reduce((s, i) => s + i.quantity, 0)} ITEMS`}
            </p>
          </div>
          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="font-mono text-[9px] text-rc-muted hover:text-white transition-colors tracking-[0.12em]"
            >
              CLEAR ALL
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      {items.length === 0 ? (
        /* Empty state */
        <div className="max-w-[1600px] mx-auto px-5 py-32 flex flex-col items-center text-center gap-6">
          <ShoppingBag size={48} strokeWidth={0.75} className="text-zinc-800" />
          <p className="font-mono text-[10px] text-rc-muted tracking-[0.22em]">
            NOTHING HERE YET.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 border border-white text-white font-mono text-[10px] tracking-[0.2em] px-6 py-3 rounded-sm hover:bg-white hover:text-black transition-all"
          >
            SHOP ALL <ArrowRight size={10} />
          </Link>
        </div>
      ) : (
        <div className="max-w-[1600px] mx-auto px-5 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">

            {/* ── Items column ── */}
            <div>
              <ul className="divide-y divide-rc-border border-t border-rc-border">
                <AnimatePresence initial={false}>
                  {items.map((item) => {
                    const key = `${item.productId}-${item.size}`
                    return (
                      <motion.li
                        key={key}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, height: 0, paddingBlock: 0, overflow: 'hidden' }}
                        transition={{ duration: 0.2 }}
                        className="flex gap-5 py-6"
                      >
                        {/* Image */}
                        <Link
                          href={`/product/${item.slug}`}
                          className="shrink-0 relative w-24 h-32 md:w-28 md:h-36 bg-[#0a0a0a] border border-rc-border rounded-sm overflow-hidden hover:border-zinc-600 transition-colors"
                        >
                          {item.image ? (
                            <Image src={item.image} alt={item.name} fill className="object-contain" sizes="112px" />
                          ) : (
                            <span className="absolute inset-0 flex items-center justify-center font-display text-3xl text-zinc-700 select-none">RC</span>
                          )}
                        </Link>

                        {/* Info */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <Link
                                href={`/product/${item.slug}`}
                                className="font-mono text-[12px] text-white hover:text-white/60 transition-colors leading-snug"
                              >
                                {item.name}
                              </Link>
                              <p className="font-mono text-[9px] text-rc-muted tracking-[0.15em] mt-1">
                                SIZE {item.size}
                              </p>
                            </div>
                            <button
                              onClick={() => removeItem(item.productId, item.size)}
                              className="shrink-0 p-1 text-rc-muted hover:text-white transition-colors"
                              aria-label="Remove item"
                            >
                              <X size={13} strokeWidth={1.5} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            {/* Qty controls */}
                            <div className="flex items-center border border-rc-border rounded-sm">
                              <button
                                onClick={() =>
                                  updateQuantity(item.productId, item.size, item.quantity - 1)
                                }
                                className="w-8 h-8 flex items-center justify-center text-rc-muted hover:text-white hover:bg-white/5 transition-colors"
                              >
                                <Minus size={10} />
                              </button>
                              <span className="w-10 h-8 flex items-center justify-center font-mono text-[11px] text-white border-x border-rc-border tabular-nums">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(item.productId, item.size, item.quantity + 1)
                                }
                                className="w-8 h-8 flex items-center justify-center text-rc-muted hover:text-white hover:bg-white/5 transition-colors"
                              >
                                <Plus size={10} />
                              </button>
                            </div>

                            <p className="font-mono text-[13px] text-white">
                              ${(item.price * item.quantity).toFixed(0)}
                            </p>
                          </div>
                        </div>
                      </motion.li>
                    )
                  })}
                </AnimatePresence>
              </ul>
            </div>

            {/* ── Order summary (sticky) ── */}
            <div>
              <div className="lg:sticky lg:top-[calc(56px+1px)]">
                <div className="border border-rc-border rounded-sm overflow-hidden">
                  <div className="p-5 border-b border-rc-border">
                    <p className="font-mono text-[10px] tracking-[0.22em] text-white">
                      ORDER SUMMARY
                    </p>
                  </div>

                  <div className="p-5 space-y-3">
                    {/* Lines */}
                    <div className="flex justify-between">
                      <p className="font-mono text-[9px] text-rc-muted tracking-[0.12em]">
                        SUBTOTAL
                      </p>
                      <p className="font-mono text-[11px] text-white">${subtotal.toFixed(0)}</p>
                    </div>

                    {promoApplied && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-between"
                      >
                        <p className="font-mono text-[9px] text-white tracking-[0.12em]">
                          PROMO (10%)
                        </p>
                        <p className="font-mono text-[11px] text-white">
                          −${discount.toFixed(0)}
                        </p>
                      </motion.div>
                    )}

                    <div className="flex justify-between">
                      <p className="font-mono text-[9px] text-rc-muted tracking-[0.12em]">
                        SHIPPING
                      </p>
                      <p className="font-mono text-[11px] text-white">
                        {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-rc-border flex justify-between">
                      <p className="font-mono text-[10px] text-white tracking-[0.12em]">TOTAL</p>
                      <p className="font-mono text-[16px] text-white">${total.toFixed(0)}</p>
                    </div>

                    {subtotal < 150 && (
                      <p className="font-mono text-[8px] text-rc-muted leading-relaxed">
                        Add ${(150 - subtotal).toFixed(0)} more for free shipping
                      </p>
                    )}
                  </div>

                  {/* Promo code */}
                  {!promoApplied && (
                    <form onSubmit={handlePromo} className="px-5 pb-5 flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="PROMO CODE"
                        className="flex-1 bg-transparent border border-rc-border rounded-sm px-3 h-9 font-mono text-[10px] text-white placeholder:text-rc-muted focus:outline-none focus:border-zinc-500 transition-colors tracking-[0.1em]"
                      />
                      <button
                        type="submit"
                        className="h-9 px-3 border border-rc-border text-rc-muted font-mono text-[9px] tracking-[0.1em] rounded-sm hover:border-zinc-500 hover:text-white transition-colors"
                      >
                        APPLY
                      </button>
                    </form>
                  )}

                  <div className="px-5 pb-5">
                    <Link
                      href="/checkout"
                      className="flex items-center justify-center w-full h-12 bg-white text-black font-mono text-[10px] tracking-[0.22em] rounded-sm hover:bg-zinc-100 transition-colors"
                    >
                      PROCEED TO CHECKOUT
                    </Link>
                  </div>

                  <div className="px-5 pb-5">
                    <p className="font-mono text-[8px] text-rc-muted tracking-[0.06em] leading-[1.7]">
                      FREE SHIPPING OVER $150 · SHIPS 3–5 BUSINESS DAYS · NO RESTOCKS ·
                      SECURE CHECKOUT
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
