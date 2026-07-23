import { NextRequest, NextResponse } from 'next/server'
import stripe from '@/app/lib/stripe/server'
import { supabaseAdmin } from '@/app/lib/supabase/admin'
import type {
  CreatePaymentIntentPayload,
  CreatePaymentIntentResponse,
  PaymentBreakdown,
} from '@/app/lib/stripe/types'

export const dynamic = 'force-dynamic'

const TAX_RATE        = 0.08
const MIN_CHARGE_CENTS = 50

export async function POST(req: NextRequest): Promise<NextResponse> {
  let payload: CreatePaymentIntentPayload

  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { items, shippingCost, currency = 'usd', contact, shipping } = payload

  if (!Array.isArray(items) || items.length === 0)
    return NextResponse.json({ error: 'Cart is empty.' }, { status: 400 })

  for (const item of items) {
    if (
      typeof item.price    !== 'number' || item.price    <= 0 ||
      typeof item.quantity !== 'number' || item.quantity  < 1 ||
      !item.productId || !item.size
    ) return NextResponse.json({ error: 'Invalid cart item.' }, { status: 400 })
  }

  /* ── Breakdown (cents) ────────────────────────────────────────── */
  const subtotalCents  = items.reduce((a, i) => a + Math.round(i.price * 100) * i.quantity, 0)
  const taxCents       = Math.round(subtotalCents * TAX_RATE)
  const shippingCents  = Math.max(0, Math.round((shippingCost ?? 0) * 100))
  const totalCents     = subtotalCents + taxCents + shippingCents

  if (totalCents < MIN_CHARGE_CENTS)
    return NextResponse.json({ error: `Minimum order is $${(MIN_CHARGE_CENTS / 100).toFixed(2)}.` }, { status: 422 })

  /* ── Stock check — verify availability before creating a payment intent ── */
  const productIds = [...new Set(items.map(i => i.productId))]
  const { data: stockRows } = await supabaseAdmin
    .from('products')
    .select('id, name, inventory, stock')
    .in('id', productIds)

  if (stockRows) {
    for (const item of items) {
      const row = stockRows.find(r => r.id === item.productId)
      if (!row) continue
      const inv   = row.inventory as Record<string, number> | null
      const avail = inv?.[item.size] ?? row.stock ?? 0
      if (avail < item.quantity) {
        const msg = avail === 0
          ? `${item.name} (${item.size}) is sold out.`
          : `Only ${avail} unit${avail === 1 ? '' : 's'} of ${item.name} (${item.size}) left in stock.`
        return NextResponse.json({ error: msg }, { status: 422 })
      }
    }
  }

  const breakdown: PaymentBreakdown = {
    subtotal: subtotalCents,
    tax:      taxCents,
    shipping: shippingCents,
    total:    totalCents,
  }

  /* ── Stripe PaymentIntent ─────────────────────────────────────── */
  let piId: string
  let clientSecret: string

  try {
    const piParams: Parameters<typeof stripe.paymentIntents.create>[0] = {
      amount:   totalCents,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        items:    JSON.stringify(items.map(i => ({ id: i.productId, qty: i.quantity, size: i.size, name: i.name }))),
        subtotal: String(subtotalCents),
        tax:      String(taxCents),
        shipping: String(shippingCents),
      },
    }

    if (contact?.email) piParams.receipt_email = contact.email

    if (shipping) {
      piParams.shipping = {
        name:    `${shipping.firstName} ${shipping.lastName}`.trim(),
        phone:   shipping.phone ?? undefined,
        address: {
          line1:       shipping.address1,
          line2:       shipping.address2 ?? undefined,
          city:        shipping.city,
          postal_code: shipping.postcode,
          country:     shipping.country.slice(0, 2).toUpperCase(),
        },
      }
    }

    const pi    = await stripe.paymentIntents.create(piParams)
    piId         = pi.id
    clientSecret = pi.client_secret!
    console.log(`[/api/checkout] ✓ PI created: ${piId} · ${currency.toUpperCase()} ${(totalCents / 100).toFixed(2)}`)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown Stripe error'
    console.error('[/api/checkout] ❌ Stripe error:', msg)
    return NextResponse.json({ error: 'Could not initialise payment. Please try again.' }, { status: 502 })
  }

  /* ── Create pending order in Supabase ─────────────────────────── */
  let orderId: string | undefined

  try {
    /* Upsert customer if email provided */
    let customerId: string | null = null
    if (contact?.email && shipping) {
      const { data: customer } = await supabaseAdmin
        .from('customers')
        .upsert(
          {
            email:     contact.email,
            full_name: `${shipping.firstName} ${shipping.lastName}`.trim(),
            phone:     shipping.phone ?? null,
          },
          { onConflict: 'email' },
        )
        .select('id')
        .single()
      customerId = customer?.id ?? null
    }

    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_id:              customerId,
        stripe_payment_intent_id: piId,
        status:                   'pending',
        total_price:              totalCents / 100,
        subtotal:                 subtotalCents / 100,
        tax:                      taxCents / 100,
        shipping_cost:            shippingCents / 100,
        shipping_email:           contact?.email  ?? null,
        shipping_full_name:       shipping ? `${shipping.firstName} ${shipping.lastName}`.trim() : null,
        shipping_address:         shipping?.address1 ?? null,
        shipping_city:            shipping?.city     ?? null,
        shipping_state:           null,
        shipping_zip:             shipping?.postcode ?? null,
        shipping_country:         shipping?.country  ?? null,
      })
      .select('id')
      .single()

    if (orderErr) {
      console.error('[/api/checkout] ⚠ Order insert failed:', orderErr.message)
    } else {
      orderId = order.id

      /* Insert order_items */
      await supabaseAdmin.from('order_items').insert(
        items.map(i => ({
          order_id:     orderId,
          product_id:   null,
          product_name: i.name,
          price:        i.price,
          quantity:     i.quantity,
          size:         i.size,
        }))
      )

      console.log(`[/api/checkout] ✓ Order saved: ${orderId}`)
    }
  } catch (err) {
    /* Non-fatal — PI is already created; order will be captured via webhook */
    console.error('[/api/checkout] ⚠ Supabase order save error:', err instanceof Error ? err.message : err)
  }

  const response: CreatePaymentIntentResponse = {
    clientSecret,
    paymentIntentId: piId,
    breakdown,
    orderId,
  }

  return NextResponse.json(response)
}
