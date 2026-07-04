'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Send, Lock } from 'lucide-react'
import { createClient } from '@/app/supabase/client'

/* ─────────────────────────────────────────────────────────────
 *  Types
 * ───────────────────────────────────────────────────────────── */

export type TicketMessage = {
  id: string
  ticket_id: string
  user_id: string | null
  body: string
  is_admin: boolean
  created_at: string
  read_at: string | null
}

type Props = {
  ticketId: string
  ticketSubject: string
  userId: string
  isClosed?: boolean
  onMessagesRead?: () => void
}

/* ─────────────────────────────────────────────────────────────
 *  Helpers
 * ───────────────────────────────────────────────────────────── */

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return 'Today'
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' })
}

/* ─────────────────────────────────────────────────────────────
 *  Sub-components
 * ───────────────────────────────────────────────────────────── */

function MessageBubble({ msg, isOwn }: { msg: TicketMessage; isOwn: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} gap-1`}
    >
      <div
        className={`max-w-[80%] px-3.5 py-2.5 rounded-sm text-[11px] font-mono leading-relaxed ${
          isOwn
            ? 'bg-white text-black'
            : 'bg-zinc-900 border border-rc-border text-white'
        }`}
      >
        {msg.body}
      </div>
      <span className="font-mono text-[7px] text-rc-muted tracking-[0.1em] px-0.5">
        {msg.is_admin && !isOwn ? 'RC SUPPORT · ' : ''}
        {formatTime(msg.created_at)}
      </span>
    </motion.div>
  )
}

/* ─────────────────────────────────────────────────────────────
 *  Main component
 * ───────────────────────────────────────────────────────────── */

export default function CustomerTicketChat({
  ticketId,
  ticketSubject,
  userId,
  isClosed = false,
  onMessagesRead,
}: Props) {
  const supabase   = createClient()
  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLTextAreaElement>(null)
  const isLive     = useRef(false)   // true once Supabase channel is confirmed active

  const [messages, setMessages]   = useState<TicketMessage[]>([])
  const [input, setInput]         = useState('')
  const [sending, setSending]     = useState(false)
  const [loading, setLoading]     = useState(true)
  const [sendError, setSendError] = useState(false)
  const [connected, setConnected] = useState(false)

  /* Scroll to bottom whenever messages change */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  /* Load historical messages + subscribe to realtime inserts */
  useEffect(() => {
    let mounted = true

    const load = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })

      if (!mounted) return
      if (!error && data) {
        setMessages(data as TicketMessage[])
        // Mark all unread admin messages as read
        const unreadIds = (data as TicketMessage[])
          .filter(m => m.is_admin && !m.read_at)
          .map(m => m.id)
        if (unreadIds.length > 0) {
          await supabase
            .from('ticket_messages')
            .update({ read_at: new Date().toISOString() })
            .in('id', unreadIds)
          onMessagesRead?.()
        }
      }
      setLoading(false)
    }

    load()

    const channel = supabase
      .channel(`ticket-${ticketId}`)
      .on<TicketMessage>(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'ticket_messages',
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload) => {
          if (!mounted) return
          const msg = payload.new as TicketMessage
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === msg.id)
            return exists ? prev : [...prev, msg]
          })
          // Mark incoming admin message as read immediately (customer is viewing)
          if (msg.is_admin && !msg.read_at) {
            supabase
              .from('ticket_messages')
              .update({ read_at: new Date().toISOString() })
              .eq('id', msg.id)
              .then(() => { onMessagesRead?.() })
          }
        },
      )
      .subscribe((status) => {
        if (!mounted) return
        isLive.current = status === 'SUBSCRIBED'
        setConnected(status === 'SUBSCRIBED')
      })

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [ticketId]) // eslint-disable-line react-hooks/exhaustive-deps

  /* Append a message optimistically and persist to Supabase */
  const sendMessage = useCallback(async () => {
    const body = input.trim()
    if (!body || sending || isClosed) return

    const optimisticId = `opt-${Date.now()}`
    const optimistic: TicketMessage = {
      id:         optimisticId,
      ticket_id:  ticketId,
      user_id:    userId,
      body,
      is_admin:   false,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, optimistic])
    setInput('')
    setSending(true)
    setSendError(false)

    const { data, error } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticketId,
        user_id:   userId,
        body,
        is_admin:  false,
      })
      .select()
      .single()

    setSending(false)

    if (error || !data) {
      /* Persist failed — drop the optimistic message and surface the error */
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
      setInput(body)
      setSendError(true)
    } else {
      /* Replace optimistic entry with the persisted record */
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticId ? (data as TicketMessage) : m)),
      )
    }
  }, [input, sending, isClosed, ticketId, userId, supabase])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  /* Group messages by date for date separators */
  const grouped: Array<{ date: string; messages: TicketMessage[] }> = []
  for (const msg of messages) {
    const date = formatDate(msg.created_at)
    const last = grouped[grouped.length - 1]
    if (last?.date === date) {
      last.messages.push(msg)
    } else {
      grouped.push({ date, messages: [msg] })
    }
  }

  return (
    <div className="flex flex-col h-full border border-rc-border rounded-sm overflow-hidden">

      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 h-12 border-b border-rc-border bg-rc-subtle">
        <p className="font-mono text-[10px] text-white tracking-[0.18em] truncate mr-4">
          {ticketSubject}
        </p>
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              connected ? 'bg-emerald-500' : 'bg-zinc-600'
            }`}
          />
          <span className="font-mono text-[7px] text-rc-muted tracking-[0.14em]">
            {connected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Message stream */}
      <div className="flex-1 overflow-y-auto scrollbar-none px-4 py-4 space-y-4">
        {loading && messages.length === 0 && (
          <p className="font-mono text-[9px] text-rc-muted tracking-[0.14em] text-center py-8">
            LOADING MESSAGES…
          </p>
        )}
        {grouped.map(({ date, messages: dayMsgs }) => (
          <div key={date}>
            {/* Date separator */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-rc-border" />
              <span className="font-mono text-[7px] text-rc-muted tracking-[0.16em] shrink-0">
                {date}
              </span>
              <div className="flex-1 h-px bg-rc-border" />
            </div>

            <div className="space-y-3">
              {dayMsgs.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isOwn={msg.user_id === userId && !msg.is_admin}
                />
              ))}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="shrink-0 border-t border-rc-border p-3">
        {sendError && (
          <p className="font-mono text-[8px] text-red-400 tracking-[0.1em] mb-2">
            MESSAGE FAILED TO SEND — PLEASE TRY AGAIN
          </p>
        )}
        {isClosed ? (
          <div className="flex items-center justify-center gap-2 py-2">
            <Lock size={10} className="text-rc-muted" />
            <p className="font-mono text-[9px] text-rc-muted tracking-[0.14em]">
              TICKET CLOSED — REPLY DISABLED
            </p>
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={sending}
              rows={1}
              placeholder="Type a message…"
              className="flex-1 resize-none bg-transparent border border-rc-border rounded-sm px-3 py-2.5 font-mono text-[11px] text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-500 transition-colors leading-relaxed"
              style={{ maxHeight: '96px', overflowY: 'auto' }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className="shrink-0 w-9 h-9 flex items-center justify-center bg-white text-black rounded-sm hover:bg-zinc-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <Send size={13} strokeWidth={2} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
