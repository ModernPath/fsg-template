import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * GET /api/surveys/invitations/user
 * Get user's auto-created survey invitation token
 */
export async function GET(request: NextRequest) {
  try {
    console.log('\n📝 [GET /api/surveys/invitations/user]')

    // Verify authentication
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid auth header')
      return NextResponse.json(
        { error: 'Puuttuva tai virheellinen valtuutus' },
        { status: 401 }
      )
    }

    // Verify token and get user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.split(' ')[1]
    )

    if (authError || !user) {
      console.error('❌ Auth error:', authError)
      return NextResponse.json(
        { error: 'Valtuutus epäonnistui' },
        { status: 401 }
      )
    }

    console.log('✅ User authenticated:', user.id)

    // Get user's auto-created survey invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('survey_invitations')
      .select(`
        id,
        token,
        invitation_status,
        expires_at,
        created_at,
        survey_templates!inner(
          id,
          name,
          description,
          is_active
        )
      `)
      .eq('user_id', user.id)
      .eq('invitation_status', 'auto_created')
      .eq('survey_templates.is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (invitationError || !invitation) {
      console.log('ℹ️ No auto-created invitation found for user:', user.id)
      return NextResponse.json(
        { error: 'Automaattista kutsulinkkiä ei löytynyt' },
        { status: 404 }
      )
    }

    // Check if invitation is still valid (not expired)
    if (new Date() > new Date(invitation.expires_at)) {
      console.error('❌ Auto invitation expired:', invitation.token)
      return NextResponse.json(
        { error: 'Kutsulinkki on vanhentunut' },
        { status: 400 }
      )
    }

    console.log('✅ Auto survey invitation found for user:', user.id)

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        token: invitation.token,
        status: invitation.invitation_status,
        expires_at: invitation.expires_at,
        created_at: invitation.created_at
      },
      survey: invitation.survey_templates,
      message: 'Automaattinen kutsulinkki löytyi'
    })

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json(
      { error: 'Odottamaton virhe' },
      { status: 500 }
    )
  }
}
