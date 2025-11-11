import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'
import { TrackReferralClickRequest } from '@/types/referral'

// Validation schema
const TrackReferralClickSchema = z.object({
  ref_code: z.string().min(1, 'Referral code is required'),
  landing_page: z.string().url('Valid landing page URL is required'),
  referrer_url: z.string().url().optional(),
  session_id: z.string().min(1, 'Session ID is required'),
  fingerprint: z.string().optional(),
  user_agent: z.string().optional(),
  device_info: z.object({
    device_type: z.string().optional(),
    browser: z.string().optional(),
    os: z.string().optional(),
    screen_resolution: z.string().optional()
  }).optional(),
  location: z.object({
    country: z.string().optional(),
    city: z.string().optional()
  }).optional()
})

// Helper function to detect if request is from a bot
function detectBot(userAgent: string = ''): boolean {
  const botPatterns = [
    'bot', 'crawler', 'spider', 'scraper', 'selenium', 'phantomjs',
    'googlebot', 'bingbot', 'facebookexternalhit', 'twitterbot',
    'linkedinbot', 'whatsapp', 'skypeuripreview', 'slackbot'
  ]
  
  const ua = userAgent.toLowerCase()
  return botPatterns.some(pattern => ua.includes(pattern))
}

// Helper function to extract IP address
function getClientIP(request: NextRequest): string | null {
  // Try various headers for IP address
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  return null
}

// Helper function to generate browser fingerprint
function generateFingerprint(
  userAgent: string,
  deviceInfo?: { device_type?: string; browser?: string; os?: string; screen_resolution?: string }
): string {
  const components = [
    userAgent,
    deviceInfo?.device_type || '',
    deviceInfo?.browser || '',
    deviceInfo?.os || '',
    deviceInfo?.screen_resolution || ''
  ]
  
  // Simple hash function for fingerprinting
  const hash = components.join('|')
  return Buffer.from(hash).toString('base64').slice(0, 16)
}

// POST /api/tracking/referral-click - Track referral click
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [POST referral-click] Starting referral click tracking')
    
    // Use service role client to bypass RLS
    const supabase = await createClient(true)
    
    // Parse and validate request body
    const body = await request.json()
    const validationResult = TrackReferralClickSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validationResult.error.errors 
      }, { status: 400 })
    }

    const clickData: TrackReferralClickRequest = validationResult.data

    // Extract request metadata
    const userAgent = request.headers.get('user-agent') || clickData.user_agent || ''
    const ipAddress = getClientIP(request)
    const isBot = detectBot(userAgent)
    
    // Generate fingerprint if not provided
    const fingerprint = clickData.fingerprint || generateFingerprint(userAgent, clickData.device_info)

    // Check for duplicate clicks (same session + fingerprint within 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    
    const { data: recentClick } = await supabase
      .from('partner_referral_clicks')
      .select('id')
      .eq('session_id', clickData.session_id)
      .eq('fingerprint', fingerprint)
      .gte('clicked_at', fiveMinutesAgo)
      .limit(1)
      .single()

    if (recentClick) {
      // Return existing click ID instead of creating duplicate
      return NextResponse.json({ 
        click_id: recentClick.id,
        duplicate: true,
        message: 'Click already tracked recently'
      })
    }

    // Track the referral click using database function
    const { data: clickId, error: trackError } = await supabase
      .rpc('track_referral_click', {
        p_link_code: clickData.ref_code,
        p_session_id: clickData.session_id,
        p_fingerprint: fingerprint,
        p_ip_address: ipAddress,
        p_user_agent: userAgent,
        p_referrer_url: clickData.referrer_url || null,
        p_landing_page: clickData.landing_page,
        p_device_info: {
          device_type: clickData.device_info?.device_type,
          browser: clickData.device_info?.browser,
          os: clickData.device_info?.os,
          screen_resolution: clickData.device_info?.screen_resolution,
          country: clickData.location?.country,
          city: clickData.location?.city,
          is_bot: isBot
        }
      })

    if (trackError) {
      console.error('Error tracking referral click:', trackError)
      
      // If referral code is invalid, return specific error
      if (trackError.message?.includes('Invalid or inactive referral link code')) {
        return NextResponse.json({ 
          error: 'Invalid referral code',
          code: 'INVALID_REF_CODE'
        }, { status: 400 })
      }
      
      return NextResponse.json({ error: 'Failed to track click' }, { status: 500 })
    }

    // Update additional click details if needed
    if (clickData.location?.country || clickData.location?.city) {
      await supabase
        .from('partner_referral_clicks')
        .update({
          country: clickData.location.country,
          city: clickData.location.city,
          is_bot: isBot
        })
        .eq('id', clickId)
    }

    // Return success response
    return NextResponse.json({
      click_id: clickId,
      session_id: clickData.session_id,
      tracking_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      duplicate: false,
      message: 'Click tracked successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/tracking/referral-click:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/tracking/referral-click - Get attribution info for session
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [GET attribution] Starting attribution request')
    
    // Use service role client to bypass RLS
    const supabase = await createClient(true)
    
    const url = new URL(request.url)
    const sessionId = url.searchParams.get('session_id')
    
    console.log('🔍 [GET attribution] Session ID:', sessionId)
    
    if (!sessionId) {
      console.log('❌ [GET attribution] No session ID provided')
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    const currentTime = new Date().toISOString()
    console.log('🔍 [GET attribution] Current time for expiry check:', currentTime)

    // Get the most recent valid referral click for this session
    console.log('🔍 [GET attribution] Executing SQL query...')
    const { data: attribution, error } = await supabase
      .from('partner_referral_clicks')
      .select(`
        id,
        referral_link_id,
        partner_id,
        clicked_at,
        attribution_expires_at,
        partner_referral_links (
          link_code,
          source_page,
          campaign_name,
          partners (
            id,
            name,
            commission_percent
          )
        )
      `)
      .eq('session_id', sessionId)
      .gt('attribution_expires_at', currentTime)
      .order('clicked_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    console.log('🔍 [GET attribution] Query result:', { 
      attribution: attribution ? 'Found' : 'Not found', 
      error: error?.message || null 
    })

    // Handle error
    if (error) {
      console.error('❌ [GET attribution] Database error:', error.message)
      return NextResponse.json({ 
        error: 'Database error',
        attributed: false
      }, { status: 500 })
    }

    // No attribution found (this is normal, not an error)
    if (!attribution) {
      console.log('ℹ️ [GET attribution] No attribution found for session (this is normal)')
      return NextResponse.json({ 
        attributed: false,
        message: 'No valid attribution found for session'
      })
    }

    const attributionData = {
      click_id: attribution.id,
      partner_id: attribution.partner_id,
      partner_name: (attribution.partner_referral_links as any).partners.name,
      commission_rate: (attribution.partner_referral_links as any).partners.commission_percent,
      referral_source: (attribution.partner_referral_links as any).source_page,
      campaign: (attribution.partner_referral_links as any).campaign_name,
      clicked_at: attribution.clicked_at,
      expires_at: attribution.attribution_expires_at
    }

    console.log('✅ [GET attribution] Attribution found:', attributionData)

    return NextResponse.json({
      attributed: true,
      attribution: attributionData
    })

  } catch (error) {
    console.error('Error in GET /api/tracking/referral-click:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 