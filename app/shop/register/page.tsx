'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

function generateShopCode(name: string): string {
  const clean = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 5)
  const rand = Math.floor(Math.random() * 900 + 100)
  return `${clean}${rand}`
}

export default function ShopRegister() {
  const [form, setForm] = useState({
    shop_name: '',
    owner_name: '',
    phone: '',
    email: '',
    location: '',
    is_dropoff: false,
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [shopCode, setShopCode] = useState('')
  const [error, setError] = useState('')

  const inputClass = "w-full bg-white border border-gray-200 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 shadow-sm"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5 ml-1"

  const handleSubmit = async () => {
    if (!form.shop_name || !form.phone || !form.location) {
      setError('Shop name, phone and location are required')
      return
    }

    setLoading(true)
    setError('')

    const code = generateShopCode(form.shop_name)

    const { error: insertError } = await supabase
      .from('shop_partners')
      .insert([{
        shop_name: form.shop_name,
        owner_name: form.owner_name,
        phone: form.phone,
        email: form.email,
        location: form.location,
        shop_code: code,
        commission_rate: 0.10,
        is_dropoff: form.is_dropoff,
      }])

    if (insertError) {
      setError(insertError.message)
    } else {
      setShopCode(code)
      setSuccess(true)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <main className="min-h-screen bg-[#f5f5f0] flex items-center justify-center px-4 relative">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `radial-gradient(circle, #00000012 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }} />
        <div className="relative bg-white border border-gray-200 rounded-2xl p-8 max-w-sm w-full shadow-sm text-center">
          <p className="text-4xl mb-4">🎉</p>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">You're a partner!</h2>
          <p className="text-gray-400 text-sm mb-6">
            Share this code with customers when they post a listing.
          </p>

          <div className="bg-gray-900 text-white rounded-2xl p-6 mb-6">
            <p className="text-xs text-gray-400 mb-2">Your shop code</p>
            <p className="text-4xl font-bold tracking-widest">{shopCode}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 text-left mb-6">
            <p className="text-xs font-medium text-gray-700 mb-2">Tell customers to:</p>
            <ol className="text-xs text-gray-500 flex flex-col gap-1">
              <li>1. Go to budmatch.vercel.app</li>
              <li>2. Post their listing</li>
              <li>3. Enter code <strong className="text-gray-900">{shopCode}</strong></li>
              <li>4. You earn LKR 40 per match!</li>
            </ol>
          </div>

          <a href={`/shop/${shopCode}`}
            className="w-full bg-gray-900 text-white py-3 rounded-full text-sm font-medium hover:bg-black transition block">
            View your dashboard →
          </a>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f5f5f0] relative">
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle, #00000012 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
      }} />

      <div className="relative max-w-lg mx-auto px-6 py-16">
        <a href="/shop" className="text-sm text-gray-400 hover:text-black mb-8 inline-block">
          ← Back
        </a>

        <div className="flex items-center gap-3 mb-6">
          <div className="h-px w-8 bg-gray-400" />
          <span className="text-sm text-gray-500 tracking-wide">Partner registration</span>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">
          Register your shop.
        </h1>
        <p className="text-gray-400 mb-10">Takes 2 minutes. Free to join.</p>

        <div className="flex flex-col gap-5">
          <div>
            <label className={labelClass}>Shop name *</label>
            <input type="text" placeholder="e.g. Tech Fix Maharagama" className={inputClass}
              value={form.shop_name}
              onChange={e => setForm({ ...form, shop_name: e.target.value })} />
          </div>

          <div>
            <label className={labelClass}>Owner name</label>
            <input type="text" placeholder="Your name" className={inputClass}
              value={form.owner_name}
              onChange={e => setForm({ ...form, owner_name: e.target.value })} />
          </div>

          <div>
            <label className={labelClass}>Phone number *</label>
            <input type="tel" placeholder="07X XXX XXXX" className={inputClass}
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>

          <div>
            <label className={labelClass}>Email (optional)</label>
            <input type="email" placeholder="shop@email.com" className={inputClass}
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>

          <div>
            <label className={labelClass}>Shop location *</label>
            <input type="text" placeholder="e.g. 45 High St, Maharagama" className={inputClass}
              value={form.location}
              onChange={e => setForm({ ...form, location: e.target.value })} />
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Also be a drop-off point</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Let matched users exchange at your shop
              </p>
            </div>
            <button
              onClick={() => setForm({ ...form, is_dropoff: !form.is_dropoff })}
              className={`w-12 h-6 rounded-full transition-all ${
                form.is_dropoff ? 'bg-gray-900' : 'bg-gray-200'
              }`}
            >
              <span className={`block w-5 h-5 bg-white rounded-full shadow transition-all mx-0.5 ${
                form.is_dropoff ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {error && <p className="text-red-500 text-sm ml-1">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-gray-900 text-white py-3.5 rounded-full font-medium hover:bg-black transition disabled:opacity-40 text-sm"
          >
            {loading ? 'Registering...' : 'Register shop →'}
          </button>
        </div>
      </div>
    </main>
  )
}