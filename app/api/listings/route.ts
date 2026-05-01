import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
      .select('user_email')
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
      .select('listing_a, listing_b')
      .or(`listing_a.eq.${listing_id},listing_b.eq.${listing_id}`)
      .in('status', ['pending', 'negotiating'])

    console.log('Active matches:', activeMatches)

    // Update matched status for other listings
    for (const match of activeMatches ?? []) {
      const otherListingId = match.listing_a === listing_id ? match.listing_b : match.listing_a
      await supabase.from('listings').update({ matched: false }).eq('id', otherListingId)
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
