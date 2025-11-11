import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      return NextResponse.json({ 
        authenticated: false, 
        error: authError.message 
      })
    }

    if (!user) {
      return NextResponse.json({ authenticated: false })
    }

    // Get profile info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin, email, full_name')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        profile: profile || null,
        profileError: profileError?.message
      }
    })

  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 