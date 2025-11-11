import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'
import { UpdateReferralLinkRequest } from '@/types/referral'

// Validation schema
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
  // Check if user is admin
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

// Helper function to generate full URL
function generateFullUrl(linkCode: string, baseUrl?: string): string {
  const domain = baseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://trustyfinance.fi'
  return `${domain}?ref=${linkCode}`
}

// GET /api/partners/[id]/referral-links/[linkId] - Get single referral link with stats
export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string; linkId: string }> }
) {
  const { id, linkId } = await params;
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const partnerId = id
    const linkId = linkId

    // Check permissions
    const hasPermission = await checkPartnerPermissions(supabase, partnerId, user.id)
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get referral link
    const { data: link, error: linkError } = await supabase
      .from('partner_referral_links')
      .select('*')
      .eq('id', linkId)
      .eq('partner_id', partnerId)
      .single()

    if (linkError || !link) {
      return NextResponse.json({ error: 'Referral link not found' }, { status: 404 })
    }

    // Get detailed analytics for this specific link
    const url = new URL(request.url)
    const startDate = url.searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = url.searchParams.get('end_date') || new Date().toISOString()

    // Get clicks in date range
    const { data: clicks } = await supabase
      .from('partner_referral_clicks')
      .select('*')
      .eq('referral_link_id', linkId)
      .gte('clicked_at', startDate)
      .lte('clicked_at', endDate)
      .order('clicked_at', { ascending: false })

    // Get conversions in date range
    const { data: conversions } = await supabase
      .from('partner_conversions')
      .select('*')
      .eq('referral_link_id', linkId)
      .gte('converted_at', startDate)
      .lte('converted_at', endDate)
      .order('converted_at', { ascending: false })

    // Calculate detailed metrics
    const totalCommission = conversions?.reduce((sum, conv) => sum + (conv.commission_amount || 0), 0) || 0
    const conversionRate = (clicks?.length || 0) > 0 ? ((conversions?.length || 0) / (clicks?.length || 0)) * 100 : 0
    const revenuePerClick = (clicks?.length || 0) > 0 ? (conversions?.reduce((sum, conv) => sum + conv.conversion_value, 0) || 0) / (clicks?.length || 0) : 0

    // Group data by date for time series
    const dailyStats = new Map()
    
    clicks?.forEach(click => {
      const date = click.clicked_at.split('T')[0]
      if (!dailyStats.has(date)) {
        dailyStats.set(date, { date, clicks: 0, conversions: 0, revenue: 0 })
      }
      dailyStats.get(date).clicks++
    })

    conversions?.forEach(conversion => {
      const date = conversion.converted_at.split('T')[0]
      if (dailyStats.has(date)) {
        dailyStats.get(date).conversions++
        dailyStats.get(date).revenue += conversion.conversion_value
      }
    })

    const timeSeries = Array.from(dailyStats.values()).sort((a, b) => a.date.localeCompare(b.date))

    const linkWithStats = {
      ...link,
      full_url: generateFullUrl(link.link_code),
      performance: {
        click_rate: clicks?.length || 0,
        conversion_rate: conversionRate,
        revenue_per_click: revenuePerClick,
        commission_earned: totalCommission
      },
      analytics: {
        date_range: { start_date: startDate, end_date: endDate },
        total_clicks: clicks?.length || 0,
        total_conversions: conversions?.length || 0,
        total_revenue: conversions?.reduce((sum, conv) => sum + conv.conversion_value, 0) || 0,
        total_commission: totalCommission,
        time_series: timeSeries
      },
      recent_clicks: clicks?.slice(0, 10) || [],
      recent_conversions: conversions?.slice(0, 10) || []
    }

    return NextResponse.json(linkWithStats)

  } catch (error) {
    console.error('Error in GET /api/partners/[id]/referral-links/[linkId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/partners/[id]/referral-links/[linkId] - Update referral link
export async function PUT(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string; linkId: string }> }
) {
  const { id, linkId } = await params;
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const partnerId = id
    const linkId = linkId

    // Check permissions
    const hasPermission = await checkPartnerPermissions(supabase, partnerId, user.id)
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Validate request body
    const body = await request.json()
    const validationResult = UpdateReferralLinkSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validationResult.error.errors 
      }, { status: 400 })
    }

    const updateData: UpdateReferralLinkRequest = validationResult.data

    // Check if link exists and belongs to partner
    const { data: existingLink, error: checkError } = await supabase
      .from('partner_referral_links')
      .select('id, link_code')
      .eq('id', linkId)
      .eq('partner_id', partnerId)
      .single()

    if (checkError || !existingLink) {
      return NextResponse.json({ error: 'Referral link not found' }, { status: 404 })
    }

    // Update referral link
    const { data: updatedLink, error: updateError } = await supabase
      .from('partner_referral_links')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', linkId)
      .eq('partner_id', partnerId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating referral link:', updateError)
      return NextResponse.json({ error: 'Failed to update referral link' }, { status: 500 })
    }

    // Add full URL to response
    const linkWithUrl = {
      ...updatedLink,
      full_url: generateFullUrl(updatedLink.link_code)
    }

    return NextResponse.json(linkWithUrl)

  } catch (error) {
    console.error('Error in PUT /api/partners/[id]/referral-links/[linkId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/partners/[id]/referral-links/[linkId] - Delete referral link
export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string; linkId: string }> }
) {
  const { id, linkId } = await params;
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const partnerId = id
    const linkId = linkId

    // Check permissions
    const hasPermission = await checkPartnerPermissions(supabase, partnerId, user.id)
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if link exists and belongs to partner
    const { data: existingLink, error: checkError } = await supabase
      .from('partner_referral_links')
      .select('id, click_count, conversion_count')
      .eq('id', linkId)
      .eq('partner_id', partnerId)
      .single()

    if (checkError || !existingLink) {
      return NextResponse.json({ error: 'Referral link not found' }, { status: 404 })
    }

    // Prevent deletion if link has tracking data (soft delete instead)
    if (existingLink.click_count > 0 || existingLink.conversion_count > 0) {
      // Soft delete - mark as inactive instead of deleting
      const { error: deactivateError } = await supabase
        .from('partner_referral_links')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', linkId)
        .eq('partner_id', partnerId)

      if (deactivateError) {
        console.error('Error deactivating referral link:', deactivateError)
        return NextResponse.json({ error: 'Failed to deactivate referral link' }, { status: 500 })
      }

      return NextResponse.json({ 
        message: 'Referral link deactivated (has tracking data)',
        soft_delete: true 
      })
    }

    // Hard delete if no tracking data
    const { error: deleteError } = await supabase
      .from('partner_referral_links')
      .delete()
      .eq('id', linkId)
      .eq('partner_id', partnerId)

    if (deleteError) {
      console.error('Error deleting referral link:', deleteError)
      return NextResponse.json({ error: 'Failed to delete referral link' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Referral link deleted successfully',
      soft_delete: false 
    })

  } catch (error) {
    console.error('Error in DELETE /api/partners/[id]/referral-links/[linkId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 