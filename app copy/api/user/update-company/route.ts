import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Auth client for token verification
const authClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Service role client that bypasses RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * API endpoint to update the current user's profile with a specific company ID
 * This is useful for fixing mismatches between uploaded documents and user profiles
 */
export async function POST(request: NextRequest) {
  try {
    // Extract and validate auth token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('Missing or invalid Authorization header');
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    console.log('Token received, verifying...');
    
    // Verify token using auth client
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('User authenticated:', user.id);
    
    // Get request body with company ID
    const { companyId } = await request.json();
    
    if (!companyId) {
      return NextResponse.json({ error: 'Missing companyId in request body' }, { status: 400 });
    }
    
    // Verify the company exists
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('id, name')
      .eq('id', companyId)
      .single();
    
    if (companyError || !company) {
      console.error('Company not found:', companyError);
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    
    // Update the user's profile with the company ID
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ company_id: companyId })
      .eq('id', user.id)
      .select('id, company_id')
      .single();
    
    if (profileError) {
      console.error('Error updating profile:', profileError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Profile updated successfully. User ${user.id} is now associated with company ${company.name} (${companyId})`,
      profile
    });
    
  } catch (error) {
    console.error('Unhandled error in update-company API:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
} 