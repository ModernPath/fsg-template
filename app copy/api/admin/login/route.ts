import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST() {
  try {
    console.log('🔑 Admin login request received')
    
    const supabase = await createClient(undefined, true) // Use service role for admin operations
    
    // Get the admin user directly from the database
    const { data: adminProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, is_admin')
      .eq('is_admin', true)
      .limit(1)
      .single()

    if (profileError || !adminProfile) {
      console.error('❌ No admin user found:', profileError)
      return NextResponse.json({
        success: false,
        error: 'No admin user found'
      })
    }

    console.log('✅ Found admin user:', adminProfile.email)

    // Get the auth user details
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(adminProfile.id)
    
    if (authError || !authUser.user) {
      console.error('❌ Could not get auth user:', authError)
      return NextResponse.json({
        success: false,
        error: 'Could not get auth user details'
      })
    }

    // Create an admin session token (for development only)
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: authUser.user.email!,
      options: {
        redirectTo: 'http://localhost:3000/admin'
      }
    })

    if (sessionError || !sessionData) {
      console.error('❌ Could not generate session:', sessionError)
      return NextResponse.json({
        success: false,
        error: 'Could not generate admin session'
      })
    }

    console.log('✅ Admin login successful')
    
    return NextResponse.json({
      success: true,
      message: 'Admin login successful',
      loginUrl: sessionData.properties?.action_link,
      user: {
        id: authUser.user.id,
        email: authUser.user.email,
        is_admin: adminProfile.is_admin
      }
    })

  } catch (error) {
    console.error('❌ Admin login error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 