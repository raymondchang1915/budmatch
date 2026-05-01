'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Match = {
  id: string
  agreed_price: number
  buyer_email: string
  seller_email: string
  buyer_paid: boolean
  seller_paid: boolean
  status: string
  payment_deadline: string | null
  listing_a: string
  offer_match: boolean
}

type Listing = {
  id: string
  model: string
  has_component: string
  has_case: boolean
  condition: string
  location: string
  user_email: string
}

type Message = {
  id: string
  created_at: string
  match_id: string
  sender_email: string
  content: string
}

export default function OfferMatchPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [match, setMatch] = useState<Match | null>(null)
  const [listing, setListing] = useState<Listing | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [paying, setPaying] = useState(false)
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUser(data.user?.email ?? null))
  }, [])

  useEffect(() => { if (id) loadData() }, [id])

  useEffect(() => {
    if (!match?.payment_deadline) return
    const interval = setInterval(() => {
      const diff = new Date(match.payment_deadline!).getTime() - Date.now()
      if (diff <= 0) { setTimeLeft('Expired'); clearInterval(interval); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`)
    }, 1000)
    return () => clearInterval(interval)
  }, [match?.payment_deadline])

  useEffect(() => {
    if (!match?.id) return
    loadMessages()
    const channel = supabase
      .channel(`offer-messages:${match.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `match_id=eq.${match.id}`,
      }, (payload) => setMessages(prev => [...prev, payload.new as Message]))
      .subscribe()

    const matchChannel = supabase
      .channel(`offer-match:${match.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'matches',
        filter: `id=eq.${match.id}`,
      }, (payload) => setMatch(payload.new as Match))
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(matchChannel)
    }
  }, [match?.id])

  async function loadData() {
    const { data: matchData } = await supabase
      .from('matches').select('*').eq('id', id).single()
    if (!matchData) { setLoading(false); return }
    setMatch(matchData)

    const { data: listingData } = await supabase
      .from('listings').select('*').eq('id', matchData.listing_a).single()
    if (listingData) setListing(listingData)

    setLoading(false)
  }

  async function loadMessages() {
    if (!match?.id) return
    const { data } = await supabase.from('messages').select('*')
      .eq('match_id', match.id).order('created_at', { ascending: true })
    setMessages(data ?? [])
  }

  async function handlePayment() {
    if (!currentUser || !match) return
    setPaying(true)

    const role = currentUser === match.buyer_email ? 'buyer' : 'seller'

    const res = await fetch('/api/payhere', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match_id: match.id, payer_email: currentUser, role }),
    })

    const data = await res.json()
    if (data.error) {
      alert(data.error)
      setPaying(false)
      return
    }

    const form = document.createElement('form')
    form.method = 'POST'
    form.action = data.checkout_url
    form.style.display = 'none'

    for (const [key, value] of Object.entries(data.params)) {
      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = key
      input.value = String(value)
      form.appendChild(input)
    }

    document.body.appendChild(form)
    form.submit()
  }

  async function sendMessage() {
    if (!newMessage.trim() || !match?.id || !currentUser) return
    setSending(true)
    await supabase.from('messages').insert([{
      match_id: match.id, sender_email: currentUser, content: newMessage.trim(),
    }])
    const otherEmail = currentUser === match.buyer_email ? match.seller_email : match.buyer_email
    if (otherEmail) {
      await supabase.from('notifications').insert([{
        user_email: otherEmail, type: 'new_message',
        message: `New message from ${currentUser.split('@')[0]}: "${newMessage.trim().slice(0, 60)}${newMessage.trim().length > 60 ? '...' : ''}"`,
        listing_id: match.listing_a, match_id: match.id, read: false,
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

  if (!match || !currentUser) return (
    <main className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
      <p className="text-gray-500">Match not found.</p>
    </main>
  )

  const isBuyer = currentUser === match.buyer_email
  const bothPaid = match.status === 'paid'
  const userHasPaid = isBuyer ? match.buyer_paid : match.seller_paid
  const agreedPrice = match.agreed_price
  const myFee = Math.max(100, Math.round(agreedPrice * 0.05))

  return (
    <main className="min-h-screen bg-[#f5f5f0] relative">
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle, #00000012 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
      }} />

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-16 space-y-5">

        <button type="button" onClick={() => router.back()}
          className="text-sm text-gray-400 hover:text-gray-700 transition flex items-center gap-1.5">
          ← Back
        </button>

        {/* Listing card */}
        {listing && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{listing.model}</h1>
            <p className="text-gray-400 text-sm mt-0.5">{listing.location}</p>
            <div className="grid grid-cols-2 gap-3 text-sm mt-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-400 text-xs mb-1">Component</p>
                <p className="text-gray-900 font-medium">{listing.has_component}{listing.has_case ? ' + Case' : ''}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-400 text-xs mb-1">Condition</p>
                <p className="text-gray-900 font-medium">{listing.condition}</p>
              </div>
            </div>
          </div>
        )}

        {/* Status banner */}
        <div className={`rounded-2xl px-6 py-4 flex items-center gap-3 text-sm font-medium border ${
          bothPaid ? 'bg-green-50 border-green-200 text-green-700'
          : 'bg-blue-50 border-blue-200 text-blue-700'
        }`}>
          <span className="text-xl">{bothPaid ? '🤝' : '💳'}</span>
          <p>
            {bothPaid
              ? `Deal confirmed at LKR ${agreedPrice.toLocaleString()} — chat is open`
              : `Offer accepted at LKR ${agreedPrice.toLocaleString()} — pay to unlock chat`}
          </p>
        </div>

        {/* Match summary */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">Deal summary</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className={`rounded-xl p-4 ${isBuyer ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
              <p className={`text-xs mb-1 ${isBuyer ? 'text-gray-400' : 'text-gray-400'}`}>
                {isBuyer ? 'You (buyer)' : `${match.buyer_email.split('@')[0]} (buyer)`}
              </p>
              <p className="font-medium">Buying the bud</p>
            </div>
            <div className={`rounded-xl p-4 ${!isBuyer ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
              <p className={`text-xs mb-1 ${!isBuyer ? 'text-gray-400' : 'text-gray-400'}`}>
                {!isBuyer ? 'You (seller)' : `${match.seller_email.split('@')[0]} (seller)`}
              </p>
              <p className="font-medium">Selling the bud</p>
            </div>
          </div>
        </div>

        {/* Payment card */}
        {!bothPaid && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Confirm the deal</h2>
                  <p className="text-sm text-gray-400 mt-0.5">Both sides pay 5% to unlock chat.</p>
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
                  <span className="text-gray-500">Your fee (5%)</span>
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

              {!userHasPaid && (
                <button type="button" onClick={handlePayment} disabled={paying}
                  className="w-full bg-gray-900 text-white py-3.5 rounded-full text-sm font-medium hover:bg-black transition disabled:opacity-40">
                  {paying ? 'Processing...' : `Pay LKR ${myFee.toLocaleString()} to confirm →`}
                </button>
              )}

              {userHasPaid && !bothPaid && (
                <p className="text-sm text-center text-gray-400">
                  You're confirmed. The other side has 24 hours to pay or the deal is cancelled.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Chat */}
        {(currentUser === match.buyer_email || currentUser === match.seller_email) && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 pt-6 pb-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Chat</h2>
            {!bothPaid && (
              <p className="text-sm text-gray-400 mt-0.5">Unlocks after both sides pay</p>
            )}
          </div>

          {!bothPaid ? (
            <div className="px-7 py-12 text-center text-gray-400 text-sm">
              <div className="text-3xl mb-3">🔒</div>
              <p>Complete payment above to unlock chat.</p>
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
                            {!isMe && <p className="text-xs text-gray-500 mb-1">{msg.sender_email.split('@')[0]}</p>}
                            {msg.content}
                          </div>
                        </div>
                      )
                    })
                }
              </div>
              <div className="px-6 pb-3 flex gap-2">
                <a href="https://pickme.lk" target="_blank" rel="noopener noreferrer"
                  className="flex-1 border border-gray-200 text-gray-700 text-xs py-2.5 rounded-full text-center hover:border-gray-400 transition">
                  📦 PickMe
                </a>
                <a href="https://www.uber.com/lk/en/ride/uber-connect/" target="_blank" rel="noopener noreferrer"
                  className="flex-1 border border-gray-200 text-gray-700 text-xs py-2.5 rounded-full text-center hover:border-gray-400 transition">
                  🚗 Uber Connect
                </a>
              </div>
              <div className="px-6 pb-6 flex gap-2">
                <input type="text" placeholder="Type a message..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-5 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
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
        )}
      </div>
    </main>
  )
}
