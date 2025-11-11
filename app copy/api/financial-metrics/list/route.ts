import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * List financial metrics for a company
 * GET /api/financial-metrics/list?companyId=uuid
 * Optional parameters:
 * - fiscalYear: Filter by fiscal year
 * - limit: Limit the number of results (default: 10)
 * - order: Order by field (default: fiscal_year)
 * - direction: asc or desc (default: desc)
 */
export async function GET(request: Request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const fiscalYear = searchParams.get('fiscalYear');
    const limit = searchParams.get('limit') || '10';
    const order = searchParams.get('order') || 'fiscal_year';
    const direction = searchParams.get('direction') || 'desc';

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    console.log('📊 Fetching financial metrics for company:', companyId);

    // --- Verify authentication first with regular client ---
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid Authorization header');
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }
    const token = authHeader.split(' ')[1];

    // Create auth client for user verification
    const authClient = await createClient(false);
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      console.error('❌ Authentication error with provided token:', authError);
      return NextResponse.json(
        { error: 'Authentication required or token invalid' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', user.id);

    // Verify user has access to this company
    const { data: userCompany, error: accessError } = await authClient
      .from('user_companies')
      .select('company_id')
      .eq('user_id', user.id)
      .eq('company_id', companyId)
      .maybeSingle();

    if (accessError) {
      console.error('❌ Error checking user company access:', accessError);
      return NextResponse.json(
        { error: 'Failed to verify company access' },
        { status: 500 }
      );
    }

    if (!userCompany) {
      console.error('❌ User does not have access to this company');
      return NextResponse.json(
        { error: 'Access denied to this company' },
        { status: 403 }
      );
    }

    // Now use service role client to bypass RLS for the actual query
    const supabase = await createClient(undefined, true);
    console.log('🔑 Using service role client to bypass RLS');
    
    // // Original authentication check (commented out)
    // const { data: { user } } = await supabase.auth.getUser();
    // if (!user) {
    //   return NextResponse.json(
    //     { error: 'Authentication required' },
    //     { status: 401 }
    //   );
    // }

    // First try company_metrics (new table with extended metrics)
    let queryCompanyMetrics = supabase
      .from('company_metrics')
      .select(`
        *,
        year as fiscal_year,
        revenue_growth_pct,
        operating_profit,
        operating_profit_pct,
        gross_margin,
        gross_margin_pct,
        equity_ratio_pct,
        quick_ratio,
        current_ratio,
        debt_ratio_pct,
        return_on_equity_pct,
        return_on_assets_pct,
        fiscal_period_months
      `)
      .eq('company_id', companyId)
      .order('year', { ascending: direction === 'asc' });
    
    // If no specific fiscal year requested, limit to 3 most recent years
    const effectiveLimit = fiscalYear ? parseInt(limit) : Math.min(parseInt(limit), 3);
    queryCompanyMetrics = queryCompanyMetrics.limit(effectiveLimit);

    // Add fiscal year filter if provided
    if (fiscalYear) {
      queryCompanyMetrics = queryCompanyMetrics.eq('year', parseInt(fiscalYear));
    }

    // Execute query on company_metrics
    const { data: companyMetricsData, error: companyMetricsError } = await queryCompanyMetrics;

    // If company_metrics has data, use it (it has all extended fields)
    if (!companyMetricsError && companyMetricsData && companyMetricsData.length > 0) {
      console.log(`✅ Found ${companyMetricsData.length} records in company_metrics (extended data)`);
      return NextResponse.json({
        success: true,
        data: companyMetricsData,
        source: 'company_metrics'
      });
    }

    // Fallback to financial_metrics (old table) if company_metrics is empty
    console.log('ℹ️ No data in company_metrics, falling back to financial_metrics');
    
    let queryFinancialMetrics = supabase
      .from('financial_metrics')
      .select('*')
      .eq('company_id', companyId)
      .order(order, { ascending: direction === 'asc' })
      .limit(effectiveLimit);

    if (fiscalYear) {
      queryFinancialMetrics = queryFinancialMetrics.eq('fiscal_year', parseInt(fiscalYear));
    }

    // Execute fallback query
    const { data, error } = await queryFinancialMetrics;

    if (error) {
      console.error('❌ Error fetching financial metrics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch financial metrics' },
        { status: 500 }
      );
    }

    // Return financial metrics
    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('❌ Error fetching financial metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 