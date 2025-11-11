import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { EmailTemplateFormData } from '@/types/email'

async function authenticateUser(request: Request) {
  // Check Authorization header
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    console.error('❌ Missing or invalid auth header')
    return { user: null, error: 'Missing or invalid authorization header' }
  }

  // Verify token
  console.log('🔑 Creating auth client...')
  const authClient = await createClient()
  const { data: { user }, error: authError } = await authClient.auth.getUser(
    authHeader.split(' ')[1]
  )
  
  if (authError || !user) {
    console.error('❌ Auth error:', authError)
    return { user: null, error: 'Unauthorized' }
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
    return { user: null, error: 'Forbidden - Admin access required' }
  }

  console.log('✅ Admin access confirmed')
  return { user, error: null }
}

// GET /api/admin/email-templates/[templateId]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    console.log('\n📝 [GET /api/admin/email-templates/single]')
    const { templateId } = await params
    console.log('📋 Template ID:', templateId)

    // Check admin permissions
    const { user, error: authError } = await authenticateUser(request)
    
    if (authError || !user) {
      console.log('❌ Authentication failed in single template GET')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ Admin access confirmed for single template GET')

    // Create service role client for database operations
    const supabase = await createClient(undefined, true)

    // Fetch the template
    console.log('📊 Fetching single template...')
    const { data: template, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('❌ Template not found')
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }
      console.error('❌ Error fetching email template:', error)
      return NextResponse.json(
        { error: 'Failed to fetch email template' },
        { status: 500 }
      )
    }

    console.log('✅ Single template fetched successfully')
    return NextResponse.json({ template })

  } catch (error) {
    console.error('❌ Error in email template GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/email-templates/[templateId]
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    console.log('\n📝 [PUT /api/admin/email-templates/single]')
    
    const { templateId } = await params
    const body: EmailTemplateFormData = await request.json()
    console.log('📥 Request body:', { name: body.name, type: body.type, templateId })

    // Check admin permissions
    const { user, error: authError } = await authenticateUser(request)
    
    if (authError || !user) {
      console.log('❌ Authentication failed in single template PUT')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ Admin access confirmed for single template PUT')

    // Create service role client for database operations
    const supabase = await createClient(undefined, true)

    // Validate required fields
    if (!body.name || !body.subject || !body.body) {
      return NextResponse.json(
        { error: 'Name, subject, and body are required' },
        { status: 400 }
      )
    }

    // Get current template for version backup
    const { data: currentTemplate } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (!currentTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Create version backup
    await supabase
      .from('email_template_versions')
      .insert({
        template_id: templateId,
        version: currentTemplate.version,
        changes_description: 'Updated template',
        subject_backup: currentTemplate.subject,
        body_backup: currentTemplate.body,
        variables_backup: currentTemplate.variables,
        created_by: user.id
      })

    // If this is set as default, unset other defaults of the same type
    if (body.is_default && body.type === currentTemplate.type) {
      await supabase
        .from('email_templates')
        .update({ is_default: false })
        .eq('type', body.type)
        .neq('id', templateId)
    }

    // Update the template
    const { data: template, error } = await supabase
      .from('email_templates')
      .update({
        name: body.name,
        type: body.type,
        subject: body.subject,
        body: body.body,
        description: body.description,
        variables: body.variables || {},
        is_active: body.is_active,
        is_default: body.is_default,
        version: currentTemplate.version + 1
      })
      .eq('id', templateId)
      .select()
      .single()

    if (error) {
      console.error('Error updating email template:', error)
      return NextResponse.json(
        { error: 'Failed to update email template' },
        { status: 500 }
      )
    }

    return NextResponse.json({ template })

  } catch (error) {
    console.error('Error in email template PUT:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/email-templates/[templateId]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    console.log('\n📝 [DELETE /api/admin/email-templates/single]')
    const { templateId } = await params
    console.log('📋 Template ID to delete:', templateId)

    // Check admin permissions
    const { user, error: authError } = await authenticateUser(request)
    
    if (authError || !user) {
      console.log('❌ Authentication failed in single template DELETE')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ Admin access confirmed for single template DELETE')

    // Create service role client for database operations
    const supabase = await createClient(undefined, true)

    // Check if template is used in any email sends
    const { data: emailSends, error: sendsError } = await supabase
      .from('email_sends')
      .select('id')
      .eq('template_id', templateId)
      .limit(1)

    if (sendsError) {
      console.error('Error checking email sends:', sendsError)
      return NextResponse.json(
        { error: 'Failed to check template usage' },
        { status: 500 }
      )
    }

    if (emailSends && emailSends.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete template that has been used in email sends' },
        { status: 400 }
      )
    }

    // Delete the template (versions will be cascade deleted)
    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', templateId)

    if (error) {
      console.error('Error deleting email template:', error)
      return NextResponse.json(
        { error: 'Failed to delete email template' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in email template DELETE:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 