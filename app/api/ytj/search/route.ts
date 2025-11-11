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
 */
async function searchByName(name: string) {
  console.log(`🔍 [YTJ] Searching by name: ${name}`);

  const encodedName = encodeURIComponent(name);
  const endpoint = `${YTJ_API_BASE}/companies?name=${encodedName}`;

  console.log(`  📡 Request: ${endpoint}`);

  const response = await fetch(endpoint, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'BizExit/1.0',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`  ❌ YTJ API error: ${response.status} ${errorText}`);
    throw new Error(`YTJ API virhe: ${response.status}`);
  }

  const data = await response.json();
  
  // Parse results (format may vary)
  const companies = data.results || data.data || data || [];
  const companyArray = Array.isArray(companies) ? companies : [];

  console.log(`  ✅ Found ${companyArray.length} companies`);

  return NextResponse.json({
    success: true,
    data: companyArray.map(parseCompany),
    totalResults: companyArray.length,
  });
}

/**
 * Parse and normalize company data from YTJ API
 */
function parseCompany(raw: any): YTJCompany {
  // YTJ API has inconsistent field names, try multiple variations
  const businessId = raw.businessId || raw.businessid || raw.y_tunnus || '';
  const name = raw.name || raw.companyName || raw.nimi || '';
  const registrationDate = raw.registrationDate || raw.registrationdate || raw.rekisterointipaiva || '';
  const companyForm = raw.companyForm || raw.companyform || raw.yhtiömuoto || '';

  // Parse address (might be in different formats)
  let addresses: any[] = [];
  if (raw.addresses && Array.isArray(raw.addresses)) {
    addresses = raw.addresses;
  } else if (raw.address) {
    addresses = [raw.address];
  }

  // Parse business lines
  let businessLines: any[] = [];
  if (raw.businessLines && Array.isArray(raw.businessLines)) {
    businessLines = raw.businessLines;
  } else if (raw.businessLine) {
    businessLines = [raw.businessLine];
  }

  return {
    businessId,
    name,
    registrationDate,
    companyForm,
    detailsUri: raw.detailsUri || raw.uri || '',
    addresses: addresses.map(addr => ({
      street: addr.street || addr.katu || '',
      postCode: addr.postCode || addr.postinumero || '',
      city: addr.city || addr.kaupunki || '',
      country: addr.country || addr.maa || 'FI',
      type: addr.type || addr.tyyppi || 'business',
    })),
    businessLines: businessLines.map(line => ({
      code: line.code || line.koodi || '',
      name: line.name || line.nimi || '',
    })),
  };
}
