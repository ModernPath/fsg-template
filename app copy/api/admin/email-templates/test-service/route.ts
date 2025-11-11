import { NextResponse } from 'next/server'
import { emailTemplateService } from '@/lib/services/emailTemplateService'

export async function GET(request: Request) {
  try {
    console.log('\n🧪 Testing Email Template Service...')

    // Test getting template stats
    const stats = await emailTemplateService.getTemplateStats()
    console.log('📊 Template Stats:', stats)

    // Test getting all templates
    const templates = await emailTemplateService.getAllTemplates()
    console.log('📧 Available Templates:', templates.map(t => `${t.name} (${t.type})`))

    // Test rendering welcome email
    const welcomeEmail = await emailTemplateService.getRenderedEmail('welcome', {
      company_name: 'Testi Oy'
    })

    // Test rendering document upload email
    const documentEmail = await emailTemplateService.getRenderedEmail('document_upload', {
      company_name: 'Testi Oy'
    })

    // Test rendering funding options email
    const fundingEmail = await emailTemplateService.getRenderedEmail('funding_options', {
      company_name: 'Testi Oy',
      options_count: 3,
      funding_options_summary: 'Pankit, rahoitusyhtiöt ja julkinen rahoitus'
    })

    return NextResponse.json({
      success: true,
      stats,
      templatesAvailable: templates.length,
      templates: templates.map(t => ({ name: t.name, type: t.type, active: t.is_active })),
      testResults: {
        welcome: welcomeEmail ? 'Success' : 'Failed',
        documentUpload: documentEmail ? 'Success' : 'Failed',
        fundingOptions: fundingEmail ? 'Success' : 'Failed'
      },
      renderedExamples: {
        welcome: welcomeEmail ? {
          subject: welcomeEmail.subject,
          bodyPreview: welcomeEmail.body.substring(0, 100) + '...'
        } : null,
        documentUpload: documentEmail ? {
          subject: documentEmail.subject,
          bodyPreview: documentEmail.body.substring(0, 100) + '...'
        } : null,
        fundingOptions: fundingEmail ? {
          subject: fundingEmail.subject,
          bodyPreview: fundingEmail.body.substring(0, 100) + '...'
        } : null
      }
    })

  } catch (error) {
    console.error('❌ Error testing email template service:', error)
    return NextResponse.json(
      { error: 'Failed to test email template service' },
      { status: 500 }
    )
  }
} 