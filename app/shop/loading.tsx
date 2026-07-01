import { ProductGridSkeleton } from '@/components/ui/Skeleton'

export default function ShopLoading() {
  return (
    <div className="pt-14">
      {/* Stub filter bar */}
      <div className="sticky top-14 z-30 bg-black border-b border-rc-border h-12" />

      <div className="max-w-[1600px] mx-auto px-5 pt-10 pb-7 border-b border-rc-border">
        <div className="h-12 w-48 bg-zinc-900 animate-pulse rounded-sm" />
      </div>

      <div className="max-w-[1600px] mx-auto px-5 py-8">
        <ProductGridSkeleton count={8} />
      </div>
    </div>
  )
}
