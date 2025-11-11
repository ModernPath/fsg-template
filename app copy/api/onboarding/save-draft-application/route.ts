import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    console.log('\n📝 [GET /api/onboarding/save-draft-application]');
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid authorization header');
      return NextResponse.json(
        { error: 'Authorization header missing or invalid' },
        { status: 401 }
      );
    }

    // Extract the access token
    const accessToken = authHeader.split(' ')[1];
    console.log('🔑 Access token received for GET request');

    // Create Supabase client and verify the token
    const supabase = await createClient();
    
    // Get the user using the access token
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !user) {
      console.error('❌ User authentication failed:', userError);
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', user.id);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const applicationId = searchParams.get('applicationId');

    console.log('📊 Query parameters:', { companyId, applicationId });

    // Use service role client for database operations
    let serviceSupabase;
    try {
      serviceSupabase = await createClient(undefined, true);
      console.log('✅ Service client created successfully');
    } catch (error) {
      console.error('❌ Failed to create service client:', error);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    if (applicationId) {
      // Fetch specific application by ID
      console.log('🔍 Fetching specific application:', applicationId);
      const { data: application, error: fetchError } = await serviceSupabase
        .from('funding_applications')
        .select('*')
        .eq('id', applicationId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching application:', {
          message: fetchError.message,
          details: fetchError.details,
          hint: fetchError.hint,
          code: fetchError.code
        });
        if (fetchError.code === 'PGRST116') {
          return NextResponse.json(
            { error: 'Application not found' },
            { status: 404 }
          );
        }
        return NextResponse.json(
          { error: `Failed to fetch application: ${fetchError.message}` },
          { status: 500 }
        );
      }

      console.log('✅ Application found:', application.id);
      return NextResponse.json(application);
    } else if (companyId) {
      // Fetch draft applications for company
      console.log('🔍 Fetching draft applications for company:', companyId);
      const { data: applications, error: fetchError } = await serviceSupabase
        .from('funding_applications')
        .select('*')
        .eq('company_id', companyId)
        .eq('user_id', user.id)
        .eq('status', 'draft')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error('❌ Error fetching applications:', {
          message: fetchError.message,
          details: fetchError.details,
          hint: fetchError.hint,
          code: fetchError.code
        });
        return NextResponse.json(
          { error: `Failed to fetch applications: ${fetchError.message}` },
          { status: 500 }
        );
      }

      console.log('✅ Found', applications.length, 'draft applications');
      return NextResponse.json({
        success: true,
        applications: applications,
        count: applications.length
      });
    } else {
      return NextResponse.json(
        { error: 'Missing companyId or applicationId parameter' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('❌ Unexpected error in GET /api/onboarding/save-draft-application:', error);
    return NextResponse.json(
      { error: error.message || 'An internal server error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('\n📝 [POST /api/onboarding/save-draft-application]');
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid authorization header');
      return NextResponse.json(
        { error: 'Authorization header missing or invalid' },
        { status: 401 }
      );
    }

    // Extract the access token
    const accessToken = authHeader.split(' ')[1];
    console.log('🔑 Access token received:', accessToken.substring(0, 20) + '...');

    // Create Supabase client and verify the token
    const supabase = await createClient();
    
    // Get the user using the access token
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !user) {
      console.error('❌ User authentication failed:', userError);
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', user.id);

    // Parse the request body
    const body = await request.json();
    const {
      company_id,
      user_id,
      type,
      amount,
      term_months,
      status = 'draft',
      funding_recommendation_id
    } = body;

    console.log('📊 Request data:', {
      company_id,
      user_id,
      type,
      amount,
      term_months,
      status,
      funding_recommendation_id
    });

    // Validate required fields
    if (!company_id || !user_id || !type || !amount) {
      console.error('❌ Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: company_id, user_id, type, amount' },
        { status: 400 }
      );
    }

    // Verify the user_id matches the authenticated user
    if (user_id !== user.id) {
      console.error('❌ User ID mismatch:', { provided: user_id, authenticated: user.id });
      return NextResponse.json(
        { error: 'User ID mismatch' },
        { status: 403 }
      );
    }

    // Use service role client for database operations
    let serviceSupabase;
    try {
      serviceSupabase = await createClient(undefined, true);
      console.log('✅ Service client created successfully for POST request');
    } catch (serviceError) {
      console.error('❌ Failed to create service client for POST request:', serviceError);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Fetch applicant details (user profile and company information)
    console.log('👤 Fetching applicant and company details...');
    let applicantDetails = {};
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await serviceSupabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();
      
      if (profileError) throw new Error(`Failed to fetch user profile: ${profileError.message}`);
      
      // Fetch company details
      const { data: companyData, error: companyError } = await serviceSupabase
        .from('companies')
        .select('name, business_id')
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
      return NextResponse.json(
        { error: `Failed to fetch required applicant details: ${detailsError.message}` },
        { status: 500 }
      );
    }

    // Check if a draft application already exists for this company and user
    console.log('🔍 Checking for existing draft application...', {
      company_id,
      user_id,
      status: 'draft'
    });
    
    let existingApp;
    let checkError;
    
    try {
      // First, let's try a more basic query to test the connection
      console.log('🔍 Testing database connection...');
      const connectionTest = await serviceSupabase
        .from('funding_applications')
        .select('count', { count: 'exact', head: true });
      
      console.log('✅ Connection test result:', connectionTest);
      
      // Handle multiple draft applications - get all drafts first
      const allDraftsResult = await serviceSupabase
        .from('funding_applications')
        .select('id, created_at')
        .eq('company_id', company_id)
        .eq('user_id', user_id)
        .eq('status', 'draft')
        .order('created_at', { ascending: false });
      
      if (allDraftsResult.error) {
        checkError = allDraftsResult.error;
        existingApp = null;
      } else {
        const drafts = allDraftsResult.data || [];
        console.log(`🔍 Found ${drafts.length} draft applications for this user/company`);
        
        if (drafts.length > 1) {
          // Multiple drafts exist - use the most recent one and clean up others
          console.log('🧹 Multiple draft applications found, cleaning up duplicates...');
          const mostRecent = drafts[0];
          const duplicates = drafts.slice(1);
          
          // Delete duplicate drafts (optional - you might want to keep them for audit)
          if (duplicates.length > 0) {
            const duplicateIds = duplicates.map(d => d.id);
            console.log(`🗑️ Deleting ${duplicates.length} duplicate draft applications:`, duplicateIds);
            
            const deleteResult = await serviceSupabase
              .from('funding_applications')
              .delete()
              .in('id', duplicateIds);
            
            if (deleteResult.error) {
              console.warn('⚠️ Failed to delete duplicate drafts:', deleteResult.error);
            } else {
              console.log('✅ Successfully cleaned up duplicate drafts');
            }
          }
          
          existingApp = { id: mostRecent.id };
        } else if (drafts.length === 1) {
          existingApp = { id: drafts[0].id };
        } else {
          existingApp = null;
        }
        
        checkError = null;
      }
      
      console.log('🔍 Final result:', { existingApp, checkError });
    } catch (queryError) {
      console.error('❌ Exception during query execution:', queryError);
      return NextResponse.json(
        { error: `Database query failed: ${queryError.message}` },
        { status: 500 }
      );
    }

    if (checkError) {
      console.error('❌ Error checking for existing application:', {
        error: checkError,
        message: checkError.message,
        code: checkError.code,
        details: checkError.details,
        hint: checkError.hint
      });
      return NextResponse.json(
        { error: `Failed to check for existing application: ${checkError.message || 'Unknown database error'}` },
        { status: 500 }
      );
    }

    let applicationId: string;

    if (existingApp) {
      console.log('📝 Updating existing draft application:', existingApp.id);
      // Update existing draft application
      const { data: updatedApp, error: updateError } = await serviceSupabase
        .from('funding_applications')
        .update({
          type,
          amount: Number(amount),
          term_months: term_months ? Number(term_months) : null,
          funding_recommendation_id,
          applicant_details: applicantDetails,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingApp.id)
        .select('id')
        .single();

      if (updateError) {
        console.error('❌ Error updating draft application:', updateError);
        return NextResponse.json(
          { error: 'Failed to update draft application' },
          { status: 500 }
        );
      }

      applicationId = updatedApp.id;
      console.log('✅ Updated existing draft application:', applicationId);
    } else {
      console.log('📝 Creating new draft application...');
      // Create new draft application
      const { data: newApp, error: insertError } = await serviceSupabase
        .from('funding_applications')
        .insert({
          company_id,
          user_id,
          type,
          amount: Number(amount),
          term_months: term_months ? Number(term_months) : null,
          status,
          funding_recommendation_id,
          applicant_details: applicantDetails,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('❌ Error creating draft application:', insertError);
        return NextResponse.json(
          { error: 'Failed to create draft application' },
          { status: 500 }
        );
      }

      applicationId = newApp.id;
      console.log('✅ Created new draft application:', applicationId);
    }

    console.log('✅ Draft application saved successfully');
    return NextResponse.json({
      success: true,
      applicationId,
      message: 'Draft application saved successfully'
    });

  } catch (error) {
    console.error('❌ Unexpected error in save-draft-application:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 