import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/admin/users/create
export async function POST(request: Request) {
  try {
    console.log('✨ POST /api/admin/users/create called')

    // 1. Verify Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid authorization header')
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
    }

    // 2. Extract token
    const token = authHeader.split(' ')[1]

    // 3. Create auth client and verify token
    const authClient = await createClient()

    // Verify token
    const { data: { user }, error: authError } = await authClient.auth.getUser(token)
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ User authenticated:', user.id)

    // 4. Check if user is admin
    const { data: adminProfile } = await authClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!adminProfile?.is_admin) {
      console.error('❌ User is not admin')
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    console.log('✅ User is admin, proceeding with user creation')

    // 5. Get request body
    const body = await request.json()
    const { email, password, first_name, last_name, phone_number, is_admin, is_partner, email_confirm } = body

    console.log('📊 Create data:', { email, first_name, last_name, phone_number, is_admin, is_partner, email_confirm })

    // 6. Validate required fields
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // 7. Create admin client with service role
    const supabaseAdmin = await createClient(undefined, true)
    console.log('✅ Admin client created')

    // 8. Create user with admin privileges
    console.log('🔄 Creating user...')
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: email_confirm !== false, // Default to true
      user_metadata: {
        first_name,
        last_name,
        phone_number
      }
    })

    if (error) {
      console.error('❌ Error creating user:', error)
      return NextResponse.json({ 
        error: `Failed to create user: ${error.message}` 
      }, { status: 500 })
    }

    console.log('✅ User created successfully:', data.user?.id)

    // 9. Update profile with admin/partner status and other fields
    if (data.user) {
      console.log('🔄 Updating profile...')
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          is_admin: is_admin || false,
          is_partner: is_partner || false,
          first_name: first_name || null,
          last_name: last_name || null,
          phone_number: phone_number || null
        })
        .eq('id', data.user.id)

      if (profileError) {
        console.error('⚠️ Warning: Failed to update profile:', profileError)
        // Don't fail the whole operation, just log the warning
      } else {
        console.log('✅ Profile updated successfully')
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User created successfully',
      user: {
        id: data.user?.id,
        email: data.user?.email
      }
    })
  } catch (error) {
    console.error('❌ Error in POST /api/admin/users/create:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

