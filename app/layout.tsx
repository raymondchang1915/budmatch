import type { Metadata, Viewport } from 'next'
import './globals.css'
import Navbar from './components/Navbar'

export const metadata: Metadata = {
  title: 'BudMatch — Match your missing earbud',
  description: 'Find someone who has what you need and needs what you have.',
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