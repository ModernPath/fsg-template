import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'
import { 
  CreateReferralLinkRequest, 
  UpdateReferralLinkRequest,
  PartnerReferralLink,
  ReferralLinkWithStats 
} from '@/types/referral'

// Validation schemas
const CreateReferralLinkSchema = z.object({
  source_page: z.string().min(1, 'Source page is required'),
  campaign_name: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_content: z.string().optional(),
  utm_term: z.string().optional(),
  expires_at: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional()
})

const UpdateReferralLinkSchema = z.object({
  source_page: z.string().min(1).optional(),
  campaign_name: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_content: z.string().optional(),
  utm_term: z.string().optional(),
  is_active: z.boolean().optional(),
  expires_at: z.string().datetime().optional().nullable(),
  metadata: z.record(z.any()).optional()
})

// Helper function to check partner permissions
async function checkPartnerPermissions(supabase: any, partnerId: string, userId: string) {
  console.log('🔍 [checkPartnerPermissions] Checking for user:', userId, 'partner:', partnerId)
  
  // Check if user is admin
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_admin, is_partner, partner_id')
    .eq('id', userId)
    .single()

  console.log('🔍 [checkPartnerPermissions] Profile result:', {
    profile,
    error: error?.message || null
  })

  if (profile?.is_admin) {
    console.log('✅ [checkPartnerPermissions] User is admin')
    return true
  }

  if (profile?.is_partner && profile?.partner_id === partnerId) {
    console.log('✅ [checkPartnerPermissions] User is partner with matching ID')
    return true
  }

  console.log('❌ [checkPartnerPermissions] No matching permissions')
  return false
}

// Helper function to generate full URL
function generateFullUrl(linkCode: string, baseUrl?: string): string {
  const domain = baseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://trustyfinance.fi'
  return `${domain}?ref=${linkCode}`
}

// GET /api/partners/[id]/referral-links - Get all referral links for partner
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: partnerId } = await params
    console.log('🔍 [GET referral-links] Starting request for partner:', partnerId)
    
    // Get Authorization header
    const authHeader = request.headers.get('Authorization')
    console.log('🔍 [GET referral-links] Auth header present:', !!authHeader)
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('❌ [GET referral-links] Missing or invalid Authorization header')
      return NextResponse.json({ error: 'Unauthorized - Missing auth header' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    console.log('🔍 [GET referral-links] Token extracted, length:', token?.length || 0)

    // Create Supabase client with token for auth
    const supabase = await createClient()
    
    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    console.log('🔍 [GET referral-links] Auth result:', {
      user: user ? { id: user.id, email: user.email } : null,
      authError: authError?.message || null
    })

    if (authError || !user) {
      console.log('❌ [GET referral-links] Token validation failed:', authError?.message)
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 })
    }

    // Check permissions using regular client
    console.log('🔍 [GET referral-links] Checking permissions for user:', user.id, 'partner:', partnerId)
    const hasPermission = await checkPartnerPermissions(supabase, partnerId, user.id)
    console.log('🔍 [GET referral-links] Permission result:', hasPermission)
    
    if (!hasPermission) {
      console.log('❌ [GET referral-links] Forbidden - no permission')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Use service role client for database operations (bypass RLS)
    console.log('🔍 [GET referral-links] Creating service role client for database operations...')
    const serviceClient = await createClient(true)

    // Get query parameters
    const url = new URL(request.url)
    const includeStats = url.searchParams.get('include_stats') === 'true'
    const isActive = url.searchParams.get('is_active')
    const sourcePage = url.searchParams.get('source_page')
    const campaign = url.searchParams.get('campaign')

    // Build query
    let query = serviceClient
      .from('partner_referral_links')
      .select('*')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false })

    // Apply filters
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }
    if (sourcePage) {
      query = query.eq('source_page', sourcePage)
    }
    if (campaign) {
      query = query.eq('campaign_name', campaign)
    }

    const { data: links, error } = await query

    if (error) {
      console.error('Error fetching referral links:', error)
      return NextResponse.json({ error: 'Failed to fetch referral links' }, { status: 500 })
    }

    if (!includeStats) {
      // Add full URLs without stats
      const linksWithUrls = links.map(link => ({
        ...link,
        full_url: generateFullUrl(link.link_code)
      }))
      return NextResponse.json(linksWithUrls)
    }

    // Include performance stats
    const linksWithStats: ReferralLinkWithStats[] = await Promise.all(
      links.map(async (link: PartnerReferralLink) => {
        // Get recent clicks (last 10)
        const { data: recentClicks } = await serviceClient
          .from('partner_referral_clicks')
          .select('*')
          .eq('referral_link_id', link.id)
          .order('clicked_at', { ascending: false })
          .limit(10)

        // Get recent conversions (last 10)
        const { data: recentConversions } = await serviceClient
          .from('partner_conversions')
          .select('*')
          .eq('referral_link_id', link.id)
          .order('converted_at', { ascending: false })
          .limit(10)

        // Calculate performance metrics
        const totalCommission = recentConversions?.reduce((sum, conv) => sum + (conv.commission_amount || 0), 0) || 0
        const conversionRate = link.click_count > 0 ? (link.conversion_count / link.click_count) * 100 : 0
        const revenuePerClick = link.click_count > 0 ? link.total_revenue / link.click_count : 0

        return {
          ...link,
          full_url: generateFullUrl(link.link_code),
          performance: {
            click_rate: link.click_count, // This could be calculated differently based on impressions
            conversion_rate: conversionRate,
            revenue_per_click: revenuePerClick,
            commission_earned: totalCommission
          },
          recent_clicks: recentClicks || [],
          recent_conversions: recentConversions || []
        }
      })
    )

    return NextResponse.json(linksWithStats)

  } catch (error) {
    console.error('Error in GET /api/partners/[id]/referral-links:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/partners/[id]/referral-links - Create new referral link
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: partnerId } = await params
    console.log('🔍 [POST referral-links] Starting request for partner:', partnerId)
    
    // Get Authorization header
    const authHeader = request.headers.get('Authorization')
    console.log('🔍 [POST referral-links] Auth header present:', !!authHeader)
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('❌ [POST referral-links] Missing or invalid Authorization header')
      return NextResponse.json({ error: 'Unauthorized - Missing auth header' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    console.log('🔍 [POST referral-links] Token extracted, length:', token?.length || 0)

    // Create Supabase client with token for auth
    const supabase = await createClient()
    
    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    console.log('🔍 [POST referral-links] Auth result:', {
      user: user ? { id: user.id, email: user.email } : null,
      authError: authError?.message || null
    })

    if (authError || !user) {
      console.log('❌ [POST referral-links] Token validation failed:', authError?.message)
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 })
    }

    // Check permissions using regular client
    console.log('🔍 [POST referral-links] Checking permissions for user:', user.id, 'partner:', partnerId)
    const hasPermission = await checkPartnerPermissions(supabase, partnerId, user.id)
    console.log('🔍 [POST referral-links] Permission result:', hasPermission)
    
    if (!hasPermission) {
      console.log('❌ [POST referral-links] Forbidden - no permission')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Validate request body
    const body = await request.json()
    console.log('🔍 [POST referral-links] Request body:', body)

    try {
      CreateReferralLinkSchema.parse(body)
    } catch (validationError) {
      console.log('❌ [POST referral-links] Validation error:', validationError)
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    // Use service role client for database operations (bypass RLS)
    console.log('🔍 [POST referral-links] Creating service role client for database operations...')
    const serviceClient = await createClient(true)

    // Generate link code
    console.log('🔍 [POST referral-links] Generating link code...')
    const { data: linkCodeData, error: linkCodeError } = await serviceClient
      .rpc('generate_referral_link_code', {
        p_partner_id: partnerId,
        p_source_page: body.source_page,
        p_campaign_name: body.campaign_name || null
      })

    if (linkCodeError) {
      console.error('❌ [POST referral-links] Error generating link code:', linkCodeError)
      return NextResponse.json({ error: 'Failed to generate link code' }, { status: 500 })
    }

    const linkCode = linkCodeData
    console.log('✅ [POST referral-links] Generated link code:', linkCode)

    // Create referral link
    console.log('🔍 [POST referral-links] Creating referral link...')
    const insertData = {
      partner_id: partnerId,
      link_code: linkCode,
      source_page: body.source_page,
      campaign_name: body.campaign_name || null,
      utm_source: body.utm_source || null,
      utm_medium: body.utm_medium || null,
      utm_campaign: body.utm_campaign || null,
      utm_content: body.utm_content || null,
      utm_term: body.utm_term || null,
      is_active: true,
      expires_at: body.expires_at || null,
      metadata: body.metadata || {},
      click_count: 0,
      conversion_count: 0,
      total_revenue: 0
    }

    console.log('🔍 [POST referral-links] Insert data:', insertData)

    const { data: referralLink, error: insertError } = await serviceClient
      .from('partner_referral_links')
      .insert(insertData)
      .select()
      .single()

    if (insertError) {
      console.error('❌ [POST referral-links] Error creating referral link:', insertError)
      return NextResponse.json({ error: 'Failed to create referral link' }, { status: 500 })
    }

    console.log('✅ [POST referral-links] Successfully created referral link:', referralLink.id)

    // Add full URL to response
    const responseLink = {
      ...referralLink,
      full_url: generateFullUrl(referralLink.link_code)
    }

    return NextResponse.json(responseLink, { status: 201 })

  } catch (error) {
    console.error('❌ [POST referral-links] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 