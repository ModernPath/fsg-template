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
    let updateResult = null
    let rlsIssue = null
    
    if (profileData?.company_id) {
      const result = await supabaseAdmin
        .from('companies')
        .select('*')
        .eq('id', profileData.company_id)
        .single()
      
      companyData = result.data
      companyError = result.error
      
      // Check if there's an RLS issue by comparing created_by with user ID
      if (companyData) {
        rlsIssue = {
          hasCreatedBy: !!companyData.created_by,
          createdByMatchesUser: companyData.created_by === user.id,
          recommendation: !companyData.created_by 
            ? "Company is missing created_by field" 
            : companyData.created_by !== user.id 
              ? "created_by doesn't match user ID" 
              : "RLS policy may be too restrictive"
        }
        
        // Ensure the company has created_by field set to the user ID to fix RLS access
        if (!companyData.created_by || companyData.created_by !== user.id) {
          const { data: updated, error: updateError } = await supabaseAdmin
            .from('companies')
            .update({ created_by: user.id })
            .eq('id', profileData.company_id)
            .select()
          
          updateResult = {
            success: !updateError,
            data: updated,
            error: updateError ? updateError.message : null
          }
        }
      }
    }
    
    return NextResponse.json({
      user: user,
      profile: profileData,
      company: companyData,
      companyError: companyError ? companyError.message : null,
      update: updateResult,
      rlsIssue: rlsIssue,
      rls_debug: {
        company_id: profileData?.company_id,
        user_id: user.id,
        has_company: !!companyData,
        policies: "Check RLS policies for 'companies' table in Supabase dashboard"
      }
    })
  } catch (error: any) {
    console.error('Fix company access API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
} 