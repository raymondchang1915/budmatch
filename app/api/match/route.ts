import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

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
}

// score edge between two listings
function scoreEdge(a: Listing, b: Listing): number {
  let score = 0

  // condition similarity (0-1) — closer condition = higher score
  const conditionMap: Record<string, number> = {
    'Working perfectly': 3,
    'Minor issues': 2,
    'Unknown': 1,
  }
  const ca = conditionMap[a.condition] ?? 1
  const cb = conditionMap[b.condition] ?? 1
  const conditionScore = 1 - Math.abs(ca - cb) / 2
  score += conditionScore * 0.5

  // recency — newer listings score higher
  const ageA = Date.now() - new Date(a.created_at).getTime()
  const ageB = Date.now() - new Date(b.created_at).getTime()
  const maxAge = 1000 * 60 * 60 * 24 * 30 // 30 days
  const recencyScore = 1 - Math.min(ageA + ageB, maxAge * 2) / (maxAge * 2)
  score += recencyScore * 0.3

  // price proximity — if both have prices, closer = better
  if (a.asking_price && b.asking_price) {
    const priceDiff = Math.abs(a.asking_price - b.asking_price)
    const avgPrice = (a.asking_price + b.asking_price) / 2
    const priceScore = 1 - Math.min(priceDiff / avgPrice, 1)
    score += priceScore * 0.2
  } else {
    score += 0.1
  }

  return score
}

function compatible(a: Listing, b: Listing): boolean {
  if (a.model !== b.model) return false
  if (a.has_component !== b.needs_component) return false
  if (a.needs_component !== b.has_component) return false
  if (a.user_email === b.user_email) return false
  return true
}

export async function POST() {
  // fetch all unmatched listings
  const { data: listings, error } = await supabase
    .from('listings')
    .select('*')
    .eq('matched', false)

  if (error || !listings) {
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 })
  }

  // build all candidate edges
  const edges: { score: number; a: Listing; b: Listing }[] = []

  for (let i = 0; i < listings.length; i++) {
    for (let j = i + 1; j < listings.length; j++) {
      const a = listings[i]
      const b = listings[j]
      if (compatible(a, b)) {
        const score = scoreEdge(a, b)
        edges.push({ score, a, b })
      }
    }
  }

  // sort edges by score descending
  edges.sort((x, y) => y.score - x.score)

  // greedy matching — pick best non-conflicting edges
  const matchedIds = new Set<string>()
  const matches: { listing_a: string; listing_b: string; score: number }[] = []

  for (const edge of edges) {
    if (!matchedIds.has(edge.a.id) && !matchedIds.has(edge.b.id)) {
      matches.push({
        listing_a: edge.a.id,
        listing_b: edge.b.id,
        score: edge.score,
      })
      matchedIds.add(edge.a.id)
      matchedIds.add(edge.b.id)
    }
  }

  // store matches in db
  for (const match of matches) {
    await supabase.from('matches').insert([{
      listing_a: match.listing_a,
      listing_b: match.listing_b,
      status: 'pending',
    }])
    await supabase.from('listings').update({ matched: true }).eq('id', match.listing_a)
    await supabase.from('listings').update({ matched: true }).eq('id', match.listing_b)
  }

  return NextResponse.json({
    matched: matches.length,
    total_listings: listings.length,
  })
}