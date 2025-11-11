import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

// Validation schemas
const createSurveyTemplateSchema = z.object({
  name: z.string().min(1, 'Kyselyn nimi on pakollinen'),
  description: z.string().optional(),
  questions: z.record(z.any()), // JSONB structure
  settings: z.record(z.any()).optional(),
  is_active: z.boolean().optional().default(false),
  is_default: z.boolean().optional().default(false)
})

const updateSurveyTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  questions: z.record(z.any()).optional(),
  settings: z.record(z.any()).optional(),
  is_active: z.boolean().optional(),
  is_default: z.boolean().optional()
})

/**
 * GET /api/surveys/templates
 * Retrieve survey templates
 * - Public: Only active templates
 * - Admin: All templates
 */
export async function GET(request: NextRequest) {
  try {
    console.log('\n📝 [GET /api/surveys/templates]', {
      url: request.url
    })

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('include_inactive') === 'true'
    const templateId = searchParams.get('id')
    const language = searchParams.get('language') || searchParams.get('locale') || 'fi' // Default to Finnish

    // Initialize user context variables
    let userId: string | null = null
    let isAdmin = false

    // Check for Bearer token authentication
    const authHeader = request.headers.get('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      console.log('🔄 Trying Bearer token authentication...')
      const authClient = await createClient()
      const { data: { user: tokenUser }, error: tokenAuthError } = await authClient.auth.getUser(
        authHeader.split(' ')[1]
      )

      if (!tokenAuthError && tokenUser) {
        userId = tokenUser.id
        console.log('✅ Bearer token authentication successful:', tokenUser.id)
        
        // Check admin status
        const { data: profile } = await authClient
          .from('profiles')
          .select('is_admin')
          .eq('id', tokenUser.id)
          .single()

        isAdmin = profile?.is_admin || false
      }
    }

    console.log('🔑 User context:', { userId, isAdmin })

    // Create appropriate client for database queries
    const adminSupabase = await createClient(undefined, true)
    let query = adminSupabase
      .from('survey_templates')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters based on access level
    if (!isAdmin) {
      // Public access: only active templates
      query = query.eq('is_active', true)
    } else if (!includeInactive) {
      // Admin but not requesting inactive
      query = query.eq('is_active', true)
    }

    // Filter by language only if language column exists
    // Check if language column exists first
    try {
      const { data: columns } = await adminSupabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', 'survey_templates')
        .eq('column_name', 'language')
        .single()
      
      if (columns) {
        query = query.eq('language', language)
      }
    } catch (error) {
      // Language column doesn't exist, skip language filter
      console.log('Language column not found, skipping language filter')
    }

    // Filter by specific template ID if provided
    if (templateId) {
      query = query.eq('id', templateId)
    }

    const { data: templates, error } = await query

    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json(
        { error: 'Kyselypohjien haku epäonnistui' },
        { status: 500 }
      )
    }

    console.log(`✅ Retrieved ${templates?.length || 0} survey templates`)

    return NextResponse.json({
      templates: templates || [],
      meta: {
        total: templates?.length || 0,
        isAdmin,
        includeInactive
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
 * POST /api/surveys/templates
 * Create new survey template (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('\n📝 [POST /api/surveys/templates]')

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

    // Verify admin status
    const { data: profile } = await authClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      console.error('❌ User is not admin:', user.id)
      return NextResponse.json(
        { error: 'Toiminto vaatii ylläpitäjän oikeudet' },
        { status: 403 }
      )
    }

    console.log('✅ Admin user authenticated:', user.id)

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createSurveyTemplateSchema.parse(body)

    console.log('📊 Creating survey template:', {
      name: validatedData.name,
      is_active: validatedData.is_active,
      is_default: validatedData.is_default
    })

    // Use service role client for admin operations
    const supabase = await createClient(undefined, true)

    // If setting as default, unset other defaults first
    if (validatedData.is_default) {
      const { error: updateError } = await supabase
        .from('survey_templates')
        .update({ is_default: false })
        .eq('is_default', true)

      if (updateError) {
        console.error('❌ Error updating default templates:', updateError)
        return NextResponse.json(
          { error: 'Oletuskyselyn päivitys epäonnistui' },
          { status: 500 }
        )
      }
    }

    // Create new template
    const { data: newTemplate, error: createError } = await supabase
      .from('survey_templates')
      .insert({
        ...validatedData,
        created_by: user.id
      })
      .select()
      .single()

    if (createError) {
      console.error('❌ Error creating template:', createError)
      return NextResponse.json(
        { error: 'Kyselypohjan luominen epäonnistui' },
        { status: 500 }
      )
    }

    console.log('✅ Survey template created:', newTemplate.id)

    return NextResponse.json({
      template: newTemplate,
      message: 'Kyselypohja luotu onnistuneesti'
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
 * PUT /api/surveys/templates
 * Update existing survey template (Admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    console.log('\n📝 [PUT /api/surveys/templates]')

    // Verify authentication
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Puuttuva tai virheellinen valtuutus' },
        { status: 401 }
      )
    }

    // Verify token and admin status
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

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateSurveyTemplateSchema.parse(body)

    console.log('📊 Updating survey template:', validatedData.id)

    // Use service role client
    const supabase = await createClient(undefined, true)

    // If setting as default, unset other defaults first
    if (validatedData.is_default) {
      await supabase
        .from('survey_templates')
        .update({ is_default: false })
        .eq('is_default', true)
        .neq('id', validatedData.id)
    }

    // Update template
    const updateData = { ...validatedData }
    delete (updateData as any).id

    const { data: updatedTemplate, error: updateError } = await supabase
      .from('survey_templates')
      .update(updateData)
      .eq('id', validatedData.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating template:', updateError)
      return NextResponse.json(
        { error: 'Kyselypohjan päivitys epäonnistui' },
        { status: 500 }
      )
    }

    console.log('✅ Survey template updated:', updatedTemplate.id)

    return NextResponse.json({
      template: updatedTemplate,
      message: 'Kyselypohja päivitetty onnistuneesti'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
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
 * DELETE /api/surveys/templates
 * Delete survey template (Admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log('\n📝 [DELETE /api/surveys/templates]')

    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')

    if (!templateId) {
      return NextResponse.json(
        { error: 'Kyselypohjan ID puuttuu' },
        { status: 400 }
      )
    }

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

    console.log('📊 Deleting survey template:', templateId)

    // Use service role client
    const supabase = await createClient(undefined, true)

    // Check if template has responses
    const { data: responses } = await supabase
      .from('survey_responses')
      .select('id')
      .eq('template_id', templateId)
      .limit(1)

    if (responses && responses.length > 0) {
      return NextResponse.json(
        { error: 'Kyselypohjaa ei voi poistaa, koska siihen on vastattu' },
        { status: 400 }
      )
    }

    // Delete template
    const { error: deleteError } = await supabase
      .from('survey_templates')
      .delete()
      .eq('id', templateId)

    if (deleteError) {
      console.error('❌ Error deleting template:', deleteError)
      return NextResponse.json(
        { error: 'Kyselypohjan poisto epäonnistui' },
        { status: 500 }
      )
    }

    console.log('✅ Survey template deleted:', templateId)

    return NextResponse.json({
      message: 'Kyselypohja poistettu onnistuneesti'
    })

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json(
      { error: 'Sisäinen palvelinvirhe' },
      { status: 500 }
    )
  }
}
