import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// PUT /api/company/switch - Switch active company for the user
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
    const { company_id } = body

    if (!company_id) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      )
    }

    // Create service role client for database operations
    const supabase = await createClient(undefined, true)

    // Verify that the user has access to this company
    const { data: userCompany, error: userCompanyError } = await supabase
      .from('user_companies')
      .select('role')
      .eq('user_id', user.id)
      .eq('company_id', company_id)
      .single()

    if (userCompanyError || !userCompany) {
      return NextResponse.json(
        { error: 'You do not have access to this company' },
        { status: 403 }
      )
    }

    // Update the user's profile to set the new active company
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ company_id })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating active company:', updateError)
      return NextResponse.json({ error: 'Failed to switch company' }, { status: 500 })
    }

    // Fetch the company details to return
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', company_id)
      .single()

    if (companyError) {
      console.error('Error fetching company details:', companyError)
      return NextResponse.json({ error: 'Failed to fetch company details' }, { status: 500 })
    }

    return NextResponse.json({ 
      ...company, 
      role: userCompany.role,
      message: 'Company switched successfully' 
    })
  } catch (error) {
    console.error('Error in PUT /api/company/switch:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 