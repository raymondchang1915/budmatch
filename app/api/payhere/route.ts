import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const PAYHERE_MERCHANT_ID = process.env.PAYHERE_MERCHANT_ID!
const PAYHERE_MERCHANT_SECRET = process.env.PAYHERE_MERCHANT_SECRET!
const PAYHERE_BASE = 'https://www.payhere.lk/pay/checkout'

function generateHash(
  merchantId: string,
  orderId: string,
  amount: string,
  currency: string,
  secret: string
): string {
  const secretHash = crypto.createHash('md5').update(secret).digest('hex').toUpperCase()
  const raw = `${merchantId}${orderId}${amount}${currency}${secretHash}`
  return crypto.createHash('md5').update(raw).digest('hex').toUpperCase()
}

export async function POST(req: NextRequest) {
  const { match_id, payer_email, role } = await req.json()
  // role = 'buyer' | 'seller'

  const { data: match, error: matchError } = await supabase
    .from('matches').select('*').eq('id', match_id).single()

  if (matchError || !match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  }
  if (match.negotiation_status !== 'agreed') {
    return NextResponse.json({ error: 'Deal not yet agreed' }, { status: 400 })
  }

  const agreedPrice = match.agreed_price ?? match.anchor_price
  const feeAmount = Math.max(100, Math.round(agreedPrice * 0.10))
  const amount = feeAmount.toFixed(2)
  const currency = 'LKR'
  const orderId = `${match_id}-${role}`
  const hash = generateHash(PAYHERE_MERCHANT_ID, orderId, amount, currency, PAYHERE_MERCHANT_SECRET)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://budmatch.site'

  const listingId = role === 'seller' ? match.listing_a : match.listing_b
  const { data: listingData } = await supabase
    .from('listings').select('model').eq('id', listingId).single()

  // Set 24 hour payment deadline when first person initiates payment
  if (!match.buyer_paid && !match.seller_paid) {
    const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    await supabase.from('matches').update({ payment_deadline: deadline }).eq('id', match_id)
  }

  const params = {
    merchant_id: PAYHERE_MERCHANT_ID,
    return_url: `${appUrl}/listings/${listingId}?payment=success`,
    cancel_url: `${appUrl}/listings/${listingId}?payment=cancelled`,
    notify_url: `${appUrl}/api/payhere/notify`,
    order_id: orderId,
    items: `BudMatch fee — ${listingData?.model ?? 'Earbud'} (${role})`,
    currency,
    amount,
    first_name: payer_email.split('@')[0],
    last_name: 'User',
    email: payer_email,
    phone: '0000000000',
    address: 'Sri Lanka',
    city: 'Colombo',
    country: 'Sri Lanka',
    hash,
  }

  return NextResponse.json({ checkout_url: PAYHERE_BASE, params })
}