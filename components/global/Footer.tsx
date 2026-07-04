'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const SHOP_LINKS = [
  { label: 'All Products', href: '/shop' },
  { label: 'New Arrivals', href: '/shop?category=new-arrivals' },
]

const INFO_LINKS = [
  { label: 'Sizing Guide', href: '/sizing-guide' },
  { label: 'Shipping',     href: '/shipping' },
  { label: 'Returns',      href: '/returns' },
  { label: 'Contact',      href: '/contact' },
]

const FOLLOW_LINKS = [
  { label: 'Instagram',   href: 'https://instagram.com/richconflicts' },
  { label: 'Twitter / X', href: 'https://twitter.com/richconflicts' },
  { label: 'TikTok',      href: 'https://tiktok.com/@richconflicts' },
]

export default function Footer() {
  const pathname = usePathname()
  if (pathname.startsWith('/rc-admin-2024')) return null

  return (
    <footer className="border-t border-rc-border mt-20">
      <div className="max-w-[1600px] mx-auto px-5 py-14">

        {/* Top grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">

          {/* Brand block */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="block font-display text-5xl text-white mb-4 leading-none hover:opacity-60 transition-opacity">
              RC
            </Link>
            <p className="font-mono text-[11px] text-rc-muted leading-relaxed max-w-[200px]">
              Underground graphic streetwear.
              <br />
              Limited drops. No restocks.
            </p>
          </div>

          {/* Shop */}
          <div>
            <p className="font-mono text-[10px] text-rc-muted tracking-[0.25em] mb-5">SHOP</p>
            <ul className="space-y-2.5">
              {SHOP_LINKS.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="font-mono text-[11px] text-white/50 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <p className="font-mono text-[10px] text-rc-muted tracking-[0.25em] mb-5">INFO</p>
            <ul className="space-y-2.5">
              {INFO_LINKS.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="font-mono text-[11px] text-white/50 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Follow */}
          <div>
            <p className="font-mono text-[10px] text-rc-muted tracking-[0.25em] mb-5">FOLLOW</p>
            <ul className="space-y-2.5">
              {FOLLOW_LINKS.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[11px] text-white/50 hover:text-white transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-rc-border pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <p className="font-mono text-[10px] text-rc-muted tracking-[0.1em]">
            © {new Date().getFullYear()} RICH CONFLICTS. ALL RIGHTS RESERVED.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="font-mono text-[10px] text-rc-muted hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="font-mono text-[10px] text-rc-muted hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
