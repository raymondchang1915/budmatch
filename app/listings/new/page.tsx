'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const EARBUD_MODELS = [
  'Apple AirPods Pro 2',
  'Apple AirPods Pro 1',
  'Apple AirPods 3',
  'Apple AirPods 2',
  'Samsung Galaxy Buds2 Pro',
  'Samsung Galaxy Buds2',
  'Samsung Galaxy Buds FE',
  'Samsung Galaxy Buds Live',
  'Samsung Galaxy Buds Plus',
  'Sony WF-1000XM5',
  'Sony WF-1000XM4',
  'Sony WF-C700N',
  'Sony WF-C500',
  'JBL Tour Pro 2',
  'JBL Live Pro 2',
  'JBL Tune Flex',
  'JBL Tune 230NC',
  'JBL Wave Flex',
  'Realme Buds Air 5 Pro',
  'Realme Buds Air 5',
  'Realme Buds Air 3',
  'Realme Buds T300',
  'Realme Buds T100',
  'OnePlus Buds Pro 2',
  'OnePlus Buds Pro',
  'OnePlus Buds Z2',
  'Xiaomi Redmi Buds 5 Pro',
  'Xiaomi Redmi Buds 5',
  'Xiaomi Redmi Buds 4 Pro',
  'Xiaomi Buds 4',
  'Oppo Enco X2',
  'Oppo Enco Air 3 Pro',
  'Oppo Enco Air 3',
  'Oppo Enco Buds 2',
  'Huawei FreeBuds Pro 3',
  'Huawei FreeBuds Pro 2',
  'Huawei FreeBuds 5i',
  'Huawei FreeBuds 4i',
  'Soundcore Liberty 4',
  'Soundcore Liberty 4 NC',
  'Soundcore Life P3',
  'Soundcore Space A40',
  'Jabra Elite 10',
  'Jabra Elite 8 Active',
  'Jabra Elite 4',
  'Bose QuietComfort Earbuds 2',
  'Bose QuietComfort Earbuds',
  'Other',
]

const NO_CASE_NEEDED = [
  'JBL Tune Flex',
  'JBL Tune 230NC',
  'JBL Wave Flex',
  'Realme Buds Air 3',
  'Realme Buds T300',
  'Realme Buds T100',
  'OnePlus Buds Z2',
  'Oppo Enco Air 3',
  'Oppo Enco Buds 2',
  'Soundcore Life P3',
]

const ALL_COMPONENTS = [
  'Left bud + Case',
  'Right bud + Case',
  'Left bud only',
  'Right bud only',
  'Both buds (no case)',
  'Case only',
  'Complete set',
]

const CASE_REQUIRED_COMPONENTS = [
  'Left bud + Case',
  'Right bud + Case',
  'Case only',
  'Complete set',
]

const OPPOSITE_MAP: Record<string, string[]> = {
  'Left bud + Case': ['Left bud + Case', 'Left bud only', 'Case only', 'Complete set'],
  'Right bud + Case': ['Right bud + Case', 'Right bud only', 'Case only', 'Complete set'],
  'Left bud only': ['Left bud only', 'Left bud + Case', 'Both buds (no case)', 'Complete set'],
  'Right bud only': ['Right bud only', 'Right bud + Case', 'Both buds (no case)', 'Complete set'],
  'Both buds (no case)': ['Both buds (no case)', 'Left bud only', 'Right bud only', 'Complete set'],
  'Case only': ['Case only', 'Left bud + Case', 'Right bud + Case', 'Complete set'],
  'Complete set': ['Complete set', 'Left bud + Case', 'Right bud + Case', 'Left bud only', 'Right bud only', 'Both buds (no case)', 'Case only'],
}

const CONDITIONS = ['Working perfectly', 'Minor issues', 'Unknown']

const DEFAULT_MARKET_PRICES: Record<string, number> = {
  'Apple AirPods Pro 2': 95000,
  'Apple AirPods Pro 1': 65000,
  'Apple AirPods 3': 55000,
  'Apple AirPods 2': 35000,
  'Samsung Galaxy Buds2 Pro': 45000,
  'Samsung Galaxy Buds2': 28000,
  'Samsung Galaxy Buds FE': 22000,
  'Samsung Galaxy Buds Live': 20000,
  'Samsung Galaxy Buds Plus': 18000,
  'Sony WF-1000XM5': 70000,
  'Sony WF-1000XM4': 55000,
  'Sony WF-C700N': 32000,
  'Sony WF-C500': 22000,
  'JBL Tour Pro 2': 48000,
  'JBL Live Pro 2': 35000,
  'JBL Tune Flex': 18000,
  'JBL Tune 230NC': 14000,
  'JBL Wave Flex': 12000,
  'Realme Buds Air 5 Pro': 18000,
  'Realme Buds Air 5': 14000,
  'Realme Buds Air 3': 10000,
  'Realme Buds T300': 8000,
  'Realme Buds T100': 5000,
  'OnePlus Buds Pro 2': 28000,
  'OnePlus Buds Pro': 20000,
  'OnePlus Buds Z2': 12000,
  'Xiaomi Redmi Buds 5 Pro': 16000,
  'Xiaomi Redmi Buds 5': 12000,
  'Xiaomi Redmi Buds 4 Pro': 14000,
  'Xiaomi Buds 4': 18000,
  'Oppo Enco X2': 32000,
  'Oppo Enco Air 3 Pro': 18000,
  'Oppo Enco Air 3': 12000,
  'Oppo Enco Buds 2': 8000,
  'Huawei FreeBuds Pro 3': 48000,
  'Huawei FreeBuds Pro 2': 38000,
  'Huawei FreeBuds 5i': 22000,
  'Huawei FreeBuds 4i': 18000,
  'Soundcore Liberty 4': 22000,
  'Soundcore Liberty 4 NC': 18000,
  'Soundcore Life P3': 12000,
  'Soundcore Space A40': 16000,
  'Jabra Elite 10': 55000,
  'Jabra Elite 8 Active': 38000,
  'Jabra Elite 4': 22000,
  'Bose QuietComfort Earbuds 2': 75000,
  'Bose QuietComfort Earbuds': 55000,
  'Other': 10000,
}

async function getMarketPrice(model: string): Promise<number> {
  const { data } = await supabase.from('model_prices').select('market_price').eq('model', model).single()
  return data?.market_price ?? DEFAULT_MARKET_PRICES[model] ?? 15000
}

async function updateMarketPrice(model: string, userPrice: number) {
  const { data } = await supabase.from('model_prices').select('*').eq('model', model).single()
  if (data) {
    const newAvg = (data.market_price * data.submission_count + userPrice) / (data.submission_count + 1)
    await supabase.from('model_prices').update({
      market_price: newAvg,
      submission_count: data.submission_count + 1,
      updated_at: new Date().toISOString(),
    }).eq('model', model)
  } else {
    await supabase.from('model_prices').insert([{ model, market_price: userPrice, submission_count: 1 }])
  }
}

async function getDynamicPriceBounds(model: string, component: string, marketPrice: number) {
  const { data } = await supabase.from('demand_stats').select('*').eq('model', model).eq('component', component).single()
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
    shop_code: '', // ✅ added
  })

  const [marketPrice, setMarketPrice] = useState<number | null>(null)
  const [priceBounds, setPriceBounds] = useState<any>(null)
  const [priceError, setPriceError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const availableComponents = form.model
    ? NO_CASE_NEEDED.includes(form.model)
      ? ALL_COMPONENTS
      : CASE_REQUIRED_COMPONENTS
    : []

  const availableNeeds = form.has_component
    ? availableComponents.filter(c => !OPPOSITE_MAP[form.has_component]?.includes(c))
    : []

  const handleModelChange = async (model: string) => {
    setForm({ ...form, model, has_component: '', needs_component: '', asking_price: '' })
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
    if (price > priceBounds.maxPrice) setPriceError(`Too high — max is LKR ${priceBounds.maxPrice}`)
    else if (price < priceBounds.minPrice) setPriceError(`Too low — min is LKR ${priceBounds.minPrice}`)
  }

  const handleSubmit = async () => {
    if (priceError) return
    setLoading(true)

    const askingPrice = parseFloat(form.asking_price)

    const { error: insertError } = await supabase
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
        shop_code: form.shop_code || null, // ✅ added
      }])

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  const inputClass = "w-full border rounded px-4 py-2"
  const selectClass = inputClass
  const labelClass = "text-sm font-medium"

  return (
    <div className="p-6 max-w-lg mx-auto">

      <input placeholder="Email" className={inputClass}
        value={form.user_email}
        onChange={e => setForm({ ...form, user_email: e.target.value })} />

      <select className={selectClass} value={form.model}
        onChange={e => handleModelChange(e.target.value)}>
        <option value="">Select model</option>
        {EARBUD_MODELS.map(m => <option key={m}>{m}</option>)}
      </select>

      <select className={selectClass} value={form.has_component}
        onChange={e => handleComponentChange(e.target.value)}>
        <option value="">I have</option>
        {availableComponents.map(c => <option key={c}>{c}</option>)}
      </select>

      <select className={selectClass} value={form.needs_component}
        onChange={e => setForm({ ...form, needs_component: e.target.value })}>
        <option value="">I need</option>
        {availableNeeds.map(c => <option key={c}>{c}</option>)}
      </select>

      <input placeholder="Price" className={inputClass}
        value={form.asking_price}
        onChange={e => handlePriceChange(e.target.value)} />

      <input placeholder="Location" className={inputClass}
        value={form.location}
        onChange={e => setForm({ ...form, location: e.target.value })} />

      {/* ✅ NEW FIELD */}
      <input
        placeholder="Shop code (optional)"
        className={inputClass}
        value={form.shop_code}
        onChange={e => setForm({ ...form, shop_code: e.target.value.toUpperCase() })}
      />

      <button onClick={handleSubmit} className="mt-4 bg-black text-white px-4 py-2">
        Submit
      </button>

    </div>
  )
}
