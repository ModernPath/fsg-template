import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'
import { PartnerReferralAnalytics } from '@/types/referral'

// Helper function to check partner permissions
async function checkPartnerPermissions(supabase: any, partnerId: string, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, is_partner, partner_id')
    .eq('id', userId)
    .single()

  if (profile?.is_admin) {
    return true
  }

  if (profile?.is_partner && profile?.partner_id === partnerId) {
    return true
  }

  return false
}

// Helper function to parse date range
function getDateRange(url: URL) {
  const startDate = url.searchParams.get('start_date') || 
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago
  const endDate = url.searchParams.get('end_date') || 
    new Date().toISOString()
  
  return { startDate, endDate }
}

// Helper function to parse filter arrays
function parseCommaSeparated(value: string | null): string[] {
  return value ? value.split(',').map(s => s.trim()).filter(Boolean) : []
}

// GET /api/partners/[id]/analytics - Get comprehensive analytics for partner
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const partnerId = id

    // Check permissions
    const hasPermission = await checkPartnerPermissions(supabase, partnerId, user.id)
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse query parameters
    const url = new URL(request.url)
    const { startDate, endDate } = getDateRange(url)
    const sourcePages = parseCommaSeparated(url.searchParams.get('source_pages'))
    const campaigns = parseCommaSeparated(url.searchParams.get('campaigns'))
    
    const includeDeviceBreakdown = url.searchParams.get('include_device_breakdown') === 'true'
    const includeGeoBreakdown = url.searchParams.get('include_geographic_breakdown') === 'true'
    const includeFunnelAnalysis = url.searchParams.get('include_funnel_analysis') === 'true'

    // Use database function to get analytics summary
    const { data: overviewData, error: overviewError } = await supabase
      .rpc('get_partner_analytics', {
        p_partner_id: partnerId,
        p_start_date: startDate,
        p_end_date: endDate
      })

    if (overviewError) {
      console.error('Error getting analytics overview:', overviewError)
      return NextResponse.json({ error: 'Failed to get analytics' }, { status: 500 })
    }

    const overview = overviewData?.overview || {
      total_clicks: 0,
      total_conversions: 0,
      total_revenue: 0,
      total_commission: 0,
      conversion_rate: 0,
      avg_deal_size: 0
    }

    // Get daily time series data
    const { data: dailyStats } = await supabase
      .from('partner_referral_clicks')
      .select(`
        clicked_at,
        partner_conversions!left (
          conversion_value,
          commission_amount,
          converted_at
        )
      `)
      .eq('partner_id', partnerId)
      .gte('clicked_at', startDate)
      .lte('clicked_at', endDate)

    // Process time series data
    const timeSeriesMap = new Map()
    
    dailyStats?.forEach(click => {
      const date = click.clicked_at.split('T')[0]
      if (!timeSeriesMap.has(date)) {
        timeSeriesMap.set(date, {
          date,
          clicks: 0,
          conversions: 0,
          revenue: 0,
          commission: 0
        })
      }
      
      const dayData = timeSeriesMap.get(date)
      dayData.clicks++
      
      // Handle partner_conversions array
      if (click.partner_conversions && Array.isArray(click.partner_conversions)) {
        click.partner_conversions.forEach((conversion: any) => {
          dayData.conversions++
          dayData.revenue += conversion.conversion_value || 0
          dayData.commission += conversion.commission_amount || 0
        })
      }
    })

    const timeSeries = Array.from(timeSeriesMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))

    // Get top sources performance
    let topSourcesQuery = supabase
      .from('partner_referral_links')
      .select(`
        source_page,
        campaign_name,
        click_count,
        conversion_count,
        total_revenue
      `)
      .eq('partner_id', partnerId)

    if (sourcePages.length > 0) {
      topSourcesQuery = topSourcesQuery.in('source_page', sourcePages)
    }
    if (campaigns.length > 0) {
      topSourcesQuery = topSourcesQuery.in('campaign_name', campaigns)
    }

    const { data: topSources } = await topSourcesQuery

    const topSourcesProcessed = topSources?.map(source => ({
      source_page: source.source_page,
      campaign_name: source.campaign_name,
      clicks: source.click_count,
      conversions: source.conversion_count,
      revenue: source.total_revenue,
      conversion_rate: source.click_count > 0 ? (source.conversion_count / source.click_count) * 100 : 0
    })).sort((a, b) => b.revenue - a.revenue) || []

    // Initialize analytics response
    const analytics: PartnerReferralAnalytics = {
      overview: {
        ...overview,
        period_start: startDate,
        period_end: endDate
      },
      time_series: timeSeries,
      top_sources: topSourcesProcessed,
      funnel_analysis: [],
      geographic_breakdown: [],
      device_breakdown: [],
      top_performing_links: []
    }

    // Add funnel analysis if requested
    if (includeFunnelAnalysis) {
      const { data: funnelData } = await supabase
        .from('partner_conversions')
        .select('funnel_stage')
        .eq('partner_id', partnerId)
        .gte('converted_at', startDate)
        .lte('converted_at', endDate)

      const funnelStats = new Map()
      funnelData?.forEach(conversion => {
        const stage = conversion.funnel_stage
        funnelStats.set(stage, (funnelStats.get(stage) || 0) + 1)
      })

      const totalConversions = funnelData?.length || 0
      
      analytics.funnel_analysis = Array.from(funnelStats.entries()).map(([stage, count]) => ({
        stage,
        count,
        conversion_rate: totalConversions > 0 ? (count / totalConversions) * 100 : 0,
        drop_off_rate: 0 // Calculate based on funnel order
      }))
    }

    // Add geographic breakdown if requested
    if (includeGeoBreakdown) {
      const { data: geoData } = await supabase
        .from('partner_referral_clicks')
        .select('country, city')
        .eq('partner_id', partnerId)
        .gte('clicked_at', startDate)
        .lte('clicked_at', endDate)
        .not('country', 'is', null)

      const geoBreakdown = new Map()
      geoData?.forEach(click => {
        const key = `${click.country}${click.city ? `|${click.city}` : ''}`
        if (!geoBreakdown.has(key)) {
          geoBreakdown.set(key, {
            country: click.country,
            city: click.city,
            clicks: 0,
            conversions: 0,
            revenue: 0
          })
        }
        geoBreakdown.get(key).clicks++
      })

      analytics.geographic_breakdown = Array.from(geoBreakdown.values())
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 20)
    }

    // Add device breakdown if requested
    if (includeDeviceBreakdown) {
      const { data: deviceData } = await supabase
        .from('partner_referral_clicks')
        .select('device_type')
        .eq('partner_id', partnerId)
        .gte('clicked_at', startDate)
        .lte('clicked_at', endDate)

      const deviceStats = new Map()
      deviceData?.forEach(click => {
        const device = click.device_type || 'unknown'
        deviceStats.set(device, (deviceStats.get(device) || 0) + 1)
      })

      analytics.device_breakdown = Array.from(deviceStats.entries()).map(([device_type, clicks]) => ({
        device_type,
        clicks,
        conversions: 0, // Would need separate query to get conversions by device
        conversion_rate: 0
      }))
    }

    // Get top performing links
    const { data: topLinks } = await supabase
      .from('partner_referral_links')
      .select('*')
      .eq('partner_id', partnerId)
      .order('total_revenue', { ascending: false })
      .limit(5)

    analytics.top_performing_links = topLinks?.map(link => ({
      ...link,
      full_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://trustyfinance.fi'}?ref=${link.link_code}`,
      performance: {
        click_rate: link.click_count,
        conversion_rate: link.click_count > 0 ? (link.conversion_count / link.click_count) * 100 : 0,
        revenue_per_click: link.click_count > 0 ? link.total_revenue / link.click_count : 0,
        commission_earned: link.total_revenue * 0.05 // Should calculate from actual commissions
      },
      recent_clicks: [],
      recent_conversions: []
    })) || []

    return NextResponse.json(analytics)

  } catch (error) {
    console.error('Error in GET /api/partners/[id]/analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 