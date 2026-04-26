'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Listing = {
  id: string
  model: string
  has_component: string
  needs_component: string
  has_case: boolean
  listing_type: string
  condition: string
  location: string
  user_email: string
  asking_price: number | null
  matched: boolean
  created_at: string
  shop_code: string | null
}

type Match = {
  id: string
  listing_a: string
  listing_b: string
  status: string
  anchor_price: number
  market_reference: number
  ladder_min: number
  ladder_max: number
  buyer_offer: number
  seller_offer: number
  agreed_price: number | null
  negotiation_status: string
  buyer_paid: boolean
  seller_paid: boolean
  buyer_locked: boolean
  seller_locked: boolean
  switch_suggested: boolean
  payment_deadline: string | null
  renegotiation_count: number
}

type Message = {
  id: string
  created_at: string
  match_id: string
  sender_email: string
  content: string
}

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [listing, setListing] = useState<Listing | null>(null)
  const [match, setMatch] = useState<Match | null>(null)
  const [sellerListing, setSellerListing] = useState<Listing | null>(null)
  const [buyerListing, setBuyerListing] = useState<Listing | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [negotiating, setNegotiating] = useState(false)
  const [paying, setPaying] = useState(false)
  const [loading, setLoading] = useState(true)
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'cancelled' | null>(null)
  const [timeLeft, setTimeLeft] = useState<string | null>(null)
  const [midpointModal, setMidpointModal] = useState<{ midpoint: number; renegotiationsLeft: number } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isSeller = currentUser && sellerListing ? sellerListing.user_email === currentUser : false
  const isBuyer = currentUser && buyerListing ? buyerListing.user_email === currentUser : false
  const myRole: 'seller' | 'buyer' | null = isSeller ? 'seller' : isBuyer ? 'buyer' : null

  const bothPaid = match?.status === 'paid'
  const userHasPaid = match ? (myRole === 'buyer' ? match.buyer_paid : match.seller_paid) : false
  const chatUnlocked = bothPaid
  const isLocked = match ? (myRole === 'buyer' ? match.buyer_locked : match.seller_locked) : false
  const bothLocked = match?.buyer_locked && match?.seller_locked

  const agreedPrice = match?.agreed_price ?? match?.anchor_price ?? 0
  const myFee = Math.max(100, Math.round(agreedPrice * 0.10))

  const renegsLeft = MAX_RENEGOTIATIONS - (match?.renegotiation_count ?? 0)
  const canMatchPrice = (match?.renegotiation_count ?? 0) >= 1 && match?.negotiation_status !== 'agreed'
  const canRenegotiate = match?.negotiation_status === 'agreed' && !bothPaid && renegsLeft > 0

  const myOffer = match
    ? myRole === 'buyer' ? match.buyer_offer : match.seller_offer
    : 0
  const theirOffer = match
    ? myRole === 'buyer' ? match.seller_offer : match.buyer_offer
    : 0

  // 24h countdown
  useEffect(() => {
    if (!match?.payment_deadline) return
    const interval = setInterval(() => {
      const diff = new Date(match.payment_deadline!).getTime() - Date.now()
      if (diff <= 0) { setTimeLeft('Expired'); clearInterval(interval); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`)
    }, 1000)
    return () => clearInterval(interval)
  }, [match?.payment_deadline])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('payment') === 'success') setPaymentStatus('success')
    if (params.get('payment') === 'cancelled') setPaymentStatus('cancelled')
    supabase.auth.getUser().then(({ data }) => setCurrentUser(data.user?.email ?? null))
  }, [])

  useEffect(() => { if (id) loadData() }, [id])

  useEffect(() => {
    if (!match?.id) return
    loadMessages()
    const channel = supabase
      .channel(`messages:${match.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `match_id=eq.${match.id}`,
      }, (payload) => setMessages(prev => [...prev, payload.new as Message]))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [match?.id])

  useEffect(() => {
    if (!match?.id) return

    const channel = supabase
      .channel(`match-updates:${match.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'matches',
        filter: `id=eq.${match.id}`,
      }, (payload) => {
        const updated = payload.new as Match
        setMatch(updated)

        if (
          updated.buyer_locked &&
          updated.seller_locked &&
          updated.negotiation_status !== 'agreed' &&
          updated.buyer_offer >= updated.seller_offer
        ) {
          const midpoint = Math.round((updated.buyer_offer + updated.seller_offer) / 2 / 100) * 100
          const renegsLeft = MAX_RENEGOTIATIONS - (updated.renegotiation_count ?? 0)
          setMidpointModal({ midpoint, renegotiationsLeft: renegsLeft })
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [match?.id])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function loadData() {
    const { data: listingData } = await supabase.from('listings').select('*').eq('id', id).single()
    if (!listingData) { setLoading(false); return }
    setListing(listingData)

    const { data: matchData } = await supabase
      .from('matches').select('*')
      .or(`listing_a.eq.${id},listing_b.eq.${id}`)
      .order('created_at', { ascending: false })
      .limit(1).single()

    if (matchData) {
      setMatch(matchData)
      const { data: sl } = await supabase.from('listings').select('*').eq('id', matchData.listing_a).single()
      const { data: bl } = await supabase.from('listings').select('*').eq('id', matchData.listing_b).single()
      if (sl) setSellerListing(sl)
      if (bl) setBuyerListing(bl)
    }
    setLoading(false)
  }

  async function loadMessages() {
    if (!match?.id) return
    const { data } = await supabase.from('messages').select('*')
      .eq('match_id', match.id).order('created_at', { ascending: true })
    setMessages(data ?? [])
  }

  async function refreshMatch() {
    if (!match?.id) return
    const { data: fresh } = await supabase.from('matches').select('*').eq('id', match.id).single()
    if (fresh) setMatch(fresh)
  }

  async function handleNegotiate(direction: 'up' | 'down') {
    if (!match || !myRole) return
    setNegotiating(true)
    await fetch('/api/negotiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match_id: match.id, role: myRole, direction }),
    })
    await refreshMatch()
    setNegotiating(false)
  }

  async function handleLock() {
    if (!match || !myRole) return
    setNegotiating(true)
    const res = await fetch('/api/negotiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match_id: match.id, role: myRole, action: 'lock' }),
    })
    const data = await res.json()
    await refreshMatch()
    setNegotiating(false)

    if (data.both_locked && !data.forced) {
      setMidpointModal({ midpoint: data.midpoint, renegotiationsLeft: data.renegotiations_left })
    }
  }

  async function handleConfirmMidpoint() {
    if (!match) return
    setMidpointModal(null)
    setNegotiating(true)
    await fetch('/api/negotiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match_id: match.id, action: 'confirm_midpoint' }),
    })
    await refreshMatch()
    setNegotiating(false)
  }

  async function handleRenegotiate() {
    if (!match) return
    setMidpointModal(null)
    setNegotiating(true)
    const res = await fetch('/api/negotiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match_id: match.id, action: 'renegotiate', role: myRole }),
    })
    const data = await res.json()
    if (data.error) { alert(data.error); setNegotiating(false); return }
    await refreshMatch()
    setNegotiating(false)
  }

  async function handleMatchPrice() {
    if (!match || !myRole) return
    setNegotiating(true)
    const res = await fetch('/api/negotiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match_id: match.id, role: myRole, action: 'match_price' }),
    })
    const data = await res.json()
    await refreshMatch()
    setNegotiating(false)
    if (data.agreed) setMidpointModal(null)
  }

  async function handlePayment() {
    if (!currentUser || !match || !myRole) return
    setPaying(true)
    const field = myRole === 'buyer' ? 'buyer_paid' : 'seller_paid'
    await supabase.from('matches').update({ [field]: true }).eq('id', match.id)

    const updatedBuyerPaid = myRole === 'buyer' ? true : match.buyer_paid
    const updatedSellerPaid = myRole === 'seller' ? true : match.seller_paid

    if (updatedBuyerPaid && updatedSellerPaid) {
      await supabase.from('matches').update({ status: 'paid' }).eq('id', match.id)
    } else {
      await fetch('/api/negotiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_id: match.id, action: 'notify_payment', role: myRole }),
      })
    }
    await refreshMatch()
    setPaying(false)
  }

  async function sendMessage() {
    if (!newMessage.trim() || !match?.id || !currentUser) return
    setSending(true)
    await supabase.from('messages').insert([{
      match_id: match.id, sender_email: currentUser, content: newMessage.trim(),
    }])
    const otherEmail = currentUser === sellerListing?.user_email
      ? buyerListing?.user_email : sellerListing?.user_email
    const otherListingId = currentUser === sellerListing?.user_email
      ? buyerListing?.id : sellerListing?.id
    if (otherEmail && otherListingId) {
      await supabase.from('notifications').insert([{
        user_email: otherEmail, type: 'new_message',
        message: `New message from ${currentUser.split('@')[0]}: "${newMessage.trim().slice(0, 60)}${newMessage.trim().length > 60 ? '...' : ''}"`,
        listing_id: otherListingId, match_id: match.id, read: false,
      }])
    }
    setNewMessage('')
    setSending(false)
  }

  if (loading) return (
    <main className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
      <p className="text-gray-400 text-sm animate-pulse">Loading...</p>
    </main>
  )

  if (!listing) return (
    <main className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 mb-4">Listing not found.</p>
        <a href="/browse" className="text-sm text-gray-900 underline">Back to browse</a>
      </div>
    </main>
  )

  const conditionColor =
    listing.condition === 'Working perfectly' ? 'text-green-600 bg-green-50 border-green-200' :
    listing.condition === 'Usable' ? 'text-amber-600 bg-amber-50 border-amber-200' :
    'text-gray-500 bg-gray-100 border-gray-200'

  return (
    <main className="min-h-screen bg-[#f5f5f0] relative">
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle, #00000012 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
      }} />

      {/* Midpoint confirmation modal */}
      {midpointModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
          style={{ backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl p-7 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Both sides locked in</h3>
            <p className="text-sm text-gray-500 mb-5">
              Confirm at the midpoint of <strong>LKR {midpointModal.midpoint.toLocaleString()}</strong>?
              {midpointModal.renegotiationsLeft > 0
                ? ` Or renegotiate (${midpointModal.renegotiationsLeft} time${midpointModal.renegotiationsLeft === 1 ? '' : 's'} left).`
                : ' This is your last renegotiation — you must confirm.'}
            </p>
            <div className="flex gap-3">
              {midpointModal.renegotiationsLeft > 0 && (
                <button type="button" onClick={handleRenegotiate}
                  className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-full text-sm hover:border-gray-400 transition">
                  Renegotiate
                </button>
              )}
              <button type="button" onClick={handleConfirmMidpoint}
                className="flex-1 bg-gray-900 text-white py-2.5 rounded-full text-sm font-medium hover:bg-black transition">
                Confirm at LKR {midpointModal.midpoint.toLocaleString()}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-16 space-y-5">

        <button type="button" onClick={() => router.back()}
          className="text-sm text-gray-400 hover:text-gray-700 transition flex items-center gap-1.5">
          ← Back
        </button>

        {paymentStatus === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-2xl px-6 py-4 text-sm text-green-700 font-medium">
            ✓ Payment received! Waiting for the other side before chat unlocks.
          </div>
        )}
        {paymentStatus === 'cancelled' && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-6 py-4 text-sm text-red-600">
            Payment cancelled. Try again below.
          </div>
        )}

        {/* Listing card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{listing.model}</h1>
              <p className="text-gray-400 text-sm mt-0.5">{listing.location}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`text-xs font-medium px-3 py-1.5 rounded-full border ${conditionColor}`}>
                {listing.condition}
              </span>
              <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full capitalize">
                {listing.listing_type}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-gray-400 text-xs mb-1">Has</p>
              <p className="text-gray-900 font-medium">{listing.has_component}{listing.has_case ? ' + Case' : ''}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-gray-400 text-xs mb-1">Needs</p>
              <p className="text-gray-900 font-medium">{listing.needs_component}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span>{listing.user_email}</span>
            <span>{new Date(listing.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* No match yet */}
        {!listing.matched || !match ? (
          <div className="bg-white border border-gray-200 rounded-2xl px-7 py-12 text-center shadow-sm">
            <div className="text-3xl mb-3">⏳</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Looking for your match</h2>
            <p className="text-gray-400 text-sm max-w-xs mx-auto">We'll notify you when someone compatible is found.</p>
          </div>
        ) : (
          <>
            {/* Match banner */}
            <div className={`rounded-2xl px-6 py-4 flex items-center gap-3 text-sm font-medium border ${
              bothPaid ? 'bg-green-50 border-green-200 text-green-700'
              : match.negotiation_status === 'agreed' ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}>
              <span className="text-xl">
                {bothPaid ? '🤝' : match.negotiation_status === 'agreed' ? '💳' : '⚡'}
              </span>
              <p>
                {bothPaid
                  ? `Deal confirmed at LKR ${match.agreed_price?.toLocaleString()} — chat is open`
                  : match.negotiation_status === 'agreed'
                    ? `Price agreed at LKR ${match.agreed_price?.toLocaleString()} — pay to unlock chat`
                    : `You have a match! ${myRole ? `You are the ${myRole}.` : ''} Negotiate below.`}
              </p>
            </div>

            {/* Match summary */}
            {sellerListing && buyerListing && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">Match summary</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className={`rounded-xl p-4 ${isSeller ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
                    <p className={`text-xs mb-1 ${isSeller ? 'text-gray-400' : 'text-gray-400'}`}>
                      {isSeller ? 'You (seller)' : `${sellerListing.user_email.split('@')[0]} (seller)`}
                    </p>
                    <p className="font-medium">{sellerListing.has_component}{sellerListing.has_case ? ' + Case' : ''}</p>
                    <p className={`text-xs mt-1 ${isSeller ? 'text-gray-400' : 'text-gray-500'}`}>{sellerListing.condition}</p>
                  </div>
                  <div className={`rounded-xl p-4 ${isBuyer ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
                    <p className={`text-xs mb-1 ${isBuyer ? 'text-gray-400' : 'text-gray-400'}`}>
                      {isBuyer ? 'You (buyer)' : `${buyerListing.user_email.split('@')[0]} (buyer)`}
                    </p>
                    <p className="font-medium">{buyerListing.has_component}{buyerListing.has_case ? ' + Case' : ''}</p>
                    <p className={`text-xs mt-1 ${isBuyer ? 'text-gray-400' : 'text-gray-500'}`}>{buyerListing.condition}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Negotiation card */}
            {match.negotiation_status !== 'agreed' && (
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Negotiate the price</h2>
                      <p className="text-sm text-gray-400 mt-0.5">Move your offer, then lock in when ready.</p>
                    </div>
                    {(match.renegotiation_count ?? 0) > 0 && (
                      <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full">
                        Round {match.renegotiation_count}/{MAX_RENEGOTIATIONS}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6 grid grid-cols-2 gap-4 text-sm">
                  <div className={`rounded-xl p-4 space-y-1 ${isBuyer ? 'ring-2 ring-gray-900 bg-gray-50' : 'bg-gray-50'}`}>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Buyer {isBuyer && <span className="text-gray-900 normal-case">(you)</span>}
                      {match.buyer_locked && <span className="ml-1 text-green-600">🔒</span>}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      LKR {(match.buyer_offer ?? match.anchor_price).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">Ref: LKR {match.market_reference?.toLocaleString()}</p>
                  </div>

                  <div className={`rounded-xl p-4 space-y-1 ${isSeller ? 'ring-2 ring-gray-900 bg-gray-50' : 'bg-gray-50'}`}>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Seller {isSeller && <span className="text-gray-900 normal-case">(you)</span>}
                      {match.seller_locked && <span className="ml-1 text-green-600">🔒</span>}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      LKR {(match.seller_offer ?? match.anchor_price).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">Ref: LKR {match.market_reference?.toLocaleString()}</p>
                  </div>
                </div>

                {/* Range bar */}
                <div className="px-6 pb-4">
                  <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="absolute h-full bg-gray-900 rounded-full transition-all duration-300"
                      style={{
                        left: `${((match.buyer_offer ?? match.anchor_price) - match.ladder_min) / (match.ladder_max - match.ladder_min) * 100}%`,
                        right: `${100 - ((match.seller_offer ?? match.anchor_price) - match.ladder_min) / (match.ladder_max - match.ladder_min) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                    <span>LKR {match.ladder_min?.toLocaleString()}</span>
                    <span>LKR {match.ladder_max?.toLocaleString()}</span>
                  </div>
                </div>

                {/* My controls */}
                {myRole && (
                  <div className="px-6 pb-6 space-y-3">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs text-gray-500 mb-1">
                        Your offer: <strong className="text-gray-900">LKR {myOffer.toLocaleString()}</strong>
                        {isLocked && <span className="ml-2 text-green-600 text-xs">🔒 Locked</span>}
                      </p>
                      <p className="text-xs text-gray-400 mb-3">Their offer: LKR {theirOffer.toLocaleString()}</p>
                      <div className="flex gap-2 mb-3">
                        <button type="button" onClick={() => handleNegotiate('down')}
                          disabled={negotiating || isLocked}
                          className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-full text-sm font-medium hover:border-gray-400 transition disabled:opacity-40">
                          − LKR 100
                        </button>
                        <button type="button" onClick={() => handleNegotiate('up')}
                          disabled={negotiating || isLocked}
                          className="flex-1 bg-gray-900 text-white py-2.5 rounded-full text-sm font-medium hover:bg-black transition disabled:opacity-40">
                          + LKR 100
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={handleLock}
                          disabled={negotiating || isLocked}
                          className={`flex-1 py-2.5 rounded-full text-sm font-medium transition ${
                            isLocked
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : 'bg-gray-900 text-white hover:bg-black disabled:opacity-40'
                          }`}>
                          {isLocked ? '🔒 Locked in' : 'Lock my offer'}
                        </button>
                        {canMatchPrice && (
                          <button type="button" onClick={handleMatchPrice}
                            disabled={negotiating}
                            className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-full text-sm hover:border-gray-900 transition disabled:opacity-40">
                            Match their price
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Payment card */}
            {match.negotiation_status === 'agreed' && !bothPaid && (
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Confirm the deal</h2>
                      <p className="text-sm text-gray-400 mt-0.5">Both sides pay 10% to unlock chat.</p>
                    </div>
                    {(match.buyer_paid || match.seller_paid) && timeLeft && (
                      <div className={`text-sm font-mono font-bold px-3 py-1.5 rounded-full ${
                        timeLeft === 'Expired' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {timeLeft === 'Expired' ? 'Expired' : `⏱ ${timeLeft}`}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4 text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-500">Agreed price</span>
                      <span className="font-semibold text-gray-900">LKR {agreedPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Your fee (10%)</span>
                      <span className="font-semibold text-gray-900">LKR {myFee.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className={`rounded-xl px-4 py-3 border text-center ${
                      match.buyer_paid ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-400'
                    }`}>
                      {match.buyer_paid ? '✓ Buyer paid' : 'Buyer — pending'}
                    </div>
                    <div className={`rounded-xl px-4 py-3 border text-center ${
                      match.seller_paid ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-400'
                    }`}>
                      {match.seller_paid ? '✓ Seller paid' : 'Seller — pending'}
                    </div>
                  </div>

                  {myRole && !userHasPaid && !match.buyer_paid && !match.seller_paid && canRenegotiate && (
                    <button type="button" onClick={handleRenegotiate} disabled={negotiating}
                      className="w-full border border-gray-200 text-gray-500 py-2.5 rounded-full text-sm hover:border-gray-400 transition disabled:opacity-40">
                      Renegotiate ({renegsLeft} time{renegsLeft === 1 ? '' : 's'} left)
                    </button>
                  )}

                  {myRole && !userHasPaid && (
                    <button type="button" onClick={handlePayment} disabled={paying}
                      className="w-full bg-gray-900 text-white py-3.5 rounded-full text-sm font-medium hover:bg-black transition disabled:opacity-40">
                      {paying ? 'Processing...' : `Pay LKR ${myFee.toLocaleString()} to confirm →`}
                    </button>
                  )}

                  {userHasPaid && !bothPaid && (
                    <p className="text-sm text-center text-gray-400">
                      You're confirmed. The other side has 24 hours to pay or the match is cancelled.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Chat */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Chat</h2>
                  {!chatUnlocked && (
                    <p className="text-sm text-gray-400 mt-0.5">
                      {match.negotiation_status !== 'agreed' ? 'Agree on a price to proceed' : 'Unlocks after both sides pay'}
                    </p>
                  )}
                </div>
                {bothPaid && match.agreed_price && (
                  <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-full font-medium">
                    LKR {match.agreed_price.toLocaleString()}
                  </span>
                )}
              </div>

              {!chatUnlocked ? (
                <div className="px-7 py-12 text-center text-gray-400 text-sm">
                  <div className="text-3xl mb-3">🔒</div>
                  <p>{match.negotiation_status !== 'agreed' ? 'Agree on a price above to proceed.' : 'Complete payment above to unlock chat.'}</p>
                </div>
              ) : (
                <>
                  <div className="px-6 py-5 space-y-3 max-h-80 overflow-y-auto">
                    {messages.length === 0
                      ? <p className="text-center text-gray-400 text-sm py-8">No messages yet. Say hi! 👋</p>
                      : messages.map(msg => {
                          const isMe = msg.sender_email === currentUser
                          return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-xs rounded-2xl px-4 py-2.5 text-sm ${
                                isMe ? 'bg-gray-900 text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                              }`}>
                                {!isMe && <p className="text-xs opacity-50 mb-1">{msg.sender_email.split('@')[0]}</p>}
                                {msg.content}
                              </div>
                            </div>
                          )
                        })
                    }
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="px-6 pb-3 flex gap-2">
                    <a href="https://pickme.lk" target="_blank" rel="noopener noreferrer"
                      className="flex-1 border border-gray-200 text-gray-500 text-xs py-2.5 rounded-full text-center hover:border-gray-400 transition">
                      📦 PickMe
                    </a>
                    <a href="https://www.uber.com/lk/en/ride/uber-connect/" target="_blank" rel="noopener noreferrer"
                      className="flex-1 border border-gray-200 text-gray-500 text-xs py-2.5 rounded-full text-center hover:border-gray-400 transition">
                      🚗 Uber Connect
                    </a>
                  </div>
                  <div className="px-6 pb-6 flex gap-2">
                    <input type="text" placeholder="Type a message..."
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    />
                    <button type="button" onClick={sendMessage} disabled={sending || !newMessage.trim()}
                      className="bg-gray-900 text-white px-5 py-3 rounded-full text-sm font-medium hover:bg-black transition disabled:opacity-40">
                      Send
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  )
}

const MAX_RENEGOTIATIONS = 3