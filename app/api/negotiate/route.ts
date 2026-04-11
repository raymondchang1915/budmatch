import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  const { match_id, role, direction } = await req.json()

  const { data: match } = await supabase
    .from('matches')
    .select('*')
    .eq('id', match_id)
    .single()

  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  if (match.negotiation_status === 'agreed') {
    return NextResponse.json({ error: 'Already agreed' }, { status: 400 })
  }

  const step = 100
  const field = role === 'buyer' ? 'buyer_offer' : 'seller_offer'
  const current = match[field] ?? match.anchor_price

  const newOffer = direction === 'up'
    ? Math.min(current + step, match.ladder_max)
    : Math.max(current - step, match.ladder_min)

  await supabase
    .from('matches')
    .update({ [field]: newOffer })
    .eq('id', match_id)

  const buyerOffer = role === 'buyer' ? newOffer : (match.buyer_offer ?? match.anchor_price)
  const sellerOffer = role === 'seller' ? newOffer : (match.seller_offer ?? match.anchor_price)

  // auto clear when offers overlap
  if (buyerOffer >= sellerOffer) {
    const agreedPrice = Math.round((buyerOffer + sellerOffer) / 2 / 100) * 100
    await supabase
      .from('matches')
      .update({
        agreed_price: agreedPrice,
        negotiation_status: 'agreed',
        status: 'agreed',
      })
      .eq('id', match_id)

    return NextResponse.json({ agreed: true, agreed_price: agreedPrice })
  }

  return NextResponse.json({
    agreed: false,
    buyer_offer: buyerOffer,
    seller_offer: sellerOffer,
  })
}