'use client'

import { useEffect, useState } from 'react'
import { DollarSign, Package, BookOpen, Headphones, ShoppingBag, TrendingUp, AlertTriangle } from 'lucide-react'
import { createClient } from '@/app/supabase/client'

type Stat = { label: string; value: string; sub?: string; icon: React.ElementType; color: string }

type LowProduct = { id: string; name: string; stock: number }

export default function AnalyticsPage() {
  const supabase = createClient()

  const [stats, setStats]       = useState<Stat[]>([])
  const [lowStock, setLowStock] = useState<LowProduct[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    const load = async () => {
      const [ordersRes, productsRes, blogsRes, ticketsRes] = await Promise.all([
        supabase.from('orders').select('id, total_price, status, created_at, shipping_full_name').order('created_at', { ascending: false }),
        supabase.from('products').select('id, name, stock'),
        supabase.from('blogs').select('id, published'),
        supabase.from('tickets').select('id, status'),
      ])

      const orders   = ordersRes.data ?? []
      const products = productsRes.data ?? []
      const blogs    = blogsRes.data ?? []
      const tickets  = ticketsRes.data ?? []

      const revenue       = orders.filter(o => o.status !== 'cancelled').reduce((s: number, o: { total_price: number }) => s + o.total_price, 0)
      const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'paid').length
      const publishedBlogs = blogs.filter(b => b.published).length
      const openTickets    = tickets.filter(t => t.status === 'open').length
      const low            = products.filter(p => (p.stock ?? 0) < 5 && (p.stock ?? 0) >= 0)

      setStats([
        { label: 'TOTAL REVENUE',   value: `$${revenue.toFixed(2)}`,        sub: `${orders.length} orders`,           icon: DollarSign,  color: 'text-emerald-400' },
        { label: 'PENDING ORDERS',  value: String(pendingOrders),            sub: `${orders.length} total`,            icon: ShoppingBag, color: 'text-yellow-400'  },
        { label: 'PRODUCTS',        value: String(products.length),          sub: `${low.length} low stock`,           icon: Package,     color: 'text-blue-400'    },
        { label: 'BLOG POSTS',      value: String(publishedBlogs),           sub: `${blogs.length - publishedBlogs} drafts`, icon: BookOpen, color: 'text-purple-400' },
        { label: 'SUPPORT TICKETS', value: String(openTickets),              sub: `${tickets.length} total`,           icon: Headphones,  color: 'text-rose-400'    },
        { label: 'TOTAL ORDERS',    value: String(orders.length),            sub: 'all time',                          icon: TrendingUp,  color: 'text-cyan-400'    },
      ])

      setLowStock(low as LowProduct[])
      setLoading(false)
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-[1200px]">
      <div className="mb-8">
        <p className="font-mono text-[8px] tracking-[0.25em] text-rc-muted mb-1">MASTER ADMIN</p>
        <h1 className="font-display text-3xl text-white">OVERVIEW</h1>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {stats.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="border border-rc-border rounded-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="font-mono text-[8px] tracking-[0.2em] text-rc-muted">{label}</p>
              <Icon size={11} className={color} />
            </div>
            <p className="font-display text-3xl text-white mb-1">{value}</p>
            {sub && <p className="font-mono text-[8px] text-rc-muted">{sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Low stock */}
        <div className="border border-rc-border rounded-sm">
          <div className="px-5 py-4 border-b border-rc-border flex items-center gap-2">
            <AlertTriangle size={11} className="text-amber-500" />
            <p className="font-mono text-[9px] tracking-[0.2em] text-white">LOW STOCK</p>
          </div>
          {lowStock.length === 0 ? (
            <p className="font-mono text-[9px] text-rc-muted p-5">All products sufficiently stocked.</p>
          ) : (
            <div className="divide-y divide-rc-border">
              {lowStock.map(p => (
                <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                  <p className="font-mono text-[10px] text-white">{p.name}</p>
                  <span className="font-mono text-[9px] text-amber-400 border border-amber-900/40 px-2 py-0.5 rounded-sm">
                    {p.stock} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
