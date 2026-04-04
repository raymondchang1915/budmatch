import type { Metadata } from 'next'
import './globals.css'
import Navbar from './components/Navbar'

export const metadata: Metadata = {
  title: 'BudMatch — Match your missing earbud',
  description: 'Find someone who has what you need and needs what you have.',
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