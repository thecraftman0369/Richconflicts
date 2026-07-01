import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase/admin'

async function verifyMasterAdmin(req: NextRequest) {
  const header = req.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return null
  const token = header.replace('Bearer ', '')
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user || user.app_metadata?.role !== 'master_admin') return null
  return user
}

/* PATCH — change role of an existing admin */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const caller = await verifyMasterAdmin(req)
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId } = await params
  const body = await req.json()
  const role: string = body.role === 'master_admin' ? 'master_admin' : 'admin'

  const { data: { user: target }, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(userId)
  if (fetchError || !target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Prevent leaving zero master admins
  if (target.app_metadata?.role === 'master_admin' && role === 'admin') {
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
    const masterCount = (users ?? []).filter(u => u.app_metadata?.role === 'master_admin').length
    if (masterCount <= 1) {
      return NextResponse.json({ error: 'Cannot remove the last Master Admin' }, { status: 400 })
    }
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    app_metadata: { ...target.app_metadata, role },
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, role })
}

/* DELETE — revoke admin access entirely */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const caller = await verifyMasterAdmin(req)
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId } = await params

  // Prevent self-revoke
  if (caller.id === userId) {
    return NextResponse.json({ error: 'Cannot revoke your own access' }, { status: 400 })
  }

  const { data: { user: target }, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(userId)
  if (fetchError || !target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Prevent removing the last master admin
  if (target.app_metadata?.role === 'master_admin') {
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
    const masterCount = (users ?? []).filter(u => u.app_metadata?.role === 'master_admin').length
    if (masterCount <= 1) {
      return NextResponse.json({ error: 'Cannot remove the last Master Admin' }, { status: 400 })
    }
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    app_metadata: { ...target.app_metadata, role: null },
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
