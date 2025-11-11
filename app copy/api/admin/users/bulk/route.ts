import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
  console.log('\n📝 [POST /api/admin/users/bulk] Bulk user operations')

  try {
    // 1. Verify authentication & admin role
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const authClient = await createClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser(
      authHeader.split(' ')[1]
    )

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await authClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // 2. Parse request body
    const { action, userIds, updateData } = await request.json()

    if (!action || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: action and userIds are required' },
        { status: 400 }
      )
    }

    // Prevent self-operations
    if (userIds.includes(user.id)) {
      return NextResponse.json(
        { error: 'Cannot perform bulk operations on your own account' },
        { status: 400 }
      )
    }

    console.log('🔄 Bulk operation:', { action, userIds: userIds.length, updateData })

    // 3. Create service role client
    const supabase = await createClient(undefined, true)

    let results = []
    let errors = []

    switch (action) {
      case 'delete':
        // 4a. Bulk delete users
        for (const userId of userIds) {
          try {
            // Check if user is admin (prevent deletion)
            const { data: userProfile, error: checkError } = await supabase
              .from('profiles')
              .select('id, email, is_admin')
              .eq('id', userId)
              .single()

            if (checkError || !userProfile) {
              errors.push({ userId, error: 'User not found' })
              continue
            }

            if (userProfile.is_admin) {
              errors.push({ userId, error: 'Cannot delete admin users' })
              continue
            }

            // Delete auth user
            const { error: deleteError } = await supabase.auth.admin.deleteUser(userId)

            if (deleteError) {
              errors.push({ userId, error: deleteError.message })
            } else {
              results.push({ 
                userId, 
                email: userProfile.email, 
                action: 'deleted',
                success: true 
              })
            }
          } catch (error) {
            errors.push({ 
              userId, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            })
          }
        }
        break

      case 'update_role':
        // 4b. Bulk update user roles
        if (!updateData || (updateData.is_admin === undefined && updateData.is_partner === undefined)) {
          return NextResponse.json(
            { error: 'Update data with role information is required' },
            { status: 400 }
          )
        }

        for (const userId of userIds) {
          try {
            // Check if user exists
            const { data: userProfile, error: checkError } = await supabase
              .from('profiles')
              .select('id, email, is_admin')
              .eq('id', userId)
              .single()

            if (checkError || !userProfile) {
              errors.push({ userId, error: 'User not found' })
              continue
            }

            // Prevent changing admin status of other admins
            if (userProfile.is_admin && updateData.is_admin === false) {
              errors.push({ userId, error: 'Cannot remove admin privileges from admin users' })
              continue
            }

            // Update profile
            const profileUpdateData: any = {}
            if (updateData.is_admin !== undefined) profileUpdateData.is_admin = updateData.is_admin
            if (updateData.is_partner !== undefined) profileUpdateData.is_partner = updateData.is_partner

            const { data: updatedProfile, error: updateError } = await supabase
              .from('profiles')
              .update(profileUpdateData)
              .eq('id', userId)
              .select('id, email, is_admin, is_partner')
              .single()

            if (updateError) {
              errors.push({ userId, error: updateError.message })
            } else {
              results.push({
                userId,
                email: updatedProfile.email,
                action: 'role_updated',
                newRole: {
                  is_admin: updatedProfile.is_admin,
                  is_partner: updatedProfile.is_partner
                },
                success: true
              })
            }
          } catch (error) {
            errors.push({ 
              userId, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            })
          }
        }
        break

      case 'reset_password':
        // 4c. Bulk password reset (send reset emails)
        for (const userId of userIds) {
          try {
            // Get user email
            const { data: userProfile, error: checkError } = await supabase
              .from('profiles')
              .select('id, email')
              .eq('id', userId)
              .single()

            if (checkError || !userProfile) {
              errors.push({ userId, error: 'User not found' })
              continue
            }

            // Generate password reset link
            const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
              type: 'recovery',
              email: userProfile.email
            })

            if (resetError) {
              errors.push({ userId, error: resetError.message })
            } else {
              results.push({
                userId,
                email: userProfile.email,
                action: 'password_reset_sent',
                resetLink: resetData.properties?.action_link,
                success: true
              })
            }
          } catch (error) {
            errors.push({ 
              userId, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            })
          }
        }
        break

      default:
        return NextResponse.json(
          { error: `Unsupported bulk action: ${action}` },
          { status: 400 }
        )
    }

    console.log('✅ Bulk operation completed:', {
      successful: results.length,
      failed: errors.length
    })

    return NextResponse.json({
      message: `Bulk ${action} operation completed`,
      results,
      errors,
      summary: {
        total: userIds.length,
        successful: results.length,
        failed: errors.length
      }
    })

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
