import { loadStripe, type Stripe } from '@stripe/stripe-js'

/*
 * Client-side Stripe singleton — loadStripe must be called outside React render.
 * Required env var: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
 */

let cached: Promise<Stripe | null> | null = null

export function getStripe(): Promise<Stripe | null> {
  if (!cached) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''
    if (!key) console.warn('[Stripe] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set.')
    cached = loadStripe(key)
  }
  return cached
}
