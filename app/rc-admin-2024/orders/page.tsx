'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, Package, DollarSign, Clock, ChevronDown, Truck, CheckSquare, Square, X, Eye, EyeOff } from 'lucide-react'
import { maskEmail } from '@/app/lib/utils'
import { createClient } from '@/app/supabase/client'

type OrderStatus = 'pending' | 'paid' | 'fulfilled' | 'shipped' | 'delivered' | 'cancelled'

type AdminOrder = {
  id: string
  stripe_payment_intent_id: string | null
  status: OrderStatus
  total_price: number
  subtotal: number
  tax: number
  shipping_cost: number
  shipping_full_name: string | null
  shipping_email: string | null
  shipping_address: string | null
  shipping_city: string | null
  shipping_zip: string | null
  shipping_country: string | null
  tracking_number: string | null
  carrier: string | null
  created_at: string
  updated_at: string | null
}

const STATUS_OPTIONS: OrderStatus[] = ['pending', 'paid', 'fulfilled', 'shipped', 'delivered', 'cancelled']

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending:   'text-yellow-400 border-yellow-900/50 bg-yellow-950/20',
  paid:      'text-blue-400  border-blue-900/50  bg-blue-950/20',
  fulfilled: 'text-purple-400 border-purple-900/50 bg-purple-950/20',
  shipped:   'text-cyan-400  border-cyan-900/50  bg-cyan-950/20',
  delivered: 'text-green-400 border-green-900/50 bg-green-950/20',
  cancelled: 'text-zinc-500  border-zinc-800     bg-zinc-900/30',
}

function OrderRow({
  order,
  selected,
  onSelect,
  onUpdate,
}: {
  order: AdminOrder
  selected: boolean
  onSelect: (id: string) => void
  onUpdate: (id: string, updates: Partial<AdminOrder>) => void
}) {
  const supabase = createClient()
  const [open,          setOpen]          = useState(false)
  const [saving,        setSaving]        = useState(false)
  const [tracking,      setTracking]      = useState(order.tracking_number ?? '')
  const [carrier,       setCarrier]       = useState(order.carrier ?? '')
  const [emailRevealed, setEmailRevealed] = useState(false)

  const updateStatus = async (status: OrderStatus) => {
    setSaving(true)
    const { error } = await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', order.id)
    if (!error) onUpdate(order.id, { status })
    setSaving(false)
  }

  const saveTracking = async () => {
    setSaving(true)
    await supabase.from('orders')
      .update({ tracking_number: tracking || null, carrier: carrier || null, updated_at: new Date().toISOString() })
      .eq('id', order.id)
    onUpdate(order.id, { tracking_number: tracking || null, carrier: carrier || null })
    setSaving(false)
  }

  return (
    <>
      <tr className={`border-b border-rc-border hover:bg-white/[0.02] transition-colors ${selected ? 'bg-white/[0.04]' : ''}`}>
        {/* Checkbox */}
        <td className="pl-4 pr-2 py-3 w-8">
          <button
            onClick={e => { e.stopPropagation(); onSelect(order.id) }}
            className="text-rc-muted hover:text-white transition-colors"
          >
            {selected ? <CheckSquare size={13} className="text-white" /> : <Square size={13} />}
          </button>
        </td>
        <td
          className="px-4 py-3 font-mono text-[9px] text-zinc-400 cursor-pointer"
          onClick={() => setOpen(v => !v)}
        >
          {new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
        </td>
        <td
          className="px-4 py-3 font-mono text-[9px] text-white max-w-[180px] truncate cursor-pointer"
          onClick={() => setOpen(v => !v)}
        >
          {order.shipping_full_name ?? '—'}
          {order.shipping_email && (
            <span className="block text-rc-muted text-[8px]">
              {emailRevealed ? order.shipping_email : maskEmail(order.shipping_email)}
            </span>
          )}
        </td>
        <td className="px-4 py-3 font-mono text-[10px] text-white cursor-pointer" onClick={() => setOpen(v => !v)}>
          ${order.total_price.toFixed(2)}
        </td>
        <td className="px-4 py-3 cursor-pointer" onClick={() => setOpen(v => !v)}>
          <span className={`font-mono text-[8px] tracking-[0.15em] border px-2 py-0.5 rounded-sm ${STATUS_COLORS[order.status]}`}>
            {order.status.toUpperCase()}
          </span>
        </td>
        <td className="px-4 py-3 font-mono text-[9px] text-rc-muted cursor-pointer" onClick={() => setOpen(v => !v)}>
          {order.tracking_number ? (
            <span className="flex items-center gap-1 text-cyan-400/70">
              <Truck size={8} />{order.carrier ? `${order.carrier} ` : ''}{order.tracking_number.slice(0, 12)}…
            </span>
          ) : '—'}
        </td>
        <td className="px-4 py-3 cursor-pointer" onClick={() => setOpen(v => !v)}>
          <ChevronDown size={11} className={`text-rc-muted transition-transform ${open ? 'rotate-180' : ''}`} />
        </td>
      </tr>

      {open && (
        <tr className="border-b border-rc-border bg-white/[0.015]">
          <td colSpan={7} className="px-4 py-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="font-mono text-[8px] tracking-[0.2em] text-rc-muted mb-2">SHIPPING</p>
                <p className="font-mono text-[10px] text-white">{order.shipping_full_name}</p>
                <p className="font-mono text-[9px] text-zinc-400">{order.shipping_address}</p>
                <p className="font-mono text-[9px] text-zinc-400">{order.shipping_city} {order.shipping_zip}</p>
                <p className="font-mono text-[9px] text-zinc-400">{order.shipping_country}</p>
                {order.shipping_email && (
                  <button
                    onClick={e => { e.stopPropagation(); setEmailRevealed(v => !v) }}
                    className="flex items-center gap-1.5 font-mono text-[9px] text-rc-muted hover:text-white transition-colors mt-1 group"
                  >
                    {emailRevealed ? order.shipping_email : maskEmail(order.shipping_email)}
                    {emailRevealed
                      ? <EyeOff size={9} className="shrink-0" />
                      : <Eye size={9} className="shrink-0 opacity-50 group-hover:opacity-100" />
                    }
                  </button>
                )}
              </div>

              <div>
                <p className="font-mono text-[8px] tracking-[0.2em] text-rc-muted mb-2">UPDATE STATUS</p>
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_OPTIONS.map(s => (
                    <button
                      key={s}
                      disabled={saving || order.status === s}
                      onClick={e => { e.stopPropagation(); updateStatus(s) }}
                      className={`font-mono text-[8px] tracking-[0.12em] px-2 py-1 rounded-sm border transition-colors ${
                        order.status === s
                          ? 'bg-white text-black border-white'
                          : 'border-rc-border text-rc-muted hover:border-zinc-500 hover:text-white'
                      }`}
                    >
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>
                {order.stripe_payment_intent_id && (
                  <p className="font-mono text-[7px] text-zinc-700 mt-2 truncate">PI: {order.stripe_payment_intent_id}</p>
                )}
              </div>

              <div onClick={e => e.stopPropagation()}>
                <p className="font-mono text-[8px] tracking-[0.2em] text-rc-muted mb-2">TRACKING</p>
                <div className="space-y-2">
                  <input
                    value={carrier}
                    onChange={e => setCarrier(e.target.value)}
                    placeholder="Carrier (UPS, USPS…)"
                    className="w-full bg-transparent border border-rc-border rounded-sm px-3 h-8 font-mono text-[9px] text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-500"
                  />
                  <input
                    value={tracking}
                    onChange={e => setTracking(e.target.value)}
                    placeholder="Tracking number"
                    className="w-full bg-transparent border border-rc-border rounded-sm px-3 h-8 font-mono text-[9px] text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-500"
                  />
                  <button
                    disabled={saving}
                    onClick={saveTracking}
                    className="w-full h-8 bg-white text-black font-mono text-[8px] tracking-[0.18em] rounded-sm hover:bg-zinc-100 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'SAVING…' : 'SAVE TRACKING'}
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function OrdersPage() {
  const supabase = createClient()
  const [orders,   setOrders]   = useState<AdminOrder[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState<OrderStatus | 'all'>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkSaving, setBulkSaving] = useState(false)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
    if (!error && data) setOrders(data as AdminOrder[])
    setLoading(false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchOrders()
    const channel = supabase
      .channel('admin-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' },
        payload => setOrders(prev => [payload.new as AdminOrder, ...prev]))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' },
        payload => setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...(payload.new as AdminOrder) } : o)))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpdate = useCallback((id: string, updates: Partial<AdminOrder>) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o))
  }, [])

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === displayOrders.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(displayOrders.map(o => o.id)))
    }
  }

  const clearSelection = () => setSelected(new Set())

  const bulkUpdateStatus = async (status: OrderStatus) => {
    if (!selected.size) return
    setBulkSaving(true)
    const ids = Array.from(selected)
    await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .in('id', ids)
    setOrders(prev => prev.map(o => ids.includes(o.id) ? { ...o, status } : o))
    setSelected(new Set())
    setBulkSaving(false)
  }

  const totalRevenue  = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total_price, 0)
  const pendingCount  = orders.filter(o => o.status === 'pending' || o.status === 'paid').length
  const shippedCount  = orders.filter(o => o.status === 'shipped' || o.status === 'delivered').length
  const displayOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter)
  const allSelected   = displayOrders.length > 0 && selected.size === displayOrders.length

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="font-mono text-[8px] tracking-[0.25em] text-rc-muted mb-1">MASTER ADMIN</p>
          <h1 className="font-display text-3xl text-white">ORDERS</h1>
        </div>
        <button onClick={fetchOrders} className="p-2 text-rc-muted hover:text-white transition-colors" title="Refresh">
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'TOTAL ORDERS',   value: String(orders.length),         icon: Package },
          { label: 'REVENUE',        value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign },
          { label: 'PENDING / PAID', value: String(pendingCount),          icon: Clock },
          { label: 'SHIPPED',        value: String(shippedCount),          icon: Truck },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="border border-rc-border rounded-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-mono text-[8px] tracking-[0.2em] text-rc-muted">{label}</p>
              <Icon size={10} className="text-rc-muted" />
            </div>
            <p className="font-display text-2xl text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-none pb-1">
        {(['all', ...STATUS_OPTIONS] as const).map(s => (
          <button
            key={s}
            onClick={() => { setFilter(s); setSelected(new Set()) }}
            className={`shrink-0 font-mono text-[8px] tracking-[0.18em] px-3 py-1.5 rounded-sm transition-colors ${
              filter === s ? 'bg-white text-black' : 'border border-rc-border text-rc-muted hover:text-white'
            }`}
          >
            {s.toUpperCase()}
            {s !== 'all' && <span className="ml-1 opacity-50">{orders.filter(o => o.status === s).length}</span>}
          </button>
        ))}
      </div>

      {/* Bulk action bar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-3 mb-3 px-4 py-3 bg-white/[0.05] border border-white/10 rounded-sm"
          >
            <span className="font-mono text-[9px] text-white tracking-[0.14em] shrink-0">
              {selected.size} SELECTED
            </span>
            <div className="flex items-center gap-1.5 flex-wrap flex-1">
              <span className="font-mono text-[8px] text-rc-muted tracking-[0.12em] shrink-0">SET TO:</span>
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s}
                  disabled={bulkSaving}
                  onClick={() => bulkUpdateStatus(s)}
                  className={`font-mono text-[8px] tracking-[0.12em] px-2.5 py-1 rounded-sm border transition-colors disabled:opacity-40 ${STATUS_COLORS[s]}`}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
            <button
              onClick={clearSelection}
              className="shrink-0 text-rc-muted hover:text-white transition-colors"
              title="Clear selection"
            >
              <X size={13} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="border border-rc-border rounded-sm overflow-x-auto">
        {loading ? (
          <div className="py-16 text-center">
            <p className="font-mono text-[10px] text-rc-muted tracking-[0.2em]">LOADING ORDERS...</p>
          </div>
        ) : displayOrders.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-mono text-[10px] text-rc-muted tracking-[0.2em]">NO ORDERS FOUND.</p>
          </div>
        ) : (
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-rc-border bg-white/[0.02]">
                <th className="pl-4 pr-2 py-3 w-8">
                  <button onClick={toggleSelectAll} className="text-rc-muted hover:text-white transition-colors">
                    {allSelected ? <CheckSquare size={13} className="text-white" /> : <Square size={13} />}
                  </button>
                </th>
                {['DATE', 'CUSTOMER', 'TOTAL', 'STATUS', 'TRACKING', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-mono text-[8px] tracking-[0.2em] text-rc-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {displayOrders.map(order => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    selected={selected.has(order.id)}
                    onSelect={toggleSelect}
                    onUpdate={handleUpdate}
                  />
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>

      <p className="font-mono text-[8px] text-zinc-700 mt-3 text-right tracking-[0.1em]">
        {displayOrders.length} ORDER{displayOrders.length !== 1 ? 'S' : ''}
        {filter !== 'all' && ` · FILTERED BY ${filter.toUpperCase()}`}
      </p>
    </div>
  )
}
