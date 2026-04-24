import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function sendEmail(to: string, subject: string, html: string) {
  try {
    await supabase.functions.invoke('send-email', {
      body: { to, subject, html },
    })
  } catch (e) {
    console.error('Email error:', e)
  }
}

async function createNotification(
  userEmail: string,
  type: string,
  message: string,
  listingId: string,
  matchId: string
) {
  await supabase.from('notifications').insert([{
    user_email: userEmail,
    type,
    message,
    listing_id: listingId,
    match_id: matchId,
    read: false,
  }])
}

async function notifyDealAgreed(matchId: string, agreedPrice: number) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://budmatch.vercel.app'

  // Get both listings to find emails
  const { data: match } = await supabase
    .from('matches')
    .select('listing_a, listing_b')
    .eq('id', matchId)
    .single()

  if (!match) return

  const { data: sellerListing } = await supabase
    .from('listings')
    .select('id, user_email, model')
    .eq('id', match.listing_a)
    .single()

  const { data: buyerListing } = await supabase
    .from('listings')
    .select('id, user_email, model')
    .eq('id', match.listing_b)
    .single()

  if (!sellerListing || !buyerListing) return

  const model = sellerListing.model
  const fee = Math.max(100, Math.round(agreedPrice * 0.05))

  const message = `Deal agreed at LKR ${agreedPrice.toLocaleString()} for ${model}. Pay LKR ${fee.toLocaleString()} to unlock chat.`

  // In-app notifications
  await createNotification(sellerListing.user_email, 'deal_agreed', message, sellerListing.id, matchId)
  await createNotification(buyerListing.user_email, 'deal_agreed', message, buyerListing.id, matchId)

  // Emails
  const emailHtml = (listingId: string) => `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f5f5f0">
      <div style="background:#fff;border-radius:20px;padding:32px;border:1px solid #e8e8e8">
        <div style="width:48px;height:48px;background:#111;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:20px">
          <span style="color:#22c55e;font-size:20px">🤝</span>
        </div>
        <h2 style="color:#111;font-size:22px;margin:0 0 8px;font-weight:600">Deal agreed!</h2>
        <p style="color:#666;font-size:14px;line-height:1.6;margin:0 0 16px">
          You and your match have agreed on <strong>LKR ${agreedPrice.toLocaleString()}</strong> for the <strong>${model}</strong>.
        </p>
        <div style="background:#f5f5f0;border-radius:12px;padding:16px;margin-bottom:24px">
          <p style="color:#888;font-size:12px;margin:0 0 4px">Your platform fee (5%)</p>
          <p style="color:#111;font-size:20px;font-weight:600;margin:0">LKR ${fee.toLocaleString()}</p>
          <p style="color:#aaa;font-size:11px;margin:6px 0 0">Pay this to unlock chat and complete the trade.</p>
        </div>
        <a href="${appUrl}/listings/${listingId}"
           style="display:inline-block;background:#111;color:#fff;padding:12px 28px;border-radius:999px;text-decoration:none;font-size:13px;font-weight:500">
          Pay & unlock chat →
        </a>
        <p style="color:#bbb;font-size:11px;margin-top:28px">BudMatch · Sri Lanka</p>
      </div>
    </div>
  `

  await sendEmail(sellerListing.user_email, `Deal agreed — ${model}`, emailHtml(sellerListing.id))
  await sendEmail(buyerListing.user_email, `Deal agreed — ${model}`, emailHtml(buyerListing.id))
}

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

    // Fire notifications and emails
    await notifyDealAgreed(match_id, agreedPrice)

    return NextResponse.json({ agreed: true, agreed_price: agreedPrice })
  }

  return NextResponse.json({
    agreed: false,
    buyer_offer: buyerOffer,
    seller_offer: sellerOffer,
  })
}