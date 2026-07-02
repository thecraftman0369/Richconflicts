'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import AdminSidebar from './AdminSidebar'
import { createClient } from '@/app/supabase/client'

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const [checked,      setChecked]      = useState(false)
  const [sidebarOpen,  setSidebarOpen]  = useState(false)

  const isLogin = pathname === '/rc-admin-2024/login'

  useEffect(() => {
    if (isLogin) { setChecked(true); return }
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      const role = data.session?.user.app_metadata?.role
      if (!data.session) { router.replace('/rc-admin-2024/login'); return }
      if (role !== 'master_admin') {
        supabase.auth.signOut().then(() => router.replace('/rc-admin-2024/login'))
        return
      }
      setChecked(true)
    })
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false) }, [pathname])

  if (!checked) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-5 h-5 border border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  if (isLogin) return <>{children}</>

  return (
    <div className="flex bg-black min-h-screen">

      {/* Desktop sidebar — always visible */}
      <div className="hidden md:block">
        <AdminSidebar />
      </div>

      {/* Mobile sidebar — slide-over overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Sidebar panel */}
          <div className="relative z-10 flex flex-col">
            <AdminSidebar />
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-3 right-3 p-1 text-rc-muted hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 h-12 px-4 border-b border-rc-border bg-black sticky top-0 z-40">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1 text-rc-muted hover:text-white transition-colors"
            aria-label="Open menu"
          >
            <Menu size={18} strokeWidth={1.5} />
          </button>
          <span className="font-display text-lg text-white">RC</span>
          <span className="font-mono text-[8px] text-rc-muted tracking-[0.22em] mt-0.5">ADMIN</span>
        </div>

        <main className="flex-1 overflow-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
