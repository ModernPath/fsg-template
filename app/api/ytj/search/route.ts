/**
 * YTJ (Finnish Business Information System) Search API
 * 
 * Searches companies from PRH open data registry
 * Based on Trusty Finance implementation
 * 
 * Endpoints:
 * - GET /api/ytj/search?q=company+name       (search by name)
 * - GET /api/ytj/search?businessId=1234567-8 (search by ID)
 */

import { NextResponse } from 'next/server';

const YTJ_API_BASE = 'https://avoindata.prh.fi/opendata-ytj-api/v3';

interface YTJCompany {
  businessId: string;
  name: string;
  registrationDate?: string;
  companyForm?: string;
  detailsUri?: string;
  addresses?: Array<{
    street?: string;
    postCode?: string;
    city?: string;
    country?: string;
    type?: string;
  }>;
  businessLines?: Array<{
    code?: string;
    name?: string;
  }>;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const businessId = searchParams.get('businessId');

  // Validate input
  if (!query && !businessId) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Anna yrityksen nimi (q) tai Y-tunnus (businessId)' 
      },
      { status: 400 }
    );
  }

  try {
    if (businessId) {
      return await searchByBusinessId(businessId);
    } else {
      return await searchByName(query!);
    }
  } catch (error) {
    console.error('❌ [YTJ API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Tuntematon virhe',
        data: [],
        totalResults: 0,
      },
      { status: 500 }
    );
  }
}

/**
 * Search company by business ID (Y-tunnus)
 */
async function searchByBusinessId(businessId: string) {
  console.log(`🔍 [YTJ] Searching by business ID: ${businessId}`);

  // Try multiple endpoint formats (YTJ API is inconsistent)
  const endpoints = [
    `${YTJ_API_BASE}/companies/${businessId}`,
    `${YTJ_API_BASE}/companies?businessId=${businessId}`,
    `${YTJ_API_BASE}/information-service/${businessId}`,
  ];

  let data: any = null;
  let lastError: string | null = null;

  for (const endpoint of endpoints) {
    try {
      console.log(`  📡 Trying: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'BizExit/1.0',
        },
      });

      if (response.ok) {
        data = await response.json();
        console.log(`  ✅ Success!`);
        break;
      }

      lastError = `HTTP ${response.status}`;
      console.log(`  ❌ Failed: ${lastError}`);
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Network error';
      console.log(`  ❌ Error: ${lastError}`);
    }
  }

  if (!data) {
    throw new Error(`YTJ API ei vastannut: ${lastError}`);
  }

  // Normalize response (might be single object or array)
  const companies = Array.isArray(data) ? data : [data];

  return NextResponse.json({
    success: true,
    data: companies.map(parseCompany),
    totalResults: companies.length,
  });
}

/**
 * Search companies by name
 * Based on Trusty Finance working implementation
 */
async function searchByName(name: string) {
  console.log(`🔍 [YTJ] Searching by name: ${name}`);

  const encodedName = encodeURIComponent(name);
  const endpoint = `${YTJ_API_BASE}/companies?name=${encodedName}&maxResults=10`;

  console.log(`  📡 Request: ${endpoint}`);

  const response = await fetch(endpoint, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'BizExit/1.0',
    },
    signal: AbortSignal.timeout(30000), // 30 second timeout
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`  ❌ YTJ API error: ${response.status} ${errorText}`);
    
    let userMessage = 'YTJ-haku epäonnistui';
    if (response.status === 429) {
      userMessage = 'Liikaa hakupyyntöjä - yritä hetken kuluttua';
    } else if (response.status >= 500) {
      userMessage = 'YTJ-palvelu ei ole käytettävissä';
    } else if (response.status === 404) {
      userMessage = 'Yritystä ei löytynyt';
    }
    
    throw new Error(userMessage);
  }

  const data = await response.json();
  
  // CRITICAL: YTJ API returns { companies: [...] }, not direct array!
  // This is why we got 0 results before
  const companyArray = data.companies && Array.isArray(data.companies) 
    ? data.companies 
    : [];

  console.log(`  ✅ Found ${companyArray.length} companies`);

  return NextResponse.json({
    success: true,
    data: companyArray.map(parseCompany),
    totalResults: companyArray.length,
  });
}

/**
 * Parse and normalize company data from YTJ API v3
 * Based on actual PRH API structure from Trusty Finance
 */
function parseCompany(raw: any): YTJCompany {
  // YTJ API v3 structure:
  // - businessId is an object: { value: "1234567-8", registrationDate: "...", source: "..." }
  // - names is array: [{ name: "Company Oy", type: "1", ... }]
  // - addresses is array: [{ street: "...", postCode: "...", ... }]
  
  const businessId = raw.businessId?.value || '';
  const name = raw.names?.[0]?.name || '';
  const registrationDate = raw.businessId?.registrationDate || raw.registrationDate || '';
  
  // Parse company form from companyForms array
  const companyForm = raw.companyForms?.[0]?.descriptions?.find(
    (d: any) => d.languageCode === '1' // Finnish
  )?.description || raw.companyForms?.[0]?.descriptions?.[0]?.description || '';

  // Parse addresses
  const addresses = (raw.addresses || []).map((addr: any) => {
    // postOffices contains city name with languageCode
    const cityObj = addr.postOffices?.find((p: any) => p.languageCode === '1') || addr.postOffices?.[0];
    
    return {
      street: addr.street || '',
      postCode: addr.postCode || '',
      city: cityObj?.city || '',
      country: 'FI',
      type: addr.type === 1 ? 'visiting' : addr.type === 2 ? 'postal' : 'business',
    };
  });

  // Parse business lines
  const businessLine = raw.mainBusinessLine || raw.businessLines?.[0];
  const businessLines = businessLine ? [{
    code: businessLine.type || businessLine.code || '',
    name: businessLine.descriptions?.find(
      (d: any) => d.languageCode === '1' // Finnish
    )?.description || businessLine.descriptions?.[0]?.description || '',
  }] : [];

  return {
    businessId,
    name,
    registrationDate,
    companyForm,
    detailsUri: raw.detailsUri || '',
    addresses,
    businessLines,
  };
}
