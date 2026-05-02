import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const APPURL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://budmatch.site'

async function sendEmail(to: string, subject: string, html: string) {
  try {
    await supabase.functions.invoke('send-email', { body: { to, subject, html } })
  } catch (e) { console.error('Email error:', e) }
}

async function createNotification(
  userEmail: string, type: string, message: string,
  listingId: string, matchId?: string
) {
  await supabase.from('notifications').insert([{
    user_email: userEmail, type, message,
    listing_id: listingId, match_id: matchId ?? null, read: false,
  }])
}

export async function POST(req: NextRequest) {
  const { action, listing_id, sender_email, amount, offer_id } = await req.json()

  // ── Send offer ──────────────────────────────────────────────────────────────
  if (action === 'send') {
    if (!listing_id || !sender_email || !amount) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const { data: listing } = await supabase
      .from('listings').select('*').eq('id', listing_id).single()

    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    if (listing.user_email === sender_email) {
      return NextResponse.json({ error: 'Cannot offer on your own listing' }, { status: 400 })
    }

    // Check for duplicate pending offer
    const { data: existing } = await supabase
      .from('offers')
      .select('id')
      .eq('listing_id', listing_id)
      .eq('sender_email', sender_email)
      .eq('status', 'pending')
      .single()

    if (existing) {
      return NextResponse.json({ error: 'You already have a pending offer on this listing' }, { status: 400 })
    }

    // Check if sender already has an active match for the same model
    const { data: senderListings } = await supabase
      .from('listings')
      .select('id, matched')
      .eq('user_email', sender_email)
      .eq('model', listing.model)
      .eq('matched', true)

    if (senderListings && senderListings.length > 0) {
      return NextResponse.json({
        error: 'You already have an active match for this model. Complete or cancel it before making an offer.'
      }, { status: 400 })
    }

    const { data: offer } = await supabase.from('offers').insert([{
      listing_id,
      sender_email,
      amount,
      status: 'pending',
    }]).select().single()

    // Notify listing owner
    await createNotification(
      listing.user_email,
      'new_offer',
      `New offer of LKR ${Number(amount).toLocaleString()} on your ${listing.model} listing.`,
      listing_id
    )

    await sendEmail(listing.user_email, `New offer on your ${listing.model}`, `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f5f5f0">
        <div style="background:#fff;border-radius:20px;padding:32px;border:1px solid #e8e8e8">
          <div style="text-align:center;margin-bottom:24px"><img src="https://budmatch.site/icon.svg" alt="BudMatch" style="height:40px;width:auto" /></div>
          <h2 style="color:#111;font-size:22px;margin:0 0 8px;font-weight:600">New offer received 💰</h2>
          <p style="color:#666;font-size:14px;line-height:1.6;margin:0 0 16px">
            Someone made an offer of <strong>LKR ${Number(amount).toLocaleString()}</strong> on your <strong>${listing.model}</strong> listing.
          </p>
          <a href="${APPURL}/profile"
             style="display:inline-block;background:#111;color:#fff;padding:12px 28px;border-radius:999px;text-decoration:none;font-size:13px;font-weight:500">
            View offer →
          </a>
          <p style="color:#bbb;font-size:11px;margin-top:28px">BudMatch · Sri Lanka</p>
        </div>
      </div>`)

    return NextResponse.json({ ok: true, offer })
  }

  // ── Accept offer ────────────────────────────────────────────────────────────
  if (action === 'accept') {
    const { data: offer } = await supabase
      .from('offers').select('*').eq('id', offer_id).single()
    if (!offer) return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    if (offer.status !== 'pending') return NextResponse.json({ error: 'Offer no longer pending' }, { status: 400 })

    const { data: listing } = await supabase
      .from('listings').select('*').eq('id', offer.listing_id).single()
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

    // Create match with agreed price — no negotiation needed
    const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const agreedPrice = Number(offer.amount)
    const fee = Math.max(100, Math.round(agreedPrice * 0.05))

    const { data: newMatch } = await supabase.from('matches').insert([{
      listing_a: listing.id,  // seller listing
      listing_b: listing.id,  // buyer has no listing — use same, distinguished by email
      status: 'agreed',
      anchor_price: agreedPrice,
      market_reference: agreedPrice,
      ladder_min: agreedPrice,
      ladder_max: agreedPrice,
      buyer_offer: agreedPrice,
      seller_offer: agreedPrice,
      agreed_price: agreedPrice,
      negotiation_status: 'agreed',
      buyer_locked: true,
      seller_locked: true,
      buyer_confirmed: true,
      seller_confirmed: true,
      switch_suggested: false,
      renegotiation_count: 0,
      payment_deadline: deadline,
      offer_match: true,
      buyer_email: offer.sender_email,
      seller_email: listing.user_email,
    }]).select().single()

    if (!newMatch) return NextResponse.json({ error: 'Failed to create match' }, { status: 500 })

    // Mark offer as accepted
    await supabase.from('offers').update({ status: 'accepted', match_id: newMatch.id }).eq('id', offer_id)

    // Decline all other pending offers on this listing
    await supabase.from('offers')
      .update({ status: 'declined' })
      .eq('listing_id', offer.listing_id)
      .eq('status', 'pending')
      .neq('id', offer_id)

    // Mark listing as matched
    await supabase.from('listings').update({ matched: true }).eq('id', listing.id)

    // Notify both parties
    const msg = `Your offer of LKR ${agreedPrice.toLocaleString()} for ${listing.model} was accepted! Pay LKR ${fee.toLocaleString()} to unlock chat.`

    await createNotification(offer.sender_email, 'offer_accepted', msg, listing.id, newMatch.id)
    await createNotification(listing.user_email, 'offer_accepted', `You accepted an offer of LKR ${agreedPrice.toLocaleString()} for your ${listing.model}.`, listing.id, newMatch.id)

    const emailHtml = (isbuyer: boolean) => `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f5f5f0">
        <div style="background:#fff;border-radius:20px;padding:32px;border:1px solid #e8e8e8">
          <div style="text-align:center;margin-bottom:24px"><img src="https://budmatch.site/icon.svg" alt="BudMatch" style="height:40px;width:auto" /></div>
          <h2 style="color:#111;font-size:22px;margin:0 0 8px;font-weight:600">Offer accepted! 🎉</h2>
          <p style="color:#666;font-size:14px;line-height:1.6;margin:0 0 16px">
            ${isbuyer ? 'Your offer was accepted' : 'You accepted the offer'} for <strong>${listing.model}</strong> at <strong>LKR ${agreedPrice.toLocaleString()}</strong>.
          </p>
          <div style="background:#f5f5f0;border-radius:12px;padding:16px;margin-bottom:24px">
            <p style="color:#888;font-size:12px;margin:0 0 4px">Your platform fee (5%)</p>
            <p style="color:#111;font-size:20px;font-weight:600;margin:0">LKR ${fee.toLocaleString()}</p>
            <p style="color:#e57373;font-size:11px;margin:6px 0 0">⚠️ Pay within 24 hours or the deal is cancelled.</p>
          </div>
          <a href="${APPURL}/offer-match/${newMatch.id}"
             style="display:inline-block;background:#111;color:#fff;padding:12px 28px;border-radius:999px;text-decoration:none;font-size:13px;font-weight:500">
            Pay & unlock chat →
          </a>
          <p style="color:#bbb;font-size:11px;margin-top:28px">BudMatch · Sri Lanka</p>
        </div>
      </div>`

    await sendEmail(offer.sender_email, `Offer accepted — ${listing.model}`, emailHtml(true))
    await sendEmail(listing.user_email, `Offer accepted — ${listing.model}`, emailHtml(false))

    return NextResponse.json({ ok: true, match_id: newMatch.id })
  }

  // ── Decline offer ───────────────────────────────────────────────────────────
  if (action === 'decline') {
    const { data: offer } = await supabase
      .from('offers').select('*, listings(model)').eq('id', offer_id).single()
    if (!offer) return NextResponse.json({ error: 'Offer not found' }, { status: 404 })

    await supabase.from('offers').update({ status: 'declined' }).eq('id', offer_id)

    const model = (offer.listings as any)?.model ?? 'your listing'
    await createNotification(
      offer.sender_email, 'offer_declined',
      `Your offer on ${model} was declined.`,
      offer.listing_id
    )

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
