'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'

type Shop = {
  id: string
  shop_name: string
  owner_name: string
  phone: string
  location: string
  shop_code: string
  total_earned: number
  is_dropoff: boolean
  created_at: string
}

type Listing = {
  id: string
  model: string
  has_component: string
  needs_component: string
  matched: boolean
  created_at: string
  referral_earned: boolean
}

type MatchWithPrice = {
  id: string
  agreed_price: number | null
  anchor_price: number
  status: string
  listing_a: string
  listing_b: string
}

export default function ShopDashboard() {
  const { code } = useParams()
  const [shop, setShop] = useState<Shop | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [matches, setMatches] = useState<MatchWithPrice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchShopData() }, [code])

  const fetchShopData = async () => {
    const { data: shopData } = await supabase
      .from('shop_partners').select('*').eq('shop_code', code).single()

    if (!shopData) { setLoading(false); return }
    setShop(shopData)

    const { data: listingData } = await supabase
      .from('listings').select('*').eq('shop_code', code)
      .order('created_at', { ascending: false })

    const allListings = listingData ?? []
    setListings(allListings)

    // Fetch matches for matched listings to get agreed prices
    const matchedIds = allListings.filter(l => l.matched).map(l => l.id)
    if (matchedIds.length > 0) {
      const { data: matchData } = await supabase
        .from('matches').select('id, agreed_price, anchor_price, status, listing_a, listing_b')
        .or(matchedIds.map(id => `listing_a.eq.${id},listing_b.eq.${id}`).join(','))
      setMatches(matchData ?? [])
    }

    setLoading(false)
  }

  // Calculate commission for a listing: 5% of agreed price (50% of 10% platform fee)
  const getCommission = (listing: Listing): number => {
    const match = matches.find(m => m.listing_a === listing.id || m.listing_b === listing.id)
    if (!match) return 0
    const price = match.agreed_price ?? match.anchor_price
    return Math.round(price * 0.05)
  }

  const matchedListings = listings.filter(l => l.matched)
  const pendingListings = listings.filter(l => !l.matched)
  const totalEarned = matchedListings.reduce((sum, l) => sum + getCommission(l), 0)
  const pendingCount = pendingListings.length

  if (loading) return (
    <main className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
      <p className="text-gray-400">Loading...</p>
    </main>
  )

  if (!shop) return (
    <main className="min-h-screen bg-[#f5f5f0] flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-4xl mb-4">🔍</p>
        <p className="text-gray-700 font-semibold mb-2">Shop not found</p>
        <p className="text-gray-400 text-sm mb-6">Check your shop code and try again.</p>
        <a href="/shop/register" className="bg-gray-900 text-white px-6 py-2.5 rounded-full text-sm">
          Register your shop
        </a>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-[#f5f5f0] relative">
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle, #00000012 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
      }} />

      <div className="relative max-w-2xl mx-auto px-6 py-16">

        <div className="flex items-center gap-3 mb-6">
          <div className="h-px w-8 bg-gray-400" />
          <span className="text-sm text-gray-500 tracking-wide">Shop dashboard</span>
        </div>

        {/* Shop header */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{shop.shop_name}</h1>
              <p className="text-gray-400 text-sm mt-0.5">📍 {shop.location}</p>
            </div>
            <div className="bg-gray-900 text-white rounded-xl px-4 py-2 text-center">
              <p className="text-xs text-gray-400">Your code</p>
              <p className="text-xl font-bold tracking-widest">{shop.shop_code}</p>
            </div>
          </div>
          {shop.is_dropoff && (
            <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
              ✓ Drop-off point
            </span>
          )}
        </div>

        {/* Earnings summary */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center shadow-sm">
            <p className="text-2xl font-bold text-gray-900">
              {totalEarned > 0 ? `LKR ${totalEarned.toLocaleString()}` : '—'}
            </p>
            <p className="text-xs text-gray-400 mt-1">Total earned</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center shadow-sm">
            <p className="text-2xl font-bold text-gray-900">{matchedListings.length}</p>
            <p className="text-xs text-gray-400 mt-1">Matches</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center shadow-sm">
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
            <p className="text-xs text-gray-400 mt-1">Pending</p>
          </div>
        </div>

        {/* Commission info */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-sm text-sm">
          <p className="font-medium text-gray-900 mb-2">Your commission rate</p>
          <div className="flex justify-between text-gray-500">
            <span>Platform fee</span>
            <span className="text-gray-700">10% of agreed price</span>
          </div>
          <div className="flex justify-between text-gray-500 mt-1">
            <span>Your share</span>
            <span className="text-gray-700">50% of platform fee</span>
          </div>
          <div className="flex justify-between font-semibold text-gray-900 mt-2 pt-2 border-t border-gray-100">
            <span>Your effective cut</span>
            <span>5% of each agreed price</span>
          </div>
        </div>

        {/* Share card */}
        <div className="bg-gray-900 text-white rounded-2xl p-6 mb-6">
          <h2 className="font-bold mb-2">Share with customers</h2>
          <p className="text-gray-400 text-sm mb-4">
            Tell customers to enter code <strong className="text-white">{shop.shop_code}</strong> when posting a listing on BudMatch.
          </p>
          <div className="bg-white/10 rounded-xl p-4 text-sm">
            <p className="text-gray-300">
              "Post your broken earbuds on <strong className="text-white">budmatch.vercel.app</strong> and enter code <strong className="text-white">{shop.shop_code}</strong> to get matched with someone near you!"
            </p>
          </div>
        </div>

        {/* Listings */}
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Listings via your code ({listings.length})
        </h2>

        {listings.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
            <p className="text-gray-400 text-sm">No listings yet. Start sharing your code!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {listings.map(listing => {
              const commission = getCommission(listing)
              return (
                <div key={listing.id}
                  className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{listing.model}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {listing.has_component} → {listing.needs_component}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(listing.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    {listing.matched ? (
                      <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                        Matched ✓
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
                        Pending
                      </span>
                    )}
                    {listing.matched && commission > 0 && (
                      <p className="text-xs text-green-600 font-medium mt-1">
                        +LKR {commission.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </main>
  )
}