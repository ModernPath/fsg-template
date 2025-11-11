import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// POST /api/partners/[id]/generate-code - Generate new signup code (Admin only)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    // Get the authorization token from headers
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('POST /api/partners/[id]/generate-code - Missing or invalid auth header')
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
    }

    // Create authenticated client
    const authClient = await createClient()
    
    // Check authentication using the token
    const { data: { user }, error: authError } = await authClient.auth.getUser(
      authHeader.split(' ')[1]
    )
    if (authError || !user) {
      console.log('POST /api/partners/[id]/generate-code - Authentication failed:', authError?.message)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin status
    const { data: profile, error: profileError } = await authClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    console.log('POST /api/partners/[id]/generate-code - Admin check:', { 
      userId: user.id, 
      profileError: profileError?.message, 
      isAdmin: profile?.is_admin,
      userEmail: user.email 
    })

    if (profileError || !profile?.is_admin) {
      console.log('POST /api/partners/[id]/generate-code - Admin check failed:', { userId: user.id, profileError, isAdmin: profile?.is_admin })
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Create service role client for database operations
    const supabase = await createClient(true)

    // Check if partner exists and get contact info
    const { data: existingPartner, error: fetchError } = await supabase
      .from('partners')
      .select('id, name, email, contact_info')
      .eq('id', id)
      .single()

    if (fetchError || !existingPartner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    // Parse optional expiry days from request body
    const body = await request.json().catch(() => ({}))
    const expiryDays = body.expiryDays || 30

    // Generate unique signup code
    const generateCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      let result = ''
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return result
    }

    let signupCode: string
    let attempts = 0
    const maxAttempts = 10

    // Ensure unique code
    do {
      signupCode = generateCode()
      const { data: existing } = await supabase
        .from('partners')
        .select('id')
        .eq('signup_code', signupCode)
        .single()
      
      if (!existing) break
      attempts++
    } while (attempts < maxAttempts)

    if (attempts >= maxAttempts) {
      return NextResponse.json({ error: 'Failed to generate unique code' }, { status: 500 })
    }

    // Calculate expiry date
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + expiryDays)

    // Update partner with new signup code
    const { data: updatedPartner, error: updateError } = await supabase
      .from('partners')
      .update({
        signup_code: signupCode,
        signup_code_expires_at: expiryDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating partner with signup code:', updateError)
      return NextResponse.json({ error: 'Failed to generate signup code' }, { status: 500 })
    }

    // Generate signup URL with partner's preferred language
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const partnerLanguage = existingPartner.contact_info?.language_preference || 'fi'
    const signupUrl = `${baseUrl}/${partnerLanguage}/partner-signup?code=${signupCode}`

    // Log audit trail
    await supabase.rpc('log_partner_audit', {
      p_partner_id: id,
      p_action: 'GENERATE_CODE',
      p_resource_type: 'signup_code',
      p_resource_id: signupCode,
      p_new_values: {
        signup_code: signupCode,
        expires_at: expiryDate.toISOString(),
        expiry_days: expiryDays
      }
    })

    // Send automated partner welcome email with new signup credentials
    try {
      const { EmailTemplateService } = await import('@/lib/services/emailTemplateService')
      const emailService = new EmailTemplateService()
      
      await emailService.sendPartnerWelcomeEmail(
        existingPartner.name,
        existingPartner.email,
        'Kumppani',
        signupCode,
        signupUrl,
        updatedPartner.commission_percent,
        updatedPartner.tier || 'basic',
        'admin@trustyfinance.fi',
        'TrustyFinance Admin'
      )
      
      console.log(`✅ Partner welcome email sent to ${existingPartner.email}`)
    } catch (emailError) {
      console.error('⚠️ Failed to send partner welcome email:', emailError)
      // Don't fail the code generation if email fails
    }

    return NextResponse.json({
      partner: updatedPartner,
      signup_url: signupUrl,
      expires_at: expiryDate.toISOString()
    }, { status: 200 })

  } catch (error) {
    console.error('Error in POST /api/partners/[id]/generate-code:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 