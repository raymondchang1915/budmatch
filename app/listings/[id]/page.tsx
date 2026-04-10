'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'

type Listing = {
  id: string
  user_email: string
  model: string
  has_component: string
  needs_component: string
  condition: string
  location: string
  asking_price: number | null
  matched: boolean
  listing_type: string
}

type Match = {
  id: string
  listing_a: string
  listing_b: string
  status: string
  score: number
  anchor_price: number
  buyer_price_a: number
  buyer_price_b: number
  seller_payout_a: number
  seller_payout_b: number
  platform_fee: number
  market_reference: number
  typical_outside_sale: number
  ladder_min: number
  ladder_max: number
  buyer_offer: number
  seller_offer: number
  agreed_price: number
  negotiation_status: string
}

type Message = {
  id: string
  sender_email: string
  content: string
  created_at: string
}

export default function ListingPage() {
  const { id } = useParams()
  const [listing, setListing] = useState<Listing | null>(null)
  const [match, setMatch] = useState<Match | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [myEmail, setMyEmail] = useState('')
  const [myRole, setMyRole] = useState<'buyer' | 'seller' | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [emailSaved, setEmailSaved] = useState(false)
  const [sending, setSending] = useState(false)
  const [negotiating, setNegotiating] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchListing()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setMyEmail(data.user.email)
        setEmailSaved(true)
      }
    })
  }, [id])

  useEffect(() => {
    if (match && myEmail) {
      const role = listing?.id === match.listing_a ? 'buyer' : 'seller'
      setMyRole(role)
    }
  }, [match, myEmail])

  useEffect(() => {
    if (match?.negotiation_status === 'agreed') {
      fetchMessages()
      const channel = supabase
        .channel(`messages-${match.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${match.id}`,
        }, payload => {
          setMessages(prev => [...prev, payload.new as Message])
        })
        .subscribe()
      return () => { supabase.removeChannel(channel) }
    }
  }, [match?.negotiation_status])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchListing = async () => {
    const { data } = await supabase
      .from('listings').select('*').eq('id', id).single()
    setListing(data)
    if (data?.matched) {
      const { data: matchData } = await supabase
        .from('matches').select('*')
        .or(`listing_a.eq.${id},listing_b.eq.${id}`)
        .single()
      setMatch(matchData)
    }
  }

  const fetchMessages = async () => {
    if (!match) return
    const { data } = await supabase
      .from('messages').select('*')
      .eq('match_id', match.id)
      .order('created_at', { ascending: true })
    setMessages(data ?? [])
  }

  const negotiate = async (direction: 'up' | 'down') => {
    if (!match || !myRole) return
    setNegotiating(true)
    const res = await fetch('/api/negotiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match_id: match.id, role: myRole, direction }),
    })
    const result = await res.json()
    // refresh match data
    const { data: updatedMatch } = await supabase
      .from('matches').select('*').eq('id', match.id).single()
    setMatch(updatedMatch)
    setNegotiating(false)
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !myEmail || !match) return
    setSending(true)
    await supabase.from('messages').insert([{
      match_id: match.id,
      sender_email: myEmail,
      content: newMessage.trim(),
    }])
    setNewMessage('')
    setSending(false)
  }

  if (!listing) return (
    <main className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
      <p className="text-gray-400">Loading...</p>
    </main>
  )

  const isBuyer = listing.id === match?.listing_a
  const myOffer = isBuyer ? match?.buyer_offer : match?.seller_offer
  const theirOffer = isBuyer ? match?.seller_offer : match?.buyer_offer
  const myPayout = isBuyer ? match?.buyer_price_a : match?.seller_payout_b
  const savings = match?.market_reference && myOffer
    ? match.market_reference - myOffer : null
  const extraEarned = match?.typical_outside_sale && myOffer
    ? myOffer - match.typical_outside_sale : null

  return (
    <main className="min-h-screen bg-[#f5f5f0] relative">
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle, #00000012 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
      }} />

      <div className="relative max-w-xl mx-auto px-6 py-16">
        <a href="/browse" className="text-sm text-gray-400 hover:text-black mb-8 inline-block">
          ← Back to listings
        </a>

        {/* Listing card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{listing.model}</h1>
              <p className="text-gray-400 text-sm mt-1">📍 {listing.location || 'Location not set'}</p>
            </div>
            {listing.asking_price && (
              <span className="bg-gray-900 text-white px-4 py-1.5 rounded-xl font-medium">
                LKR {listing.asking_price.toLocaleString()}
              </span>
            )}
          </div>
          <div className="flex gap-3 mb-4 items-center">
            <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-sm">
              <p className="text-gray-400 text-xs">Has</p>
              <p className="font-semibold text-gray-900">{listing.has_component}</p>
            </div>
            <span className="text-gray-300">→</span>
            <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-sm">
              <p className="text-gray-400 text-xs">Needs</p>
              <p className="font-semibold text-gray-900">{listing.needs_component}</p>
            </div>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            listing.condition === 'Working perfectly' ? 'bg-green-100 text-green-700' :
            listing.condition === 'Minor issues' ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-500'
          }`}>{listing.condition}</span>
        </div>

        {/* Matched state */}
        {listing.matched && match ? (
          <>
            {/* Dual perception pricing card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-1">Your deal</h2>
              <p className="text-xs text-gray-400 mb-4">
                Prices set by BudMatch based on live market data
              </p>

              {isBuyer ? (
                // BUYER VIEW — emphasize savings
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-400 mb-1">Market rate</p>
                    <p className="text-base font-bold text-gray-400 line-through">
                      LKR {match.market_reference?.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gray-900 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-300 mb-1">You pay</p>
                    <p className="text-base font-bold text-white">
                      LKR {myOffer?.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-green-600 mb-1">You save</p>
                    <p className="text-base font-bold text-green-700">
                      {savings && savings > 0 ? `LKR ${savings.toLocaleString()}` : '✓'}
                    </p>
                  </div>
                </div>
              ) : (
                // SELLER VIEW — emphasize extra earnings
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-400 mb-1">Typical sale</p>
                    <p className="text-base font-bold text-gray-400 line-through">
                      LKR {match.typical_outside_sale?.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gray-900 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-300 mb-1">You receive</p>
                    <p className="text-base font-bold text-white">
                      LKR {myOffer?.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-green-600 mb-1">Extra earned</p>
                    <p className="text-base font-bold text-green-700">
                      {extraEarned && extraEarned > 0 ? `LKR ${extraEarned.toLocaleString()}` : '✓'}
                    </p>
                  </div>
                </div>
              )}

              {/* Negotiation ladder */}
              {match.negotiation_status !== 'agreed' && (
                <div className="border border-gray-100 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-700 mb-3">
                    Adjust your offer — move ±LKR 100 per step
                  </p>

                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={() => negotiate('down')}
                      disabled={negotiating || (myOffer ?? 0) <= (match.ladder_min ?? 0)}
                      className="w-12 h-12 rounded-full border border-gray-200 text-gray-700 text-xl font-bold hover:bg-gray-50 disabled:opacity-30 transition"
                    >
                      −
                    </button>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        LKR {myOffer?.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400">Your offer</p>
                    </div>
                    <button
                      onClick={() => negotiate('up')}
                      disabled={negotiating || (myOffer ?? 0) >= (match.ladder_max ?? 0)}
                      className="w-12 h-12 rounded-full border border-gray-200 text-gray-700 text-xl font-bold hover:bg-gray-50 disabled:opacity-30 transition"
                    >
                      +
                    </button>
                  </div>

                  {/* Ladder visualization */}
                  <div className="flex items-center gap-1 mb-3">
                    {[-300, -200, -100, 0, 100, 200, 300].map(offset => {
                      const price = (match.anchor_price ?? 0) + offset
                      const isMyOffer = price === myOffer
                      const isTheirOffer = price === theirOffer
                      return (
                        <div key={offset} className="flex-1 flex flex-col items-center gap-1">
                          <div className={`w-full h-1.5 rounded-full ${
                            isMyOffer && isTheirOffer ? 'bg-green-500' :
                            isMyOffer ? 'bg-gray-900' :
                            isTheirOffer ? 'bg-blue-400' :
                            'bg-gray-100'
                          }`} />
                          <span className="text-xs text-gray-300" style={{ fontSize: 9 }}>
                            {(price / 1000).toFixed(1)}k
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex justify-between text-xs text-gray-400">
                    <span>⬛ You</span>
                    <span>🟦 Them</span>
                    <span>🟩 Overlap = deal!</span>
                  </div>

                  <p className="text-xs text-gray-400 mt-3 text-center">
                    When your offers overlap, the deal auto-completes at the midpoint.
                  </p>
                </div>
              )}

              {/* Deal agreed */}
              {match.negotiation_status === 'agreed' && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <p className="text-green-700 font-semibold mb-1">
                    🎉 Deal agreed at LKR {match.agreed_price?.toLocaleString()}
                  </p>
                  <p className="text-green-600 text-xs">
                    Use the chat below to arrange the swap details.
                  </p>
                </div>
              )}
            </div>

            {/* Chat — only unlocks after deal agreed */}
            {match.negotiation_status === 'agreed' ? (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">Swap details</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Arrange pickup or delivery here
                  </p>
                </div>

                {!emailSaved ? (
                  <div className="p-5">
                    <p className="text-sm text-gray-500 mb-3">Enter your email to join:</p>
                    <div className="flex gap-2">
                      <input type="email" placeholder="your@email.com"
                        className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                        value={myEmail} onChange={e => setMyEmail(e.target.value)} />
                      <button onClick={() => { if (myEmail) setEmailSaved(true) }}
                        className="bg-gray-900 text-white px-5 py-2 rounded-full text-sm">
                        Join
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* PickMe / Uber suggestion */}
                    <div className="mx-4 mt-4 bg-gray-50 border border-gray-100 rounded-xl p-4">
                      <p className="text-xs font-medium text-gray-700 mb-2">
                        📦 Arrange delivery
                      </p>
                      <div className="flex gap-2">
                        
                          href="https://pickme.lk"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-orange-500 text-white text-xs py-2 rounded-full text-center font-medium hover:bg-orange-600 transition"
                        >
                          PickMe Delivery
                        </a>
                        
                          href="https://uber.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-black text-white text-xs py-2 rounded-full text-center font-medium hover:bg-gray-800 transition"
                        >
                          Uber Connect
                        </a>
                      </div>
                    </div>

                    <div className="h-64 overflow-y-auto p-4 flex flex-col gap-3 bg-gray-50 mt-2">
                      {messages.length === 0 && (
                        <p className="text-center text-gray-300 text-sm mt-8">
                          Agree on pickup/delivery details here
                        </p>
                      )}
                      {messages.map(msg => (
                        <div key={msg.id}
                          className={`flex ${msg.sender_email === myEmail ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs rounded-2xl px-4 py-2.5 text-sm ${
                            msg.sender_email === myEmail
                              ? 'bg-gray-900 text-white rounded-br-sm'
                              : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                          }`}>
                            <p>{msg.content}</p>
                            <p className="text-xs mt-1 opacity-50">
                              {msg.sender_email === myEmail ? 'You' : msg.sender_email.split('@')[0]}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={bottomRef} />
                    </div>

                    <div className="px-4 py-3 border-t border-gray-100 flex gap-2 bg-white">
                      <input type="text" placeholder="Type a message..."
                        className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') sendMessage() }} />
                      <button onClick={sendMessage}
                        disabled={sending || !newMessage.trim()}
                        className="bg-gray-900 text-white px-5 py-2 rounded-full text-sm disabled:opacity-40">
                        Send
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center">
                <p className="text-gray-400 text-sm">
                  💬 Chat unlocks once you both agree on a price above.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-semibold text-gray-700 mb-1">Looking for a match</p>
            <p className="text-gray-400 text-sm">
              Chat and pricing unlock once matched.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}