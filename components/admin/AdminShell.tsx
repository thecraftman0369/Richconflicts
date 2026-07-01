'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import AdminSidebar from './AdminSidebar'
import { createClient } from '@/app/supabase/client'

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const [checked, setChecked] = useState(false)

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
      <AdminSidebar />
      <main className="flex-1 overflow-auto min-h-screen min-w-0">
        {children}
      </main>
    </div>
  )
}
