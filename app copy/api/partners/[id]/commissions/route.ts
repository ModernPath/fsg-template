import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET /api/partners/[id]/commissions - Get partner commissions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('\n📝 [GET /api/partners/[id]/commissions]', {
      headers: Object.fromEntries(request.headers),
      url: request.url
    })

    const { id } = await params
    console.log('📋 Partner ID from params:', id)

    // Check for Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid Authorization header')
      return NextResponse.json({ 
        error: 'Missing or invalid authorization header' 
      }, { status: 401 })
    }

    // Create authenticated supabase client
    console.log('🔑 Creating auth client...')
    const authClient = await createClient()
    
    // Verify token and get user
    const { data: { user }, error: authError } = await authClient.auth.getUser(
      authHeader.split(' ')[1]
    )
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ User authenticated:', user.id)

    // Check admin status OR if user is the partner themselves
    console.log('🔍 Checking permissions...')
    const { data: profile } = await authClient
      .from('profiles')
      .select('is_admin, is_partner, partner_id')
      .eq('id', user.id)
      .single()

    console.log('👤 User profile:', {
      userId: user.id,
      isAdmin: profile?.is_admin,
      isPartner: profile?.is_partner,
      profilePartnerId: profile?.partner_id,
      requestedPartnerId: id
    })

    const isAdmin = profile?.is_admin
    const isOwnPartner = profile?.is_partner && profile?.partner_id === id

    if (!isAdmin && !isOwnPartner) {
      console.error('❌ Forbidden: User not admin and not own partner')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    console.log('✅ Permission check passed')

    // Create service role client for database operations
    console.log('🔑 Creating service role client...')
    const supabase = await createClient(true)

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || ''
    const fromDate = searchParams.get('from') || ''
    const toDate = searchParams.get('to') || ''
    const format = searchParams.get('format') || 'json' // json, csv, pdf

    console.log('📊 Query params:', { page, limit, status, fromDate, toDate, format })

    // Build query
    console.log('📊 Building query for partner_commissions...')
    let query = supabase
      .from('partner_commissions')
      .select(`
        *,
        company:companies(
          id,
          name,
          business_id
        ),
        agreement:funding_applications(
          id,
          amount,
          status
        )
      `)
      .eq('partner_id', id)

    // Add filters
    if (status) {
      query = query.eq('status', status)
    }
    if (fromDate) {
      query = query.gte('generated_at', fromDate)
    }
    if (toDate) {
      query = query.lte('generated_at', toDate)
    }

    // Add pagination for JSON response
    if (format === 'json') {
      const offset = (page - 1) * limit
      query = query
        .order('generated_at', { ascending: false })
        .range(offset, offset + limit - 1)
    } else {
      // For exports, get all matching records
      query = query.order('generated_at', { ascending: false })
    }

    console.log('📊 Executing query...')
    const { data: commissions, error } = await query

    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch commissions' }, { status: 500 })
    }

    console.log('✅ Fetched commissions:', commissions?.length || 0)

    // Handle different export formats
    if (format === 'csv') {
      return generateCSVResponse(commissions)
    } else if (format === 'pdf') {
      // TODO: Implement PDF generation
      return NextResponse.json({ error: 'PDF export not yet implemented' }, { status: 501 })
    }

    // JSON response with pagination
    console.log('📊 Getting total count...')
    const { count } = await supabase
      .from('partner_commissions')
      .select('*', { count: 'exact', head: true })
      .eq('partner_id', id)

    // Calculate summary statistics
    const totalCommissions = commissions.reduce((sum, c) => sum + parseFloat(c.commission_amount || '0'), 0)
    const paidCommissions = commissions
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + parseFloat(c.commission_amount || '0'), 0)
    const pendingCommissions = commissions
      .filter(c => c.status === 'pending' || c.status === 'calculated')
      .reduce((sum, c) => sum + parseFloat(c.commission_amount || '0'), 0)

    const result = {
      commissions,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      },
      summary: {
        total_amount: totalCommissions,
        paid_amount: paidCommissions,
        pending_amount: pendingCommissions,
        total_count: commissions.length
      }
    }

    console.log('✅ Returning result:', {
      commissionCount: commissions.length,
      totalCount: count,
      summary: result.summary
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ Unexpected error in GET /api/partners/[id]/commissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/partners/[id]/commissions - Bulk update commission status (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('\n📝 [PATCH /api/partners/[id]/commissions]')

    const { id } = await params
    console.log('📋 Partner ID from params:', id)

    // Check for Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid Authorization header')
      return NextResponse.json({ 
        error: 'Missing or invalid authorization header' 
      }, { status: 401 })
    }

    // Create authenticated supabase client
    console.log('🔑 Creating auth client...')
    const authClient = await createClient()
    
    // Verify token and get user
    const { data: { user }, error: authError } = await authClient.auth.getUser(
      authHeader.split(' ')[1]
    )
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ User authenticated:', user.id)

    // Check admin status (only admins can update commission status)
    console.log('🔍 Checking admin permissions...')
    const { data: profile } = await authClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      console.error('❌ Forbidden: User not admin')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    console.log('✅ Admin permission check passed')

    // Create service role client for database operations
    console.log('🔑 Creating service role client...')
    const supabase = await createClient(true)

    // Parse request body
    const body = await request.json()
    const { commission_ids, status, payment_reference, notes } = body

    console.log('📋 Update request:', { commission_ids, status, payment_reference, notes })

    if (!commission_ids || !Array.isArray(commission_ids) || commission_ids.length === 0) {
      return NextResponse.json({ error: 'commission_ids array is required' }, { status: 400 })
    }

    if (!['pending', 'calculated', 'paid', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Update commissions
    const updateData: any = { status }
    if (status === 'paid') {
      updateData.paid_at = new Date().toISOString()
      if (payment_reference) {
        updateData.payment_reference = payment_reference
      }
    }
    if (notes) {
      updateData.notes = notes
    }

    console.log('📊 Updating commissions...')
    const { data: updatedCommissions, error } = await supabase
      .from('partner_commissions')
      .update(updateData)
      .in('id', commission_ids)
      .eq('partner_id', id)
      .select()

    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json({ error: 'Failed to update commissions' }, { status: 500 })
    }

    console.log('✅ Updated commissions:', updatedCommissions.length)

    // Log audit trail for each commission
    for (const commission of updatedCommissions) {
      await supabase.rpc('log_partner_audit', {
        p_partner_id: id,
        p_action: 'UPDATE_COMMISSION',
        p_resource_type: 'commission',
        p_resource_id: commission.id,
        p_new_values: { status, payment_reference, notes }
      })
    }

    return NextResponse.json({
      updated_commissions: updatedCommissions,
      count: updatedCommissions.length
    })

  } catch (error) {
    console.error('❌ Unexpected error in PATCH /api/partners/[id]/commissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to generate CSV response
function generateCSVResponse(commissions: any[]) {
  const headers = [
    'ID',
    'Company',
    'Business ID',
    'Commission Amount',
    'Base Amount',
    'Commission %',
    'Status',
    'Generated At',
    'Paid At',
    'Payment Reference',
    'Notes'
  ]

  const rows = commissions.map(c => [
    c.id,
    c.company?.name || 'N/A',
    c.company?.business_id || 'N/A',
    c.commission_amount,
    c.base_amount,
    c.commission_percent,
    c.status,
    c.generated_at,
    c.paid_at || '',
    c.payment_reference || '',
    c.notes || ''
  ])

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="partner-commissions-${new Date().toISOString().split('T')[0]}.csv"`
    }
  })
} 