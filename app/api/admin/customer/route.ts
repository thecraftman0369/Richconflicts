import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase/admin'

export async function GET(req: NextRequest) {
  // Verify admin JWT
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const token = authHeader.replace('Bearer ', '')
  const { data: { user: admin }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !admin || admin.app_metadata?.role !== 'master_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 })
  }

  // Profile
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, email, phone, shipping_address, created_at')
    .eq('id', userId)
    .maybeSingle()

  // Auth user (for email fallback + signup date)
  const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(userId)

  // Recent orders (last 5)
  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('id, status, total_price, created_at, shipping_full_name, tracking_number, carrier')
    .eq('customer_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)

  // Total spend
  const { data: spendRows } = await supabaseAdmin
    .from('orders')
    .select('total_price')
    .eq('customer_id', userId)

  const totalSpend = (spendRows ?? []).reduce((sum, o) => sum + (o.total_price ?? 0), 0)

  // Ticket count
  const { count: ticketCount } = await supabaseAdmin
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  return NextResponse.json({
    profile,
    authEmail: authUser?.email ?? null,
    authCreatedAt: authUser?.created_at ?? null,
    orders: orders ?? [],
    totalSpend,
    ticketCount: ticketCount ?? 0,
  })
}
