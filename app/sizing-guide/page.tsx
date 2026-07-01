import Link from 'next/link'

const SIZES = [
  { size: 'XS', chest: '32–34"', waist: '26–28"', hip: '35–37"' },
  { size: 'S',  chest: '35–37"', waist: '29–31"', hip: '38–40"' },
  { size: 'M',  chest: '38–40"', waist: '32–34"', hip: '41–43"' },
  { size: 'L',  chest: '41–43"', waist: '35–37"', hip: '44–46"' },
  { size: 'XL', chest: '44–46"', waist: '38–40"', hip: '47–49"' },
  { size: '2XL',chest: '47–49"', waist: '41–43"', hip: '50–52"' },
]

export default function SizingGuidePage() {
  return (
    <div className="pt-14 min-h-screen">
      <div className="max-w-[900px] mx-auto px-5 py-14">
        <p className="font-mono text-[9px] tracking-[0.3em] text-rc-muted mb-2">REFERENCE</p>
        <h1 className="font-display text-display-md text-white mb-10">SIZING GUIDE</h1>

        <p className="font-mono text-[11px] text-zinc-400 leading-relaxed mb-10 max-w-xl">
          All measurements are in inches and refer to body measurements, not garment measurements. For an oversized fit, size up. All RC sweatsuits are cut for a relaxed silhouette.
        </p>

        {/* Table */}
        <div className="border border-rc-border rounded-sm overflow-hidden mb-12">
          <div className="grid grid-cols-4 border-b border-rc-border bg-rc-subtle">
            {['SIZE', 'CHEST', 'WAIST', 'HIP'].map((h) => (
              <div key={h} className="px-5 py-3">
                <p className="font-mono text-[8px] tracking-[0.22em] text-rc-muted">{h}</p>
              </div>
            ))}
          </div>
          {SIZES.map((row, i) => (
            <div
              key={row.size}
              className={`grid grid-cols-4 ${i < SIZES.length - 1 ? 'border-b border-rc-border' : ''}`}
            >
              <div className="px-5 py-4">
                <p className="font-mono text-[11px] text-white">{row.size}</p>
              </div>
              <div className="px-5 py-4">
                <p className="font-mono text-[11px] text-zinc-400">{row.chest}</p>
              </div>
              <div className="px-5 py-4">
                <p className="font-mono text-[11px] text-zinc-400">{row.waist}</p>
              </div>
              <div className="px-5 py-4">
                <p className="font-mono text-[11px] text-zinc-400">{row.hip}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6 border-t border-rc-border pt-8">
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-white mb-2">HOW TO MEASURE</p>
            <p className="font-mono text-[11px] text-zinc-400 leading-relaxed">
              Use a flexible measuring tape. Chest: measure around the fullest part of your chest. Waist: measure around your natural waistline. Hip: measure around the fullest part of your hips.
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-white mb-2">STILL UNSURE?</p>
            <p className="font-mono text-[11px] text-zinc-400 leading-relaxed">
              Contact us at{' '}
              <Link href="/contact" className="text-white underline underline-offset-2">
                our support page
              </Link>{' '}
              and we'll help you find the right size.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
