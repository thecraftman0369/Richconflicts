'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/app/supabase/client'

type BlogPost = {
  id: string
  title: string
  slug: string | null
  excerpt: string | null
  category: string | null
  author: string | null
  published: boolean
  created_at: string
  updated_at: string | null
}

export default function BlogListPage() {
  const supabase = createClient()
  const [posts,   setPosts]   = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('blogs').select('id, title, slug, excerpt, category, author, published, created_at, updated_at').order('created_at', { ascending: false })
    setPosts((data ?? []) as BlogPost[])
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const togglePublish = async (post: BlogPost) => {
    const { error } = await supabase.from('blogs').update({ published: !post.published, updated_at: new Date().toISOString() }).eq('id', post.id)
    if (!error) setPosts(prev => prev.map(p => p.id === post.id ? { ...p, published: !p.published } : p))
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post? This cannot be undone.')) return
    await supabase.from('blogs').delete().eq('id', id)
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="p-6 max-w-[1200px]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-mono text-[8px] tracking-[0.25em] text-rc-muted mb-1">MASTER ADMIN</p>
          <h1 className="font-display text-3xl text-white">BLOG</h1>
        </div>
        <Link
          href="/rc-admin-2024/blog/new"
          className="flex items-center gap-2 h-9 px-4 bg-white text-black font-mono text-[9px] tracking-[0.18em] rounded-sm hover:bg-zinc-100 transition-colors"
        >
          <Plus size={12} strokeWidth={2.5} />
          NEW POST
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-5 h-5 border border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="border border-rc-border rounded-sm py-16 text-center">
          <p className="font-mono text-[10px] text-rc-muted tracking-[0.2em]">NO POSTS YET.</p>
          <Link href="/rc-admin-2024/blog/new" className="mt-3 inline-block font-mono text-[9px] text-white underline underline-offset-2 hover:opacity-60">
            Write your first post
          </Link>
        </div>
      ) : (
        <div className="border border-rc-border rounded-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-rc-border bg-white/[0.02]">
                {['TITLE', 'CATEGORY', 'AUTHOR', 'DATE', 'STATUS', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-mono text-[8px] tracking-[0.2em] text-rc-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {posts.map(post => (
                <tr key={post.id} className="border-b border-rc-border hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-mono text-[10px] text-white line-clamp-1">{post.title || '(Untitled)'}</p>
                    {post.excerpt && <p className="font-mono text-[8px] text-rc-muted line-clamp-1 mt-0.5">{post.excerpt}</p>}
                  </td>
                  <td className="px-4 py-3 font-mono text-[9px] text-zinc-400">{post.category ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-[9px] text-zinc-400">{post.author ?? 'Rich Conflicts'}</td>
                  <td className="px-4 py-3 font-mono text-[9px] text-zinc-500">
                    {new Date(post.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-mono text-[8px] tracking-[0.12em] border px-2 py-0.5 rounded-sm ${
                      post.published
                        ? 'text-green-400 border-green-900/40 bg-green-950/20'
                        : 'text-zinc-500 border-zinc-800 bg-zinc-900/20'
                    }`}>
                      {post.published ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => togglePublish(post)}
                        title={post.published ? 'Unpublish' : 'Publish'}
                        className="p-1 text-rc-muted hover:text-white transition-colors"
                      >
                        {post.published ? <EyeOff size={11} /> : <Eye size={11} />}
                      </button>
                      <Link href={`/rc-admin-2024/blog/${post.id}`} className="p-1 text-rc-muted hover:text-white transition-colors">
                        <Pencil size={11} />
                      </Link>
                      <button onClick={() => handleDelete(post.id)} className="p-1 text-rc-muted hover:text-red-400 transition-colors">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
