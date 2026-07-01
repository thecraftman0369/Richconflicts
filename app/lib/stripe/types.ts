/* Shared types for the Stripe payment pipeline */

export type CartLineItem = {
  productId: string
  slug: string
  name: string
  price: number   // dollars
  size: string
  quantity: number
  image?: string
}

export type CheckoutContact = {
  email: string
  newsletter?: boolean
}

export type CheckoutShipping = {
  firstName: string
  lastName: string
  address1: string
  address2?: string
  city: string
  postcode: string
  country: string
  phone?: string
  delivery?: 'standard' | 'express'
}

export type CreatePaymentIntentPayload = {
  items: CartLineItem[]
  shippingCost: number   // dollars
  currency?: string      // ISO 4217, default 'usd'
  contact?: CheckoutContact
  shipping?: CheckoutShipping
}

/** All amounts in cents */
export type PaymentBreakdown = {
  subtotal: number
  tax: number
  shipping: number
  total: number
}

export type CreatePaymentIntentResponse = {
  clientSecret: string
  paymentIntentId: string
  breakdown: PaymentBreakdown
  orderId?: string
}
