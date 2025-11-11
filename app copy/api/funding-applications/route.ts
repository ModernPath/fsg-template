import { NextRequest, NextResponse } from 'next/server';
// import { createClient } from '@/utils/supabase/server'; // Don't use server client for this pattern
import { createClient } from '@supabase/supabase-js'; // Use standard client
import { Database } from '@/types/supabase';

// Service role client that bypasses RLS
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Auth client for token verification
const authClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function GET(req: NextRequest) {
  console.log('GET /api/funding-applications called');

  try {
    // 1. Verify authentication & get user via Token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid auth header');
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }
    const token = authHeader.split(' ')[1];
    
    console.log('🔑 Verifying token...');
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('✅ User authenticated:', user.id);

    // 2. Parse query parameters
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const applicationId = searchParams.get('applicationId');

    console.log('📊 Query parameters:', { companyId, status, limit, applicationId });

    // 3. Build query
    let query = supabaseAdmin
      .from('funding_applications')
      .select(`
        *,
        companies!funding_applications_company_id_fkey(
          name,
          business_id
        ),
        financing_needs!funding_applications_funding_recommendation_id_fkey(
          id,
          purpose,
          requirements
        )
      `)
      .eq('user_id', user.id); // Only user's own applications

    // Add filters based on query parameters
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (applicationId) {
      query = query.eq('id', applicationId);
    }

    // Order by creation date (most recent first) and apply limit
    query = query.order('created_at', { ascending: false }).limit(limit);

    // 4. Execute query
    const { data: applications, error: queryError } = await query;

    if (queryError) {
      console.error('❌ Database query error:', queryError);
      return NextResponse.json(
        { error: `Database error: ${queryError.message}` },
        { status: 500 }
      );
    }

    // 5. Return success response
    console.log('✅ Found', applications?.length || 0, 'applications');
    
    if (applicationId && applications?.length === 1) {
      // Return single application when querying by ID
      return NextResponse.json(applications[0]);
    } else {
      // Return list of applications
      return NextResponse.json({
        success: true,
        applications: applications || [],
        count: applications?.length || 0
      });
    }

  } catch (error: any) {
    console.error('❌ Unexpected error in GET /api/funding-applications:', error);
    return NextResponse.json(
      { error: error.message || 'An internal server error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  console.log('POST /api/funding-applications called');
  // Removed unused supabase/user variables from top scope

  try {
    // 1. Verify authentication & get user via Token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid auth header');
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }
    const token = authHeader.split(' ')[1];
    
    console.log('🔑 Verifying token...');
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('✅ User authenticated:', user.id);

    // 2. Parse request body
    const body = await req.json();
    const { company_id, amount, term_months, funding_recommendation_id } = body;

    // 3. Validate input
    if (!company_id || !amount || !term_months) {
      console.error('❌ Missing required fields: company_id, amount, or term_months');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (typeof amount !== 'number' || amount <= 0 || typeof term_months !== 'number' || term_months <= 0) {
        console.error('❌ Invalid amount or term_months');
      return NextResponse.json({ error: 'Invalid amount or term (must be positive numbers)' }, { status: 400 });
    }
    
    // --- Fetch Applicant Details --- 
    console.log('👤 Fetching applicant and company details...');
    let applicantDetails = {};
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('full_name, email') // Adjust fields as needed
        .eq('id', user.id)
        .single();
      
      if (profileError) throw new Error(`Failed to fetch user profile: ${profileError.message}`);
      
      // Fetch company details
      const { data: companyData, error: companyError } = await supabaseAdmin
        .from('companies')
        .select('name, business_id') // Adjust fields as needed
        .eq('id', company_id)
        .single();

      if (companyError) throw new Error(`Failed to fetch company details: ${companyError.message}`);

      applicantDetails = {
        user: {
          id: user.id,
          fullName: profileData?.full_name,
          email: profileData?.email
        },
        company: {
          id: company_id,
          name: companyData?.name,
          businessId: companyData?.business_id
        }
      };
      console.log('✅ Applicant details fetched:', applicantDetails);

    } catch (detailsError: any) {
      console.error('❌ Error fetching applicant details:', detailsError);
      // Decide if this is a fatal error or if you can proceed without details
      return NextResponse.json(
        { error: `Failed to fetch required applicant details: ${detailsError.message}` },
        { status: 500 }
      );
    }

    // 4. Insert into database using Admin client
    console.log('📊 Inserting funding application...');
    // Use supabaseAdmin for insertion
    const { data: newApplication, error: insertError } = await supabaseAdmin
      .from('funding_applications')
      .insert({
        company_id: company_id,
        user_id: user.id, // Use authenticated user ID
        amount: amount,
        term_months: term_months,
        funding_recommendation_id: funding_recommendation_id || null, // Handle optional field
        // Add other relevant fields like status, applicant details if schema requires
        status: 'submitted', // Example initial status
        applicant_details: applicantDetails // Add the fetched details
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Database insert error:', insertError);
      // Check for specific DB errors like foreign key violations if necessary
      return NextResponse.json(
        { error: `Database error: ${insertError.message}` },
        { status: 500 }
      );
    }

    // 5. Return success response
    console.log('✅ Funding application submitted successfully:', newApplication.id);
    return NextResponse.json({
      success: true,
      applicationId: newApplication.id,
      message: 'Funding application submitted successfully'
    }, { status: 201 }); // 201 Created status

  } catch (error: any) {
    console.error('❌ Unexpected error in /api/funding-applications:', error);
    return NextResponse.json(
      { error: error.message || 'An internal server error occurred' },
      { status: 500 }
    );
  }
} 