'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

function generateShopCode(name: string): string {
  const clean = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4)
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `${clean}${rand}`
}

export default function ShopRegister() {
  const [form, setForm] = useState({
    shop_name: '',
    owner_name: '',
    phone: '',
    email: '',
    registration_number: '',
    is_dropoff: false,
  })
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [locationLabel, setLocationLabel] = useState('')
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<string | null>(null)

  const inputClass = "w-full bg-white border border-gray-200 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 shadow-sm"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5 ml-1"

  const captureGPS = () => {
    if (!navigator.geolocation) {
      setGpsStatus('error')
      return
    }
    setGpsStatus('loading')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setCoords({ lat, lng })
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          )
          const data = await res.json()
          const city = data.address?.city || data.address?.town || data.address?.suburb || ''
          const country = data.address?.country || ''
          setLocationLabel(`${city}, ${country}`.trim().replace(/^,\s*/, ''))
        } catch {
          setLocationLabel('Location captured')
        }
        setGpsStatus('done')
      },
      (err) => {
        console.error('GPS error:', err)
        setGpsStatus('error')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleSubmit = async () => {
    if (!coords) { setError('Please capture your shop GPS location first.'); return }
    setLoading(true)
    setError('')

    const shop_code = generateShopCode(form.shop_name)

    const { error: insertError } = await supabase.from('shop_partners').insert([{
      ...form,
      location: locationLabel,
      latitude: coords.lat,
      longitude: coords.lng,
      shop_code,
      active: false,
    }])

    if (insertError) { setError(insertError.message); setLoading(false); return }
    setSuccess(shop_code)
    setLoading(false)
  }

  if (success) {
    return (
      <main className="min-h-screen bg-[#f5f5f0] flex items-center justify-center px-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center max-w-md shadow-sm">
          <p className="text-4xl mb-4">🎉</p>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application submitted!</h2>
          <p className="text-gray-500 mb-2 text-sm">Your shop code is</p>
          <div className="bg-gray-900 text-white text-2xl font-mono font-bold px-8 py-4 rounded-2xl mb-5 tracking-widest">
            {success}
          </div>
          <p className="text-gray-400 text-sm mb-6">
            We'll verify your business registration and GPS location within 1–2 business days.
          </p>
          <a href="/shop" className="bg-gray-900 text-white px-6 py-2.5 rounded-full text-sm hover:bg-black transition inline-block">
            Back to shop page
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
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px w-8 bg-gray-400" />
          <span className="text-sm text-gray-500 tracking-wide">Shop partners</span>
        </div>
        <h1 className="text-5xl font-bold text-gray-900 tracking-tight mb-2">Register your shop.</h1>
        <p className="text-gray-400 mb-10">Earn 10% commission on every match you refer.</p>

        <div className="flex flex-col gap-5">

          <div>
            <label className={labelClass}>Shop name</label>
            <input type="text" placeholder="e.g. Tech Hub Colombo" className={inputClass}
              value={form.shop_name} onChange={e => setForm({ ...form, shop_name: e.target.value })} />
          </div>

          <div>
            <label className={labelClass}>Owner name</label>
            <input type="text" placeholder="Your full name" className={inputClass}
              value={form.owner_name} onChange={e => setForm({ ...form, owner_name: e.target.value })} />
          </div>

          <div>
            <label className={labelClass}>Phone</label>
            <input type="tel" placeholder="+94 77 000 0000" className={inputClass}
              value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <input type="email" placeholder="shop@example.com" className={inputClass}
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>

          {/* GPS location */}
          <div>
            <label className={labelClass}>Shop location <span className="text-red-400">*</span></label>
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
              <p className="text-xs text-gray-500">
                We pin your shop using GPS so customers know where you are and so we can verify you're real. Location access is required.
              </p>

              {gpsStatus === 'idle' && (
                <button
                  type="button"
                  onClick={captureGPS}
                  className="w-full border border-gray-200 text-gray-700 py-3 rounded-full text-sm font-medium hover:border-gray-900 transition flex items-center justify-center gap-2"
                >
                  📍 Capture my location
                </button>
              )}

              {gpsStatus === 'loading' && (
                <div className="text-center text-sm text-gray-400 py-2 animate-pulse">
                  Getting your location...
                </div>
              )}

              {gpsStatus === 'done' && coords && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
                    <span>✓</span>
                    <span className="font-medium">{locationLabel || 'Location captured'}</span>
                  </div>
                  <p className="text-xs text-gray-400 ml-1">
                    {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                  </p>
                  <button
                    type="button"
                    onClick={captureGPS}
                    className="text-xs text-gray-400 hover:text-gray-700 transition ml-1"
                  >
                    Recapture
                  </button>
                </div>
              )}

              {gpsStatus === 'error' && (
                <div className="space-y-2">
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                    Location access denied. Please allow location access in your browser and try again.
                  </p>
                  <button
                    type="button"
                    onClick={captureGPS}
                    className="w-full border border-gray-200 text-gray-700 py-3 rounded-full text-sm hover:border-gray-900 transition"
                  >
                    Try again
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className={labelClass}>Business registration number <span className="text-red-400">*</span></label>
            <input type="text" placeholder="e.g. PV/00123456" className={inputClass}
              value={form.registration_number}
              onChange={e => setForm({ ...form, registration_number: e.target.value })} />
            <p className="text-xs text-gray-400 mt-1.5 ml-1">
              Your account won't go live until our team verifies this.
            </p>
          </div>

          {/* Drop-off toggle */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Drop-off location</p>
                <p className="text-xs text-gray-400 mt-0.5">Can customers drop buds off at your shop?</p>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, is_dropoff: !form.is_dropoff })}
                className={`relative w-12 h-6 rounded-full transition-colors ${form.is_dropoff ? 'bg-gray-900' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${form.is_dropoff ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 text-sm">
            <p className="font-medium text-gray-900 mb-2">How commissions work</p>
            <ul className="space-y-1.5 text-gray-500">
              <li>• Platform fee: LKR 400 per match</li>
              <li>• Your commission: 10% = LKR 40 per match</li>
              <li>• Paid out after each confirmed match</li>
            </ul>
          </div>

          {error && <p className="text-red-500 text-sm ml-1">{error}</p>}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              loading ||
              !form.shop_name ||
              !form.owner_name ||
              !form.phone ||
              !form.email ||
              !form.registration_number ||
              gpsStatus !== 'done'
            }
            className="bg-gray-900 text-white py-3.5 rounded-full font-medium hover:bg-black transition disabled:opacity-40 text-sm"
          >
            {loading ? 'Submitting...' : 'Apply now →'}
          </button>

        </div>
      </div>
    </main>
  )
}