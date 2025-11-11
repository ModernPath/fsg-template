import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

// Validation schema - korjattu vastaamaan frontendin dataa
const SignupSchema = z.object({
  signup_code: z.string().min(1, 'Signup code is required'),
  // Company information
  company_name: z.string().min(1, 'Company name is required'),
  business_id: z.string().min(1, 'Business ID is required'),
  address: z.string().optional(),
  postal_code: z.string().optional(),
  city: z.string().optional(),
  company_email: z.string().email('Valid company email is required').optional(),
  company_phone: z.string().optional(),
  // Contact person
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  // Authentication
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string().min(8, 'Password confirmation is required')
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
})

// GET /api/partner-signup?code=XXX - Validate signup code
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    console.log('\n📝 [GET /api/partner-signup] Validating signup code')
    console.log('🔍 Received code:', code)
    console.log('🔍 Full URL:', request.url)
    console.log('🔍 Search params:', Object.fromEntries(searchParams))

    if (!code) {
      console.error('❌ No signup code provided')
      return NextResponse.json({ error: 'Signup code is required' }, { status: 400 })
    }

    // Demo code for testing
    if (code === 'DEMO2024') {
      return NextResponse.json({
        valid: true,
        partner: {
          id: '9e245493-6da5-42ce-8d15-11e13c818ea8',
          name: 'Timo Romakkaniemi',
          email: 'timo@iagent.fi'
        }
      })
    }

    console.log('🔑 Creating service role client...')
    const supabase = await createClient(undefined, true) // Use service role client

    // Find partner with this signup code
    console.log('📊 Querying partners table for code:', code)
    const { data: partner, error } = await supabase
      .from('partners')
      .select('id, name, email, signup_code_expires_at, status')
      .eq('signup_code', code)
      .eq('status', 'active')
      .single()

    console.log('📊 Query result:')
    console.log('  - Partner found:', !!partner)
    console.log('  - Partner data:', partner)
    console.log('  - Error:', error)
    
    if (error) {
      console.error('❌ Database error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
    }

    if (error || !partner) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Invalid or expired signup code' 
      }, { status: 400 })
    }

    // Check if code has expired
    if (partner.signup_code_expires_at && new Date(partner.signup_code_expires_at) < new Date()) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Signup code has expired' 
      }, { status: 400 })
    }

    return NextResponse.json({
      valid: true,
      partner: {
        id: partner.id,
        name: partner.name,
        email: partner.email
      }
    })

  } catch (error) {
    console.error('Error in GET /api/partner-signup:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/partner-signup - Create partner account
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient(undefined, true) // Use service role client
    
    // Parse and validate request body
    const body = await request.json()
    const validatedData = SignupSchema.parse(body)

    // Handle demo code for testing
    let partner
    if (validatedData.signup_code === 'DEMO2024') {
      partner = {
        id: '9e245493-6da5-42ce-8d15-11e13c818ea8',
        name: 'Timo Romakkaniemi',
        signup_code_expires_at: null
      }
    } else {
      // Validate signup code again
      const { data: partnerData, error: partnerError } = await supabase
        .from('partners')
        .select('id, name, signup_code_expires_at, status')
        .eq('signup_code', validatedData.signup_code)
        .eq('status', 'active')
        .single()

      if (partnerError || !partnerData) {
        return NextResponse.json({ error: 'Invalid signup code' }, { status: 400 })
      }
      partner = partnerData
    }

    // Check if code has expired
    if (partner.signup_code_expires_at && new Date(partner.signup_code_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Signup code has expired' }, { status: 400 })
    }

    // For demo code, skip actual user creation
    let authData
    if (validatedData.signup_code === 'DEMO2024') {
      // Return mock success for demo
      authData = {
        user: {
          id: 'demo-user-id',
          email: validatedData.email
        }
      }
      console.log('Demo signup - skipping actual user creation')
    } else {
      // Check if email already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const userExists = existingUsers.users.find(u => u.email === validatedData.email)
      if (userExists) {
        return NextResponse.json({ error: 'Email is already registered' }, { status: 400 })
      }

      // Create user account
      console.log('🔑 Creating user with email:', validatedData.email)
      console.log('🔑 User metadata:', {
        first_name: validatedData.first_name,
        last_name: validatedData.last_name,
        company: validatedData.company_name,
        phone: validatedData.phone,
        is_partner: true,
        partner_id: partner.id
      })
      
      // Create user account using Supabase auth (now properly configured)
      console.log('🔑 Creating user with email:', validatedData.email)
      console.log('🔑 User metadata:', {
        first_name: validatedData.first_name,
        last_name: validatedData.last_name,
        company: validatedData.company_name,
        phone: validatedData.phone,
        is_partner: true,
        partner_id: partner.id
      })
      
      // Use admin.createUser with service role client - follow same pattern as other user creation
      const { data: authResult, error: authError } = await supabase.auth.admin.createUser({
        email: validatedData.email,
        password: validatedData.password,
        email_confirm: true, // Auto-confirm since confirmations are disabled in config
        user_metadata: {
          // Standard fields that trigger expects
          username: validatedData.email.split('@')[0],
          full_name: `${validatedData.first_name} ${validatedData.last_name}`,
          company: validatedData.company_name,
          newsletter_subscription: false,
          marketing_consent: false,
          
          // Partner-specific fields
          first_name: validatedData.first_name,
          last_name: validatedData.last_name,
          phone: validatedData.phone,
          is_partner: true,
          partner_id: partner.id
        }
      })
      
      if (authError) {
        console.error('❌ Error creating user:', authError)
        console.error('Auth error details:', {
          message: authError.message,
          status: authError.status,
          code: authError.code,
          details: authError.details
        })
        return NextResponse.json({ 
          error: 'Failed to create account',
          details: process.env.NODE_ENV === 'development' ? authError.message : undefined
        }, { status: 500 })
      }
      
      console.log('✅ User created successfully:', authResult.user.id)
      
      console.log('📊 Final auth result:', { 
        user: !!authResult?.user, 
        error: authError?.message 
      })

      if (authError) {
        console.error('❌ All user creation methods failed:', authError)
        console.error('Auth error details:', {
          message: authError.message,
          status: authError.status,
          code: authError.code,
          details: authError.details
        })
        return NextResponse.json({ 
          error: 'Failed to create account',
          details: process.env.NODE_ENV === 'development' ? authError.message : undefined
        }, { status: 500 })
      }
      
      authData = authResult
    }

    // Update partner with user relationship (skip for demo)
    if (validatedData.signup_code !== 'DEMO2024') {
      console.log('📊 Updating partner with user ID:', authData.user.id)
      const { error: updateError } = await supabase
        .from('partners')
        .update({
          user_id: authData.user.id,
          signup_code: null, // Clear the signup code so it can't be used again
          signup_code_expires_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', partner.id)

      if (updateError) {
        console.error('❌ Error updating partner:', updateError)
        // Don't return error here as user is already created
      } else {
        console.log('✅ Partner updated successfully')
      }
    } else {
      console.log('⚠️ Skipping partner update (demo user)')
    }

    // Profile is automatically created by trigger, just verify it exists
    if (validatedData.signup_code !== 'DEMO2024') {
      console.log('📊 Verifying partner profile was created by trigger...')
      
      // Wait a moment for trigger to complete
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, is_partner, partner_id')
        .eq('id', authData.user.id)
        .single()

      if (profileError || !profile) {
        console.error('❌ Profile not created by trigger:', profileError)
        return NextResponse.json({ error: 'Failed to create partner profile' }, { status: 500 })
      }
      
      console.log('✅ Partner profile created by trigger:', {
        id: profile.id,
        is_partner: profile.is_partner,
        partner_id: profile.partner_id
      })
    } else {
      console.log('⚠️ Skipping profile verification (demo user)')
    }

    console.log(`✅ Partner account created for user ${authData.user.id} with partner_id ${partner.id}`)

    // Send verification email (skip for demo)
    if (validatedData.signup_code !== 'DEMO2024') {
      console.log('📧 Generating verification email...')
      const { error: emailError } = await supabase.auth.admin.generateLink({
        type: 'signup',
        email: validatedData.email,
        password: validatedData.password,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
        }
      })

      if (emailError) {
        console.error('❌ Error sending verification email:', emailError)
        // Don't fail the signup, user can request new verification email
      } else {
        console.log('✅ Verification email generated successfully')
      }

      // Log audit trail
      try {
        await supabase.rpc('log_partner_audit', {
          p_partner_id: partner.id,
          p_action: 'SIGNUP',
          p_resource_type: 'user_account',
          p_resource_id: authData.user.id,
          p_new_values: {
            user_id: authData.user.id,
            email: validatedData.email,
            name: `${validatedData.first_name} ${validatedData.last_name}`,
            company: validatedData.company_name
          }
        })
        console.log('✅ Audit log created')
      } catch (auditError) {
        console.log('⚠️ Audit log function not available:', auditError)
        // Don't fail the signup for audit log issues
      }
    } else {
      console.log('⚠️ Skipping email verification and audit log (demo user)')
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully. Please check your email for verification link.',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        partner_id: partner.id
      }
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error in POST /api/partner-signup:', error.errors)
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 })
    }
    console.error('Error in POST /api/partner-signup:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    })
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    }, { status: 500 })
  }
} 