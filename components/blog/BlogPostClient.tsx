'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import type { BlogPost } from '@/app/blog/[slug]/page'

export default function BlogPostClient({ post }: { post: BlogPost }) {
  return (
    <div className="pt-14">

      {/* Breadcrumb */}
      <div className="border-b border-rc-border">
        <div className="max-w-[1600px] mx-auto px-5 h-10 flex items-center gap-2">
          <Link
            href="/blog"
            className="font-mono text-[9px] text-rc-muted hover:text-white transition-colors tracking-[0.12em] flex items-center gap-1.5"
          >
            <ArrowLeft size={9} />
            FIELD NOTES
          </Link>
          {post.category && (
            <>
              <span className="text-rc-border">/</span>
              <span className="font-mono text-[9px] text-rc-muted tracking-[0.12em]">
                {post.category}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ═══════════════════════ ARTICLE HEADER ═══════════════════════ */}
      <div className="border-b border-rc-border">
        <div className="max-w-[900px] mx-auto px-5 py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.48 }}
          >
            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex items-center flex-wrap gap-2 mb-6">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-mono text-[8px] tracking-[0.22em] border border-rc-border text-rc-muted px-2 py-0.5 rounded-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 className="font-display text-[clamp(2.5rem,7vw,5.5rem)] text-white leading-none mb-6">
              {post.title}
            </h1>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="font-mono text-[12px] md:text-[13px] text-zinc-400 leading-[1.75] max-w-lg mb-8">
                {post.excerpt}
              </p>
            )}

            {/* Meta bar */}
            {(post.author || post.date) && (
              <div className="flex items-center flex-wrap gap-x-4 gap-y-1 pt-6 border-t border-rc-border">
                {post.author && (
                  <span className="font-mono text-[9px] text-rc-muted tracking-[0.12em]">
                    {post.author}
                  </span>
                )}
                {post.date && (
                  <>
                    <span className="w-0.5 h-0.5 bg-rc-muted rounded-full" />
                    <span className="font-mono text-[9px] text-rc-muted tracking-[0.12em]">
                      {post.date.toUpperCase()}
                    </span>
                  </>
                )}
                {post.readTime && (
                  <>
                    <span className="w-0.5 h-0.5 bg-rc-muted rounded-full" />
                    <span className="font-mono text-[9px] text-rc-muted tracking-[0.12em]">
                      {post.readTime}
                    </span>
                  </>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ═══════════════════════ HERO IMAGE PLACEHOLDER ═══════════════════════ */}
      <div className="border-b border-rc-border">
        <div className="max-w-[1600px] mx-auto">
          <div className="aspect-[21/7] bg-zinc-900 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center select-none">
              <span className="font-display text-[clamp(5rem,18vw,18rem)] text-zinc-800 leading-none">
                RC
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════ ARTICLE BODY ═══════════════════════ */}
      <div className="max-w-[760px] mx-auto px-5 py-12 md:py-16">
        <div className="space-y-7">
          {post.body.map((paragraph, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.3) }}
              className={
                i === 0
                  ? 'font-mono text-xl md:text-2xl text-white leading-[1.5]'
                  : 'font-mono text-[12px] md:text-[13px] text-zinc-400 leading-[1.9]'
              }
            >
              {paragraph}
            </motion.p>
          ))}
        </div>

        {/* Keyword cloud */}
        {post.keywords.length > 0 && (
          <div className="mt-14 pt-8 border-t border-rc-border">
            <p className="font-mono text-[9px] tracking-[0.25em] text-rc-muted mb-4">KEYWORDS</p>
            <div className="flex flex-wrap gap-2">
              {post.keywords.map((kw) => (
                <span
                  key={kw}
                  className="font-mono text-[9px] tracking-[0.1em] border border-rc-border text-rc-muted px-2.5 py-1 rounded-sm hover:border-zinc-500 hover:text-white transition-colors cursor-default"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════ BACK CTA ═══════════════════════ */}
      <div className="border-t border-rc-border">
        <div className="max-w-[1600px] mx-auto px-5 py-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] border border-rc-border text-white px-5 py-3 rounded-sm hover:bg-white hover:text-black hover:border-white transition-all duration-200"
          >
            <ArrowLeft size={10} />
            BACK TO FIELD NOTES
          </Link>
        </div>
      </div>
    </div>
  )
}
