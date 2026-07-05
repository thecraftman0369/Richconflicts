'use client'

import { useEffect, useRef, useState } from 'react'
import {
  DndContext, closestCenter, KeyboardSensor,
  PointerSensor, TouchSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, X, Pencil, Trash2, Upload, ImageIcon, GripVertical } from 'lucide-react'
import Image from 'next/image'
import { createClient } from '@/app/supabase/client'

/* ─── Types ─── */

type Product = {
  id:             string
  name:           string
  description:    string | null
  category:       string | null
  price:          number
  original_price: number | null
  stock:          number
  image_url:      string | null
  images:         string[]
  slug:           string | null
  featured:       boolean
  is_new:         boolean
  categories:     string[]
  sizes:          string[]
  inventory:      Record<string, number> | null
  sort_order:     number
  created_at:     string
}

type FormState = {
  name:           string
  description:    string
  category:       string
  price:          number
  original_price: number | null
  images:         string[]
  slug:           string
  featured:       boolean
  is_new:         boolean
  categories:     string[]
  sizes:          string[]
  inventory:      Record<string, number>
}

const ALL_SIZES   = ['XS', 'S', 'M', 'L', 'XL', '2XL']
const CATEGORIES  = ['t-shirts', 'hoodies', 'sweatsuits', 'accessories']
const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL']

const defaultInventory = () =>
  Object.fromEntries(DEFAULT_SIZES.map(s => [s, 0])) as Record<string, number>

const EMPTY: FormState = {
  name: '', description: '', category: '', price: 0, original_price: null,
  images: [], slug: '', featured: false, is_new: false,
  categories: [], sizes: DEFAULT_SIZES, inventory: defaultInventory(),
}

/* ─── Primitive UI ─── */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-mono text-[8px] tracking-[0.2em] text-rc-muted mb-1.5">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full bg-transparent border border-rc-border rounded-sm px-3 h-9 font-mono text-[11px] text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-500 transition-colors'

/* ─── Sortable product row ─── */

function SortableRow({
  product,
  onEdit,
  onDelete,
}: {
  product: Product
  onEdit:  (p: Product) => void
  onDelete:(id: string)  => void
}) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: product.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    position: isDragging ? ('relative' as const) : undefined,
  }

  const thumb    = product.images?.[0] ?? product.image_url
  const totalStk = product.inventory
    ? Object.values(product.inventory).reduce((a, b) => a + b, 0)
    : (product.stock ?? 0)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 px-4 py-3 border-b border-rc-border transition-colors ${
        isDragging ? 'bg-zinc-900 opacity-80' : 'bg-black hover:bg-white/[0.02]'
      }`}
    >
      {/* Drag handle — touch-friendly */}
      <button
        {...attributes}
        {...listeners}
        className="shrink-0 p-1 text-zinc-700 hover:text-zinc-400 cursor-grab active:cursor-grabbing touch-none select-none"
        aria-label="Drag to reorder"
        title="Drag to reorder"
      >
        <GripVertical size={15} strokeWidth={1.5} />
      </button>

      {/* Thumbnail */}
      <div className="shrink-0 w-9 h-11 bg-zinc-900 border border-rc-border rounded-sm overflow-hidden flex items-center justify-center">
        {thumb ? (
          <Image src={thumb} alt={product.name} width={36} height={44} className="w-full h-full object-cover" />
        ) : (
          <ImageIcon size={12} className="text-zinc-700" />
        )}
      </div>

      {/* Name + slug — grows to fill */}
      <div className="flex-1 min-w-0">
        <p className="font-mono text-[10px] text-white truncate">{product.name}</p>
        {product.slug && (
          <p className="font-mono text-[8px] text-rc-muted truncate">{product.slug}</p>
        )}
        {/* Badges visible on mobile only */}
        <div className="flex items-center gap-1 mt-0.5 md:hidden">
          <span className="font-mono text-[10px] text-white">${product.price.toFixed(2)}</span>
          {product.featured && <span className="font-mono text-[7px] text-purple-400 ml-1">FEAT</span>}
          {product.is_new   && <span className="font-mono text-[7px] text-emerald-400 ml-1">NEW</span>}
        </div>
      </div>

      {/* Price — desktop only */}
      <div className="hidden md:block shrink-0 w-20 text-right">
        <p className="font-mono text-[10px] text-white">${product.price.toFixed(2)}</p>
        {product.original_price && (
          <p className="font-mono text-[8px] text-rc-muted line-through">${product.original_price.toFixed(2)}</p>
        )}
      </div>

      {/* Stock + per-size breakdown — desktop only */}
      <div className="hidden md:block shrink-0 w-28">
        <span className={`font-mono text-[9px] ${totalStk < 5 ? 'text-amber-400' : 'text-white'}`}>
          {totalStk} units
        </span>
        {product.inventory && (
          <p className="font-mono text-[7px] text-rc-muted mt-0.5 leading-snug">
            {Object.entries(product.inventory)
              .filter(([, q]) => q > 0)
              .map(([s, q]) => `${s}:${q}`)
              .join(' · ')}
          </p>
        )}
      </div>

      {/* Flags — desktop only */}
      <div className="hidden md:flex flex-col gap-0.5 shrink-0 w-16">
        {product.featured && <span className="font-mono text-[7px] text-purple-400">FEATURED</span>}
        {product.is_new   && <span className="font-mono text-[7px] text-emerald-400">NEW</span>}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onEdit(product)}
          className="p-1.5 text-rc-muted hover:text-white transition-colors rounded-sm hover:bg-white/[0.04]"
          aria-label="Edit"
        >
          <Pencil size={12} />
        </button>
        <button
          onClick={() => onDelete(product.id)}
          className="p-1.5 text-rc-muted hover:text-red-400 transition-colors rounded-sm hover:bg-red-900/10"
          aria-label="Delete"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}

/* ─── Main page ─── */

export default function ProductsPage() {
  const supabase     = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [products,  setProducts]  = useState<Product[]>([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [editing,   setEditing]   = useState<Product | null>(null)
  const [form,      setForm]      = useState<FormState>({ ...EMPTY, inventory: defaultInventory() })
  const [saving,    setSaving]    = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState('')
  const [imgError,  setImgError]  = useState('')
  const [savingOrder, setSavingOrder] = useState(false)

  /* DnD sensors — PointerSensor covers mouse; TouchSensor covers mobile with a
     short delay so normal scrolling still works */
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('sort_order', { ascending: true })
    setProducts((data ?? []) as Product[])
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Drag end: reorder locally then batch-save to Supabase ── */
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = products.findIndex(p => p.id === active.id)
    const newIndex = products.findIndex(p => p.id === over.id)
    const reordered = arrayMove(products, oldIndex, newIndex)
    setProducts(reordered)

    setSavingOrder(true)
    const updates = reordered.map((p, i) => ({ id: p.id, sort_order: i + 1 }))
    await supabase.from('products').upsert(updates, { onConflict: 'id' })
    setSavingOrder(false)
  }

  /* ── Build inventory map from existing product ── */
  const buildInventory = (p: Product): Record<string, number> => {
    const sizes = p.sizes?.length ? p.sizes : DEFAULT_SIZES
    const inv: Record<string, number> = {}
    sizes.forEach(s => {
      inv[s] = (p.inventory && typeof p.inventory === 'object') ? (p.inventory[s] ?? 0) : 0
    })
    return inv
  }

  const openAdd = () => {
    setEditing(null)
    setForm({ ...EMPTY, inventory: defaultInventory() })
    setError(''); setImgError('')
    setShowForm(true)
  }

  const openEdit = (p: Product) => {
    const sizes = p.sizes?.length ? p.sizes : DEFAULT_SIZES
    const images = p.images?.filter(Boolean).length
      ? p.images.filter(Boolean)
      : p.image_url ? [p.image_url] : []
    setEditing(p)
    setForm({
      name: p.name, description: p.description ?? '',
      category: p.category ?? '', price: p.price,
      original_price: p.original_price, images,
      slug: p.slug ?? '', featured: p.featured, is_new: p.is_new,
      categories: p.categories ?? [], sizes,
      inventory: buildInventory(p),
    })
    setError(''); setImgError('')
    setShowForm(true)
  }

  const toggleSize = (size: string) => {
    setForm(f => {
      const newSizes = f.sizes.includes(size)
        ? f.sizes.filter(s => s !== size)
        : [...f.sizes, size]
      const newInv: Record<string, number> = {}
      newSizes.forEach(s => { newInv[s] = f.inventory[s] ?? 0 })
      return { ...f, sizes: newSizes, inventory: newInv }
    })
  }

  const toggleCategory = (cat: string) => {
    setForm(f => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter(c => c !== cat)
        : [...f.categories, cat],
    }))
  }

  /* ── Image upload ── */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setImgError('')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setImgError('Not authenticated.'); setUploading(false); return }

    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/upload?folder=products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: fd,
    })
    if (fileInputRef.current) fileInputRef.current.value = ''
    setUploading(false)
    if (res.ok) {
      const { url } = await res.json()
      setForm(f => ({ ...f, images: [...f.images, url] }))
    } else {
      const { error: msg } = await res.json().catch(() => ({ error: 'Upload failed.' }))
      setImgError(msg ?? 'Upload failed.')
    }
  }

  const removeImage = (index: number) => {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== index) }))
  }

  /* ── Save ── */
  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required.'); return }
    if (form.price <= 0)   { setError('Price must be greater than 0.'); return }
    setSaving(true); setError('')

    const totalStock = Object.values(form.inventory).reduce((a, b) => a + b, 0)
    const payload = {
      name:           form.name.trim(),
      description:    form.description || null,
      category:       form.category || null,
      price:          form.price,
      original_price: form.original_price || null,
      image_url:      form.images[0] ?? null,
      images:         form.images,
      slug:           form.slug || null,
      featured:       form.featured,
      is_new:         form.is_new,
      categories:     form.categories,
      sizes:          form.sizes,
      inventory:      form.inventory,
      stock:          totalStock,
      updated_at:     new Date().toISOString(),
    }

    if (editing) {
      const { error: err } = await supabase.from('products').update(payload).eq('id', editing.id)
      if (err) { setError(err.message); setSaving(false); return }
    } else {
      // New products go to the top (sort_order = 0 shifts all others down)
      const maxOrder = products.length + 1
      const { error: err } = await supabase.from('products').insert({
        ...payload,
        sort_order:  maxOrder,
        created_at:  new Date().toISOString(),
      })
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

  const totalInventory = Object.values(form.inventory).reduce((a, b) => a + b, 0)

  return (
    <div className="p-4 md:p-6 max-w-[1200px]">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="font-mono text-[8px] tracking-[0.25em] text-rc-muted mb-1">MASTER ADMIN</p>
          <h1 className="font-display text-3xl text-white">PRODUCTS</h1>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 h-9 px-4 bg-white text-black font-mono text-[9px] tracking-[0.18em] rounded-sm hover:bg-zinc-100 transition-colors"
        >
          <Plus size={12} strokeWidth={2.5} /> ADD PRODUCT
        </button>
      </div>

      {/* Hint + saving indicator */}
      <div className="flex items-center justify-between mb-3">
        <p className="font-mono text-[8px] text-zinc-700 tracking-[0.1em]">
          DRAG <GripVertical size={9} className="inline -mt-0.5" /> TO REORDER — ORDER IS REFLECTED IN THE SHOP AND HOMEPAGE
        </p>
        {savingOrder && (
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 border border-white/30 border-t-white rounded-full animate-spin" />
            <span className="font-mono text-[8px] text-rc-muted">SAVING ORDER…</span>
          </div>
        )}
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
          {/* Column headers — desktop only */}
          <div className="hidden md:flex items-center gap-3 px-4 py-2 border-b border-rc-border bg-white/[0.02]">
            <div className="w-6" />
            <div className="w-9" />
            <p className="flex-1 font-mono text-[8px] tracking-[0.2em] text-rc-muted">NAME</p>
            <p className="w-20 text-right font-mono text-[8px] tracking-[0.2em] text-rc-muted">PRICE</p>
            <p className="w-28 font-mono text-[8px] tracking-[0.2em] text-rc-muted">INVENTORY</p>
            <p className="w-16 font-mono text-[8px] tracking-[0.2em] text-rc-muted">FLAGS</p>
            <div className="w-14" />
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={products.map(p => p.id)}
              strategy={verticalListSortingStrategy}
            >
              {products.map(product => (
                <SortableRow
                  key={product.id}
                  product={product}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* ─── Add / Edit modal ─── */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-black border border-rc-border rounded-sm my-4">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-rc-border sticky top-0 bg-black z-10">
              <h2 className="font-display text-xl text-white">{editing ? 'EDIT PRODUCT' : 'ADD PRODUCT'}</h2>
              <button onClick={() => setShowForm(false)} className="text-rc-muted hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="p-4 md:p-6 space-y-5">

              {/* Name + Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="PRODUCT NAME *">
                  <input className={inputCls} value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. RC Heavyweight Tee" />
                </Field>
                <Field label="SLUG (URL PATH)">
                  <input className={inputCls} value={form.slug}
                    onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                    placeholder="e.g. rc-heavyweight-tee" />
                </Field>
              </div>

              {/* Description */}
              <Field label="DESCRIPTION">
                <textarea
                  className="w-full bg-transparent border border-rc-border rounded-sm px-3 py-2 font-mono text-[11px] text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-500 transition-colors resize-none h-20"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Product description…"
                />
              </Field>

              {/* Price */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="PRICE ($) *">
                  <input type="number" min="0" step="0.01" className={inputCls}
                    value={form.price || ''} placeholder="0.00"
                    onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} />
                </Field>
                <Field label="SALE PRICE ($) — blank if no sale">
                  <input type="number" min="0" step="0.01" className={inputCls}
                    value={form.original_price ?? ''} placeholder="0.00"
                    onChange={e => setForm(f => ({ ...f, original_price: parseFloat(e.target.value) || null }))} />
                </Field>
              </div>

              {/* Category */}
              <Field label="CATEGORY">
                <select className={inputCls + ' appearance-none cursor-pointer'}
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  <option value="">Select category…</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>

              {/* Sizes */}
              <Field label="AVAILABLE SIZES">
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {ALL_SIZES.map(s => (
                    <button key={s} type="button" onClick={() => toggleSize(s)}
                      className={`font-mono text-[9px] w-10 h-8 rounded-sm border transition-colors ${
                        form.sizes.includes(s) ? 'bg-white text-black border-white' : 'border-rc-border text-rc-muted hover:text-white'
                      }`}>{s}</button>
                  ))}
                </div>
              </Field>

              {/* Per-size inventory */}
              <Field label={`INVENTORY PER SIZE — TOTAL: ${totalInventory} UNITS`}>
                {form.sizes.length === 0 ? (
                  <p className="font-mono text-[9px] text-zinc-700 mt-1">Select sizes above to set inventory.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 mt-1">
                    {form.sizes.map(size => (
                      <div key={size} className="flex items-center gap-2">
                        <span className="font-mono text-[9px] text-rc-muted w-7 shrink-0">{size}</span>
                        <input type="number" min="0"
                          className="flex-1 bg-transparent border border-rc-border rounded-sm px-2 h-8 font-mono text-[11px] text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-500 transition-colors"
                          value={form.inventory[size] ?? ''} placeholder="0"
                          onChange={e => setForm(f => ({
                            ...f,
                            inventory: { ...f.inventory, [size]: parseInt(e.target.value) || 0 },
                          }))} />
                      </div>
                    ))}
                  </div>
                )}
              </Field>

              {/* Product images */}
              <Field label="PRODUCT IMAGES">
                <div className="space-y-3 mt-1">
                  {form.images.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {form.images.map((url, i) => (
                        <div key={i} className="relative group w-16 h-20 shrink-0">
                          <div className="w-full h-full border border-rc-border rounded-sm overflow-hidden bg-zinc-900">
                            <Image src={url} alt={`Product image ${i + 1}`} width={64} height={80} className="w-full h-full object-cover" />
                          </div>
                          {i === 0 && (
                            <span className="absolute bottom-0.5 left-0.5 font-mono text-[6px] bg-black/80 text-white px-1 py-0.5 rounded-sm leading-none">
                              PRIMARY
                            </span>
                          )}
                          <button onClick={() => removeImage(i)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-zinc-800 border border-rc-border text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-900">
                            <X size={8} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-2 h-9 px-4 border border-rc-border text-rc-muted font-mono text-[9px] tracking-[0.14em] rounded-sm hover:border-zinc-500 hover:text-white transition-colors disabled:opacity-50">
                      {uploading ? (
                        <><div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />UPLOADING…</>
                      ) : (
                        <><Upload size={11} />UPLOAD IMAGE</>
                      )}
                    </button>
                    <p className="font-mono text-[8px] text-zinc-700 tracking-[0.08em]">
                      JPG, PNG, WEBP · MAX 10MB · First = primary
                    </p>
                  </div>
                  {imgError && <p className="font-mono text-[8px] text-red-400 tracking-[0.1em]">{imgError}</p>}
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                    className="hidden" onChange={handleImageUpload} />
                </div>
              </Field>

              {/* Flags */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.featured}
                    onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))}
                    className="accent-white w-3.5 h-3.5" />
                  <span className="font-mono text-[9px] text-white tracking-[0.12em]">FEATURED ON HOMEPAGE</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_new}
                    onChange={e => setForm(f => ({ ...f, is_new: e.target.checked }))}
                    className="accent-white w-3.5 h-3.5" />
                  <span className="font-mono text-[9px] text-white tracking-[0.12em]">NEW ARRIVAL</span>
                </label>
              </div>

              {error && <p className="font-mono text-[9px] text-red-400 tracking-[0.1em]">{error}</p>}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 h-10 bg-white text-black font-mono text-[9px] tracking-[0.2em] rounded-sm hover:bg-zinc-100 transition-colors disabled:opacity-50">
                  {saving ? 'SAVING…' : editing ? 'SAVE CHANGES' : 'ADD PRODUCT'}
                </button>
                <button onClick={() => setShowForm(false)}
                  className="h-10 px-4 border border-rc-border font-mono text-[9px] text-rc-muted hover:text-white transition-colors rounded-sm">
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
