import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

// Validation schemas
const createResponseSchema = z.object({
  template_id: z.string().uuid(),
  invitation_token: z.string().optional(),
  answers: z.record(z.any()),
  completion_status: z.enum(['started', 'in_progress', 'completed', 'abandoned']).optional().default('started'),
  session_duration: z.number().optional(),
  referrer: z.string().optional()
})

const updateResponseSchema = z.object({
  id: z.string().uuid(),
  answers: z.record(z.any()),
  completion_status: z.enum(['started', 'in_progress', 'completed', 'abandoned']).optional(),
  session_duration: z.number().optional()
})

/**
 * GET /api/surveys/responses
 * Retrieve survey responses
 * - Users: Only their own responses
 * - Admin: All responses with filtering options
 */
export async function GET(request: NextRequest) {
  try {
    console.log('\n📝 [GET /api/surveys/responses]', {
      url: request.url
    })

    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('template_id')
    const responseId = searchParams.get('id')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

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
    const { data: profile } = await authClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.is_admin || false
    console.log('🔑 User context:', { userId: user.id, isAdmin, profile })

    // Create query - use service role for admin operations
    console.log('🔌 Creating Supabase client with service role:', isAdmin)
    const supabase = await createClient(undefined, isAdmin)
    let query = supabase
      .from('survey_responses')
      .select(`
        *,
        survey_templates!inner(name, description, questions),
        survey_invitations(email, sent_at)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply access control
    if (!isAdmin) {
      // Regular users can only see their own responses
      query = query.eq('user_id', user.id)
    }

    // Apply filters
    if (templateId) {
      query = query.eq('template_id', templateId)
    }

    if (responseId) {
      query = query.eq('id', responseId)
    }

    if (status) {
      query = query.eq('completion_status', status)
    }

    console.log('📊 Executing query...')
    const { data: responses, error } = await query

    if (error) {
      console.error('❌ Database error:', error)
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return NextResponse.json(
        { error: 'Vastausten haku epäonnistui' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('survey_responses')
      .select('*', { count: 'exact', head: true })

    if (!isAdmin) {
      countQuery = countQuery.eq('user_id', user.id)
    }
    if (templateId) {
      countQuery = countQuery.eq('template_id', templateId)
    }
    if (status) {
      countQuery = countQuery.eq('completion_status', status)
    }

    const { count } = await countQuery

    console.log(`✅ Retrieved ${responses?.length || 0} survey responses`)

    return NextResponse.json({
      responses: responses || [],
      meta: {
        total: count || 0,
        limit,
        offset,
        isAdmin
      }
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
 * POST /api/surveys/responses
 * Create new survey response (Anonymous or authenticated)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('\n📝 [POST /api/surveys/responses]')

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createResponseSchema.parse(body)

    console.log('📊 Creating survey response:', {
      template_id: validatedData.template_id,
      completion_status: validatedData.completion_status,
      has_token: !!validatedData.invitation_token
    })

    // Get client IP and user agent for tracking
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    let userId = null
    let companyId = null
    let invitationId = null

    // Check if user is authenticated
    const authHeader = request.headers.get('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const authClient = await createClient()
      const { data: { user }, error: authError } = await authClient.auth.getUser(
        authHeader.split(' ')[1]
      )

      if (!authError && user) {
        userId = user.id
        console.log('✅ Authenticated user:', userId)

        // Get user's company
        const { data: profile } = await authClient
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single()

        companyId = profile?.company_id
      }
    }

    // Validate invitation token if provided
    if (validatedData.invitation_token) {
      const supabase = await createClient()
      const { data: invitation, error: inviteError } = await supabase
        .from('survey_invitations')
        .select('id, user_id, company_id, template_id, expires_at, invitation_status')
        .eq('token', validatedData.invitation_token)
        .single()

      if (inviteError || !invitation) {
        console.error('❌ Invalid invitation token:', validatedData.invitation_token)
        return NextResponse.json(
          { error: 'Virheellinen kutsulinkki' },
          { status: 400 }
        )
      }

      // Check if invitation is still valid
      if (new Date() > new Date(invitation.expires_at)) {
        console.error('❌ Expired invitation token:', validatedData.invitation_token)
        return NextResponse.json(
          { error: 'Kutsulinkki on vanhentunut' },
          { status: 400 }
        )
      }

      // Check if invitation matches template
      if (invitation.template_id !== validatedData.template_id) {
        console.error('❌ Template mismatch for invitation')
        return NextResponse.json(
          { error: 'Virheellinen kyselylinkki' },
          { status: 400 }
        )
      }

      invitationId = invitation.id
      companyId = invitation.company_id || companyId
      userId = invitation.user_id || userId

      console.log('✅ Valid invitation token:', { invitationId, userId, companyId })
    }

    // Verify template exists and is active
    const supabase = await createClient()
    const { data: template, error: templateError } = await supabase
      .from('survey_templates')
      .select('id, is_active')
      .eq('id', validatedData.template_id)
      .single()

    if (templateError || !template) {
      console.error('❌ Template not found:', validatedData.template_id)
      return NextResponse.json(
        { error: 'Kyselyä ei löytynyt' },
        { status: 404 }
      )
    }

    if (!template.is_active) {
      console.error('❌ Template not active:', validatedData.template_id)
      return NextResponse.json(
        { error: 'Kysely ei ole aktiivinen' },
        { status: 400 }
      )
    }

    // Create response
    const { data: newResponse, error: createError } = await supabase
      .from('survey_responses')
      .insert({
        template_id: validatedData.template_id,
        user_id: userId,
        company_id: companyId,
        invitation_id: invitationId,
        answers: validatedData.answers,
        completion_status: validatedData.completion_status,
        session_duration: validatedData.session_duration,
        ip_address: clientIP,
        user_agent: userAgent,
        referrer: validatedData.referrer
      })
      .select()
      .single()

    if (createError) {
      console.error('❌ Error creating response:', createError)
      
      // Handle unique constraint violations (duplicate responses)
      if (createError.code === '23505') { // PostgreSQL unique violation
        console.log('ℹ️ Duplicate response attempt detected')
        return NextResponse.json(
          { 
            error: 'Vastaus on jo tallennettu',
            code: 'DUPLICATE_RESPONSE',
            message: 'Olet jo vastannut tähän kyselyyn'
          },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { error: 'Vastauksen tallennus epäonnistui' },
        { status: 500 }
      )
    }

    // Update invitation status if applicable
    if (invitationId) {
      await supabase
        .from('survey_invitations')
        .update({ 
          invitation_status: validatedData.completion_status === 'completed' ? 'completed' : 'opened',
          opened_at: new Date().toISOString()
        })
        .eq('id', invitationId)
    }

    console.log('✅ Survey response created:', newResponse.id)

    return NextResponse.json({
      response: newResponse,
      message: 'Vastaus tallennettu onnistuneesti'
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Validation error:', error.errors)
      return NextResponse.json(
        { 
          error: 'Virheelliset tiedot',
          details: error.errors
        },
        { status: 400 }
      )
    }

    console.error('❌ Unexpected error:', error)
    return NextResponse.json(
      { error: 'Sisäinen palvelinvirhe' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/surveys/responses
 * Update existing survey response
 */
export async function PUT(request: NextRequest) {
  try {
    console.log('\n📝 [PUT /api/surveys/responses]')

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateResponseSchema.parse(body)

    console.log('📊 Updating survey response:', validatedData.id)

    // Get user context
    let userId = null
    let isAdmin = false

    const authHeader = request.headers.get('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const authClient = await createClient()
      const { data: { user }, error: authError } = await authClient.auth.getUser(
        authHeader.split(' ')[1]
      )

      if (!authError && user) {
        userId = user.id

        // Check admin status
        const { data: profile } = await authClient
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single()

        isAdmin = profile?.is_admin || false
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Kirjautuminen vaaditaan' },
        { status: 401 }
      )
    }

    console.log('🔑 User context:', { userId, isAdmin })
    
    // Check if response exists and user has permission to update it
    let query = await createClient()
      .from('survey_responses')
      .select('id, user_id, completion_status, invitation_id') // Lisätty invitation_id
      .eq('id', validatedData.id)

    // Non-admin users can only update their own responses
    if (!isAdmin && userId) {
      query = query.eq('user_id', userId)
    }

    const { data: existingResponse, error: fetchError } = await query.single()

    if (fetchError || !existingResponse) {
      console.error('❌ Response not found or no permission:', validatedData.id)
      return NextResponse.json(
        { error: 'Vastausta ei löytynyt tai ei oikeuksia' },
        { status: 404 }
      )
    }

    // Don't allow updating completed responses unless admin
    if (existingResponse.completion_status === 'completed' && !isAdmin) {
      console.error('❌ Cannot update completed response:', validatedData.id)
      return NextResponse.json(
        { error: 'Valmista vastausta ei voi muokata' },
        { status: 400 }
      )
    }

    // Update response
    const { id, ...updateData } = validatedData

    const { data: updatedResponse, error: updateError } = await createClient()
      .from('survey_responses')
      .update(updateData)
      .eq('id', validatedData.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating response:', updateError)
      return NextResponse.json(
        { error: 'Vastauksen päivitys epäonnistui' },
        { status: 500 }
      )
    }

    // Update invitation status if response is completed
    if (updateData.completion_status === 'completed' && existingResponse.invitation_id) {
      await createClient()
        .from('survey_invitations')
        .update({
          invitation_status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', existingResponse.invitation_id)
    }

    console.log('✅ Survey response updated:', updatedResponse.id)

    return NextResponse.json({
      response: updatedResponse,
      message: 'Vastaus päivitetty onnistuneesti'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Validation error:', error.errors)
      return NextResponse.json(
        { 
          error: 'Virheelliset tiedot',
          details: error.errors
        },
        { status: 400 }
      )
    }

    console.error('❌ Unexpected error:', error)
    return NextResponse.json(
      { error: 'Sisäinen palvelinvirhe' },
      { status: 500 }
    )
  }
}
