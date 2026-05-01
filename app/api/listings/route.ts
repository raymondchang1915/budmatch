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
          `<p>Hi,</p>
          <p>${msg}</p>
          <p>Head to your <a href="https://budmatch.com/profile">profile</a> to check your listing status.</p>
          <p>— The BudMatch team</p>`
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