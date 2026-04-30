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
  const [otpSending, setOtpSending] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpInput, setOtpInput] = useState('')
  const [otpVerified, setOtpVerified] = useState(false)
  const [otpError, setOtpError] = useState('')

  const inputClass = "w-full bg-white border border-gray-200 rounded-full px-5 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 shadow-sm"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5 ml-1"

  const captureGPS = () => {
    if (!navigator.geolocation) { setGpsStatus('error'); return }
    setGpsStatus('loading')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setCoords({ lat, lng })
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
          const data = await res.json()
          const city = data.address?.city || data.address?.town || data.address?.suburb || ''
          const country = data.address?.country || ''
          setLocationLabel(`${city}, ${country}`.trim().replace(/^,\s*/, ''))
        } catch { setLocationLabel('Location captured') }
        setGpsStatus('done')
      },
      (err) => { console.error('GPS error:', err); setGpsStatus('error') },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const sendOtp = async () => {
    if (!form.email) return
    setOtpSending(true)
    setOtpError('')
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setOtpError('Failed to send code. Please check your email address.')
        setOtpSending(false)
        return
      }
      setOtpCode(data.code)
      setOtpSent(true)
    } catch {
      setOtpError('Failed to send code. Please try again.')
    }
    setOtpSending(false)
  }

  const verifyOtp = () => {
    if (otpInput.trim() === otpCode) {
      setOtpVerified(true)
      setOtpError('')
    } else {
      setOtpError('Incorrect code. Please try again.')
    }
  }

  const handleSubmit = async () => {
    if (!otpVerified) { setError('Please verify your email first.'); return }
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
        <p className="text-gray-400 mb-10">Earn 50% of the platform fee on every match you refer.</p>

        <div className="flex flex-col gap-5">

          <div>
            <label className={labelClass}>Shop name <span className="text-red-400">*</span></label>
            <input type="text" placeholder="e.g. Tech Hub Colombo" className={inputClass} required
              value={form.shop_name} onChange={e => setForm({ ...form, shop_name: e.target.value })} />
          </div>

          <div>
            <label className={labelClass}>Owner name <span className="text-red-400">*</span></label>
            <input type="text" placeholder="Your full name" className={inputClass} required
              value={form.owner_name} onChange={e => setForm({ ...form, owner_name: e.target.value })} />
          </div>

          <div>
            <label className={labelClass}>Phone <span className="text-red-400">*</span></label>
            <input type="tel" placeholder="+94 77 000 0000" className={inputClass} required
              value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>

          <div>
            <label className={labelClass}>Email <span className="text-red-400">*</span></label>
            <div className="flex gap-2 items-start">
              <input type="email" placeholder="shop@example.com"
                className={`${inputClass} flex-1`} required
                value={form.email}
                onChange={e => { setForm({ ...form, email: e.target.value }); setOtpSent(false); setOtpVerified(false); setOtpInput('') }}
                disabled={otpVerified} />
              {!otpVerified ? (
                <button type="button" onClick={sendOtp}
                  disabled={!form.email || otpSending}
                  className="shrink-0 bg-gray-900 text-white px-4 py-3 rounded-full text-sm font-medium hover:bg-black transition disabled:opacity-40">
                  {otpSending ? '…' : otpSent ? 'Resend' : 'Verify'}
                </button>
              ) : (
                <span className="shrink-0 flex items-center text-sm text-green-700 font-medium px-3 py-3">✓ Verified</span>
              )}
            </div>
            {otpSent && !otpVerified && (
              <div className="mt-2 space-y-2">
                <p className="text-xs text-gray-500 ml-1">Enter the 6-digit code sent to <strong className="text-gray-700">{form.email}</strong></p>
                <div className="flex gap-2">
                  <input type="text" placeholder="000000" maxLength={6}
                    className={`${inputClass} flex-1 tracking-widest text-center font-mono`}
                    value={otpInput}
                    onChange={e => setOtpInput(e.target.value.replace(/\D/g, ''))} />
                  <button type="button" onClick={verifyOtp}
                    disabled={otpInput.length !== 6}
                    className="shrink-0 bg-gray-900 text-white px-4 py-3 rounded-full text-sm font-medium hover:bg-black transition disabled:opacity-40">
                    Confirm
                  </button>
                </div>
                {otpError && <p className="text-xs text-red-500 ml-1">{otpError}</p>}
              </div>
            )}
          </div>

          {/* GPS location */}
          <div>
            <label className={labelClass}>Shop location <span className="text-red-400">*</span></label>
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
              <p className="text-xs text-gray-500">
                We pin your shop using GPS so customers know where you are and so we can verify you're real.
              </p>
              {gpsStatus === 'idle' && (
                <button type="button" onClick={captureGPS}
                  className="w-full border border-gray-200 text-gray-700 py-3 rounded-full text-sm font-medium hover:border-gray-900 transition flex items-center justify-center gap-2">
                  📍 Capture my location
                </button>
              )}
              {gpsStatus === 'loading' && (
                <div className="text-center text-sm text-gray-400 py-2 animate-pulse">Getting your location...</div>
              )}
              {gpsStatus === 'done' && coords && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
                    <span>✓</span>
                    <span className="font-medium">{locationLabel || 'Location captured'}</span>
                  </div>
                  <p className="text-xs text-gray-400 ml-1">{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</p>
                  <button type="button" onClick={captureGPS} className="text-xs text-gray-400 hover:text-gray-700 transition ml-1">
                    Recapture
                  </button>
                </div>
              )}
              {gpsStatus === 'error' && (
                <div className="space-y-2">
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                    Location access denied. Please allow location access and try again.
                  </p>
                  <button type="button" onClick={captureGPS}
                    className="w-full border border-gray-200 text-gray-700 py-3 rounded-full text-sm hover:border-gray-900 transition">
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
              <button type="button"
                onClick={() => setForm({ ...form, is_dropoff: !form.is_dropoff })}
                className={`relative w-12 h-6 rounded-full transition-colors ${form.is_dropoff ? 'bg-gray-900' : 'bg-gray-200'}`}>
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${form.is_dropoff ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          {/* Commission info — no flat prices */}
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 text-sm">
            <p className="font-medium text-gray-900 mb-3">How your commission works</p>
            <div className="space-y-2 text-gray-500">
              <div className="flex justify-between">
                <span>Platform fee</span>
                <span className="text-gray-700 font-medium">10% of agreed price</span>
              </div>
              <div className="flex justify-between">
                <span>Your share</span>
                <span className="text-gray-700 font-medium">50% of platform fee</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span>Your effective cut</span>
                <span className="text-gray-900 font-semibold">5% of agreed price</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Paid out after each confirmed match. Higher matches = more earnings.
            </p>
          </div>

          {error && <p className="text-red-500 text-sm ml-1">{error}</p>}

          <button type="button" onClick={handleSubmit}
            disabled={loading || !form.shop_name || !form.owner_name || !form.phone || !form.email || !otpVerified || !form.registration_number || gpsStatus !== 'done'}
            className="bg-gray-900 text-white py-3.5 rounded-full font-medium hover:bg-black transition disabled:opacity-40 text-sm">
            {loading ? 'Submitting...' : 'Apply now →'}
          </button>

        </div>
      </div>
    </main>
  )
}