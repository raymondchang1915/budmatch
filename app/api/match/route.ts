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
  listing_type: string   // 'buying' | 'selling' | 'both'
  condition: string
  location: string
  user_email: string
  asking_price: number | null
  year_of_purchase: number | null
  created_at: string
  matched: boolean
}

const CONDITION_SCORE: Record<string, number> = {
  'Working perfectly': 1.0,
  'Usable': 0.6,
  'Unknown': 0.3,
}

async function computePrice(listing: Listing, marketPrice: number): Promise<number> {
  const condition = CONDITION_SCORE[listing.condition] ?? 0.3
  const currentYear = new Date().getFullYear()
  const age = listing.year_of_purchase ? currentYear - listing.year_of_purchase : 2
  const ageFactor = Math.max(0.4, 1 - age * 0.12)

  const { data } = await supabase
    .from('demand_stats')
    .select('need_count, have_count')
    .eq('model', listing.model)
    .eq('component', listing.has_component)
    .single()

  const needCount = data?.need_count ?? 0
  const haveCount = data?.have_count ?? 1
  const demandRatio = needCount / (needCount + haveCount)
  const demandFactor = 0.3 + demandRatio * 0.3

  const rawPrice = marketPrice * condition * ageFactor * demandFactor
  const minPrice = marketPrice * 0.10
  const maxPrice = marketPrice * 0.60
  return Math.round(Math.max(minPrice, Math.min(maxPrice, rawPrice)) / 100) * 100
}

function scoreEdge(a: Listing, b: Listing): number {
  const condA = CONDITION_SCORE[a.condition] ?? 0.3
  const condB = CONDITION_SCORE[b.condition] ?? 0.3
  const conditionSim = 1 - Math.abs(condA - condB)
  const cityA = a.location?.toLowerCase().split(',')[0].trim() ?? ''
  const cityB = b.location?.toLowerCase().split(',')[0].trim() ?? ''
  const locSim = cityA && cityB && cityA === cityB ? 1.0 : 0.2
  const ageA = (Date.now() - new Date(a.created_at).getTime()) / 86400000
  const ageB = (Date.now() - new Date(b.created_at).getTime()) / 86400000
  const recency = Math.max(0, 1 - (ageA + ageB) / 60)
  const caseBonus = (a.has_case || b.has_case) ? 0.1 : 0
  return conditionSim * 0.40 + locSim * 0.30 + recency * 0.20 + caseBonus * 0.10
}

function compatible(a: Listing, b: Listing): boolean {
  if (a.model !== b.model) return false
  if (a.user_email === b.user_email) return false
  return (
    (a.has_component === 'Left bud' && b.has_component === 'Right bud') ||
    (a.has_component === 'Right bud' && b.has_component === 'Left bud')
  )
}

// ── Assign buyer/seller roles within a compatible pair ─────────
// Returns { buyer, seller } or null if neither wants to trade yet
function assignRoles(
  a: Listing,
  b: Listing
): { buyer: Listing; seller: Listing; switchSuggested: boolean } | null {
  const aType = a.listing_type  // 'buying' | 'selling' | 'both'
  const bType = b.listing_type

  // Clear case: one buying, one selling
  if (aType === 'buying' && bType === 'selling') return { buyer: a, seller: b, switchSuggested: false }
  if (aType === 'selling' && bType === 'buying') return { buyer: b, seller: a, switchSuggested: false }

  // Ambiguous cases: both buying, both selling, one or both 'both'
  // Whoever has higher asking price becomes buyer (willing to pay more)
  // If prices equal or null, fall back to whoever listed first
  const priceA = a.asking_price ?? 0
  const priceB = b.asking_price ?? 0

  if (priceA >= priceB) {
    return { buyer: a, seller: b, switchSuggested: true }
  } else {
    return { buyer: b, seller: a, switchSuggested: true }
  }
}

async function runMatchingForModel(model: string) {
  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .eq('model', model)
    .eq('matched', false)

  if (!listings || listings.length < 2) return { matched: 0 }

  const { data: mp } = await supabase
    .from('model_prices')
    .select('market_price')
    .eq('model', model)
    .single()
  const marketPrice = mp?.market_price ?? 25000

  // Build compatible edges
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

  // Sort best matches first
  edges.sort((x, y) => y.score - x.score)

  const matchedIds = new Set<string>()
  let matchCount = 0

  for (const edge of edges) {
    if (matchedIds.has(edge.a.id) || matchedIds.has(edge.b.id)) continue

    const roles = assignRoles(edge.a, edge.b)
    if (!roles) continue

    const { buyer, seller, switchSuggested } = roles

    const buyerPrice = await computePrice(buyer, marketPrice)
    const sellerPrice = await computePrice(seller, marketPrice)
    const anchorPrice = Math.round((buyerPrice + sellerPrice) / 2)

    await supabase.from('matches').insert([{
      listing_a: seller.id,   // listing_a is always seller
      listing_b: buyer.id,    // listing_b is always buyer
      status: 'pending',
      score: edge.score,
      anchor_price: anchorPrice,
      market_reference: Math.round(marketPrice * 0.40),
      ladder_min: anchorPrice - 300,
      ladder_max: anchorPrice + 300,
      buyer_offer: anchorPrice,
      seller_offer: anchorPrice,
      negotiation_status: 'pending',
      switch_suggested: switchSuggested,
    }])

    await supabase.from('listings').update({ matched: true }).eq('id', buyer.id)
    await supabase.from('listings').update({ matched: true }).eq('id', seller.id)

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