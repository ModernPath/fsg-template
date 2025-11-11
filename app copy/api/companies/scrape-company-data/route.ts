import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createGoogleCustomSearch } from '@/lib/financial-search/google-custom-search';
import { createGeminiGrounding } from '@/lib/financial-search/gemini-grounding';
import { createFinancialDataValidator } from '@/lib/financial-search/validation';

/**
 * Modern Company Data API (Google-Powered)
 * POST /api/companies/scrape-company-data
 * 
 * Replaces old web scraping with reliable Google-powered search
 * 
 * Supports:
 * - businessId (Finnish Business ID)
 * - companyName
 * - method: 'google' (Custom Search) | 'gemini' (Grounding) | 'auto' (try both)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('\n🚀 [Google-Powered Company Data API] Starting...');

    // 1. Parse request
    const body = await request.json();
    const { businessId, companyName, method = 'auto' } = body;
    
    if (!businessId && !companyName) {
      return NextResponse.json(
        { error: 'Either businessId or companyName is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Request: businessId="${businessId}", companyName="${companyName}", method="${method}"`);

    // 2. Authentication (optional in development, required in production)
    const authHeader = request.headers.get('Authorization');
    let user = null;
    
    if (process.env.NODE_ENV === 'production' && (!authHeader || !authHeader.startsWith('Bearer '))) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const supabase = await createClient();
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
        if (!authError && authUser) {
          user = authUser;
          console.log(`✅ Authenticated user: ${user.id}`);
        }
      } catch (authError) {
        console.log('⚠️ Authentication failed, continuing without user');
      }
    }

    // 3. Validate inputs
    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required. Company name search coming soon.' },
        { status: 400 }
      );
    }

    if (!companyName && businessId) {
      // Try to infer company name from business ID via YTJ (future enhancement)
      return NextResponse.json(
        { error: 'Company name is required in addition to business ID.' },
        { status: 400 }
      );
    }

    // 4. Execute search based on method
    let result = null;
    let searchMethod = '';
    let responseTime = 0;

    const startTime = Date.now();

    if (method === 'google' || method === 'auto') {
      console.log('🔍 [Google Custom Search] Starting...');
      try {
        const search = createGoogleCustomSearch();
        result = await search.searchFinancialData(businessId, companyName);
        searchMethod = 'google_custom_search';
        responseTime = Date.now() - startTime;
        console.log(`✅ [Google] Completed in ${responseTime}ms`);
      } catch (error) {
        console.error('❌ [Google] Failed:', error);
        if (method === 'google') {
          return NextResponse.json({
            success: false,
            error: 'Google Custom Search failed',
            details: error instanceof Error ? error.message : 'Unknown error'
          }, { status: 500 });
        }
      }
    }

    // Fallback to Gemini if Google failed or method is gemini/auto
    if ((!result || Object.keys(result).length === 0) && (method === 'gemini' || method === 'auto')) {
      console.log('🔍 [Gemini Grounding] Starting...');
      const geminiStart = Date.now();
      try {
        const grounding = createGeminiGrounding();
        result = await grounding.searchFinancialData(businessId, companyName);
        searchMethod = 'gemini_grounding';
        responseTime = Date.now() - geminiStart;
        console.log(`✅ [Gemini] Completed in ${responseTime}ms`);
      } catch (error) {
        console.error('❌ [Gemini] Failed:', error);
        return NextResponse.json({
          success: false,
          error: 'Both Google and Gemini search failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    }

    if (!result || Object.keys(result).length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No financial data found from available sources',
        data: null,
        attemptedMethods: [method]
      });
    }

    // 5. Validate results
    const validator = createFinancialDataValidator();
    const validation = validator.validate(result);

    console.log(`📊 Validation: ${validation.isValid ? 'VALID' : 'INVALID'} (${validation.confidence}% confidence)`);

    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        message: 'Financial data validation failed',
        validation: {
          errors: validation.errors,
          warnings: validation.warnings,
          confidence: validation.confidence
        },
        rawData: result
      }, { status: 422 });
    }

    // 6. Format response
    const formattedData = {
      businessId,
      companyName,
      financials: [{
        year: result.revenue?.year || result.operating_profit?.year || new Date().getFullYear() - 1,
        revenue: result.revenue?.value || null,
        operating_profit: result.operating_profit?.value || null,
        net_profit: result.net_profit?.value || null,
        total_assets: result.total_assets?.value || null,
        equity: result.equity?.value || null,
        total_liabilities: result.total_liabilities?.value || null,
      }],
      personnel: {
        count: result.employees?.value || null
      },
      sources: result.sourcesFound || [],
      confidence: validation.confidence,
      searchQueries: result.searchQueriesUsed || []
    };

    console.log('✅ Successfully retrieved company data');
    console.log(`📊 Data summary: Revenue: ${formattedData.financials[0].revenue}, Confidence: ${validation.confidence}%`);

    return NextResponse.json({
      success: true,
      message: 'Company data retrieved successfully',
      data: formattedData,
      metadata: {
        businessId,
        companyName,
        method: searchMethod,
        responseTime: `${responseTime}ms`,
        confidence: validation.confidence,
        sources: result.sourcesFound || [],
        lastUpdated: new Date().toISOString()
      },
      validation: {
        errors: validation.errors,
        warnings: validation.warnings,
        isValid: validation.isValid
      }
    });

  } catch (error) {
    console.error('❌ Error in company data API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve company data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check API availability and supported features
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get('businessId');
  
  return NextResponse.json({
    available: true,
    version: '2.0',
    architecture: 'Google-powered',
    methods: [
      {
        name: 'google_custom_search',
        description: 'Fast, reliable data from trusted Finnish sources',
        avgResponseTime: '3s',
        accuracy: 'HIGH',
        costPerSearch: '$0.005'
      },
      {
        name: 'gemini_grounding',
        description: 'AI-powered Google Search with zero creativity',
        avgResponseTime: '5s',
        accuracy: 'MEDIUM-HIGH',
        costPerSearch: '$0.01'
      }
    ],
    features: [
      'Real-time financial data',
      'Source transparency',
      'Confidence scoring',
      'Automatic validation',
      'AI learning system'
    ],
    supportedCountries: ['FI'], // Finland only for now
    supportedSearchTypes: ['businessId + companyName'],
    limitations: [
      'Business ID required',
      'Company name required',
      'Finnish companies only (for now)'
    ]
  });
}
