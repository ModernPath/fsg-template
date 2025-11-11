import { NextRequest, NextResponse } from 'next/server'
import { EmailTemplateService } from '@/lib/services/emailTemplateService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the webhook payload
    if (!body.user_id || !body.email) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id and email' },
        { status: 400 }
      )
    }

    const { user_id, email, full_name, company } = body

    // Initialize email service
    const emailService = new EmailTemplateService()

    // Send customer welcome email
    await emailService.sendWelcomeEmail(
      company || 'Yrityksesi',
      email,
      full_name || 'Asiakas'
    )

    console.log(`✅ Customer welcome email sent to ${email} for user ${user_id}`)

    return NextResponse.json({ 
      success: true, 
      message: 'Welcome email sent successfully' 
    })

  } catch (error) {
    console.error('❌ Error sending customer welcome email:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send welcome email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 