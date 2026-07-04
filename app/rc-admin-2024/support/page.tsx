'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import {
  Send, MessageSquare, CheckCircle, Circle, Clock,
  User, ShoppingBag, Mail, Phone, MapPin,
  UserX, Loader2, RotateCcw, ArrowLeft, Eye, EyeOff,
} from 'lucide-react'
import { maskEmail } from '@/app/lib/utils'
import { createClient } from '@/app/supabase/client'

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

type Ticket = {
  id: string
  subject: string
  status: TicketStatus
  user_id: string | null
  created_at: string
  preview?: string
}

type Message = {
  id: string
  ticket_id: string
  user_id: string | null
  body: string
  is_admin: boolean
  created_at: string
}

type CustomerOrder = {
  id: string
  status: string
  total_price: number | null
  created_at: string
  shipping_full_name: string | null
  tracking_number: string | null
  carrier: string | null
}

type CustomerProfile = {
  profile: {
    full_name: string | null
    email: string | null
    phone: string | null
    shipping_address: {
      line1?: string; line2?: string; city?: string; postcode?: string; country?: string
    } | null
    created_at: string
  } | null
  authEmail: string | null
  authCreatedAt: string | null
  orders: CustomerOrder[]
  totalSpend: number
  ticketCount: number
}

/* ── status pill ── */
function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid:       'text-emerald-400 bg-emerald-950/40',
    delivered:  'text-emerald-400 bg-emerald-950/40',
    shipped:    'text-blue-400 bg-blue-950/40',
    processing: 'text-yellow-400 bg-yellow-950/30',
    pending:    'text-yellow-400 bg-yellow-950/30',
    cancelled:  'text-red-400 bg-red-950/30',
  }
  return (
    <span className={`font-mono text-[7px] tracking-[0.1em] px-1.5 py-0.5 rounded-sm ${map[status] ?? 'text-zinc-500 bg-zinc-900'}`}>
      {status.toUpperCase()}
    </span>
  )
}

/* ── customer profile panel ── */
function CustomerPanel({ ticket, token }: { ticket: Ticket; token: string | null }) {
  const [data,          setData]          = useState<CustomerProfile | null>(null)
  const [loading,       setLoading]       = useState(false)
  const [emailRevealed, setEmailRevealed] = useState(false)

  const fetchProfile = useCallback(async () => {
    if (!ticket.user_id || !token) return
    setLoading(true)
    const res = await fetch(`/api/admin/customer?userId=${ticket.user_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) setData(await res.json())
    setLoading(false)
  }, [ticket.user_id, token])

  useEffect(() => {
    setData(null)
    fetchProfile()
  }, [fetchProfile])

  /* ── GUEST ── */
  if (!ticket.user_id) {
    return (
      <div className="w-72 shrink-0 border-l border-rc-border flex flex-col bg-black">
        <div className="px-5 py-4 border-b border-rc-border">
          <p className="font-mono text-[8px] tracking-[0.25em] text-rc-muted">CUSTOMER</p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-5 gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center">
            <UserX size={18} className="text-zinc-500" strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-mono text-[10px] text-white tracking-[0.14em]">GUEST VISITOR</p>
            <p className="font-mono text-[9px] text-rc-muted mt-1 leading-relaxed">
              No account — customer is not registered
            </p>
          </div>
          <span className="font-mono text-[8px] tracking-[0.1em] px-2 py-1 border border-zinc-700 text-zinc-500 rounded-sm">
            NO PROFILE
          </span>
        </div>
      </div>
    )
  }

  /* ── LOADING ── */
  if (loading || !data) {
    return (
      <div className="w-72 shrink-0 border-l border-rc-border flex flex-col bg-black">
        <div className="px-5 py-4 border-b border-rc-border">
          <p className="font-mono text-[8px] tracking-[0.25em] text-rc-muted">CUSTOMER</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-4 h-4 border border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  const name     = data.profile?.full_name || null
  const email    = data.profile?.email || data.authEmail || null
  const phone    = data.profile?.phone || null
  const address  = data.profile?.shipping_address
  const joined   = data.authCreatedAt
    ? new Date(data.authCreatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : null
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : email?.[0]?.toUpperCase() ?? '?'

  return (
    <div className="w-72 shrink-0 border-l border-rc-border flex flex-col bg-black overflow-y-auto">

      {/* Header */}
      <div className="px-5 py-4 border-b border-rc-border shrink-0">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[8px] tracking-[0.25em] text-rc-muted">CUSTOMER</p>
          <span className="font-mono text-[7px] tracking-[0.1em] text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded-sm">
            REGISTERED
          </span>
        </div>
      </div>

      {/* Avatar + identity */}
      <div className="px-5 py-5 border-b border-rc-border shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shrink-0">
            <span className="font-display text-lg leading-none">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="font-mono text-[11px] text-white truncate">{name ?? 'No name on file'}</p>
            {joined && (
              <p className="font-mono text-[8px] text-rc-muted mt-0.5">Joined {joined}</p>
            )}
          </div>
        </div>

        {/* Contact */}
        <div className="space-y-2">
          {email && (
            <div className="flex items-start gap-2">
              <Mail size={10} className="text-rc-muted shrink-0 mt-0.5" strokeWidth={1.5} />
              <button
                onClick={() => setEmailRevealed(v => !v)}
                className="flex items-center gap-1.5 font-mono text-[9px] text-white break-all leading-snug hover:text-white/70 transition-colors text-left group"
              >
                {emailRevealed ? email : maskEmail(email)}
                {emailRevealed
                  ? <EyeOff size={9} className="shrink-0 text-rc-muted" />
                  : <Eye size={9} className="shrink-0 text-rc-muted opacity-50 group-hover:opacity-100" />
                }
              </button>
            </div>
          )}
          {phone && (
            <div className="flex items-center gap-2">
              <Phone size={10} className="text-rc-muted shrink-0" strokeWidth={1.5} />
              <span className="font-mono text-[9px] text-white">{phone}</span>
            </div>
          )}
          {address && (address.line1 || address.city) && (
            <div className="flex items-start gap-2">
              <MapPin size={10} className="text-rc-muted shrink-0 mt-0.5" strokeWidth={1.5} />
              <span className="font-mono text-[9px] text-white leading-relaxed">
                {[address.line1, address.line2, address.city, address.postcode, address.country]
                  .filter(Boolean).join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 border-b border-rc-border shrink-0">
        <div className="px-5 py-3 border-r border-rc-border">
          <p className="font-mono text-[7px] text-rc-muted tracking-[0.15em] mb-1">ORDERS</p>
          <p className="font-display text-xl text-white">{data.orders.length >= 5 ? '5+' : data.orders.length}</p>
        </div>
        <div className="px-5 py-3">
          <p className="font-mono text-[7px] text-rc-muted tracking-[0.15em] mb-1">TOTAL SPEND</p>
          <p className="font-display text-xl text-white">${data.totalSpend.toFixed(0)}</p>
        </div>
      </div>

      {/* Recent orders */}
      <div className="shrink-0">
        <div className="px-5 py-3 border-b border-rc-border">
          <div className="flex items-center gap-1.5">
            <ShoppingBag size={9} className="text-rc-muted" />
            <p className="font-mono text-[8px] tracking-[0.2em] text-rc-muted">RECENT ORDERS</p>
          </div>
        </div>
        {data.orders.length === 0 ? (
          <div className="px-5 py-4">
            <p className="font-mono text-[9px] text-rc-muted">No orders yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-rc-border">
            {data.orders.map(o => (
              <div key={o.id} className="px-5 py-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-mono text-[9px] text-white truncate">
                    #{o.id.slice(0, 8).toUpperCase()}
                  </span>
                  <StatusPill status={o.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[8px] text-rc-muted">
                    {new Date(o.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </span>
                  {o.total_price != null && (
                    <span className="font-mono text-[9px] text-white">${o.total_price.toFixed(2)}</span>
                  )}
                </div>
                {o.tracking_number && (
                  <p className="font-mono text-[7px] text-rc-muted mt-1 truncate">
                    {o.carrier ? `${o.carrier} · ` : ''}{o.tracking_number}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Support history */}
      <div className="px-5 py-3 border-t border-rc-border mt-auto shrink-0">
        <div className="flex items-center gap-1.5">
          <MessageSquare size={9} className="text-rc-muted" />
          <p className="font-mono text-[8px] tracking-[0.2em] text-rc-muted">
            {data.ticketCount} TICKET{data.ticketCount !== 1 ? 'S' : ''} OPENED
          </p>
        </div>
      </div>

    </div>
  )
}

/* ══════════════════════════════════════════════════════ */

export default function SupportPage() {
  const supabase = createClient()

  const [tickets,    setTickets]    = useState<Ticket[]>([])
  const [active,     setActive]     = useState<Ticket | null>(null)
  const [messages,   setMessages]   = useState<Message[]>([])
  const [reply,      setReply]      = useState('')
  const [loading,    setLoading]    = useState(true)
  const [sending,    setSending]    = useState(false)
  const [adminId,    setAdminId]    = useState<string | null>(null)
  const [token,      setToken]      = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')
  const bottomRef = useRef<HTMLDivElement>(null)

  const openTicket = (t: Ticket) => { setActive(t); setMobileView('chat') }
  const backToList = () => { setActive(null); setMobileView('list') }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAdminId(session?.user?.id ?? null)
      setToken(session?.access_token ?? null)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data: ticketData } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false })

      if (!ticketData) { setLoading(false); return }

      const enriched = await Promise.all(
        (ticketData as Ticket[]).map(async (t) => {
          const { data: msgs } = await supabase
            .from('ticket_messages')
            .select('body')
            .eq('ticket_id', t.id)
            .eq('is_admin', false)
            .order('created_at', { ascending: true })
            .limit(1)
          return { ...t, preview: msgs?.[0]?.body ?? '' }
        })
      )

      setTickets(enriched)
      setLoading(false)
    }

    load()

    const ch = supabase.channel('admin-tickets')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tickets' },
        payload => setTickets(prev => [payload.new as Ticket, ...prev]))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tickets' },
        payload => setTickets(prev => prev.map(t =>
          t.id === payload.new.id ? { ...t, ...(payload.new as Ticket) } : t)))
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!active) return
    setMessages([])

    supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', active.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => setMessages((data ?? []) as Message[]))

    const ch = supabase.channel(`admin-ticket-${active.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'ticket_messages',
        filter: `ticket_id=eq.${active.id}`,
      }, payload => {
        const msg = payload.new as Message
        setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
        setTickets(prev => prev.map(t =>
          t.id === msg.ticket_id && !msg.is_admin ? { ...t, preview: msg.body } : t))
      })
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [active?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendReply = async () => {
    if (!reply.trim() || !active) return
    setSending(true)
    const body = reply.trim()
    setReply('')
    await supabase.from('ticket_messages').insert({
      ticket_id: active.id,
      user_id:   adminId,
      body,
      is_admin:  true,
    })
    setSending(false)
  }

  const setStatus = async (ticket: Ticket, next: TicketStatus) => {
    await supabase
      .from('tickets')
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq('id', ticket.id)
    setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status: next } : t))
    if (active?.id === ticket.id) setActive(a => a ? { ...a, status: next } : a)
  }

  const openCount = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length

  return (
    <div className="flex h-[100dvh] overflow-hidden">

      {/* ── Ticket list ── */}
      <div className={`${mobileView === 'list' ? 'flex' : 'hidden'} md:flex w-full md:w-80 shrink-0 border-r border-rc-border flex-col bg-black`}>
        <div className="px-6 py-5 border-b border-rc-border shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-[8px] tracking-[0.25em] text-rc-muted mb-1">MASTER ADMIN</p>
              <h1 className="font-display text-2xl text-white">SUPPORT</h1>
            </div>
            {openCount > 0 && (
              <span className="font-mono text-[8px] tracking-[0.1em] text-black bg-white px-2 py-0.5 rounded-sm">
                {openCount} OPEN
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-24">
              <div className="w-4 h-4 border border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <MessageSquare size={20} className="text-rc-muted mx-auto mb-3" strokeWidth={1} />
              <p className="font-mono text-[9px] text-rc-muted tracking-[0.14em]">NO TICKETS YET</p>
            </div>
          ) : (
            <>
              {(
                [
                  { label: 'UNREAD',      dot: 'bg-emerald-400', statuses: ['open'] as TicketStatus[] },
                  { label: 'IN PROGRESS', dot: 'bg-amber-400',   statuses: ['in_progress'] as TicketStatus[] },
                  { label: 'COMPLETE',    dot: 'bg-zinc-600',    statuses: ['resolved', 'closed'] as TicketStatus[] },
                ] as const
              ).map(section => {
                const group = tickets.filter(t => section.statuses.includes(t.status))
                return (
                  <div key={section.label}>
                    {/* Section header */}
                    <div className="flex items-center justify-between px-6 py-2 bg-white/[0.02] border-b border-rc-border sticky top-0 z-10">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${section.dot}`} />
                        <span className="font-mono text-[8px] tracking-[0.2em] text-rc-muted">{section.label}</span>
                      </div>
                      <span className="font-mono text-[8px] text-zinc-700">{group.length}</span>
                    </div>

                    {group.length === 0 ? (
                      <div className="px-6 py-3 border-b border-rc-border">
                        <p className="font-mono text-[8px] text-zinc-700 tracking-[0.1em]">None</p>
                      </div>
                    ) : group.map(t => (
                      <button
                        key={t.id}
                        onClick={() => openTicket(t)}
                        className={`w-full text-left px-6 py-4 border-b border-rc-border transition-colors ${
                          active?.id === t.id
                            ? 'bg-white/[0.06] border-l-2 border-l-white'
                            : 'hover:bg-white/[0.02]'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 mb-1.5">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              {t.user_id ? (
                                <User size={8} className="text-zinc-500 shrink-0" />
                              ) : (
                                <UserX size={8} className="text-zinc-600 shrink-0" />
                              )}
                              <p className="font-mono text-[7px] text-zinc-500 tracking-[0.1em]">
                                {t.user_id ? 'REGISTERED' : 'GUEST'}
                              </p>
                            </div>
                            <p className={`font-mono text-[10px] leading-snug line-clamp-1 ${
                              section.label === 'COMPLETE' ? 'text-rc-muted' : 'text-white'
                            }`}>
                              {t.subject || '(No subject)'}
                            </p>
                          </div>
                        </div>
                        {t.preview && (
                          <p className="font-mono text-[9px] text-rc-muted leading-relaxed line-clamp-2 mb-1.5">
                            {t.preview}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <Clock size={8} className="text-zinc-600" />
                          <span className="font-mono text-[8px] text-zinc-600">
                            {new Date(t.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )
              })}
            </>
          )}
        </div>
      </div>

      {/* ── Main area ── */}
      {!active ? (
        <div className="hidden md:flex flex-1 items-center justify-center bg-black">
          <div className="text-center">
            <MessageSquare size={32} className="text-zinc-700 mx-auto mb-4" strokeWidth={1} />
            <p className="font-mono text-[10px] text-rc-muted tracking-[0.2em]">SELECT A TICKET TO VIEW CONVERSATION</p>
          </div>
        </div>
      ) : (
        <div className={`${mobileView === 'chat' ? 'flex' : 'hidden'} md:flex flex-1 min-w-0`}>

          {/* Chat */}
          <div className="flex-1 flex flex-col min-w-0">

            {/* Chat header */}
            <div className="px-4 md:px-6 py-4 border-b border-rc-border flex items-center gap-3 shrink-0">
              {/* Back — mobile only */}
              <button
                onClick={backToList}
                className="md:hidden shrink-0 p-1 -ml-1 text-rc-muted hover:text-white transition-colors"
                aria-label="Back to tickets"
              >
                <ArrowLeft size={16} strokeWidth={1.5} />
              </button>

              <div className="min-w-0 flex-1">
                <p className="font-mono text-[11px] text-white truncate">{active.subject || '(No subject)'}</p>
                <p className="font-mono text-[8px] text-rc-muted mt-0.5">
                  Opened {new Date(active.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>

              {/* Status buttons — icon-only on mobile, icon+label on desktop */}
              <div className="shrink-0 flex items-center gap-2">
                {active.status === 'open' && (
                  <button
                    onClick={() => setStatus(active, 'in_progress')}
                    title="Mark In Progress"
                    className="flex items-center gap-1.5 font-mono text-[8px] tracking-[0.12em] border border-amber-800 text-amber-400 px-2 md:px-3 py-1.5 rounded-sm hover:bg-amber-950/30 transition-colors"
                  >
                    <Loader2 size={10} />
                    <span className="hidden md:inline">IN PROCESS</span>
                  </button>
                )}
                {(active.status === 'open' || active.status === 'in_progress') && (
                  <button
                    onClick={() => setStatus(active, 'resolved')}
                    title="Mark Complete"
                    className="flex items-center gap-1.5 font-mono text-[8px] tracking-[0.12em] border border-emerald-900 text-emerald-400 px-2 md:px-3 py-1.5 rounded-sm hover:bg-emerald-950/30 transition-colors"
                  >
                    <CheckCircle size={10} />
                    <span className="hidden md:inline">COMPLETE</span>
                  </button>
                )}
                {(active.status === 'resolved' || active.status === 'closed') && (
                  <button
                    onClick={() => setStatus(active, 'open')}
                    title="Reopen"
                    className="flex items-center gap-1.5 font-mono text-[8px] tracking-[0.12em] border border-zinc-700 text-zinc-400 px-2 md:px-3 py-1.5 rounded-sm hover:text-white hover:border-zinc-500 transition-colors"
                  >
                    <RotateCcw size={10} />
                    <span className="hidden md:inline">REOPEN</span>
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6 space-y-5">
              {messages.length === 0 && (
                <p className="font-mono text-[9px] text-rc-muted text-center pt-8">No messages yet.</p>
              )}
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.is_admin ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[65%]">
                    <div className={`rounded-sm px-4 py-3 ${
                      msg.is_admin
                        ? 'bg-white text-black'
                        : 'bg-zinc-800 border border-zinc-700 text-white'
                    }`}>
                      <p className="font-mono text-[11px] leading-relaxed">{msg.body}</p>
                    </div>
                    <p className={`font-mono text-[7px] mt-1.5 tracking-[0.1em] ${
                      msg.is_admin ? 'text-right text-zinc-500' : 'text-zinc-500'
                    }`}>
                      {msg.is_admin ? 'RC SUPPORT' : 'CUSTOMER'} · {new Date(msg.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Reply box */}
            <div className="px-4 md:px-6 py-4 border-t border-rc-border shrink-0">
              {active.status === 'resolved' || active.status === 'closed' ? (
                <p className="font-mono text-[9px] text-rc-muted text-center tracking-[0.14em] py-1">
                  TICKET {active.status.toUpperCase()} — REOPEN TO REPLY
                </p>
              ) : (
                <div className="flex gap-3 items-end">
                  <textarea
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
                    placeholder="Type a reply… (Enter to send)"
                    rows={2}
                    className="flex-1 bg-transparent border border-rc-border rounded-sm px-4 py-3 font-mono text-[11px] text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-500 transition-colors resize-none leading-relaxed"
                  />
                  <button
                    onClick={sendReply}
                    disabled={sending || !reply.trim()}
                    className="self-end h-10 w-10 flex items-center justify-center bg-white text-black rounded-sm hover:bg-zinc-100 transition-colors disabled:opacity-40"
                  >
                    <Send size={13} strokeWidth={2} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Customer profile panel — desktop only */}
          <div className="hidden md:block">
            <CustomerPanel ticket={active} token={token} />
          </div>
        </div>
      )}
    </div>
  )
}
