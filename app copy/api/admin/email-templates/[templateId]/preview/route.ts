import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { EmailTemplateVariables } from '@/types/email'

// Simple template variable replacement function
function renderTemplate(template: string, variables: EmailTemplateVariables): string {
  let rendered = template

  // Replace simple variables like {{variable_name}}
  Object.entries(variables).forEach(([key, value]) => {
    if (typeof value === 'string' || typeof value === 'number') {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      rendered = rendered.replace(regex, String(value))
    }
  })

  // Handle conditional blocks like {{#if variable}}...{{/if}}
  const conditionalRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g
  rendered = rendered.replace(conditionalRegex, (match, varName, content) => {
    const value = variables[varName as keyof EmailTemplateVariables]
    return value ? content : ''
  })

  // Remove any unmatched variables
  rendered = rendered.replace(/\{\{[^}]*\}\}/g, '')

  return rendered
}

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

// POST /api/admin/email-templates/[templateId]/preview
export async function POST(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    console.log('\n📝 [POST /api/admin/email-templates/preview]')
    
    const { templateId } = await params
    const { variables }: { variables: EmailTemplateVariables } = await request.json()
    console.log('📥 Request variables:', Object.keys(variables))

    // Check admin permissions
    const { user, error: authError } = await authenticateUser(request)
    
    if (authError || !user) {
      console.log('❌ Authentication failed in preview')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ Admin access confirmed for preview')

    // Create service role client for database operations
    const supabase = await createClient(undefined, true)

    // Fetch the template
    console.log('📊 Fetching template:', templateId)
    const { data: template, error } = await supabase
      .from('email_templates')
      .select('subject, body, variables')
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

    console.log('✅ Template fetched successfully')

    // Render the template with provided variables
    const renderedSubject = renderTemplate(template.subject, variables)
    const renderedBody = renderTemplate(template.body, variables)

    // Extract variables used in template
    const subjectVariables = [...template.subject.matchAll(/\{\{(\w+)\}\}/g)].map(match => match[1])
    const bodyVariables = [...template.body.matchAll(/\{\{(\w+)\}\}/g)].map(match => match[1])
    const variablesUsed = [...new Set([...subjectVariables, ...bodyVariables])]

    console.log('✅ Preview generated successfully')

    return NextResponse.json({
      subject: renderedSubject,
      body: renderedBody,
      variables_used: variablesUsed,
      template_variables: template.variables
    })

  } catch (error) {
    console.error('❌ Error in email template preview:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 