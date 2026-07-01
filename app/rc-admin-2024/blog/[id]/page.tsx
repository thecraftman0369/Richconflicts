'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ArrowLeft, Save, Globe, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/app/supabase/client'

const RichTextEditor = dynamic(() => import('@/components/admin/RichTextEditor'), { ssr: false })

const inputCls = 'w-full bg-transparent border border-rc-border rounded-sm px-3 h-9 font-mono text-[11px] text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-500 transition-colors'

type BlogPost = {
  id: string
  title: string
  slug: string | null
  excerpt: string | null
  category: string | null
  author: string | null
  content: string | null
  published: boolean
}

export default function EditPostPage() {
  const params   = useParams()
  const router   = useRouter()
  const supabase = createClient()
  const id       = params.id as string

  const [post,    setPost]    = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [status,  setStatus]  = useState<'idle' | 'saved' | 'error'>('idle')

  useEffect(() => {
    supabase.from('blogs').select('*').eq('id', id).single().then(({ data }) => {
      if (data) setPost(data as BlogPost)
      setLoading(false)
    })
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleContent = useCallback((html: string) => {
    setPost(p => p ? { ...p, content: html } : p)
  }, [])

  const uploadImage = async (file: File): Promise<string> => {
    const ext  = file.name.split('.').pop()
    const path = `${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from('blog-images').upload(path, file, { upsert: false })
    if (error) throw new Error(error.message)
    const { data } = supabase.storage.from('blog-images').getPublicUrl(path)
    return data.publicUrl
  }

  const save = async (published?: boolean) => {
    if (!post) return
    setSaving(true)
    setStatus('idle')
    const updates = {
      title:     post.title,
      slug:      post.slug || null,
      excerpt:   post.excerpt || null,
      category:  post.category || null,
      author:    post.author || 'Rich Conflicts',
      content:   post.content || '',
      published: published !== undefined ? published : post.published,
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabase.from('blogs').update(updates).eq('id', id)
    setSaving(false)
    if (error) { setStatus('error'); return }
    setStatus('saved')
    if (published !== undefined) setPost(p => p ? { ...p, published } : p)
    setTimeout(() => setStatus('idle'), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="p-6">
        <p className="font-mono text-[10px] text-rc-muted">Post not found.</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-[900px]">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/rc-admin-2024/blog" className="p-1 text-rc-muted hover:text-white transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="font-mono text-[8px] tracking-[0.25em] text-rc-muted mb-1">EDIT POST</p>
            <h1 className="font-display text-2xl text-white">BLOG EDITOR</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status === 'saved' && <span className="font-mono text-[9px] text-emerald-400">SAVED</span>}
          {status === 'error' && <span className="font-mono text-[9px] text-red-400">ERROR</span>}
          <button
            onClick={() => save()}
            disabled={saving}
            className="flex items-center gap-1.5 h-9 px-4 border border-rc-border font-mono text-[9px] text-rc-muted hover:text-white transition-colors rounded-sm disabled:opacity-50"
          >
            <Save size={11} />
            SAVE
          </button>
          {post.published ? (
            <button
              onClick={() => save(false)}
              disabled={saving}
              className="flex items-center gap-1.5 h-9 px-4 border border-rc-border font-mono text-[9px] text-rc-muted hover:text-white transition-colors rounded-sm disabled:opacity-50"
            >
              <EyeOff size={11} />
              UNPUBLISH
            </button>
          ) : (
            <button
              onClick={() => save(true)}
              disabled={saving}
              className="flex items-center gap-1.5 h-9 px-4 bg-white text-black font-mono text-[9px] tracking-[0.18em] rounded-sm hover:bg-zinc-100 transition-colors disabled:opacity-50"
            >
              <Globe size={11} />
              PUBLISH
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block font-mono text-[8px] tracking-[0.2em] text-rc-muted mb-1.5">TITLE</label>
          <input
            className="w-full bg-transparent border-0 border-b border-rc-border pb-2 font-display text-3xl text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-500 transition-colors"
            placeholder="Post title…"
            value={post.title}
            onChange={e => setPost(p => p ? { ...p, title: e.target.value } : p)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-mono text-[8px] tracking-[0.2em] text-rc-muted mb-1.5">SLUG</label>
            <input className={inputCls} value={post.slug ?? ''} onChange={e => setPost(p => p ? { ...p, slug: e.target.value } : p)} />
          </div>
          <div>
            <label className="block font-mono text-[8px] tracking-[0.2em] text-rc-muted mb-1.5">CATEGORY</label>
            <input className={inputCls} value={post.category ?? ''} onChange={e => setPost(p => p ? { ...p, category: e.target.value } : p)} placeholder="e.g. Style, Culture…" />
          </div>
        </div>

        <div>
          <label className="block font-mono text-[8px] tracking-[0.2em] text-rc-muted mb-1.5">EXCERPT</label>
          <textarea
            className="w-full bg-transparent border border-rc-border rounded-sm px-3 py-2 font-mono text-[11px] text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-500 transition-colors resize-none h-16"
            value={post.excerpt ?? ''}
            onChange={e => setPost(p => p ? { ...p, excerpt: e.target.value } : p)}
          />
        </div>

        <div>
          <label className="block font-mono text-[8px] tracking-[0.2em] text-rc-muted mb-1.5">AUTHOR</label>
          <input className={inputCls} value={post.author ?? ''} onChange={e => setPost(p => p ? { ...p, author: e.target.value } : p)} />
        </div>

        <div>
          <label className="block font-mono text-[8px] tracking-[0.2em] text-rc-muted mb-1.5">CONTENT</label>
          <RichTextEditor
            content={post.content ?? ''}
            onChange={handleContent}
            onImageUpload={uploadImage}
            placeholder="Start writing your post…"
          />
        </div>
      </div>
    </div>
  )
}
