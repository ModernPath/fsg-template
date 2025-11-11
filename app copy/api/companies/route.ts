import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'

// GET /api/companies - Fetch all companies for the current user
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [GET /api/companies] Starting companies request')

    // Authenticate user with Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('❌ Missing or invalid authorization header')
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('❌ Missing Supabase environment variables')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Use auth client for user authentication
    const authClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      }
    )
    const { data: { user }, error: authError } = await authClient.auth.getUser(authHeader.split(' ')[1])
    
    if (authError || !user) {
      console.log('❌ Authentication failed in companies:', authError?.message)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ User authenticated for companies:', user.email)

    // Use service role client for database operations
    const supabase = await createClient(undefined, true)

    // Fetch companies through user_companies relationship
    const { data: userCompanies, error } = await supabase
      .from('user_companies')
      .select(`
        role,
        companies (
          id,
          name,
          business_id,
          address,
          contact_info,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching user companies:', error)
      return NextResponse.json(
        { error: 'Failed to fetch companies' },
        { status: 500 }
      )
    }

    // Transform the data to include role in each company
    const companies = userCompanies?.map(uc => ({
      ...uc.companies,
      role: uc.role
    })) || []

    console.log('✅ Companies fetched successfully:', companies.length)
    return NextResponse.json({ companies })

  } catch (error) {
    console.error('❌ Error in companies API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/companies - Create a new company
export async function POST(request: NextRequest) {
  try {
    console.log('📝 [POST /api/companies] Starting company creation')

    // Authenticate user with Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('❌ Missing or invalid authorization header')
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('❌ Missing Supabase environment variables')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Use auth client for user authentication
    const authClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      }
    )
    const { data: { user }, error: authError } = await authClient.auth.getUser(authHeader.split(' ')[1])
    
    if (authError || !user) {
      console.log('❌ Authentication failed in company creation:', authError?.message)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ User authenticated for company creation:', user.email)

    const companyData = await request.json()
    console.log('📥 Company data:', companyData)

    // Use service role client for database operations
    const supabase = await createClient(undefined, true)

    // Add user ID to company data
    const { data: company, error } = await supabase
      .from('companies')
      .insert({
        ...companyData,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating company:', error)
      return NextResponse.json(
        { error: 'Failed to create company' },
        { status: 500 }
      )
    }

    // IMPORTANT: Add user_companies relationship for the current user
    // Use service role client to bypass RLS for this specific operation
    const { error: userCompanyError } = await supabase
      .from('user_companies')
      .upsert({
        user_id: user.id,
        company_id: company.id,
        role: 'owner'
      }, {
        onConflict: 'user_id,company_id'
      });

    if (userCompanyError) {
      console.error('❌ Error creating user_companies relationship:', userCompanyError);
      // Don't fail the entire operation, but log the error
    } else {
      console.log('✅ User_companies relationship created:', { user_id: user.id, company_id: company.id });
    }

    console.log('✅ Company created successfully:', company.id)

    // 🚀 PROGRESSIVE ENRICHMENT: Trigger background financial data enrichment
    try {
      console.log('🚀 [Companies API] Triggering background enrichment for company:', company.id);
      
      const { inngest } = await import('@/lib/inngest-client');
      
        await inngest.send({
          name: 'company/enrich.financial-data',
          data: {
            companyId: company.id,
            businessId: company.business_id,
            companyName: company.name,
            countryCode: company.country_code || 'FI',
            industry: company.industry,
            userId: user.id,
            locale: body.locale || 'fi' // Pass locale for language-specific enrichment
          }
        });
      
      console.log('✅ [Companies API] Background enrichment triggered');
    } catch (enrichmentError) {
      console.error('❌ [Companies API] Failed to trigger enrichment:', enrichmentError);
      // Don't fail the entire operation if enrichment trigger fails
    }

    // Get attribution and link company to partner
    try {
      // Try to get session ID from request headers or create one
      let sessionId = request.headers.get('x-session-id')
      
      if (!sessionId) {
        // Generate a session ID for server-side tracking if not provided
        sessionId = `server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }

      console.log('🔍 [Companies API] Checking attribution for session:', sessionId)
      
      // Use service role client for attribution lookup to bypass RLS
      const trackingClient = await createClient(true)
      
      // Get attribution info for this session
      const { data: attribution } = await trackingClient
        .from('partner_referral_clicks')
        .select(`
          id,
          partner_id,
          referral_link_id,
          attribution_expires_at,
          partner_referral_links (
            link_code,
            source_page,
            campaign_name
          ),
          partners (
            id,
            name
          )
        `)
        .eq('session_id', sessionId)
        .gt('attribution_expires_at', new Date().toISOString())
        .order('clicked_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      let partnerInfo = null
      
      if (attribution?.partner_id) {
        console.log('🎯 [Companies API] Found attribution to partner:', (attribution.partners as any)?.name)
        
        // Update company with partner attribution
        const { error: updateError } = await supabase
          .from('companies')
          .update({
            partner_id: attribution.partner_id,
            referral_source: 'partner_referral',
            referral_click_id: attribution.id,
            referral_link_id: attribution.referral_link_id,
            attribution_data: {
              partner_id: attribution.partner_id,
              partner_name: (attribution.partners as any)?.name,
              referral_link: (attribution.partner_referral_links as any)?.link_code,
              source_page: (attribution.partner_referral_links as any)?.source_page,
              campaign_name: (attribution.partner_referral_links as any)?.campaign_name,
              attribution_date: new Date().toISOString()
            }
          })
          .eq('id', company.id)

        if (updateError) {
          console.error('❌ [Companies API] Failed to update company with attribution:', updateError)
        } else {
          console.log('✅ [Companies API] Company linked to partner:', attribution.partner_id)
          partnerInfo = {
            partner_id: attribution.partner_id,
            partner_name: (attribution.partners as any)?.name
          }
        }
      }

      // Track company creation conversion
      console.log('🎯 [Companies API] Tracking company_created conversion for company:', company.id)
      
      const { data: conversionId, error: trackError } = await trackingClient
        .rpc('track_conversion', {
          p_session_id: sessionId,
          p_conversion_type: 'company_created',
          p_conversion_value: 0,
          p_company_id: company.id,
          p_user_id: user.id,
          p_metadata: {
            company_name: company.name,
            business_id: company.business_id,
            created_via: 'api',
            user_email: user.email,
            partner_attribution: partnerInfo
          }
        })

      if (trackError) {
        console.warn('⚠️ [Companies API] Failed to track company_created conversion:', trackError)
      } else {
        console.log('✅ [Companies API] Company creation conversion tracked:', conversionId)
        
        if (partnerInfo) {
          console.log('🎉 [Companies API] Conversion attributed to partner:', partnerInfo.partner_name)
        }
      }
    } catch (conversionError) {
      console.warn('⚠️ [Companies API] Error in attribution/conversion tracking:', conversionError)
      // Don't fail the company creation if attribution tracking fails
    }

    return NextResponse.json({ company })

  } catch (error) {
    console.error('❌ Error in company creation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 