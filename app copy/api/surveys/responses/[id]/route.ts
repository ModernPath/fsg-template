import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * GET /api/surveys/responses/[id]
 * Get detailed survey response by ID (Admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('\n📝 [GET /api/surveys/responses/:id]', {
      responseId: id
    })

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
    const authClient = await createClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser(
      authHeader.split(' ')[1]
    )

    if (authError || !user) {
      console.error('❌ Auth error:', authError)
      return NextResponse.json(
        { error: 'Valtuutus epäonnistui' },
        { status: 401 }
      )
    }

    // Check admin status
    const { data: profile, error: profileError } = await authClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('❌ Profile error:', profileError)
      return NextResponse.json(
        { error: 'Käyttäjäprofiilin haku epäonnistui' },
        { status: 500 }
      )
    }

    const isAdmin = profile?.is_admin || false
    console.log('🔑 User context:', { userId: user.id, isAdmin })
    console.log('📊 About to query survey_responses with ID:', id)

    if (!isAdmin) {
      console.error('❌ User is not admin')
      return NextResponse.json(
        { error: 'Admin-oikeudet vaaditaan' },
        { status: 403 }
      )
    }

    // Use service role for admin operations
    const supabase = await createClient(undefined, true)

    // Get detailed response data - simplified query first
    console.log('📊 Executing simplified query first...')
    const { data: response, error } = await supabase
      .from('survey_responses')
      .select(`
        *,
        survey_templates!inner(
          id,
          name,
          description,
          questions,
          settings,
          language
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('❌ Database error:', error)
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Vastausta ei löytynyt' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'Vastauksen haku epäonnistui' },
        { status: 500 }
      )
    }

    // Apply access control for non-admin users
    if (!isAdmin && response.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Ei oikeutta tarkastella tätä vastausta' },
        { status: 403 }
      )
    }

    // Get additional data separately to avoid join issues
    let userProfile = null
    let surveyInvitation = null
    let companyData = null

    // Get user profile if user_id exists
    if (response.user_id) {
      console.log('📊 Fetching user profile...')
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('id', response.user_id)
        .single()
      
      userProfile = profile
    }

    // Get survey invitation if invitation_id exists
    if (response.invitation_id) {
      console.log('📊 Fetching survey invitation...')
      const { data: invitation } = await supabase
        .from('survey_invitations')
        .select('id, email, sent_at, opened_at, completed_at, invitation_status')
        .eq('id', response.invitation_id)
        .single()
      
      surveyInvitation = invitation
    }

    // Get company data if company_id exists
    if (response.company_id) {
      console.log('📊 Fetching company data...')
      const { data: company } = await supabase
        .from('companies')
        .select('id, name, business_id, industry')
        .eq('id', response.company_id)
        .single()
      
      companyData = company
    }

    console.log('✅ Retrieved detailed survey response:', response.id)

    return NextResponse.json({
      response: {
        ...response,
        profiles: userProfile,
        survey_invitations: surveyInvitation,
        companies: companyData
      },
      message: 'Vastauksen tiedot haettu onnistuneesti'
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
 * PUT /api/surveys/responses/[id]
 * Update survey response (Admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('\n📝 [PUT /api/surveys/responses/:id]', {
      responseId: id
    })

    // Verify authentication
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Puuttuva tai virheellinen valtuutus' },
        { status: 401 }
      )
    }

    const authClient = await createClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser(
      authHeader.split(' ')[1]
    )

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Valtuutus epäonnistui' },
        { status: 401 }
      )
    }

    // Check admin status
    const { data: profile } = await authClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: 'Toiminto vaatii ylläpitäjän oikeudet' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { answers, completion_status, notes } = body

    // Use service role for admin operations
    const supabase = await createClient(undefined, true)

    // Update response
    const { data: updatedResponse, error: updateError } = await supabase
      .from('survey_responses')
      .update({
        answers: answers || undefined,
        completion_status: completion_status || undefined,
        notes: notes || undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Update error:', updateError)
      return NextResponse.json(
        { error: 'Vastauksen päivitys epäonnistui' },
        { status: 500 }
      )
    }

    console.log('✅ Updated survey response:', updatedResponse.id)

    return NextResponse.json({
      response: updatedResponse,
      message: 'Vastaus päivitetty onnistuneesti'
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
 * DELETE /api/surveys/responses/[id]
 * Delete survey response (Admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('\n📝 [DELETE /api/surveys/responses/:id]', {
      responseId: id
    })

    // Verify authentication and admin status
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Puuttuva tai virheellinen valtuutus' },
        { status: 401 }
      )
    }

    const authClient = await createClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser(
      authHeader.split(' ')[1]
    )

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Valtuutus epäonnistui' },
        { status: 401 }
      )
    }

    const { data: profile } = await authClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: 'Toiminto vaatii ylläpitäjän oikeudet' },
        { status: 403 }
      )
    }

    // Use service role for admin operations
    const supabase = await createClient(undefined, true)

    // Delete response
    const { error: deleteError } = await supabase
      .from('survey_responses')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('❌ Delete error:', deleteError)
      return NextResponse.json(
        { error: 'Vastauksen poisto epäonnistui' },
        { status: 500 }
      )
    }

    console.log('✅ Deleted survey response:', id)

    return NextResponse.json({
      message: 'Vastaus poistettu onnistuneesti'
    })

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json(
      { error: 'Sisäinen palvelinvirhe' },
      { status: 500 }
    )
  }
}

