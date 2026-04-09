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

// ── Condition scoring ──────────────────────────────────────────
const CONDITION_SCORE: Record<string, number> = {
  'Working perfectly': 1.0,
  'Minor issues': 0.6,
  'Unknown': 0.3,
}

// ── Location similarity (simple city match) ────────────────────
function locationSimilarity(a: string, b: string): number {
  if (!a || !b) return 0.5
  const cityA = a.toLowerCase().split(',')[0].trim()
  const cityB = b.toLowerCase().split(',')[0].trim()
  return cityA === cityB ? 1.0 : 0.2
}

// ── Recency score (newer = better) ────────────────────────────
function recencyScore(createdAt: string): number {
  const ageMs = Date.now() - new Date(createdAt).getTime()
  const ageDays = ageMs / (1000 * 60 * 60 * 24)
  return Math.max(0, 1 - ageDays / 30) // decays to 0 over 30 days
}

// ── Demand imbalance score ─────────────────────────────────────
async function demandScore(model: string, component: string): Promise<number> {
  const { data } = await supabase
    .from('demand_stats')
    .select('need_count, have_count')
    .eq('model', model)
    .eq('component', component)
    .single()
  if (!data) return 0.5
  const total = data.need_count + data.have_count
  if (total === 0) return 0.5
  return data.need_count / total // high = lots of demand
}

// ── Compatibility check ────────────────────────────────────────
function compatible(a: Listing, b: Listing): boolean {
  if (a.model !== b.model) return false
  if (a.user_email === b.user_email) return false
  if (a.has_component !== b.needs_component) return false
  if (a.needs_component !== b.has_component) return false
  return true
}

// ── Edge scoring ───────────────────────────────────────────────
async function scoreEdge(a: Listing, b: Listing): Promise<number> {
  const condA = CONDITION_SCORE[a.condition] ?? 0.3
  const condB = CONDITION_SCORE[b.condition] ?? 0.3
  const conditionSim = 1 - Math.abs(condA - condB)

  const locSim = locationSimilarity(a.location, b.location)
  const recency = (recencyScore(a.created_at) + recencyScore(b.created_at)) / 2
  const demand = await demandScore(a.model, a.has_component)

  // weighted score
  return (
    conditionSim * 0.35 +
    locSim       * 0.25 +
    recency      * 0.25 +
    demand       * 0.15
  )
}

// ── Pricing engine ─────────────────────────────────────────────
async function computePricing(
  listingA: Listing,
  listingB: Listing,
  model: string
) {
  // get market price from model_prices or use asking prices
  const { data: mp } = await supabase
    .from('model_prices')
    .select('market_price')
    .eq('model', model)
    .single()

  const marketPrice = mp?.market_price
    ?? ((listingA.asking_price ?? 0) + (listingB.asking_price ?? 0)) / 2

  // component is roughly 30-50% of full device price
  const componentValue = marketPrice * 0.40

  // platform pricing:
  // buyer pays slightly below perceived market (good deal feeling)
  // seller receives slightly above their asking (competitive feeling)
  // platform keeps the margin

  const sellerAskA = listingA.asking_price ?? componentValue * 0.85
  const sellerAskB = listingB.asking_price ?? componentValue * 0.85

  const platformFee = 200 // LKR flat fee per match

  const buyerPriceA = Math.round(Math.min(sellerAskA * 1.08, componentValue * 0.95))
  const buyerPriceB = Math.round(Math.min(sellerAskB * 1.08, componentValue * 0.95))

  const sellerPayoutA = Math.round(buyerPriceA - platformFee)
  const sellerPayoutB = Math.round(buyerPriceB - platformFee)

  return {
    buyer_price_a: buyerPriceA,
    buyer_price_b: buyerPriceB,
    seller_payout_a: sellerPayoutA,
    seller_payout_b: sellerPayoutB,
    platform_fee: platformFee * 2,
    market_reference: Math.round(componentValue),
  }
}

// ── Main matching function for a model group ───────────────────
async function runMatchingForModel(model: string) {
  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .eq('model', model)
    .eq('matched', false)

  if (!listings || listings.length < 2) return { matched: 0 }

  // build candidate edges
  const edges: { score: number; a: Listing; b: Listing }[] = []

  for (let i = 0; i < listings.length; i++) {
    for (let j = i + 1; j < listings.length; j++) {
      const a = listings[i]
      const b = listings[j]
      if (compatible(a, b)) {
        const score = await scoreEdge(a, b)
        edges.push({ score, a, b })
      }
    }
  }

  // sort by score descending
  edges.sort((x, y) => y.score - x.score)

  // greedy matching
  const matchedIds = new Set<string>()
  let matchCount = 0

  for (const edge of edges) {
    if (matchedIds.has(edge.a.id) || matchedIds.has(edge.b.id)) continue

    // compute pricing for this match
    const pricing = await computePricing(edge.a, edge.b, model)

    // store match with pricing
    await supabase.from('matches').insert([{
      listing_a: edge.a.id,
      listing_b: edge.b.id,
      status: 'pending',
      score: edge.score,
      buyer_price_a: pricing.buyer_price_a,
      buyer_price_b: pricing.buyer_price_b,
      seller_payout_a: pricing.seller_payout_a,
      seller_payout_b: pricing.seller_payout_b,
      platform_fee: pricing.platform_fee,
      market_reference: pricing.market_reference,
    }])

    // mark both listings as matched
    await supabase.from('listings').update({ matched: true }).eq('id', edge.a.id)
    await supabase.from('listings').update({ matched: true }).eq('id', edge.b.id)

    matchedIds.add(edge.a.id)
    matchedIds.add(edge.b.id)
    matchCount++
  }

  return { matched: matchCount }
}

// ── API handler ────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const model = body.model

    if (model) {
      // run matching only for this model (triggered by new listing)
      const result = await runMatchingForModel(model)
      return NextResponse.json({ success: true, ...result })
    }

    // global run — match all models
    const { data: models } = await supabase
      .from('listings')
      .select('model')
      .eq('matched', false)

    const uniqueModels = [...new Set(models?.map(m => m.model) ?? [])]
    let totalMatched = 0

    for (const m of uniqueModels) {
      const result = await runMatchingForModel(m)
      totalMatched += result.matched
    }

    return NextResponse.json({ success: true, total_matched: totalMatched })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function GET() {
  // health check
  return NextResponse.json({ status: 'matching engine online' })
}