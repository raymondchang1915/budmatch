import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const PAYHERE_MERCHANT_SECRET = process.env.PAYHERE_MERCHANT_SECRET!
const APPURL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://budmatch.site'

function verifyHash(params: Record<string, string>): boolean {
  const secretHash = crypto.createHash('md5').update(PAYHERE_MERCHANT_SECRET).digest('hex').toUpperCase()
  const raw = `${params.merchant_id}${params.order_id}${params.payhere_amount}${params.payhere_currency}${params.status_code}${secretHash}`
  return crypto.createHash('md5').update(raw).digest('hex').toUpperCase() === params.md5sig
}

async function sendEmail(to: string, subject: string, html: string) {
  try {
    await supabase.functions.invoke('send-email', { body: { to, subject, html } })
  } catch (e) { console.error('Email error:', e) }
}

async function notifyPartnerPaid(matchId: string, paidRole: 'buyer' | 'seller') {
  const { data: match } = await supabase
    .from('matches').select('listing_a, listing_b, offer_match, buyer_email, seller_email')
    .eq('id', matchId).single()
  if (!match) return

  let buyerEmail: string | undefined
  let sellerEmail: string | undefined
  let model = 'Earbud'
  let listingId = match.listing_a

  if (match.offer_match) {
    buyerEmail = match.buyer_email
    sellerEmail = match.seller_email
    const { data: l } = await supabase.from('listings').select('model').eq('id', match.listing_a).single()
    if (l) model = l.model
  } else {
    const { data: sl } = await supabase.from('listings').select('user_email, model').eq('id', match.listing_a).single()
    const { data: bl } = await supabase.from('listings').select('user_email').eq('id', match.listing_b).single()
    sellerEmail = sl?.user_email
    buyerEmail = bl?.user_email
    if (sl) model = sl.model
  }

  const notifyEmail = paidRole === 'buyer' ? sellerEmail : buyerEmail
  const paidLabel = paidRole === 'buyer' ? 'The buyer' : 'The seller'

  if (!notifyEmail) return

  await supabase.from('notifications').insert([{
    user_email: notifyEmail,
    type: 'partner_paid',
    message: `${paidLabel} has paid their fee for ${model}. You have 24 hours to pay or the deal is cancelled.`,
    listing_id: listingId,
    match_id: matchId,
    read: false,
  }])

  await sendEmail(notifyEmail, `Action needed — ${model}`, `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f5f5f0">
      <div style="background:#fff;border-radius:20px;padding:32px;border:1px solid #e8e8e8">
        <div style="text-align:center;margin-bottom:24px"><img src="https://budmatch.site/icon.svg" alt="BudMatch" style="height:40px;width:auto" /></div>
        <h2 style="color:#111;font-size:22px;margin:0 0 8px">${paidLabel} paid ✓</h2>
        <p style="color:#666;font-size:14px;line-height:1.6;margin:0 0 24px">
          Your match paid their fee for <strong>${model}</strong>.
          Pay yours within <strong>24 hours</strong> or the deal is cancelled.
        </p>
        <a href="${APPURL}/listings/${listingId}"
           style="display:inline-block;background:#111;color:#fff;padding:12px 28px;border-radius:999px;text-decoration:none;font-size:13px">
          Pay now →
        </a>
        <p style="color:#bbb;font-size:11px;margin-top:28px">BudMatch · Sri Lanka</p>
      </div>
    </div>`)
}

async function notifyChatUnlocked(matchId: string) {
  const { data: match } = await supabase
    .from('matches').select('listing_a, listing_b, offer_match, buyer_email, seller_email')
    .eq('id', matchId).single()
  if (!match) return

  let buyerEmail: string | undefined
  let sellerEmail: string | undefined
  let model = 'Earbud'
  let url = `${APPURL}/listings/${match.listing_a}`

  if (match.offer_match) {
    buyerEmail = match.buyer_email
    sellerEmail = match.seller_email
    const { data: l } = await supabase.from('listings').select('model, shop_code').eq('id', match.listing_a).single()
    if (l) model = l.model
    url = `${APPURL}/offer-match/${matchId}`
  } else {
    const { data: sl } = await supabase.from('listings').select('user_email, model, shop_code').eq('id', match.listing_a).single()
    const { data: bl } = await supabase.from('listings').select('user_email').eq('id', match.listing_b).single()
    sellerEmail = sl?.user_email
    buyerEmail = bl?.user_email
    if (sl) model = sl.model
  }

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f5f5f0">
      <div style="background:#fff;border-radius:20px;padding:32px;border:1px solid #e8e8e8">
        <div style="text-align:center;margin-bottom:24px"><img src="https://budmatch.site/icon.svg" alt="BudMatch" style="height:40px;width:auto" /></div>
        <h2 style="color:#111;font-size:22px;margin:0 0 8px">Chat is open 🤝</h2>
        <p style="color:#666;font-size:14px;line-height:1.6;margin:0 0 24px">
          Both sides paid for the <strong>${model}</strong>. Open chat to arrange the exchange.
        </p>
        <a href="${url}"
           style="display:inline-block;background:#111;color:#fff;padding:12px 28px;border-radius:999px;text-decoration:none;font-size:13px">
          Open chat →
        </a>
        <p style="color:#bbb;font-size:11px;margin-top:28px">BudMatch · Sri Lanka</p>
      </div>
    </div>`

  if (buyerEmail) await sendEmail(buyerEmail, `Chat unlocked — ${model}`, html)
  if (sellerEmail) await sendEmail(sellerEmail, `Chat unlocked — ${model}`, html)
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const params: Record<string, string> = {}
  formData.forEach((v, k) => { params[k] = v.toString() })

  console.log('PayHere notify received:', params.order_id, params.status_code)

  if (!verifyHash(params)) {
    console.error('Bad signature')
    return new NextResponse('Bad signature', { status: 400 })
  }

  // Only proceed if status is success (2)
  if (params.status_code !== '2') {
    console.log('Payment not successful, status:', params.status_code)
    return new NextResponse('OK', { status: 200 })
  }

  // Parse order_id format: ${matchId}-${role}
  const lastDash = params.order_id.lastIndexOf('-')
  const matchId = params.order_id.substring(0, lastDash)
  const role = params.order_id.substring(lastDash + 1) as 'buyer' | 'seller'

  if (!matchId || !['buyer', 'seller'].includes(role)) {
    console.error('Invalid order_id:', params.order_id)
    return new NextResponse('Invalid order_id', { status: 400 })
  }

  // Mark this side as paid
  const updateField = role === 'buyer' ? 'buyer_paid' : 'seller_paid'
  await supabase.from('matches').update({ [updateField]: true }).eq('id', matchId)

  // Get fresh match state
  const { data: match } = await supabase
    .from('matches')
    .select('buyer_paid, seller_paid, listing_a, agreed_price')
    .eq('id', matchId)
    .single()

  if (!match) return new NextResponse('OK', { status: 200 })

  const bothPaid = match.buyer_paid && match.seller_paid

  if (bothPaid) {
    await supabase.from('matches').update({ status: 'paid' }).eq('id', matchId)
    await notifyChatUnlocked(matchId)

    // Pay shop commission if applicable (5% of agreed price = 50% of platform fee)
    const { data: listing } = await supabase
      .from('listings').select('shop_code').eq('id', match.listing_a).single()

    if (listing?.shop_code) {
      const commission = Math.round((match.agreed_price ?? 0) * 0.025) // 2.5% of price = 50% of 5% fee
      const { data: shop } = await supabase
        .from('shop_partners').select('total_earned').eq('shop_code', listing.shop_code).single()
      if (shop) {
        await supabase
          .from('shop_partners')
          .update({ total_earned: (shop.total_earned ?? 0) + commission })
          .eq('shop_code', listing.shop_code)
      }
    }
  } else {
    // Only one side paid — notify the other
    await notifyPartnerPaid(matchId, role)
  }

  return new NextResponse('OK', { status: 200 })
}