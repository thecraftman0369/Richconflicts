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

/* GET — list all admin / master_admin users */
export async function GET(req: NextRequest) {
  const caller = await verifyMasterAdmin(req)
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const admins = (users ?? [])
    .filter(u => u.app_metadata?.role === 'master_admin' || u.app_metadata?.role === 'admin')
    .map(u => ({
      id:         u.id,
      email:      u.email ?? null,
      role:       u.app_metadata?.role as string,
      full_name:  u.user_metadata?.full_name ?? null,
      created_at: u.created_at,
    }))

  return NextResponse.json({ admins })
}

/* POST — promote a user by email */
export async function POST(req: NextRequest) {
  const caller = await verifyMasterAdmin(req)
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const email: string = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const role: string  = body.role === 'master_admin' ? 'master_admin' : 'admin'

  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

  // Find user by email
  const { data: { users }, error: searchError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  if (searchError) return NextResponse.json({ error: searchError.message }, { status: 500 })

  const target = (users ?? []).find(u => u.email?.toLowerCase() === email)
  if (!target) return NextResponse.json({ error: 'No account found with that email' }, { status: 404 })

  // Prevent demoting the only master_admin
  if (target.app_metadata?.role === 'master_admin' && role !== 'master_admin') {
    const masterCount = (users ?? []).filter(u => u.app_metadata?.role === 'master_admin').length
    if (masterCount <= 1) {
      return NextResponse.json({ error: 'Cannot remove the last Master Admin' }, { status: 400 })
    }
  }

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(target.id, {
    app_metadata: { ...target.app_metadata, role },
  })
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({
    admin: { id: target.id, email: target.email, role, created_at: target.created_at }
  })
}
