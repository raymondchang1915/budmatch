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
  has_case: boolean
  needs_component: string
  listing_type: string
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

async function sendEmail(to: string, subject: string, html: string) {
  try {
    await supabase.functions.invoke('send-email', { body: { to, subject, html } })
  } catch (e) { console.error('Email error:', e) }
}

async function createNotification(
  userEmail: string, type: string, message: string,
  listingId: string, matchId: string
) {
  await supabase.from('notifications').insert([{
    user_email: userEmail, type, message,
    listing_id: listingId, match_id: matchId, read: false,
  }])
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

  // Price is for ONE BUD — 50% of market as base
  const halfMarket = marketPrice * 0.50
  const rawPrice = halfMarket * condition * ageFactor * (0.7 + demandFactor * 0.6)

  // Cap: min 10% of market, max 70% of market (for a single bud)
  const minPrice = marketPrice * 0.10
  const maxPrice = marketPrice * 0.70
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

function assignRoles(a: Listing, b: Listing) {
  const aType = a.listing_type
  const bType = b.listing_type
  if (aType === 'buying' && bType === 'selling') return { buyer: a, seller: b, switchSuggested: false }
  if (aType === 'selling' && bType === 'buying') return { buyer: b, seller: a, switchSuggested: false }
  const priceA = a.asking_price ?? 0
  const priceB = b.asking_price ?? 0
  return priceA >= priceB
    ? { buyer: a, seller: b, switchSuggested: true }
    : { buyer: b, seller: a, switchSuggested: true }
}

async function isBlocked(emailA: string, emailB: string): Promise<boolean> {
  const { data } = await supabase
    .from('blocked_pairs')
    .select('id')
    .or(`and(email_a.eq.${emailA},email_b.eq.${emailB}),and(email_a.eq.${emailB},email_b.eq.${emailA})`)
    .limit(1)
  return (data?.length ?? 0) > 0
}

async function notifyMatch(
  buyer: Listing, seller: Listing, matchId: string, anchorPrice: number
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://budmatch.vercel.app'
  const model = buyer.model

  await createNotification(
    buyer.user_email, 'matched',
    `You've been matched for your ${model}! Head over to negotiate a price.`,
    buyer.id, matchId
  )
  await createNotification(
    seller.user_email, 'matched',
    `You've been matched for your ${model}! Head over to negotiate a price.`,
    seller.id, matchId
  )

  const emailHtml = (role: string, listingId: string) => `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f5f5f0">
      <div style="background:#fff;border-radius:20px;padding:32px;border:1px solid #e8e8e8">
        <h2 style="color:#111;font-size:22px;margin:0 0 8px">You've got a match! ⚡</h2>
        <p style="color:#666;font-size:14px;line-height:1.6;margin:0 0 24px">
          Your <strong>${model}</strong> listing matched. You're the <strong>${role}</strong>.
          Starting price around <strong>LKR ${anchorPrice.toLocaleString()}</strong> — head over to negotiate.
        </p>
        <a href="${appUrl}/listings/${listingId}"
           style="display:inline-block;background:#111;color:#fff;padding:12px 28px;border-radius:999px;text-decoration:none;font-size:13px;font-weight:500">
          View match →
        </a>
        <p style="color:#bbb;font-size:11px;margin-top:28px">BudMatch · Sri Lanka</p>
      </div>
    </div>`

  await sendEmail(buyer.user_email, `Match found — ${model}`, emailHtml('buyer', buyer.id))
  await sendEmail(seller.user_email, `Match found — ${model}`, emailHtml('seller', seller.id))
}

async function runMatchingForModel(model: string) {
  const { data: listings } = await supabase
    .from('listings').select('*').eq('model', model).eq('matched', false)

  if (!listings || listings.length < 2) return { matched: 0 }

  const { data: mp } = await supabase
    .from('model_prices').select('market_price').eq('model', model).single()
  const marketPrice = mp?.market_price ?? 25000

  const edges: { score: number; a: Listing; b: Listing }[] = []
  for (let i = 0; i < listings.length; i++) {
    for (let j = i + 1; j < listings.length; j++) {
      if (!compatible(listings[i], listings[j])) continue
      // Skip blocked pairs
      const blocked = await isBlocked(listings[i].user_email, listings[j].user_email)
      if (blocked) continue
      edges.push({
        score: scoreEdge(listings[i], listings[j]),
        a: listings[i], b: listings[j],
      })
    }
  }

  edges.sort((x, y) => y.score - x.score)

  const matchedIds = new Set<string>()
  let matchCount = 0

  for (const edge of edges) {
    if (matchedIds.has(edge.a.id) || matchedIds.has(edge.b.id)) continue

    const { buyer, seller, switchSuggested } = assignRoles(edge.a, edge.b)

    const buyerPrice = await computePrice(buyer, marketPrice)
    const sellerPrice = await computePrice(seller, marketPrice)
    const anchorPrice = Math.round((buyerPrice + sellerPrice) / 2 / 100) * 100

    // Ladder spread: 30% of anchor, min 300, max 25000
    const spread = Math.min(25000, Math.max(300, Math.round(anchorPrice * 0.30)))

    const { data: newMatch } = await supabase.from('matches').insert([{
      listing_a: seller.id,
      listing_b: buyer.id,
      status: 'pending',
      score: edge.score,
      anchor_price: anchorPrice,
      market_reference: Math.round(marketPrice * 0.50),
      ladder_min: Math.max(100, anchorPrice - spread),
      ladder_max: anchorPrice + spread,
      // Start buyer below anchor, seller above — room to negotiate
      buyer_offer: Math.max(100, anchorPrice - spread),
      seller_offer: anchorPrice + spread,
      buyer_locked: false,
      seller_locked: false,
      negotiation_status: 'pending',
      switch_suggested: switchSuggested,
      renegotiation_count: 0,
    }]).select().single()

    await supabase.from('listings').update({ matched: true }).eq('id', buyer.id)
    await supabase.from('listings').update({ matched: true }).eq('id', seller.id)

    if (newMatch) {
      await notifyMatch(buyer, seller, newMatch.id, anchorPrice)
    }

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
      .from('listings').select('model').eq('matched', false)

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