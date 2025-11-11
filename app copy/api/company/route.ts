import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { Database } from '@/types/supabase'

// GET /api/company - Fetch company data for the current user
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    // Create authenticated client
    const authClient = await createClient()
    
    // Verify token and get user
    const { data: { user }, error: authError } = await authClient.auth.getUser(
      authHeader.split(' ')[1]
    )
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create service role client for database operations
    const supabase = await createClient(undefined, true)

    // Get the user's company_id from their profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
    }

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'No company associated with user' }, { status: 404 })
    }

    // Fetch the company data and user's role
    const { data: companyWithRole, error: companyError } = await supabase
      .from('companies')
      .select(`
        *,
        user_companies!inner (
          role
        )
      `)
      .eq('id', profile.company_id)
      .eq('user_companies.user_id', user.id)
      .single()

    if (companyError) {
      console.error('Error fetching company:', companyError)
      return NextResponse.json({ error: 'Failed to fetch company data' }, { status: 500 })
    }

    // Add role to the company object
    const company = {
      ...companyWithRole,
      role: companyWithRole.user_companies[0]?.role || 'member'
    }
    
    // Remove the user_companies array from the response
    delete company.user_companies

    return NextResponse.json(company)
  } catch (error) {
    console.error('Error in GET /api/company:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/company - Update company data
export async function PUT(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    // Create authenticated client
    const authClient = await createClient()
    
    // Verify token and get user
    const { data: { user }, error: authError } = await authClient.auth.getUser(
      authHeader.split(' ')[1]
    )
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Create service role client for database operations
    const supabase = await createClient(undefined, true)

    // Get the user's company_id from their profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
    }

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'No company associated with user' }, { status: 404 })
    }

    // Update the company data
    const { data: company, error: updateError } = await supabase
      .from('companies')
      .update({
        name: body.name,
        business_id: body.business_id,
        address: body.address,
        contact_info: body.contact_info
      })
      .eq('id', profile.company_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating company:', updateError)
      return NextResponse.json({ error: 'Failed to update company data' }, { status: 500 })
    }

    return NextResponse.json(company)
  } catch (error) {
    console.error('Error in PUT /api/company:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 