'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const EARBUD_MODELS = ['Apple AirPods Pro 2','Apple AirPods Pro 1','Apple AirPods 3','Apple AirPods 2','Other']
const CONDITIONS = ['Working perfectly','Minor issues','Unknown']

export default function NewListing() {
  const [form, setForm] = useState({
    user_email: '',
    model: '',
    has_component: '',
    needs_component: '',
    condition: '',
    location: '',
    listing_type: 'both',
    asking_price: '',
    shop_code: '', // ✅ ADDED
  })

  const router = useRouter()

  // ✅ AUTH GUARD
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/auth?redirect=/listings/new')
      } else {
        setForm(prev => ({
          ...prev,
          user_email: data.user.email ?? '',
        }))
      }
    })
  }, [router])

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const inputClass = "w-full bg-white border border-gray-200 rounded-full px-5 py-3 text-sm"
  const selectClass = "w-full bg-white border border-gray-200 rounded-full px-5 py-3 text-sm"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5 ml-1"

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    const askingPrice = parseFloat(form.asking_price)

    const { data: listing, error: insertError } = await supabase
      .from('listings')
      .insert([{
        user_email: form.user_email,
        model: form.model,
        has_component: form.has_component,
        needs_component: form.needs_component,
        condition: form.condition,
        location: form.location,
        listing_type: form.listing_type,
        asking_price: askingPrice || null,
        shop_code: form.shop_code || null, // ✅ ADDED
      }])
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <h2 className="text-2xl font-bold">🎉 Listing posted!</h2>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f5f5f0]">
      <div className="max-w-lg mx-auto px-6 py-16">

        <h1 className="text-4xl font-bold mb-6">Add a listing</h1>

        <div className="flex flex-col gap-5">

          {/* Email display */}
          <div className="bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm text-gray-500">
            📧 Posting as <strong className="text-gray-900">{form.user_email}</strong>
          </div>

          {/* Model */}
          <div>
            <label className={labelClass}>Earbud model</label>
            <select
              className={selectClass}
              value={form.model}
              onChange={e => setForm({ ...form, model: e.target.value })}
            >
              <option value="">Select model</option>
              {EARBUD_MODELS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>

          {/* Condition */}
          <div>
            <label className={labelClass}>Condition</label>
            <select
              className={selectClass}
              value={form.condition}
              onChange={e => setForm({ ...form, condition: e.target.value })}
            >
              <option value="">Select condition</option>
              {CONDITIONS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Location */}
          <div>
            <label className={labelClass}>Location</label>
            <input
              className={inputClass}
              value={form.location}
              onChange={e => setForm({ ...form, location: e.target.value })}
            />
          </div>

          {/* ✅ NEW SHOP CODE FIELD */}
          <div>
            <label className={labelClass}>Shop code (optional)</label>
            <input
              type="text"
              placeholder="Enter code if referred by a shop"
              className={inputClass}
              value={form.shop_code}
              onChange={e =>
                setForm({ ...form, shop_code: e.target.value.toUpperCase() })
              }
            />
            <p className="text-xs text-gray-400 mt-1.5 ml-1">
              Got a code from a partner shop? Enter it here.
            </p>
          </div>

          {error && <p className="text-red-500">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-black text-white py-3 rounded-full"
          >
            {loading ? 'Posting...' : 'Post listing'}
          </button>

        </div>
      </div>
    </main>
  )
}