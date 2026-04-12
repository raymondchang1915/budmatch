import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const PAYHERE_MERCHANT_SECRET = process.env.PAYHERE_MERCHANT_SECRET!

function verifyHash(params: Record<string, string>): boolean {
  const secretHash = crypto.createHash('md5').update(PAYHERE_MERCHANT_SECRET).digest('hex').toUpperCase()
  const raw = `${params.merchant_id}${params.order_id}${params.payhere_amount}${params.payhere_currency}${params.status_code}${secretHash}`
  return crypto.createHash('md5').update(raw).digest('hex').toUpperCase() === params.md5sig
}

async function sendMatchEmail(toEmail: string, model: string, matchId: string, listingId: string) {
  await supabase.functions.invoke('send-email', {
    body: {
      to: toEmail,
      subject: `Your BudMatch is confirmed — ${model}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#111;margin-bottom:8px">You've got a match! 🎉</h2>
          <p style="color:#555">Your <strong>${model}</strong> bud is matched and payment is confirmed.</p>
          <p style="color:#555">Head to your listing to chat and arrange delivery.</p>
          <a href="https://budmatch.vercel.app/listings/${listingId}"
             style="display:inline-block;background:#111;color:#fff;padding:12px 28px;border-radius:999px;text-decoration:none;font-size:14px;margin-top:12px">
            Open chat →
          </a>
          <p style="color:#aaa;font-size:12px;margin-top:32px">BudMatch · Sri Lanka</p>
        </div>
      `,
    },
  })
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const params: Record<string, string> = {}
  formData.forEach((v, k) => { params[k] = v.toString() })

  if (!verifyHash(params)) return new NextResponse('Bad signature', { status: 400 })
  if (params.status_code !== '2') return new NextResponse('OK', { status: 200 })

  const [matchId, party] = params.order_id.split('-')
  const updateField = party === 'a' ? 'party_a_paid' : 'party_b_paid'

  await supabase.from('matches').update({ [updateField]: true }).eq('id', matchId)

  const { data: match } = await supabase
    .from('matches')
    .select('party_a_paid, party_b_paid, listing_a, listing_b, listingA:listings!listing_a(model, user_email, shop_code), listingB:listings!listing_b(user_email)')
    .eq('id', matchId)
    .single()

  if (!match) return new NextResponse('OK', { status: 200 })

  const bothPaid =
    (party === 'a' ? true : !!match.party_a_paid) &&
    (party === 'b' ? true : !!match.party_b_paid)

  if (bothPaid) {
    await supabase.from('matches').update({ status: 'paid' }).eq('id', matchId)

    const listingA = Array.isArray(match.listingA) ? (match.listingA as any[])[0] : match.listingA as any
    const listingB = Array.isArray(match.listingB) ? (match.listingB as any[])[0] : match.listingB as any

    const model: string = listingA?.model ?? 'Earbud'
    const emailA: string | undefined = listingA?.user_email
    const emailB: string | undefined = listingB?.user_email
    const shopCode: string | undefined = listingA?.shop_code

    if (emailA) await sendMatchEmail(emailA, model, matchId, match.listing_a).catch(console.error)
    if (emailB) await sendMatchEmail(emailB, model, matchId, match.listing_a).catch(console.error)

    if (shopCode) {
      const { data: shop } = await supabase
        .from('shop_partners')
        .select('total_earned')
        .eq('shop_code', shopCode)
        .single()
      if (shop) {
        await supabase
          .from('shop_partners')
          .update({ total_earned: (shop.total_earned ?? 0) + 40 })
          .eq('shop_code', shopCode)
      }
    }
  }

  return new NextResponse('OK', { status: 200 })
}