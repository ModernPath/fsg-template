import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

// Validation schema for auto-invitation creation
const autoInvitationSchema = z.object({
  user_id: z.string().uuid(),
  template_id: z.string().uuid().optional(), // Optional - can use default template
  email: z.string().email().optional(),
  company_id: z.string().uuid().optional()
})

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

/**
 * POST /api/surveys/invitations/auto
 * Create an auto-invitation that doesn't expire (for registered users)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('\n📝 [POST /api/surveys/invitations/auto]')

    // Parse and validate request body
    const body = await request.json()
    const validatedData = autoInvitationSchema.parse(body)

    console.log('📊 Creating auto survey invitation:', {
      user_id: validatedData.user_id,
      template_id: validatedData.template_id,
      email: validatedData.email
    })

    const supabase = await createClient()

    // Get user profile if user_id provided
    let userProfile = null
    if (validatedData.user_id) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, company_id')
        .eq('id', validatedData.user_id)
        .single()

      if (profileError) {
        console.error('❌ User profile not found:', validatedData.user_id)
        return NextResponse.json(
          { error: 'Käyttäjää ei löytynyt' },
          { status: 404 }
        )
      }
      userProfile = profile
    }

    // Determine template ID - use default if not provided
    let templateId = validatedData.template_id
    if (!templateId) {
      // Get the default active survey template
      const { data: defaultTemplate, error: templateError } = await supabase
        .from('survey_templates')
        .select('id')
        .eq('is_active', true)
        .eq('is_default', true) // Assuming we have a default flag
        .single()

      if (templateError || !defaultTemplate) {
        // Fallback to any active template
        const { data: anyTemplate, error: anyTemplateError } = await supabase
          .from('survey_templates')
          .select('id')
          .eq('is_active', true)
          .limit(1)
          .single()

        if (anyTemplateError || !anyTemplate) {
          return NextResponse.json(
            { error: 'Aktiivista kyselypohjaa ei löytynyt' },
            { status: 404 }
          )
        }
        templateId = anyTemplate.id
      } else {
        templateId = defaultTemplate.id
      }
    }

    // Check if invitation already exists for this user and template
    const { data: existingInvitation } = await supabase
      .from('survey_invitations')
      .select('id, token, invitation_status')
      .eq('template_id', templateId)
      .eq('user_id', validatedData.user_id)
      .single()

    if (existingInvitation) {
      console.log('✅ Existing invitation found, returning existing token')
      return NextResponse.json({
        invitation: {
          id: existingInvitation.id,
          token: existingInvitation.token,
          status: existingInvitation.invitation_status
        },
        message: 'Kutsulinkki löytyi onnistuneesti'
      })
    }

    // Create new invitation with no expiration (set far in the future)
    const farFutureDate = new Date()
    farFutureDate.setFullYear(farFutureDate.getFullYear() + 10) // 10 years from now

    const invitationData = {
      template_id: templateId,
      user_id: validatedData.user_id,
      company_id: userProfile?.company_id || validatedData.company_id,
      email: userProfile?.email || validatedData.email,
      token: await generateInvitationToken(),
      expires_at: farFutureDate.toISOString(), // Set far in the future
      invitation_status: 'auto_created' // Special status for auto-created invitations
    }

    const { data: newInvitation, error: createError } = await supabase
      .from('survey_invitations')
      .insert(invitationData)
      .select()
      .single()

    if (createError) {
      console.error('❌ Error creating auto invitation:', createError)
      return NextResponse.json(
        { error: 'Kutsulinkin luominen epäonnistui' },
        { status: 500 }
      )
    }

    console.log('✅ Auto survey invitation created successfully')

    return NextResponse.json({
      invitation: {
        id: newInvitation.id,
        token: newInvitation.token,
        status: newInvitation.invitation_status,
        expires_at: newInvitation.expires_at
      },
      message: 'Kutsulinkki luotu onnistuneesti'
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Validation error:', error.errors)
      return NextResponse.json(
        { error: 'Virheelliset tiedot', details: error.errors },
        { status: 400 }
      )
    }

    console.error('❌ Unexpected error:', error)
    return NextResponse.json(
      { error: 'Odottamaton virhe' },
      { status: 500 }
    )
  }
}
