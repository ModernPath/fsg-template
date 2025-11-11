import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateFundingRecommendations } from '@/lib/services/financialAnalysisService';
import { NextRequest } from 'next/server';

/**
 * GET /api/funding-recommendations/company/[companyId]
 * Retrieves funding recommendations for a specific company
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params;
  
  console.log('🔍 GET /api/funding-recommendations/company/[companyId] called with:', {
    companyId,
    url: request.url
  })

  try {
    // Log request details
    console.log('\n📝 [GET /api/funding-recommendations/company]', {
      companyId: companyId,
      url: request.url
    });

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

    // Create client for database operations
    console.log('🔑 Creating service role client...');
    const supabase = createClient(true);

    // Verify that the user has access to the company
    const { data: companyAccess, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('id', companyId)
      .eq('created_by', user.id)
      .maybeSingle();

    if (companyError) {
      console.error('❌ Company access error:', companyError);
      return NextResponse.json(
        { error: 'Error checking company access' },
        { status: 500 }
      );
    }

    if (!companyAccess) {
      console.error('❌ User does not have access to this company');
      return NextResponse.json(
        { error: 'You do not have access to this company' },
        { status: 403 }
      );
    }

    // Fetch funding recommendations
    console.log('📊 Fetching funding recommendations...');
    const { data, error } = await supabase
      .from('funding_recommendations')
      .select(`
        *,
        financial_metrics:financial_metrics_id(
          id,
          fiscal_year,
          fiscal_period,
          operational_cash_flow,
          investment_cash_flow,
          return_on_equity,
          debt_to_equity_ratio,
          quick_ratio,
          current_ratio,
          revenue_current,
          revenue_previous,
          revenue_growth_rate
        ),
        future_goals:future_goals_id(
          id,
          required_working_capital_increase,
          investment_priorities,
          estimated_investment_amounts
        )
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch funding recommendations' },
        { status: 500 }
      );
    }

    // Return the results
    console.log('✅ Successfully fetched funding recommendations');
    return NextResponse.json({
      data,
      metadata: {
        count: data?.length || 0,
        company_id: companyId
      }
    });
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/funding-recommendations/company/[companyId]
 * Triggers a new funding analysis for a company
 * Optional body parameters:
 * - financial_metrics_id: Specific financial metrics to use (uses latest by default)
 * - future_goals_id: Specific future goals to consider (uses latest by default)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params;
  
  console.log('📝 POST /api/funding-recommendations/company/[companyId] called with:', {
    companyId: companyId
  })

  try {
    // Log request details
    console.log('\n📝 [POST /api/funding-recommendations/company]', {
      companyId: companyId
    });

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

    // Create client for database operations
    console.log('🔑 Creating service role client...');
    const supabase = createClient(true);

    // Verify that the user has access to the company
    const { data: companyAccess, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('id', companyId)
      .eq('created_by', user.id)
      .maybeSingle();

    if (companyError) {
      console.error('❌ Company access error:', companyError);
      return NextResponse.json(
        { error: 'Error checking company access' },
        { status: 500 }
      );
    }

    if (!companyAccess) {
      console.error('❌ User does not have access to this company');
      return NextResponse.json(
        { error: 'You do not have access to this company' },
        { status: 403 }
      );
    }

    // Get request body if provided
    let financialMetricsId: string | undefined;
    let futureGoalsId: string | undefined;

    try {
      const body = await request.json();
      financialMetricsId = body.financial_metrics_id;
      futureGoalsId = body.future_goals_id;
    } catch (error) {
      // No body or invalid JSON, will use latest metrics and goals
      console.log('No body provided or invalid JSON, using latest metrics and goals');
    }

    // Get financial metrics (either specified or latest)
    let financialMetricsQuery = supabase
      .from('financial_metrics')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (financialMetricsId) {
      financialMetricsQuery = supabase
        .from('financial_metrics')
        .select('*')
        .eq('id', financialMetricsId)
        .eq('company_id', companyId)
        .single();
    }

    const { data: financialMetrics, error: metricsError } = await financialMetricsQuery;

    if (metricsError) {
      console.error('❌ Error fetching financial metrics:', metricsError);
      return NextResponse.json(
        { error: 'No financial metrics found for this company. Please upload financial documents first.' },
        { status: 400 }
      );
    }

    // Get future goals (either specified or latest)
    let futureGoalsQuery = supabase
      .from('future_goals')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (futureGoalsId) {
      futureGoalsQuery = supabase
        .from('future_goals')
        .select('*')
        .eq('id', futureGoalsId)
        .eq('company_id', companyId)
        .single();
    }

    const { data: futureGoals, error: goalsError } = await futureGoalsQuery;

    if (goalsError && futureGoalsId) {
      console.error('❌ Error fetching specified future goals:', goalsError);
      return NextResponse.json(
        { error: 'Specified future goals not found' },
        { status: 400 }
      );
    }

    // Generate funding recommendations
    console.log('🧠 Generating funding recommendations...');
    try {
      const recommendations = await generateFundingRecommendations(
        financialMetrics,
        futureGoals || null,
        companyId
      );

      // Return success
      console.log('✅ Successfully generated funding recommendations');
      return NextResponse.json({
        data: recommendations,
        message: 'Funding recommendations generated successfully'
      }, { status: 201 });
    } catch (error) {
      console.error('❌ Error generating funding recommendations:', error);
      return NextResponse.json(
        { error: 'Failed to generate funding recommendations' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 