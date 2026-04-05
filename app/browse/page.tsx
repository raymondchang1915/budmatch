'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Listing = {
  id: string
  user_email: string
  model: string
  has_component: string
  needs_component: string
  condition: string
  location: string
  listing_type: string
  asking_price: number | null
  matched: boolean
  created_at: string
}

const conditionStyles: Record<string, string> = {
  'Working perfectly': 'bg-green-100 text-green-700',
  'Minor issues': 'bg-yellow-100 text-yellow-700',
  'Unknown': 'bg-gray-100 text-gray-500',
}

export default function Browse() {
  const [listings, setListings] = useState<Listing[]>([])
  const [filtered, setFiltered] = useState<Listing[]>([])
  const [tab, setTab] = useState<'selling' | 'buying'>('selling')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchListings() }, [])
  useEffect(() => { applyFilters() }, [listings, tab, search])

  const fetchListings = async () => {
    const { data } = await supabase
      .from('listings')
      .select('*')
      .eq('matched', false)
      .order('created_at', { ascending: false })
    setListings(data ?? [])
    setLoading(false)
  }

  const applyFilters = () => {
    let result = listings.filter(l =>
      tab === 'selling'
        ? l.listing_type === 'selling' || l.listing_type === 'both'
        : l.listing_type === 'buying' || l.listing_type === 'both'
    )
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(l =>
        l.model.toLowerCase().includes(q) ||
        l.has_component.toLowerCase().includes(q) ||
        l.needs_component.toLowerCase().includes(q) ||
        l.location?.toLowerCase().includes(q)
      )
    }
    setFiltered(result)
  }

  return (
    <main className="min-h-screen bg-[#f5f5f0] relative">
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle, #00000012 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
      }} />

      <div className="relative max-w-3xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px w-8 bg-gray-400" />
          <span className="text-sm text-gray-500 tracking-wide">Marketplace</span>
        </div>

        <div className="flex items-end justify-between mb-10">
          <div>
            <h1 className="text-5xl font-bold text-gray-900 tracking-tight">Browse listings</h1>
            <p className="text-gray-400 mt-2">{filtered.length} listing{filtered.length !== 1 ? 's' : ''} available</p>
          </div>
          <a
            href="/listings/new"
            className="bg-gray-900 text-white text-sm px-5 py-2.5 rounded-full hover:bg-black transition"
          >
            + Post listing
          </a>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">⌕</span>
          <input
            type="text"
            placeholder="Search model, component, location..."
            className="w-full bg-white border border-gray-200 rounded-full pl-10 pr-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 shadow-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-white border border-gray-200 rounded-full p-1 shadow-sm">
          {(['selling', 'buying'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition ${
                tab === t ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {t === 'selling' ? 'For sale' : 'Looking for'}
            </button>
          ))}
        </div>

        {/* Listings */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <p className="text-4xl mb-4">📭</p>
            <p className="text-gray-500 mb-2">No listings yet.</p>
            <a href="/listings/new" className="text-gray-900 underline text-sm">Be the first to post one</a>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(listing => (
              <a
                key={listing.id}
                href={`/listings/${listing.id}`}
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-400 hover:shadow-md transition group block"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="font-semibold text-gray-900 text-lg">{listing.model}</h2>
                    <p className="text-gray-400 text-xs mt-0.5">📍 {listing.location || 'Location not set'}</p>
                  </div>
                  {listing.asking_price ? (
                    <span className="bg-gray-900 text-white text-sm font-medium px-4 py-1.5 rounded-full">
                      LKR {listing.asking_price.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-gray-300 text-sm">No price set</span>
                  )}
                </div>

                <div className="flex gap-3 mb-4 items-center">
                  <div className="bg-gray-50 border border-gray-100 rounded-full px-4 py-1.5 text-xs">
                    <span className="text-gray-400">Has </span>
                    <span className="font-semibold text-gray-800">{listing.has_component}</span>
                  </div>
                  <span className="text-gray-300 text-xs">→</span>
                  <div className="bg-gray-50 border border-gray-100 rounded-full px-4 py-1.5 text-xs">
                    <span className="text-gray-400">Needs </span>
                    <span className="font-semibold text-gray-800">{listing.needs_component}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${conditionStyles[listing.condition] ?? 'bg-gray-100 text-gray-500'}`}>
                    {listing.condition}
                  </span>
                  <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition">
                    View listing →
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}