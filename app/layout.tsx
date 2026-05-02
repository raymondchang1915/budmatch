import type { Metadata, Viewport } from 'next'
import './globals.css'
import Navbar from './components/Navbar'

export const metadata: Metadata = {
  title: 'BudMatch — Match your missing earbud',
  description: 'Find someone who has what you need and needs what you have.',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'BudMatch — Match your missing earbud',
    description: 'Find someone who has what you need and needs what you have.',
    url: 'https://budmatch.site',
    siteName: 'BudMatch',
    images: [
      {
        url: 'https://budmatch.site/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#f5f5f0]">
        <Navbar />
        <div className="pt-20">
          {children}
        </div>
      </body>
    </html>
  )
}