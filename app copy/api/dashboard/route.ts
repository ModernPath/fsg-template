import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { URL } from 'url'; // Import URL for parsing query parameters

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [GET /api/dashboard] Starting dashboard request');

    // Authenticate user with Authorization header (like other APIs)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('❌ Missing or invalid authorization header');
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    // Create authenticated client and verify token
    const authClient = await createClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser(
      authHeader.split(' ')[1]
    );
    
    if (authError || !user) {
      console.log('❌ Authentication failed in dashboard:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authenticated for dashboard:', user.email);

    // Get query parameters
    const url = new URL(request.url);
    const fetchAllMetrics = url.searchParams.get('allMetrics') === 'true';

    // Use auth client for user_companies query (RLS requires user context)
    console.log('📊 Fetching user companies for user:', user.id);
    const { data: userCompanies, error: userCompaniesError } = await authClient
      .from('user_companies')
      .select(`
        company_id,
        role,
        created_at,
        companies (
          id,
          name,
          business_id,
          industry,
          type,
          description,
          products,
          market,
          metadata,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Create service role client for other database operations
    const supabase = await createClient(undefined, true);

    if (userCompaniesError) {
      console.error('❌ Error fetching user companies:', userCompaniesError);
      console.error('❌ Error details:', JSON.stringify(userCompaniesError, null, 2));
      
      // Return more detailed error information
      return NextResponse.json({ 
        status: 500,
        message: 'Failed to fetch user companies',
        details: userCompaniesError 
      }, { status: 500 });
    }

    console.log(`📊 Found ${userCompanies?.length || 0} companies for user`);

    // If user has no companies, return basic dashboard data
    if (!userCompanies || userCompanies.length === 0) {
      console.log('ℹ️ User has no companies, returning basic dashboard');
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email
        },
        company_id: null,
        documents: [],
        metrics: [],
        recommendations: null,
        funding_applications: []
      });
    }

    // Use the first company as the active company (extract from array format)
    const primaryCompanyData = userCompanies[0];
    const primaryCompany = Array.isArray(primaryCompanyData.companies) 
      ? primaryCompanyData.companies[0] 
      : primaryCompanyData.companies;
    
    if (!primaryCompany) {
      console.log('❌ No company data found');
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email
        },
        company_id: null,
        documents: [],
        metrics: [],
        recommendations: null,
        funding_applications: []
      });
    }

    const companyId = primaryCompany.id;

    console.log(`🎯 Using primary company: ${primaryCompany.name} (${companyId})`);

    // If not requesting all metrics, return basic data
    if (!fetchAllMetrics) {
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email
        },
        company_id: companyId,
        company_name: primaryCompany.name,
        company_business_id: primaryCompany.business_id,
        metrics: {
          companies: userCompanies.length
        }
      });
    }

    // Fetch all dashboard data for the primary company
    console.log('📊 Fetching all metrics for dashboard');

    // Fetch recent documents
    const { data: documents, error: documentsError } = await supabase
      .from('documents')
      .select(`
        id,
        name,
        file_size,
        processing_status,
        processed,
        fiscal_year,
        fiscal_period,
        uploaded_at,
        mime_type,
        created_at,
        document_types:document_type_id (
          name
        )
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (documentsError) {
      console.error('❌ Error fetching documents:', documentsError);
    }

    // Fetch financial metrics (prioritize company_metrics, fallback to financial_metrics)
    console.log('📊 Fetching financial metrics for company:', companyId);
    
    // Try company_metrics first (has extended fields)
    let { data: metrics, error: metricsError } = await supabase
      .from('company_metrics')
      .select('*')
      .eq('company_id', companyId)
      .order('year', { ascending: false });

    if (metricsError) {
      console.error('❌ Error fetching company_metrics:', metricsError);
    } else if (!metrics || metrics.length === 0) {
      console.log('⚠️  No data in company_metrics, trying financial_metrics fallback');
      // Fallback to financial_metrics
      const fallbackResult = await supabase
        .from('financial_metrics')
        .select('*')
        .eq('company_id', companyId)
        .order('fiscal_year', { ascending: false });
      
      metrics = fallbackResult.data;
      
      if (fallbackResult.error) {
        console.error('❌ Error fetching financial_metrics fallback:', fallbackResult.error);
      } else {
        console.log('✅ Fallback financial metrics fetched:', {
          count: metrics?.length || 0,
          fiscalYears: metrics?.map(m => m.fiscal_year)
        });
      }
    } else {
      console.log('✅ Company metrics fetched:', {
        count: metrics?.length || 0,
        fiscalYears: metrics?.map(m => m.year),
        sampleMetric: metrics?.[0] ? {
          year: metrics[0].year,
          revenue: metrics[0].revenue,
          ebitda: metrics[0].ebitda,
          total_assets: metrics[0].total_assets,
          revenue_growth_pct: metrics[0].revenue_growth_pct,
          operating_profit: metrics[0].operating_profit,
          equity_ratio_pct: metrics[0].equity_ratio_pct
        } : null
      });
    }
    
    // Normalize field names (company_metrics uses 'year', financial_metrics uses 'fiscal_year')
    if (metrics && metrics.length > 0 && 'year' in metrics[0]) {
      metrics = metrics.map(m => ({
        ...m,
        fiscal_year: m.year, // Add fiscal_year alias for compatibility
      }));
    }

    // Fetch funding recommendations
    console.log('💡 Fetching recommendations for company:', companyId);
    const { data: recommendations, error: recommendationsError } = await supabase
      .from('funding_recommendations')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recommendationsError) {
      console.error('❌ Error fetching recommendations:', recommendationsError);
    } else {
      console.log('✅ Recommendations fetched:', {
        hasRecommendations: !!recommendations,
        recommendationCount: recommendations?.recommendation_details?.length || 0,
        created_at: recommendations?.created_at
      });
    }

    // Fetch funding applications
    console.log('📄 Fetching funding applications for company:', companyId);
    const { data: fundingApplications, error: applicationsError } = await supabase
      .from('funding_applications')
      .select(`
        *,
        lender_applications (
          *,
          financing_offers (*)
        )
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (applicationsError) {
      console.error('❌ Error fetching funding applications:', applicationsError);
    } else {
      console.log('✅ Funding applications fetched:', {
        count: fundingApplications?.length || 0,
        statuses: fundingApplications?.map(a => a.status)
      });
    }

    const dashboardData = {
      user: {
        id: user.id,
        email: user.email
      },
      company_id: companyId,
      company: {
        id: primaryCompany.id,
        name: primaryCompany.name,
        business_id: primaryCompany.business_id,
        industry: primaryCompany.industry,
        type: primaryCompany.type,
        description: primaryCompany.description,
        products: primaryCompany.products,
        market: primaryCompany.market,
        metadata: primaryCompany.metadata,
        created_at: primaryCompany.created_at
      },
      documents: documents || [],
      metrics: metrics || [],
      recommendations: recommendations,
      funding_applications: fundingApplications || [],
      user_companies: userCompanies.map(uc => {
        const company = Array.isArray(uc.companies) ? uc.companies[0] : uc.companies;
        return {
          company_id: uc.company_id,
          role: uc.role,
          company: company
        };
      })
    };

    console.log('\n✅ ========== DASHBOARD DATA SUMMARY ==========');
    console.log('📊 Company:', {
      id: companyId,
      name: primaryCompany.name,
      business_id: primaryCompany.business_id
    });
    console.log('📄 Documents:', (documents || []).length);
    console.log('💰 Financial Metrics:', (metrics || []).length, 'years');
    console.log('💡 Recommendations:', recommendations ? 'YES' : 'NO', 
      recommendations?.recommendation_details?.length || 0, 'items');
    console.log('📝 Funding Applications:', (fundingApplications || []).length);
    console.log('==========================================\n');

    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error('❌ Error in dashboard API:', error);
    console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        ...(process.env.NODE_ENV === 'development' && {
          stack: error instanceof Error ? error.stack : undefined
        })
      },
      { status: 500 }
    );
  }
} 