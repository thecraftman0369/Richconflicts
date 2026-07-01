import Stripe from 'stripe'

/*
 * Server-only Stripe instance.
 * Never import this file from client components.
 * Required env var: STRIPE_SECRET_KEY
 */

const key = process.env.STRIPE_SECRET_KEY
if (!key) throw new Error('[Stripe] STRIPE_SECRET_KEY is not set.')

const stripe = new Stripe(key, {
  apiVersion: '2024-06-20',
  typescript: true,
  appInfo: {
    name: 'Rich Conflicts',
    version: '1.0.0',
  },
})

export default stripe
