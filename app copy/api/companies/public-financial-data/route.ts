import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * Fetch public financial data for a company
 * GET /api/companies/public-financial-data?businessId=1234567-8
 */
export async function GET(request: Request) {
  try {
    // Get params
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      );
    }

    console.log('📊 Fetching public financial data for business ID:', businessId);
    
    // Get authorization header
    const authHeader = request.headers.get('Authorization');
    console.log('📊 Authorization header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid authorization header');
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    console.log('📊 Using token:', token.substring(0, 10) + '...');

    // Create Supabase client
    const supabase = await createClient(undefined, true);

    // Verify authentication with the provided token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('❌ Authentication error:', authError);
      return NextResponse.json(
        { error: 'Authentication failed', details: authError?.message },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', user.id);

    // First check if we already have financial data for this company in the database
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, metadata, name')
      .eq('business_id', businessId)
      .single();

    if (companyError) {
      console.error('❌ Error fetching company:', companyError);
      return NextResponse.json(
        { error: 'Failed to fetch company data', details: companyError.message },
        { status: 500 }
      );
    }

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Check if company has financial data in metadata
    if (company.metadata?.financial_data?.yearly && Array.isArray(company.metadata.financial_data.yearly) && company.metadata.financial_data.yearly.length > 0) {
      console.log('📊 Using real financial data from company metadata');
      
      // Map the data to the expected format
      const years = company.metadata.financial_data.yearly.map((yearData: any) => ({
        year: parseInt(yearData.year),
        revenue: parseFloat(yearData.revenue) || 0,
        operatingProfit: parseFloat(yearData.profit) || 0,
        netIncome: parseFloat(yearData.profit) * 0.8 || 0, // Estimate net income as 80% of profit
        totalAssets: yearData.assets ? parseFloat(yearData.assets) : parseFloat(yearData.revenue) * 0.8, // Use assets if available or estimate
        operatingCashFlow: parseFloat(yearData.profit) || 0, // Use profit as cash flow
        employeeCount: company.metadata?.enriched_data?.personnel?.count || 0
      }));

      return NextResponse.json({
        success: true,
        data: {
          businessId,
          companyName: company.name,
          years: years,
          dataSource: 'Company Registry Data'
        }
      });
    }

    console.log('⚠️ No financial data found in company metadata, generating placeholder data');

    // As a fallback, generate very minimal placeholder data (but clearly marked as estimates)
    // This code will only run if we have NO financial data in the company metadata
    const currentYear = new Date().getFullYear();
    const mockYears = [];

    for (let i = 0; i < 3; i++) {
      const year = currentYear - i;      
      mockYears.push({
        year,
        revenue: null,
        operatingProfit: null,
        netIncome: null,
        totalAssets: null,
        operatingCashFlow: null,
        employeeCount: null,
        isEstimate: true
      });
    }

    console.log('📊 Generated placeholder financial data - CLEARLY MARKED AS ESTIMATES');

    return NextResponse.json({
      success: true,
      data: {
        businessId,
        companyName: company.name,
        years: mockYears,
        dataSource: 'Placeholder Data - No Real Financial Information Available',
        warning: 'This is placeholder data. No real financial information is available.'
      }
    });
  } catch (error) {
    console.error('❌ Error fetching public financial data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch financial data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 