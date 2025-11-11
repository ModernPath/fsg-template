import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * YTJ API Integration - Finnish Business Registry
 * 
 * API URL: https://avoindata.prh.fi/opendata-ytj-api/v3
 * 
 * Returns:
 * - Company name, business ID
 * - Company form (Oy, Oyj, etc.)
 * - Registration date, address
 * - Industry classification
 * - Company status
 * 
 * Note: YTJ does NOT provide financial statements - only registry information
 */

const YTJ_API_BASE_URL = 'https://avoindata.prh.fi/bis/v1';

interface YTJCompanyData {
  businessId: string;
  name: string;
  companyForm?: string;
  registrationDate?: string;
  address?: {
    street?: string;
    postCode?: string;
    city?: string;
    country?: string;
  };
  industry?: string;
  status?: string;
  businessLine?: string;
}

/**
 * Search companies by name or business ID
 * GET /api/ytj/search?q=yritys+nimi or ?businessId=1234567-8
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const businessId = searchParams.get('businessId');

    if (!query && !businessId) {
      return NextResponse.json(
        { error: 'Missing query parameter: q or businessId' },
        { status: 400 }
      );
    }

    // Authenticate request
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let ytjUrl: string;

    if (businessId) {
      // Search by business ID
      ytjUrl = `${YTJ_API_BASE_URL}/${encodeURIComponent(businessId)}`;
    } else {
      // Search by name
      ytjUrl = `${YTJ_API_BASE_URL}?totalResults=true&maxResults=10&name=${encodeURIComponent(query!)}`;
    }

    console.log(`🔍 [YTJ] Fetching: ${ytjUrl}`);

    const response = await fetch(ytjUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'BizExit-Platform/1.0',
      },
    });

    if (!response.ok) {
      console.error(`❌ [YTJ] Error: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `YTJ API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transform YTJ data to our format
    let companies: YTJCompanyData[] = [];

    if (businessId && data.results && data.results.length > 0) {
      // Single company result
      const company = data.results[0];
      companies = [transformYTJCompany(company)];
    } else if (data.results) {
      // Multiple company results
      companies = data.results.map(transformYTJCompany);
    }

    console.log(`✅ [YTJ] Found ${companies.length} companies`);

    return NextResponse.json({
      success: true,
      data: companies,
      totalResults: data.totalResults || companies.length,
    });
  } catch (error) {
    console.error('❌ [YTJ] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch company data from YTJ',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Transform YTJ API response to our format
 */
function transformYTJCompany(company: any): YTJCompanyData {
  const address = company.addresses?.find((addr: any) => addr.type === 1) || {};

  return {
    businessId: company.businessId || '',
    name: company.name || '',
    companyForm: company.companyForm || '',
    registrationDate: company.registrationDate || '',
    address: {
      street: address.street || '',
      postCode: address.postCode || '',
      city: address.city || '',
      country: address.country || 'FI',
    },
    industry: company.businessLines?.[0]?.name || '',
    status: company.registrationStatus || '',
    businessLine: company.businessLines?.[0]?.name || '',
  };
}

/**
 * POST endpoint to enrich existing company data with YTJ information
 * POST /api/ytj/search with { businessId, companyData }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { businessId, companyData } = await request.json();

    if (!businessId) {
      return NextResponse.json({ error: 'Missing businessId' }, { status: 400 });
    }

    // Fetch YTJ data
    const ytjUrl = `${YTJ_API_BASE_URL}/${encodeURIComponent(businessId)}`;
    console.log(`🔍 [YTJ] Fetching company data: ${ytjUrl}`);

    const response = await fetch(ytjUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'BizExit-Platform/1.0',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `YTJ API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return NextResponse.json(
        { error: 'Company not found in YTJ registry' },
        { status: 404 }
      );
    }

    const ytjCompany = transformYTJCompany(data.results[0]);

    // Merge with existing company data (YTJ data takes priority for registry fields)
    const enrichedData = {
      ...companyData,
      name: ytjCompany.name || companyData?.name,
      business_id: ytjCompany.businessId,
      company_form: ytjCompany.companyForm || companyData?.company_form,
      registration_date: ytjCompany.registrationDate || companyData?.registration_date,
      address: ytjCompany.address?.street || companyData?.address,
      city: ytjCompany.address?.city || companyData?.city,
      postal_code: ytjCompany.address?.postCode || companyData?.postal_code,
      country: ytjCompany.address?.country || companyData?.country || 'FI',
      industry: ytjCompany.industry || companyData?.industry,
      status: ytjCompany.status || companyData?.status,
      ytj_verified: true,
      ytj_verification_date: new Date().toISOString(),
    };

    console.log(`✅ [YTJ] Successfully enriched company data`);

    return NextResponse.json({
      success: true,
      data: enrichedData,
      ytjData: ytjCompany,
    });
  } catch (error) {
    console.error('❌ [YTJ] POST error:', error);
    return NextResponse.json(
      {
        error: 'Failed to enrich company data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

