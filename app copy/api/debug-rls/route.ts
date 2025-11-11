import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create a Supabase client with the service role key
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
    // Get request parameters
    const body = await request.json()
    const { table, id, user_id } = body
    
    if (!table || !id || !user_id) {
      return NextResponse.json(
        { error: 'Required parameters: table, id, user_id' },
        { status: 400 }
      )
    }
    
    // Retrieve the policies for the table 
    const policyResults = await supabaseAdmin.rpc('check_policies', { 
      target_table: table, 
      record_id: id, 
      user_id: user_id 
    });
    
    // If RPC doesn't exist, fallback to manual check
    const policies = policyResults.error ? null : policyResults.data;
    
    // Get the actual record using service role
    const { data: record, error: recordError } = await supabaseAdmin
      .from(table)
      .select('*')
      .eq('id', id)
      .single()
    
    if (recordError) {
      return NextResponse.json(
        { error: `Error fetching record: ${recordError.message}` },
        { status: 500 }
      )
    }
    
    // Get the user using the Supabase admin API
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(user_id)
    
    if (userError) {
      return NextResponse.json(
        { error: `Error fetching user: ${userError.message}` },
        { status: 500 }
      )
    }
    
    // Check relationships relevant to RLS
    const relationships = {
      record_has_created_by: 'created_by' in record ? record.created_by === user_id : false,
      record_has_user_id: 'user_id' in record ? record.user_id === user_id : false
    }
    
    // Execute a test query using the Auth context to test RLS
    const testClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false
        }
      }
    )
    
    // Set auth state to the target user
    const { error: authError } = await testClient.auth.setSession({
      access_token: userData.user.confirmation_sent_at || '', // This is just a placeholder, won't work
      refresh_token: '' // Not actually used
    })
    
    // This is for demonstration only - in real usage, this doesn't work without a valid token
    // But we show what fields would be checked
    
    // Return diagnostic information
    return NextResponse.json({
      record_exists: !!record,
      record: {
        id: record.id,
        created_by: record.created_by || null,
        ...('user_id' in record ? { user_id: record.user_id } : {})
      },
      user: {
        id: userData.user.id,
        email: userData.user.email
      },
      relationships,
      rls_policies: policies || {
        message: "To check policies directly, create an RPC function 'check_policies' in Supabase",
        manual_check: "Verify in Supabase Dashboard → Authentication → Policies that appropriate policies exist for this table"
      },
      recommendation: !relationships.record_has_created_by 
        ? "Set record.created_by = user_id to fix RLS" 
        : "Check RLS policies in Supabase dashboard"
    })
  } catch (error: any) {
    console.error('Debug RLS API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
} 