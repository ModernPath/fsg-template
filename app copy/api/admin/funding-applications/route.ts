import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { Database } from '@/types/supabase'

export async function GET(request: Request) {
  console.log('\\n📝 [GET /api/admin/funding-applications]', {
    headers: Object.fromEntries(request.headers),
    url: request.url
  })

  try {
    // 1. Verify authentication & admin role
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid auth header')
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    console.log('🔑 Creating auth client...')
    const authClient = await createClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser(
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

    const { data: profile } = await authClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      console.error('🚫 User is not an admin:', user.id)
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }
    console.log('🔑 User verified as admin:', user.id)

    // 2. Create service role client for database operations
    console.log('🔑 Creating service role client...')
    const supabase = await createClient(undefined, true)

    // 3. Start with comprehensive query for hover details
    console.log('📊 Fetching funding applications with comprehensive data...')
    const { data: fundingApplications, error } = await supabase
      .from('funding_applications')
      .select(`
        *,
        companies (
          id,
          name,
          business_id,
          type,
          industry,
          founded,
          employees,
          website,
          address,
          contact_info,
          description,
          products,
          market,
          key_competitors,
          metadata,
          created_at,
          updated_at
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Database error:', error)
      throw error
    }

    console.log('✅ Successfully fetched funding applications:', fundingApplications?.length || 0)
    
    // 4. Fetch lender applications separately for now
    const applicationIds = fundingApplications?.map(app => app.id) || []
    console.log('📊 Fetching lender applications for:', applicationIds.length, 'applications')
    
    let lenderApplications = []
    if (applicationIds.length > 0) {
      const { data: lenderApps, error: lenderError } = await supabase
        .from('lender_applications')
        .select(`
          *,
          lenders (
            id,
            name,
            type
          )
        `)
        .in('application_id', applicationIds)

      if (lenderError) {
        console.error('❌ Error fetching lender applications:', lenderError)
      } else {
        lenderApplications = lenderApps || []
        console.log('✅ Successfully fetched lender applications:', lenderApplications.length)
      }
    }

    // 5. Combine the data
    const enhancedData = fundingApplications?.map(app => ({
      ...app,
      lender_applications: lenderApplications.filter(la => la.application_id === app.id) || []
    }))

    console.log('📊 Enhanced data prepared with', enhancedData?.length || 0, 'applications')
    
    return NextResponse.json(enhancedData)

  } catch (error) {
    console.error('❌ Unexpected error in /api/admin/funding-applications:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    const errorCode = (error as any)?.code
    
    return NextResponse.json(
      { 
        error: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error',
        code: process.env.NODE_ENV === 'development' ? errorCode : undefined,
      },
      { status: 500 }
    )
  }
} 