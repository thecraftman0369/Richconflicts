'use client'

import { motion } from 'framer-motion'
import ProductCard, { type Product } from '@/components/product/ProductCard'

const RELATED: Product[] = [
  { id: '5',  slug: 'conflict-tee-002',  name: 'CONFLICT TEE 002',  price: 68,  category: 'TEES' },
  { id: '9',  slug: 'signal-longsleeve', name: 'SIGNAL L/S',        price: 82,  category: 'LONGSLEEVES' },
  { id: '11', slug: 'conflict-tee-003',  name: 'CONFLICT TEE 003',  price: 72,  category: 'TEES', isNew: true },
  { id: '2',  slug: 'archive-hoodie',    name: 'ARCHIVE HOODIE',    price: 148, category: 'OUTERWEAR' },
]

export default function RelatedProducts({ currentSlug }: { currentSlug: string }) {
  const items = RELATED.filter((p) => p.slug !== currentSlug)

  return (
    <section className="border-t border-rc-border py-12 md:py-16">
      <div className="max-w-[1600px] mx-auto px-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <p className="font-mono text-[9px] tracking-[0.3em] text-rc-muted mb-1.5">YOU MAY ALSO LIKE</p>
          <h2 className="font-display text-[2rem] text-white mb-8">MORE FROM THE DROP</h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
          {items.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
