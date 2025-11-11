import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize service role client that bypasses RLS
const getServiceClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Initialize auth client for token verification
const getAuthClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    console.log('🔄 [POST /api/profiles/associate-company] Processing request');
    
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid auth header');
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    // Create auth client and verify token
    const authClient = getAuthClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser(
      authHeader.split(' ')[1]
    );
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', user.id);

    // Parse request body
    const body = await request.json();
    const { userId, companyId } = body;
    
    if (!userId || !companyId) {
      console.error('❌ Missing required fields in request');
      return NextResponse.json(
        { error: 'Missing required fields: userId and companyId are required' },
        { status: 400 }
      );
    }

    // Only allow users to associate their own profile or admins to associate any profile
    if (userId !== user.id) {
      // Check if user is admin
      const serviceClient = getServiceClient();
      const { data: profile, error: profileError } = await serviceClient
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
        
      if (profileError || !profile?.is_admin) {
        console.error('❌ Permission denied:', profileError || 'Not an admin');
        return NextResponse.json(
          { error: 'You can only associate your own profile with a company' },
          { status: 403 }
        );
      }
    }

    // Get service role client for database operations
    const serviceClient = getServiceClient();
    
    // Try to find the user's profile - in this table, 'id' is the user ID
    const { data: existingProfile, error: findError } = await serviceClient
      .from('profiles')
      .select('id, company_id')
      .eq('id', userId)
      .maybeSingle();
      
    if (findError) {
      console.error('❌ Error finding profile:', findError);
      return NextResponse.json(
        { error: 'Failed to find user profile' },
        { status: 500 }
      );
    }
    
    if (existingProfile) {
      // Update existing profile - here id is already the user ID
      const { error: updateError } = await serviceClient
        .from('profiles')
        .update({ company_id: companyId })
        .eq('id', userId);
        
      if (updateError) {
        console.error('❌ Error updating profile:', updateError);
        return NextResponse.json(
          { error: 'Failed to update user profile' },
          { status: 500 }
        );
      }
    } else {
      // Create new profile if it doesn't exist
      // In this table, 'id' is the user ID (not a separate user_id field)
      const { data: newProfile, error: insertError } = await serviceClient
        .from('profiles')
        .insert({
          id: userId,  // id is the user ID
          company_id: companyId
        })
        .select()
        .single();
        
      if (insertError) {
        console.error('❌ Error creating profile:', insertError);
        return NextResponse.json(
          { error: 'Failed to create user profile' },
          { status: 500 }
        );
      }
    }
    
    // Verify that the company exists
    const { data: company, error: companyError } = await serviceClient
      .from('companies')
      .select('id, name')
      .eq('id', companyId)
      .single();
      
    if (companyError) {
      console.error('❌ Company not found:', companyError);
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }
    
    console.log(`✅ User ${userId} successfully associated with company ${companyId} (${company.name})`);
    
    return NextResponse.json({
      success: true,
      message: `User successfully associated with company ${company.name}`,
      userId,  // This is the profile ID since they're the same
      companyId,
      companyName: company.name
    });
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 