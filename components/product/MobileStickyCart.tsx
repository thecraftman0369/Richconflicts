'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '@/app/lib/CartContext'
import { useToast } from '@/app/lib/ToastContext'

type Props = {
  productId: string
  slug: string
  name: string
  price: number
  selectedSize: string | null
  onSizeError: () => void
}

export default function MobileStickyCart({
  productId,
  slug,
  name,
  price,
  selectedSize,
  onSizeError,
}: Props) {
  const { addItem, openCart } = useCart()
  const { toast } = useToast()

  const handleAdd = () => {
    if (!selectedSize) {
      onSizeError()
      return
    }
    addItem({ productId, slug, name, price, size: selectedSize })
    toast(`${name} (${selectedSize}) added`, 'success')
    openCart()
  }

  return (
    /* Only visible on mobile (md: hidden) */
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-black/95 backdrop-blur-sm border-t border-rc-border px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[10px] text-white truncate">{name}</p>
          <p className="font-mono text-[11px] text-white">${price}</p>
        </div>

        <AnimatePresence mode="wait">
          {selectedSize ? (
            <motion.span
              key="size"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-mono text-[9px] text-rc-muted tracking-[0.15em]"
            >
              SIZE {selectedSize}
            </motion.span>
          ) : null}
        </AnimatePresence>

        <button
          onClick={handleAdd}
          className="shrink-0 h-11 px-6 bg-white text-black font-mono text-[10px] tracking-[0.2em] rounded-sm hover:bg-zinc-100 active:bg-zinc-200 transition-colors"
        >
          ADD TO CART
        </button>
      </div>
    </div>
  )
}
