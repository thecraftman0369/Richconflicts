'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, ShoppingBag, MessageSquare,
  ChevronDown, ChevronUp, Plus, X,
  CheckCircle2, AlertCircle, LogOut, Send,
} from 'lucide-react'
import { createClient } from '@/app/supabase/client'
import CustomerTicketChat from '@/components/CustomerTicketChat'

/* ═══════════════════════════════════════════════════════════════
 *  Types
 * ═══════════════════════════════════════════════════════════════ */

type Tab = 'profile' | 'orders' | 'support'

type ShippingAddress = {
  line1: string; line2: string
  city:  string; postcode: string; country: string
}

type Profile = {
  id:               string
  email:            string
  phone:            string
  shipping_address: ShippingAddress
}

type OrderItem = { name: string; size: string; quantity: number; price: number }

type OrderStatus =
  | 'pending' | 'paid' | 'processing'
  | 'shipped' | 'delivered' | 'cancelled' | 'refunded'

type Order = {
  id:                       string
  created_at:               string
  items:                    OrderItem[]
  total_amount:             number
  status:                   OrderStatus
  stripe_payment_intent_id?: string
}

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

type Ticket = {
  id:         string
  subject:    string
  order_id:   string | null
  status:     TicketStatus
  created_at: string
}

/* ═══════════════════════════════════════════════════════════════
 *  Mock data — replaced by Supabase queries once auth is live
 * ═══════════════════════════════════════════════════════════════ */

const MOCK_PROFILE: Profile = {
  id:    'mock-user-id',
  email: 'customer@richconflicts.com',
  phone: '+44 7700 900000',
  shipping_address: {
    line1: '14 Conflict House', line2: 'Shoreditch',
    city:  'London', postcode: 'E1 6RF', country: 'United Kingdom',
  },
}

const MOCK_ORDERS: Order[] = [
  {
    id: 'RC-A1B2C3D4', created_at: '2026-06-10T14:23:00Z',
    items: [
      { name: 'CONFLICT TEE 001', size: 'M', quantity: 1, price: 68 },
      { name: 'ARCHIVE HOODIE',   size: 'M', quantity: 1, price: 148 },
    ],
    total_amount: 237.12, status: 'delivered',
    stripe_payment_intent_id: 'pi_mock_001',
  },
  {
    id: 'RC-E5F6G7H8', created_at: '2026-06-20T09:15:00Z',
    items: [{ name: 'SIGNAL LONGSLEEVE', size: 'L', quantity: 2, price: 82 }],
    total_amount: 181.44, status: 'shipped',
    stripe_payment_intent_id: 'pi_mock_002',
  },
  {
    id: 'RC-I9J0K1L2', created_at: '2026-06-27T18:00:00Z',
    items: [{ name: 'STATIC LONGSLEEVE', size: 'S', quantity: 1, price: 78 }],
    total_amount: 96.44, status: 'processing',
    stripe_payment_intent_id: 'pi_mock_003',
  },
]

const MOCK_TICKETS: Ticket[] = [
  {
    id: 'TK-A1B2', subject: 'Order RC-A1B2C3D4 — item missing from package',
    order_id: 'RC-A1B2C3D4', status: 'open', created_at: '2026-06-25T10:00:00Z',
  },
  {
    id: 'TK-C3D4', subject: 'General inquiry — sizing for CONFLICT TEE',
    order_id: null, status: 'resolved', created_at: '2026-06-12T14:30:00Z',
  },
]

const COUNTRIES = [
  'United Kingdom', 'United States', 'Canada', 'Germany',
  'France', 'Australia', 'Japan', 'Netherlands',
]

/* ═══════════════════════════════════════════════════════════════
 *  Primitive UI atoms
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
      className="w-full bg-transparent border border-rc-border rounded-sm px-4 h-10 font-mono text-[11px] text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-500 transition-colors"
    />
  )
}

function SelectInput({
  children, ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className="w-full appearance-none bg-black border border-rc-border rounded-sm px-4 h-10 font-mono text-[11px] text-white focus:outline-none focus:border-zinc-500 transition-colors pr-10"
      >
        {children}
      </select>
      <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-rc-muted pointer-events-none" />
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="font-mono text-[9px] tracking-[0.24em] text-rc-muted">{children}</p>
      <div className="mt-2 h-px bg-rc-border" />
    </div>
  )
}

/* ─── Status badge ─── */
const STATUS_STYLES: Record<OrderStatus | TicketStatus, string> = {
  pending:     'border-zinc-700  text-zinc-500',
  paid:        'border-zinc-500  text-zinc-300',
  processing:  'border-zinc-500  text-zinc-300',
  shipped:     'border-white/40  text-white/60',
  delivered:   'border-white     text-white',
  cancelled:   'border-zinc-800  text-zinc-600',
  refunded:    'border-zinc-700  text-zinc-500',
  open:        'border-white     text-white',
  in_progress: 'border-white/50  text-white/70',
  resolved:    'border-zinc-600  text-zinc-500',
  closed:      'border-zinc-800  text-zinc-600',
}

function StatusBadge({ status }: { status: OrderStatus | TicketStatus }) {
  return (
    <span
      className={`inline-block font-mono text-[8px] tracking-[0.16em] border rounded-sm px-2 py-0.5 ${
        STATUS_STYLES[status] ?? 'border-rc-border text-rc-muted'
      }`}
    >
      {status.replace('_', ' ').toUpperCase()}
    </span>
  )
}

/* ─── Feedback banner ─── */
type FeedbackKind = 'success' | 'error'
function Feedback({ kind, message, onDismiss }: { kind: FeedbackKind; message: string; onDismiss: () => void }) {
  const Icon = kind === 'success' ? CheckCircle2 : AlertCircle
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`flex items-center gap-2.5 px-4 py-3 border rounded-sm ${
        kind === 'success'
          ? 'border-white/20 bg-white/5 text-white'
          : 'border-red-900/50 bg-red-950/20 text-red-400'
      }`}
    >
      <Icon size={12} strokeWidth={1.8} className="shrink-0" />
      <p className="font-mono text-[10px] flex-1 tracking-[0.08em]">{message}</p>
      <button onClick={onDismiss} className="text-current opacity-50 hover:opacity-100 transition-opacity">
        <X size={11} />
      </button>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════
 *  PROFILE PANEL
 * ═══════════════════════════════════════════════════════════════ */

function ProfilePanel({ userId }: { userId: string }) {
  const supabase = createClient()

  const EMPTY_ADDRESS: ShippingAddress = { line1: '', line2: '', city: '', postcode: '', country: 'United Kingdom' }
  const [form, setForm] = useState<Profile>({ ...MOCK_PROFILE, id: userId })
  const [saving, setSaving]     = useState(false)
  const [feedback, setFeedback] = useState<{ kind: FeedbackKind; msg: string } | null>(null)

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (data) {
          setForm({
            id:    data.id,
            email: data.email ?? '',
            phone: data.phone ?? '',
            shipping_address: {
              ...EMPTY_ADDRESS,
              ...(data.shipping_address ?? {}),
            },
          })
        }
      })
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  const update = <K extends keyof Profile>(field: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }))

  const updateAddress = (field: keyof ShippingAddress) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((p) => ({
        ...p,
        shipping_address: { ...p.shipping_address, [field]: e.target.value },
      }))

  const handleSave = async () => {
    setSaving(true)
    setFeedback(null)
    const { error } = await supabase.from('profiles').upsert({
      id:               userId,
      email:            form.email,
      phone:            form.phone,
      shipping_address: form.shipping_address,
    })
    setSaving(false)
    setFeedback(
      error
        ? { kind: 'error', msg: error.message }
        : { kind: 'success', msg: 'Profile saved successfully.' },
    )
  }

  return (
    <div className="max-w-lg space-y-8">
      <AnimatePresence>
        {feedback && (
          <Feedback kind={feedback.kind} message={feedback.msg} onDismiss={() => setFeedback(null)} />
        )}
      </AnimatePresence>

      {/* Account details */}
      <div>
        <SectionTitle>ACCOUNT DETAILS</SectionTitle>
        <div className="space-y-3">
          <div>
            <FieldLabel>Email Address</FieldLabel>
            <TextInput type="email" value={form.email} onChange={update('email')} autoComplete="email" />
          </div>
          <div>
            <FieldLabel>Phone Number</FieldLabel>
            <TextInput type="tel" value={form.phone ?? ''} onChange={update('phone')} placeholder="+44 7700 900000" autoComplete="tel" />
          </div>
        </div>
      </div>

      {/* Default shipping address */}
      <div>
        <SectionTitle>DEFAULT SHIPPING ADDRESS</SectionTitle>
        <div className="space-y-3">
          <div>
            <FieldLabel>Address Line 1</FieldLabel>
            <TextInput value={form.shipping_address.line1} onChange={updateAddress('line1')} autoComplete="address-line1" />
          </div>
          <div>
            <FieldLabel>Address Line 2</FieldLabel>
            <TextInput value={form.shipping_address.line2} onChange={updateAddress('line2')} autoComplete="address-line2" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>City</FieldLabel>
              <TextInput value={form.shipping_address.city} onChange={updateAddress('city')} autoComplete="address-level2" />
            </div>
            <div>
              <FieldLabel>Postcode</FieldLabel>
              <TextInput value={form.shipping_address.postcode} onChange={updateAddress('postcode')} autoComplete="postal-code" />
            </div>
          </div>
          <div>
            <FieldLabel>Country</FieldLabel>
            <SelectInput value={form.shipping_address.country} onChange={updateAddress('country')}>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </SelectInput>
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="h-10 px-8 bg-white text-black font-mono text-[10px] tracking-[0.22em] rounded-sm hover:bg-zinc-100 transition-colors disabled:opacity-50"
      >
        {saving ? 'SAVING...' : 'SAVE CHANGES'}
      </button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
 *  ORDERS LEDGER
 * ═══════════════════════════════════════════════════════════════ */

function ReturnForm({
  order,
  userId,
  onClose,
}: {
  order: Order
  userId: string
  onClose: () => void
}) {
  const supabase = createClient()
  const [body, setBody]         = useState('')
  const [submitting, setSub]    = useState(false)
  const [done, setDone]         = useState(false)
  const [submitError, setErr]   = useState(false)

  const handleSubmit = async () => {
    if (!body.trim()) return
    setSub(true)
    setErr(false)

    const { data: { session } } = await supabase.auth.getSession()
    const res = session
      ? await fetch('/api/tickets/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            subject: `Return/Refund — Order ${order.id}`,
            orderId: order.id,
            initialMessage: body.trim(),
          }),
        })
      : null

    setSub(false)
    if (res?.ok) setDone(true)
    else setErr(true)
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-2 py-4"
      >
        <CheckCircle2 size={12} className="text-white shrink-0" />
        <p className="font-mono text-[10px] text-white tracking-[0.1em]">
          Support ticket raised — our team will contact you within 48 hours.
        </p>
        <button onClick={onClose} className="ml-auto text-rc-muted hover:text-white transition-colors">
          <X size={12} />
        </button>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="pt-4 space-y-3">
        <div>
          <FieldLabel>Describe your issue</FieldLabel>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="e.g. Wrong size received, item damaged, order not arrived…"
            className="w-full bg-transparent border border-rc-border rounded-sm px-4 py-3 font-mono text-[11px] text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-500 transition-colors resize-none leading-relaxed"
          />
        </div>
        {submitError && (
          <p className="font-mono text-[9px] text-red-400 tracking-[0.1em]">
            FAILED TO SUBMIT — PLEASE TRY AGAIN
          </p>
        )}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={!body.trim() || submitting}
            className="h-9 px-5 bg-white text-black font-mono text-[9px] tracking-[0.2em] rounded-sm hover:bg-zinc-100 transition-colors disabled:opacity-50"
          >
            {submitting ? 'SENDING...' : 'SUBMIT REQUEST'}
          </button>
          <button
            onClick={onClose}
            className="h-9 px-4 border border-rc-border text-rc-muted font-mono text-[9px] tracking-[0.2em] rounded-sm hover:border-zinc-500 hover:text-white transition-colors"
          >
            CANCEL
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function OrderRow({ order, userId }: { order: Order; userId: string }) {
  const [expanded, setExpanded]   = useState(false)
  const [showReturn, setReturn]   = useState(false)

  const date = new Date(order.created_at).toLocaleDateString([], {
    day: '2-digit', month: 'short', year: 'numeric',
  })

  const canReturn = ['delivered', 'shipped'].includes(order.status)

  return (
    <div className="border border-rc-border rounded-sm overflow-hidden">
      {/* Row header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors text-left"
      >
        <div className="flex-1 grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5 sm:grid-cols-[120px_1fr_80px_100px_auto] items-center">
          <p className="font-mono text-[10px] text-white tracking-[0.1em]">{order.id}</p>
          <p className="font-mono text-[9px] text-rc-muted hidden sm:block">{date}</p>
          <p className="font-mono text-[10px] text-white hidden sm:block">
            ${order.total_amount.toFixed(2)}
          </p>
          <div className="hidden sm:block"><StatusBadge status={order.status} /></div>
          <p className="font-mono text-[9px] text-rc-muted sm:hidden">{date}</p>
        </div>
        {expanded
          ? <ChevronUp size={12} className="text-rc-muted shrink-0" />
          : <ChevronDown size={12} className="text-rc-muted shrink-0" />
        }
      </button>

      {/* Expanded detail */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="border-t border-rc-border px-5 py-4 space-y-4">

              {/* Mobile total + status */}
              <div className="flex items-center justify-between sm:hidden">
                <p className="font-mono text-[11px] text-white">${order.total_amount.toFixed(2)}</p>
                <StatusBadge status={order.status} />
              </div>

              {/* Line items */}
              <ul className="space-y-2">
                {order.items.map((item, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-10 bg-zinc-900 border border-rc-border rounded-sm flex items-center justify-center shrink-0">
                        <span className="font-display text-xs text-zinc-700">RC</span>
                      </div>
                      <div>
                        <p className="font-mono text-[10px] text-white">{item.name}</p>
                        <p className="font-mono text-[8px] text-rc-muted tracking-[0.1em]">
                          SIZE {item.size} · QTY {item.quantity}
                        </p>
                      </div>
                    </div>
                    <p className="font-mono text-[11px] text-white shrink-0">
                      ${(item.price * item.quantity).toFixed(0)}
                    </p>
                  </li>
                ))}
              </ul>

              {/* Return/refund CTA */}
              <div className="pt-1">
                {!showReturn ? (
                  <button
                    onClick={() => setReturn(true)}
                    className={`h-9 px-4 border font-mono text-[9px] tracking-[0.18em] rounded-sm transition-colors ${
                      canReturn
                        ? 'border-white text-white hover:bg-white hover:text-black'
                        : 'border-rc-border text-rc-muted cursor-not-allowed opacity-50'
                    }`}
                    disabled={!canReturn}
                    title={!canReturn ? 'Returns available on delivered and shipped orders only' : undefined}
                  >
                    REQUEST RETURN / REFUND OR COMPLAIN
                  </button>
                ) : (
                  <ReturnForm
                    order={order}
                    userId={userId}
                    onClose={() => { setReturn(false) }}
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function OrdersLedger({ userId }: { userId: string }) {
  const supabase = createClient()
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS)

  useEffect(() => {
    supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) setOrders(data as Order[])
      })
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (orders.length === 0) {
    return (
      <div className="py-16 text-center">
        <ShoppingBag size={32} strokeWidth={1} className="text-zinc-800 mx-auto mb-4" />
        <p className="font-mono text-[10px] text-rc-muted tracking-[0.2em]">NO ORDERS YET.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Table header (desktop) */}
      <div className="hidden sm:grid grid-cols-[120px_1fr_80px_100px_20px] gap-4 px-5 pb-2 border-b border-rc-border">
        {['ORDER', 'DATE', 'TOTAL', 'STATUS', ''].map((h) => (
          <p key={h} className="font-mono text-[8px] tracking-[0.22em] text-rc-muted">{h}</p>
        ))}
      </div>
      {orders.map((order) => (
        <OrderRow key={order.id} order={order} userId={userId} />
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
 *  SUPPORT HUB
 * ═══════════════════════════════════════════════════════════════ */

/* Chat-style new conversation panel — shown on the right when composing */
function NewConversation({
  userId,
  onCreated,
  onCancel,
}: {
  userId: string
  onCreated: (t: Ticket) => void
  onCancel: () => void
}) {
  const supabase  = createClient()
  const inputRef  = useRef<HTMLTextAreaElement>(null)
  const [msg, setMsg]         = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError]     = useState(false)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleSend = async () => {
    const text = msg.trim()
    if (!text || sending) return
    setSending(true)
    setError(false)

    const subject = text.length > 60 ? text.slice(0, 57) + '…' : text

    const { data: { session } } = await supabase.auth.getSession()
    const res = session
      ? await fetch('/api/tickets/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ subject, initialMessage: text }),
        })
      : null

    setSending(false)
    if (res?.ok) {
      const { ticket } = await res.json()
      onCreated(ticket as Ticket)
    } else {
      setError(true)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div className="flex flex-col h-full border border-rc-border rounded-sm overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 h-12 border-b border-rc-border bg-rc-subtle">
        <p className="font-mono text-[10px] text-white tracking-[0.18em]">NEW CONVERSATION</p>
        <button onClick={onCancel} className="font-mono text-[9px] text-rc-muted hover:text-white transition-colors tracking-[0.14em]">
          CANCEL
        </button>
      </div>

      {/* Prompt area */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-xs">
          <p className="font-display text-2xl text-white mb-2">How can we help?</p>
          <p className="font-mono text-[10px] text-rc-muted leading-relaxed">
            Describe your issue below and a Rich Conflicts representative will respond shortly.
          </p>
        </div>
      </div>

      {/* Input bar */}
      <div className="shrink-0 border-t border-rc-border p-3">
        {error && (
          <p className="font-mono text-[8px] text-red-400 tracking-[0.1em] mb-2">
            FAILED TO SEND — PLEASE TRY AGAIN
          </p>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={msg}
            onChange={e => setMsg(e.target.value)}
            onKeyDown={handleKey}
            disabled={sending}
            rows={2}
            placeholder="Type your message…"
            className="flex-1 resize-none bg-transparent border border-rc-border rounded-sm px-3 py-2.5 font-mono text-[11px] text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-500 transition-colors leading-relaxed"
            style={{ maxHeight: '96px', overflowY: 'auto' }}
          />
          <button
            onClick={handleSend}
            disabled={!msg.trim() || sending}
            className="shrink-0 w-9 h-9 flex items-center justify-center bg-white text-black rounded-sm hover:bg-zinc-100 transition-colors disabled:opacity-40"
          >
            <Send size={13} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  )
}

type TicketSection = { label: string; statuses: TicketStatus[]; emptyText: string }

const TICKET_SECTIONS: TicketSection[] = [
  { label: 'UNREAD',      statuses: ['open'],              emptyText: 'No unread cases'     },
  { label: 'IN PROGRESS', statuses: ['in_progress'],       emptyText: 'Nothing in progress' },
  { label: 'COMPLETE',    statuses: ['resolved', 'closed'], emptyText: 'No completed cases' },
]

function TicketSectionGroup({
  section,
  tickets,
  active,
  composing,
  onSelect,
}: {
  section: TicketSection
  tickets: Ticket[]
  active: Ticket | null
  composing: boolean
  onSelect: (t: Ticket) => void
}) {
  const [collapsed, setCollapsed] = useState(section.label === 'COMPLETE')
  const matching = tickets.filter(t => section.statuses.includes(t.status))

  return (
    <li>
      {/* Section header */}
      <button
        onClick={() => setCollapsed(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
      >
        <span className="font-mono text-[8px] tracking-[0.22em] text-rc-muted">{section.label}</span>
        <span className="font-mono text-[7px] text-zinc-700">{matching.length}</span>
      </button>

      {!collapsed && (
        <ul className="divide-y divide-rc-border">
          {matching.length === 0 ? (
            <li className="px-4 py-3">
              <p className="font-mono text-[9px] text-zinc-700 tracking-[0.1em]">{section.emptyText}</p>
            </li>
          ) : (
            matching.map(ticket => (
              <li key={ticket.id}>
                <button
                  onClick={() => onSelect(ticket)}
                  className={`w-full text-left px-4 py-3.5 transition-colors ${
                    !composing && active?.id === ticket.id
                      ? 'bg-white/[0.04]'
                      : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className={`font-mono text-[10px] leading-snug line-clamp-2 ${
                      section.label === 'COMPLETE' ? 'text-rc-muted' : 'text-white'
                    }`}>
                      {ticket.subject}
                    </p>
                    {!composing && active?.id === ticket.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0 mt-1" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={ticket.status} />
                    <span className="font-mono text-[7px] text-zinc-700">
                      {new Date(ticket.created_at).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </li>
  )
}

function SupportHub({ userId }: { userId: string }) {
  const supabase = createClient()
  const [tickets, setTickets]         = useState<Ticket[]>([])
  const [active, setActive]           = useState<Ticket | null>(null)
  const [loadingTickets, setLoadingT] = useState(true)
  const [composing, setComposing]     = useState(false)

  useEffect(() => {
    supabase
      .from('tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const t = (data ?? []) as Ticket[]
        setTickets(t)
        // Auto-open the most recent non-complete ticket
        const firstActive = t.find(tk => tk.status === 'open' || tk.status === 'in_progress')
        setActive(firstActive ?? t[0] ?? null)
        setLoadingT(false)
      })

    // Real-time: reflect admin status changes instantly
    const ch = supabase
      .channel('dashboard-tickets')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tickets', filter: `user_id=eq.${userId}` },
        payload => {
          setTickets(prev => prev.map(t => t.id === payload.new.id ? { ...t, ...(payload.new as Ticket) } : t))
          setActive(prev => prev?.id === payload.new.id ? { ...prev, ...(payload.new as Ticket) } : prev)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreated = (ticket: Ticket) => {
    setTickets((prev) => [ticket, ...prev])
    setActive(ticket)
    setComposing(false)
  }

  const rightPanel = () => {
    if (composing) {
      return (
        <NewConversation
          userId={userId}
          onCreated={handleCreated}
          onCancel={() => setComposing(false)}
        />
      )
    }
    if (active) {
      return (
        <CustomerTicketChat
          key={active.id}
          ticketId={active.id}
          ticketSubject={active.subject}
          userId={userId}
          isClosed={active.status === 'closed' || active.status === 'resolved'}
        />
      )
    }
    return (
      <div className="h-full border border-rc-border rounded-sm flex flex-col items-center justify-center gap-4">
        <p className="font-mono text-[10px] text-rc-muted tracking-[0.18em]">
          {loadingTickets ? 'LOADING YOUR CASES…' : 'START A CONVERSATION TO GET HELP'}
        </p>
        {!loadingTickets && (
          <button
            onClick={() => setComposing(true)}
            className="h-8 px-4 border border-rc-border text-rc-muted font-mono text-[8px] tracking-[0.14em] rounded-sm hover:border-zinc-500 hover:text-white transition-colors"
          >
            + NEW MESSAGE
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 h-[580px]">

      {/* ── Left: sectioned ticket list ── */}
      <div className="flex flex-col border border-rc-border rounded-sm overflow-hidden">
        {/* List header */}
        <div className="shrink-0 flex items-center justify-between px-4 h-12 border-b border-rc-border bg-rc-subtle">
          <p className="font-mono text-[9px] tracking-[0.2em] text-white">CASES</p>
          <button
            onClick={() => { setComposing(true); setActive(null) }}
            className="flex items-center gap-1 h-7 px-2.5 border border-rc-border rounded-sm font-mono text-[8px] tracking-[0.14em] text-rc-muted hover:border-zinc-500 hover:text-white transition-colors"
          >
            <Plus size={9} />
            NEW
          </button>
        </div>

        {/* Ticket sections */}
        <ul className="flex-1 overflow-y-auto scrollbar-none divide-y divide-rc-border">
          {loadingTickets ? (
            <li className="px-4 py-6 text-center">
              <p className="font-mono text-[9px] text-rc-muted tracking-[0.14em]">LOADING…</p>
            </li>
          ) : (
            <>
              {composing && (
                <li className="px-4 py-3 bg-white/[0.04] border-l-2 border-white">
                  <p className="font-mono text-[10px] text-white">New conversation</p>
                  <p className="font-mono text-[8px] text-rc-muted mt-0.5">Composing…</p>
                </li>
              )}
              {tickets.length === 0 && !composing ? (
                <li className="px-4 py-8 text-center">
                  <p className="font-mono text-[9px] text-rc-muted tracking-[0.14em] mb-3">NO CASES YET</p>
                  <button
                    onClick={() => setComposing(true)}
                    className="font-mono text-[9px] text-white underline underline-offset-2 tracking-[0.14em]"
                  >
                    START A CONVERSATION
                  </button>
                </li>
              ) : (
                TICKET_SECTIONS.map(section => (
                  <TicketSectionGroup
                    key={section.label}
                    section={section}
                    tickets={tickets}
                    active={active}
                    composing={composing}
                    onSelect={t => { setActive(t); setComposing(false) }}
                  />
                ))
              )}
            </>
          )}
        </ul>
      </div>

      {/* ── Right panel ── */}
      <div className="min-h-0">
        {rightPanel()}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
 *  MAIN DASHBOARD PAGE
 * ═══════════════════════════════════════════════════════════════ */

const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: 'profile', label: 'PROFILE',   Icon: User          },
  { id: 'orders',  label: 'PURCHASES', Icon: ShoppingBag   },
  { id: 'support', label: 'SUPPORT',   Icon: MessageSquare },
]

export default function DashboardPage() {
  const router = useRouter()
  const [tab, setTab]       = useState<Tab>('profile')
  const [userId, setUserId] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace('/auth/login')
      } else if (data.user.app_metadata?.role === 'master_admin') {
        router.replace('/rc-admin-2024')
      } else {
        setUserId(data.user.id)
      }
      setAuthLoading(false)
    })
  }, [router])

  if (authLoading) {
    return (
      <div className="pt-14 min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  if (!userId) return null

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="pt-14 min-h-screen">

      {/* Page header */}
      <div className="border-b border-rc-border">
        <div className="max-w-[1100px] mx-auto px-5 py-6 flex items-end justify-between">
          <div>
            <p className="font-mono text-[8px] tracking-[0.28em] text-rc-muted mb-1">ACCOUNT</p>
            <h1 className="font-display text-5xl text-white leading-none">DASHBOARD</h1>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 h-9 px-4 border border-rc-border text-rc-muted font-mono text-[9px] tracking-[0.18em] rounded-sm hover:border-zinc-500 hover:text-white transition-colors"
          >
            <LogOut size={11} strokeWidth={1.8} />
            SIGN OUT
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b border-rc-border sticky top-14 z-20 bg-black">
        <div className="max-w-[1100px] mx-auto px-5 flex items-end gap-0">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`relative flex items-center gap-2 h-12 px-5 font-mono text-[9px] tracking-[0.2em] transition-colors border-b-2 ${
                tab === id
                  ? 'text-white border-white'
                  : 'text-rc-muted border-transparent hover:text-zinc-400'
              }`}
            >
              <Icon size={11} strokeWidth={1.8} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-[1100px] mx-auto px-5 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 'profile' && <ProfilePanel userId={userId} />}
            {tab === 'orders'  && <OrdersLedger userId={userId} />}
            {tab === 'support' && <SupportHub   userId={userId} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
