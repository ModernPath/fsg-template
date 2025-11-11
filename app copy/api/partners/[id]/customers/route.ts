import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('📊 [GET /api/partners/[id]/customers] Starting...')
    
    // Get partner ID from params
    const { id: partnerId } = await params
    console.log('🔍 Partner ID:', partnerId)

    // Get search parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    console.log('📊 Query params:', { page, limit, status, search })

    // Verify authentication
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid auth header')
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    // Create service role client for authentication and database operations
    const supabase = await createClient(undefined, true)
    
    // Verify token with service role client
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.split(' ')[1]
    )

    if (authError || !user) {
      console.error('❌ Auth error:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('✅ User authenticated:', user.id)

    // Verify partner exists and user has access
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('id, name')
      .eq('id', partnerId)
      .single()

    if (partnerError || !partner) {
      console.error('❌ Partner not found:', partnerError)
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
      )
    }

    console.log('✅ Partner found:', partner.name)

    // Build query for companies referred by this partner
    let query = supabase
      .from('companies')
      .select(`
        id,
        name,
        business_id,
        contact_info,
        created_at,
        partner_commissions (
          id,
          commission_amount,
          commission_percent,
          status,
          generated_at,
          paid_at,
          payment_date
        )
      `)
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false })

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,business_id.ilike.%${search}%`)
    }

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: companies, error: companiesError } = await query

    if (companiesError) {
      console.error('❌ Error fetching companies:', companiesError)
      return NextResponse.json(
        { error: 'Failed to fetch customers' },
        { status: 500 }
      )
    }

    console.log('✅ Found companies:', companies?.length || 0)

    // Transform data for frontend
    const customers = (companies || []).map(company => {
      const commissions = company.partner_commissions || []
      const totalCommission = commissions.reduce((sum, comm) => sum + (comm.commission_amount || 0), 0)
      const lastCommission = commissions.length > 0 ? commissions[commissions.length - 1] : null
      
      // Determine status based on commissions
      let customerStatus: 'pending' | 'approved' | 'paid' | 'cancelled' | 'disputed' = 'pending'
      if (commissions.some(c => c.status === 'paid')) {
        customerStatus = 'paid'
      } else if (commissions.some(c => c.status === 'approved')) {
        customerStatus = 'approved'
      }

      return {
        id: company.id,
        company_name: company.name,
        business_id: company.business_id,
        email: company.contact_info?.email || '',
        phone: company.contact_info?.phone,
        status: customerStatus,
        created_at: company.created_at,
        contract_count: commissions.length,
        total_commission: totalCommission,
        last_commission_date: lastCommission?.generated_at || null,
        last_commission_amount: lastCommission?.commission_amount || 0
      }
    })

    // Apply status filter after transformation
    const filteredCustomers = status && status !== 'all' 
      ? customers.filter(customer => customer.status === status)
      : customers

    // Calculate stats
    const stats = {
      total_customers: filteredCustomers.length,
      paid_customers: filteredCustomers.filter(c => c.status === 'paid').length,
      total_commissions: filteredCustomers.reduce((sum, c) => sum + c.total_commission, 0),
      average_per_customer: filteredCustomers.length > 0 
        ? filteredCustomers.reduce((sum, c) => sum + c.total_commission, 0) / filteredCustomers.length 
        : 0
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true })
      .eq('partner_id', partnerId)

    const pagination = {
      page,
      limit,
      total: totalCount || 0,
      pages: Math.ceil((totalCount || 0) / limit)
    }

    console.log('✅ Returning customers:', {
      count: filteredCustomers.length,
      stats,
      pagination
    })

    return NextResponse.json({
      data: filteredCustomers,
      stats,
      pagination
    })

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
