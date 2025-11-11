import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/user/company
 * Retrieves the company information for the current authenticated user
 */
export async function GET(request: Request) {
  try {
    // Log request details
    console.log('\n📝 [GET /api/user/company]');

    // Validate authorization
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid auth header');
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    // Verify token and get user
    console.log('🔑 Creating auth client...');
    const authClient = createClient();
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

    // Create service role client for database operations
    console.log('🔑 Creating service role client...');
    const supabase = createClient(true);

    // Get user's company data
    console.log('📊 Fetching user profile and company data...');
    
    // First get the user's profile to find the company_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile error:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    if (!profile?.company_id) {
      console.log('⚠️ User does not have a company associated');
      return NextResponse.json({
        companyId: null,
        companyName: null,
        message: 'No company associated with this user'
      });
    }

    // Get company details
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, business_id, type, industry')
      .eq('id', profile.company_id)
      .single();

    if (companyError) {
      console.error('❌ Company error:', companyError);
      return NextResponse.json(
        { error: 'Failed to fetch company data' },
        { status: 500 }
      );
    }

    // Return company data
    console.log('✅ Successfully fetched company data');
    return NextResponse.json({
      companyId: company.id,
      companyName: company.name,
      businessId: company.business_id,
      type: company.type,
      industry: company.industry
    });
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 