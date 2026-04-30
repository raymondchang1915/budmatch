import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const code = Math.floor(100000 + Math.random() * 900000).toString()

  try {
    await supabase.functions.invoke('send-email', {
      body: {
        to: email,
        subject: 'BudMatch — Verify your shop email',
        html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:2rem"><h2 style="color:#111;margin-bottom:0.5rem">BudMatch Shop Verification</h2><p style="color:#444;margin-bottom:1.5rem">Your verification code is:</p><div style="font-size:2rem;font-weight:bold;letter-spacing:0.25em;background:#f5f5f0;padding:1rem 2rem;border-radius:12px;display:inline-block;color:#111">${code}</div><p style="color:#888;font-size:0.875rem;margin-top:1.5rem">Valid for this session only. Do not share this code.</p></div>`,
      },
    })
  } catch (e) {
    console.error('OTP email error:', e)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }

  return NextResponse.json({ code })
}
