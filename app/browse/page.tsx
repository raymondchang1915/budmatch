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
  asking_price: number | null
  matched: boolean
  created_at: string
}

export default function Browse() {
  const [listings, setListings] = useState<Listing[]>([])
  const [filtered, setFiltered] = useState<Listing[]>([])
  const [tab, setTab] = useState<'selling' | 'buying'>('selling')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [offerModal, setOfferModal] = useState<Listing | null>(null)
  const [offerPrice, setOfferPrice] = useState('')
  const [offerSent, setOfferSent] = useState(false)
  const [offerLoading, setOfferLoading] = useState(false)
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)
  const [userMatchedModels, setUserMatchedModels] = useState<string[]>([])

  useEffect(() => { fetchListings() }, [])
  useEffect(() => { applyFilters() }, [listings, tab, search])
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const switchedId = params.get('switched')
    const switchedType = params.get('type')
    if (switchedId && switchedType) {
      setTab(switchedType === 'buying' ? 'buying' : 'selling')
      setTimeout(() => {
        const el = document.getElementById(`listing-${switchedId}`)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 500)
    }
  }, [])
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const email = data.user?.email ?? null
      setCurrentUserEmail(email)
      if (email) {
        const { data: matchedListings } = await supabase
          .from('listings')
          .select('model')
          .eq('user_email', email)
          .eq('matched', true)
        setUserMatchedModels((matchedListings ?? []).map(l => l.model))
      }
    })
  }, [])

  const fetchListings = async () => {
    const { data } = await supabase
      .from('listings').select('*')
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
        l.location?.toLowerCase().includes(q)
      )
    }
    setFiltered(result)
  }

  async function handleSendOffer() {
    if (!offerPrice || !offerModal) return
    setOfferLoading(true)
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      alert('Please sign in to make an offer')
      setOfferLoading(false)
      return
    }

    // Check if user has an active match for same model
    const { data: activeMatches } = await supabase
      .from('listings')
      .select('id')
      .eq('user_email', userData.user.email)
      .eq('model', offerModal.model)
      .eq('matched', true)

    if (activeMatches && activeMatches.length > 0) {
      alert('You already have an active match for this model. Complete or cancel it before making an offer.')
      setOfferLoading(false)
      return
    }

    const res = await fetch('/api/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'send',
        listing_id: offerModal.id,
        sender_email: userData.user.email,
        amount: offerPrice,
      }),
    })
    const data = await res.json()
    setOfferLoading(false)
    if (data.ok) {
      setOfferSent(true)
    } else {
      alert(data.error ?? 'Something went wrong')
    }
  }

  const conditionDot: Record<string, string> = {
    'Working perfectly': '#22c55e',
    'Usable': '#f59e0b',
    'Unknown': '#9ca3af',
  }

  return (
    <main className="min-h-screen bg-[#f5f5f0] relative">
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle, #00000012 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
      }} />

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-16">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ height: 1, width: 28, background: '#999' }} />
              <span style={{ fontSize: 11, color: '#999', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'system-ui' }}>
                Marketplace
              </span>
            </div>
            <h1 style={{
              fontSize: 48, fontWeight: 700, color: '#111',
              letterSpacing: '-1.5px', lineHeight: 1, marginBottom: 6,
              fontFamily: 'system-ui, sans-serif',
            }}>Browse</h1>
            <p style={{ fontSize: 13, color: '#999', fontFamily: 'system-ui' }}>
              {loading ? '—' : `${filtered.length} listing${filtered.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <a href="/listings/new" style={{
            background: '#111', color: '#fff',
            fontSize: 13, padding: '10px 20px',
            borderRadius: 999, textDecoration: 'none',
            fontWeight: 500, fontFamily: 'system-ui',
            whiteSpace: 'nowrap',
          }}>
            + Post
          </a>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <span style={{
            position: 'absolute', left: 18, top: '50%',
            transform: 'translateY(-50%)', color: '#bbb', fontSize: 14,
          }}>⌕</span>
          <input
            type="text"
            placeholder="Search model, component, location..."
            style={{
              width: '100%', background: '#fff',
              border: '1px solid #e8e8e8', borderRadius: 999,
              padding: '12px 18px 12px 40px', fontSize: 13,
              outline: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              fontFamily: 'system-ui', color: '#333',
              boxSizing: 'border-box',
            }}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={e => (e.currentTarget.style.borderColor = '#999')}
            onBlur={e => (e.currentTarget.style.borderColor = '#e8e8e8')}
          />
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 24,
          background: '#fff', border: '1px solid #e8e8e8',
          borderRadius: 999, padding: 4,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
          {(['selling', 'buying'] as const).map(t => (
            <button key={t} type="button" onClick={() => setTab(t)} style={{
              flex: 1, padding: '9px 0',
              borderRadius: 999, fontSize: 13,
              fontWeight: 500, border: 'none',
              cursor: 'pointer', transition: 'all 0.15s',
              background: tab === t ? '#111' : 'transparent',
              color: tab === t ? '#fff' : '#888',
              fontFamily: 'system-ui',
            }}>
              {t === 'selling' ? 'For sale' : 'Looking for'}
            </button>
          ))}
        </div>

        {/* Listings */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#bbb', fontSize: 14 }}>
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 24px',
            background: '#fff', borderRadius: 20,
            border: '1px solid #e8e8e8',
          }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>📭</p>
            <p style={{ fontSize: 14, color: '#888', marginBottom: 16, fontFamily: 'system-ui' }}>
              No listings found
            </p>
            <a href="/listings/new" style={{
              fontSize: 13, color: '#111',
              textDecoration: 'underline', fontFamily: 'system-ui',
            }}>
              Post the first one
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(listing => (
              <div key={listing.id} id={`listing-${listing.id}`} style={{
                background: '#fff',
                border: '1px solid #e8e8e8',
                borderRadius: 20, padding: '20px 22px',
                transition: 'border-color 0.15s, transform 0.15s, box-shadow 0.15s',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              }}
                onMouseEnter={e => {
                  const el = e.currentTarget
                  el.style.borderColor = '#ccc'
                  el.style.boxShadow = '0 4px 20px rgba(0,0,0,0.07)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget
                  el.style.borderColor = '#e8e8e8'
                  el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)'
                }}
              >
                {/* Top row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <h2 style={{
                        fontSize: 15, fontWeight: 600, color: '#111',
                        fontFamily: 'system-ui',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {listing.model}
                      </h2>
                      <span style={{
                        fontSize: 11, fontWeight: 500, flexShrink: 0,
                        padding: '2px 8px', borderRadius: 999,
                        background: listing.listing_type === 'selling' ? '#eff6ff' : '#faf5ff',
                        color: listing.listing_type === 'selling' ? '#1d4ed8' : '#7e22ce',
                        border: `1px solid ${listing.listing_type === 'selling' ? '#bfdbfe' : '#e9d5ff'}`,
                        fontFamily: 'system-ui',
                      }}>
                        {listing.listing_type === 'selling' ? 'Selling' : 'Buying'}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: '#666', fontFamily: 'system-ui' }}>
                      📍 {listing.location || 'Location not set'}
                    </p>
                  </div>

                  {/* Right badges */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
                    {listing.matched && (
                      <span style={{
                        fontSize: 11, background: '#f0f9ff',
                        color: '#0284c7', border: '1px solid #bae6fd',
                        padding: '3px 10px', borderRadius: 999,
                        fontWeight: 500, fontFamily: 'system-ui',
                      }}>
                        Matched
                      </span>
                    )}
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      fontSize: 11, background: '#fafafa',
                      border: '1px solid #f0f0f0',
                      padding: '3px 10px', borderRadius: 999,
                      fontFamily: 'system-ui', color: '#555',
                    }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: conditionDot[listing.condition] ?? '#ccc',
                        display: 'inline-block', flexShrink: 0,
                      }} />
                      {listing.condition}
                    </span>
                  </div>
                </div>

                {/* Component tags */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                  <span style={{
                    fontSize: 12, background: '#f5f5f5',
                    border: '1px solid #ebebeb',
                    color: '#333', padding: '4px 12px',
                    borderRadius: 999, fontWeight: 500,
                    fontFamily: 'system-ui',
                  }}>
                    {listing.has_component}
                  </span>
                  {listing.has_case && (
                    <span style={{
                      fontSize: 12, background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      color: '#15803d', padding: '4px 12px',
                      borderRadius: 999, fontWeight: 500,
                      fontFamily: 'system-ui',
                    }}>
                      + Case ✓
                    </span>
                  )}
                  {listing.asking_price && (
                    <span style={{
                      fontSize: 12, background: '#fafafa',
                      border: '1px solid #ebebeb',
                      color: '#555', padding: '4px 12px',
                      borderRadius: 999, fontFamily: 'system-ui',
                    }}>
                      LKR {listing.asking_price.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <a href={`/listings/${listing.id}`} style={{
                    flex: 1, border: '1px solid #e8e8e8',
                    color: '#333', fontSize: 12,
                    padding: '9px 0', borderRadius: 999,
                    textAlign: 'center', textDecoration: 'none',
                    fontFamily: 'system-ui', fontWeight: 500,
                    transition: 'border-color 0.15s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#999')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#e8e8e8')}
                  >
                    View listing
                  </a>
                  {currentUserEmail && listing.user_email !== currentUserEmail && (
                    userMatchedModels.includes(listing.model)
                      ? <p style={{ flex: 1, fontSize: 11, color: '#aaa', textAlign: 'center', padding: '9px 0', fontFamily: 'system-ui' }}>
                          You have an active match for this model
                        </p>
                      : <button
                          type="button"
                          onClick={() => { setOfferModal(listing); setOfferSent(false); setOfferPrice('') }}
                          style={{
                            flex: 1, background: '#111',
                            color: '#fff', fontSize: 12,
                            padding: '9px 0', borderRadius: 999,
                            border: 'none', cursor: 'pointer',
                            fontFamily: 'system-ui', fontWeight: 500,
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#000')}
                          onMouseLeave={e => (e.currentTarget.style.background = '#111')}
                        >
                          Make offer
                        </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Offer modal */}
      {offerModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: 16,
          backdropFilter: 'blur(4px)',
        }}
          onClick={e => { if (e.target === e.currentTarget) setOfferModal(null) }}
        >
          <div style={{
            background: '#fff', borderRadius: 24,
            padding: 28, maxWidth: 380, width: '100%',
            boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
          }}>
            {offerSent ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 36, marginBottom: 12 }}>✅</p>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111', marginBottom: 8, fontFamily: 'system-ui' }}>
                  Offer sent!
                </h3>
                <p style={{ fontSize: 13, color: '#888', marginBottom: 20, fontFamily: 'system-ui' }}>
                  The seller will see your offer and reach out if interested.
                </p>
                <button type="button" onClick={() => setOfferModal(null)} style={{
                  width: '100%', background: '#111', color: '#fff',
                  padding: '12px 0', borderRadius: 999, border: 'none',
                  fontSize: 13, cursor: 'pointer', fontFamily: 'system-ui',
                }}>
                  Done
                </button>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 600, color: '#111', marginBottom: 4, fontFamily: 'system-ui' }}>
                    Make a direct offer
                  </h3>
                  <p style={{ fontSize: 13, color: '#888', fontFamily: 'system-ui' }}>
                    {offerModal.model} — {offerModal.has_component}{offerModal.has_case ? ' + Case' : ''}
                  </p>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 6, fontFamily: 'system-ui', letterSpacing: '0.05em' }}>
                    YOUR OFFER (LKR)
                  </label>
                  <input type="number" placeholder="e.g. 5000" style={{
                    width: '100%', border: '1px solid #e8e8e8',
                    borderRadius: 999, padding: '11px 18px',
                    fontSize: 13, outline: 'none',
                    fontFamily: 'system-ui', boxSizing: 'border-box', color: '#111',
                  }}
                    value={offerPrice}
                    onChange={e => setOfferPrice(e.target.value)}
                    onFocus={e => (e.currentTarget.style.borderColor = '#999')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#e8e8e8')}
                  />
                </div>

                {offerModal.matched && (
                  <div style={{
                    background: '#fffbeb', border: '1px solid #fde68a',
                    borderRadius: 12, padding: '10px 14px', marginBottom: 16,
                  }}>
                    <p style={{ fontSize: 12, color: '#92400e', fontFamily: 'system-ui' }}>
                      ⚠️ This listing already has a match. Your offer will be considered if that deal falls through.
                    </p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => setOfferModal(null)} style={{
                    flex: 1, border: '1px solid #e8e8e8',
                    background: 'transparent', color: '#555',
                    padding: '11px 0', borderRadius: 999,
                    fontSize: 13, cursor: 'pointer',
                    fontFamily: 'system-ui',
                  }}>
                    Cancel
                  </button>
                  <button type="button" onClick={handleSendOffer}
                    disabled={!offerPrice || offerLoading}
                    style={{
                      flex: 1, background: !offerPrice || offerLoading ? '#e0e0e0' : '#111',
                      color: !offerPrice || offerLoading ? '#aaa' : '#fff',
                      padding: '11px 0', borderRadius: 999,
                      border: 'none', fontSize: 13,
                      cursor: !offerPrice || offerLoading ? 'not-allowed' : 'pointer',
                      fontFamily: 'system-ui', fontWeight: 500,
                      transition: 'background 0.15s',
                    }}>
                    {offerLoading ? 'Sending...' : 'Send offer'}
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