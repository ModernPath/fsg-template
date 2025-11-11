import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET /api/admin/dashboard/partners-stats - Get partner statistics for dashboard
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get total partners count
    const { count: totalPartners } = await supabase
      .from('partners')
      .select('*', { count: 'exact', head: true })

    // Get active partners count
    const { count: activePartners } = await supabase
      .from('partners')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    // Get total commissions amount
    const { data: commissionsData } = await supabase
      .from('partner_commissions')
      .select('amount')

    const totalCommissions = commissionsData?.reduce((sum, c) => 
      sum + parseFloat(c.amount || '0'), 0) || 0

    // Get pending payments
    const { data: pendingData } = await supabase
      .from('partner_commissions')
      .select('amount')
      .eq('status', 'pending')

    const pendingPayments = pendingData?.reduce((sum, c) => 
      sum + parseFloat(c.amount || '0'), 0) || 0

    // Get recent partners (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { count: recentPartners } = await supabase
      .from('partners')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString())

    // Get partner tiers distribution
    const { data: tierData } = await supabase
      .from('partners')
      .select('tier')

    const tierDistribution = tierData?.reduce((acc, p) => {
      acc[p.tier] = (acc[p.tier] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const stats = {
      total_partners: totalPartners || 0,
      active_partners: activePartners || 0,
      total_commissions: totalCommissions,
      pending_payments: pendingPayments,
      recent_partners: recentPartners || 0,
      tier_distribution: tierDistribution,
      conversion_rate: (totalPartners || 0) > 0 ? ((activePartners || 0) / (totalPartners || 0) * 100) : 0
    }

    return NextResponse.json({ stats })

  } catch (error) {
    console.error('Error in GET /api/admin/dashboard/partners-stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 