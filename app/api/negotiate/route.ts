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

async function getBothListings(matchId: string) {
  const { data: match } = await supabase
    .from('matches').select('listing_a, listing_b').eq('id', matchId).single()
  if (!match) return null
  const { data: sl } = await supabase.from('listings')
    .select('id, user_email, model').eq('id', match.listing_a).single()
  const { data: bl } = await supabase.from('listings')
    .select('id, user_email, model').eq('id', match.listing_b).single()
  if (!sl || !bl) return null
  return { sellerListing: sl, buyerListing: bl }
}

async function notifyDealAgreed(matchId: string, agreedPrice: number) {
  const listings = await getBothListings(matchId)
  if (!listings) return
  const { sellerListing, buyerListing } = listings
  const model = sellerListing.model
  const fee = Math.max(100, Math.round(agreedPrice * 0.05))
  const msg = `Deal confirmed at LKR ${agreedPrice.toLocaleString()} for ${model}. Pay LKR ${fee.toLocaleString()} within 24 hours to unlock chat.`

  await createNotification(sellerListing.user_email, 'deal_agreed', msg, sellerListing.id, matchId)
  await createNotification(buyerListing.user_email, 'deal_agreed', msg, buyerListing.id, matchId)

  const emailHtml = (listingId: string) => `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f5f5f0">
      <div style="background:#fff;border-radius:20px;padding:32px;border:1px solid #e8e8e8">
        <div style="text-align:center;margin-bottom:24px"><img src="https://budmatch.site/icon.svg" alt="BudMatch" style="height:40px;width:auto" /></div>
        <h2 style="color:#111;font-size:22px;margin:0 0 8px;font-weight:600">Deal confirmed! 🤝</h2>
        <p style="color:#666;font-size:14px;line-height:1.6;margin:0 0 16px">
          You and your match agreed on <strong>LKR ${agreedPrice.toLocaleString()}</strong> for the <strong>${model}</strong>.
        </p>
        <div style="background:#f5f5f0;border-radius:12px;padding:16px;margin-bottom:24px">
          <p style="color:#888;font-size:12px;margin:0 0 4px">Your platform fee (10%)</p>
          <p style="color:#111;font-size:20px;font-weight:600;margin:0">LKR ${fee.toLocaleString()}</p>
          <p style="color:#e57373;font-size:11px;margin:6px 0 0">⚠️ Pay within 24 hours or the match will be cancelled.</p>
        </div>
        <a href="${APPURL}/listings/${listingId}"
           style="display:inline-block;background:#111;color:#fff;padding:12px 28px;border-radius:999px;text-decoration:none;font-size:13px;font-weight:500">
          Pay & unlock chat →
        </a>
        <p style="color:#bbb;font-size:11px;margin-top:28px">BudMatch · Sri Lanka</p>
      </div>
    </div>`

  await sendEmail(sellerListing.user_email, `Deal confirmed — ${model}`, emailHtml(sellerListing.id))
  await sendEmail(buyerListing.user_email, `Deal confirmed — ${model}`, emailHtml(buyerListing.id))
}

async function notifyPartnerPaid(matchId: string, paidRole: 'buyer' | 'seller') {
  const listings = await getBothListings(matchId)
  if (!listings) return
  const { sellerListing, buyerListing } = listings
  const notifyEmail = paidRole === 'buyer' ? sellerListing.user_email : buyerListing.user_email
  const notifyListingId = paidRole === 'buyer' ? sellerListing.id : buyerListing.id
  const paidLabel = paidRole === 'buyer' ? 'The buyer' : 'The seller'
  const model = sellerListing.model
  const msg = `${paidLabel} has paid their fee for ${model}. You have 24 hours to pay or the deal is cancelled.`

  await createNotification(notifyEmail, 'partner_paid', msg, notifyListingId, matchId)
  await sendEmail(notifyEmail, `Action needed — ${model}`, `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f5f5f0">
      <div style="background:#fff;border-radius:20px;padding:32px;border:1px solid #e8e8e8">
        <div style="text-align:center;margin-bottom:24px"><img src="https://budmatch.site/icon.svg" alt="BudMatch" style="height:40px;width:auto" /></div>
        <h2 style="color:#111;font-size:22px;margin:0 0 8px">${paidLabel} paid ✓</h2>
        <p style="color:#666;font-size:14px;line-height:1.6;margin:0 0 24px">
          Your match paid their fee for <strong>${model}</strong>.
          Pay yours within <strong>24 hours</strong> or the deal is cancelled.
        </p>
        <a href="${APPURL}/listings/${notifyListingId}"
           style="display:inline-block;background:#111;color:#fff;padding:12px 28px;border-radius:999px;text-decoration:none;font-size:13px">
          Pay now →
        </a>
        <p style="color:#bbb;font-size:11px;margin-top:28px">BudMatch · Sri Lanka</p>
      </div>
    </div>`)
}

async function notifyMatchCancelled(matchId: string) {
  const listings = await getBothListings(matchId)
  if (!listings) return
  const { sellerListing, buyerListing } = listings
  const model = sellerListing.model
  const msg = `Your match for ${model} was cancelled due to payment timeout. You've been put back in the pool.`

  await createNotification(sellerListing.user_email, 'match_cancelled', msg, sellerListing.id, matchId)
  await createNotification(buyerListing.user_email, 'match_cancelled', msg, buyerListing.id, matchId)

  const emailHtml = () => `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f5f5f0">
      <div style="background:#fff;border-radius:20px;padding:32px;border:1px solid #e8e8e8">
        <div style="text-align:center;margin-bottom:24px"><img src="https://budmatch.site/icon.svg" alt="BudMatch" style="height:40px;width:auto" /></div>
        <h2 style="color:#111;font-size:22px;margin:0 0 8px">Match cancelled ❌</h2>
        <p style="color:#666;font-size:14px;line-height:1.6;margin:0 0 24px">
          Your match for the <strong>${model}</strong> was cancelled because the payment window expired.
          You've been put back in the matching pool automatically.
        </p>
        <a href="${APPURL}/browse"
           style="display:inline-block;background:#111;color:#fff;padding:12px 28px;border-radius:999px;text-decoration:none;font-size:13px">
          Browse listings →
        </a>
        <p style="color:#bbb;font-size:11px;margin-top:28px">BudMatch · Sri Lanka</p>
      </div>
    </div>`

  await sendEmail(sellerListing.user_email, `Match cancelled — ${model}`, emailHtml())
  await sendEmail(buyerListing.user_email, `Match cancelled — ${model}`, emailHtml())
}

async function cancelExpiredMatch(matchId: string) {
  const { data: match } = await supabase
    .from('matches')
    .select('*, listingA:listings!listing_a(user_email), listingB:listings!listing_b(user_email)')
    .eq('id', matchId).single()

  if (!match) return
  if (match.status !== 'agreed') return
  if (!match.payment_deadline) return
  if (new Date(match.payment_deadline) > new Date()) return
  if (match.buyer_paid && match.seller_paid) return

  const emailA = (match.listingA as any)?.user_email
  const emailB = (match.listingB as any)?.user_email
  if (emailA && emailB) {
    await supabase.from('blocked_pairs').insert([{
      email_a: emailA, email_b: emailB, reason: 'payment_timeout',
    }])
  }

  await supabase.from('listings').update({ matched: false }).eq('id', match.listing_a)
  await supabase.from('listings').update({ matched: false }).eq('id', match.listing_b)
  await supabase.from('matches').update({ status: 'cancelled' }).eq('id', matchId)

  await notifyMatchCancelled(matchId)
}

export async function POST(req: NextRequest) {
  const { match_id, role, direction, action } = await req.json()

  const { data: match } = await supabase
    .from('matches').select('*').eq('id', match_id).single()
  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })

  // Check expiry
  if (match.status === 'agreed' && match.payment_deadline) {
    await cancelExpiredMatch(match_id)
    const { data: refreshed } = await supabase.from('matches').select('status').eq('id', match_id).single()
    if (refreshed?.status === 'cancelled') {
      return NextResponse.json({ error: 'Match cancelled due to payment timeout' }, { status: 410 })
    }
  }

  // ── Notify payment ──────────────────────────────────────────────────────────
  if (action === 'notify_payment') {
    await notifyPartnerPaid(match_id, role as 'buyer' | 'seller')
    return NextResponse.json({ ok: true })
  }

  // ── Lock offer ──────────────────────────────────────────────────────────────
  if (action === 'lock') {
    const lockField = role === 'buyer' ? 'buyer_locked' : 'seller_locked'
    // Save last locked price when locking
    const lastField = role === 'buyer' ? 'last_buyer_offer' : 'last_seller_offer'
    const currentOffer = role === 'buyer'
      ? (match.buyer_offer ?? match.anchor_price)
      : (match.seller_offer ?? match.anchor_price)

    await supabase.from('matches').update({
      [lockField]: true,
      [lastField]: currentOffer,
      // reset own confirmed flag when re-locking
      [role === 'buyer' ? 'buyer_confirmed' : 'seller_confirmed']: false,
    }).eq('id', match_id)

    const buyerLocked = role === 'buyer' ? true : match.buyer_locked
    const sellerLocked = role === 'seller' ? true : match.seller_locked
    const count = match.renegotiation_count ?? 0

    if (buyerLocked && sellerLocked) {
      const buyerOffer = match.buyer_offer ?? match.anchor_price
      const sellerOffer = match.seller_offer ?? match.anchor_price
      const midpoint = Math.round((buyerOffer + sellerOffer) / 2 / 100) * 100

      // On 3rd renegotiation both sides are forced — auto-confirm
      if (count >= MAX_RENEGOTIATIONS) {
        const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        await supabase.from('matches').update({
          agreed_price: midpoint,
          negotiation_status: 'agreed',
          status: 'agreed',
          payment_deadline: deadline,
          buyer_confirmed: true,
          seller_confirmed: true,
        }).eq('id', match_id)
        await notifyDealAgreed(match_id, midpoint)
        return NextResponse.json({ both_locked: true, forced: true, agreed_price: midpoint })
      }

      return NextResponse.json({
        both_locked: true,
        forced: false,
        midpoint,
        renegotiations_left: MAX_RENEGOTIATIONS - count,
      })
    }

    return NextResponse.json({ locked: true, role })
  }

  // ── Confirm midpoint — BOTH must confirm ────────────────────────────────────
  if (action === 'confirm_midpoint') {
    const confirmField = role === 'buyer' ? 'buyer_confirmed' : 'seller_confirmed'
    await supabase.from('matches').update({ [confirmField]: true }).eq('id', match_id)

    const buyerConfirmed = role === 'buyer' ? true : match.buyer_confirmed
    const sellerConfirmed = role === 'seller' ? true : match.seller_confirmed

    if (buyerConfirmed && sellerConfirmed) {
      const buyerOffer = match.buyer_offer ?? match.anchor_price
      const sellerOffer = match.seller_offer ?? match.anchor_price
      const midpoint = Math.round((buyerOffer + sellerOffer) / 2 / 100) * 100
      const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

      await supabase.from('matches').update({
        agreed_price: midpoint,
        negotiation_status: 'agreed',
        status: 'agreed',
        payment_deadline: deadline,
        buyer_confirmed: false,
        seller_confirmed: false,
      }).eq('id', match_id)

      await notifyDealAgreed(match_id, midpoint)
      return NextResponse.json({ agreed: true, agreed_price: midpoint })
    }

    return NextResponse.json({ confirmed: true, waiting: true })
  }

  // ── Renegotiate — either side clicking this resets BOTH ─────────────────────
  if (action === 'renegotiate') {
    const count = match.renegotiation_count ?? 0
    if (count >= MAX_RENEGOTIATIONS) {
      return NextResponse.json({ error: 'Max renegotiations reached' }, { status: 400 })
    }

    // Reset to last locked prices, not random anchors
    // If no last locked price stored, fall back to current offers
    const resetBuyer = match.last_buyer_offer ?? match.buyer_offer ?? match.anchor_price
    const resetSeller = match.last_seller_offer ?? match.seller_offer ?? match.anchor_price

    await supabase.from('matches').update({
      negotiation_status: 'pending',
      status: 'pending',
      agreed_price: null,
      buyer_locked: false,
      seller_locked: false,
      buyer_confirmed: false,
      seller_confirmed: false,
      buyer_offer: resetBuyer,
      seller_offer: resetSeller,
      renegotiation_count: count + 1,
    }).eq('id', match_id)

    return NextResponse.json({
      renegotiated: true,
      renegotiations_left: MAX_RENEGOTIATIONS - (count + 1),
    })
  }

  // ── Match price (snap to other side's offer) ────────────────────────────────
  if (action === 'match_price') {
    const count = match.renegotiation_count ?? 0
    if (count < 1) {
      return NextResponse.json({ error: 'Match price only available after first renegotiation' }, { status: 400 })
    }

    const otherOffer = role === 'buyer'
      ? (match.seller_offer ?? match.anchor_price)
      : (match.buyer_offer ?? match.anchor_price)

    const myField = role === 'buyer' ? 'buyer_offer' : 'seller_offer'
    const myLockField = role === 'buyer' ? 'buyer_locked' : 'seller_locked'
    const myLastField = role === 'buyer' ? 'last_buyer_offer' : 'last_seller_offer'
    const otherLockField = role === 'buyer' ? 'seller_locked' : 'buyer_locked'

    await supabase.from('matches').update({
      [myField]: otherOffer,
      [myLockField]: true,
      [myLastField]: otherOffer,
      [role === 'buyer' ? 'buyer_confirmed' : 'seller_confirmed']: false,
    }).eq('id', match_id)

    if (match[otherLockField]) {
      const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      await supabase.from('matches').update({
        agreed_price: otherOffer,
        negotiation_status: 'agreed',
        status: 'agreed',
        payment_deadline: deadline,
      }).eq('id', match_id)
      await notifyDealAgreed(match_id, otherOffer)
      return NextResponse.json({ agreed: true, agreed_price: otherOffer })
    }

    return NextResponse.json({ matched_price: true, offer: otherOffer })
  }

  // ── Regular move +/− ────────────────────────────────────────────────────────
  if (match.negotiation_status === 'agreed') {
    return NextResponse.json({ error: 'Already agreed' }, { status: 400 })
  }

  const field = role === 'buyer' ? 'buyer_offer' : 'seller_offer'
  const lockField = role === 'buyer' ? 'buyer_locked' : 'seller_locked'
  const anchor = match.anchor_price
  const spread = Math.max(300, Math.round(anchor * 0.20))
  const current = match[field] ?? (role === 'buyer' ? anchor - spread : anchor + spread)

  const newOffer = direction === 'up'
    ? Math.min(current + 100, match.ladder_max)
    : Math.max(current - 100, match.ladder_min)

  await supabase.from('matches').update({
    [field]: newOffer,
    [lockField]: false,
    [role === 'buyer' ? 'buyer_confirmed' : 'seller_confirmed']: false,
  }).eq('id', match_id)

  return NextResponse.json({
    agreed: false,
    buyer_offer: role === 'buyer' ? newOffer : match.buyer_offer,
    seller_offer: role === 'seller' ? newOffer : match.seller_offer,
  })
}