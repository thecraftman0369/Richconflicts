'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { X, Plus, Minus, ShoppingBag } from 'lucide-react'
import { useCart } from '@/app/lib/CartContext'

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, subtotal, totalItems } =
    useCart()

  const shipping = subtotal >= 150 ? 0 : 9.95
  const total = subtotal + shipping

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={closeCart}
            className="fixed inset-0 z-40 bg-black/65 backdrop-blur-[3px]"
          />

          {/* Panel */}
          <motion.aside
            key="panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[420px] bg-black border-l border-rc-border flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between h-14 px-5 border-b border-rc-border shrink-0">
              <p className="font-mono text-[11px] tracking-[0.22em] text-white">
                CART
                {totalItems > 0 && (
                  <span className="ml-2 text-rc-muted">({totalItems})</span>
                )}
              </p>
              <button
                onClick={closeCart}
                aria-label="Close cart"
                className="p-1 text-rc-muted hover:text-white transition-colors"
              >
                <X size={15} strokeWidth={1.5} />
              </button>
            </div>

            {/* Items list */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-5 px-8 text-center">
                  <ShoppingBag size={36} strokeWidth={1} className="text-zinc-800" />
                  <p className="font-mono text-[10px] text-rc-muted tracking-[0.22em]">
                    YOUR CART IS EMPTY
                  </p>
                  <button
                    onClick={closeCart}
                    className="font-mono text-[9px] tracking-[0.2em] border border-rc-border text-white px-4 py-2.5 rounded-sm hover:border-zinc-500 transition-colors"
                  >
                    CONTINUE SHOPPING
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-rc-border">
                  <AnimatePresence initial={false}>
                    {items.map((item) => {
                      const key = `${item.productId}-${item.size}`
                      return (
                        <motion.li
                          key={key}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex gap-4 p-5 overflow-hidden"
                        >
                          {/* Product image */}
                          <div className="relative w-[64px] h-[80px] bg-[#0a0a0a] rounded-md border border-[#262626] shrink-0 overflow-hidden">
                            {item.image ? (
                              <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                className="object-contain"
                                sizes="64px"
                              />
                            ) : (
                              <span className="absolute inset-0 flex items-center justify-center font-display text-xl text-zinc-700 select-none">RC</span>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <p className="font-mono text-[10px] text-white leading-snug mb-0.5 truncate">
                                {item.name}
                              </p>
                              <p className="font-mono text-[9px] text-rc-muted tracking-[0.15em]">
                                SIZE {item.size}
                              </p>
                            </div>

                            <div className="flex items-center justify-between mt-3">
                              {/* Qty controls */}
                              <div className="flex items-center border border-rc-border rounded-sm">
                                <button
                                  onClick={() =>
                                    updateQuantity(item.productId, item.size, item.quantity - 1)
                                  }
                                  className="w-7 h-7 flex items-center justify-center text-rc-muted hover:text-white hover:bg-white/5 transition-colors"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus size={9} />
                                </button>
                                <span className="w-7 h-7 flex items-center justify-center font-mono text-[10px] text-white border-x border-rc-border">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    updateQuantity(item.productId, item.size, item.quantity + 1)
                                  }
                                  className="w-7 h-7 flex items-center justify-center text-rc-muted hover:text-white hover:bg-white/5 transition-colors"
                                  aria-label="Increase quantity"
                                >
                                  <Plus size={9} />
                                </button>
                              </div>

                              <div className="flex items-center gap-3">
                                <p className="font-mono text-[11px] text-white">
                                  ${(item.price * item.quantity).toFixed(0)}
                                </p>
                                <button
                                  onClick={() => removeItem(item.productId, item.size)}
                                  className="font-mono text-[8px] text-rc-muted hover:text-white transition-colors tracking-[0.12em]"
                                >
                                  REMOVE
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.li>
                      )
                    })}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {/* Footer — only when cart has items */}
            {items.length > 0 && (
              <div className="shrink-0 border-t border-rc-border p-5 space-y-3">

                {/* Free shipping progress bar */}
                {subtotal < 150 && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="font-mono text-[8px] text-rc-muted tracking-[0.08em]">
                        FREE SHIPPING PROGRESS
                      </p>
                      <p className="font-mono text-[8px] text-white tracking-[0.08em]">
                        ${(150 - subtotal).toFixed(0)} away
                      </p>
                    </div>
                    <div className="h-0.5 bg-rc-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white transition-all duration-500 rounded-full"
                        style={{ width: `${Math.min((subtotal / 150) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                {subtotal >= 150 && (
                  <p className="font-mono text-[8px] text-emerald-400 tracking-[0.08em]">
                    ✓ FREE SHIPPING UNLOCKED
                  </p>
                )}

                {/* Order lines */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[9px] text-rc-muted tracking-[0.15em]">SUBTOTAL</p>
                    <p className="font-mono text-[11px] text-white">${subtotal.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[9px] text-rc-muted tracking-[0.15em]">SHIPPING</p>
                    <p className="font-mono text-[11px] text-white">
                      {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-rc-border">
                    <p className="font-mono text-[10px] text-white tracking-[0.15em]">TOTAL</p>
                    <p className="font-mono text-[14px] text-white">${total.toFixed(2)}</p>
                  </div>
                </div>

                <Link
                  href="/cart"
                  onClick={closeCart}
                  className="flex flex-col items-center justify-center w-full h-14 bg-white text-black font-mono rounded-sm hover:bg-zinc-100 transition-colors"
                >
                  <span className="text-[10px] tracking-[0.22em]">CHECKOUT</span>
                  <span className="text-[7px] tracking-[0.15em] text-zinc-500 mt-0.5">SECURE · FREE SHIPPING OVER $150</span>
                </Link>

                <button
                  onClick={closeCart}
                  className="w-full h-9 border border-rc-border text-rc-muted font-mono text-[9px] tracking-[0.18em] rounded-sm hover:border-zinc-500 hover:text-white transition-colors"
                >
                  CONTINUE SHOPPING
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
