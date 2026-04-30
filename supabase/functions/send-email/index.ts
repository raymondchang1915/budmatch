import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

serve(async (req: Request) => {
  const payload = await req.json()

  // Handle Supabase Auth Hook (OTP/confirmation/magic link)
  if (payload.user) {
    const { user, email_data } = payload
    const to = user.email
    const subject = email_data?.subject ?? 'Confirm your BudMatch account'
    const confirmUrl = `https://budmatch.site/auth/confirm?token_hash=${email_data?.token_hash}&type=email`

    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f5f5f0">
        <div style="background:#fff;border-radius:20px;padding:32px;border:1px solid #e8e8e8">
          <h2 style="color:#111;font-size:22px;margin:0 0 8px;font-weight:600">Welcome to BudMatch 👋</h2>
          <p style="color:#666;font-size:14px;line-height:1.6;margin:0 0 24px">
            Click the button below to confirm your account and start finding your missing bud.
          </p>
          <a href="${confirmUrl}"
             style="display:inline-block;background:#111;color:#fff;padding:12px 28px;border-radius:999px;text-decoration:none;font-size:13px;font-weight:500">
            Confirm my account →
          </a>
          <p style="color:#bbb;font-size:11px;margin-top:28px">BudMatch · Sri Lanka · If you didn't sign up, ignore this email.</p>
        </div>
      </div>`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'BudMatch <hello@budmatch.site>', to, subject, html }),
    })
    const data = await res.json()
    console.log('Auth email response:', JSON.stringify(data))
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
      status: res.ok ? 200 : 500,
    })
  }

  // Handle app notifications (match, deal, payment etc)
  const { to, subject, html } = payload
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'BudMatch <hello@budmatch.site>', to, subject, html }),
  })
  const data = await res.json()
  console.log('Notification email response:', JSON.stringify(data))
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
    status: res.ok ? 200 : 500,
  })
})
