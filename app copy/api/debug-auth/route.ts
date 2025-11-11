import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create a Supabase client with the service role key to bypass RLS policies
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    // Get the email from the request
    const body = await request.json()
    const { email } = body
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }
    
    // First, find the user by email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers() 
    
    if (userError) {
      return NextResponse.json(
        { error: `Error fetching users: ${userError.message}` },
        { status: 500 }
      )
    }
    
    // Find the specific user by email
    const user = userData.users.find(u => u.email === email)
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Get the user's profile
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profileError) {
      return NextResponse.json(
        { error: `Error fetching profile: ${profileError.message}` },
        { status: 500 }
      )
    }
    
    // Get the user's company if the profile has a company_id
    let companyData = null
    let companyError = null
    
    if (profileData?.company_id) {
      const result = await supabaseAdmin
        .from('companies')
        .select('*')
        .eq('id', profileData.company_id)
        .single()
      
      companyData = result.data
      companyError = result.error
    }
    
    // Get RLS policies
    const { data: policiesData } = await supabaseAdmin
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'companies')
    
    return NextResponse.json({
      user,
      profile: profileData,
      company: companyData,
      companyError: companyError ? companyError.message : null,
      policies: policiesData
    })
  } catch (error: any) {
    console.error('Debug API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
} 