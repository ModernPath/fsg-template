/**
 * 🚀 FAST Company Creation API
 * 
 * Progressive Enrichment Architecture:
 * 1. Save company with basic info (2-5s) → INSTANT response
 * 2. Start background enrichment job (Inngest)
 * 3. Frontend updates automatically (Supabase Realtime)
 * 
 * This replaces the slow /api/companies/create endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { inngest } from '@/lib/inngest-client';

// YTJ API types
interface YTJData {
  name?: string;
  businessId?: string;
  registrationDate?: string;
  companyForm?: string;
  status?: string;
  mainBusinessLine?: string;
  address?: string;
  city?: string;
  postCode?: string;
  website?: string;
}

/**
 * Fetch basic company info from YTJ (Business Information System)
 * This is fast (2-5s) and provides essential company details
 */
async function fetchYTJData(businessId: string): Promise<YTJData | null> {
  try {
    console.log(`📋 [YTJ] Fetching data for: ${businessId}`);
    
    const url = `https://avoindata.prh.fi/bis/v1/${businessId}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!response.ok) {
      console.error(`❌ [YTJ] HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();
    const results = data.results?.[0];
    
    if (!results) {
      console.error('❌ [YTJ] No results found');
      return null;
    }

    // Extract basic info
    const ytjData: YTJData = {
      name: results.name,
      businessId: results.businessId,
      registrationDate: results.registrationDate,
      companyForm: results.companyForm,
      status: results.registrationStatus,
      mainBusinessLine: results.businessLines?.[0]?.name,
    };

    // Extract address
    const addresses = results.addresses || [];
    const mainAddress = addresses.find((a: any) => a.careOf === null) || addresses[0];
    if (mainAddress) {
      ytjData.address = mainAddress.street;
      ytjData.city = mainAddress.city;
      ytjData.postCode = mainAddress.postCode;
    }

    // Extract website
    const contactDetails = results.contactDetails || [];
    const websiteContact = contactDetails.find((c: any) => c.type === 'Kotisivun www-osoite');
    if (websiteContact) {
      ytjData.website = websiteContact.value;
    }

    console.log('✅ [YTJ] Data fetched successfully');
    return ytjData;
    
  } catch (error) {
    console.error('❌ [YTJ] Error:', error);
    return null;
  }
}

/**
 * POST /api/companies/create-fast
 * 
 * Creates a company with basic info and starts background enrichment
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('\n🚀 [Create Fast] ====== START ======');
    console.log('Timestamp:', new Date().toISOString());
    
    // 1. AUTHENTICATION
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ [Create Fast] Missing or invalid Authorization header');
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    console.log('🔑 [Create Fast] Authenticating...');

    const supabase = await createClient(undefined, true); // Service role
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('❌ [Create Fast] Authentication failed:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('✅ [Create Fast] User authenticated:', user.id);

    // 2. PARSE REQUEST
    const body = await request.json();
    const { name, business_id, country_code, locale } = body;

    console.log('📝 [Create Fast] Request data:', {
      name,
      business_id,
      country_code: country_code || 'FI',
      locale: locale || 'en',
    });

    // Validate required fields
    if (!name || !business_id) {
      console.error('❌ [Create Fast] Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: name, business_id' },
        { status: 400 }
      );
    }

    // 3. FETCH YTJ BASIC INFO (Fast - 2-5s)
    console.log('\n📋 [Create Fast] Fetching YTJ basic info...');
    const ytjData = await fetchYTJData(business_id);
    
    if (ytjData) {
      console.log('✅ [Create Fast] YTJ data fetched:', {
        companyForm: ytjData.companyForm,
        status: ytjData.status,
        city: ytjData.city,
      });
    } else {
      console.log('⚠️ [Create Fast] No YTJ data - proceeding with manual data');
    }

    // 4. SAVE COMPANY IMMEDIATELY (enrichment_status: 'pending')
    console.log('\n💾 [Create Fast] Saving company to database...');
    
    const companyData = {
      name: ytjData?.name || name,
      business_id,
      country_code: country_code || 'FI',
      type: ytjData?.companyForm,
      industry: ytjData?.mainBusinessLine,
      website: ytjData?.website,
      address: ytjData?.address ? {
        street: ytjData.address,
        city: ytjData.city,
        postCode: ytjData.postCode,
      } : null,
      created_by: user.id,
      enrichment_status: 'pending', // 🔑 KEY: Will be enriched in background
    };

    const { data: company, error: insertError } = await supabase
      .from('companies')
      .insert(companyData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ [Create Fast] Database error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create company', details: insertError.message },
        { status: 500 }
      );
    }

    console.log('✅ [Create Fast] Company saved:', company.id);

    // 5. START BACKGROUND ENRICHMENT JOB
    console.log('\n🔄 [Create Fast] Starting background enrichment job...');

    try {
      await inngest.send({
        name: 'company/enrich.financial-data',
        data: {
          companyId: company.id,
          businessId: business_id,
          companyName: ytjData?.name || name,
          countryCode: country_code || 'FI',
          industry: ytjData?.mainBusinessLine || company.industry,
          employees: null, // We don't have employee count from YTJ
        },
      });
      console.log('✅ [Create Fast] Enrichment job queued');
    } catch (inngestError) {
      console.error('⚠️ [Create Fast] Failed to queue enrichment job:', inngestError);
      // Don't fail the request - enrichment can be retried later
    }

    // 6. RETURN FAST RESPONSE
    const responseTime = Date.now() - startTime;
    console.log(`\n✅ [Create Fast] ====== COMPLETE (${responseTime}ms) ======\n`);

    return NextResponse.json({
      success: true,
      company: {
        id: company.id,
        name: company.name,
        business_id: company.business_id,
        country_code: company.country_code,
        industry: company.industry,
        enrichment_status: 'pending',
      },
      message: 'Company created successfully. Financial data will be loaded in the background.',
      enrichment: {
        status: 'queued',
        estimated_time: '30-60 seconds',
        update_method: 'realtime', // Frontend should use Supabase Realtime
      },
      performance: {
        response_time_ms: responseTime,
        ytj_data_available: !!ytjData,
      },
    }, {
      status: 201,
      headers: {
        'X-Response-Time': `${responseTime}ms`,
      },
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('\n❌ [Create Fast] ====== ERROR ======');
    console.error('Error:', error);
    console.error(`Response time: ${responseTime}ms\n`);

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/companies/create-fast
 * Returns API documentation
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/companies/create-fast',
    method: 'POST',
    description: 'Fast company creation with progressive financial data enrichment',
    architecture: {
      step1: 'Save company with basic info (2-5s)',
      step2: 'Start background enrichment job (Inngest)',
      step3: 'Frontend updates automatically (Supabase Realtime)',
    },
    request: {
      headers: {
        Authorization: 'Bearer <token>',
        'Content-Type': 'application/json',
      },
      body: {
        name: 'Company name (required)',
        business_id: 'Business ID (required)',
        country_code: 'Country code (optional, default: FI)',
        locale: 'Locale (optional, default: en)',
      },
    },
    response: {
      success: true,
      company: {
        id: 'UUID',
        enrichment_status: 'pending | enriching | enriched | failed',
      },
      enrichment: {
        status: 'queued',
        estimated_time: '30-60 seconds',
      },
    },
    realtime_updates: {
      channel: 'company-{id}',
      events: ['UPDATE on companies table', 'INSERT on company_metrics table'],
    },
  });
}

