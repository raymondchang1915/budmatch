'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Listing = {
  id: string
  user_email: string
  model: string
  has_component: string
  has_case: boolean
  condition: string
  location: string
  listing_type: string
  matched: boolean
  created_at: string
}

const conditionColors: Record<string, string> = {
  'Working perfectly': 'bg-green-100 text-green-700',
  'Usable': 'bg-yellow-100 text-yellow-700',
  'Unknown': 'bg-gray-100 text-gray-500',
}

export default function Browse() {
  const [listings, setListings] = useState<Listing[]>([])
  const [filtered, setFiltered] = useState<Listing[]>([])
  const [tab, setTab] = useState<'selling' | 'buying'>('selling')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [offerModal, setOfferModal] = useState<Listing | null>(null)
  const [offerPrice, setOfferPrice] = useState('')
  const [offerEmail, setOfferEmail] = useState('')
  const [offerSent, setOfferSent] = useState(false)

  useEffect(() => { fetchListings() }, [])
  useEffect(() => { applyFilters() }, [listings, tab, search])

  // auto fill email
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setOfferEmail(data.user.email)
    })
  }, [])

  const fetchListings = async () => {
    const { data } = await supabase
      .from('listings')
      .select('*')
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
        l.location?.toLowerCase().includes(q)
      )
    }
    setFiltered(result)
  }

  const sendDirectOffer = async () => {
    if (!offerModal || !offerPrice || !offerEmail) return
    await supabase.from('listings').update({
      direct_offer_price: parseFloat(offerPrice),
      direct_offer_email: offerEmail,
    }).eq('id', offerModal.id)
    setOfferSent(true)
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
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-5xl font-bold text-gray-900 tracking-tight">Browse</h1>
            <p className="text-gray-400 mt-2">{filtered.length} listing{filtered.length !== 1 ? 's' : ''}</p>
          </div>
          <a href="/listings/new"
            className="bg-gray-900 text-white text-sm px-5 py-2.5 rounded-full hover:bg-black transition">
            + Post listing
          </a>
        </div>

        {/* Search */}
        <input type="text"
          placeholder="Search model, component, location..."
          className="w-full bg-white border border-gray-200 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 shadow-sm mb-4"
          value={search}
          onChange={e => setSearch(e.target.value)} />

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-white border border-gray-200 rounded-full p-1 shadow-sm">
          {(['selling', 'buying'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition ${
                tab === t ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900'
              }`}>
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
            <p className="text-gray-500 mb-2">No listings found.</p>
            <a href="/listings/new" className="text-gray-900 underline text-sm">
              Post one
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(listing => (
              <div key={listing.id}
                className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-400 transition">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="font-semibold text-gray-900">{listing.model}</h2>
                    <p className="text-gray-400 text-xs mt-0.5">
                      📍 {listing.location || 'Location not set'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {listing.matched && (
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                        Matched
                      </span>
                    )}
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      conditionColors[listing.condition] ?? 'bg-gray-100 text-gray-500'
                    }`}>
                      {listing.condition}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 mb-4 flex-wrap">
                  <span className="bg-gray-50 border border-gray-100 rounded-full px-3 py-1 text-xs font-medium text-gray-800">
                    {listing.has_component}
                  </span>
                  {listing.has_case && (
                    <span className="bg-blue-50 border border-blue-100 rounded-full px-3 py-1 text-xs font-medium text-blue-700">
                      + Case ✓
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <a href={`/listings/${listing.id}`}
                    className="flex-1 border border-gray-200 text-gray-700 text-xs py-2 rounded-full text-center hover:border-gray-400 transition">
                    View listing
                  </a>
                  <button
                    onClick={() => { setOfferModal(listing); setOfferSent(false) }}
                    className="flex-1 bg-gray-900 text-white text-xs py-2 rounded-full hover:bg-black transition">
                    Make offer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Direct offer modal */}
      {offerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            {offerSent ? (
              <div className="text-center">
                <p className="text-3xl mb-3">✅</p>
                <h3 className="font-bold text-gray-900 mb-2">Offer sent!</h3>
                <p className="text-gray-400 text-sm mb-4">
                  The seller will see your offer and contact you if interested.
                </p>
                <button onClick={() => setOfferModal(null)}
                  className="bg-gray-900 text-white px-6 py-2 rounded-full text-sm w-full">
                  Done
                </button>
              </div>
            ) : (
              <>
                <h3 className="font-bold text-gray-900 mb-1">Make a direct offer</h3>
                <p className="text-gray-400 text-sm mb-4">
                  {offerModal.model} — {offerModal.has_component}
                  {offerModal.has_case ? ' + Case' : ''}
                </p>

                <div className="flex flex-col gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Your offer (LKR)
                    </label>
                    <input type="number"
                      placeholder="e.g. 5000"
                      className="w-full border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      value={offerPrice}
                      onChange={e => setOfferPrice(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Your email
                    </label>
                    <input type="email"
                      placeholder="you@email.com"
                      className="w-full border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      value={offerEmail}
                      onChange={e => setOfferEmail(e.target.value)} />
                  </div>
                </div>

                {offerModal.matched && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4">
                    <p className="text-xs text-amber-700">
                      ⚠️ This listing is currently matched with someone. Your offer will only be considered if that deal falls through.
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={() => setOfferModal(null)}
                    className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-full text-sm hover:border-gray-400 transition">
                    Cancel
                  </button>
                  <button onClick={sendDirectOffer}
                    disabled={!offerPrice || !offerEmail}
                    className="flex-1 bg-gray-900 text-white py-2.5 rounded-full text-sm disabled:opacity-40 hover:bg-black transition">
                    Send offer
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  )
}