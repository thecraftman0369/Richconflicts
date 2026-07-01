'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'

export type CartItem = {
  productId: string
  slug: string
  name: string
  price: number
  size: string
  quantity: number
  image?: string
}

type CartContextType = {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (productId: string, size: string) => void
  updateQuantity: (productId: string, size: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  subtotal: number
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)

  /* Hydrate from localStorage after mount */
  useEffect(() => {
    try {
      const stored = localStorage.getItem('rc-cart')
      if (stored) setItems(JSON.parse(stored))
    } catch {}
  }, [])

  /* Persist on every change */
  useEffect(() => {
    localStorage.setItem('rc-cart', JSON.stringify(items))
  }, [items])

  const addItem = useCallback((incoming: Omit<CartItem, 'quantity'>) => {
    setItems((prev) => {
      const key = `${incoming.productId}-${incoming.size}`
      const exists = prev.find((i) => `${i.productId}-${i.size}` === key)
      if (exists) {
        return prev.map((i) =>
          `${i.productId}-${i.size}` === key ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { ...incoming, quantity: 1 }]
    })
  }, [])

  const removeItem = useCallback((productId: string, size: string) => {
    setItems((prev) => prev.filter((i) => !(i.productId === productId && i.size === size)))
  }, [])

  const updateQuantity = useCallback(
    (productId: string, size: string, quantity: number) => {
      if (quantity < 1) {
        removeItem(productId, size)
        return
      }
      setItems((prev) =>
        prev.map((i) =>
          i.productId === productId && i.size === size ? { ...i, quantity } : i
        )
      )
    },
    [removeItem]
  )

  const clearCart = useCallback(() => setItems([]), [])
  const openCart = useCallback(() => setIsOpen(true), [])
  const closeCart = useCallback(() => setIsOpen(false), [])

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        isOpen,
        openCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextType {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}
