import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Listing = {
  id: string
  model: string
  has_component: string
  needs_component: string
  condition: string
  location: string
  user_email: string
  asking_price: number | null
  created_at: string
  matched: boolean
}

const CONDITION_SCORE: Record<string, number> = {
  'Working perfectly': 1.0,
  'Minor issues': 0.6,
  'Unknown': 0.3,
}

// Maps component variants to their core bud side
const COMPONENT_CORE: Record<string, string> = {
  'Left bud + Case':      'Left bud',
  'Left bud only':        'Left bud',
  'Right bud + Case':     'Right bud',
  'Right bud only':       'Right bud',
  'Case only':            'Case',
  'Both buds (no case)':  'Both buds',
  'Complete set':         'Complete set',
}

function compatible(a: Listing, b: Listing): boolean {
  if (a.model !== b.model) return false
  if (a.user_email === b.user_email) return false

  const coreA = COMPONENT_CORE[a.has_component] ?? a.has_component
  const coreB = COMPONENT_CORE[b.has_component] ?? b.has_component

  // Valid matching pairs — left bud holder matches with right bud holder
  // Case ownership is a bonus, not a hard requirement
  const validPairs: [string, string][] = [
    ['Left bud',  'Right bud'],
    ['Right bud', 'Left bud'],
  ]

  return validPairs.some(([x, y]) => coreA === x && coreB === y)
}

function locationSimilarity(a: string, b: string): number {
  if (!a || !b) return 0.5
  const cityA = a.toLowerCase().split(',')[0].trim()
  const cityB = b.toLowerCase().split(',')[0].trim()
  return cityA === cityB ? 1.0 : 0.2
}

function recencyScore(createdAt: string): number {
  const ageDays = (Date.now() - new Date(createdAt).getTime()) / 86400000
  return Math.max(0, 1 - ageDays / 30)
}

function scoreEdge(a: Listing, b: Listing): number {
  const condA = CONDITION_SCORE[a.condition] ?? 0.3
  const condB = CONDITION_SCORE[b.condition] ?? 0.3
  const conditionSim = 1 - Math.abs(condA - condB)
  const locSim = locationSimilarity(a.location, b.location)
  const recency = (recencyScore(a.created_at) + recencyScore(b.created_at)) / 2

  // Bonus score if one party has the case
  const hasCase =
    a.has_component.includes('Case') || b.has_component.includes('Case') ? 0.1 : 0

  let priceSim = 0.1
  if (a.asking_price && b.asking_price) {
    const diff = Math.abs(a.asking_price - b.asking_price)
    const avg = (a.asking_price + b.asking_price) / 2
    priceSim = 1 - Math.min(diff / avg, 1)
  }

  return conditionSim * 0.30 + locSim * 0.25 + recency * 0.20 + priceSim * 0.15 + hasCase
}

async function computeDualPricing(a: Listing, b: Listing, model: string) {
  const { data: mp } = await supabase
    .from('model_prices')
    .select('market_price')
    .eq('model', model)
    .single()

  const marketFull = mp?.market_price ?? 25000
  const componentMarket = Math.round(marketFull * 0.40)
  const typicalOutsideSale = Math.round(componentMarket * 0.80)
  const platformFeePerSide = 200
  const anchorPrice = Math.round(componentMarket * 0.92)

  const buyerPriceA = anchorPrice
  const buyerPriceB = anchorPrice
  const sellerPayoutA = Math.round(buyerPriceA - platformFeePerSide)
  const sellerPayoutB = Math.round(buyerPriceB - platformFeePerSide)

  const ladderMin = anchorPrice - 300
  const ladderMax = anchorPrice + 300

  return {
    anchor_price: anchorPrice,
    buyer_price_a: buyerPriceA,
    buyer_price_b: buyerPriceB,
    seller_payout_a: sellerPayoutA,
    seller_payout_b: sellerPayoutB,
    platform_fee: platformFeePerSide * 2,
    market_reference: componentMarket,
    typical_outside_sale: typicalOutsideSale,
    ladder_min: ladderMin,
    ladder_max: ladderMax,
    buyer_offer: anchorPrice,
    seller_offer: anchorPrice,
    negotiation_status: 'pending',
  }
}

async function runMatchingForModel(model: string) {
  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .eq('model', model)
    .eq('matched', false)

  if (!listings || listings.length < 2) return { matched: 0 }

  const edges: { score: number; a: Listing; b: Listing }[] = []
  for (let i = 0; i < listings.length; i++) {
    for (let j = i + 1; j < listings.length; j++) {
      if (compatible(listings[i], listings[j])) {
        edges.push({
          score: scoreEdge(listings[i], listings[j]),
          a: listings[i],
          b: listings[j],
        })
      }
    }
  }

  edges.sort((x, y) => y.score - x.score)

  const matchedIds = new Set<string>()
  let matchCount = 0

  for (const edge of edges) {
    if (matchedIds.has(edge.a.id) || matchedIds.has(edge.b.id)) continue

    const pricing = await computeDualPricing(edge.a, edge.b, model)

    await supabase.from('matches').insert([{
      listing_a: edge.a.id,
      listing_b: edge.b.id,
      status: 'pending',
      score: edge.score,
      ...pricing,
    }])

    await supabase.from('listings').update({ matched: true }).eq('id', edge.a.id)
    await supabase.from('listings').update({ matched: true }).eq('id', edge.b.id)

    matchedIds.add(edge.a.id)
    matchedIds.add(edge.b.id)
    matchCount++
  }

  return { matched: matchCount }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const model = body.model

    if (model) {
      const result = await runMatchingForModel(model)
      return NextResponse.json({ success: true, ...result })
    }

    const { data: models } = await supabase
      .from('listings')
      .select('model')
      .eq('matched', false)

    const uniqueModels = [...new Set(models?.map(m => m.model) ?? [])]
    let totalMatched = 0
    for (const m of uniqueModels) {
      const r = await runMatchingForModel(m)
      totalMatched += r.matched
    }

    return NextResponse.json({ success: true, total_matched: totalMatched })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'matching engine online' })
}