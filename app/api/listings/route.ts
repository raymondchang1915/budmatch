import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function sendEmail(to: string, subject: string, html: string) {
  try {
    await supabase.functions.invoke('send-email', { body: { to, subject, html } })
  } catch (e) { console.error('Email error:', e) }
}

export async function DELETE(req: NextRequest) {
  const { listing_id, user_email } = await req.json()

  console.log('DELETE request received:', { listing_id, user_email })

  if (!listing_id || !user_email) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  try {
    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('email', user_email)
      .single()

    const isAdmin = profile?.is_admin ?? false

    // Verify ownership or admin
    const { data: listing } = await supabase
      .from('listings')
      .select('user_email, model')
      .eq('id', listing_id)
      .single()

    console.log('Listing found:', listing, 'isAdmin:', isAdmin)

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    if (!isAdmin && listing.user_email !== user_email) {
      console.log('Ownership check failed')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get active matches
    const { data: activeMatches } = await supabase
      .from('matches')
      .select('id, listing_a, listing_b')
      .or(`listing_a.eq.${listing_id},listing_b.eq.${listing_id}`)
      .eq('status', 'pending')

    console.log('Active matches:', activeMatches)

    // Update matched status and notify other listing owners
    for (const match of activeMatches ?? []) {
      const otherListingId = match.listing_a === listing_id ? match.listing_b : match.listing_a

      await supabase.from('listings').update({ matched: false }).eq('id', otherListingId)
      await supabase.from('matches').update({ status: 'cancelled' }).eq('id', match.id)

      const { data: otherListing } = await supabase
        .from('listings')
        .select('user_email, model, id')
        .eq('id', otherListingId)
        .single()

      if (otherListing) {
        const msg = `Your match for the ${listing.model} was cancelled — the other party deleted their listing. We've put you back in the pool and will find you a new match soon.`

        await supabase.from('notifications').insert([{
          user_email: otherListing.user_email,
          type: 'match_cancelled',
          message: msg,
          listing_id: otherListing.id,
          match_id: match.id,
          read: false,
        }])

        await sendEmail(
          otherListing.user_email,
          `Match cancelled — ${listing.model}`,
          `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f5f5f0">
            <div style="background:#fff;border-radius:20px;padding:32px;border:1px solid #e8e8e8">
              <div style="text-align:center;margin-bottom:24px"><img src="https://budmatch.site/icon.svg" alt="BudMatch" style="height:40px;width:auto" /></div>
              <h2 style="color:#111;font-size:22px;margin:0 0 8px">Match cancelled ❌</h2>
              <p style="color:#666;font-size:14px;line-height:1.6;margin:0 0 24px">${msg}</p>
              <a href="https://budmatch.site/profile" style="display:inline-block;background:#111;color:#fff;padding:12px 28px;border-radius:999px;text-decoration:none;font-size:13px">Check your listing →</a>
              <p style="color:#bbb;font-size:11px;margin-top:28px">BudMatch · Sri Lanka</p>
            </div>
          </div>`
        )
      }
    }

    // Delete the listing
    const { error, data: deletedData } = await supabase
      .from('listings')
      .delete()
      .eq('id', listing_id)
      .select()

    console.log('Delete response - error:', error, 'data:', deletedData)

    if (error) {
      console.error('Delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Exception:', e)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}