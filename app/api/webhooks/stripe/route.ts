import { NextRequest, NextResponse } from 'next/server'
import stripe from '@/app/lib/stripe/server'
import { supabaseAdmin } from '@/app/lib/supabase/admin'
import type Stripe from 'stripe'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature)
    return NextResponse.json({ error: 'Missing stripe-signature header.' }, { status: 400 })

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret)
    return NextResponse.json({ error: 'Webhook not configured.' }, { status: 500 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Invalid signature: ${msg}` }, { status: 400 })
  }

  console.log(`[Webhook] ✓ ${event.type} [${event.id}]`)

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await onPaymentSucceeded(event.data.object as Stripe.PaymentIntent)
        break
      case 'payment_intent.payment_failed':
        await onPaymentFailed(event.data.object as Stripe.PaymentIntent)
        break
      case 'payment_intent.canceled':
        await supabaseAdmin.from('orders')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('stripe_payment_intent_id', (event.data.object as Stripe.PaymentIntent).id)
        break
      case 'charge.refunded':
        console.log(`[Webhook] charge.refunded: ${(event.data.object as Stripe.Charge).id}`)
        break
      default:
        console.log(`[Webhook] — unhandled: ${event.type}`)
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown handler error'
    console.error(`[Webhook] ❌ Handler error for ${event.type}:`, msg)
    return NextResponse.json({ received: true, handlerError: msg })
  }

  return NextResponse.json({ received: true })
}

async function onPaymentSucceeded(pi: Stripe.PaymentIntent): Promise<void> {
  console.log(`[Webhook] payment_intent.succeeded: ${pi.id} · $${(pi.amount / 100).toFixed(2)}`)

  /* 1 — Mark order paid */
  const { error: updateErr } = await supabaseAdmin
    .from('orders')
    .update({ status: 'paid', updated_at: new Date().toISOString() })
    .eq('stripe_payment_intent_id', pi.id)

  if (updateErr) {
    /* Order may not exist yet if checkout API DB write failed — insert fallback */
    console.warn('[Webhook] ⚠ Order update failed — attempting fallback insert:', updateErr.message)

    type MetaItem = { id: string; qty: number; size: string; name: string }
    const metaItems: MetaItem[] = pi.metadata?.items ? JSON.parse(pi.metadata.items) : []

    const { data: newOrder } = await supabaseAdmin
      .from('orders')
      .insert({
        stripe_payment_intent_id: pi.id,
        status:                   'paid',
        total_price:              pi.amount / 100,
        subtotal:                 Number(pi.metadata?.subtotal ?? 0) / 100,
        tax:                      Number(pi.metadata?.tax      ?? 0) / 100,
        shipping_cost:            Number(pi.metadata?.shipping ?? 0) / 100,
        shipping_email:           pi.receipt_email ?? null,
        shipping_full_name:       pi.shipping?.name ?? null,
        shipping_address:         pi.shipping?.address?.line1 ?? null,
        shipping_city:            pi.shipping?.address?.city ?? null,
        shipping_zip:             pi.shipping?.address?.postal_code ?? null,
        shipping_country:         pi.shipping?.address?.country ?? null,
      })
      .select('id')
      .single()

    if (newOrder && metaItems.length > 0) {
      await supabaseAdmin.from('order_items').insert(
        metaItems.map(i => ({
          order_id:     newOrder.id,
          product_name: i.name,
          price:        0,
          quantity:     i.qty,
          size:         i.size,
        }))
      )
    }
  } else {
    console.log(`[Webhook] ✓ Order marked paid for PI: ${pi.id}`)
  }

  /* 2 — Decrement inventory */
  type MetaItem = { id: string; qty: number; size: string; name: string }
  const items: MetaItem[] = pi.metadata?.items ? JSON.parse(pi.metadata.items) : []

  for (const item of items) {
    try {
      const { data: product } = await supabaseAdmin
        .from('products')
        .select('inventory, stock')
        .eq('name', item.name)
        .single()

      if (product?.inventory) {
        const inv = { ...(product.inventory as Record<string, number>) }
        if (typeof inv[item.size] === 'number') {
          inv[item.size] = Math.max(0, inv[item.size] - item.qty)
        }
        const newStock = Object.values(inv).reduce((s: number, v) => s + (v as number), 0)
        await supabaseAdmin
          .from('products')
          .update({ inventory: inv, stock: newStock, updated_at: new Date().toISOString() })
          .eq('name', item.name)
      }
    } catch (err) {
      console.warn(`[Webhook] ⚠ Inventory update failed for ${item.name}:`, err)
    }
  }

  console.log(`[Webhook] ✓ Pipeline complete for ${pi.id}`)
}

async function onPaymentFailed(pi: Stripe.PaymentIntent): Promise<void> {
  const reason = pi.last_payment_error?.message ?? 'Unknown reason'
  console.warn(`[Webhook] ⚠ payment_intent.payment_failed: ${pi.id} — ${reason}`)

  await supabaseAdmin
    .from('orders')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('stripe_payment_intent_id', pi.id)
}
