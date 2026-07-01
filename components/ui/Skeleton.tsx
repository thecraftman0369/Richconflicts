/* Generic loading skeleton — pulse animation via Tailwind */

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-zinc-900 animate-pulse rounded-sm ${className}`}
      aria-hidden="true"
    />
  )
}

export function ProductCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[3/4] w-full mb-3" />
      <Skeleton className="h-3 w-3/4 mb-1.5" />
      <Skeleton className="h-2.5 w-1/2" />
    </div>
  )
}

export function ArticleCardSkeleton() {
  return (
    <div className="border border-rc-border rounded-md overflow-hidden">
      <Skeleton className="aspect-[16/7] w-full" />
      <div className="p-5 space-y-2">
        <Skeleton className="h-2.5 w-1/3" />
        <Skeleton className="h-5 w-5/6" />
        <Skeleton className="h-2.5 w-full" />
        <Skeleton className="h-2.5 w-4/5" />
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}
