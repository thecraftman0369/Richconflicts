'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircle, ArrowRight, Package } from 'lucide-react'

function OrderConfirmationContent() {
  const params  = useSearchParams()
  const orderRef = params.get('order') ?? 'RC-XXXXXXXX'
  const piId     = params.get('pi')

  return (
    <div className="pt-14 min-h-screen bg-black flex items-center justify-center px-5">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-md text-center"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4, type: 'spring', stiffness: 200 }}
          className="flex justify-center mb-8"
        >
          <div className="w-20 h-20 rounded-full border border-white/20 flex items-center justify-center">
            <CheckCircle size={36} strokeWidth={1} className="text-white" />
          </div>
        </motion.div>

        {/* Heading */}
        <h1 className="font-display text-[3.5rem] text-white leading-none mb-3">
          ORDER CONFIRMED
        </h1>
        <p className="font-mono text-[10px] text-rc-muted tracking-[0.22em] mb-8">
          THANK YOU FOR YOUR PURCHASE
        </p>

        {/* Order reference */}
        <div className="border border-rc-border rounded-sm p-5 mb-6">
          <p className="font-mono text-[8px] text-rc-muted tracking-[0.2em] mb-2">ORDER REFERENCE</p>
          <p className="font-display text-2xl text-white">{orderRef}</p>
          {piId && (
            <p className="font-mono text-[8px] text-zinc-700 mt-1 tracking-[0.1em]">
              {piId}
            </p>
          )}
        </div>

        {/* What happens next */}
        <div className="border border-rc-border rounded-sm p-5 mb-8 text-left space-y-3">
          <p className="font-mono text-[9px] tracking-[0.2em] text-white mb-4">WHAT HAPPENS NEXT</p>
          {[
            { icon: '01', text: 'You\'ll receive a confirmation email shortly.' },
            { icon: '02', text: 'Your order ships within 1–2 business days.' },
            { icon: '03', text: 'Tracking info will be emailed once dispatched.' },
          ].map(({ icon, text }) => (
            <div key={icon} className="flex items-start gap-3">
              <span className="font-mono text-[8px] text-rc-muted tracking-[0.1em] shrink-0 mt-0.5">{icon}</span>
              <p className="font-mono text-[10px] text-zinc-400 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>

        {/* Policy note */}
        <div className="flex items-start gap-2 p-3 border border-rc-border rounded-sm mb-8">
          <Package size={9} className="text-rc-muted shrink-0 mt-0.5" />
          <p className="font-mono text-[8px] text-rc-muted leading-relaxed tracking-[0.06em]">
            ALL SALES FINAL · FREE RETURNS ON FAULTY ITEMS ONLY · NO RESTOCKS
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          <Link
            href="/shop"
            className="flex items-center justify-center gap-2 w-full h-12 bg-white text-black font-mono text-[10px] tracking-[0.22em] rounded-sm hover:bg-zinc-100 transition-colors"
          >
            CONTINUE SHOPPING
            <ArrowRight size={10} />
          </Link>
          <Link
            href="/"
            className="w-full h-10 border border-rc-border text-white font-mono text-[9px] tracking-[0.18em] rounded-sm hover:border-zinc-500 transition-colors flex items-center justify-center"
          >
            BACK TO HOME
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="pt-14 min-h-screen flex items-center justify-center">
        <p className="font-mono text-[10px] text-rc-muted tracking-[0.2em]">LOADING...</p>
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  )
}
