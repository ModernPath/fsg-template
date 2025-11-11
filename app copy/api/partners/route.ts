import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

// Validation schemas
const PartnerCreateSchema = z.object({
  name: z.string().min(1, 'Partner name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  commission_percent: z.number().min(0).max(100).default(0),
  tier: z.enum(['basic', 'premium', 'enterprise']).default('basic'),
  contact_info: z.record(z.any()).optional(),
  settings: z.record(z.any()).optional()
})

const PartnerUpdateSchema = PartnerCreateSchema.partial()

// GET /api/partners - List all partners (Admin only)
export async function GET(request: NextRequest) {
  try {
    // Debug: Check authorization header
    const authHeader = request.headers.get('Authorization')
    console.log('GET /api/partners - Auth header:', authHeader ? 'Present' : 'Missing')
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('GET /api/partners - Missing or invalid auth header')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const token = authHeader.split(' ')[1]
    const supabase = await createClient()
    
    // Check authentication with token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    console.log('GET /api/partners - Auth result:', { 
      hasUser: !!user, 
      userId: user?.id, 
      userEmail: user?.email,
      authError: authError?.message 
    })
    
    if (authError || !user) {
      console.log('GET /api/partners - Authentication failed:', authError?.message)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin status - Use service role client for admin check
    const adminClient = await createClient(true)
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    console.log('GET /api/partners - Admin check:', { 
      userId: user.id, 
      profileError: profileError?.message, 
      isAdmin: profile?.is_admin,
      userEmail: user.email 
    })

    if (profileError || !profile?.is_admin) {
      console.log('GET /api/partners - Admin check failed:', { userId: user.id, profileError, isAdmin: profile?.is_admin })
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const tier = searchParams.get('tier') || ''

    // Use service role client for data operations
    const serviceClient = await createClient(true)
    
    // Build query
    let query = serviceClient
      .from('partners')
      .select(`
        *,
        _count_companies:companies(count),
        _count_commissions:partner_commissions(count)
      `)

    // Add filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    if (tier && tier !== 'all') {
      query = query.eq('tier', tier)
    }

    // Add pagination
    const offset = (page - 1) * limit
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: partners, error } = await query

    if (error) {
      console.error('Error fetching partners:', error)
      return NextResponse.json({ error: 'Failed to fetch partners' }, { status: 500 })
    }

    // Get total count for pagination
    const { count } = await serviceClient
      .from('partners')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      partners,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Error in GET /api/partners:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/partners - Create new partner (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Check authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('POST /api/partners - Missing or invalid auth header')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const token = authHeader.split(' ')[1]
    const supabase = await createClient()
    
    // Check authentication with token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      console.log('POST /api/partners - Authentication failed:', authError?.message)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    console.log('POST /api/partners - Admin check:', { 
      userId: user.id, 
      profileError: profileError?.message, 
      isAdmin: profile?.is_admin,
      userEmail: user.email 
    })

    if (profileError || !profile?.is_admin) {
      console.log('POST /api/partners - Admin check failed:', { userId: user.id, profileError, isAdmin: profile?.is_admin })
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    console.log('POST /api/partners - Request body:', body)
    const validatedData = PartnerCreateSchema.parse(body)
    console.log('POST /api/partners - Validated data:', validatedData)

    // Use service role client for all database operations (bypasses RLS)
    const serviceClient = await createClient(true)
    
    // Generate signup code
    const { data: signupCode, error: codeError } = await serviceClient
      .rpc('generate_partner_signup_code')

    if (codeError) {
      console.error('Error generating signup code:', codeError)
      return NextResponse.json({ error: 'Failed to generate signup code' }, { status: 500 })
    }
    
    // Create partner
    const { data: partner, error } = await serviceClient
      .from('partners')
      .insert({
        ...validatedData,
        signup_code: signupCode,
        signup_code_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating partner:', error)
      return NextResponse.json({ error: 'Failed to create partner' }, { status: 500 })
    }

    // Log audit trail
    await serviceClient.rpc('log_partner_audit', {
      p_partner_id: partner.id,
      p_action: 'CREATE',
      p_resource_type: 'partner',
      p_resource_id: partner.id,
      p_new_values: partner
    })

    // Send automated partner welcome email with signup credentials
    try {
      const { EmailTemplateService } = await import('@/lib/services/emailTemplateService')
      const emailService = new EmailTemplateService()
      
      // Get partner's preferred language from contact_info
      const partnerLanguage = partner.contact_info?.language_preference || 'fi'
      const signupUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/${partnerLanguage}/partner-signup?code=${signupCode}`
      
      await emailService.sendPartnerWelcomeEmail(
        validatedData.name,
        validatedData.email,
        validatedData.contact_info?.contact_person || 'Kumppani',
        signupCode,
        signupUrl,
        validatedData.commission_percent,
        validatedData.tier || 'basic',
        'admin@trustyfinance.fi',
        'TrustyFinance Admin'
      )
      
      console.log(`✅ Partner welcome email sent to ${validatedData.email}`)
    } catch (emailError) {
      console.error('⚠️ Failed to send partner welcome email:', emailError)
      // Don't fail the partner creation if email fails
    }

    return NextResponse.json({ partner }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error in POST /api/partners:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 