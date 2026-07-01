/* ─── Shared domain types ─── */

export interface Product {
  id: string
  slug?: string
  name: string
  description?: string
  price: number
  originalPrice?: number
  category: string
  categories?: string[]
  images?: string[]
  sizes?: string[]
  stock?: number
  inventory?: Record<string, number>
  featured?: boolean
  releaseDate?: string
  /* legacy / card display helpers */
  isNew?: boolean
  isSoldOut?: boolean
  colorways?: number
  details?: string[]
}

export type SizeOption = {
  label: string
  inStock: boolean
}

export type BlogPost = {
  slug: string
  title: string
  category: string
  date: string
  readTime: string
  author: string
  excerpt: string
  keywords: string[]
  tags: string[]
  body: string[]
  featured?: boolean
}

export type CartItem = {
  product: Product
  size: string
  quantity: number
}
