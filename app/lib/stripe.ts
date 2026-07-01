import { loadStripe } from '@stripe/stripe-js'

const stripePublishableKey =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
  process.env.VITE_STRIPE_PUBLISHABLE_KEY ||
  'pk_live_51TP2xp3fDvpIYq3sfueB48xtY9eLzLRtN184PggE0ga2HcF5c1D8pbh1zTRRLJ8ctFZPdiIcvUHPpv1WQD2kU8UI00TKUafhQz'

export const getStripe = () => loadStripe(stripePublishableKey)
