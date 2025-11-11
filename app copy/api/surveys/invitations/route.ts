import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

// Validation schemas
const createInvitationSchema = z.object({
  template_id: z.string().uuid(),
  user_ids: z.array(z.string().uuid()).optional(),
  emails: z.array(z.string().email()).optional(),
  send_immediately: z.boolean().optional().default(true),
  expires_in_days: z.number().min(1).max(365).optional().default(30)
}).refine(data => data.user_ids?.length || data.emails?.length, {
  message: "Vähintään yksi käyttäjä tai sähköpostiosoite vaaditaan"
})

const bulkInviteSchema = z.object({
  template_id: z.string().uuid(),
  target: z.enum(['all_users', 'active_users', 'no_recent_analysis']),
  exclude_recent_days: z.number().optional().default(30),
  send_immediately: z.boolean().optional().default(false)
})

/**
 * GET /api/surveys/invitations
 * Retrieve survey invitations
 * - Admin: All invitations with filtering
 * - Users: Their own invitations only
 */
export async function GET(request: NextRequest) {
  try {
    console.log('\n📝 [GET /api/surveys/invitations]', {
      url: request.url
    })

    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('template_id')
    const status = searchParams.get('status')
    const userId = searchParams.get('user_id')
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

    console.log('✅ User authenticated:', user.id)

    // Check admin status
    const { data: profile } = await authClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.is_admin || false
    console.log('🔑 User context:', { userId: user.id, isAdmin })

    // Create query
    let query = authClient
      .from('survey_invitations')
      .select(`
        *,
        survey_templates!inner(name, description)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply access control
    if (!isAdmin) {
      // Regular users can only see their own invitations
      query = query.eq('user_id', user.id)
    }

    // Apply filters
    if (templateId) {
      query = query.eq('template_id', templateId)
    }

    if (status) {
      query = query.eq('invitation_status', status)
    }

    if (userId && isAdmin) {
      query = query.eq('user_id', userId)
    }

    const { data: invitations, error } = await query

    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json(
        { error: 'Kutsujen haku epäonnistui' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    let countQuery = authClient
      .from('survey_invitations')
      .select('*', { count: 'exact', head: true })

    if (!isAdmin) {
      countQuery = countQuery.eq('user_id', user.id)
    }
    if (templateId) {
      countQuery = countQuery.eq('template_id', templateId)
    }
    if (status) {
      countQuery = countQuery.eq('invitation_status', status)
    }
    if (userId && isAdmin) {
      countQuery = countQuery.eq('user_id', userId)
    }

    const { count } = await countQuery

    console.log(`✅ Retrieved ${invitations?.length || 0} survey invitations`)

    return NextResponse.json({
      invitations: invitations || [],
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
 * POST /api/surveys/invitations
 * Create survey invitations (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('\n📝 [POST /api/surveys/invitations]')

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

    console.log('✅ Admin user authenticated:', user.id)

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
    const validatedData = createInvitationSchema.parse(body)

    console.log('📊 Creating survey invitations:', {
      template_id: validatedData.template_id,
      user_count: validatedData.user_ids?.length || 0,
      email_count: validatedData.emails?.length || 0,
      send_immediately: validatedData.send_immediately
    })

    // Use service role client
    const adminSupabase = await createClient(undefined, true) // Rename for clarity

    // Verify template exists and is active
    const { data: template, error: templateError } = await adminSupabase
      .from('survey_templates')
      .select('id, name, is_active')
      .eq('id', validatedData.template_id)
      .single()

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Kyselypohjaa ei löytynyt' },
        { status: 404 }
      )
    }

    if (!template.is_active) {
      return NextResponse.json(
        { error: 'Kyselypohja ei ole aktiivinen' },
        { status: 400 }
      )
    }

    const invitationsToCreate = []
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + validatedData.expires_in_days)

    // Process user IDs
    if (validatedData.user_ids && validatedData.user_ids.length > 0) {
      // Get user details
      const { data: users, error: usersError } = await adminSupabase
        .from('profiles')
        .select('id, email, first_name, last_name, company_id')
        .in('id', validatedData.user_ids)

      if (usersError) {
        return NextResponse.json(
          { error: 'Käyttäjätietojen haku epäonnistui' },
          { status: 500 }
        )
      }

      for (const userProfile of users) {
        // Check if invitation already exists
        const { data: existingInvitation } = await adminSupabase
          .from('survey_invitations')
          .select('id')
          .eq('template_id', validatedData.template_id)
          .eq('user_id', userProfile.id)
          .eq('invitation_status', 'pending')
          .single()

        if (!existingInvitation) {
          invitationsToCreate.push({
            template_id: validatedData.template_id,
            user_id: userProfile.id,
            company_id: userProfile.company_id,
            email: userProfile.email,
            token: await generateInvitationToken(),
            expires_at: expiresAt.toISOString(),
            invitation_status: 'pending'
          })
        }
      }
    }

    // Process standalone emails (for non-registered users)
    if (validatedData.emails && validatedData.emails.length > 0) {
      for (const email of validatedData.emails) {
        // Check if user exists
        const { data: existingUser } = await adminSupabase
          .from('profiles')
          .select('id, company_id')
          .eq('email', email)
          .single()

        // Check if invitation already exists
        const { data: existingInvitation } = await adminSupabase
          .from('survey_invitations')
          .select('id')
          .eq('template_id', validatedData.template_id)
          .eq('email', email)
          .eq('invitation_status', 'pending')
          .single()

        if (!existingInvitation) {
          invitationsToCreate.push({
            template_id: validatedData.template_id,
            user_id: existingUser?.id || null,
            company_id: existingUser?.company_id || null,
            email: email,
            token: await generateInvitationToken(),
            expires_at: expiresAt.toISOString(),
            invitation_status: 'pending'
          })
        }
      }
    }

    if (invitationsToCreate.length === 0) {
      return NextResponse.json(
        { error: 'Ei uusia kutsuja luotavaksi (kutsut jo olemassa)' },
        { status: 400 }
      )
    }

    // Create invitations
    const { data: newInvitations, error: createError } = await adminSupabase
      .from('survey_invitations')
      .insert(invitationsToCreate)
      .select()

    if (createError) {
      console.error('❌ Error creating invitations:', createError)
      return NextResponse.json(
        { error: 'Kutsujen luominen epäonnistui' },
        { status: 500 }
      )
    }

    console.log(`✅ Created ${newInvitations.length} survey invitations`)

    // If send_immediately is true, trigger email sending
    if (validatedData.send_immediately) {
      console.log('📧 Sending invitation emails...')
      
      try {
        // Get email template
        const { data: emailTemplate, error: templateError } = await adminSupabase
          .from('survey_email_templates')
          .select('*')
          .eq('template_type', 'invitation')
          .eq('is_active', true)
          .single()

        if (templateError || !emailTemplate) {
          console.error('❌ No active email template found for invitations')
        } else {
          // Send emails to each invitation
          for (const invitation of newInvitations) {
            try {
              // Prepare email variables
              const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
              // Use Swedish locale for Swedish-Trial template, Finnish for others
              const locale = template.name === 'Swedish-Trial' ? 'sv' : 'fi'
              const surveyLink = `${baseUrl}/${locale}/survey/${invitation.token}`
              const unsubscribeLink = `${baseUrl}/unsubscribe?token=${invitation.token}`

              const emailVariables = {
                firstName: invitation.email.split('@')[0].charAt(0).toUpperCase() + invitation.email.split('@')[0].slice(1), // Capitalize first letter
                surveyLink,
                unsubscribeLink
              }

              // Replace template variables
              let subject = emailTemplate.subject
              let htmlContent = emailTemplate.html_content
              let textContent = emailTemplate.text_content || ''

              Object.entries(emailVariables).forEach(([key, value]) => {
                const regex = new RegExp(`{{${key}}}`, 'g')
                subject = subject.replace(regex, value)
                htmlContent = htmlContent.replace(regex, value)
                textContent = textContent.replace(regex, value)
              })

              // Send email using SendGrid
              if (process.env.SENDGRID_API_KEY) {
                const sgMail = require('@sendgrid/mail')
                sgMail.setApiKey(process.env.SENDGRID_API_KEY)

                await sgMail.send({
                  to: invitation.email,
                  from: process.env.SENDER_EMAIL || 'info@trustyfinance.fi',
                  subject: subject,
                  html: htmlContent,
                  text: textContent
                })

                // Update invitation status to sent
                await adminSupabase
                  .from('survey_invitations')
                  .update({ 
                    invitation_status: 'sent',
                    sent_at: new Date().toISOString()
                  })
                  .eq('id', invitation.id)

                console.log(`✅ Email sent to ${invitation.email}`)
              } else {
                console.warn('⚠️ SendGrid API key not configured, skipping email sending')
              }
            } catch (emailError) {
              console.error(`❌ Failed to send email to ${invitation.email}:`, emailError)
              // Continue with other emails even if one fails
            }
          }
        }
      } catch (emailError) {
        console.error('❌ Error in email sending process:', emailError)
        // Don't fail the request if email sending fails
      }
    }

    return NextResponse.json({
      invitations: newInvitations,
      message: `${newInvitations.length} kutsua luotu onnistuneesti`,
      meta: {
        created_count: newInvitations.length,
        will_send_emails: validatedData.send_immediately
      }
    }, { status: 201 })

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
 * POST /api/surveys/invitations/bulk
 * Create bulk survey invitations (Admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    console.log('\n📝 [PUT /api/surveys/invitations] - Bulk invitations')

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

    console.log('✅ Admin user authenticated:', user.id)

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
    const validatedData = bulkInviteSchema.parse(body)

    console.log('📊 Creating bulk survey invitations:', validatedData)

    // Use service role client
    const adminSupabase = await createClient(undefined, true) // Rename for clarity

    // Build user query based on target
    let userQuery = adminSupabase // Use adminSupabase
      .from('profiles')
      .select('id, email, first_name, last_name, company_id, created_at')

    switch (validatedData.target) {
      case 'all_users':
        // All registered users
        userQuery = userQuery.not('email', 'is', null)
        break
        
      case 'active_users':
        // Users who have logged in recently
        const recentDate = new Date()
        recentDate.setDate(recentDate.getDate() - validatedData.exclude_recent_days)
        userQuery = userQuery
          .not('email', 'is', null)
          .gte('last_login', recentDate.toISOString())
        break
        
      case 'no_recent_analysis':
        // Users who haven't done analysis recently
        const analysisDate = new Date()
        analysisDate.setDate(analysisDate.getDate() - validatedData.exclude_recent_days)
        
        // This is a complex query - users who don't have recent financial analysis
        userQuery = userQuery
          .not('email', 'is', null)
        // TODO: Add subquery to exclude users with recent financial analysis
        break
    }

    const { data: targetUsers, error: usersError } = await userQuery

    if (usersError) {
      console.error('❌ Error fetching target users:', usersError)
      return NextResponse.json(
        { error: 'Kohdekäyttäjien haku epäonnistui' },
        { status: 500 }
      )
    }

    if (!targetUsers || targetUsers.length === 0) {
      return NextResponse.json(
        { error: 'Ei kohdekäyttäjiä löytynyt' },
        { status: 400 }
      )
    }

    console.log(`📊 Found ${targetUsers.length} target users for bulk invitation`)

    // Filter out users who already have pending invitations
    const { data: existingInvitations } = await adminSupabase // Use adminSupabase
      .from('survey_invitations')
      .select('user_id, email')
      .eq('template_id', validatedData.template_id)
      .eq('invitation_status', 'pending')

    const existingUserIds = new Set(existingInvitations?.map(inv => inv.user_id) || [])
    const existingEmails = new Set(existingInvitations?.map(inv => inv.email) || [])

    const filteredUsers = targetUsers.filter(user => 
      !existingUserIds.has(user.id) && !existingEmails.has(user.email)
    )

    if (filteredUsers.length === 0) {
      return NextResponse.json(
        { error: 'Kaikille kohdekäyttäjille on jo lähetetty kutsu' },
        { status: 400 }
      )
    }

    // Create invitations
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // 30 days default

    const invitationsToCreate = await Promise.all(
      filteredUsers.map(async (user) => ({
        template_id: validatedData.template_id,
        user_id: user.id,
        company_id: user.company_id,
        email: user.email,
        token: await generateInvitationToken(),
        expires_at: expiresAt.toISOString(),
        invitation_status: 'pending'
      }))
    )

    const { data: newInvitations, error: createError } = await adminSupabase // Use adminSupabase
      .from('survey_invitations')
      .insert(invitationsToCreate)
      .select()

    if (createError) {
      console.error('❌ Error creating bulk invitations:', createError)
      return NextResponse.json(
        { error: 'Joukkosutsjen luominen epäonnistui' },
        { status: 500 }
      )
    }

    console.log(`✅ Created ${newInvitations.length} bulk survey invitations`)

    return NextResponse.json({
      invitations: newInvitations,
      message: `${newInvitations.length} joukkosutsua luotu onnistuneesti`,
      meta: {
        target: validatedData.target,
        total_target_users: targetUsers.length,
        created_count: newInvitations.length,
        skipped_existing: targetUsers.length - filteredUsers.length
      }
    }, { status: 201 })

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
 * Generate a unique invitation token
 */
async function generateInvitationToken(): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
