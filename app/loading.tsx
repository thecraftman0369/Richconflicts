export default function Loading() {
  return (
    <div className="pt-14 min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        <p className="font-display text-[4rem] text-zinc-800 animate-pulse select-none">RC</p>
        <p className="font-mono text-[9px] tracking-[0.35em] text-rc-muted animate-pulse">
          LOADING...
        </p>
      </div>
    </div>
  )
}
