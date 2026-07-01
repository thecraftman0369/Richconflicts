'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="pt-14 min-h-screen flex flex-col items-center justify-center px-5 text-center">
      <p
        className="font-display text-[clamp(4rem,18vw,14rem)] text-zinc-900 leading-none select-none"
      >
        ERR
      </p>
      <p className="font-display text-[clamp(1.5rem,5vw,3.5rem)] text-white leading-none mb-4 text-stroke">
        SOMETHING BROKE
      </p>
      <p className="font-mono text-[11px] text-rc-muted tracking-[0.15em] mb-10 max-w-sm">
        An unexpected error occurred. It's on us, not you.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="font-mono text-[10px] tracking-[0.22em] bg-white text-black px-6 py-3 rounded-sm hover:bg-zinc-100 transition-colors"
        >
          TRY AGAIN
        </button>
        <a
          href="/"
          className="font-mono text-[10px] tracking-[0.22em] border border-rc-border text-white px-6 py-3 rounded-sm hover:border-zinc-500 transition-colors"
        >
          HOME
        </a>
      </div>
      {error.digest && (
        <p className="font-mono text-[8px] text-zinc-700 mt-8 tracking-[0.1em]">
          DIGEST: {error.digest}
        </p>
      )}
    </div>
  )
}
