import { NextRequest, NextResponse } from 'next/server';

// YTJ API v3 endpoint - the official API for Finnish business lookups
const YTJ_API_URL = 'https://avoindata.prh.fi/opendata-ytj-api/v3/companies';

// Define interface for formatted company result
interface FormattedCompany {
  businessId: string;
  name: string;
  address: string; // primary address (type 1)
  postalAddress?: string; // postal address (type 2)
  registrationDate?: string;
  status?: string;
  website?: string;
  euId?: string;
  companyForm?: string;
  mainBusinessLine?: string;
  // Address details
  postCode?: string;
  city?: string;
  street?: string;
  buildingNumber?: string;
  entrance?: string;
  apartmentNumber?: string;
  // Postal address details
  postalPostCode?: string;
  postalCity?: string;
  postalStreet?: string;
  postalBuilding?: string;
  countryCode?: string;
}

/**
 * GET handler for company search
 * Searches for companies by name or business ID from YTJ (Finnish Business Registry)
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    console.log(`[YTJ Search API] Request received: query="${query}", limit=${limit}`);

    if (!query || query.length < 3) {
      console.warn(`[YTJ Search API] Invalid query: "${query}" (length: ${query?.length || 0})`);
      return NextResponse.json({ 
        success: false, 
        error: 'Hakusanan tulee olla vähintään 3 merkkiä pitkä' 
      }, { status: 400 });
    }

    // Check if query is a business ID (formatted as ######-#)
    const isBusinessId = /^\d{7}-\d$/.test(query);
    
    // Construct the endpoint URL based on query type
    let endpoint: string;
    if (isBusinessId) {
      // For business ID search, use the businessId parameter
      endpoint = `${YTJ_API_URL}?businessId=${encodeURIComponent(query)}`;
      console.log(`[YTJ Search API] Using business ID search: ${endpoint}`);
    } else {
      // For name search, use the name parameter
      endpoint = `${YTJ_API_URL}?name=${encodeURIComponent(query)}&maxResults=${limit}`;
      console.log(`[YTJ Search API] Using name search: ${endpoint}`);
    }
    
    console.log(`[YTJ Search API] Calling YTJ API...`);
    const response = await fetch(endpoint, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FSG-Template/1.0'
      },
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });
    
    const responseTime = Date.now() - startTime;
    console.log(`[YTJ Search API] YTJ API responded in ${responseTime}ms with status ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[YTJ Search API] YTJ API error ${response.status}:`, errorText);
      
      let userMessage = 'Yrityksen haku epäonnistui';
      if (response.status === 429) {
        userMessage = 'Liikaa hakupyyntöjä. Yritä hetken kuluttua uudelleen.';
      } else if (response.status >= 500) {
        userMessage = 'YTJ-palvelu ei ole käytettävissä. Yritä myöhemmin uudelleen.';
      } else if (response.status === 404) {
        userMessage = 'Yritystä ei löytynyt annetulla hakusanalla.';
      }
      
      return NextResponse.json({ 
        success: false, 
        error: userMessage,
        details: `HTTP ${response.status}` 
      }, { status: response.status });
    }

    const responseText = await response.text();
    console.log(`[YTJ Search API] Raw response length: ${responseText.length} characters`);
    
    // Parse the JSON response
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[YTJ Search API] JSON parsing error:', parseError);
      console.error('[YTJ Search API] Invalid response:', responseText.substring(0, 500));
      return NextResponse.json({ 
        success: false, 
        error: 'Palvelusta saatu virheellinen vastaus. Yritä myöhemmin uudelleen.' 
      }, { status: 502 });
    }
    
    // Debug the API response structure
    console.log(`[YTJ Search API] YTJ API Response Structure: ${typeof data}, has companies: ${Boolean(data.companies)}, totalResults: ${data.totalResults || 'N/A'}`);
    
    let formattedResults: FormattedCompany[] = [];
    
    if (data && data.companies && Array.isArray(data.companies)) {
      console.log(`[YTJ Search API] Processing ${data.companies.length} companies from YTJ response`);
      
      formattedResults = data.companies.map((company: any, index: number) => {
        try {
          // Get all addresses by type
          const addresses = getAddressesByType(company);
          const streetAddress = addresses[1]; // type 1 = street address
          const postalAddress = addresses[2]; // type 2 = postal address

          const result = {
            businessId: company.businessId?.value || '',
            name: getCompanyName(company),
            registrationDate: company.registrationDate || '',
            address: formatAddress(company),
            postalAddress: postalAddress ? formatPostalAddress(postalAddress) : '',
            status: getCompanyStatus(company),
            website: company.website?.url || '',
            euId: company.euId?.value || '',
            companyForm: getCompanyFormDescription(company),
            mainBusinessLine: getMainBusinessLineDescription(company),
            // Address details (street address - type 1)
            postCode: streetAddress?.postCode || '',
            city: getCity(company),
            street: streetAddress?.street || '',
            buildingNumber: streetAddress?.buildingNumber || '',
            entrance: streetAddress?.entrance || '',
            apartmentNumber: streetAddress?.apartmentNumber || '',
            // Postal address details (type 2)
            postalPostCode: postalAddress?.postCode || '',
            postalCity: getPostalCity(postalAddress),
            postalStreet: postalAddress?.street || '',
            postalBuilding: postalAddress?.buildingNumber || '',
            countryCode: streetAddress?.country || ''
          };
          
          console.log(`[YTJ Search API] Processed company ${index + 1}: ${result.name} (${result.businessId})`);
          return result;
        } catch (companyError) {
          console.error(`[YTJ Search API] Error processing company ${index + 1}:`, companyError);
          // Return a minimal result for failed companies
          return {
            businessId: company.businessId?.value || `error-${index}`,
            name: company.businessId?.value || 'Virhe tietojen käsittelyssä',
            registrationDate: '',
            address: '',
            postalAddress: '',
            status: 'Unknown',
            website: '',
            euId: '',
            companyForm: '',
            mainBusinessLine: '',
            postCode: '',
            city: '',
            street: '',
            buildingNumber: '',
            entrance: '',
            apartmentNumber: '',
            postalPostCode: '',
            postalCity: '',
            postalStreet: '',
            postalBuilding: '',
            countryCode: ''
          };
        }
      });
      
      console.log(`[YTJ Search API] Successfully processed ${formattedResults.length} companies`);
    } else {
      console.warn(`[YTJ Search API] No companies found in response or invalid structure`);
    }

    const totalTime = Date.now() - startTime;
    console.log(`[YTJ Search API] Request completed in ${totalTime}ms, returning ${formattedResults.length} results`);

    return NextResponse.json({ 
      success: true, 
      data: formattedResults,
      meta: {
        query,
        resultCount: formattedResults.length,
        responseTime: totalTime
      }
    });
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`[YTJ Search API] Unhandled error after ${totalTime}ms:`, error);
    
    let errorMessage = 'Yrityksen haussa tapahtui odottamaton virhe';
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Haku kesti liian kauan ja keskeytettiin. Yritä uudelleen.';
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Verkkoyhteysvirhe. Tarkista internetyhteys ja yritä uudelleen.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json({ 
      success: false, 
      error: errorMessage,
      details: error instanceof Error ? error.name : 'Unknown error type'
    }, { status: 500 });
  }
}

/**
 * Helper function to get the company name from the YTJ API v3 response
 */
function getCompanyName(company: any): string {
  if (!company || !company.names || !company.names.length) return '';
  
  // Find the current name (type 1 is the official name)
  const officialName = company.names.find((name: any) => 
    name.type === '1' && !name.endDate
  );
  
  if (officialName) {
    return officialName.name;
  }
  
  // If no current official name, use the first name
  return company.names[0]?.name || '';
}

/**
 * Helper function to format company address from YTJ API v3
 */
function formatAddress(company: any) {
  if (!company || !company.addresses || !company.addresses.length) return '';
  
  // Find the most recent street address (type 1 is street address)
  const streetAddresses = company.addresses.filter((a: any) => a.type === 1);
  
  if (!streetAddresses.length) return '';
  
  // Sort by registration date and take the most recent
  const address = streetAddresses.sort((a: any, b: any) => 
    new Date(b.registrationDate || '').getTime() - new Date(a.registrationDate || '').getTime()
  )[0];
  
  const street = address.street || '';
  const buildingNumber = address.buildingNumber || '';
  const entrance = address.entrance ? ` ${address.entrance}` : '';
  const apartmentNumber = address.apartmentNumber ? ` ${address.apartmentNumber}` : '';
  const postCode = address.postCode || '';
  
  // Get city from postOffices
  let city = '';
  if (address.postOffices && address.postOffices.length > 0) {
    // Prefer Finnish name (languageCode 1)
    const finnishCity = address.postOffices.find((p: any) => p.languageCode === '1');
    city = finnishCity ? finnishCity.city : address.postOffices[0].city || '';
  }
  
  return `${street} ${buildingNumber}${entrance}${apartmentNumber}, ${postCode} ${city}`.trim().replace(/\s+/g, ' ');
}

/**
 * Helper function to get addresses by type from YTJ API v3
 */
function getAddressesByType(company: any) {
  if (!company || !company.addresses || !company.addresses.length) return {};
  
  const addresses: Record<number, any> = {};
  
  company.addresses.forEach((address: any) => {
    if (address.type !== undefined) {
      // Store the most recent address for each type
      if (!addresses[address.type] || 
          new Date(address.registrationDate || '').getTime() > 
          new Date(addresses[address.type].registrationDate || '').getTime()) {
        addresses[address.type] = address;
      }
    }
  });
  
  return addresses;
}

/**
 * Helper function to get company status from YTJ API v3
 */
function getCompanyStatus(company: any) {
  if (!company) return 'Unknown';
  
  // Check for status field (2 is generally active)
  if (company.status === '2' && !company.endDate) {
    return 'Active';
  }
  
  // Check if company has an end date
  if (company.endDate) {
    return 'Ended';
  }
  
  // Check if company is in liquidation
  if (company.companySituations && company.companySituations.length > 0) {
    const liquidation = company.companySituations.find((s: any) => s.type === 'KONK');
    if (liquidation) {
      return 'Liquidation';
    }
  }
  
  // Check trade register status (1 is registered, 4 is ceased)
  if (company.tradeRegisterStatus === '4') {
    return 'Ceased';
  }
  
  return company.tradeRegisterStatus === '1' ? 'Active' : 'Inactive';
}

/**
 * Helper function to get company form description
 */
function getCompanyFormDescription(company: any): string {
  if (!company || !company.companyForms || !company.companyForms.length) return '';
  
  const currentForm = company.companyForms.find((form: any) => !form.endDate);
  if (!currentForm) return '';
  
  // Try to find Finnish description (languageCode 1)
  const description = currentForm.descriptions?.find((desc: any) => desc.languageCode === '1');
  return description ? description.description : currentForm.type || '';
}

/**
 * Helper function to get main business line description
 */
function getMainBusinessLineDescription(company: any): string {
  if (!company || !company.mainBusinessLine) return '';
  
  // Try to find Finnish description (languageCode 1)
  const description = company.mainBusinessLine.descriptions?.find((desc: any) => desc.languageCode === '1');
  return description ? description.description : company.mainBusinessLine.type || '';
}

/**
 * Helper function to get city
 */
function getCity(company: any): string {
  if (!company || !company.addresses || !company.addresses.length) return '';
  
  // Find the most recent street address (type 1 is street address)
  const streetAddresses = company.addresses.filter((a: any) => a.type === 1);
  if (!streetAddresses.length) return '';
  
  // Sort by registration date and take the most recent
  const address = streetAddresses.sort((a: any, b: any) => 
    new Date(b.registrationDate || '').getTime() - new Date(a.registrationDate || '').getTime()
  )[0];
  
  // Get city from postOffices
  let city = '';
  if (address.postOffices && address.postOffices.length > 0) {
    // Prefer Finnish name (languageCode 1)
    const finnishCity = address.postOffices.find((p: any) => p.languageCode === '1');
    city = finnishCity ? finnishCity.city : address.postOffices[0].city || '';
  }
  
  return city;
}

/**
 * Helper function to format postal address
 */
function formatPostalAddress(address: any) {
  if (!address) return '';
  
  const street = address.street || '';
  const buildingNumber = address.buildingNumber || '';
  const entrance = address.entrance ? ` ${address.entrance}` : '';
  const apartmentNumber = address.apartmentNumber ? ` ${address.apartmentNumber}` : '';
  const postCode = address.postCode || '';
  
  // Get city from postOffices
  let city = '';
  if (address.postOffices && address.postOffices.length > 0) {
    // Prefer Finnish name (languageCode 1)
    const finnishCity = address.postOffices.find((p: any) => p.languageCode === '1');
    city = finnishCity ? finnishCity.city : address.postOffices[0].city || '';
  }
  
  return `${street} ${buildingNumber}${entrance}${apartmentNumber}, ${postCode} ${city}`.trim().replace(/\s+/g, ' ');
}

/**
 * Helper function to get city from postal address
 */
function getPostalCity(address: any): string {
  if (!address || !address.postOffices || !address.postOffices.length) return '';
  
  // Prefer Finnish name (languageCode 1)
  const finnishCity = address.postOffices.find((p: any) => p.languageCode === '1');
  return finnishCity ? finnishCity.city : address.postOffices[0]?.city || '';
}

