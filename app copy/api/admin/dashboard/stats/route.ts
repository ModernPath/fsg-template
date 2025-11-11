import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get authorization header for client-side authentication
    const authHeader = request.headers.get('Authorization')
    let session = null
    
    if (authHeader?.startsWith('Bearer ')) {
      // Client-side call with explicit token
      const token = authHeader.split(' ')[1]
      const supabase = await createClient()
      const { data } = await supabase.auth.getUser(token)
      if (data.user) {
        session = { user: data.user }
      }
    } else {
      // Server-side call with cookies
      const supabase = await createClient()
      const { data: { session: cookieSession }, error: authError } = await supabase.auth.getSession()
      
      if (!authError && cookieSession) {
        session = cookieSession
      }
    }
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const supabase = await createClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // Fetch real statistics
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())

    // 1. Active Companies (companies created in the last 30 days or with recent activity)
    const { count: totalCompanies } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true })

    const { count: activeCompanies } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', lastMonth.toISOString())

    // 2. Total Users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    const { count: lastMonthUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', lastMonth.toISOString())

    // 3. Monthly Revenue (from funding_applications with amount and approved status)
    const { data: approvedApplications } = await supabase
      .from('funding_applications')
      .select('amount')
      .in('status', ['approved', 'processing'])
      .gte('created_at', lastMonth.toISOString())

    const monthlyRevenue = approvedApplications?.reduce((sum, app) => sum + (app.amount || 0), 0) || 0

    // 4. Analysis Count (funding_recommendations)
    const { count: totalAnalyses } = await supabase
      .from('funding_recommendations')
      .select('*', { count: 'exact', head: true })

    const { count: lastMonthAnalyses } = await supabase
      .from('funding_recommendations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', lastMonth.toISOString())

    // Calculate growth percentages
    const companiesGrowth = activeCompanies && totalCompanies 
      ? ((activeCompanies / totalCompanies) * 100).toFixed(0) 
      : '0'

    const usersGrowth = lastMonthUsers && totalUsers 
      ? ((lastMonthUsers / totalUsers) * 100).toFixed(0) 
      : '0'

    const analysesGrowth = lastMonthAnalyses && totalAnalyses 
      ? ((lastMonthAnalyses / totalAnalyses) * 100).toFixed(0) 
      : '0'

    // Format revenue
    const formatRevenue = (amount: number): string => {
      if (amount >= 1000000) {
        return `€${(amount / 1000000).toFixed(1)}M`
      } else if (amount >= 1000) {
        return `€${(amount / 1000).toFixed(1)}k`
      }
      return `€${amount.toFixed(0)}`
    }

    // Return stats
    return NextResponse.json({
      stats: {
        activeCompanies: {
          value: totalCompanies?.toString() || '0',
          change: `+${companiesGrowth}%`,
          trend: 'up'
        },
        totalUsers: {
          value: totalUsers?.toString() || '0',
          change: `+${usersGrowth}%`,
          trend: 'up'
        },
        monthlyRevenue: {
          value: formatRevenue(monthlyRevenue),
          change: '+0%', // TODO: Calculate previous month comparison
          trend: 'up'
        },
        totalAnalyses: {
          value: totalAnalyses?.toString() || '0',
          change: `+${analysesGrowth}%`,
          trend: 'up'
        }
      }
    })

  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
}

