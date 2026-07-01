'use client'

import { useEffect, useState, useCallback } from 'react'
import { Users, UserPlus, ShieldCheck, Shield, Trash2, ChevronDown } from 'lucide-react'
import { createClient } from '@/app/supabase/client'

type AdminRole = 'admin' | 'master_admin'

type AdminMember = {
  id: string
  email: string | null
  full_name: string | null
  role: AdminRole
  created_at: string
}

const ROLE_LABELS: Record<AdminRole, string> = {
  admin:        'Admin',
  master_admin: 'Master Admin',
}

const ROLE_STYLES: Record<AdminRole, string> = {
  admin:        'bg-white/[0.08] text-white border border-white/20',
  master_admin: 'bg-amber-950/50 text-amber-300 border border-amber-700/50',
}

function RoleBadge({ role }: { role: AdminRole }) {
  return (
    <span className={`inline-block font-mono text-[8px] tracking-[0.14em] px-2 py-0.5 rounded-sm whitespace-nowrap ${ROLE_STYLES[role]}`}>
      {ROLE_LABELS[role]}
    </span>
  )
}

function initials(member: AdminMember) {
  if (member.full_name) {
    return member.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }
  return (member.email?.[0] ?? '?').toUpperCase()
}

export default function TeamPage() {
  const supabase = createClient()

  const [members,  setMembers]  = useState<AdminMember[]>([])
  const [loading,  setLoading]  = useState(true)
  const [token,    setToken]    = useState<string | null>(null)
  const [selfId,   setSelfId]   = useState<string | null>(null)

  /* Promote form */
  const [email,    setEmail]    = useState('')
  const [grantRole, setGrantRole] = useState<AdminRole>('admin')
  const [promoting, setPromoting] = useState(false)
  const [promoteErr, setPromoteErr] = useState<string | null>(null)
  const [promoteOk,  setPromoteOk]  = useState(false)

  /* Per-row state */
  const [roleChanging, setRoleChanging] = useState<string | null>(null)
  const [revoking,     setRevoking]     = useState<string | null>(null)
  const [rowError,     setRowError]     = useState<Record<string, string>>({})

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setToken(session?.access_token ?? null)
      setSelfId(session?.user?.id ?? null)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMembers = useCallback(async (tok: string) => {
    setLoading(true)
    const res = await fetch('/api/admin/team', {
      headers: { Authorization: `Bearer ${tok}` },
    })
    if (res.ok) {
      const { admins } = await res.json()
      setMembers(admins)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (token) fetchMembers(token)
  }, [token, fetchMembers])

  /* Promote */
  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !email.trim()) return
    setPromoting(true)
    setPromoteErr(null)
    setPromoteOk(false)

    const res = await fetch('/api/admin/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email: email.trim(), role: grantRole }),
    })
    const data = await res.json()
    if (!res.ok) {
      setPromoteErr(data.error ?? 'Something went wrong')
    } else {
      setPromoteOk(true)
      setEmail('')
      fetchMembers(token)
    }
    setPromoting(false)
  }

  /* Change role */
  const handleRoleChange = async (member: AdminMember, next: AdminRole) => {
    if (!token || next === member.role) return
    setRoleChanging(member.id)
    setRowError(prev => ({ ...prev, [member.id]: '' }))

    const res = await fetch(`/api/admin/team/${member.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role: next }),
    })
    const data = await res.json()
    if (!res.ok) {
      setRowError(prev => ({ ...prev, [member.id]: data.error ?? 'Failed' }))
    } else {
      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, role: next } : m))
    }
    setRoleChanging(null)
  }

  /* Revoke */
  const handleRevoke = async (member: AdminMember) => {
    if (!token) return
    if (!confirm(`Remove admin access for ${member.email}?`)) return
    setRevoking(member.id)
    setRowError(prev => ({ ...prev, [member.id]: '' }))

    const res = await fetch(`/api/admin/team/${member.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    if (!res.ok) {
      setRowError(prev => ({ ...prev, [member.id]: data.error ?? 'Failed' }))
      setRevoking(null)
    } else {
      setMembers(prev => prev.filter(m => m.id !== member.id))
      setRevoking(null)
    }
  }

  return (
    <div className="min-h-screen bg-black px-8 py-10 max-w-4xl">

      {/* Page header */}
      <div className="mb-10">
        <p className="font-mono text-[8px] tracking-[0.28em] text-rc-muted mb-1">MASTER ADMIN</p>
        <h1 className="font-display text-3xl text-white flex items-center gap-3">
          <Users size={22} strokeWidth={1.5} />
          TEAM
        </h1>
        <p className="font-mono text-[9px] text-rc-muted mt-2 tracking-[0.1em]">
          Promote users, assign roles, and manage admin access.
        </p>
      </div>

      {/* ── ADD ADMIN BY EMAIL ── */}
      <section className="border border-rc-border rounded-sm mb-8">
        <div className="px-6 py-4 border-b border-rc-border flex items-center gap-2">
          <UserPlus size={12} className="text-rc-muted" strokeWidth={1.5} />
          <p className="font-mono text-[9px] tracking-[0.2em] text-white">ADD ADMIN BY EMAIL</p>
        </div>
        <form onSubmit={handlePromote} className="px-6 py-5">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="font-mono text-[8px] tracking-[0.18em] text-rc-muted block mb-2">
                USER EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setPromoteErr(null); setPromoteOk(false) }}
                placeholder="user@example.com"
                required
                className="w-full bg-transparent border border-rc-border rounded-sm px-4 py-2.5 font-mono text-[11px] text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-500 transition-colors"
              />
            </div>

            <div className="w-44">
              <label className="font-mono text-[8px] tracking-[0.18em] text-rc-muted block mb-2">
                GRANT ROLE
              </label>
              <div className="relative">
                <select
                  value={grantRole}
                  onChange={e => setGrantRole(e.target.value as AdminRole)}
                  className="w-full appearance-none bg-transparent border border-rc-border rounded-sm px-4 py-2.5 font-mono text-[11px] text-white focus:outline-none focus:border-zinc-500 transition-colors pr-8"
                >
                  <option value="admin" className="bg-zinc-900">Admin</option>
                  <option value="master_admin" className="bg-zinc-900">Master Admin</option>
                </select>
                <ChevronDown size={10} className="absolute right-3 top-1/2 -translate-y-1/2 text-rc-muted pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={promoting || !email.trim()}
              className="h-[38px] px-5 bg-white text-black font-mono text-[9px] tracking-[0.18em] rounded-sm hover:bg-zinc-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              {promoting ? 'ADDING…' : 'PROMOTE'}
            </button>
          </div>

          {promoteErr && (
            <p className="font-mono text-[9px] text-red-400 mt-3">{promoteErr}</p>
          )}
          {promoteOk && (
            <p className="font-mono text-[9px] text-emerald-400 mt-3">Admin access granted.</p>
          )}
        </form>
      </section>

      {/* ── CURRENT ADMINS ── */}
      <section className="border border-rc-border rounded-sm mb-8">
        <div className="px-6 py-4 border-b border-rc-border">
          <p className="font-mono text-[9px] tracking-[0.2em] text-white">CURRENT ADMINS</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-4 h-4 border border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        ) : members.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="font-mono text-[9px] text-rc-muted tracking-[0.14em]">NO ADMINS FOUND</p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="grid grid-cols-[1fr_1.4fr_auto_auto_auto] gap-4 px-6 py-3 border-b border-rc-border">
              {['NAME', 'EMAIL', 'ROLE', 'SINCE', ''].map((h, i) => (
                <span key={i} className="font-mono text-[7px] tracking-[0.22em] text-rc-muted">{h}</span>
              ))}
            </div>

            <div className="divide-y divide-rc-border">
              {members.map(member => (
                <div key={member.id} className="grid grid-cols-[1fr_1.4fr_auto_auto_auto] gap-4 px-6 py-4 items-center">

                  {/* Name + avatar */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-display ${
                      member.role === 'master_admin'
                        ? 'bg-amber-300 text-black'
                        : 'bg-white text-black'
                    }`}>
                      {initials(member)}
                    </div>
                    <span className="font-mono text-[10px] text-white truncate">
                      {member.full_name ?? '—'}
                      {member.id === selfId && (
                        <span className="ml-1.5 font-mono text-[7px] text-rc-muted">(you)</span>
                      )}
                    </span>
                  </div>

                  {/* Email */}
                  <span className="font-mono text-[9px] text-rc-muted truncate">{member.email ?? '—'}</span>

                  {/* Role badge + dropdown */}
                  <div className="flex items-center gap-2">
                    <RoleBadge role={member.role} />
                    {member.id !== selfId && (
                      <div className="relative">
                        <select
                          value={member.role}
                          onChange={e => handleRoleChange(member, e.target.value as AdminRole)}
                          disabled={roleChanging === member.id}
                          className="appearance-none bg-transparent border border-zinc-700 rounded-sm pl-2 pr-6 py-1 font-mono text-[8px] text-rc-muted focus:outline-none focus:border-zinc-500 transition-colors disabled:opacity-40"
                        >
                          <option value="admin" className="bg-zinc-900">Admin</option>
                          <option value="master_admin" className="bg-zinc-900">Master Admin</option>
                        </select>
                        <ChevronDown size={8} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-rc-muted pointer-events-none" />
                      </div>
                    )}
                  </div>

                  {/* Since */}
                  <span className="font-mono text-[9px] text-rc-muted whitespace-nowrap">
                    {new Date(member.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>

                  {/* Revoke */}
                  <div className="flex items-center justify-end">
                    {member.id !== selfId ? (
                      <button
                        onClick={() => handleRevoke(member)}
                        disabled={revoking === member.id}
                        title="Revoke admin access"
                        className="w-7 h-7 flex items-center justify-center border border-zinc-800 rounded-sm text-zinc-600 hover:text-red-400 hover:border-red-900 transition-colors disabled:opacity-40"
                      >
                        {revoking === member.id
                          ? <div className="w-3 h-3 border border-white/20 border-t-white rounded-full animate-spin" />
                          : <Trash2 size={11} strokeWidth={1.5} />
                        }
                      </button>
                    ) : (
                      <div className="w-7" />
                    )}
                  </div>

                  {/* Row-level error */}
                  {rowError[member.id] && (
                    <p className="col-span-5 font-mono text-[8px] text-red-400 -mt-1">
                      {rowError[member.id]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* ── ROLE PERMISSIONS ── */}
      <section className="border border-rc-border rounded-sm">
        <div className="px-6 py-4 border-b border-rc-border">
          <p className="font-mono text-[9px] tracking-[0.2em] text-white">ROLE PERMISSIONS</p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-rc-border">
          {/* Admin */}
          <div className="px-6 py-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={12} className="text-white" strokeWidth={1.5} />
              <p className="font-mono text-[9px] tracking-[0.16em] text-white">ADMIN</p>
            </div>
            <ul className="space-y-2">
              {[
                'Manage blog',
                'Manage products',
                'View & reply to support tickets',
                'View orders',
              ].map(p => (
                <li key={p} className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-white shrink-0" />
                  <span className="font-mono text-[9px] text-rc-muted">{p}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Master Admin */}
          <div className="px-6 py-5">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck size={12} className="text-amber-300" strokeWidth={1.5} />
              <p className="font-mono text-[9px] tracking-[0.16em] text-amber-300">MASTER ADMIN</p>
            </div>
            <ul className="space-y-2">
              {[
                'All admin permissions',
                'Manage team members',
                'Promote / demote admins',
                'Revoke admin access',
                'Full system access',
              ].map(p => (
                <li key={p} className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-amber-300 shrink-0" />
                  <span className="font-mono text-[9px] text-rc-muted">{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

    </div>
  )
}
