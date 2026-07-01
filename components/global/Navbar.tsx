'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, ShoppingBag, Search, LogIn, CircleUserRound } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '@/app/lib/CartContext'
import { useSearch } from '@/app/lib/SearchContext'
import { createClient } from '@/app/supabase/client'

const NAV_LINKS = [
  { label: 'SHOP',  href: '/shop' },
  { label: 'DROPS', href: '/drops' },
  { label: 'BLOG',  href: '/blog' },
  { label: 'ABOUT', href: '/about' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [authed, setAuthed]     = useState(false)
  const [isAdmin, setIsAdmin]   = useState(false)
  const { totalItems, openCart } = useCart()
  const { open: openSearch }     = useSearch()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setAuthed(!!data.user)
      setIsAdmin(data.user?.app_metadata?.role === 'master_admin')
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session?.user)
      setIsAdmin(session?.user?.app_metadata?.role === 'master_admin')
    })
    return () => subscription.unsubscribe()
  }, [])

  const accountHref = authed ? (isAdmin ? '/rc-admin-2024' : '/dashboard') : '/auth/login'

  if (pathname.startsWith('/rc-admin-2024')) return null

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/96 backdrop-blur-sm border-b border-rc-border">
        <div className="flex items-center justify-between h-14 px-5 max-w-[1600px] mx-auto">

          {/* Brand */}
          <Link
            href="/"
            className="font-display text-[1.6rem] tracking-widest text-white hover:opacity-60 transition-opacity"
          >
            RC
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-mono text-[10px] tracking-[0.25em] text-rc-muted hover:text-white transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={openSearch}
              aria-label="Search"
              title="Search"
              className="hidden md:flex p-1 text-rc-muted hover:text-white transition-colors"
            >
              <Search size={16} strokeWidth={1.5} />
            </button>

            <Link
              href={accountHref}
              aria-label={authed ? 'My account' : 'Sign in'}
              title={authed ? 'My account' : 'Sign in'}
              className="hidden md:flex relative p-1 text-rc-muted hover:text-white transition-colors"
            >
              {authed ? (
                <>
                  <CircleUserRound size={16} strokeWidth={1.5} className="text-white" />
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full ring-1 ring-black" />
                </>
              ) : (
                <LogIn size={16} strokeWidth={1.5} />
              )}
            </Link>

            <button
              onClick={openCart}
              className="relative p-1 text-white hover:opacity-60 transition-opacity"
              aria-label={`Cart (${totalItems} items)`}
              title={totalItems > 0 ? `Cart — ${totalItems} item${totalItems !== 1 ? 's' : ''}` : 'Cart'}
            >
              <ShoppingBag size={17} strokeWidth={1.5} />
              {totalItems > 0 && (
                <motion.span
                  key={totalItems}
                  initial={{ scale: 0.6 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-white text-black text-[8px] font-bold font-mono flex items-center justify-center rounded-full leading-none"
                >
                  {totalItems > 9 ? '9+' : totalItems}
                </motion.span>
              )}
            </button>

            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden p-1 text-white hover:opacity-60 transition-opacity"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={17} strokeWidth={1.5} /> : <Menu size={17} strokeWidth={1.5} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile overlay menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-black pt-14 flex flex-col"
          >
            <nav className="flex flex-col px-6 py-10 gap-2">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.055, duration: 0.25 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="block font-display text-5xl text-white hover:opacity-50 transition-opacity py-1"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </nav>

            <div className="px-6 pb-10 mt-auto border-t border-rc-border pt-6 flex items-center justify-between">
              <p className="font-mono text-[10px] text-rc-muted tracking-[0.2em]">
                UNDERGROUND STREETWEAR SS26
              </p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => { openSearch(); setMenuOpen(false) }}
                  aria-label="Search"
                  className="p-1 text-rc-muted hover:text-white transition-colors"
                >
                  <Search size={16} strokeWidth={1.5} />
                </button>
                <Link
                  href={accountHref}
                  onClick={() => setMenuOpen(false)}
                  aria-label={authed ? 'My account' : 'Sign in'}
                  className="relative p-1 text-rc-muted hover:text-white transition-colors"
                >
                  {authed ? (
                    <>
                      <CircleUserRound size={16} strokeWidth={1.5} className="text-white" />
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full ring-1 ring-black" />
                    </>
                  ) : (
                    <LogIn size={16} strokeWidth={1.5} />
                  )}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
