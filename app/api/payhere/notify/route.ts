import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const PAYHERE_MERCHANT_ID = process.env.PAYHERE_MERCHANT_ID!
const PAYHERE_MERCHANT_SECRET = process.env.PAYHERE_MERCHANT_SECRET!

function verifyPayHereHash(params: Record<string, string>): boolean {
  const secretHash = crypto.createHash('md5').update(PAYHERE_MERCHANT_SECRET).digest('hex').toUpperCase()
  const raw = `${params.merchant_id}${params.order_id}${params.payhere_amount}${params.payhere_currency}${params.status_code}${secretHash}`
  const expected = crypto.createHash('md5').update(raw).digest('hex').toUpperCase()
  return expected === params.md5sig
}

async function sendMatchEmail(toEmail: string, model: string, matchId: string) {
  // Uses Supabase Edge Functions or any SMTP. 
  // This calls a Supabase Edge Function named "send-email".
  // Create it at: supabase/functions/send-email/index.ts
  await supabase.functions.invoke('send-email', {
    body: {
      to: toEmail,
      subject: `Your BudMatch is confirmed — ${model}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#111">You've got a match! 🎉</h2>
          <p>Your <strong>${model}</strong> bud has been matched and payment confirmed.</p>
          <p>Head to your listing to chat with your match and arrange delivery.</p>
          <a href="https://budmatch.vercel.app/listings/${matchId}"
             style="display:inline-block;background:#111;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-size:14px;margin-top:8px">
            View match →
          </a>
          <p style="color:#999;font-size:12px;margin-top:24px">BudMatch · Sri Lanka</p>
        </div>
      `,
    },
  })
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const params: Record<string, string> = {}
  formData.forEach((v, k) => { params[k] = v.toString() })

  // Verify PayHere signature
  if (!verifyPayHereHash(params)) {
    return new NextResponse('Invalid signature', { status: 400 })
  }

  // status_code 2 = success
  if (params.status_code !== '2') {
    return new NextResponse('OK', { status: 200 })
  }

  // order_id format: {match_id}-{role}
  const [matchId, role] = params.order_id.split('-')

  const { data: match } = await supabase
    .from('matches')
    .select('*, listingA:listings!listing_a(*), listingB:listings!listing_b(*)')
    .eq('id', matchId)
    .single()

  if (!match) return new NextResponse('Match not found', { status: 404 })

  const updateField = role === 'buyer' ? 'buyer_paid' : 'seller_paid'

  await supabase.from('matches').update({ [updateField]: true }).eq('id', matchId)

  // Re-fetch to check if both sides have paid
  const { data: updated } = await supabase
    .from('matches')
    .select('buyer_paid, seller_paid, shop_code_used, listingA:listings!listing_a(model, user_email, shop_code), listingB:listings!listing_b(user_email)')
    .eq('id', matchId)
    .single()

  if (updated?.buyer_paid && updated?.seller_paid) {
    // Mark match fully paid
    await supabase.from('matches').update({ status: 'paid' }).eq('id', matchId)

    const model = updated.listingA?.model ?? 'Earbud'
    const emailA = updated.listingA?.user_email
    const emailB = updated.listingB?.user_email
    const shopCode = updated.listingA?.shop_code

    // Send confirmation emails to both parties
    if (emailA) await sendMatchEmail(emailA, model, matchId).catch(console.error)
    if (emailB) await sendMatchEmail(emailB, model, matchId).catch(console.error)

    // Credit shop commission if a shop code was used
    if (shopCode) {
      const COMMISSION = 40 // LKR 40 = 10% of LKR 400
      await supabase
        .from('shop_partners')
        .update({
          total_earned: supabase.rpc('increment', { x: COMMISSION }) as any,
        })
        .eq('shop_code', shopCode)

      // Simpler version without RPC:
      const { data: shop } = await supabase
        .from('shop_partners')
        .select('total_earned')
        .eq('shop_code', shopCode)
        .single()

      if (shop) {
        await supabase
          .from('shop_partners')
          .update({ total_earned: (shop.total_earned ?? 0) + COMMISSION })
          .eq('shop_code', shopCode)
      }

      // Mark referral earned on listing
      await supabase.from('listings').update({ referral_earned: true }).eq('id', match.listing_a)
    }
  }

  return new NextResponse('OK', { status: 200 })
}