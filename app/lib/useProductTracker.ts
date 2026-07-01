'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

/* ─────────────────────────────────────────────────────────────
 *  Shared Types
 * ───────────────────────────────────────────────────────────── */

export type TrackerEventType = 'view' | 'add_to_cart' | 'wishlist' | 'quick_view'

export type TrackableEvent = {
  productId: string
  slug: string
  name: string
  category: string
  tags: string[]
  price: number
  eventType: TrackerEventType
}

type StoredEvent = TrackableEvent & { timestamp: number }

type TrackingStore = { events: StoredEvent[] }

export type ScoredProduct = {
  id: string
  slug: string
  name: string
  price: number
  category: string
  tags: string[]
  isNew?: boolean
  isSoldOut?: boolean
  score: number
  reason: string
}

/* ─────────────────────────────────────────────────────────────
 *  Scoring weights per event type
 * ───────────────────────────────────────────────────────────── */

const WEIGHTS: Record<TrackerEventType, { product: number; category: number; tag: number }> = {
  view:        { product: 1,   category: 2,   tag: 1   },
  quick_view:  { product: 2,   category: 1,   tag: 0.5 },
  wishlist:    { product: 3,   category: 2,   tag: 1.5 },
  add_to_cart: { product: 5,   category: 3,   tag: 2   },
}

/* Scores halve every 7 days */
const DECAY_HALF_LIFE_MS = 7 * 24 * 60 * 60 * 1_000
const MAX_EVENTS = 200
const STORE_KEY = 'rc-tracker'

/* ─────────────────────────────────────────────────────────────
 *  Product catalog — scored against tracked interest
 * ───────────────────────────────────────────────────────────── */

export const PRODUCT_CATALOG: Omit<ScoredProduct, 'score' | 'reason'>[] = [
  { id: 'conflict-tee-001',  slug: 'conflict-tee-001',  name: 'CONFLICT TEE 001',   price: 68,  category: 'GRAPHIC TEE',  tags: ['graphic', 'heavyweight', 'garment-dyed', 'screen-print', 'boxy'],     isNew: true  },
  { id: 'static-longsleeve', slug: 'static-longsleeve', name: 'STATIC L/S',         price: 78,  category: 'LONGSLEEVES',  tags: ['graphic', 'heavyweight', 'chest-print', 'relaxed'],                  isNew: true  },
  { id: 'conflict-tee-002',  slug: 'conflict-tee-002',  name: 'CONFLICT TEE 002',   price: 68,  category: 'GRAPHIC TEE',  tags: ['graphic', 'boxy', 'screen-print', 'heavyweight']                                   },
  { id: 'blank-tee-white',   slug: 'blank-tee-white',   name: 'BLANK TEE WHITE',    price: 48,  category: 'GRAPHIC TEE',  tags: ['blank', 'heavyweight', 'minimal', 'boxy']                                          },
  { id: 'signal-longsleeve', slug: 'signal-longsleeve', name: 'SIGNAL L/S',         price: 82,  category: 'LONGSLEEVES',  tags: ['graphic', 'relaxed', 'seasonal', 'chest-print']                                    },
  { id: 'conflict-tee-003',  slug: 'conflict-tee-003',  name: 'CONFLICT TEE 003',   price: 72,  category: 'GRAPHIC TEE',  tags: ['graphic', 'oversized', 'drop-shoulder', 'screen-print'],            isNew: true  },
]

/* ─────────────────────────────────────────────────────────────
 *  Utilities
 * ───────────────────────────────────────────────────────────── */

function decayWeight(timestamp: number): number {
  return Math.pow(0.5, (Date.now() - timestamp) / DECAY_HALF_LIFE_MS)
}

function readStore(): TrackingStore {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (raw) return JSON.parse(raw) as TrackingStore
  } catch { /* quota error or parse failure — start fresh */ }
  return { events: [] }
}

function writeStore(store: TrackingStore): void {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(store)) } catch {}
}

/* ─────────────────────────────────────────────────────────────
 *  Hook
 * ───────────────────────────────────────────────────────────── */

export type UseProductTrackerReturn = {
  /** Log a product interaction. Safe to call during render — deferred to a stable callback. */
  track: (event: TrackableEvent) => void
  /**
   * Compute scored recommendations from a catalog.
   * @param excludeIds  Product IDs / slugs to filter out (current page + cart items)
   * @param limit       Max results (default 6)
   * @param catalog     Override the default catalog (pass real Supabase products)
   */
  getRecommendations: (excludeIds: string[], limit?: number, catalog?: Omit<ScoredProduct, 'score' | 'reason'>[]) => ScoredProduct[]
  clearHistory: () => void
  /** True once at least one event has been stored */
  hasHistory: boolean
}

export function useProductTracker(): UseProductTrackerReturn {
  const [events, setEvents] = useState<StoredEvent[]>([])

  /* Hydrate on mount — localStorage is unavailable during SSR */
  useEffect(() => {
    setEvents(readStore().events)
  }, [])

  const track = useCallback((event: TrackableEvent) => {
    setEvents((prev) => {
      const next: StoredEvent[] = [{ ...event, timestamp: Date.now() }, ...prev].slice(0, MAX_EVENTS)
      writeStore({ events: next })
      return next
    })
  }, [])

  const clearHistory = useCallback(() => {
    setEvents([])
    try { localStorage.removeItem(STORE_KEY) } catch {}
  }, [])

  /* Aggregate interest scores — recomputed only when events change */
  const scoreContext = useMemo(() => {
    const productScores = new Map<string, number>()
    const categoryScores = new Map<string, number>()
    const tagScores = new Map<string, number>()

    for (const ev of events) {
      const d = decayWeight(ev.timestamp)
      const w = WEIGHTS[ev.eventType]
      productScores.set(ev.productId, (productScores.get(ev.productId) ?? 0) + w.product * d)
      categoryScores.set(ev.category, (categoryScores.get(ev.category) ?? 0) + w.category * d)
      for (const tag of ev.tags) {
        tagScores.set(tag, (tagScores.get(tag) ?? 0) + w.tag * d)
      }
    }

    return { productScores, categoryScores, tagScores }
  }, [events])

  const getRecommendations = useCallback(
    (excludeIds: string[], limit = 6, catalog: Omit<ScoredProduct, 'score' | 'reason'>[] = PRODUCT_CATALOG): ScoredProduct[] => {
      const { productScores, categoryScores, tagScores } = scoreContext

      if (categoryScores.size === 0 && tagScores.size === 0) return []

      /* Find the top-interest category and tag for human-readable reasons */
      const topCategory = [...categoryScores.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''
      const topTag = [...tagScores.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''

      return catalog
        .filter((p) => !excludeIds.includes(p.id) && !excludeIds.includes(p.slug))
        .map((p): ScoredProduct => {
          const productDirect = productScores.get(p.id) ?? 0
          const categorySig   = (categoryScores.get(p.category) ?? 0) * 0.8
          const tagSig        = p.tags.reduce((sum, t) => sum + (tagScores.get(t) ?? 0) * 0.5, 0)
          const score         = productDirect + categorySig + tagSig

          let reason: string
          if (p.category === topCategory) {
            reason = `Based on your interest in ${p.category}`
          } else if (topTag && p.tags.includes(topTag)) {
            reason = `Matches your taste for ${topTag.replace(/-/g, ' ')} pieces`
          } else if (productDirect > 0) {
            reason = `You viewed this before`
          } else {
            reason = `Trending in ${p.category.toLowerCase()}`
          }

          return { ...p, score, reason }
        })
        .filter((p) => p.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
    },
    [scoreContext]
  )

  return { track, getRecommendations, clearHistory, hasHistory: events.length > 0 }
}
