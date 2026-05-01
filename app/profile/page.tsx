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

type Offer = {
  id: string
  listing_id: string
  sender_email: string
  amount: number
  status: string
  created_at: string
  match_id: string | null
  listings: {
    model: string
    has_component: string
    user_email: string
  }
}

export default function Profile() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [incomingOffers, setIncomingOffers] = useState<Offer[]>([])
  const [sentOffers, setSentOffers] = useState<Offer[]>([])
  const [offerLoading, setOfferLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{ condition: string; location: string; asking_price: string }>({
    condition: '', location: '', asking_price: '',
  })

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
        .or(`listing_a.in.(${listingIds.join(',')}),listing_b.in.(${listingIds.join(',')})`)
        .order('created_at', { ascending: false })
      setMatches(matchData ?? [])
    }

    loadOffers(email)
  }

  async function loadOffers(email: string) {
    setOfferLoading(true)
    const { data: myListings } = await supabase
      .from('listings').select('id').eq('user_email', email)
    const myListingIds = (myListings ?? []).map(l => l.id)

    if (myListingIds.length > 0) {
      const { data: incoming } = await supabase
        .from('offers')
        .select('*, listings(model, has_component, user_email)')
        .in('listing_id', myListingIds)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      setIncomingOffers(incoming ?? [])
    }

    const { data: sent } = await supabase
      .from('offers')
      .select('*, listings(model, has_component, user_email)')
      .eq('sender_email', email)
      .order('created_at', { ascending: false })
    setSentOffers(sent ?? [])
    setOfferLoading(false)
  }

  async function handleAcceptOffer(offerId: string, listingId: string) {
    const { data: listing } = await supabase
      .from('listings').select('matched').eq('id', listingId).single()
    if (listing?.matched) {
      alert('You have an active match on this listing. Cancel your current match first to accept this offer.')
      return
    }
    const res = await fetch('/api/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'accept', offer_id: offerId }),
    })
    const data = await res.json()
    if (data.ok) {
      router.push(`/offer-match/${data.match_id}`)
    } else {
      alert(data.error ?? 'Something went wrong')
    }
  }

  async function handleDeclineOffer(offerId: string) {
    await fetch('/api/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'decline', offer_id: offerId }),
    })
    setIncomingOffers(prev => prev.filter(o => o.id !== offerId))
  }

  async function handleDeleteListing(listingId: string) {
  const confirmed = window.confirm('Delete this listing?')
  if (!confirmed) return

  try {
    const res = await fetch('/api/listings', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id: listingId, user_email: user.email }),
    })
    const data = await res.json()
    
    console.log('Delete response:', data)

    if (!data.ok) {
      alert(data.error ?? 'Delete failed')
      return
    }

    // Remove from state
    setListings(prev => prev.filter(l => l.id !== listingId))

  } catch (e) {
    console.error('Exception during delete:', e)
    alert('Something went wrong')
  }
}

 

  async function handleSaveEdit(listingId: string, model: string) {
    await supabase.from('listings').update({
      condition: editForm.condition,
      location: editForm.location,
      asking_price: editForm.asking_price ? parseInt(editForm.asking_price) : null,
    }).eq('id', listingId)

    await fetch('/api/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model }),
    })

    setEditingId(null)
    fetchUserData(user.email)
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
                  {!listing.matched && editingId === listing.id ? (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                      <select
                        className="w-full bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-sm text-gray-900 focus:outline-none"
                        value={editForm.condition}
                        onChange={e => setEditForm(p => ({ ...p, condition: e.target.value }))}
                      >
                        {['Working perfectly', 'Usable', 'Unknown'].map(c => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                      <input type="text" placeholder="Location"
                        className="w-full bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                        value={editForm.location}
                        onChange={e => setEditForm(p => ({ ...p, location: e.target.value }))}
                      />
                      <input type="number" placeholder="Asking price (LKR)"
                        className="w-full bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                        value={editForm.asking_price}
                        onChange={e => setEditForm(p => ({ ...p, asking_price: e.target.value }))}
                      />
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setEditingId(null)}
                          className="flex-1 border border-gray-200 text-gray-500 py-2 rounded-full text-sm">
                          Cancel
                        </button>
                        <button type="button" onClick={() => handleSaveEdit(listing.id, listing.model)}
                          className="flex-1 bg-gray-900 text-white py-2 rounded-full text-sm font-medium">
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                      {!listing.matched && (
                        <button type="button"
                          onClick={() => {
                            setEditingId(listing.id)
                            setEditForm({
                              condition: listing.condition,
                              location: listing.location ?? '',
                              asking_price: listing.asking_price?.toString() ?? '',
                            })
                          }}
                          className="flex-1 border border-gray-200 text-gray-500 py-2 rounded-full text-sm hover:border-gray-400 transition">
                          Edit
                        </button>
                      )}
                      <button type="button" onClick={() => handleDeleteListing(listing.id)}
                        className="flex-1 border border-red-200 text-red-500 py-2 rounded-full text-sm hover:border-red-400 transition">
                        Delete
                      </button>
                    </div>
                  )}
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

        {/* Incoming offers */}
        {incomingOffers.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Offers on your listings
              <span className="ml-2 text-sm bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-normal">
                {incomingOffers.length} pending
              </span>
            </h2>
            <div className="space-y-3">
              {incomingOffers.map(offer => (
                <div key={offer.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {(offer.listings as any)?.model} — {(offer.listings as any)?.has_component}
                      </p>
                      <p className="text-sm text-gray-400 mt-0.5">
                        From {offer.sender_email.split('@')[0]} · {new Date(offer.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-lg font-bold text-gray-900 mt-2">
                        LKR {Number(offer.amount).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button type="button"
                        onClick={() => handleAcceptOffer(offer.id, offer.listing_id)}
                        className="bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-black transition">
                        Accept
                      </button>
                      <button type="button"
                        onClick={() => handleDeclineOffer(offer.id)}
                        className="border border-gray-200 text-gray-500 px-4 py-2 rounded-full text-sm hover:border-gray-400 transition">
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sent offers */}
        {sentOffers.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Offers you sent</h2>
            <div className="space-y-3">
              {sentOffers.map(offer => (
                <div key={offer.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{(offer.listings as any)?.model}</p>
                      <p className="text-sm text-gray-400 mt-0.5">
                        LKR {Number(offer.amount).toLocaleString()} · {new Date(offer.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {offer.status === 'pending' && (
                        <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full">
                          Pending
                        </span>
                      )}
                      {offer.status === 'accepted' && offer.match_id && (
                        <a href={`/offer-match/${offer.match_id}`}
                          className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full hover:border-green-400 transition">
                          Accepted — Pay now →
                        </a>
                      )}
                      {offer.status === 'declined' && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
                          Declined
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  )
}