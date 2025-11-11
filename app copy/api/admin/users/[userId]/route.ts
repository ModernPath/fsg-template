import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// DELETE /api/admin/users/[userId]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    console.log('🗑️ DELETE /api/admin/users/[userId] called')
    
    // Get userId from params
    const { userId } = await params
    console.log('📝 User ID to delete:', userId)

    // 1. Verify Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid authorization header')
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
    }

    // 2. Extract token
    const token = authHeader.split(' ')[1]
    console.log('🔑 Token received:', token.substring(0, 20) + '...')

    // 3. Create auth client and verify token
    const authClient = await createClient()

    // TÄRKEÄÄ: getUser(token) - käytä tokenia parametrina!
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

    console.log('✅ User is admin, proceeding with deletion')

    // 5. Create admin client with service role
    const supabaseAdmin = await createClient(undefined, true)
    console.log('✅ Admin client created')

    // 6. Get user email for confirmation message
    const { data: userProfile } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single()
    
    const userEmail = userProfile?.email || userId

    // 7. Delete related data in correct order (tables without CASCADE DELETE)
    console.log('🗑️ Step 1: Deleting partner conversions...')
    await supabaseAdmin
      .from('partner_conversions')
      .delete()
      .eq('user_id', userId)

    console.log('🗑️ Step 2: Deleting partner referral clicks...')
    await supabaseAdmin
      .from('partner_referral_clicks')
      .delete()
      .eq('user_id', userId)

    console.log('🗑️ Step 3: Setting companies.created_by to NULL...')
    await supabaseAdmin
      .from('companies')
      .update({ created_by: null })
      .eq('created_by', userId)

    console.log('🗑️ Step 4: Setting documents references to NULL...')
    await supabaseAdmin
      .from('documents')
      .update({ 
        uploaded_by: null as any,
        created_by: null as any 
      })
      .or(`uploaded_by.eq.${userId},created_by.eq.${userId}`)

    console.log('🗑️ Step 5: Setting posts.author_id to NULL...')
    await supabaseAdmin
      .from('posts')
      .update({ author_id: null })
      .eq('author_id', userId)

    console.log('🗑️ Step 6: Deleting AB test assignments...')
    await supabaseAdmin
      .from('ab_assignments')
      .delete()
      .eq('user_id', userId)

    console.log('🗑️ Step 7: Setting email templates.created_by to NULL...')
    await supabaseAdmin
      .from('email_templates')
      .update({ created_by: null })
      .eq('created_by', userId)

    console.log('🗑️ Step 8: Setting brands.user_id to NULL...')
    await supabaseAdmin
      .from('brands')
      .update({ user_id: null })
      .eq('user_id', userId)

    // Note: The following tables have ON DELETE CASCADE and will be deleted automatically:
    // - profiles (CASCADE from auth.users)
    // - user_companies (CASCADE)
    // - survey_responses (CASCADE)
    // - survey_invitations (CASCADE)
    // - analytics_events (usually no constraint or CASCADE)
    // - analytics_sessions (usually no constraint or CASCADE)

    // 8. Finally delete user from auth system (this will CASCADE delete profiles and related tables)
    console.log('🗑️ Step 9: Deleting user from auth system...')
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('❌ Error deleting user:', deleteError)
      return NextResponse.json({ 
        error: `Failed to delete user: ${deleteError.message}` 
      }, { status: 500 })
    }

    console.log('✅ User deleted successfully from auth system')
    console.log(`✅ Successfully deleted user ${userEmail} and all related data`)

    return NextResponse.json({ success: true, message: 'User deleted successfully' })
  } catch (error) {
    console.error('❌ Error in DELETE /api/admin/users/[userId]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
