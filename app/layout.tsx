import type { Metadata } from 'next'
import { Bebas_Neue, Space_Mono } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/global/Navbar'
import Footer from '@/components/global/Footer'
import CartDrawer from '@/components/ui/CartDrawer'
import ToastList from '@/components/ui/Toast'
import { CartProvider } from '@/app/lib/CartContext'
import { ToastProvider } from '@/app/lib/ToastContext'
import { SearchProvider } from '@/app/lib/SearchContext'
import { Analytics } from '@vercel/analytics/next'

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
})

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-space-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Rich Conflicts — Underground Streetwear',
    template: '%s | Rich Conflicts',
  },
  description:
    'Underground graphic streetwear. Limited drops, no restocks, built on serious construction.',
  keywords: [
    'streetwear',
    'underground fashion',
    'Y2K clothing',
    'graphic tees',
    'limited drops',
    'subculture apparel',
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${spaceMono.variable}`}>
      <body>
        <ToastProvider>
          <CartProvider>
            <SearchProvider>
            <Navbar />
            <main>{children}</main>
            <Footer />
            <CartDrawer />
            <ToastList />
            </SearchProvider>
          </CartProvider>
        </ToastProvider>
        <Analytics />
      </body>
    </html>
  )
}
