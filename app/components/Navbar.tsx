'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    window.location.href = '/'
  }

  const displayName = user?.user_metadata?.full_name?.split(' ')[0]
    ?? user?.email?.split('@')[0]
    ?? null

  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
      <nav className="bg-white border border-gray-200 rounded-full px-6 py-3 flex items-center justify-between w-full max-w-3xl shadow-sm">
        <Link href="/" className="font-bold text-gray-900 text-lg tracking-tight">
          BudMatch
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/browse" className="text-sm text-gray-500 hover:text-gray-900 transition">Browse</Link>
          <Link href="/listings/new" className="text-sm text-gray-500 hover:text-gray-900 transition">Add a bud</Link>
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link href="/profile"
                className="text-sm text-gray-600 hover:text-gray-900 transition font-medium">
                {displayName}
              </Link>
              <button onClick={signOut}
                className="border border-gray-200 text-gray-600 text-sm px-5 py-2 rounded-full hover:border-gray-400 transition">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth" className="text-sm text-gray-500 hover:text-gray-900 transition">Sign in</Link>
              <Link href="/listings/new"
                className="bg-gray-900 text-white text-sm px-5 py-2 rounded-full hover:bg-black transition">
                Post listing
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className={`block w-5 h-0.5 bg-gray-900 transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-5 h-0.5 bg-gray-900 transition-all ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-gray-900 transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="absolute top-16 left-4 right-4 bg-white border border-gray-200 rounded-2xl shadow-lg p-4 flex flex-col gap-2">
          <Link href="/browse" onClick={() => setMenuOpen(false)}
            className="text-sm text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-50 transition">
            Browse listings
          </Link>
          <Link href="/listings/new" onClick={() => setMenuOpen(false)}
            className="text-sm text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-50 transition">
            Add a bud
          </Link>
          {user ? (
            <>
              <Link href="/profile" onClick={() => setMenuOpen(false)}
                className="text-sm text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-50 transition">
                Profile — {displayName}
              </Link>
              <button onClick={signOut}
                className="text-sm text-red-500 px-4 py-3 rounded-xl hover:bg-red-50 transition text-left">
                Sign out
              </button>
            </>
          ) : (
            <Link href="/auth" onClick={() => setMenuOpen(false)}
              className="bg-gray-900 text-white text-sm px-4 py-3 rounded-xl text-center">
              Sign in
            </Link>
          )}
        </div>
      )}
    </div>
  )
}