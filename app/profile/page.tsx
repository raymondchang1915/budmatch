'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Listing = {
  id: string
  model: string
  has_component: string
  needs_component: string
  condition: string
  asking_price: number | null
  matched: boolean
  created_at: string
  location: string
}

type Match = {
  id: string
  listing_a: string
  listing_b: string
  status: string
  created_at: string
}

export default function Profile() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.push('/auth')
        return
      }
      setUser(data.user)
      await fetchUserData(data.user.email!)
      setLoading(false)
    })
  }, [])

  const fetchUserData = async (email: string) => {
    const { data: listingsData } = await supabase
      .from('listings')
      .select('*')
      .eq('user_email', email)
      .order('created_at', { ascending: false })
    setListings(listingsData ?? [])

    const listingIds = listingsData?.map(l => l.id) ?? []
    if (listingIds.length > 0) {
      const { data: matchData } = await supabase
        .from('matches')
        .select('*')
        .or(listingIds.map(id => `listing_a.eq.${id},listing_b.eq.${id}`).join(','))
        .order('created_at', { ascending: false })
      setMatches(matchData ?? [])
    }
  }

  const deleteListing = async (id: string) => {
    await supabase.from('listings').delete().eq('id', id)
    setListings(prev => prev.filter(l => l.id !== id))
  }

  if (loading) return (
    <main className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
      <p className="text-gray-400">Loading...</p>
    </main>
  )

  const displayName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0]
  const activeListings = listings.filter(l => !l.matched)
  const matchedListings = listings.filter(l => l.matched)

  return (
    <main className="min-h-screen bg-[#f5f5f0] relative">
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle, #00000012 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
      }} />

      <div className="relative max-w-2xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px w-8 bg-gray-400" />
          <span className="text-sm text-gray-500 tracking-wide">Your account</span>
        </div>

        {/* Profile card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gray-900 flex items-center justify-center text-white text-xl font-bold">
              {displayName?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
              <p className="text-gray-400 text-sm">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{listings.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">Total listings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{matches.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">Matches</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{activeListings.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">Active</p>
            </div>
          </div>
        </div>

        {/* Matches section */}
        {matches.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Your matches</h2>
            <div className="flex flex-col gap-3">
              {matches.map(match => {
                const myListing = listings.find(
                  l => l.id === match.listing_a || l.id === match.listing_b
                )
                const myListingId = listings.find(
                  l => l.id === match.listing_a || l.id === match.listing_b
                )?.id
                return (
                  <a key={match.id}
                    href={`/listings/${myListingId}`}
                    className="bg-white border border-green-200 rounded-2xl p-5 hover:border-green-400 transition block"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{myListing?.model}</p>
                        <p className="text-sm text-gray-400 mt-0.5">
                          {myListing?.has_component} → {myListing?.needs_component}
                        </p>
                      </div>
                      <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">
                        Matched ✓
                      </span>
                    </div>
                    <p className="text-xs text-green-600 mt-3 font-medium">
                      Chat is open → tap to negotiate
                    </p>
                  </a>
                )
              })}
            </div>
          </div>
        )}

        {/* Active listings */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Active listings</h2>
            <a href="/listings/new"
              className="bg-gray-900 text-white text-xs px-4 py-2 rounded-full hover:bg-black transition">
              + Add new
            </a>
          </div>

          {activeListings.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
              <p className="text-gray-400 text-sm mb-3">No active listings yet.</p>
              <a href="/listings/new" className="text-gray-900 underline text-sm">Post your first listing</a>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {activeListings.map(listing => (
                <div key={listing.id}
                  className="bg-white border border-gray-200 rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{listing.model}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        📍 {listing.location || 'No location'}
                      </p>
                    </div>
                    {listing.asking_price && (
                      <span className="bg-gray-900 text-white text-xs px-3 py-1 rounded-full">
                        LKR {listing.asking_price.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 mb-3">
                    <span className="bg-gray-50 border border-gray-100 rounded-full px-3 py-1 text-xs">
                      Has <strong>{listing.has_component}</strong>
                    </span>
                    <span className="text-gray-300 text-xs flex items-center">→</span>
                    <span className="bg-gray-50 border border-gray-100 rounded-full px-3 py-1 text-xs">
                      Needs <strong>{listing.needs_component}</strong>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      listing.condition === 'Working perfectly' ? 'bg-green-100 text-green-700' :
                      listing.condition === 'Minor issues' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {listing.condition}
                    </span>
                    <button
                      onClick={() => deleteListing(listing.id)}
                      className="text-xs text-red-400 hover:text-red-600 transition">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past matched listings */}
        {matchedListings.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Past matches</h2>
            <div className="flex flex-col gap-3">
              {matchedListings.map(listing => (
                <div key={listing.id}
                  className="bg-white border border-gray-100 rounded-2xl p-5 opacity-60">
                  <p className="font-semibold text-gray-700">{listing.model}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {listing.has_component} → {listing.needs_component}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  )
}