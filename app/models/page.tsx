'use client'

import { useState } from 'react'

const DATA = [
  { brand: 'Samsung', model: 'Samsung Galaxy Buds3 Pro', price: 42000 },
  { brand: 'Samsung', model: 'Samsung Galaxy Buds3', price: 30000 },
  { brand: 'Samsung', model: 'Samsung Galaxy Buds2 Pro', price: 28000 },
  { brand: 'Samsung', model: 'Samsung Galaxy Buds2', price: 23000 },
  { brand: 'Samsung', model: 'Samsung Galaxy Buds FE', price: 18000 },
  { brand: 'Samsung', model: 'Samsung Galaxy Buds Live', price: 16000 },
  { brand: 'Samsung', model: 'Samsung Galaxy Buds Plus', price: 14000 },
  { brand: 'Sony', model: 'Sony WF-1000XM5', price: 60000 },
  { brand: 'Sony', model: 'Sony WF-1000XM4', price: 42000 },
  { brand: 'Sony', model: 'Sony WF-C700N', price: 24000 },
  { brand: 'Sony', model: 'Sony WF-C500', price: 16000 },
  { brand: 'JBL', model: 'JBL Tour Pro 2', price: 40000 },
  { brand: 'JBL', model: 'JBL Live Pro 2', price: 30000 },
  { brand: 'JBL', model: 'JBL Tune Flex', price: 16000 },
  { brand: 'JBL', model: 'JBL Tune 230NC', price: 12000 },
  { brand: 'JBL', model: 'JBL Wave Flex', price: 10000 },
  { brand: 'Nothing / CMF', model: 'Nothing Ear', price: 38000 },
  { brand: 'Nothing / CMF', model: 'Nothing Ear (2)', price: 35000 },
  { brand: 'Nothing / CMF', model: 'Nothing Ear (a)', price: 22000 },
  { brand: 'Nothing / CMF', model: 'CMF Buds Pro 2', price: 16000 },
  { brand: 'Nothing / CMF', model: 'CMF Buds Pro', price: 14000 },
  { brand: 'Nothing / CMF', model: 'CMF Buds 2', price: 9000 },
  { brand: 'Nothing / CMF', model: 'CMF Buds', price: 7500 },
  { brand: 'Soundcore', model: 'Soundcore Liberty 5', price: 29000 },
  { brand: 'Soundcore', model: 'Soundcore Liberty 5 NC', price: 22000 },
  { brand: 'Soundcore', model: 'Soundcore Liberty 4 Pro', price: 26000 },
  { brand: 'Soundcore', model: 'Soundcore Liberty 4 NC', price: 17000 },
  { brand: 'Soundcore', model: 'Soundcore Liberty 4', price: 20000 },
  { brand: 'Soundcore', model: 'Soundcore Liberty 3 Pro', price: 24000 },
  { brand: 'Soundcore', model: 'Soundcore K20i', price: 30000 },
  { brand: 'Soundcore', model: 'Soundcore Space A40', price: 14000 },
  { brand: 'Soundcore', model: 'Soundcore P40i', price: 15000 },
  { brand: 'Soundcore', model: 'Soundcore P30i', price: 12000 },
  { brand: 'Soundcore', model: 'Soundcore Sport X20', price: 10000 },
  { brand: 'Soundcore', model: 'Soundcore Sport X10', price: 9000 },
  { brand: 'Soundcore', model: 'Soundcore A30i', price: 9500 },
  { brand: 'Soundcore', model: 'Soundcore Life P3', price: 10500 },
  { brand: 'Soundcore', model: 'Soundcore Life P2', price: 8500 },
  { brand: 'Soundcore', model: 'Soundcore Life Note 3S', price: 8500 },
  { brand: 'Soundcore', model: 'Soundcore Life Note 3', price: 7500 },
  { brand: 'Soundcore', model: 'Soundcore Life P2 Mini', price: 6500 },
  { brand: 'Soundcore', model: 'Soundcore Life Dot 2', price: 6000 },
  { brand: 'Soundcore', model: 'Soundcore Dot 2i', price: 5500 },
  { brand: 'Soundcore', model: 'Soundcore R50i', price: 8000 },
  { brand: 'Realme', model: 'Realme Buds Air 6 Pro', price: 16000 },
  { brand: 'Realme', model: 'Realme Buds Air 6', price: 12000 },
  { brand: 'Realme', model: 'Realme Buds Air 5 Pro', price: 16000 },
  { brand: 'Realme', model: 'Realme Buds Air 5', price: 12000 },
  { brand: 'Realme', model: 'Realme Buds Air 3', price: 9000 },
  { brand: 'Realme', model: 'Realme Buds T310', price: 14000 },
  { brand: 'Realme', model: 'Realme Buds T300', price: 7000 },
  { brand: 'Realme', model: 'Realme Buds T200', price: 9000 },
  { brand: 'Realme', model: 'Realme Buds T100', price: 4500 },
  { brand: 'Realme', model: 'Realme Buds T100 Neo', price: 4800 },
  { brand: 'Realme', model: 'Realme Buds Wireless 2 Neo', price: 4200 },
  { brand: 'OnePlus', model: 'OnePlus Buds Pro 2', price: 25000 },
  { brand: 'OnePlus', model: 'OnePlus Buds 4', price: 19000 },
  { brand: 'OnePlus', model: 'OnePlus Buds 3', price: 24000 },
  { brand: 'OnePlus', model: 'OnePlus Buds Pro', price: 18000 },
  { brand: 'OnePlus', model: 'OnePlus Nord Buds 2', price: 14800 },
  { brand: 'OnePlus', model: 'OnePlus Buds Z2', price: 10000 },
  { brand: 'OnePlus', model: 'OnePlus Nord Buds CE', price: 9500 },
  { brand: 'Xiaomi / Redmi', model: 'Xiaomi Redmi Buds 6 Pro', price: 18000 },
  { brand: 'Xiaomi / Redmi', model: 'Xiaomi Redmi Buds 6', price: 12000 },
  { brand: 'Xiaomi / Redmi', model: 'Xiaomi Redmi Buds 6 Active', price: 8000 },
  { brand: 'Xiaomi / Redmi', model: 'Xiaomi Redmi Buds 5 Pro', price: 14000 },
  { brand: 'Xiaomi / Redmi', model: 'Xiaomi Redmi Buds 5', price: 10000 },
  { brand: 'Xiaomi / Redmi', model: 'Xiaomi Redmi Buds 5A', price: 8000 },
  { brand: 'Xiaomi / Redmi', model: 'Xiaomi Redmi Buds 4 Pro', price: 12000 },
  { brand: 'Xiaomi / Redmi', model: 'Xiaomi Redmi Buds 4', price: 10500 },
  { brand: 'Xiaomi / Redmi', model: 'Xiaomi Redmi Buds 4 Lite', price: 4800 },
  { brand: 'Xiaomi / Redmi', model: 'Xiaomi Buds 4', price: 16000 },
  { brand: 'Xiaomi / Redmi', model: 'Xiaomi Redmi Buds 3', price: 6800 },
  { brand: 'Xiaomi / Redmi', model: 'Xiaomi Redmi Buds 3 Lite', price: 5200 },
  { brand: 'Xiaomi / Redmi', model: 'Xiaomi Redmi Buds Essential', price: 5200 },
  { brand: 'Oppo', model: 'Oppo Enco X2', price: 28000 },
  { brand: 'Oppo', model: 'Oppo Enco Air 3 Pro', price: 16000 },
  { brand: 'Oppo', model: 'Oppo Enco Air 3', price: 10000 },
  { brand: 'Oppo', model: 'Oppo Enco Buds 2', price: 7000 },
  { brand: 'Huawei', model: 'Huawei FreeBuds Pro 3', price: 42000 },
  { brand: 'Huawei', model: 'Huawei FreeBuds Pro 2', price: 32000 },
  { brand: 'Huawei', model: 'Huawei FreeBuds 5i', price: 18000 },
  { brand: 'Huawei', model: 'Huawei FreeBuds 4i', price: 15000 },
  { brand: 'Haylou', model: 'Haylou X1 Pro', price: 11000 },
  { brand: 'Haylou', model: 'Haylou W1 ANC', price: 11800 },
  { brand: 'Haylou', model: 'Haylou MoriPods ANC', price: 12000 },
  { brand: 'Haylou', model: 'Haylou MoriPods', price: 8500 },
  { brand: 'Haylou', model: 'Haylou X1 2023', price: 7500 },
  { brand: 'Haylou', model: 'Haylou X1 Neo', price: 5800 },
  { brand: 'Haylou', model: 'Haylou GT7', price: 5500 },
  { brand: 'Haylou', model: 'Haylou GT5', price: 5800 },
  { brand: 'Haylou', model: 'Haylou X1C', price: 4800 },
  { brand: 'Jabra', model: 'Jabra Elite 10', price: 50000 },
  { brand: 'Jabra', model: 'Jabra Elite 8 Active', price: 35000 },
  { brand: 'Jabra', model: 'Jabra Elite 4', price: 20000 },
  { brand: 'Bose', model: 'Bose QuietComfort Earbuds 2', price: 68000 },
  { brand: 'Bose', model: 'Bose QuietComfort Earbuds', price: 50000 },
  { brand: 'Bose', model: 'Bose Ultra Open Earbuds', price: 60000 },
]

function tier(p: number) {
  if (p < 10000) return 'budget'
  if (p <= 25000) return 'mid'
  return 'premium'
}

const TIER_LABEL: Record<string, string> = { budget: 'Budget', mid: 'Mid', premium: 'Premium' }
const TIER_STYLE: Record<string, string> = {
  budget: 'bg-green-50 text-green-700',
  mid: 'bg-blue-50 text-blue-700',
  premium: 'bg-amber-50 text-amber-700',
}

export default function ModelsPage() {
  const [search, setSearch] = useState('')
  const [filterTier, setFilterTier] = useState('all')
  const [openBrands, setOpenBrands] = useState<Set<string>>(new Set())

  const q = search.toLowerCase()
  const filtered = DATA.filter(d => {
    const matchQ = !q || d.model.toLowerCase().includes(q) || d.brand.toLowerCase().includes(q)
    const matchT = filterTier === 'all' || tier(d.price) === filterTier
    return matchQ && matchT
  })

  const byBrand: Record<string, typeof DATA> = {}
  filtered.forEach(d => {
    if (!byBrand[d.brand]) byBrand[d.brand] = []
    byBrand[d.brand].push(d)
  })

  const total = filtered.length
  const budgetCount = filtered.filter(d => tier(d.price) === 'budget').length
  const midCount = filtered.filter(d => tier(d.price) === 'mid').length
  const premiumCount = filtered.filter(d => tier(d.price) === 'premium').length

  function toggleBrand(brand: string) {
    setOpenBrands(prev => {
      const next = new Set(prev)
      next.has(brand) ? next.delete(brand) : next.add(brand)
      return next
    })
  }

  const isOpen = (brand: string) => openBrands.has(brand) || q.length > 0

  return (
    <main className="min-h-screen bg-[#f5f5f0] relative">
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle, #00000012 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
      }} />

      <div className="relative max-w-2xl mx-auto px-4 py-16">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px w-8 bg-gray-400" />
          <span className="text-sm text-gray-500 tracking-wide">Supported models</span>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-1">Earbud models</h1>
        <p className="text-gray-400 text-sm mb-8">Sri Lanka market reference prices for all supported models.</p>

        {/* Search + filter */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Search model or brand..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-white border border-gray-200 rounded-full px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 shadow-sm"
          />
          <select
            value={filterTier}
            onChange={e => setFilterTier(e.target.value)}
            className="bg-white border border-gray-200 rounded-full px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 shadow-sm appearance-none"
          >
            <option value="all">All tiers</option>
            <option value="budget">Budget (&lt;10k)</option>
            <option value="mid">Mid (10k–25k)</option>
            <option value="premium">Premium (25k+)</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {[
            { label: 'Total models', value: total },
            { label: 'Budget <10k', value: budgetCount },
            { label: 'Mid 10–25k', value: midCount },
            { label: 'Premium 25k+', value: premiumCount },
          ].map(s => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-2xl px-3 py-3 shadow-sm">
              <p className="text-xs text-gray-400 mb-1">{s.label}</p>
              <p className="text-xl font-semibold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Brand sections */}
        {Object.keys(byBrand).length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No models match your search.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {Object.entries(byBrand).map(([brand, items]) => (
              <div key={brand} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleBrand(brand)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition text-left"
                >
                  <span className="text-sm font-medium text-gray-900">{brand}</span>
                  <span className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{items.length} model{items.length > 1 ? 's' : ''}</span>
                    <span className="text-xs text-gray-400" style={{
                      display: 'inline-block',
                      transform: isOpen(brand) ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s',
                    }}>▼</span>
                  </span>
                </button>

                {isOpen(brand) && (
                  <div>
                    {items.map((d) => (
                      <div key={d.model} className="flex items-center justify-between px-4 py-2.5 text-sm border-t border-gray-100">
                        <span className="text-gray-800">{d.model}</span>
                        <span className="flex items-center gap-2 shrink-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIER_STYLE[tier(d.price)]}`}>
                            {TIER_LABEL[tier(d.price)]}
                          </span>
                          <span className="text-sm font-medium text-gray-900 min-w-2.25 text-right">
                            LKR {d.price.toLocaleString()}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-400 mt-6 pl-3 border-l-2 border-gray-300">
          ⚠ Apple AirPods are not listed — they are case-locked and incompatible with single-bud trading.
          All other brands are verified as standard case-reset compatible.
        </p>
      </div>
    </main>
  )
}
