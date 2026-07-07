'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { BarChart2, Package, BookOpen, Headphones, ShoppingBag, LogOut, Users } from 'lucide-react'
import { createClient } from '@/app/supabase/client'

export default function AdminSidebar() {
  const pathname    = usePathname()
  const router      = useRouter()
  const [openCount, setOpenCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()

    const fetchCount = () =>
      supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .in('status', ['open', 'in_progress'])
        .then(({ count }) => setOpenCount(count ?? 0))

    fetchCount()

    const ch = supabase
      .channel('sidebar-open-tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, fetchCount)
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/')
  }

  const NAV = [
    { label: 'OVERVIEW',   href: '/rc-admin-2024/analytics', icon: BarChart2, badge: 0 },
    { label: 'ORDERS',    href: '/rc-admin-2024/orders',    icon: ShoppingBag, badge: 0 },
    { label: 'PRODUCTS',  href: '/rc-admin-2024/products',  icon: Package, badge: 0 },
    { label: 'BLOG',      href: '/rc-admin-2024/blog',      icon: BookOpen, badge: 0 },
    { label: 'SUPPORT',   href: '/rc-admin-2024/support',   icon: Headphones, badge: openCount },
    { label: 'TEAM',      href: '/rc-admin-2024/team',      icon: Users,      badge: 0 },
  ]

  return (
    <aside className="w-52 shrink-0 border-r border-rc-border bg-black flex flex-col h-screen sticky top-0">
      {/* Brand */}
      <div className="h-14 flex items-center px-5 border-b border-rc-border">
        <Link href="/" title="Go to website" className="flex items-center gap-2 group">
          <span className="font-display text-2xl text-white group-hover:opacity-60 transition-opacity">RC</span>
          <span className="font-mono text-[8px] text-rc-muted tracking-[0.22em] mt-0.5">ADMIN</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {NAV.map(({ label, href, icon: Icon, badge }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-5 py-2.5 font-mono text-[9px] tracking-[0.18em] transition-colors ${
                active
                  ? 'text-white bg-white/[0.04] border-r-2 border-white'
                  : 'text-rc-muted hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              <Icon size={12} strokeWidth={active ? 2 : 1.5} />
              <span className="flex-1">{label}</span>
              {badge > 0 && (
                <span className="shrink-0 min-w-[16px] h-4 px-1 bg-white text-black font-mono text-[7px] rounded-sm flex items-center justify-center">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-rc-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full font-mono text-[9px] tracking-[0.18em] text-rc-muted hover:text-white transition-colors px-1 py-1.5"
        >
          <LogOut size={11} strokeWidth={1.5} />
          LOGOUT
        </button>
      </div>
    </aside>
  )
}
