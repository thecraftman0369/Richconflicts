'use client'

import { useEffect, useState } from 'react'
import { Plus, X, Pencil, Trash2, ChevronDown } from 'lucide-react'
import { createClient } from '@/app/supabase/client'

type Product = {
  id: string
  name: string
  description: string | null
  category: string | null
  price: number
  original_price: number | null
  stock: number
  image_url: string | null
  images: string[]
  slug: string | null
  featured: boolean
  is_new: boolean
  categories: string[]
  sizes: string[]
  created_at: string
}

const EMPTY: Omit<Product, 'id' | 'created_at'> = {
  name: '', description: '', category: '', price: 0, original_price: null,
  stock: 0, image_url: '', images: [], slug: '', featured: false,
  is_new: false, categories: [], sizes: ['XS', 'S', 'M', 'L', 'XL'],
}

const CATEGORIES = ['t-shirts', 'hoodies', 'sweatsuits', 'new-arrivals']

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-mono text-[8px] tracking-[0.2em] text-rc-muted mb-1.5">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full bg-transparent border border-rc-border rounded-sm px-3 h-9 font-mono text-[11px] text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-500 transition-colors'

export default function ProductsPage() {
  const supabase = createClient()
  const [products, setProducts] = useState<Product[]>([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing,  setEditing]  = useState<Product | null>(null)
  const [form,     setForm]     = useState({ ...EMPTY })
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    setProducts((data ?? []) as Product[])
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const openAdd = () => {
    setEditing(null)
    setForm({ ...EMPTY })
    setError('')
    setShowForm(true)
  }

  const openEdit = (p: Product) => {
    setEditing(p)
    setForm({
      name: p.name, description: p.description ?? '', category: p.category ?? '',
      price: p.price, original_price: p.original_price, stock: p.stock,
      image_url: p.image_url ?? '', images: p.images ?? [],
      slug: p.slug ?? '', featured: p.featured, is_new: p.is_new,
      categories: p.categories ?? [], sizes: p.sizes ?? ['XS','S','M','L','XL'],
    })
    setError('')
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required.'); return }
    if (form.price <= 0)   { setError('Price must be greater than 0.'); return }
    setSaving(true)
    setError('')

    const payload = {
      name:          form.name.trim(),
      description:   form.description || null,
      category:      form.category || null,
      price:         form.price,
      original_price: form.original_price || null,
      stock:         form.stock,
      image_url:     form.image_url || null,
      images:        form.images,
      slug:          form.slug || null,
      featured:      form.featured,
      is_new:        form.is_new,
      categories:    form.categories,
      sizes:         form.sizes,
      updated_at:    new Date().toISOString(),
    }

    if (editing) {
      const { error: err } = await supabase.from('products').update(payload).eq('id', editing.id)
      if (err) { setError(err.message); setSaving(false); return }
    } else {
      const { error: err } = await supabase.from('products').insert({ ...payload, created_at: new Date().toISOString() })
      if (err) { setError(err.message); setSaving(false); return }
    }

    await load()
    setSaving(false)
    setShowForm(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return
    await supabase.from('products').delete().eq('id', id)
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  const toggleSize = (size: string) => {
    setForm(f => ({
      ...f,
      sizes: f.sizes.includes(size) ? f.sizes.filter(s => s !== size) : [...f.sizes, size],
    }))
  }

  const toggleCategory = (cat: string) => {
    setForm(f => ({
      ...f,
      categories: f.categories.includes(cat) ? f.categories.filter(c => c !== cat) : [...f.categories, cat],
    }))
  }

  return (
    <div className="p-6 max-w-[1200px]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-mono text-[8px] tracking-[0.25em] text-rc-muted mb-1">MASTER ADMIN</p>
          <h1 className="font-display text-3xl text-white">PRODUCTS</h1>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 h-9 px-4 bg-white text-black font-mono text-[9px] tracking-[0.18em] rounded-sm hover:bg-zinc-100 transition-colors"
        >
          <Plus size={12} strokeWidth={2.5} />
          ADD PRODUCT
        </button>
      </div>

      {/* Product list */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-5 h-5 border border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="border border-rc-border rounded-sm py-16 text-center">
          <p className="font-mono text-[10px] text-rc-muted tracking-[0.2em]">NO PRODUCTS YET.</p>
          <button onClick={openAdd} className="mt-3 font-mono text-[9px] text-white underline underline-offset-2 hover:opacity-60">
            Add your first product
          </button>
        </div>
      ) : (
        <div className="border border-rc-border rounded-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-rc-border bg-white/[0.02]">
                {['NAME', 'CATEGORY', 'PRICE', 'STOCK', 'FLAGS', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-mono text-[8px] tracking-[0.2em] text-rc-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="border-b border-rc-border hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-mono text-[10px] text-white">{p.name}</p>
                    {p.slug && <p className="font-mono text-[8px] text-rc-muted">{p.slug}</p>}
                  </td>
                  <td className="px-4 py-3 font-mono text-[9px] text-zinc-400">{p.category ?? '—'}</td>
                  <td className="px-4 py-3">
                    <p className="font-mono text-[10px] text-white">${p.price.toFixed(2)}</p>
                    {p.original_price && (
                      <p className="font-mono text-[8px] text-rc-muted line-through">${p.original_price.toFixed(2)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-mono text-[9px] ${(p.stock ?? 0) < 5 ? 'text-amber-400' : 'text-white'}`}>
                      {p.stock ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[8px] text-rc-muted space-x-1">
                    {p.featured && <span className="text-purple-400">FEATURED</span>}
                    {p.is_new   && <span className="text-emerald-400">NEW</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(p)} className="p-1 text-rc-muted hover:text-white transition-colors">
                        <Pencil size={11} />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-1 text-rc-muted hover:text-red-400 transition-colors">
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

      {/* Add/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-black border border-rc-border rounded-sm overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-rc-border sticky top-0 bg-black z-10">
              <h2 className="font-display text-xl text-white">{editing ? 'EDIT PRODUCT' : 'ADD PRODUCT'}</h2>
              <button onClick={() => setShowForm(false)} className="text-rc-muted hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="PRODUCT NAME *">
                  <input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. RC Heavyweight Tee" />
                </Field>
                <Field label="SLUG (URL)">
                  <input className={inputCls} value={form.slug ?? ''} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="e.g. rc-heavyweight-tee" />
                </Field>
              </div>

              <Field label="DESCRIPTION">
                <textarea
                  className="w-full bg-transparent border border-rc-border rounded-sm px-3 py-2 font-mono text-[11px] text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-500 transition-colors resize-none h-20"
                  value={form.description ?? ''}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Product description…"
                />
              </Field>

              <div className="grid grid-cols-3 gap-4">
                <Field label="PRICE ($) *">
                  <input type="number" min="0" step="0.01" className={inputCls} value={form.price || ''} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} placeholder="0.00" />
                </Field>
                <Field label="ORIGINAL PRICE ($)">
                  <input type="number" min="0" step="0.01" className={inputCls} value={form.original_price ?? ''} onChange={e => setForm(f => ({ ...f, original_price: parseFloat(e.target.value) || null }))} placeholder="0.00" />
                </Field>
                <Field label="STOCK">
                  <input type="number" min="0" className={inputCls} value={form.stock || ''} onChange={e => setForm(f => ({ ...f, stock: parseInt(e.target.value) || 0 }))} placeholder="0" />
                </Field>
              </div>

              <Field label="PRIMARY CATEGORY">
                <select
                  className={inputCls + ' appearance-none cursor-pointer'}
                  value={form.category ?? ''}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                >
                  <option value="">Select category…</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>

              <Field label="TAGS / SECONDARY CATEGORIES">
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {CATEGORIES.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCategory(c)}
                      className={`font-mono text-[8px] tracking-[0.12em] px-2 py-1 rounded-sm border transition-colors ${
                        form.categories.includes(c)
                          ? 'bg-white text-black border-white'
                          : 'border-rc-border text-rc-muted hover:text-white'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="AVAILABLE SIZES">
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {['XS','S','M','L','XL','2XL'].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSize(s)}
                      className={`font-mono text-[9px] w-10 h-8 rounded-sm border transition-colors ${
                        form.sizes.includes(s)
                          ? 'bg-white text-black border-white'
                          : 'border-rc-border text-rc-muted hover:text-white'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="PRIMARY IMAGE URL">
                <input className={inputCls} value={form.image_url ?? ''} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://…" />
              </Field>

              <Field label="ADDITIONAL IMAGE URLS (one per line)">
                <textarea
                  className="w-full bg-transparent border border-rc-border rounded-sm px-3 py-2 font-mono text-[11px] text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-500 transition-colors resize-none h-20"
                  value={form.images.join('\n')}
                  onChange={e => setForm(f => ({ ...f, images: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) }))}
                  placeholder="https://…"
                />
              </Field>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))}
                    className="accent-white w-3.5 h-3.5"
                  />
                  <span className="font-mono text-[9px] text-white tracking-[0.12em]">FEATURED</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_new}
                    onChange={e => setForm(f => ({ ...f, is_new: e.target.checked }))}
                    className="accent-white w-3.5 h-3.5"
                  />
                  <span className="font-mono text-[9px] text-white tracking-[0.12em]">NEW ARRIVAL</span>
                </label>
              </div>

              {error && (
                <p className="font-mono text-[9px] text-red-400 tracking-[0.1em]">{error}</p>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 h-10 bg-white text-black font-mono text-[9px] tracking-[0.2em] rounded-sm hover:bg-zinc-100 transition-colors disabled:opacity-50"
                >
                  {saving ? 'SAVING…' : editing ? 'SAVE CHANGES' : 'ADD PRODUCT'}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="h-10 px-4 border border-rc-border font-mono text-[9px] text-rc-muted hover:text-white transition-colors rounded-sm"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
