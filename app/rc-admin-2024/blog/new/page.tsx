'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ArrowLeft, Save, Globe } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/app/supabase/client'

const RichTextEditor = dynamic(() => import('@/components/admin/RichTextEditor'), { ssr: false })

const inputCls = 'w-full bg-transparent border border-rc-border rounded-sm px-3 h-9 font-mono text-[11px] text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-500 transition-colors'

export default function NewPostPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [title,   setTitle]   = useState('')
  const [slug,    setSlug]    = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [category, setCategory] = useState('')
  const [author,  setAuthor]  = useState('Rich Conflicts')
  const [content, setContent] = useState('')
  const [saving,  setSaving]  = useState(false)
  const [status,  setStatus]  = useState<'idle' | 'saved' | 'error'>('idle')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const autoSlug = (t: string) =>
    t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

  const handleTitleChange = (v: string) => {
    setTitle(v)
    if (!slug) setSlug(autoSlug(v))
  }

  const uploadImage = async (file: File): Promise<string> => {
    const ext  = file.name.split('.').pop()
    const path = `${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from('blog-images').upload(path, file, { upsert: false })
    if (error) throw new Error(error.message)
    const { data } = supabase.storage.from('blog-images').getPublicUrl(path)
    return data.publicUrl
  }

  const handleContent = useCallback((html: string) => {
    setContent(html)
  }, [])

  const save = async (publish: boolean) => {
    setSaving(true)
    setStatus('idle')
    const { error } = await supabase.from('blogs').insert({
      title:     title || '(Untitled)',
      slug:      slug  || autoSlug(title) || null,
      excerpt:   excerpt || null,
      category:  category || null,
      author:    author || 'Rich Conflicts',
      content,
      published: publish,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    setSaving(false)
    if (error) { setStatus('error'); return }
    router.replace('/rc-admin-2024/blog')
  }

  return (
    <div className="p-6 max-w-[900px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/rc-admin-2024/blog" className="p-1 text-rc-muted hover:text-white transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="font-mono text-[8px] tracking-[0.25em] text-rc-muted mb-1">NEW POST</p>
            <h1 className="font-display text-2xl text-white">BLOG EDITOR</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => save(false)}
            disabled={saving}
            className="flex items-center gap-1.5 h-9 px-4 border border-rc-border font-mono text-[9px] text-rc-muted hover:text-white transition-colors rounded-sm disabled:opacity-50"
          >
            <Save size={11} />
            SAVE DRAFT
          </button>
          <button
            onClick={() => save(true)}
            disabled={saving}
            className="flex items-center gap-1.5 h-9 px-4 bg-white text-black font-mono text-[9px] tracking-[0.18em] rounded-sm hover:bg-zinc-100 transition-colors disabled:opacity-50"
          >
            <Globe size={11} />
            PUBLISH
          </button>
        </div>
      </div>

      {status === 'error' && (
        <p className="font-mono text-[9px] text-red-400 mb-4 tracking-[0.1em]">Error saving post. Please try again.</p>
      )}

      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block font-mono text-[8px] tracking-[0.2em] text-rc-muted mb-1.5">TITLE</label>
          <input
            className="w-full bg-transparent border-0 border-b border-rc-border pb-2 font-display text-3xl text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-500 transition-colors"
            placeholder="Post title…"
            value={title}
            onChange={e => handleTitleChange(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-mono text-[8px] tracking-[0.2em] text-rc-muted mb-1.5">SLUG</label>
            <input className={inputCls} value={slug} onChange={e => setSlug(e.target.value)} placeholder="auto-generated-from-title" />
          </div>
          <div>
            <label className="block font-mono text-[8px] tracking-[0.2em] text-rc-muted mb-1.5">CATEGORY</label>
            <input className={inputCls} value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Style, Culture…" />
          </div>
        </div>

        <div>
          <label className="block font-mono text-[8px] tracking-[0.2em] text-rc-muted mb-1.5">EXCERPT</label>
          <textarea
            className="w-full bg-transparent border border-rc-border rounded-sm px-3 py-2 font-mono text-[11px] text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-500 transition-colors resize-none h-16"
            value={excerpt}
            onChange={e => setExcerpt(e.target.value)}
            placeholder="Brief summary shown on blog listing…"
          />
        </div>

        <div>
          <label className="block font-mono text-[8px] tracking-[0.2em] text-rc-muted mb-1.5">AUTHOR</label>
          <input className={inputCls} value={author} onChange={e => setAuthor(e.target.value)} />
        </div>

        {/* Editor */}
        <div>
          <label className="block font-mono text-[8px] tracking-[0.2em] text-rc-muted mb-1.5">CONTENT</label>
          <RichTextEditor
            content={content}
            onChange={handleContent}
            onImageUpload={uploadImage}
            placeholder="Start writing your post…"
          />
        </div>
      </div>
    </div>
  )
}
