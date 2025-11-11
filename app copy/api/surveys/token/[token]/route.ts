import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * GET /api/surveys/token/[token]
 * Validate survey invitation token and get survey details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    console.log('\n📝 [GET /api/surveys/token/:token]', {
      token: token
    })

    const supabase = await createClient()

    // Find invitation by token
    const { data: invitation, error: invitationError } = await supabase
      .from('survey_invitations')
      .select(`
        *,
        survey_templates!inner(
          id,
          name,
          description,
          questions,
          settings,
          is_active
        )
      `)
      .eq('token', token)
      .single()

    if (invitationError || !invitation) {
      console.error('❌ Invalid token:', params.token)
      return NextResponse.json(
        { error: 'Virheellinen kutsulinkki' },
        { status: 404 }
      )
    }

    // Check if invitation is still valid
    if (new Date() > new Date(invitation.expires_at)) {
      console.error('❌ Expired token:', params.token)
      return NextResponse.json(
        { error: 'Kutsulinkki on vanhentunut' },
        { status: 400 }
      )
    }

    // Check if survey template is active
    if (!invitation.survey_templates.is_active) {
      console.error('❌ Inactive survey template:', invitation.template_id)
      return NextResponse.json(
        { error: 'Kysely ei ole enää aktiivinen' },
        { status: 400 }
      )
    }

    // Check if user has already completed the survey
    const { data: existingResponse } = await supabase
      .from('survey_responses')
      .select('id, completion_status')
      .eq('invitation_id', invitation.id)
      .eq('completion_status', 'completed')
      .single()

    if (existingResponse) {
      console.log('✅ User has already completed survey')
      return NextResponse.json({
        invitation,
        survey: invitation.survey_templates,
        already_completed: true,
        response_id: existingResponse.id,
        message: 'Olet jo vastannut tähän kyselyyn'
      })
    }

    // Check for in-progress response
    const { data: inProgressResponse } = await supabase
      .from('survey_responses')
      .select('id, answers, completion_status, created_at')
      .eq('invitation_id', invitation.id)
      .in('completion_status', ['started', 'in_progress'])
      .single()

    // Mark invitation as opened if not already
    if (invitation.invitation_status === 'pending' || invitation.invitation_status === 'sent') {
      await supabase
        .from('survey_invitations')
        .update({ 
          invitation_status: 'opened',
          opened_at: new Date().toISOString()
        })
        .eq('id', invitation.id)
    }

    console.log('✅ Valid survey invitation found')

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        expires_at: invitation.expires_at,
        created_at: invitation.created_at
      },
      survey: invitation.survey_templates,
      existing_response: inProgressResponse || null,
      can_start: true,
      message: inProgressResponse 
        ? 'Voit jatkaa keskeneräistä vastaamista'
        : 'Voit aloittaa kyselyn'
    })

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json(
      { error: 'Sisäinen palvelinvirhe' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/surveys/token/[token]
 * Submit survey response using invitation token
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    console.log('\n📝 [POST /api/surveys/token/:token]', {
      token: token
    })

    const body = await request.json()
    const { answers, completion_status = 'completed', session_duration } = body

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json(
        { 
          error: 'Vastaukset puuttuvat tai ovat virheellisiä',
          errorCode: 'missingAnswers'
        },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Validate invitation token
    const { data: invitation, error: invitationError } = await supabase
      .from('survey_invitations')
      .select(`
        *,
        survey_templates!inner(id, is_active)
      `)
      .eq('token', token)
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json(
        { 
          error: 'Virheellinen kutsulinkki',
          errorCode: 'invalidToken'
        },
        { status: 404 }
      )
    }

    // Check if invitation is still valid
    if (new Date() > new Date(invitation.expires_at)) {
      return NextResponse.json(
        { 
          error: 'Kutsulinkki on vanhentunut',
          errorCode: 'expired'
        },
        { status: 400 }
      )
    }

    // Check if survey is active
    if (!invitation.survey_templates.is_active) {
      return NextResponse.json(
        { 
          error: 'Kysely ei ole enää aktiivinen',
          errorCode: 'surveyInactive'
        },
        { status: 400 }
      )
    }

    // Get client information
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const referrer = request.headers.get('referer') || null

    // Check if response already exists
    const { data: existingResponse } = await supabase
      .from('survey_responses')
      .select('id, completion_status')
      .eq('invitation_id', invitation.id)
      .single()

    let responseData
    let isUpdate = false

    if (existingResponse) {
      // Update existing response
      isUpdate = true
      
      // Don't allow updating completed responses
      if (existingResponse.completion_status === 'completed' && completion_status !== 'completed') {
        return NextResponse.json(
          { 
            error: 'Valmista vastausta ei voi muokata',
            errorCode: 'cannotModifyCompleted'
          },
          { status: 400 }
        )
      }

      const updateData: any = {
        answers,
        completion_status,
        session_duration,
        updated_at: new Date().toISOString()
      }

      if (completion_status === 'completed') {
        updateData.completed_at = new Date().toISOString()
      }

      const { data: updatedResponse, error: updateError } = await supabase
        .from('survey_responses')
        .update(updateData)
        .eq('id', existingResponse.id)
        .select()
        .single()

      if (updateError) {
        console.error('❌ Error updating response:', updateError)
        return NextResponse.json(
          { 
            error: 'Vastauksen päivitys epäonnistui',
            errorCode: 'updateFailed'
          },
          { status: 500 }
        )
      }

      responseData = updatedResponse
    } else {
      // Create new response
      const { data: newResponse, error: createError } = await supabase
        .from('survey_responses')
        .insert({
          template_id: invitation.template_id,
          user_id: invitation.user_id,
          company_id: invitation.company_id,
          invitation_id: invitation.id,
          answers,
          completion_status,
          session_duration,
          ip_address: clientIP,
          user_agent: userAgent,
          referrer,
          started_at: new Date().toISOString(),
          completed_at: completion_status === 'completed' ? new Date().toISOString() : null
        })
        .select()
        .single()

      if (createError) {
        console.error('❌ Error creating response:', createError)
        return NextResponse.json(
          { 
            error: 'Vastauksen tallennus epäonnistui',
            errorCode: 'saveFailed'
          },
          { status: 500 }
        )
      }

      responseData = newResponse
    }

    // Update invitation status
    let newInvitationStatus = invitation.invitation_status
    const updateInvitation: any = {}

    console.log('🔄 [Survey] Updating invitation status:', {
      current: invitation.invitation_status,
      completion_status,
      invitation_id: invitation.id
    })

    if (completion_status === 'completed') {
      newInvitationStatus = 'completed'
      updateInvitation.completed_at = new Date().toISOString()
      console.log('✅ [Survey] Setting invitation status to completed')
    } else if (invitation.invitation_status === 'pending' || invitation.invitation_status === 'sent') {
      newInvitationStatus = 'opened'
      updateInvitation.opened_at = new Date().toISOString()
      console.log('📖 [Survey] Setting invitation status to opened')
    }

    if (newInvitationStatus !== invitation.invitation_status) {
      updateInvitation.invitation_status = newInvitationStatus
      
      console.log('🔄 [Survey] Updating invitation in database:', updateInvitation)
      
      const { error: updateError } = await supabase
        .from('survey_invitations')
        .update(updateInvitation)
        .eq('id', invitation.id)

      if (updateError) {
        console.error('❌ [Survey] Failed to update invitation status:', updateError)
      } else {
        console.log('✅ [Survey] Invitation status updated successfully')
      }
    } else {
      console.log('ℹ️ [Survey] No invitation status update needed')
    }

    // If this is a completed response and user didn't do analysis, check if we should show encouragement
    let showAnalysisEncouragement = false
    let analysisLink = null

    if (completion_status === 'completed' && answers.did_analysis === 'no') {
      showAnalysisEncouragement = true
      analysisLink = '/fi/onboarding' // Link to analysis
    }

    console.log(`✅ Survey response ${isUpdate ? 'updated' : 'created'}:`, responseData.id)

    return NextResponse.json({
      response: responseData,
      message: isUpdate 
        ? 'Vastaus päivitetty onnistuneesti' 
        : 'Vastaus tallennettu onnistuneesti',
      completed: completion_status === 'completed',
      show_analysis_encouragement: showAnalysisEncouragement,
      analysis_link: analysisLink,
      meta: {
        is_update: isUpdate,
        invitation_status: newInvitationStatus
      }
    }, { status: isUpdate ? 200 : 201 })

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json(
      { 
        error: 'Sisäinen palvelinvirhe',
        errorCode: 'internalError'
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/surveys/token/[token]
 * Update survey response (partial save)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    console.log('\n📝 [PUT /api/surveys/token/:token] - Partial save', {
      token: token
    })

    const body = await request.json()
    const { answers, completion_status = 'in_progress' } = body

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json(
        { 
          error: 'Vastaukset puuttuvat tai ovat virheellisiä',
          errorCode: 'missingAnswers'
        },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Validate invitation token
    const { data: invitation, error: invitationError } = await supabase
      .from('survey_invitations')
      .select('*')
      .eq('token', token)
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json(
        { 
          error: 'Virheellinen kutsulinkki',
          errorCode: 'invalidToken'
        },
        { status: 404 }
      )
    }

    // Check if invitation is still valid
    if (new Date() > new Date(invitation.expires_at)) {
      return NextResponse.json(
        { 
          error: 'Kutsulinkki on vanhentunut',
          errorCode: 'expired'
        },
        { status: 400 }
      )
    }

    // Find or create response
    const { data: existingResponse } = await supabase
      .from('survey_responses')
      .select('id, completion_status')
      .eq('invitation_id', invitation.id)
      .single()

    let responseData

    if (existingResponse) {
      // Don't allow updating completed responses
      if (existingResponse.completion_status === 'completed') {
        return NextResponse.json(
          { 
            error: 'Valmista vastausta ei voi muokata',
            errorCode: 'cannotModifyCompleted'
          },
          { status: 400 }
        )
      }

      // Update existing response
      const { data: updatedResponse, error: updateError } = await supabase
        .from('survey_responses')
        .update({
          answers,
          completion_status,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingResponse.id)
        .select()
        .single()

      if (updateError) {
        console.error('❌ Error updating response:', updateError)
        return NextResponse.json(
          { 
            error: 'Vastauksen päivitys epäonnistui',
            errorCode: 'updateFailed'
          },
          { status: 500 }
        )
      }

      responseData = updatedResponse
    } else {
      // Create new response
      const clientIP = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown'
      const userAgent = request.headers.get('user-agent') || 'unknown'

      const { data: newResponse, error: createError } = await supabase
        .from('survey_responses')
        .insert({
          template_id: invitation.template_id,
          user_id: invitation.user_id,
          company_id: invitation.company_id,
          invitation_id: invitation.id,
          answers,
          completion_status,
          ip_address: clientIP,
          user_agent: userAgent,
          started_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error('❌ Error creating response:', createError)
        return NextResponse.json(
          { 
            error: 'Vastauksen tallennus epäonnistui',
            errorCode: 'saveFailed'
          },
          { status: 500 }
        )
      }

      responseData = newResponse
    }

    console.log('✅ Survey response saved (partial):', responseData.id)

    return NextResponse.json({
      response: responseData,
      message: 'Vastaus tallennettu automaattisesti',
      auto_saved: true
    })

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json(
      { 
        error: 'Sisäinen palvelinvirhe',
        errorCode: 'internalError'
      },
      { status: 500 }
    )
  }
}
