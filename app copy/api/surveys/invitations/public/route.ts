import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

// Validation schema for public invitation creation
const publicInvitationSchema = z.object({
  template_id: z.string().uuid().optional(),
  email: z.string().email().optional().nullable(),
  source: z.string().optional().default('swedish-trial'),
  language: z.enum(['fi', 'sv', 'en']).optional().default('fi')
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
 * POST /api/surveys/invitations/public
 * Create a public survey invitation (no authentication required)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('\n📝 [POST /api/surveys/invitations/public]')

    // Parse and validate request body
    const body = await request.json()
    const validatedData = publicInvitationSchema.parse(body)

    console.log('📊 Creating public survey invitation:', {
      template_id: validatedData.template_id,
      email: validatedData.email,
      source: validatedData.source,
      language: validatedData.language
    })

    const supabase = await createClient(undefined, true) // Use service role

    // Determine template ID - use Swedish-Trial if not provided
    let templateId = validatedData.template_id
    if (!templateId) {
      // For Swedish trial, always use the Swedish-Trial survey
      if (validatedData.source === 'swedish-trial') {
        const { data: swedishTemplate, error: swedishError } = await supabase
          .from('survey_templates')
          .select('id, name')
          .eq('name', 'Swedish-Trial')
          .eq('is_active', true)
          .single()

        if (swedishError || !swedishTemplate) {
          console.error('❌ Swedish-Trial survey template not found:', swedishError)
          return NextResponse.json(
            { error: 'Swedish-Trial kysely ei ole saatavilla' },
            { status: 404 }
          )
        }
        
        templateId = swedishTemplate.id
        console.log('📋 Using Swedish-Trial template:', swedishTemplate.name)
      } else {
        // For other sources, get any active template
        const { data: activeTemplate, error: activeError } = await supabase
          .from('survey_templates')
          .select('id, name')
          .eq('is_active', true)
          .limit(1)
          .single()
        
        if (activeError || !activeTemplate) {
          return NextResponse.json(
            { error: 'Ei aktiivisia kyselypohjia saatavilla' },
            { status: 404 }
          )
        }
        templateId = activeTemplate.id
        console.log('📋 Using active template:', activeTemplate.name)
      }
    }

    // Create new invitation with no expiration (set far in the future)
    const farFutureDate = new Date()
    farFutureDate.setFullYear(farFutureDate.getFullYear() + 10) // 10 years from now

    const invitationData = {
      template_id: templateId,
      user_id: null, // No user for public invitations
      company_id: null,
      email: validatedData.email || `public-${Date.now()}@swedish-trial.local`, // Use placeholder email for public invitations
      token: await generateInvitationToken(),
      expires_at: farFutureDate.toISOString(), // Set far in the future
      invitation_status: 'pending' // Use pending status for public invitations
    }

    const { data: newInvitation, error: createError } = await supabase
      .from('survey_invitations')
      .insert(invitationData)
      .select()
      .single()

    if (createError) {
      console.error('❌ Error creating public invitation:', createError)
      return NextResponse.json(
        { error: 'Kutsulinkin luominen epäonnistui' },
        { status: 500 }
      )
    }

    console.log('✅ Public survey invitation created successfully')

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
