'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const EARBUD_MODELS = [
  'Samsung Galaxy Buds2',
  'Samsung Galaxy Buds2 Pro',
  'Samsung Galaxy Buds FE',
  'Apple AirPods Pro 2',
  'Apple AirPods 3',
  'Sony WF-1000XM5',
  'Other',
]

const COMPONENTS = ['Left bud', 'Right bud', 'Case', 'Left + Right', 'Left + Case', 'Right + Case']
const CONDITIONS = ['Working perfectly', 'Minor issues', 'Unknown']

// components that can't be on both sides
const OPPOSITE_MAP: Record<string, string[]> = {
  'Left bud': ['Left bud', 'Left + Right', 'Left + Case'],
  'Right bud': ['Right bud', 'Left + Right', 'Right + Case'],
  'Case': ['Case', 'Left + Case', 'Right + Case'],
  'Left + Right': ['Left bud', 'Right bud', 'Left + Right', 'Left + Case', 'Right + Case'],
  'Left + Case': ['Left bud', 'Case', 'Left + Right', 'Left + Case', 'Right + Case'],
  'Right + Case': ['Right bud', 'Case', 'Left + Right', 'Left + Case', 'Right + Case'],
}

const DEFAULT_MARKET_PRICES: Record<string, number> = {
  'Samsung Galaxy Buds2': 25000,
  'Samsung Galaxy Buds2 Pro': 35000,
  'Samsung Galaxy Buds FE': 20000,
  'Apple AirPods Pro 2': 80000,
  'Apple AirPods 3': 55000,
  'Sony WF-1000XM5': 60000,
  'Other': 15000,
}

async function getMarketPrice(model: string): Promise<number> {
  const { data } = await supabase
    .from('model_prices')
    .select('market_price')
    .eq('model', model)
    .single()
  // fall back to hardcoded default if no community price yet
  return data?.market_price ?? DEFAULT_MARKET_PRICES[model] ?? 15000
}

async function updateMarketPrice(model: string, userPrice: number) {
  const { data } = await supabase
    .from('model_prices')
    .select('*')
    .eq('model', model)
    .single()

  if (data) {
    const newAvg = (data.market_price * data.submission_count + userPrice) / (data.submission_count + 1)
    await supabase
      .from('model_prices')
      .update({
        market_price: newAvg,
        submission_count: data.submission_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('model', model)
  } else {
    await supabase
      .from('model_prices')
      .insert([{ model, market_price: userPrice, submission_count: 1 }])
  }
}

async function getDynamicPriceBounds(model: string, component: string, marketPrice: number) {
  const { data } = await supabase
    .from('demand_stats')
    .select('*')
    .eq('model', model)
    .eq('component', component)
    .single()

  const needCount = data?.need_count ?? 0
  const haveCount = data?.have_count ?? 0
  const total = needCount + haveCount

  const demandRatio = total === 0 ? 0.5 : needCount / total
  const minPct = 0.10
  const maxPct = 0.50
  const dynamicPct = minPct + (maxPct - minPct) * demandRatio

  return {
    suggestedPrice: Math.round(marketPrice * dynamicPct),
    maxPrice: Math.round(marketPrice * maxPct),
    minPrice: Math.round(marketPrice * minPct),
    demandRatio,
  }
}

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
  })

  const [marketPrice, setMarketPrice] = useState<number | null>(null)
  const [priceBounds, setPriceBounds] = useState<{
    suggestedPrice: number
    maxPrice: number
    minPrice: number
    demandRatio: number
  } | null>(null)
  const [priceError, setPriceError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleModelChange = async (model: string) => {
    setForm({ ...form, model, has_component: '', needs_component: '', asking_price: '' })
    setPriceBounds(null)
    setPriceError('')
    const mp = await getMarketPrice(model)
    setMarketPrice(mp)
  }

  const handleComponentChange = async (component: string) => {
    setForm(prev => ({ ...prev, has_component: component, needs_component: '' }))
    const mp = marketPrice ?? await getMarketPrice(form.model)
    const bounds = await getDynamicPriceBounds(form.model, component, mp)
    setPriceBounds(bounds)
  }

  const handlePriceChange = (val: string) => {
    setForm({ ...form, asking_price: val })
    setPriceError('')
    if (!priceBounds || !val) return
    const price = parseFloat(val)
    if (price > priceBounds.maxPrice) {
      setPriceError(`Too high — max is LKR ${priceBounds.maxPrice.toLocaleString()} (50% of market price)`)
    } else if (price < priceBounds.minPrice) {
      setPriceError(`Too low — min is LKR ${priceBounds.minPrice.toLocaleString()}`)
    }
  }

  const availableNeeds = form.has_component
    ? COMPONENTS.filter(c => !OPPOSITE_MAP[form.has_component]?.includes(c))
    : COMPONENTS

  const handleSubmit = async () => {
    if (priceError) return
    setLoading(true)
    setError('')

    const askingPrice = parseFloat(form.asking_price)

    if (form.model && askingPrice) {
      await updateMarketPrice(form.model, askingPrice)
    }

    await supabase.from('demand_stats').upsert([{
      model: form.model,
      component: form.has_component,
      have_count: 1,
    }], { onConflict: 'model,component' })

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
      }])
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    // auto-match
    const { data: potentialMatches } = await supabase
      .from('listings')
      .select('*')
      .eq('model', form.model)
      .eq('has_component', form.needs_component)
      .eq('needs_component', form.has_component)
      .eq('matched', false)
      .neq('user_email', form.user_email)

    if (potentialMatches && potentialMatches.length > 0) {
      const bestMatch = potentialMatches[0]
      await supabase.from('matches').insert([{
        listing_a: listing.id,
        listing_b: bestMatch.id,
        status: 'pending',
      }])
      await supabase.from('listings').update({ matched: true }).eq('id', listing.id)
      await supabase.from('listings').update({ matched: true }).eq('id', bestMatch.id)
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-green-800 mb-2">Listing posted!</h2>
          <p className="text-green-600 mb-4">We'll notify you when we find a match.</p>
          <a href="/browse" className="text-black underline">Browse listings</a>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center p-8">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-2">Post a listing</h1>
        <p className="text-gray-500 mb-8">Tell us what you have and what you need.</p>

        <div className="flex flex-col gap-4">

          <div>
            <label className="block text-sm font-medium mb-1">Listing type</label>
            <div className="flex gap-2">
              {['buying', 'selling', 'both'].map(t => (
                <button
                  key={t}
                  onClick={() => setForm({ ...form, listing_type: t })}
                  className={`flex-1 py-2 rounded-lg border text-sm capitalize transition ${
                    form.listing_type === t
                      ? 'bg-black text-white border-black'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Your email</label>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              value={form.user_email}
              onChange={e => setForm({ ...form, user_email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Earbud model</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              value={form.model}
              onChange={e => handleModelChange(e.target.value)}
            >
              <option value="">Select a model</option>
              {EARBUD_MODELS.map(m => <option key={m}>{m}</option>)}
            </select>
            {marketPrice && (
              <p className="text-xs text-gray-400 mt-1">
                Market price: LKR {marketPrice.toLocaleString()}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">I have</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              value={form.has_component}
              onChange={e => handleComponentChange(e.target.value)}
              disabled={!form.model}
            >
              <option value="">What do you have?</option>
              {COMPONENTS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">I need</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              value={form.needs_component}
              onChange={e => setForm({ ...form, needs_component: e.target.value })}
              disabled={!form.has_component}
            >
              <option value="">What do you need?</option>
              {availableNeeds.map(c => <option key={c}>{c}</option>)}
            </select>
            {form.has_component && (
              <p className="text-xs text-gray-400 mt-1">
                Showing only components compatible with what you have
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Condition</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              value={form.condition}
              onChange={e => setForm({ ...form, condition: e.target.value })}
            >
              <option value="">Select condition</option>
              {CONDITIONS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Asking price (LKR)
              {priceBounds && (
                <span className="text-gray-400 font-normal ml-2 text-xs">
                  LKR {priceBounds.minPrice.toLocaleString()} – {priceBounds.maxPrice.toLocaleString()} allowed
                </span>
              )}
            </label>
            <input
              type="number"
              placeholder={
                !form.model
                  ? 'Select a model first'
                  : !form.has_component
                  ? 'Select what you have first'
                  : priceBounds
                  ? `Suggested: LKR ${priceBounds.suggestedPrice.toLocaleString()}`
                  : 'Loading price...'
              }
              className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black ${
                priceError ? 'border-red-400' : 'border-gray-200'
              }`}
              value={form.asking_price}
              onChange={e => handlePriceChange(e.target.value)}
              disabled={!priceBounds}
            />
            {priceError && <p className="text-red-500 text-xs mt-1">{priceError}</p>}
            {priceBounds && !priceError && (
              <p className="text-xs text-gray-400 mt-1">
                {Math.round(priceBounds.demandRatio * 100)}% demand ratio for this component right now
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Location (optional)</label>
            <input
              type="text"
              placeholder="e.g. Colombo, Sri Lanka"
              className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              value={form.location}
              onChange={e => setForm({ ...form, location: e.target.value })}
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading || !!priceError || !form.model || !form.has_component || !form.needs_component || !form.user_email}
            className="bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
          >
            {loading ? 'Posting...' : 'Post listing'}
          </button>

        </div>
      </div>
    </main>
  )
}