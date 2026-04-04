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
  const [newMessage, setNewMessage] = useState('')
  const [emailSaved, setEmailSaved] = useState(false)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchListing()
  }, [id])

  useEffect(() => {
    if (match) {
      fetchMessages()
      // realtime subscription
      const channel = supabase
        .channel('messages')
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
  }, [match])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchListing = async () => {
    const { data } = await supabase.from('listings').select('*').eq('id', id).single()
    setListing(data)
    if (data?.matched) {
      const { data: matchData } = await supabase
        .from('matches')
        .select('*')
        .or(`listing_a.eq.${id},listing_b.eq.${id}`)
        .single()
      setMatch(matchData)
    }
  }

  const fetchMessages = async () => {
    if (!match) return
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', match.id)
      .order('created_at', { ascending: true })
    setMessages(data ?? [])
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
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">Loading...</p>
    </main>
  )

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto">

        {/* Back */}
        <a href="/browse" className="text-sm text-gray-400 hover:text-black mb-6 inline-block">← Back to listings</a>

        {/* Listing card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{listing.model}</h1>
              <p className="text-gray-400 text-sm mt-1">📍 {listing.location || 'Location not set'}</p>
            </div>
            {listing.asking_price && (
              <span className="bg-black text-white px-4 py-1.5 rounded-xl font-medium">
                LKR {listing.asking_price.toLocaleString()}
              </span>
            )}
          </div>

          <div className="flex gap-3 mb-4">
            <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm">
              <p className="text-gray-400 text-xs">Has</p>
              <p className="font-semibold text-gray-900">{listing.has_component}</p>
            </div>
            <div className="flex items-center text-gray-300">→</div>
            <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm">
              <p className="text-gray-400 text-xs">Needs</p>
              <p className="font-semibold text-gray-900">{listing.needs_component}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              listing.condition === 'Working perfectly' ? 'bg-green-100 text-green-700' :
              listing.condition === 'Minor issues' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-500'
            }`}>{listing.condition}</span>
            <span className="text-gray-300">•</span>
            <span className="capitalize">{listing.listing_type}</span>
          </div>
        </div>

        {/* Chat section */}
        {listing.matched && match ? (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Chat</h2>
              <p className="text-xs text-gray-400 mt-0.5">You've been matched! Negotiate a deal here.</p>
            </div>

            {/* Email gate */}
            {!emailSaved ? (
              <div className="p-5">
                <p className="text-sm text-gray-500 mb-3">Enter your email to join the chat:</p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    value={myEmail}
                    onChange={e => setMyEmail(e.target.value)}
                  />
                  <button
                    onClick={() => { if (myEmail) setEmailSaved(true) }}
                    className="bg-black text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Join
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Messages */}
                <div className="h-72 overflow-y-auto p-5 flex flex-col gap-3">
                  {messages.length === 0 && (
                    <p className="text-center text-gray-300 text-sm mt-8">No messages yet. Say hi!</p>
                  )}
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_email === myEmail ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${
                        msg.sender_email === myEmail
                          ? 'bg-black text-white rounded-br-sm'
                          : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                      }`}>
                        <p>{msg.content}</p>
                        <p className={`text-xs mt-1 ${msg.sender_email === myEmail ? 'text-gray-400' : 'text-gray-400'}`}>
                          {msg.sender_email === myEmail ? 'You' : msg.sender_email.split('@')[0]}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') sendMessage() }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !newMessage.trim()}
                    className="bg-black text-white px-4 py-2 rounded-xl text-sm disabled:opacity-40 transition"
                  >
                    Send
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-medium text-gray-700 mb-1">Looking for a match</p>
            <p className="text-gray-400 text-sm">Chat will unlock once this listing is matched with another user.</p>
          </div>
        )}

      </div>
    </main>
  )
}