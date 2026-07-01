import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '404 — Not Found',
}

export default function NotFound() {
  return (
    <div className="pt-14 min-h-screen flex flex-col items-center justify-center px-5 text-center">
      <p className="font-display text-[clamp(6rem,25vw,22rem)] text-zinc-900 leading-none select-none">
        404
      </p>
      <p
        className="font-display text-[clamp(2rem,8vw,6rem)] text-white leading-none -mt-4 md:-mt-8 mb-6"
        style={{ WebkitTextStroke: '1px #ffffff', color: 'transparent' }}
      >
        NOT FOUND
      </p>
      <p className="font-mono text-[11px] text-rc-muted tracking-[0.18em] mb-10 max-w-xs">
        This page doesn't exist. It may have been a limited drop that already sold out.
      </p>
      <div className="flex items-center gap-3">
        <Link
          href="/shop"
          className="font-mono text-[10px] tracking-[0.22em] bg-white text-black px-6 py-3 rounded-sm hover:bg-zinc-100 transition-colors"
        >
          SHOP ALL
        </Link>
        <Link
          href="/"
          className="font-mono text-[10px] tracking-[0.22em] border border-rc-border text-white px-6 py-3 rounded-sm hover:border-zinc-500 transition-colors"
        >
          HOME
        </Link>
      </div>
    </div>
  )
}
