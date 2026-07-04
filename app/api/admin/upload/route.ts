import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase/admin'
import { createClient } from '@/app/supabase/client'

export async function POST(req: NextRequest) {
  // Verify admin session via Authorization header
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

  if (authError || !user || user.app_metadata?.role !== 'master_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const formData = await req.formData()
  const file     = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const maxMb = 10
  if (file.size > maxMb * 1024 * 1024) {
    return NextResponse.json({ error: `File too large (max ${maxMb}MB)` }, { status: 413 })
  }

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 415 })
  }

  const ext    = file.name.split('.').pop() ?? 'jpg'
  const folder = new URL(req.url).searchParams.get('folder')
  const uuid   = crypto.randomUUID()
  const path   = folder ? `${folder}/${uuid}.${ext}` : `${uuid}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabaseAdmin.storage
    .from('blog-images')
    .upload(path, buffer, { contentType: file.type, upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data } = supabaseAdmin.storage.from('blog-images').getPublicUrl(path)
  return NextResponse.json({ url: data.publicUrl })
}
