'use client'

/*
 * Required packages:
 *   npm install @stripe/stripe-js @stripe/react-stripe-js stripe
 *
 * Required env vars:
 *   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY   (client-side, safe to expose)
 *   STRIPE_SECRET_KEY                    (server-side only)
 *   STRIPE_WEBHOOK_SECRET                (server-side only)
 */

import React, { useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import type { StripeElementsOptions } from '@stripe/stripe-js'
import { Lock, ChevronDown, AlertCircle, ShieldCheck } from 'lucide-react'
import { useCart, type CartItem } from '@/app/lib/CartContext'
import { getStripe } from '@/app/lib/stripe/client'
import type { CreatePaymentIntentResponse, PaymentBreakdown } from '@/app/lib/stripe/types'

/* ═══════════════════════════════════════════════════════════════
 *  Constants
 * ═══════════════════════════════════════════════════════════════ */

const TAX_RATE = 0.08

const COUNTRIES = [
  'United Kingdom', 'United States', 'Canada', 'Germany',
  'France', 'Australia', 'Japan', 'Netherlands', 'Sweden',
]

/* Stripe Elements appearance — styled to match RC dark theme */
const STRIPE_APPEARANCE: StripeElementsOptions['appearance'] = {
  theme: 'night',
  variables: {
    colorPrimary:           '#ffffff',
    colorBackground:        '#000000',
    colorText:              '#ffffff',
    colorTextSecondary:     '#555555',
    colorTextPlaceholder:   '#2a2a2a',
    colorDanger:            '#f87171',
    fontFamily:             '"Space Mono", "Courier New", monospace',
    fontSizeBase:           '11px',
    fontWeightNormal:       '400',
    borderRadius:           '4px',
    spacingUnit:            '4px',
    spacingGridRow:         '16px',
    spacingGridColumn:      '12px',
    focusBoxShadow:         'none',
    focusOutline:           'none',
  },
  rules: {
    '.Input': {
      border:          '1px solid #1a1a1a',
      boxShadow:       'none',
      backgroundColor: '#000000',
      color:           '#ffffff',
      padding:         '12px 16px',
      letterSpacing:   '0.04em',
      transition:      'border-color 150ms',
    },
    '.Input:hover': { border: '1px solid #333333' },
    '.Input:focus': { border: '1px solid #555555', boxShadow: 'none' },
    '.Input--invalid': { border: '1px solid #f87171', boxShadow: 'none' },
    '.Label': {
      color:          '#555555',
      fontSize:       '9px',
      fontWeight:     '400',
      letterSpacing:  '0.2em',
      textTransform:  'uppercase',
      marginBottom:   '6px',
    },
    '.Error': {
      color:         '#f87171',
      fontSize:      '9px',
      letterSpacing: '0.1em',
      marginTop:     '5px',
    },
    '.Tab': {
      backgroundColor: '#000000',
      border:          '1px solid #1a1a1a',
      color:           '#555555',
      boxShadow:       'none',
    },
    '.Tab:hover':   { color: '#ffffff', border: '1px solid #333333' },
    '.Tab--selected': {
      backgroundColor: '#000000',
      border:          '1px solid #ffffff',
      color:           '#ffffff',
      boxShadow:       'none',
    },
    '.Block': { backgroundColor: '#000000', border: '1px solid #1a1a1a' },
    '.CheckboxInput': { backgroundColor: '#000000', borderColor: '#1a1a1a' },
    '.CheckboxInput--checked': { backgroundColor: '#ffffff', borderColor: '#ffffff' },
    '.PickerItem': { backgroundColor: '#000000', border: '1px solid #1a1a1a', color: '#555555' },
    '.PickerItem--selected': { backgroundColor: '#000000', border: '1px solid #ffffff', color: '#ffffff' },
  },
}

/* ═══════════════════════════════════════════════════════════════
 *  Primitive form components
 * ═══════════════════════════════════════════════════════════════ */

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block font-mono text-[9px] tracking-[0.2em] text-rc-muted mb-1.5 uppercase">
      {children}
    </label>
  )
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full bg-transparent border border-rc-border rounded-sm px-4 h-11 font-mono text-[11px] text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-500 transition-colors"
    />
  )
}

function CountrySelect({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className="w-full appearance-none bg-black border border-rc-border rounded-sm px-4 h-11 font-mono text-[11px] text-white focus:outline-none focus:border-zinc-500 transition-colors pr-10"
      >
        {children}
      </select>
      <ChevronDown
        size={11}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-rc-muted pointer-events-none"
      />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
 *  Stripe PaymentElement form — must render inside <Elements>
 * ═══════════════════════════════════════════════════════════════ */

type PaymentFormInnerProps = {
  total: number    // dollars
  onSuccess: (piId: string) => void
  onError: (msg: string) => void
}

function PaymentFormInner({ total, onSuccess, onError }: PaymentFormInnerProps) {
  const stripe   = useStripe()
  const elements = useElements()
  const [submitting,    setSubmitting]    = useState(false)
  const [errorMsg,      setErrorMsg]      = useState<string | null>(null)
  const [elementReady,  setElementReady]  = useState(false)
  const [loadTimeout,   setLoadTimeout]   = useState(false)

  React.useEffect(() => {
    if (elementReady) return
    const t = setTimeout(() => setLoadTimeout(true), 10_000)
    return () => clearTimeout(t)
  }, [elementReady])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setSubmitting(true)
    setErrorMsg(null)

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-confirmation`,
      },
      redirect: 'if_required',
    })

    setSubmitting(false)

    if (error) {
      const msg = error.message ?? 'Payment failed. Please try again.'
      setErrorMsg(msg)
      onError(msg)
    } else if (paymentIntent?.status === 'succeeded') {
      onSuccess(paymentIntent.id)
    } else {
      /* Rare: requires_action resolved without redirect — treat as success */
      onSuccess(paymentIntent?.id ?? 'unknown')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Stripe Payment Element */}
      <PaymentElement
        options={{
          layout: 'tabs',
          paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
        }}
        onReady={() => setElementReady(true)}
      />

      {/* Load timeout error */}
      {loadTimeout && !elementReady && (
        <div className="flex items-start gap-2 p-3 border border-amber-900/60 rounded-sm bg-amber-950/20">
          <AlertCircle size={12} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="font-mono text-[9px] text-amber-400 leading-relaxed tracking-[0.08em]">
            Payment form failed to load. If testing locally, switch to Stripe test keys in .env.local. On production, check your network connection and reload.
          </p>
        </div>
      )}

      {/* Error display */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-2 p-3 border border-red-900/60 rounded-sm bg-red-950/20"
          >
            <AlertCircle size={12} className="text-red-400 shrink-0 mt-0.5" />
            <p className="font-mono text-[9px] text-red-400 leading-relaxed tracking-[0.08em]">
              {errorMsg}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit */}
      <button
        type="submit"
        disabled={!stripe || !elements || !elementReady || submitting}
        className="w-full h-13 flex items-center justify-center gap-2 bg-white text-black font-mono text-[10px] tracking-[0.22em] rounded-sm hover:bg-zinc-100 active:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ height: '52px' }}
      >
        <Lock size={10} strokeWidth={2.5} />
        {submitting ? 'PROCESSING...' : !elementReady ? 'LOADING...' : `PLACE ORDER · $${total.toFixed(2)}`}
      </button>

      {/* Stripe trust badge */}
      <div className="flex items-center justify-center gap-2 pt-1">
        <ShieldCheck size={10} className="text-zinc-700" />
        <p className="font-mono text-[8px] text-zinc-700 tracking-[0.1em]">
          SECURED BY STRIPE · PCI DSS COMPLIANT
        </p>
      </div>
    </form>
  )
}

/* ═══════════════════════════════════════════════════════════════
 *  Order summary panel
 * ═══════════════════════════════════════════════════════════════ */

function OrderSummary({
  items,
  breakdown,
  deliveryLabel,
}: {
  items: CartItem[]
  breakdown: PaymentBreakdown | null
  deliveryLabel: string
}) {
  const localSubtotal  = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const localTax       = localSubtotal * TAX_RATE
  const localShipping  = breakdown ? breakdown.shipping / 100 : 0
  const displaySub     = breakdown ? breakdown.subtotal / 100 : localSubtotal
  const displayTax     = breakdown ? breakdown.tax / 100      : localTax
  const displayTotal   = breakdown ? breakdown.total / 100    : localSubtotal + localTax + localShipping

  return (
    <div className="border border-rc-border rounded-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-rc-border">
        <p className="font-mono text-[10px] tracking-[0.22em] text-white">ORDER SUMMARY</p>
        <p className="font-mono text-[9px] text-rc-muted tracking-[0.12em]">
          {items.reduce((s, i) => s + i.quantity, 0)} ITEM{items.length !== 1 ? 'S' : ''}
        </p>
      </div>

      {/* Line items */}
      <ul className="max-h-52 overflow-y-auto divide-y divide-rc-border scrollbar-none">
        {items.map((item) => (
          <li
            key={`${item.productId}-${item.size}`}
            className="flex items-center gap-3 px-5 py-3.5"
          >
            {/* Product image */}
            <div className="relative w-12 h-16 bg-[#0a0a0a] border border-[#262626] rounded-md shrink-0 overflow-hidden">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-contain"
                  sizes="48px"
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center font-display text-sm text-zinc-700 select-none">RC</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-mono text-[9px] text-white truncate">{item.name}</p>
              <p className="font-mono text-[8px] text-rc-muted tracking-[0.1em]">
                SIZE {item.size}
                {item.quantity > 1 && ` · QTY ${item.quantity}`}
              </p>
            </div>
            <p className="font-mono text-[11px] text-white shrink-0">
              ${(item.price * item.quantity).toFixed(0)}
            </p>
          </li>
        ))}
      </ul>

      {/* Cost breakdown */}
      <div className="p-5 space-y-2.5 border-t border-rc-border">
        <div className="flex justify-between items-baseline">
          <p className="font-mono text-[8px] text-rc-muted tracking-[0.16em]">SUBTOTAL</p>
          <p className="font-mono text-[11px] text-white">${displaySub.toFixed(2)}</p>
        </div>
        <div className="flex justify-between items-baseline">
          <p className="font-mono text-[8px] text-rc-muted tracking-[0.16em]">TAX (8%)</p>
          <p className="font-mono text-[11px] text-white">${displayTax.toFixed(2)}</p>
        </div>
        <div className="flex justify-between items-baseline">
          <div>
            <p className="font-mono text-[8px] text-rc-muted tracking-[0.16em]">SHIPPING</p>
            <p className="font-mono text-[7px] text-zinc-700 mt-0.5">{deliveryLabel}</p>
          </div>
          <p className="font-mono text-[11px] text-white">
            {localShipping === 0 && !breakdown ? '—' : displaySub >= 150 ? 'FREE' : `$${(breakdown?.shipping ?? 0) / 100 > 0 ? ((breakdown!.shipping) / 100).toFixed(2) : '9.95'}`}
          </p>
        </div>
        <div className="flex justify-between items-baseline pt-3 border-t border-rc-border">
          <p className="font-mono text-[10px] text-white tracking-[0.16em]">TOTAL</p>
          <p className="font-mono text-[18px] text-white leading-none">
            ${displayTotal.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Guarantee note */}
      <div className="px-5 pb-5">
        <div className="flex items-start gap-2 p-3 border border-rc-border rounded-sm">
          <Lock size={9} strokeWidth={1.5} className="text-rc-muted shrink-0 mt-0.5" />
          <p className="font-mono text-[8px] text-rc-muted leading-relaxed tracking-[0.06em]">
            256-BIT SSL ENCRYPTION · ALL SALES FINAL · FREE RETURNS ON FAULTY ITEMS ONLY
          </p>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
 *  Main checkout page
 * ═══════════════════════════════════════════════════════════════ */

type Step = 'contact' | 'shipping' | 'payment'

export default function CheckoutPage() {
  const router      = useRouter()
  const { items, subtotal, clearCart } = useCart()

  /* ── Form state ───────────────────────────────────────────── */
  const [step, setStep]       = useState<Step>('contact')
  const [piLoading, setPiLoading] = useState(false)
  const [piError,   setPiError]   = useState<string | null>(null)

  const [clientSecret,    setClientSecret]    = useState<string | null>(null)
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null)
  const [breakdown,       setBreakdown]       = useState<PaymentBreakdown | null>(null)

  const [contact, setContact] = useState({ email: '', newsletter: false })

  const [shipping, setShipping] = useState({
    firstName: '', lastName: '',
    address1:  '', address2: '',
    city:      '', postcode:   '',
    country:   'United Kingdom', phone: '',
  })

  const [delivery, setDelivery] = useState<'standard' | 'express'>('standard')

  /* ── Derived ──────────────────────────────────────────────── */
  const shippingCost  = subtotal >= 150 ? 0 : delivery === 'express' ? 14.95 : 9.95
  const deliveryLabel = delivery === 'express' ? 'EXPRESS 1–2 DAYS' : 'STANDARD 3–5 DAYS'
  const totalDollars  = breakdown
    ? breakdown.total / 100
    : subtotal + subtotal * TAX_RATE + shippingCost

  const shippingComplete = Boolean(
    shipping.firstName && shipping.lastName &&
    shipping.address1  && shipping.city && shipping.postcode
  )

  /* ── Create PaymentIntent when moving to payment step ─────── */
  const initPayment = useCallback(async () => {
    setPiLoading(true)
    setPiError(null)

    try {
      const res = await fetch('/api/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ items, shippingCost, contact, shipping }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `Server error ${res.status}`)
      }

      const data: CreatePaymentIntentResponse = await res.json()
      setClientSecret(data.clientSecret)
      setPaymentIntentId(data.paymentIntentId)
      setBreakdown(data.breakdown)
      setStep('payment')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not initialise payment.'
      setPiError(msg)
    } finally {
      setPiLoading(false)
    }
  }, [items, shippingCost, contact, shipping])

  /* ── After successful payment ─────────────────────────────── */
  const handlePaymentSuccess = useCallback(
    (piId: string) => {
      clearCart()
      router.push(
        `/order-confirmation?order=RC-${piId.slice(-8).toUpperCase()}&pi=${piId}`
      )
    },
    [clearCart, router],
  )

  /* ── Empty cart guard ─────────────────────────────────────── */
  if (items.length === 0) {
    return (
      <div className="pt-14 min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="font-mono text-[10px] text-rc-muted tracking-[0.22em]">YOUR CART IS EMPTY.</p>
        <Link
          href="/shop"
          className="font-mono text-[9px] border border-rc-border text-white px-5 py-2.5 rounded-sm hover:border-zinc-500 transition-colors tracking-[0.15em]"
        >
          SHOP ALL
        </Link>
      </div>
    )
  }

  /* ── Stripe Elements options ──────────────────────────────── */
  const elementsOptions: StripeElementsOptions = clientSecret
    ? {
        clientSecret,
        appearance: STRIPE_APPEARANCE,
        fonts: [
          {
            cssSrc:
              'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap',
          },
        ],
      }
    : {}

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div className="pt-14 min-h-screen bg-black">

      {/* ── Checkout header ── */}
      <div className="border-b border-rc-border">
        <div className="max-w-[1160px] mx-auto px-5 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="font-display text-2xl text-white hover:opacity-60 transition-opacity"
          >
            RC
          </Link>
          <div className="flex items-center gap-1.5 text-rc-muted">
            <Lock size={9} strokeWidth={1.5} />
            <span className="font-mono text-[9px] tracking-[0.18em]">SECURE CHECKOUT</span>
          </div>
        </div>
      </div>

      {/* ── Step breadcrumb ── */}
      <div className="border-b border-rc-border bg-rc-subtle">
        <div className="max-w-[1160px] mx-auto px-5 h-10 flex items-center gap-3">
          {(['contact', 'shipping', 'payment'] as Step[]).map((s, i) => (
            <React.Fragment key={s}>
              {i > 0 && <span className="font-mono text-[9px] text-rc-border">/</span>}
              <button
                disabled={
                  s === 'payment' ||
                  (s === 'shipping' && step === 'contact')
                }
                onClick={() => {
                  if (s !== 'payment' && step !== s) setStep(s)
                }}
                className={`font-mono text-[9px] tracking-[0.18em] transition-colors disabled:cursor-default ${
                  step === s ? 'text-white' : 'text-rc-muted hover:text-zinc-400 disabled:hover:text-rc-muted'
                }`}
              >
                {s.toUpperCase()}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="max-w-[1160px] mx-auto px-5 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">

          {/* ─────────────────── LEFT PANEL ─────────────────── */}
          <div className="space-y-8">

            {/* ── CONTACT ── */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-mono text-[10px] tracking-[0.24em] text-white">CONTACT</h2>
                {step !== 'contact' && (
                  <button
                    onClick={() => setStep('contact')}
                    className="font-mono text-[8px] text-rc-muted hover:text-white transition-colors tracking-[0.14em]"
                  >
                    EDIT
                  </button>
                )}
              </div>

              {step === 'contact' ? (
                <div className="space-y-3">
                  <div>
                    <FieldLabel>Email Address</FieldLabel>
                    <TextInput
                      type="email"
                      value={contact.email}
                      onChange={(e) => setContact((p) => ({ ...p, email: e.target.value }))}
                      placeholder="your@email.com"
                      autoComplete="email"
                      required
                    />
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={contact.newsletter}
                      onChange={(e) => setContact((p) => ({ ...p, newsletter: e.target.checked }))}
                      className="accent-white w-4 h-4"
                    />
                    <span className="font-mono text-[10px] text-zinc-400">
                      Notify me about drops and new arrivals
                    </span>
                  </label>

                  <button
                    disabled={!contact.email}
                    onClick={() => setStep('shipping')}
                    className="w-full h-11 bg-white text-black font-mono text-[10px] tracking-[0.22em] rounded-sm hover:bg-zinc-100 transition-colors disabled:opacity-50 mt-1"
                  >
                    CONTINUE TO SHIPPING
                  </button>
                </div>
              ) : (
                <p className="font-mono text-[11px] text-zinc-400">{contact.email}</p>
              )}
            </section>

            {/* ── SHIPPING ── */}
            {(step === 'shipping' || step === 'payment') && (
              <section className="border-t border-rc-border pt-8">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-mono text-[10px] tracking-[0.24em] text-white">SHIPPING</h2>
                  {step === 'payment' && (
                    <button
                      onClick={() => {
                        setClientSecret(null)
                        setBreakdown(null)
                        setStep('shipping')
                      }}
                      className="font-mono text-[8px] text-rc-muted hover:text-white transition-colors tracking-[0.14em]"
                    >
                      EDIT
                    </button>
                  )}
                </div>

                {step === 'shipping' ? (
                  <div className="space-y-3">
                    {/* Name row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <FieldLabel>First Name</FieldLabel>
                        <TextInput
                          value={shipping.firstName}
                          onChange={(e) => setShipping((p) => ({ ...p, firstName: e.target.value }))}
                          autoComplete="given-name"
                          placeholder="First"
                        />
                      </div>
                      <div>
                        <FieldLabel>Last Name</FieldLabel>
                        <TextInput
                          value={shipping.lastName}
                          onChange={(e) => setShipping((p) => ({ ...p, lastName: e.target.value }))}
                          autoComplete="family-name"
                          placeholder="Last"
                        />
                      </div>
                    </div>

                    {/* Address */}
                    <div>
                      <FieldLabel>Address Line 1</FieldLabel>
                      <TextInput
                        value={shipping.address1}
                        onChange={(e) => setShipping((p) => ({ ...p, address1: e.target.value }))}
                        autoComplete="address-line1"
                        placeholder="Street address"
                      />
                    </div>
                    <div>
                      <FieldLabel>Address Line 2 (Optional)</FieldLabel>
                      <TextInput
                        value={shipping.address2}
                        onChange={(e) => setShipping((p) => ({ ...p, address2: e.target.value }))}
                        autoComplete="address-line2"
                        placeholder="Apt, suite, unit"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <FieldLabel>City</FieldLabel>
                        <TextInput
                          value={shipping.city}
                          onChange={(e) => setShipping((p) => ({ ...p, city: e.target.value }))}
                          autoComplete="address-level2"
                          placeholder="City"
                        />
                      </div>
                      <div>
                        <FieldLabel>Postcode</FieldLabel>
                        <TextInput
                          value={shipping.postcode}
                          onChange={(e) => setShipping((p) => ({ ...p, postcode: e.target.value }))}
                          autoComplete="postal-code"
                          placeholder="Postcode"
                        />
                      </div>
                    </div>

                    <div>
                      <FieldLabel>Country</FieldLabel>
                      <CountrySelect
                        value={shipping.country}
                        onChange={(e) => setShipping((p) => ({ ...p, country: e.target.value }))}
                        autoComplete="country-name"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </CountrySelect>
                    </div>

                    <div>
                      <FieldLabel>Phone (Optional)</FieldLabel>
                      <TextInput
                        type="tel"
                        value={shipping.phone}
                        onChange={(e) => setShipping((p) => ({ ...p, phone: e.target.value }))}
                        autoComplete="tel"
                        placeholder="+44 7700 900000"
                      />
                    </div>

                    {/* Delivery method */}
                    <div className="pt-1">
                      <FieldLabel>Delivery Method</FieldLabel>
                      <div className="space-y-2 mt-1.5">
                        {[
                          {
                            id:    'standard' as const,
                            name:  'STANDARD',
                            sub:   '3–5 business days',
                            price: subtotal >= 150 ? 'FREE' : '$9.95',
                          },
                          {
                            id:    'express' as const,
                            name:  'EXPRESS',
                            sub:   '1–2 business days',
                            price: '$14.95',
                          },
                        ].map((opt) => (
                          <label
                            key={opt.id}
                            className={`flex items-center justify-between p-3.5 border rounded-sm cursor-pointer transition-colors ${
                              delivery === opt.id
                                ? 'border-white bg-white/[0.02]'
                                : 'border-rc-border hover:border-zinc-600'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="delivery"
                                value={opt.id}
                                checked={delivery === opt.id}
                                onChange={() => setDelivery(opt.id)}
                                className="accent-white"
                              />
                              <div>
                                <p className="font-mono text-[10px] text-white">{opt.name}</p>
                                <p className="font-mono text-[8px] text-rc-muted mt-0.5">{opt.sub}</p>
                              </div>
                            </div>
                            <p className="font-mono text-[11px] text-white">{opt.price}</p>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* PI creation error */}
                    <AnimatePresence>
                      {piError && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex items-start gap-2 p-3 border border-red-900/50 rounded-sm bg-red-950/15"
                        >
                          <AlertCircle size={12} className="text-red-400 shrink-0 mt-0.5" />
                          <p className="font-mono text-[9px] text-red-400 tracking-[0.06em]">{piError}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      disabled={!shippingComplete || piLoading}
                      onClick={initPayment}
                      className="w-full h-11 bg-white text-black font-mono text-[10px] tracking-[0.22em] rounded-sm hover:bg-zinc-100 transition-colors disabled:opacity-50 mt-1 flex items-center justify-center gap-2"
                    >
                      {piLoading ? (
                        <>
                          <span className="w-3 h-3 border border-black border-t-transparent rounded-full animate-spin" />
                          INITIALISING PAYMENT...
                        </>
                      ) : (
                        'CONTINUE TO PAYMENT'
                      )}
                    </button>
                  </div>
                ) : (
                  /* Collapsed shipping summary */
                  <div className="space-y-0.5">
                    <p className="font-mono text-[11px] text-zinc-400">
                      {shipping.firstName} {shipping.lastName}
                    </p>
                    <p className="font-mono text-[11px] text-zinc-400">
                      {shipping.address1}
                      {shipping.address2 ? `, ${shipping.address2}` : ''},{' '}
                      {shipping.city} {shipping.postcode}
                    </p>
                    <p className="font-mono text-[11px] text-zinc-400">{shipping.country}</p>
                    <p className="font-mono text-[9px] text-rc-muted mt-1.5 tracking-[0.12em]">
                      {deliveryLabel}
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* ── PAYMENT — Stripe Elements ── */}
            {step === 'payment' && clientSecret && (
              <section className="border-t border-rc-border pt-8">
                <h2 className="font-mono text-[10px] tracking-[0.24em] text-white mb-5">PAYMENT</h2>

                <Elements stripe={getStripe()} options={elementsOptions}>
                  <PaymentFormInner
                    total={totalDollars}
                    onSuccess={handlePaymentSuccess}
                    onError={(msg) => setPiError(msg)}
                  />
                </Elements>
              </section>
            )}
          </div>

          {/* ─────────────────── RIGHT PANEL (sticky) ─────────────────── */}
          <div className="lg:sticky lg:top-[calc(56px+1px)]">
            <OrderSummary
              items={items}
              breakdown={breakdown}
              deliveryLabel={deliveryLabel}
            />
          </div>

        </div>
      </div>
    </div>
  )
}
