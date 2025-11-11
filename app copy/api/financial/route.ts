import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for admin access
const getSupabaseClient = (serviceRole = false) => {
  if (serviceRole) {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

/**
 * GET handler for financial data endpoint
 * Retrieves financial metrics, future goals, and funding recommendations for a company
 */
export async function GET(request: Request) {
  try {
    // Log request details
    console.log('\n📝 [GET /api/financial]', {
      url: request.url
    });

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    
    if (!companyId) {
      console.error('❌ Missing required companyId parameter');
      return NextResponse.json(
        { error: 'Missing required companyId parameter' },
        { status: 400 }
      );
    }

    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid auth header');
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    // Create authenticated client and verify token
    console.log('🔑 Verifying authentication...');
    const authClient = getSupabaseClient();
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
    const supabase = getSupabaseClient(true);

    // Check if user has access to this company (is associated with it)
    console.log('🔒 Verifying company access...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', companyId)
      .maybeSingle();
    
    // Also check if user is admin
    const { data: adminCheck, error: adminError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();
    
    const isAdmin = adminCheck?.is_admin === true;
    
    // Only allow access if user is associated with company or is admin
    if ((!profile && !isAdmin) || profileError) {
      console.error('❌ Access denied to company data');
      return NextResponse.json(
        { error: 'You do not have access to this company\'s financial data' },
        { status: 403 }
      );
    }

    // Fetch financial metrics
    console.log('📊 Fetching financial metrics...');
    const { data: financialMetrics, error: metricsError } = await supabase
      .from('financial_metrics')
      .select('*')
      .eq('company_id', companyId)
      .order('fiscal_year', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (metricsError) {
      console.error('❌ Error fetching financial metrics:', metricsError);
      return NextResponse.json(
        { error: 'Failed to fetch financial metrics' },
        { status: 500 }
      );
    }

    // Fetch future goals
    console.log('📊 Fetching future goals...');
    const { data: futureGoals, error: goalsError } = await supabase
      .from('future_goals')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (goalsError) {
      console.error('❌ Error fetching future goals:', goalsError);
      return NextResponse.json(
        { error: 'Failed to fetch future goals' },
        { status: 500 }
      );
    }

    // Fetch funding recommendations
    console.log('📊 Fetching funding recommendations...');
    const { data: fundingRecommendations, error: recommendationsError } = await supabase
      .from('funding_recommendations')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (recommendationsError) {
      console.error('❌ Error fetching funding recommendations:', recommendationsError);
      return NextResponse.json(
        { error: 'Failed to fetch funding recommendations' },
        { status: 500 }
      );
    }

    // Return the financial data
    console.log('✅ Successfully fetched financial data');
    return NextResponse.json({
      financialMetrics,
      futureGoals,
      fundingRecommendations
    });
  } catch (error) {
    // Handle unexpected errors
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for future goals endpoint
 * Creates or updates future goals for a company
 */
export async function POST(request: Request) {
  try {
    // Log request details
    console.log('\n📝 [POST /api/financial]', {
      url: request.url
    });

    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid auth header');
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    // Create authenticated client and verify token
    console.log('🔑 Verifying authentication...');
    const authClient = getSupabaseClient();
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

    // Get request body
    const body = await request.json();
    const { companyId, futureGoalsData } = body;
    
    if (!companyId || !futureGoalsData) {
      console.error('❌ Missing required fields in request body');
      return NextResponse.json(
        { error: 'Missing required fields: companyId and futureGoalsData are required' },
        { status: 400 }
      );
    }

    // Create service role client for database operations
    console.log('🔑 Creating service role client...');
    const supabase = getSupabaseClient(true);

    // Check if user has access to this company
    console.log('🔒 Verifying company access...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', companyId)
      .maybeSingle();
    
    // Also check if user is admin
    const { data: adminCheck, error: adminError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();
    
    const isAdmin = adminCheck?.is_admin === true;
    
    // Only allow access if user is associated with company or is admin
    if ((!profile && !isAdmin) || profileError) {
      console.error('❌ Access denied to company data');
      return NextResponse.json(
        { error: 'You do not have access to modify this company\'s financial data' },
        { status: 403 }
      );
    }

    // Prepare future goals data
    const futureGoals = {
      company_id: companyId,
      required_working_capital_increase: futureGoalsData.required_working_capital_increase,
      inventory_personnel_resource_needs: futureGoalsData.inventory_personnel_resource_needs,
      investment_priorities: futureGoalsData.investment_priorities,
      estimated_investment_amounts: futureGoalsData.estimated_investment_amounts,
      cost_structure_adaptation: futureGoalsData.cost_structure_adaptation,
      created_by: user.id
    };

    // Insert future goals
    console.log('📊 Creating future goals...');
    const { data: insertedGoals, error: insertError } = await supabase
      .from('future_goals')
      .insert(futureGoals)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Error creating future goals:', insertError);
      return NextResponse.json(
        { error: 'Failed to create future goals' },
        { status: 500 }
      );
    }

    // Fetch latest financial metrics to generate new recommendations
    console.log('📊 Fetching latest financial metrics...');
    const { data: latestMetrics, error: metricsError } = await supabase
      .from('financial_metrics')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (metricsError) {
      console.error('❌ Error fetching financial metrics:', metricsError);
      return NextResponse.json(
        { 
          success: true,
          futureGoals: insertedGoals,
          message: 'Future goals created, but could not generate recommendations due to missing financial metrics'
        },
        { status: 201 }
      );
    }

    // Import the financial analysis service
    const { generateFundingRecommendations } = await import('@/lib/services/financialAnalysisService');

    // Generate new funding recommendations
    console.log('📊 Generating funding recommendations...');
    
    try {
      const recommendations = await generateFundingRecommendations(
        latestMetrics,
        insertedGoals,
        companyId
      );
      
      // Return success with all data
      console.log('✅ Successfully created future goals and recommendations');
      return NextResponse.json({
        success: true,
        futureGoals: insertedGoals,
        fundingRecommendations: recommendations
      }, { status: 201 });
    } catch (recError) {
      console.error('❌ Error generating recommendations:', recError);
      
      // Still return successfully created goals
      return NextResponse.json({
        success: true,
        futureGoals: insertedGoals,
        message: 'Future goals created, but failed to generate recommendations'
      }, { status: 201 });
    }
  } catch (error) {
    // Handle unexpected errors
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 