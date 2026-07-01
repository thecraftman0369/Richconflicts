'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'

export type ToastVariant = 'success' | 'error' | 'info'

export type Toast = {
  id: string
  message: string
  variant: ToastVariant
}

type ToastContextType = {
  toasts: Toast[]
  toast: (message: string, variant?: ToastVariant) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (message: string, variant: ToastVariant = 'success') => {
      const id = crypto.randomUUID()
      setToasts((prev) => [...prev.slice(-3), { id, message, variant }])
      setTimeout(() => dismiss(id), 3400)
    },
    [dismiss]
  )

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
