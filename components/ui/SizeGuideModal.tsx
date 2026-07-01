'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

type Props = {
  isOpen: boolean
  onClose: () => void
}

const SIZES = [
  { size: 'XS', chest: '34–36"', length: '27"', shoulder: '16.5"' },
  { size: 'S',  chest: '36–38"', length: '28"', shoulder: '17.5"' },
  { size: 'M',  chest: '38–40"', length: '29"', shoulder: '18.5"' },
  { size: 'L',  chest: '40–42"', length: '30"', shoulder: '19.5"' },
  { size: 'XL', chest: '42–44"', length: '31"', shoulder: '20.5"' },
  { size: 'XXL',chest: '44–48"', length: '32"', shoulder: '22"'   },
]

export default function SizeGuideModal({ isOpen, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.22 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[55] w-full max-w-lg bg-black border border-rc-border rounded-md overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-rc-border">
              <p className="font-mono text-[10px] tracking-[0.22em] text-white">SIZE GUIDE</p>
              <button
                onClick={onClose}
                className="p-1 text-rc-muted hover:text-white transition-colors"
                aria-label="Close size guide"
              >
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>

            {/* Table */}
            <div className="p-6 overflow-x-auto">
              <p className="font-mono text-[9px] text-rc-muted tracking-[0.15em] mb-4">
                ALL MEASUREMENTS IN INCHES. CHEST = PIT TO PIT × 2.
              </p>

              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-rc-border">
                    {['SIZE', 'CHEST', 'LENGTH', 'SHOULDER'].map((h) => (
                      <th
                        key={h}
                        className="text-left pb-3 font-mono text-[9px] tracking-[0.2em] text-rc-muted pr-6"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SIZES.map((row, i) => (
                    <tr
                      key={row.size}
                      className={`border-b border-rc-border ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}
                    >
                      <td className="py-3 pr-6 font-mono text-[11px] text-white">{row.size}</td>
                      <td className="py-3 pr-6 font-mono text-[11px] text-zinc-400">{row.chest}</td>
                      <td className="py-3 pr-6 font-mono text-[11px] text-zinc-400">{row.length}</td>
                      <td className="py-3 font-mono text-[11px] text-zinc-400">{row.shoulder}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <p className="font-mono text-[9px] text-rc-muted tracking-[0.1em] leading-relaxed mt-5">
                RC runs TRUE TO SIZE with a boxy silhouette. If you prefer a more fitted look,
                size down. Our models are 6'1" wearing size M.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
