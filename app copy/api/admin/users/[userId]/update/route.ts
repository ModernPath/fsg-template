import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// PUT /api/admin/users/[userId]/update
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    console.log('🔄 PUT /api/admin/users/[userId]/update called')
    
    // Get userId from params
    const { userId } = await params
    console.log('📝 User ID to update:', userId)

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

    console.log('✅ User is admin, proceeding with update')

    // 5. Get request body
    const body = await request.json()
    const { is_admin, is_partner, first_name, last_name, phone_number, password } = body

    console.log('📊 Update data:', { is_admin, is_partner, first_name, last_name, phone_number, hasPassword: !!password })

    // 6. Create admin client with service role
    const supabaseAdmin = await createClient(undefined, true)
    console.log('✅ Admin client created')

    // 7. Update profile with admin privileges
    const updateData: any = {
      is_admin: is_admin,
      is_partner: is_partner,
      first_name: first_name || null,
      last_name: last_name || null,
      phone_number: phone_number || null
    }

    console.log('🔄 Updating profile...')
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', userId)

    if (profileError) {
      console.error('❌ Error updating profile:', profileError)
      return NextResponse.json({ 
        error: `Failed to update profile: ${profileError.message}` 
      }, { status: 500 })
    }

    console.log('✅ Profile updated successfully')

    // 8. Update password if provided
    if (password && password.length >= 6) {
      console.log('🔄 Updating password...')
      const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password }
      )
      
      if (passwordError) {
        console.error('❌ Error updating password:', passwordError)
        return NextResponse.json({ 
          error: `Failed to update password: ${passwordError.message}` 
        }, { status: 500 })
      }
      
      console.log('✅ Password updated successfully')
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User updated successfully' 
    })
  } catch (error) {
    console.error('❌ Error in PUT /api/admin/users/[userId]/update:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

