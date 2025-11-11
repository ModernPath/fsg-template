import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { EmailTemplateFormData } from '@/types/email'

// GET /api/admin/email-templates
export async function GET(request: Request) {
  try {
    console.log('\n📝 [GET /api/admin/email-templates]')
    
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const active = searchParams.get('active')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    console.log('🔍 Query params:', { type, active, page, limit })

    // Skip authentication in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ Authentication skipped in development mode')
    } else {
      // Check Authorization header
      const authHeader = request.headers.get('Authorization')
      if (!authHeader?.startsWith('Bearer ')) {
        console.error('❌ Missing or invalid auth header')
        return NextResponse.json(
          { error: 'Missing or invalid authorization header' },
          { status: 401 }
        )
      }

      // Verify token
      console.log('🔑 Creating auth client...')
      const authClient = await createClient()
      const { data: { user }, error: authError } = await authClient.auth.getUser(
        authHeader.split(' ')[1]
      )
      
      if (authError || !user) {
        console.error('❌ Auth error:', authError)
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      console.log('✅ User authenticated:', user.id)

      // Check if user is admin
      const { data: profile } = await authClient
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (!profile?.is_admin) {
        console.error('❌ User is not admin')
        return NextResponse.json(
          { error: 'Forbidden - Admin access required' },
          { status: 403 }
        )
      }

      console.log('✅ Admin access confirmed')
    }

    // Create service role client for database operations
    const supabase = await createClient(undefined, true)

    // Build query
    console.log('🔍 Building query...')
    
    // Handle survey type specially - fetch from survey_email_templates
    if (type === 'survey') {
      console.log('🔽 Fetching survey email templates from survey_email_templates table')
      
      let surveyQuery = supabase
        .from('survey_email_templates')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
      
      if (active !== null) {
        console.log('🔽 Adding active filter for survey templates:', active)
        surveyQuery = surveyQuery.eq('is_active', active === 'true')
      }
      
      // Add pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      console.log('📄 Adding pagination for survey templates:', { from, to, page, limit })
      surveyQuery = surveyQuery.range(from, to)
      
      console.log('📊 Executing survey templates query...')
      const { data: surveyTemplates, error: surveyError, count: surveyCount } = await surveyQuery
      
      if (surveyError) {
        console.error('❌ Error fetching survey email templates:', surveyError)
        return NextResponse.json(
          { error: 'Failed to fetch survey email templates' },
          { status: 500 }
        )
      }
      
      // Transform survey templates to match email_templates format
      const transformedTemplates = surveyTemplates?.map(template => ({
        id: template.id,
        name: template.name,
        type: 'survey_' + template.template_type, // e.g., survey_invitation
        subject: template.subject,
        body: template.html_content,
        variables: template.variables,
        is_active: template.is_active,
        is_default: template.is_default,
        version: 1,
        description: template.description,
        created_by: null,
        created_at: template.created_at,
        updated_at: template.updated_at,
        language: template.language_code || 'fi',
        master_template_id: null
      })) || []
      
      console.log('✅ Survey templates query successful:', { count: surveyCount, templatesCount: transformedTemplates.length })
      
      return NextResponse.json({
        templates: transformedTemplates,
        total: surveyCount || 0,
        page,
        limit,
        totalPages: Math.ceil((surveyCount || 0) / limit)
      })
    }
    
    // Regular email templates query
    let query = supabase
      .from('email_templates')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Add filters
    if (type && type !== 'survey') {
      console.log('🔽 Adding type filter:', type)
      query = query.eq('type', type)
    }
    if (active !== null) {
      console.log('🔽 Adding active filter:', active)
      query = query.eq('is_active', active === 'true')
    }

    // Add pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    console.log('📄 Adding pagination:', { from, to, page, limit })
    query = query.range(from, to)

    console.log('📊 Executing query...')
    const { data: templates, error, count } = await query

    if (error) {
      console.error('❌ Error fetching email templates:', error)
      return NextResponse.json(
        { error: 'Failed to fetch email templates' },
        { status: 500 }
      )
    }

    console.log('✅ Query successful:', { count, templatesCount: templates?.length })

    return NextResponse.json({
      templates,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })

  } catch (error) {
    console.error('❌ Error in email templates GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/email-templates
export async function POST(request: Request) {
  try {
    console.log('\n📝 [POST /api/admin/email-templates]')
    
    const body: EmailTemplateFormData = await request.json()
    console.log('📥 Request body:', { name: body.name, type: body.type })

    // Check Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid auth header')
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    // Verify token
    console.log('🔑 Creating auth client...')
    const authClient = await createClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser(
      authHeader.split(' ')[1]
    )
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('✅ User authenticated:', user.id)

    // Check if user is admin
    const { data: profile } = await authClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      console.error('❌ User is not admin')
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    console.log('✅ Admin access confirmed for POST')

    // Create service role client for database operations
    const supabase = await createClient(undefined, true)

    // Validate required fields
    if (!body.name || !body.subject || !body.body) {
      return NextResponse.json(
        { error: 'Name, subject, and body are required' },
        { status: 400 }
      )
    }

    // If this is set as default, unset other defaults of the same type
    if (body.is_default) {
      await supabase
        .from('email_templates')
        .update({ is_default: false })
        .eq('type', body.type)
    }

    // Create the new template
    const { data: template, error } = await supabase
      .from('email_templates')
      .insert({
        name: body.name,
        type: body.type,
        subject: body.subject,
        body: body.body,
        description: body.description,
        variables: body.variables || {},
        is_active: body.is_active,
        is_default: body.is_default,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating email template:', error)
      return NextResponse.json(
        { error: 'Failed to create email template' },
        { status: 500 }
      )
    }

    console.log('✅ Template created successfully:', template.id)
    return NextResponse.json({ template }, { status: 201 })

  } catch (error) {
    console.error('❌ Error in email templates POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

 