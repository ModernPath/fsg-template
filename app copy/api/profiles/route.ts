import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { authenticateUser } from '@/utils/supabase/auth'

// Cache duration in seconds
const CACHE_DURATION = 300 // 5 minutes
const BATCH_SIZE = 50

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [GET /api/profiles] Starting profiles request')

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const ids = searchParams.get('ids')?.split(',') || []
    const select = searchParams.get('select') || '*'

    // If no IDs provided, require authentication and return user's own profile
    if (ids.length === 0) {
      // Authenticate user with cookie-based session
      const { user, error: authError } = await authenticateUser()
      
      if (authError || !user) {
        console.log('❌ Authentication failed in profile fetch')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      console.log('✅ User authenticated for profile fetch:', user.email)

      // Create Supabase client
      const supabase = await createClient(undefined, true)

      const { data: profile, error } = await supabase
        .from('profiles')
        .select(select)
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('❌ Error fetching user profile:', error)
        return NextResponse.json(
          { error: 'Failed to fetch profile' },
          { status: 500 }
        )
      }

      console.log('✅ User profile fetched successfully')
      return NextResponse.json({ profile })
    }

    // For multiple IDs, use public access (no auth required)
    const supabase = await createClient(false)

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(select)
      .in('id', ids)

    if (error) {
      console.error('❌ Error fetching profiles:', error)
      return NextResponse.json(
        { error: 'Failed to fetch profiles' },
        { status: 500 }
      )
    }

    console.log('✅ Profiles fetched successfully')
    return NextResponse.json({ profiles })

  } catch (error) {
    console.error('❌ Error in profiles API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Protected route for updating profiles
export async function PUT(request: NextRequest) {
  try {
    console.log('📝 [PUT /api/profiles] Starting profile update')

    // Authenticate user with cookie-based session
    const { user, error: authError } = await authenticateUser()
    
    if (authError || !user) {
      console.log('❌ Authentication failed in profile update')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ User authenticated for profile update:', user.email)

    const body = await request.json()
    const supabase = await createClient(undefined, true)

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(body)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating profile:', error)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    console.log('✅ Profile updated successfully')
    return NextResponse.json({ profile })

  } catch (error) {
    console.error('❌ Error in profile update:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 