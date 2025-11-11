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
 * GET handler for retrieving financial metrics history
 * Returns a chronological history of financial metrics for trend analysis
 */
export async function GET(request: Request) {
  try {
    // Log request details
    console.log('\n📝 [GET /api/financial/history]', {
      url: request.url
    });

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    // Optional parameters for filtering
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;
    const startYear = searchParams.get('startYear') ? parseInt(searchParams.get('startYear')!) : undefined;
    const endYear = searchParams.get('endYear') ? parseInt(searchParams.get('endYear')!) : undefined;
    const metrics = searchParams.get('metrics') ? searchParams.get('metrics')!.split(',') : undefined;
    
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

    // Build query for financial metrics history
    console.log('📊 Fetching financial metrics history...');
    let query = supabase
      .from('financial_metrics')
      .select('*')
      .eq('company_id', companyId)
      .order('fiscal_year', { ascending: false }) // Get latest years first
      .order('created_at', { ascending: false }); // Latest records first
    
    // Apply filters if provided, otherwise default to 3 most recent years
    if (startYear !== undefined) {
      query = query.gte('fiscal_year', startYear);
    }
    
    if (endYear !== undefined) {
      query = query.lte('fiscal_year', endYear);
    }
    
    // If no year filters provided, limit to 3 most recent years
    const effectiveLimit = (startYear !== undefined || endYear !== undefined) ? limit : Math.min(limit, 3);
    
    // Fetch data with limit
    const { data: financialMetricsHistory, error: historyError } = await query.limit(effectiveLimit);
    
    if (historyError) {
      console.error('❌ Error fetching financial metrics history:', historyError);
      return NextResponse.json(
        { error: 'Failed to fetch financial metrics history' },
        { status: 500 }
      );
    }

    if (!financialMetricsHistory || financialMetricsHistory.length === 0) {
      return NextResponse.json({
        message: 'No financial metrics history found for this company',
        data: []
      });
    }

    // Process the data for trend analysis
    const processedData = financialMetricsHistory.map(metrics => {
      const result: any = {
        id: metrics.id,
        fiscal_year: metrics.fiscal_year,
        fiscal_period: metrics.fiscal_period,
        created_at: metrics.created_at
      };
      
      // Only include requested metrics if specified
      if (metrics) {
        const metricsToInclude = new Set(metrics);
        Object.keys(metrics).forEach(key => {
          if (!metricsToInclude.has(key) && 
              key !== 'id' && 
              key !== 'fiscal_year' && 
              key !== 'fiscal_period' && 
              key !== 'created_at') {
            result[key] = metrics[key as keyof typeof metrics];
          }
        });
      } else {
        // Include all metrics
        Object.keys(metrics).forEach(key => {
          if (key !== 'company_id' && 
              key !== 'created_by' && 
              key !== 'updated_at' && 
              key !== 'source_document_ids') {
            result[key] = metrics[key as keyof typeof metrics];
          }
        });
      }
      
      return result;
    });

    // Calculate trend indicators for key metrics
    const trendsData = calculateTrends(processedData);

    // Return the historical data with trends
    console.log('✅ Successfully fetched financial metrics history');
    return NextResponse.json({
      data: processedData,
      trends: trendsData
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
 * Calculate trends for key metrics across time periods
 * @param data - The processed financial metrics data
 * @returns Object with trend information
 */
function calculateTrends(data: any[]) {
  if (!data || data.length < 2) {
    return {
      message: 'Insufficient data for trend analysis',
      trends: {}
    };
  }
  
  // Sort data by fiscal year to ensure chronological order
  const sortedData = [...data].sort((a, b) => a.fiscal_year - b.fiscal_year);
  
  // Key metrics to analyze
  const keyMetrics = [
    'revenue_current',
    'revenue_growth_rate',
    'operational_cash_flow',
    'return_on_equity',
    'debt_to_equity_ratio',
    'quick_ratio',
    'current_ratio'
  ];
  
  const trends: Record<string, any> = {};
  
  // Calculate trend for each key metric
  keyMetrics.forEach(metric => {
    // Filter data points that have this metric
    const metricData = sortedData
      .filter(d => d[metric] !== null && d[metric] !== undefined)
      .map(d => ({ year: d.fiscal_year, value: d[metric] }));
    
    if (metricData.length >= 2) {
      // Calculate year-over-year changes
      const changes = [];
      for (let i = 1; i < metricData.length; i++) {
        const previousValue = metricData[i-1].value;
        const currentValue = metricData[i].value;
        const percentChange = previousValue !== 0 
          ? ((currentValue - previousValue) / Math.abs(previousValue)) * 100 
          : null;
        
        changes.push({
          from: metricData[i-1].year,
          to: metricData[i].year,
          change: currentValue - previousValue,
          percentChange
        });
      }
      
      // Determine overall trend direction
      const latestChange = changes[changes.length - 1];
      const direction = latestChange.change > 0 ? 'increasing' : 
                       latestChange.change < 0 ? 'decreasing' : 'stable';
      
      // Calculate average annual change
      const totalChange = metricData[metricData.length - 1].value - metricData[0].value;
      const yearsDifference = metricData[metricData.length - 1].year - metricData[0].year;
      const averageAnnualChange = yearsDifference > 0 ? totalChange / yearsDifference : totalChange;
      
      // Determine if trend is accelerating, decelerating or stable
      let momentum = 'stable';
      if (changes.length >= 2) {
        const secondLatestPercentChange = changes[changes.length - 2].percentChange;
        const latestPercentChange = latestChange.percentChange;
        
        if (secondLatestPercentChange !== null && latestPercentChange !== null) {
          if (direction === 'increasing') {
            momentum = latestPercentChange > secondLatestPercentChange ? 'accelerating' : 'decelerating';
          } else if (direction === 'decreasing') {
            momentum = latestPercentChange < secondLatestPercentChange ? 'accelerating' : 'decelerating';
          }
        }
      }
      
      trends[metric] = {
        direction,
        momentum,
        averageAnnualChange,
        percentChange: latestChange.percentChange,
        latestValue: metricData[metricData.length - 1].value,
        changes
      };
    } else {
      trends[metric] = {
        message: 'Insufficient data points for trend analysis'
      };
    }
  });
  
  return trends;
} 