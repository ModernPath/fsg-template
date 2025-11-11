import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { NextRequest } from 'next/server';

/**
 * GET /api/financial-metrics/company/[companyId]
 * Retrieves financial metrics for a specific company
 * Optional query parameters:
 * - fiscal_year: Filter by fiscal year
 * - limit: Number of metrics to return (default: 10)
 * - order: Order by field (default: fiscal_year)
 * - direction: Order direction 'asc' or 'desc' (default: 'desc')
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params;

  try {
    // Log request details
    console.log('\n📝 [GET /api/financial-metrics/company]', {
      companyId: companyId,
      url: request.url
    });

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const fiscalYear = searchParams.get('fiscal_year');
    const limit = searchParams.get('limit') || '10';
    const order = searchParams.get('order') || 'fiscal_year';
    const direction = searchParams.get('direction') || 'desc';

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
    const authClient = await createClient();
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
    const supabase = await createClient(undefined, true);

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

    // Build the query - default to 3 most recent years unless specific fiscal year requested
    let query = supabase
      .from('financial_metrics')
      .select(`
        *,
        funding_recommendations:funding_recommendations(
          id,
          optimal_funding_types,
          funding_justification,
          risk_mitigation_measures,
          liquidity_optimization_recommendations,
          confidence_score,
          model_version,
          created_at
        )
      `)
      .eq('company_id', companyId)
      .order(order, { ascending: direction === 'asc' });
    
    // If no specific fiscal year requested, limit to 3 most recent years
    const effectiveLimit = fiscalYear ? parseInt(limit) : Math.min(parseInt(limit), 3);
    query = query.limit(effectiveLimit);

    // Add fiscal year filter if provided
    if (fiscalYear) {
      query = query.eq('fiscal_year', parseInt(fiscalYear));
    }

    // Execute the query
    console.log('📊 Fetching financial metrics...');
    const { data, error } = await query;

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch financial metrics' },
        { status: 500 }
      );
    }

    // Return the results
    console.log('✅ Successfully fetched financial metrics');
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