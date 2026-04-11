import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Listing = {
  id: string
  model: string
  has_component: string  // 'Left bud' | 'Right bud'
  has_case: boolean
  needs_component: string
  condition: string
  location: string
  user_email: string
  asking_price: number | null
  year_of_purchase: number | null
  created_at: string
  matched: boolean
}

// ── Condition score ────────────────────────────────────────────
const CONDITION_SCORE: Record<string, number> = {
  'Working perfectly': 1.0,
  'Usable': 0.6,
  'Unknown': 0.3,
}

// ── Pricing formula ────────────────────────────────────────────
// Price = marketPrice × conditionFactor × ageFactor × demandFactor
// Always between 10% and 60% of market price
async function computePrice(listing: Listing, marketPrice: number): Promise<number> {
  const condition = CONDITION_SCORE[listing.condition] ?? 0.3

  // age factor — newer = worth more
  const currentYear = new Date().getFullYear()
  const age = listing.year_of_purchase
    ? currentYear - listing.year_of_purchase
    : 2 // assume 2 years old if not provided
  const ageFactor = Math.max(0.4, 1 - age * 0.12) // loses 12% per year, floor at 40%

  // demand factor from demand_stats
  const { data } = await supabase
    .from('demand_stats')
    .select('need_count, have_count')
    .eq('model', listing.model)
    .eq('component', listing.has_component)
    .single()

  const needCount = data?.need_count ?? 0
  const haveCount = data?.have_count ?? 1
  const demandRatio = needCount / (needCount + haveCount) // 0 to 1
  // demand pushes price up — high demand can go above 50%
  const demandFactor = 0.3 + demandRatio * 0.3 // range: 0.30 to 0.60

  const rawPrice = marketPrice * condition * ageFactor * demandFactor

  // hard cap: 10% to 60% of market price
  const minPrice = marketPrice * 0.10
  const maxPrice = marketPrice * 0.60
  return Math.round(Math.max(minPrice, Math.min(maxPrice, rawPrice)) / 100) * 100
}

// ── Edge score for matching ────────────────────────────────────
function scoreEdge(a: Listing, b: Listing): number {
  const condA = CONDITION_SCORE[a.condition] ?? 0.3
  const condB = CONDITION_SCORE[b.condition] ?? 0.3
  const conditionSim = 1 - Math.abs(condA - condB)

  // location match
  const cityA = a.location?.toLowerCase().split(',')[0].trim() ?? ''
  const cityB = b.location?.toLowerCase().split(',')[0].trim() ?? ''
  const locSim = cityA && cityB && cityA === cityB ? 1.0 : 0.2

  // recency
  const ageA = (Date.now() - new Date(a.created_at).getTime()) / 86400000
  const ageB = (Date.now() - new Date(b.created_at).getTime()) / 86400000
  const recency = Math.max(0, 1 - (ageA + ageB) / 60)

  // case bonus — if one of them has the case, slightly prefer that match
  const caseBonus = (a.has_case || b.has_case) ? 0.1 : 0

  return conditionSim * 0.40 + locSim * 0.30 + recency * 0.20 + caseBonus * 0.10
}

// ── Compatibility — only left↔right, same model ────────────────
function compatible(a: Listing, b: Listing): boolean {
  if (a.model !== b.model) return false
  if (a.user_email === b.user_email) return false
  return (
    (a.has_component === 'Left bud' && b.has_component === 'Right bud') ||
    (a.has_component === 'Right bud' && b.has_component === 'Left bud')
  )
}

// ── Run matching for one model group ──────────────────────────
async function runMatchingForModel(model: string) {
  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .eq('model', model)
    .eq('matched', false)

  if (!listings || listings.length < 2) return { matched: 0 }

  // get market price
  const { data: mp } = await supabase
    .from('model_prices')
    .select('market_price')
    .eq('model', model)
    .single()
  const marketPrice = mp?.market_price ?? 25000

  // build edges
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

    // compute price for each listing separately
    const priceA = await computePrice(edge.a, marketPrice)
    const priceB = await computePrice(edge.b, marketPrice)

    // platform keeps spread
    const platformFee = 200
    const anchorPrice = Math.round((priceA + priceB) / 2)

    await supabase.from('matches').insert([{
      listing_a: edge.a.id,
      listing_b: edge.b.id,
      status: 'pending',
      score: edge.score,
      anchor_price: anchorPrice,
      buyer_price_a: priceA,
      buyer_price_b: priceB,
      seller_payout_a: priceA - platformFee,
      seller_payout_b: priceB - platformFee,
      platform_fee: platformFee * 2,
      market_reference: Math.round(marketPrice * 0.40),
      ladder_min: anchorPrice - 300,
      ladder_max: anchorPrice + 300,
      buyer_offer: anchorPrice,
      seller_offer: anchorPrice,
      negotiation_status: 'pending',
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

    // global run
    const { data: models } = await supabase
      .from('listings')
      .select('model')
      .eq('matched', false)

    const uniqueModels = [...new Set(models?.map(m => m.model) ?? [])]
    let total = 0
    for (const m of uniqueModels) {
      const r = await runMatchingForModel(m)
      total += r.matched
    }

    return NextResponse.json({ success: true, total_matched: total })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'matching engine online' })
}