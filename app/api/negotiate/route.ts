import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const MAX_RENEGOTIATIONS = 3
const APPURL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://budmatch.vercel.app'

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

async function getBothListings(matchId: string) {
  const { data: match } = await supabase
    .from('matches').select('listing_a, listing_b').eq('id', matchId).single()
  if (!match) return null

  const { data: sellerListing } = await supabase
    .from('listings').select('id, user_email, model').eq('id', match.listing_a).single()
  const { data: buyerListing } = await supabase
    .from('listings').select('id, user_email, model').eq('id', match.listing_b).single()

  if (!sellerListing || !buyerListing) return null
  return { sellerListing, buyerListing }
}

async function notifyDealAgreed(matchId: string, agreedPrice: number) {
  const listings = await getBothListings(matchId)
  if (!listings) return
  const { sellerListing, buyerListing } = listings

  const model = sellerListing.model
  const fee = Math.max(100, Math.round(agreedPrice * 0.05))
  const message = `Deal agreed at LKR ${agreedPrice.toLocaleString()} for ${model}. Pay LKR ${fee.toLocaleString()} to unlock chat.`

  await createNotification(sellerListing.user_email, 'deal_agreed', message, sellerListing.id, matchId)
  await createNotification(buyerListing.user_email, 'deal_agreed', message, buyerListing.id, matchId)

  const emailHtml = (listingId: string) => `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f5f5f0">
      <div style="background:#fff;border-radius:20px;padding:32px;border:1px solid #e8e8e8">
        <h2 style="color:#111;font-size:22px;margin:0 0 8px;font-weight:600">Deal agreed! 🤝</h2>
        <p style="color:#666;font-size:14px;line-height:1.6;margin:0 0 16px">
          You and your match agreed on <strong>LKR ${agreedPrice.toLocaleString()}</strong> for the <strong>${model}</strong>.
        </p>
        <div style="background:#f5f5f0;border-radius:12px;padding:16px;margin-bottom:24px">
          <p style="color:#888;font-size:12px;margin:0 0 4px">Your platform fee (5%)</p>
          <p style="color:#111;font-size:20px;font-weight:600;margin:0">LKR ${fee.toLocaleString()}</p>
          <p style="color:#e57373;font-size:11px;margin:6px 0 0">⚠️ Pay within 24 hours or the match will be cancelled.</p>
        </div>
        <a href="${APPURL}/listings/${listingId}"
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

async function notifyPartnerPaid(matchId: string, paidRole: 'buyer' | 'seller') {
  const listings = await getBothListings(matchId)
  if (!listings) return
  const { sellerListing, buyerListing } = listings

  // Notify the OTHER party
  const notifyEmail = paidRole === 'buyer' ? sellerListing.user_email : buyerListing.user_email
  const notifyListingId = paidRole === 'buyer' ? sellerListing.id : buyerListing.id
  const paidLabel = paidRole === 'buyer' ? 'The buyer' : 'The seller'
  const model = sellerListing.model

  const message = `${paidLabel} has paid their fee for ${model}. You have 24 hours to pay yours or the match will be cancelled.`

  await createNotification(notifyEmail, 'partner_paid', message, notifyListingId, matchId)

  const emailHtml = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f5f5f0">
      <div style="background:#fff;border-radius:20px;padding:32px;border:1px solid #e8e8e8">
        <h2 style="color:#111;font-size:22px;margin:0 0 8px;font-weight:600">${paidLabel} paid ✓</h2>
        <p style="color:#666;font-size:14px;line-height:1.6;margin:0 0 16px">
          Your match paid their platform fee for the <strong>${model}</strong>.
          Pay yours within <strong>24 hours</strong> to unlock chat — otherwise the deal is cancelled.
        </p>
        <a href="${APPURL}/listings/${notifyListingId}"
           style="display:inline-block;background:#111;color:#fff;padding:12px 28px;border-radius:999px;text-decoration:none;font-size:13px;font-weight:500">
          Pay now →
        </a>
        <p style="color:#bbb;font-size:11px;margin-top:28px">BudMatch · Sri Lanka</p>
      </div>
    </div>
  `

  await sendEmail(notifyEmail, `Action needed — ${model}`, emailHtml)
}

export async function POST(req: NextRequest) {
  const { match_id, role, direction, action } = await req.json()
  // action = 'negotiate' (default) | 'renegotiate' | 'notify_payment'

  const { data: match } = await supabase
    .from('matches').select('*').eq('id', match_id).single()

  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })

  // ── Notify payment (called from the ID page when one side pays) ──
  if (action === 'notify_payment') {
    await notifyPartnerPaid(match_id, role as 'buyer' | 'seller')
    return NextResponse.json({ ok: true })
  }

  // ── Renegotiate — unlock the bar (max 3 times) ───────────────────
  if (action === 'renegotiate') {
    if (match.negotiation_status !== 'agreed') {
      return NextResponse.json({ error: 'Not in agreed state' }, { status: 400 })
    }
    const count = match.renegotiation_count ?? 0
    if (count >= MAX_RENEGOTIATIONS) {
      return NextResponse.json({ error: 'Max renegotiations reached' }, { status: 400 })
    }

    // Reset to offset anchors so there's room to move
    const anchor = match.anchor_price
    await supabase.from('matches').update({
      negotiation_status: 'pending',
      status: 'pending',
      agreed_price: null,
      buyer_offer: anchor - 300,
      seller_offer: anchor + 300,
      renegotiation_count: count + 1,
    }).eq('id', match_id)

    return NextResponse.json({
      renegotiated: true,
      renegotiations_left: MAX_RENEGOTIATIONS - (count + 1),
    })
  }

  // ── Regular negotiate ────────────────────────────────────────────
  if (match.negotiation_status === 'agreed') {
    return NextResponse.json({ error: 'Already agreed — renegotiate first' }, { status: 400 })
  }

  const step = 100
  const field = role === 'buyer' ? 'buyer_offer' : 'seller_offer'
  const current = match[field] ?? (role === 'buyer' ? match.anchor_price - 300 : match.anchor_price + 300)

  const newOffer = direction === 'up'
    ? Math.min(current + step, match.ladder_max)
    : Math.max(current - step, match.ladder_min)

  await supabase.from('matches').update({ [field]: newOffer }).eq('id', match_id)

  const buyerOffer = role === 'buyer' ? newOffer : (match.buyer_offer ?? match.anchor_price - 300)
  const sellerOffer = role === 'seller' ? newOffer : (match.seller_offer ?? match.anchor_price + 300)

  // Auto-agree when offers meet
  if (buyerOffer >= sellerOffer) {
    const agreedPrice = Math.round((buyerOffer + sellerOffer) / 2 / 100) * 100

    // Set 24 hour payment deadline
    const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    await supabase.from('matches').update({
      agreed_price: agreedPrice,
      negotiation_status: 'agreed',
      status: 'agreed',
      payment_deadline: deadline,
    }).eq('id', match_id)

    await notifyDealAgreed(match_id, agreedPrice)
    return NextResponse.json({ agreed: true, agreed_price: agreedPrice })
  }

  return NextResponse.json({ agreed: false, buyer_offer: buyerOffer, seller_offer: sellerOffer })
}