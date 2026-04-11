import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const PAYHERE_MERCHANT_ID = process.env.PAYHERE_MERCHANT_ID!
const PAYHERE_MERCHANT_SECRET = process.env.PAYHERE_MERCHANT_SECRET!
const PAYHERE_BASE = 'https://sandbox.payhere.lk/pay/checkout' // change to live.payhere.lk for production

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
  // role = 'buyer' | 'seller' — each side pays LKR 200

  const { data: match } = await supabase
    .from('matches')
    .select('*, listings!listing_a(model, user_email), listings!listing_b(user_email)')
    .eq('id', match_id)
    .single()

  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  if (match.negotiation_status !== 'agreed') {
    return NextResponse.json({ error: 'Deal not yet agreed' }, { status: 400 })
  }

  const orderId = `${match_id}-${role}`
  const amount = '200.00'
  const currency = 'LKR'
  const hash = generateHash(PAYHERE_MERCHANT_ID, orderId, amount, currency, PAYHERE_MERCHANT_SECRET)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://budmatch.vercel.app'

  const params = {
    merchant_id: PAYHERE_MERCHANT_ID,
    return_url: `${appUrl}/listings/${match.listing_a}?payment=success`,
    cancel_url: `${appUrl}/listings/${match.listing_a}?payment=cancelled`,
    notify_url: `${appUrl}/api/payhere/notify`,
    order_id: orderId,
    items: `BudMatch platform fee — ${match.listings?.model ?? 'Earbud'}`,
    currency,
    amount,
    first_name: payer_email.split('@')[0],
    last_name: '',
    email: payer_email,
    phone: '0000000000',
    address: 'Sri Lanka',
    city: 'Colombo',
    country: 'Sri Lanka',
    hash,
  }

  return NextResponse.json({ checkout_url: PAYHERE_BASE, params })
}