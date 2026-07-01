import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase/admin'

const AUTO_REPLY = 'Thank you for reaching out. A Rich Conflict representative will be reaching out to you.'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const subject: string        = typeof body.subject        === 'string' ? body.subject.trim()        : ''
  const orderId: string | null = typeof body.orderId        === 'string' ? body.orderId               : null
  const initialMsg: string     = typeof body.initialMessage === 'string' ? body.initialMessage.trim() : ''

  if (!subject) {
    return NextResponse.json({ error: 'Subject is required' }, { status: 400 })
  }

  // 1. Create the ticket
  const { data: ticket, error: ticketError } = await supabaseAdmin
    .from('tickets')
    .insert({ user_id: user.id, subject, order_id: orderId, status: 'open' })
    .select()
    .single()

  if (ticketError || !ticket) {
    return NextResponse.json({ error: ticketError?.message ?? 'Failed to create ticket' }, { status: 500 })
  }

  // 2. Insert customer's initial message (if any)
  if (initialMsg) {
    await supabaseAdmin.from('ticket_messages').insert({
      ticket_id: ticket.id,
      user_id:   user.id,
      body:      initialMsg,
      is_admin:  false,
    })
  }

  // 3. Insert the automated reply
  await supabaseAdmin.from('ticket_messages').insert({
    ticket_id: ticket.id,
    user_id:   null,
    body:      AUTO_REPLY,
    is_admin:  true,
  })

  return NextResponse.json({ ticket })
}
