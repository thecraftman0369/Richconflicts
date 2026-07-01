'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { useToast } from '@/app/lib/ToastContext'

const ICON = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
} as const

export default function ToastList() {
  const { toasts, dismiss } = useToast()

  return (
    <div
      className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = ICON[t.variant]
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-sm border min-w-[230px] max-w-[340px] ${
                t.variant === 'success'
                  ? 'bg-white text-black border-white'
                  : t.variant === 'error'
                  ? 'bg-black text-red-400 border-red-500/35'
                  : 'bg-black text-white border-rc-border'
              }`}
            >
              <Icon size={13} className="shrink-0" strokeWidth={2} />
              <span className="flex-1 font-mono text-[10px] tracking-[0.1em] leading-snug">
                {t.message}
              </span>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
                aria-label="Dismiss"
              >
                <X size={10} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
