import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * POST /api/auth/profile
 * Get user profile information using service role (bypasses RLS)
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    console.log('[Profile API] Fetching profile for user:', userId)

    // Use service role client to bypass RLS issues
    const supabase = await createClient(undefined, true)
    
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin, is_partner, partner_id')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('[Profile API] Database error:', error)
      // Return safe defaults instead of error
      return NextResponse.json({
        is_admin: false,
        is_partner: false,
        partner_id: null
      })
    }

    console.log('[Profile API] Profile data retrieved:', data)

    return NextResponse.json({
      is_admin: data?.is_admin ?? false,
      is_partner: data?.is_partner ?? false,
      partner_id: data?.partner_id || null
    })

  } catch (error) {
    console.error('[Profile API] Unexpected error:', error)
    // Return safe defaults instead of error
    return NextResponse.json({
      is_admin: false,
      is_partner: false,
      partner_id: null
    })
  }
}
