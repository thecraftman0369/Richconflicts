'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor,
  useSensor, useSensors, DragOverlay, useDroppable,
  type DragStartEvent, type DragOverEvent, type DragEndEvent,
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
  id: string; name: string; description: string | null; category: string | null
  price: number; original_price: number | null; stock: number; image_url: string | null
  images: string[]; slug: string | null; featured: boolean; is_new: boolean
  categories: string[]; sizes: string[]; inventory: Record<string, number> | null
  sort_order: number; created_at: string
}

type FormState = {
  name: string; description: string; category: string; price: number
  original_price: number | null; images: string[]; slug: string
  featured: boolean; is_new: boolean; categories: string[]; sizes: string[]
  inventory: Record<string, number>
}

/* ─── Constants ─── */
const ALL_SIZES    = ['XS', 'S', 'M', 'L', 'XL', '2XL']
const CATEGORIES   = ['t-shirts', 'sweatsuits']
const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL']

const SECTION_DEFS: { id: string; label: string; cap: number | null }[] = [
  { id: 'homepage',   label: 'HOMEPAGE — NEW ARRIVALS', cap: 4 },
  { id: 'sweatsuits', label: 'SWEATSUITS',              cap: null },
  { id: 't-shirts',   label: 'T-SHIRTS',                cap: null },
]

function getSectionId(p: Product): string {
  if (p.featured || p.is_new) return 'homepage'
  if (p.category === 'sweatsuits') return 'sweatsuits'
  return 't-shirts'
}

function applySection(p: Product, sectionId: string): Product {
  if (sectionId === 'homepage') return { ...p, is_new: true, featured: true }
  const category = sectionId === 'uncategorized' ? null : sectionId
  return { ...p, is_new: false, featured: false, category }
}

const defaultInventory = () =>
  Object.fromEntries(DEFAULT_SIZES.map(s => [s, 0])) as Record<string, number>

const EMPTY: FormState = {
  name: '', description: '', category: '', price: 0, original_price: null,
  images: [], slug: '', featured: false, is_new: false,
  categories: [], sizes: DEFAULT_SIZES, inventory: defaultInventory(),
}

/* ─── Field wrapper ─── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-mono text-[8px] tracking-[0.2em] text-rc-muted mb-1.5">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full bg-transparent border border-rc-border rounded-sm px-3 h-9 font-mono text-[11px] text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-500 transition-colors'

/* ─── Shared row content (used by both sortable row and drag overlay) ─── */
function ProductRowContent({
  product, onEdit, onDelete, dragHandleProps, faded,
}: {
  product:          Product
  onEdit?:          (p: Product) => void
  onDelete?:        (id: string) => void
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>
  faded?:           boolean
}) {
  const thumb    = product.images?.[0] ?? product.image_url
  const totalStk = product.inventory
    ? Object.values(product.inventory).reduce((a, b) => a + b, 0)
    : (product.stock ?? 0)

  return (
    <div className={`flex items-center gap-3 px-4 py-3 border-b border-rc-border bg-black transition-opacity ${faded ? 'opacity-30' : ''}`}>
      <button
        {...dragHandleProps}
        className="shrink-0 p-1 text-zinc-700 hover:text-zinc-400 cursor-grab active:cursor-grabbing touch-none select-none"
        aria-label="Drag to reorder"
      >
        <GripVertical size={15} strokeWidth={1.5} />
      </button>

      <div className="shrink-0 w-9 h-11 bg-zinc-900 border border-rc-border rounded-sm overflow-hidden flex items-center justify-center">
        {thumb
          ? <Image src={thumb} alt={product.name} width={36} height={44} className="w-full h-full object-cover" />
          : <ImageIcon size={12} className="text-zinc-700" />
        }
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-mono text-[10px] text-white truncate">{product.name}</p>
        {product.slug && <p className="font-mono text-[8px] text-rc-muted truncate">{product.slug}</p>}
        <div className="flex items-center gap-1 mt-0.5 md:hidden">
          <span className="font-mono text-[10px] text-white">${product.price.toFixed(2)}</span>
          {product.featured && <span className="font-mono text-[7px] text-purple-400 ml-1">FEAT</span>}
          {product.is_new   && <span className="font-mono text-[7px] text-emerald-400 ml-1">NEW</span>}
        </div>
      </div>

      <div className="hidden md:block shrink-0 w-20 text-right">
        <p className="font-mono text-[10px] text-white">${product.price.toFixed(2)}</p>
        {product.original_price && (
          <p className="font-mono text-[8px] text-rc-muted line-through">${product.original_price.toFixed(2)}</p>
        )}
      </div>

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

      {onEdit && onDelete && (
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
      )}
    </div>
  )
}

/* ─── Sortable row ─── */
function SortableRow({ product, onEdit, onDelete }: {
  product:  Product
  onEdit:   (p: Product) => void
  onDelete: (id: string) => void
}) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: product.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <ProductRowContent
        product={product}
        onEdit={onEdit}
        onDelete={onDelete}
        dragHandleProps={{ ...attributes, ...listeners }}
        faded={isDragging}
      />
    </div>
  )
}

/* ─── Droppable section container (handles empty sections as drop targets) ─── */
function SectionDropZone({ sectionId, children }: { sectionId: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: `section:${sectionId}` })
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[52px] rounded-sm transition-all ${isOver ? 'ring-1 ring-white/20' : ''}`}
    >
      {children}
    </div>
  )
}

/* ─── Column headers (shared across sections) ─── */
function ColumnHeaders() {
  return (
    <div className="hidden md:flex items-center gap-3 px-4 py-2 border-b border-rc-border bg-white/[0.02]">
      <div className="w-6" />
      <div className="w-9" />
      <p className="flex-1 font-mono text-[8px] tracking-[0.2em] text-rc-muted">NAME</p>
      <p className="w-20 text-right font-mono text-[8px] tracking-[0.2em] text-rc-muted">PRICE</p>
      <p className="w-28 font-mono text-[8px] tracking-[0.2em] text-rc-muted">INVENTORY</p>
      <div className="w-14" />
    </div>
  )
}

/* ═══════════════════════ Main page ═══════════════════════ */
export default function ProductsPage() {
  const supabase     = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [products,     setProducts]     = useState<Product[]>([])
  const [loading,      setLoading]      = useState(true)
  const [showForm,     setShowForm]     = useState(false)
  const [editing,      setEditing]      = useState<Product | null>(null)
  const [form,         setForm]         = useState<FormState>({ ...EMPTY, inventory: defaultInventory() })
  const [saving,       setSaving]       = useState(false)
  const [uploading,    setUploading]    = useState(false)
  const [error,        setError]        = useState('')
  const [imgError,     setImgError]     = useState('')
  const [savingOrder,  setSavingOrder]  = useState(false)
  const [unsavedOrder, setUnsavedOrder] = useState(false)
  const [orderSaved,   setOrderSaved]   = useState(false)
  const [activeId,     setActiveId]     = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('products').select('*').order('sort_order', { ascending: true })
    setProducts((data ?? []) as Product[])
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── Drag: record what's being dragged ─── */
  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id as string)
  }

  /* ─── Drag: cross-section move — update category/flags live ─── */
  const handleDragOver = useCallback(({ active, over }: DragOverEvent) => {
    if (!over) return
    const activeIdStr = active.id as string
    const overIdStr   = over.id as string
    if (activeIdStr === overIdStr) return

    setProducts(prev => {
      const activeP = prev.find(p => p.id === activeIdStr)
      if (!activeP) return prev

      // Determine target section (over a product or over a section drop zone)
      let toSectionId: string
      if (overIdStr.startsWith('section:')) {
        toSectionId = overIdStr.replace('section:', '')
      } else {
        const overP = prev.find(p => p.id === overIdStr)
        if (!overP) return prev
        toSectionId = getSectionId(overP)
      }

      const fromSectionId = getSectionId(activeP)
      if (fromSectionId === toSectionId) return prev // same section — handled in onDragEnd

      // Apply new section flags
      const updated = prev.map(p => p.id === activeIdStr ? applySection(p, toSectionId) : p)

      // Reposition next to the over item (if over a product, not a zone)
      if (!overIdStr.startsWith('section:')) {
        const oldIdx = updated.findIndex(p => p.id === activeIdStr)
        const newIdx = updated.findIndex(p => p.id === overIdStr)
        if (oldIdx !== -1 && newIdx !== -1) return arrayMove(updated, oldIdx, newIdx)
      }

      return updated
    })
  }, [])

  /* ─── Drag: finalize within-section reorder ─── */
  const handleDragEnd = useCallback(({ active, over }: DragEndEvent) => {
    setActiveId(null)
    if (!over) { setUnsavedOrder(true); setOrderSaved(false); return }

    const activeIdStr = active.id as string
    const overIdStr   = over.id as string

    if (activeIdStr !== overIdStr && !overIdStr.startsWith('section:')) {
      setProducts(prev => {
        const activeP = prev.find(p => p.id === activeIdStr)
        const overP   = prev.find(p => p.id === overIdStr)
        if (!activeP || !overP) return prev
        // Cross-section already applied in onDragOver — only handle same-section sort here
        if (getSectionId(activeP) !== getSectionId(overP)) return prev
        const oldIdx = prev.findIndex(p => p.id === activeIdStr)
        const newIdx = prev.findIndex(p => p.id === overIdStr)
        return arrayMove(prev, oldIdx, newIdx)
      })
    }

    setUnsavedOrder(true)
    setOrderSaved(false)
  }, [])

  /* ─── Save: persist sort_order + any section changes ─── */
  const saveOrder = async () => {
    setSavingOrder(true)
    setOrderSaved(false)
    const updates = products.map((p, i) => ({
      id:         p.id,
      sort_order: i + 1,
      category:   p.category,
      featured:   p.featured,
      is_new:     p.is_new,
    }))
    const { error: err } = await supabase.from('products').upsert(updates, { onConflict: 'id' })
    setSavingOrder(false)
    if (err) {
      setError('Failed to save: ' + err.message)
    } else {
      setUnsavedOrder(false)
      setOrderSaved(true)
      setTimeout(() => setOrderSaved(false), 3000)
    }
  }

  /* ─── Form helpers ─── */
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
    const sizes  = p.sizes?.length ? p.sizes : DEFAULT_SIZES
    const images = p.images?.filter(Boolean).length
      ? p.images.filter(Boolean)
      : p.image_url ? [p.image_url] : []
    setEditing(p)
    setForm({
      name: p.name, description: p.description ?? '', category: p.category ?? '',
      price: p.price, original_price: p.original_price, images,
      slug: p.slug ?? '', featured: p.featured, is_new: p.is_new,
      categories: p.categories ?? [], sizes, inventory: buildInventory(p),
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

  const MAX_IMAGES = 4

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const slots = MAX_IMAGES - form.images.length
    if (slots <= 0) { setImgError(`Maximum ${MAX_IMAGES} images per product.`); return }
    const toUpload = files.slice(0, slots)
    setUploading(true); setImgError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setImgError('Not authenticated.'); setUploading(false); return }
    const results = await Promise.all(toUpload.map(async file => {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/admin/upload?folder=products', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: fd,
      })
      if (!res.ok) return null
      const { url } = await res.json()
      return url as string
    }))
    setUploading(false)
    const urls = results.filter(Boolean) as string[]
    if (urls.length) {
      setForm(f => ({ ...f, images: [...f.images, ...urls] }))
    } else {
      setImgError('Upload failed. Please try again.')
    }
  }

  const removeImage = (index: number) => {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== index) }))
  }

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
      const { error: err } = await supabase.from('products').insert({
        ...payload,
        sort_order: 0,
        created_at: new Date().toISOString(),
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

  /* ─── Derived sections ─── */
  const sections = SECTION_DEFS.map(def => ({
    ...def,
    products: products.filter(p => getSectionId(p) === def.id),
  }))

  const activeProduct  = products.find(p => p.id === activeId) ?? null
  const totalInventory = Object.values(form.inventory).reduce((a, b) => a + b, 0)

  /* ═══════════════════════ Render ═══════════════════════ */
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

      {/* Save bar */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <p className="font-mono text-[8px] text-zinc-700 tracking-[0.1em]">
          DRAG <GripVertical size={9} className="inline -mt-0.5" /> TO REORDER OR MOVE BETWEEN SECTIONS — SAVE WHEN DONE
        </p>
        <div className="flex items-center gap-3 shrink-0">
          {orderSaved && (
            <span className="font-mono text-[8px] text-emerald-400 tracking-[0.1em]">SAVED</span>
          )}
          <button
            onClick={saveOrder}
            disabled={savingOrder || !unsavedOrder}
            className={`h-8 px-4 font-mono text-[9px] tracking-[0.15em] rounded-sm transition-colors ${
              unsavedOrder
                ? 'bg-white text-black hover:bg-zinc-100'
                : 'border border-rc-border text-zinc-700 cursor-not-allowed'
            }`}
          >
            {savingOrder ? 'SAVING…' : 'SAVE ORDER'}
          </button>
        </div>
      </div>

      {/* Global error */}
      {error && (
        <p className="font-mono text-[9px] text-red-400 tracking-[0.1em] mb-4">{error}</p>
      )}

      {/* Sections */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-5 h-5 border border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-6">
            {sections.map(section => (
              <div key={section.id}>

                {/* Section header */}
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center gap-3">
                    <p className="font-mono text-[9px] tracking-[0.22em] text-white">{section.label}</p>
                    <span className="font-mono text-[8px] text-rc-muted">{section.products.length} ITEMS</span>
                  </div>
                  {section.cap != null && (
                    <p className={`font-mono text-[8px] tracking-[0.1em] ${
                      section.products.length >= section.cap ? 'text-amber-400' : 'text-rc-muted'
                    }`}>
                      {section.products.length}/{section.cap} SLOTS
                      {section.products.length >= section.cap ? ' — FULL' : ''}
                    </p>
                  )}
                </div>

                {/* Section body */}
                <SortableContext
                  items={section.products.map(p => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <SectionDropZone sectionId={section.id}>
                    {section.products.length === 0 ? (
                      <div className="border border-dashed border-zinc-800 rounded-sm py-6 text-center">
                        <p className="font-mono text-[8px] text-zinc-700 tracking-[0.12em]">
                          DRAG PRODUCTS HERE
                        </p>
                      </div>
                    ) : (
                      <div className="border border-rc-border rounded-sm overflow-hidden">
                        <ColumnHeaders />
                        {section.products.map(product => (
                          <SortableRow
                            key={product.id}
                            product={product}
                            onEdit={openEdit}
                            onDelete={handleDelete}
                          />
                        ))}
                      </div>
                    )}
                  </SectionDropZone>
                </SortableContext>

              </div>
            ))}
          </div>

          {/* Floating drag preview */}
          <DragOverlay>
            {activeProduct && (
              <div className="border border-white/20 rounded-sm bg-zinc-900 shadow-2xl opacity-95">
                <ProductRowContent product={activeProduct} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* ─── Add / Edit modal ─── */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-black border border-rc-border rounded-sm my-4">

            <div className="flex items-center justify-between px-6 py-4 border-b border-rc-border sticky top-0 bg-black z-10">
              <h2 className="font-display text-xl text-white">{editing ? 'EDIT PRODUCT' : 'ADD PRODUCT'}</h2>
              <button onClick={() => setShowForm(false)} className="text-rc-muted hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="p-4 md:p-6 space-y-5">

              <Field label="PRODUCT NAME *">
                <input className={inputCls} value={form.name}
                  onChange={e => {
                    const name = e.target.value
                    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
                    setForm(f => ({ ...f, name, slug }))
                  }}
                  placeholder="e.g. RC Heavyweight Tee" />
              </Field>

              <Field label="DESCRIPTION">
                <textarea
                  className="w-full bg-transparent border border-rc-border rounded-sm px-3 py-2 font-mono text-[11px] text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-500 transition-colors resize-none h-20"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Product description…"
                />
              </Field>

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

              <Field label="CATEGORY">
                <select className={inputCls + ' appearance-none cursor-pointer'} value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  <option value="">Select category…</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>

              <Field label="AVAILABLE SIZES">
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {ALL_SIZES.map(s => (
                    <button key={s} type="button" onClick={() => toggleSize(s)}
                      className={`font-mono text-[9px] w-10 h-8 rounded-sm border transition-colors ${
                        form.sizes.includes(s)
                          ? 'bg-white text-black border-white'
                          : 'border-rc-border text-rc-muted hover:text-white'
                      }`}>{s}</button>
                  ))}
                </div>
              </Field>

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
                      disabled={uploading || form.images.length >= MAX_IMAGES}
                      className="flex items-center gap-2 h-9 px-4 border border-rc-border text-rc-muted font-mono text-[9px] tracking-[0.14em] rounded-sm hover:border-zinc-500 hover:text-white transition-colors disabled:opacity-50">
                      {uploading ? (
                        <><div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />UPLOADING…</>
                      ) : (
                        <><Upload size={11} />{form.images.length >= MAX_IMAGES ? 'MAX REACHED' : 'UPLOAD IMAGES'}</>
                      )}
                    </button>
                    <p className="font-mono text-[8px] text-zinc-700 tracking-[0.08em]">
                      {form.images.length}/{MAX_IMAGES} · JPG, PNG, WEBP · First = primary
                    </p>
                  </div>
                  {imgError && <p className="font-mono text-[8px] text-red-400 tracking-[0.1em]">{imgError}</p>}
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                    multiple className="hidden" onChange={handleImageUpload} />
                </div>
              </Field>

              <div className="space-y-2">
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
                <p className="font-mono text-[8px] text-zinc-600 tracking-[0.06em]">
                  Checking either box places this product in the Homepage section (max 4 shown on site).
                  You can also drag it into that section from the product list.
                </p>
              </div>

              {error && <p className="font-mono text-[9px] text-red-400 tracking-[0.1em]">{error}</p>}

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
