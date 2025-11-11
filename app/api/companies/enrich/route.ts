import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createCompanyEnrichment } from '@/lib/company-enrichment';

/**
 * POST /api/companies/enrich
 * 
 * Enriches company data using YTJ + Gemini AI with Google Search
 * 
 * Body:
 * - businessId: Y-tunnus (required)
 * - companyName: Company name (optional, improves search)
 * - country: Country code (default: FI)
 * - industry: Industry hint (optional)
 * - website: Website URL (optional)
 * - locale: Language (fi, sv, en - default: fi)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('\n🔍 [Company Enrichment API] Starting...');

    // 1. Authenticate
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request
    const { businessId, companyName, country, industry, website, locale } = await request.json();

    if (!businessId) {
      return NextResponse.json(
        { error: 'Missing required field: businessId' },
        { status: 400 }
      );
    }

    // Validate Finnish business ID format
    if (country === 'FI' || !country) {
      if (!/^\d{7}-\d$/.test(businessId)) {
        return NextResponse.json(
          { 
            error: 'Invalid Finnish business ID format',
            hint: 'Format should be: 1234567-8'
          },
          { status: 400 }
        );
      }
    }

    console.log(`📊 [Enrichment] Company: ${companyName || 'N/A'}`);
    console.log(`📊 [Enrichment] Business ID: ${businessId}`);
    console.log(`📊 [Enrichment] Country: ${country || 'FI'}`);

    // 3. Enrich company data
    const enrichment = createCompanyEnrichment(locale || 'fi');
    
    const enrichedData = await enrichment.enrichCompany(
      businessId,
      companyName || `Company ${businessId}`,
      {
        country: country || 'FI',
        industry,
        website,
      }
    );

    console.log(`✅ [Enrichment] Success! Confidence: ${enrichedData.confidence}%`);

    // 4. Verify YTJ data for Finnish companies
    if (country === 'FI' || !country) {
      try {
        const ytjResponse = await fetch(
          `${request.nextUrl.origin}/api/ytj/search?businessId=${businessId}`,
          {
            headers: {
              'Authorization': request.headers.get('Authorization') || '',
            },
          }
        );

        if (ytjResponse.ok) {
          const ytjData = await ytjResponse.json();
          if (ytjData.success && ytjData.data && ytjData.data.length > 0) {
            const ytjCompany = ytjData.data[0];
            
            // Mark as YTJ-verified and merge official data
            enrichedData.basicInfo.dataQuality.verified = true;
            enrichedData.basicInfo.name = ytjCompany.name || enrichedData.basicInfo.name;
            enrichedData.basicInfo.companyForm = ytjCompany.companyForm || enrichedData.basicInfo.companyForm;
            enrichedData.basicInfo.registrationDate = ytjCompany.registrationDate || enrichedData.basicInfo.registrationDate;
            enrichedData.basicInfo.address = ytjCompany.address?.street 
              ? `${ytjCompany.address.street}, ${ytjCompany.address.postCode} ${ytjCompany.address.city}`
              : enrichedData.basicInfo.address;

            console.log(`✅ [YTJ] Verified and merged official data`);
          }
        }
      } catch (ytjError) {
        console.warn('⚠️ [YTJ] Verification failed:', ytjError);
        // Continue without YTJ verification - not critical
      }
    }

    // 5. Return enriched data with warnings
    const response = {
      success: true,
      data: enrichedData,
      warnings: [],
      metadata: {
        enrichedAt: enrichedData.extractedAt,
        dataQuality: enrichedData.basicInfo.dataQuality,
        financialYears: enrichedData.financialData.yearsFound,
        confidence: enrichedData.confidence,
      },
    };

    // Add warnings based on data quality
    if (enrichedData.basicInfo.dataQuality.needsVerification) {
      response.warnings.push({
        type: 'NEEDS_VERIFICATION',
        message: 'Some data fields require user verification',
        fields: enrichedData.basicInfo.dataQuality.missingFields,
      });
    }

    if (enrichedData.basicInfo.dataQuality.aiGenerated) {
      response.warnings.push({
        type: 'AI_GENERATED',
        message: 'Some data was AI-generated and should be verified',
      });
    }

    if (enrichedData.financialData.yearsFound === 0) {
      response.warnings.push({
        type: 'NO_FINANCIAL_DATA',
        message: 'No financial data found from public sources',
      });
    }

    if (enrichedData.confidence < 50) {
      response.warnings.push({
        type: 'LOW_CONFIDENCE',
        message: 'Data quality is low - manual verification strongly recommended',
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ [Company Enrichment API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to enrich company data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/companies/enrich?businessId=1234567-8
 * 
 * Check if enrichment is available for a company
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        { error: 'Missing businessId parameter' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      available: true,
      sources: {
        basicInfo: ['YTJ Registry', 'Google Search', 'Company websites'],
        financialData: ['Finder.fi', 'Asiakastieto.fi', 'Kauppalehti.fi'],
      },
      features: {
        ytjVerification: true,
        aiEnrichment: true,
        multiYearFinancials: true,
        dataQualityIndicators: true,
      },
      note: 'Enrichment combines official YTJ data with AI-powered public source analysis',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check enrichment availability' },
      { status: 500 }
    );
  }
}

