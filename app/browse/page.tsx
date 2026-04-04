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
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Browse listings</h1>
            <p className="text-gray-400 text-sm mt-1">{filtered.length} listing{filtered.length !== 1 ? 's' : ''} found</p>
          </div>
          <a
            href="/listings/new"
            className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition"
          >
            + Post listing
          </a>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search model, component, location..."
            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black shadow-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
          {(['selling', 'buying'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                tab === t ? 'bg-black text-white' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {t === 'selling' ? '🏷️ For sale' : '🔍 Looking for'}
            </button>
          ))}
        </div>

        {/* Listings */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">📭</p>
            <p className="text-gray-500 mb-2">No listings yet.</p>
            <a href="/listings/new" className="text-black underline text-sm">Be the first to post one</a>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(listing => (
              <div
                key={listing.id}
                className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-400 hover:shadow-md transition group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="font-semibold text-gray-900 text-lg leading-tight">{listing.model}</h2>
                    <p className="text-gray-400 text-xs mt-0.5">📍 {listing.location || 'Location not set'}</p>
                  </div>
                  {listing.asking_price ? (
                    <div className="text-right">
                      <span className="bg-black text-white text-sm font-medium px-3 py-1.5 rounded-xl">
                        LKR {listing.asking_price.toLocaleString()}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-300 text-sm">No price set</span>
                  )}
                </div>

                <div className="flex gap-3 mb-4">
                  <div className="bg-gray-50 rounded-lg px-3 py-1.5 text-xs">
                    <span className="text-gray-400">Has </span>
                    <span className="font-semibold text-gray-800">{listing.has_component}</span>
                  </div>
                  <div className="text-gray-300 text-xs flex items-center">→</div>
                  <div className="bg-gray-50 rounded-lg px-3 py-1.5 text-xs">
                    <span className="text-gray-400">Needs </span>
                    <span className="font-semibold text-gray-800">{listing.needs_component}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${conditionStyles[listing.condition] ?? 'bg-gray-100 text-gray-500'}`}>
                    {listing.condition}
                  </span>
                  <a
                    href={`/listings/${listing.id}`}
                    className="text-sm font-medium text-black opacity-0 group-hover:opacity-100 transition underline"
                  >
                    View listing →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}