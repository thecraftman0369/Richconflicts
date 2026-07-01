'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'

type WishlistContextType = {
  ids: string[]
  toggle: (id: string) => void
  has: (id: string) => boolean
  count: number
}

const WishlistContext = createContext<WishlistContextType | null>(null)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('rc-wishlist')
      if (stored) setIds(JSON.parse(stored))
    } catch {}
  }, [])

  useEffect(() => {
    localStorage.setItem('rc-wishlist', JSON.stringify(ids))
  }, [ids])

  const toggle = useCallback((id: string) => {
    setIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }, [])

  const has = useCallback((id: string) => ids.includes(id), [ids])

  return (
    <WishlistContext.Provider value={{ ids, toggle, has, count: ids.length }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist(): WishlistContextType {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be inside <WishlistProvider>')
  return ctx
}
