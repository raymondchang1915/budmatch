'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const EARBUD_MODELS = [
  // Apple
  'Apple AirPods Pro 2', 'Apple AirPods Pro 1',
  'Apple AirPods 4 ANC', 'Apple AirPods 4',
  'Apple AirPods 3', 'Apple AirPods 2',
  // Samsung
  'Samsung Galaxy Buds3 Pro', 'Samsung Galaxy Buds3',
  'Samsung Galaxy Buds2 Pro', 'Samsung Galaxy Buds2',
  'Samsung Galaxy Buds FE', 'Samsung Galaxy Buds Live', 'Samsung Galaxy Buds Plus',
  // Sony
  'Sony WF-1000XM5', 'Sony WF-1000XM4', 'Sony WF-C700N', 'Sony WF-C500',
  // JBL
  'JBL Tour Pro 2', 'JBL Live Pro 2',
  'JBL Tune Flex', 'JBL Tune 230NC', 'JBL Wave Flex',
  // Nothing / CMF
  'Nothing Ear', 'Nothing Ear (2)', 'Nothing Ear (a)',
  'CMF Buds Pro 2', 'CMF Buds Pro', 'CMF Buds 2', 'CMF Buds',
  // Soundcore (Anker)
  'Soundcore Liberty 4 Pro', 'Soundcore Liberty 4 NC', 'Soundcore Liberty 4',
  'Soundcore Liberty 3 Pro', 'Soundcore Space A40',
  'Soundcore Life P3', 'Soundcore Life P2',
  'Soundcore P40i', 'Soundcore P30i', 'Soundcore A30i',
  // Realme
  'Realme Buds Air 5 Pro', 'Realme Buds Air 5', 'Realme Buds Air 3',
  'Realme Buds T300', 'Realme Buds T100',
  // OnePlus
  'OnePlus Buds Pro 2', 'OnePlus Buds Pro', 'OnePlus Buds Z2',
  // Xiaomi / Redmi
  'Xiaomi Redmi Buds 6 Pro', 'Xiaomi Redmi Buds 6',
  'Xiaomi Redmi Buds 5 Pro', 'Xiaomi Redmi Buds 5',
  'Xiaomi Redmi Buds 4 Pro', 'Xiaomi Buds 4',
  // Oppo
  'Oppo Enco X2', 'Oppo Enco Air 3 Pro', 'Oppo Enco Air 3', 'Oppo Enco Buds 2',
  // Huawei
  'Huawei FreeBuds Pro 3', 'Huawei FreeBuds Pro 2',
  'Huawei FreeBuds 5i', 'Huawei FreeBuds 4i',
  // Haylou
  'Haylou X1 Pro', 'Haylou X1 2023', 'Haylou GT7',
  // Jabra
  'Jabra Elite 10', 'Jabra Elite 8 Active', 'Jabra Elite 4',
  // Bose
  'Bose QuietComfort Earbuds 2', 'Bose QuietComfort Earbuds',
  'Bose Ultra Open Earbuds',
  // Other
  'Other',
]

const CONDITIONS = ['Working perfectly', 'Usable', 'Unknown']

const DEFAULT_MARKET_PRICES: Record<string, number> = {
  // Apple — iSpot LK / authorized dealers
  'Apple AirPods Pro 2':        69000,
  'Apple AirPods Pro 1':        45000,
  'Apple AirPods 4 ANC':        62000,
  'Apple AirPods 4':            52000,
  'Apple AirPods 3':            42000,
  'Apple AirPods 2':            28000,
  // Samsung — DirectDealz / Celltronics
  'Samsung Galaxy Buds3 Pro':   42000,
  'Samsung Galaxy Buds3':       30000,
  'Samsung Galaxy Buds2 Pro':   28000,
  'Samsung Galaxy Buds2':       23000,
  'Samsung Galaxy Buds FE':     18000,
  'Samsung Galaxy Buds Live':   16000,
  'Samsung Galaxy Buds Plus':   14000,
  // Sony — DirectDealz LKR 59,800 / GQ LKR 55,900–59,900
  'Sony WF-1000XM5':            60000,
  'Sony WF-1000XM4':            42000,
  'Sony WF-C700N':              24000,
  'Sony WF-C500':               16000,
  // JBL — Celltronics / Greenware
  'JBL Tour Pro 2':             40000,
  'JBL Live Pro 2':             30000,
  'JBL Tune Flex':              16000,
  'JBL Tune 230NC':             12000,
  'JBL Wave Flex':              10000,
  // Nothing / CMF — DirectDealz / NoFake Maharagama
  'Nothing Ear':                38000,
  'Nothing Ear (2)':            35000,
  'Nothing Ear (a)':            22000,
  'CMF Buds Pro 2':             16000,
  'CMF Buds Pro':               14000,
  'CMF Buds 2':                  9000,
  'CMF Buds':                    7500,
  // Soundcore — Celltronics authorized
  'Soundcore Liberty 4 Pro':    28000,
  'Soundcore Liberty 4 NC':     17000,
  'Soundcore Liberty 4':        20000,
  'Soundcore Liberty 3 Pro':    24000,
  'Soundcore Space A40':        14000,
  'Soundcore Life P3':          10500,
  'Soundcore Life P2':           8500,
  'Soundcore P40i':             15000,
  'Soundcore P30i':             12000,
  'Soundcore A30i':              9500,
  // Realme — DirectDealz
  'Realme Buds Air 5 Pro':      16000,
  'Realme Buds Air 5':          12000,
  'Realme Buds Air 3':           9000,
  'Realme Buds T300':            7000,
  'Realme Buds T100':            4500,
  // OnePlus — DirectDealz / XMobile
  'OnePlus Buds Pro 2':         25000,
  'OnePlus Buds Pro':           18000,
  'OnePlus Buds Z2':            10000,
  // Xiaomi / Redmi — DirectDealz
  'Xiaomi Redmi Buds 6 Pro':    18000,
  'Xiaomi Redmi Buds 6':        12000,
  'Xiaomi Redmi Buds 5 Pro':    14000,
  'Xiaomi Redmi Buds 5':        10000,
  'Xiaomi Redmi Buds 4 Pro':    12000,
  'Xiaomi Buds 4':              16000,
  // Oppo — DirectDealz
  'Oppo Enco X2':               28000,
  'Oppo Enco Air 3 Pro':        16000,
  'Oppo Enco Air 3':            10000,
  'Oppo Enco Buds 2':            7000,
  // Huawei — authorized dealers
  'Huawei FreeBuds Pro 3':      42000,
  'Huawei FreeBuds Pro 2':      32000,
  'Huawei FreeBuds 5i':         18000,
  'Huawei FreeBuds 4i':         15000,
  // Haylou — DirectDealz / NoFake
  'Haylou X1 Pro':              11000,
  'Haylou X1 2023':              7500,
  'Haylou GT7':                  5500,
  // Jabra — Greenware / authorized
  'Jabra Elite 10':             50000,
  'Jabra Elite 8 Active':       35000,
  'Jabra Elite 4':              20000,
  // Bose — Greenware LKR 67,500
  'Bose QuietComfort Earbuds 2': 68000,
  'Bose QuietComfort Earbuds':   50000,
  'Bose Ultra Open Earbuds':     60000,
  // Other
  'Other': 10000,
}

export default function NewListing() {
  const router = useRouter()
  const [form, setForm] = useState({
    user_email: '',
    model: '',
    has_component: '' as 'Left bud' | 'Right bud' | '',
    has_case: false,
    condition: '',
    year_of_purchase: '',
    location: '',
    listing_type: 'selling',
    shop_code: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [marketPrice, setMarketPrice] = useState<number | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/auth?redirect=/listings/new')
      } else {
        setForm(prev => ({ ...prev, user_email: data.user!.email ?? '' }))
      }
    })
  }, [])

  const handleModelChange = (model: string) => {
    setForm({ ...form, model })
    setMarketPrice(DEFAULT_MARKET_PRICES[model] ?? 10000)
  }

  const handleSubmit = async () => {
    if (!form.model || !form.has_component || !form.condition || !form.listing_type || !form.user_email) {
      setError('Please fill in all required fields')
      return
    }
    if (!form.year_of_purchase) {
      setError('Please select year of purchase')
      return
    }
    setLoading(true)
    setError('')

    const { data: listing, error: insertError } = await supabase
      .from('listings')
      .insert([{
        user_email: form.user_email,
        model: form.model,
        has_component: form.has_component,
        has_case: form.has_case,
        needs_component: form.has_component === 'Left bud' ? 'Right bud' : 'Left bud',
        condition: form.condition,
        year_of_purchase: form.year_of_purchase ? parseInt(form.year_of_purchase) : null,
        location: form.location,
        listing_type: form.listing_type,
        shop_code: form.shop_code || null,
      }])
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    // update demand stats
    await supabase.from('demand_stats').upsert([{
      model: form.model,
      component: form.has_component,
      have_count: 1,
    }], { onConflict: 'model,component' })

    // trigger matching engine for this model only
    await fetch('/api/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: form.model }),
    })

    setSuccess(true)
    setLoading(false)
  }

  const inputClass = "w-full bg-white border border-gray-200 rounded-full px-5 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 shadow-sm"
  const selectClass = "w-full bg-white border border-gray-200 rounded-full px-5 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 shadow-sm appearance-none"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5 ml-1"

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 8 }, (_, i) => currentYear - i)

  if (success) {
    return (
      <main className="min-h-screen bg-[#f5f5f0] flex items-center justify-center px-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center max-w-md shadow-sm">
          <p className="text-4xl mb-4">🎉</p>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Listing posted!</h2>
          <p className="text-gray-400 mb-6">
            We'll match you automatically. Check your profile for updates.
          </p>
          <div className="flex gap-3 justify-center">
            <a href="/browse"
              className="border border-gray-200 text-gray-700 px-6 py-2.5 rounded-full text-sm hover:border-gray-400 transition">
              Browse listings
            </a>
            <a href="/profile"
              className="bg-gray-900 text-white px-6 py-2.5 rounded-full text-sm hover:bg-black transition">
              My profile
            </a>
          </div>
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
          <span className="text-sm text-gray-500 tracking-wide">New listing</span>
        </div>

        <h1 className="text-5xl font-bold text-gray-900 tracking-tight mb-2">Add a bud.</h1>
        <p className="text-gray-400 mb-10">Tell us what you have. We'll find your match.</p>

        <div className="flex flex-col gap-5">

          {/* Posting as */}
          <div className="bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm text-gray-500">
            📧 Posting as{' '}
            <strong className="text-gray-900">{form.user_email || 'loading...'}</strong>
          </div>

          {/* Listing type */}
          <div>
            <label className={labelClass}>I want to</label>
            <div className="flex gap-2 bg-white border border-gray-200 rounded-full p-1 shadow-sm">
              {[
                { val: 'selling', label: 'Sell / Trade' },
                { val: 'buying', label: 'Buy' },
              ].map(t => (
                <button key={t.val}
                  onClick={() => setForm({ ...form, listing_type: t.val })}
                  className={`flex-1 py-2 rounded-full text-sm font-medium transition ${
                    form.listing_type === t.val
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Model */}
          <div>
            <label className={labelClass}>Earbud model *</label>
            <select className={selectClass} value={form.model}
              onChange={e => handleModelChange(e.target.value)}>
              <option value="">Select model</option>
              {EARBUD_MODELS.map(m => <option key={m}>{m}</option>)}
            </select>
            {marketPrice && (
              <p className="text-xs text-gray-400 mt-1 ml-1">
                Market price: LKR {marketPrice.toLocaleString()}
              </p>
            )}
          </div>

          {/* Which bud */}
          <div>
            <label className={labelClass}>Which bud do you have? *</label>
            <div className="flex gap-3">
              {(['Left bud', 'Right bud'] as const).map(side => (
                <button
                  key={side}
                  onClick={() => setForm({ ...form, has_component: side })}
                  className={`flex-1 py-3 rounded-2xl border text-sm font-medium transition ${
                    form.has_component === side
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {side === 'Left bud' ? '◀ Left bud' : 'Right bud ▶'}
                </button>
              ))}
            </div>
          </div>

          {/* Case checkbox */}
          <div
            onClick={() => setForm({ ...form, has_case: !form.has_case })}
            className={`flex items-center justify-between bg-white border rounded-2xl px-5 py-4 cursor-pointer transition ${
              form.has_case ? 'border-gray-900' : 'border-gray-200 hover:border-gray-400'
            }`}
          >
            <div>
              <p className="text-sm font-medium text-gray-900">I also have the charging case</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Having the case helps with pairing and resets
              </p>
            </div>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
              form.has_case ? 'bg-gray-900 border-gray-900' : 'border-gray-300'
            }`}>
              {form.has_case && <span className="text-white text-xs">✓</span>}
            </div>
          </div>

          {/* Condition */}
          <div>
            <label className={labelClass}>Condition *</label>
            <div className="flex gap-2">
              {CONDITIONS.map(c => (
                <button key={c}
                  onClick={() => setForm({ ...form, condition: c })}
                  className={`flex-1 py-2.5 rounded-full border text-xs font-medium transition ${
                    form.condition === c
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Year of purchase */}
          <div>
            <label className={labelClass}>Year purchased *</label>
            <select className={selectClass} value={form.year_of_purchase}
              onChange={e => setForm({ ...form, year_of_purchase: e.target.value })}>
              <option value="">Select year</option>
              {years.map(y => <option key={y}>{y}</option>)}
            </select>
          </div>

          {/* Location */}
          <div>
            <label className={labelClass}>Location</label>
            <input type="text" placeholder="e.g. Colombo, Maharagama"
              className={inputClass}
              value={form.location}
              onChange={e => setForm({ ...form, location: e.target.value })} />
          </div>

          {/* Shop code */}
          <div>
            <label className={labelClass}>Shop code (optional)</label>
            <input type="text" placeholder="Enter if referred by a partner shop"
              className={inputClass}
              value={form.shop_code}
              onChange={e => setForm({ ...form, shop_code: e.target.value.toUpperCase() })} />
          </div>

          {error && <p className="text-red-500 text-sm ml-1">{error}</p>}

          <button onClick={handleSubmit}
            disabled={loading || !form.model || !form.has_component || !form.condition || !form.listing_type || !form.year_of_purchase}
            className="bg-gray-900 text-white py-3.5 rounded-full font-medium hover:bg-black transition disabled:opacity-40 text-sm">
            {loading ? 'Posting...' : 'Post listing →'}
          </button>

        </div>
      </div>
    </main>
  )
}