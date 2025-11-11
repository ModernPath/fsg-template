import { NextRequest, NextResponse } from 'next/server';

interface SwedishOrgSearchResult {
  name: string;
  orgNumber: string;
  status: string;
  address?: string;
  city?: string;
  founded?: string;
  industry?: string;
}

/**
 * Enhanced search for Swedish organization numbers from company name
 * Uses multiple strategies and improved parsing
 */
async function searchSwedishOrgNumber(companyName: string): Promise<SwedishOrgSearchResult[]> {
  try {
    const results: SwedishOrgSearchResult[] = [];
    
    // Strategy 1: Direct search on Allabolag.se
    const directResults = await searchAllabolagDirect(companyName);
    results.push(...directResults);
    
    // Strategy 2: Google search with site:allabolag.se
    if (results.length === 0) {
      const googleResults = await searchViaGoogle(companyName);
      results.push(...googleResults);
    }
    
    // Remove duplicates based on org number
    const uniqueResults = results.filter((result, index, self) => 
      index === self.findIndex(r => r.orgNumber === result.orgNumber)
    );
    
    return uniqueResults.slice(0, 10); // Limit to 10 results
    
  } catch (error) {
    console.error('❌ Error searching Swedish org numbers:', error);
    return [];
  }
}

/**
 * Search directly on Allabolag.se
 */
async function searchAllabolagDirect(companyName: string): Promise<SwedishOrgSearchResult[]> {
  try {
    // Clean and encode search term
    const cleanName = companyName.trim().replace(/\s+/g, ' ');
    const searchTerm = encodeURIComponent(cleanName);
    
    // Try different search URLs
    const searchUrls = [
      `https://www.allabolag.se/what/${searchTerm}`,
      `https://www.allabolag.se/search?query=${searchTerm}`,
      `https://www.allabolag.se/sok/${searchTerm}`
    ];
    
    for (const searchUrl of searchUrls) {
      console.log(`🔍 Trying search URL: ${searchUrl}`);
      
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'sv-SE,sv;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer': 'https://www.allabolag.se/',
          'DNT': '1',
          'Connection': 'keep-alive'
        },
        signal: AbortSignal.timeout(30000)
      });

      if (!response.ok) {
        console.log(`❌ HTTP ${response.status} for ${searchUrl}`);
        continue;
      }

      const html = await response.text();
      const results = parseSearchResults(html, companyName);
      
      if (results.length > 0) {
        return results;
      }
    }
    
    return [];
    
  } catch (error) {
    console.error('❌ Error in direct Allabolag search:', error);
    return [];
  }
}

/**
 * Fallback: Search via Google with site:allabolag.se
 */
async function searchViaGoogle(companyName: string): Promise<SwedishOrgSearchResult[]> {
  try {
    // This is a simplified approach - in production you'd use Google Custom Search API
    const searchQuery = `site:allabolag.se "${companyName}" organisationsnummer`;
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
    
    console.log(`🔍 Google search: ${googleUrl}`);
    
    // Note: Google blocks automated requests, so this is more of a placeholder
    // In production, use Google Custom Search API or similar service
    
    return [];
    
  } catch (error) {
    console.error('❌ Error in Google search:', error);
    return [];
  }
}

/**
 * Parse search results from HTML with improved patterns
 */
function parseSearchResults(html: string, originalQuery: string): SwedishOrgSearchResult[] {
  const results: SwedishOrgSearchResult[] = [];
  
  // Pattern 1: Direct company page (redirected from search)
  if (html.includes('Organisationsnummer') || html.includes('ORGANISATIONSNUMMER')) {
    const directResult = parseCompanyPage(html, originalQuery);
    if (directResult) {
      results.push(directResult);
      return results;
    }
  }
  
  // Pattern 2: Search results listing
  const listingResults = parseSearchListing(html);
  results.push(...listingResults);
  
  // Pattern 3: Table format results
  const tableResults = parseTableResults(html);
  results.push(...tableResults);
  
  return results;
}

/**
 * Parse individual company page
 */
function parseCompanyPage(html: string, fallbackName: string): SwedishOrgSearchResult | null {
  // Extract org number
  const orgNumberPatterns = [
    /(?:Organisationsnummer|ORGANISATIONSNUMMER)[:\s]*(\d{6}-?\d{4})/i,
    /Org\.?\s*nr[:\s]*(\d{6}-?\d{4})/i,
    /(\d{6}-\d{4})/g
  ];
  
  let orgNumber = '';
  for (const pattern of orgNumberPatterns) {
    const match = html.match(pattern);
    if (match) {
      orgNumber = match[1];
      break;
    }
  }
  
  if (!orgNumber) return null;
  
  // Extract company name
  const namePatterns = [
    /<h1[^>]*>([^<]+)<\/h1>/i,
    /<title>([^<]+?)(?:\s*-\s*Allabolag)?<\/title>/i,
    /<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i
  ];
  
  let name = fallbackName;
  for (const pattern of namePatterns) {
    const match = html.match(pattern);
    if (match) {
      name = match[1].trim();
      break;
    }
  }
  
  // Extract additional info
  const statusMatch = html.match(/(?:Status|STATUS)[:\s]*([^<\n]+)/i);
  const addressMatch = html.match(/(?:Adress|ADRESS)[:\s]*([^<\n]+)/i);
  const foundedMatch = html.match(/(?:Grundat|GRUNDAT|Registrerat)[:\s]*(\d{4})/i);
  
  return {
    name,
    orgNumber,
    status: statusMatch ? statusMatch[1].trim() : 'Active',
    address: addressMatch ? addressMatch[1].trim() : undefined,
    founded: foundedMatch ? foundedMatch[1] : undefined
  };
}

/**
 * Parse search results listing
 */
function parseSearchListing(html: string): SwedishOrgSearchResult[] {
  const results: SwedishOrgSearchResult[] = [];
  
  // Multiple patterns for search result entries
  const patterns = [
    // Pattern for linked company names with org numbers
    /<a[^>]*href="[^"]*\/([^"\/]*)"[^>]*>([^<]+)<\/a>[^<]*<[^>]*>([^<]*(?:\d{6}-?\d{4})[^<]*)/gi,
    // Pattern for table rows
    /<tr[^>]*>[\s\S]*?<td[^>]*>([^<]+)<\/td>[\s\S]*?<td[^>]*>(\d{6}-?\d{4})<\/td>[\s\S]*?<\/tr>/gi,
    // Pattern for div-based results
    /<div[^>]*class="[^"]*company[^"]*"[^>]*>[\s\S]*?([^<]+)[\s\S]*?(\d{6}-?\d{4})[\s\S]*?<\/div>/gi
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html)) !== null && results.length < 15) {
      const name = match[2] ? match[2].trim() : match[1].trim();
      const orgNumberText = match[3] || match[2] || match[1];
      const orgNumberMatch = orgNumberText.match(/(\d{6}-?\d{4})/);
      
      if (orgNumberMatch && name) {
        const orgNumber = orgNumberMatch[1];
        
        // Skip if already found
        if (results.some(r => r.orgNumber === orgNumber)) continue;
        
        results.push({
          name: name.replace(/\s+/g, ' ').trim(),
          orgNumber,
          status: 'Active'
        });
        
        console.log(`📋 Found: ${name} (${orgNumber})`);
      }
    }
  }
  
  return results;
}

/**
 * Parse table-formatted results
 */
function parseTableResults(html: string): SwedishOrgSearchResult[] {
  const results: SwedishOrgSearchResult[] = [];
  
  // Look for table structures with company data
  const tablePattern = /<table[^>]*>[\s\S]*?<\/table>/gi;
  let tableMatch;
  
  while ((tableMatch = tablePattern.exec(html)) !== null) {
    const tableHtml = tableMatch[0];
    
    // Extract rows
    const rowPattern = /<tr[^>]*>[\s\S]*?<\/tr>/gi;
    let rowMatch;
    
    while ((rowMatch = rowPattern.exec(tableHtml)) !== null) {
      const rowHtml = rowMatch[0];
      
      // Extract cells
      const cellPattern = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      const cells = [];
      let cellMatch;
      
      while ((cellMatch = cellPattern.exec(rowHtml)) !== null) {
        cells.push(cellMatch[1].trim().replace(/<[^>]*>/g, ''));
      }
      
      // Look for org number in cells
      for (let i = 0; i < cells.length; i++) {
        const orgMatch = cells[i].match(/(\d{6}-?\d{4})/);
        if (orgMatch && i > 0) { // Org number found, look for name in previous cells
          const name = cells[i - 1] || cells[0];
          if (name && name.length > 2) {
            results.push({
              name: name.trim(),
              orgNumber: orgMatch[1],
              status: 'Active'
            });
          }
        }
      }
    }
  }
  
  return results;
}

/**
 * API endpoint to search for Swedish organization numbers by company name
 * For DEMO purposes only
 */
export async function GET(request: NextRequest) {
  try {
    console.log('\n🔍 [Swedish Org Search] Starting...');

    const { searchParams } = new URL(request.url);
    const companyName = searchParams.get('name');
    
    if (!companyName) {
      return NextResponse.json(
        { error: 'Missing name parameter' },
        { status: 400 }
      );
    }

    console.log(`🔍 Searching for org numbers of: ${companyName}`);

    // Search for organization numbers
    const results = await searchSwedishOrgNumber(companyName);
    
    if (results.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No Swedish companies found with that name',
        results: []
      });
    }

    console.log(`✅ Found ${results.length} Swedish companies`);

    return NextResponse.json({
      success: true,
      message: `Found ${results.length} companies`,
      results: results,
      note: 'This is scraped data for DEMO purposes only'
    });

  } catch (error) {
    console.error('❌ Error in Swedish org search:', error);
    return NextResponse.json(
      { 
        error: 'Failed to search Swedish organization numbers',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for authenticated org number search
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request
    const { companyName } = await request.json();
    
    if (!companyName) {
      return NextResponse.json(
        { error: 'Missing companyName parameter' },
        { status: 400 }
      );
    }

    // Authenticate request (optional for demo, but good practice)
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      // Could add user tracking here for production
      console.log('🔐 Authenticated org number search');
    }

    // Perform search
    const results = await searchSwedishOrgNumber(companyName);
    
    return NextResponse.json({
      success: true,
      results: results,
      searchTerm: companyName,
      timestamp: new Date().toISOString(),
      note: 'DEMO: Scraped from Allabolag.se'
    });

  } catch (error) {
    console.error('❌ Error in POST org search:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
