import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

interface SwedishFinancialData {
  // Core financial metrics
  revenue?: string;       // Omsättning in SEK
  profit?: string;        // Resultat efter finansnetto in SEK  
  netResult?: string;     // Årets resultat in SEK
  equity?: string;        // Eget kapital in SEK
  totalAssets?: string;   // Summa tillgångar in SEK
  currentAssets?: string; // Omsättningstillgångar in SEK
  fixedAssets?: string;   // Anläggningstillgångar in SEK
  
  // Liabilities
  totalLiabilities?: string;    // Summa skulder in SEK
  currentLiabilities?: string;  // Kortfristiga skulder in SEK
  longTermLiabilities?: string; // Långfristiga skulder in SEK
  
  // Key ratios (calculated or extracted)
  solidityRatio?: string;       // Soliditet %
  liquidityRatio?: string;      // Kassalikviditet %
  profitMargin?: string;        // Vinstmarginal %
  returnOnEquity?: string;      // Avkastning på eget kapital %
  
  // Company info
  employees?: string;     // Antal anställda
  industry?: string;      // Bransch/sektor
  year?: string;          // År för data
  companyForm?: string;   // Bolagsform (AB, etc.)
  shareCapital?: string;  // Aktiekapital in SEK
  address?: string;       // Address
  founded?: string;       // Founded date
}

// Rate limiting map to track requests
const requestTracker = new Map<string, number>();

// User agent rotation for better success rate
const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0'
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const lastRequest = requestTracker.get(ip) || 0;
  const cooldown = 2000; // 2 seconds between requests
  
  if (now - lastRequest < cooldown) {
    return false;
  }
  
  requestTracker.set(ip, now);
  return true;
}

/**
 * Enhanced scraper for Swedish company financial data from Allabolag.se
 * Production-ready with improved error handling and data extraction
 */
async function scrapeAllabolagData(orgNumber: string, retries = 3): Promise<SwedishFinancialData | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Clean org number (remove hyphens, spaces)
      const cleanOrgNumber = orgNumber.replace(/[-\s]/g, '');
      
      // Validate org number format (Swedish: 10 digits)
      if (!/^\d{10}$/.test(cleanOrgNumber)) {
        console.log(`❌ Invalid Swedish org number format: ${orgNumber}`);
        return null;
      }
      
      // Try different URL patterns
      const urlPatterns = [
        `https://www.allabolag.se/what/${cleanOrgNumber}`,
        `https://www.allabolag.se/${cleanOrgNumber}`,
        `https://www.allabolag.se/foretag/${cleanOrgNumber}`
      ];
      
      for (const url of urlPatterns) {
        console.log(`🔍 [Attempt ${attempt}] Scraping: ${url}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': getRandomUserAgent(),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'sv-SE,sv;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none'
          },
          signal: AbortSignal.timeout(30000)
        });

        if (!response.ok) {
          console.log(`❌ HTTP ${response.status} for ${url}`);
          continue; // Try next URL pattern
        }

        const html = await response.text();
        console.log(`✅ Got HTML response (${html.length} chars) from ${url}`);

        // Enhanced data extraction with multiple patterns
        const financialData = extractFinancialData(html);
        
        if (financialData && Object.keys(financialData).length > 1) {
          return financialData;
        }
      }
      
      // If no URL worked, wait before retry
      if (attempt < retries) {
        const delay = 1000 * attempt; // Exponential backoff
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error);
      if (attempt === retries) {
        return null;
      }
    }
  }
  
  return null;
}

/**
 * Extract financial data from HTML with comprehensive patterns including JSON data
 */
function extractFinancialData(html: string): SwedishFinancialData | null {
  const financialData: SwedishFinancialData = {};
  
  // Step 1: Try to extract data from JSON embedded in HTML (most reliable)
  const jsonExtracted = extractFromJSON(html);
  if (jsonExtracted) {
    Object.assign(financialData, jsonExtracted);
  }
  
  // Step 2: Use HTML patterns as fallback or additional source
  const htmlExtracted = extractFromHTML(html);
  if (htmlExtracted) {
    // Fill in any missing data with HTML extraction
    Object.keys(htmlExtracted).forEach(key => {
      if (!financialData[key] && htmlExtracted[key]) {
        financialData[key] = htmlExtracted[key];
      }
    });
  }
  
  // Default to previous year if not found (most financial statements are for last fiscal year)
  if (!financialData.year) {
    const defaultYear = (new Date().getFullYear() - 1).toString();
    console.warn(`⚠️ [Allabolag] No fiscal year found, defaulting to ${defaultYear}`);
    financialData.year = defaultYear;
  }
  
  console.log(`📊 Final extracted data:`, financialData);
  return Object.keys(financialData).length > 1 ? financialData : null;
}

/**
 * Extract data from JSON embedded in the HTML
 */
function extractFromJSON(html: string): SwedishFinancialData | null {
  try {
    // Look for __NEXT_DATA__ script containing JSON
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
    if (!nextDataMatch) return null;
    
    const jsonData = JSON.parse(nextDataMatch[1]);
    console.log('🔍 Found __NEXT_DATA__, extracting company info...');
    
    // Navigate to company data
    const companies = jsonData?.props?.pageProps?.hydrationData?.searchStore?.companies?.companies;
    if (!companies || !Array.isArray(companies) || companies.length === 0) {
      console.log('❌ No companies found in JSON data');
      return null;
    }
    
    const company = companies[0]; // Take first company
    console.log(`✅ Found company data in JSON: ${company.name} (${company.orgnr})`);
    
    const data: SwedishFinancialData = {};
    
    // Extract comprehensive financial data from JSON
    if (company.revenue) {
      data.revenue = (parseInt(company.revenue) * 1000).toString(); // Convert Tkr to SEK
      console.log(`💰 JSON Revenue: ${data.revenue} SEK (from ${company.revenue} Tkr)`);
    }
    
    if (company.profit) {
      data.profit = (parseInt(company.profit) * 1000).toString(); // Convert Tkr to SEK
      console.log(`📈 JSON Profit: ${data.profit} SEK (from ${company.profit} Tkr)`);
    }
    
    if (company.employees) {
      data.employees = company.employees.toString();
      console.log(`👥 JSON Employees: ${data.employees}`);
    }
    
    // Extract industry from JSON
    if (company.industries && company.industries.length > 0) {
      data.industry = company.industries[0].name;
      console.log(`🏭 JSON Industry: ${data.industry}`);
    }
    
    // Extract address information
    if (company.visitorAddress) {
      const address = `${company.visitorAddress.addressLine || ''}, ${company.visitorAddress.zipCode || ''} ${company.visitorAddress.postPlace || ''}`.trim();
      if (address !== ', ') {
        data.address = address;
        console.log(`📍 JSON Address: ${data.address}`);
      }
    }
    
    // Extract year from companyAccountsLastUpdatedDate
    // CRITICAL: This might be publication year, not fiscal year!
    if (company.companyAccountsLastUpdatedDate) {
      const yearMatch = company.companyAccountsLastUpdatedDate.match(/(\d{4})/);
      if (yearMatch) {
        const extractedYear = parseInt(yearMatch[1]);
        // If it's current year, the fiscal year is likely previous year
        const currentYear = new Date().getFullYear();
        if (extractedYear === currentYear) {
          data.year = (currentYear - 1).toString();
          console.log(`📅 JSON Year: ${data.year} (from LastUpdated: ${extractedYear}, assuming fiscal year is previous)`);
        } else {
          data.year = yearMatch[1];
          console.log(`📅 JSON Year: ${data.year} (from LastUpdated: ${yearMatch[1]})`);
        }
      }
    }
    
    // Try to calculate key ratios if we have enough data
    if (data.revenue && data.profit) {
      const revenueNum = parseInt(data.revenue);
      const profitNum = parseInt(data.profit);
      if (revenueNum > 0) {
        data.profitMargin = ((profitNum / revenueNum) * 100).toFixed(2);
        console.log(`📊 Calculated Profit Margin: ${data.profitMargin}%`);
      }
    }
    
    return data;
    
  } catch (error) {
    console.log('❌ Error parsing JSON data:', error);
    return null;
  }
}

/**
 * Extract data from HTML patterns (fallback method)
 */
function extractFromHTML(html: string): SwedishFinancialData | null {
  const financialData: SwedishFinancialData = {};
  
  // Enhanced patterns for comprehensive financial data extraction
  const patterns = {
    revenue: [
      /Omsättning\s+(\d{4})[^>]*>(\d+)/i, // From HTML structure
      /(?:Omsättning|OMSÄTTNING|Nettoomsättning)[\s\S]*?(\d+(?:\s?\d+)*)\s*(?:Tkr|tkr|TSEK|tsek)/i,
      /<td[^>]*>(?:Omsättning|Nettoomsättning)<\/td>[\s\S]*?<td[^>]*>(\d+(?:\s?\d+)*)\s*Tkr<\/td>/i,
      /(?:Omsättning|Nettoomsättning).*?(\d+(?:\s\d+)*)\s*Tkr/i
    ],
    profit: [
      /(?:Resultat\s+efter\s+finansnetto|RESULTAT\s+EFTER\s+FINANSNETTO)[\s\S]*?(-?\d+(?:\s?\d+)*)\s*(?:Tkr|tkr|TSEK|tsek)/i,
      /<td[^>]*>Resultat efter finansnetto<\/td>[\s\S]*?<td[^>]*>(-?\d+(?:\s?\d+)*)\s*Tkr<\/td>/i,
      /Resultat efter finansnetto.*?(-?\d+(?:\s\d+)*)\s*Tkr/i
    ],
    netResult: [
      /(?:Årets\s+resultat|ÅRETS\s+RESULTAT)[\s\S]*?(-?\d+(?:\s?\d+)*)\s*(?:Tkr|tkr|TSEK|tsek)/i,
      /<td[^>]*>Årets resultat<\/td>[\s\S]*?<td[^>]*>(-?\d+(?:\s?\d+)*)\s*Tkr<\/td>/i,
      /Årets resultat.*?(-?\d+(?:\s\d+)*)\s*Tkr/i
    ],
    equity: [
      /(?:Eget\s+kapital|EGET\s+KAPITAL)[\s\S]*?(\d+(?:\s?\d+)*)\s*(?:Tkr|tkr|TSEK|tsek)/i,
      /<td[^>]*>Eget kapital<\/td>[\s\S]*?<td[^>]*>(\d+(?:\s?\d+)*)\s*Tkr<\/td>/i,
      /Eget kapital.*?(\d+(?:\s\d+)*)\s*Tkr/i
    ],
    totalAssets: [
      /(?:Summa\s+tillgångar|SUMMA\s+TILLGÅNGAR|Balansomslutning)[\s\S]*?(\d+(?:\s?\d+)*)\s*(?:Tkr|tkr|TSEK|tsek)/i,
      /<td[^>]*>(?:Summa tillgångar|Balansomslutning)<\/td>[\s\S]*?<td[^>]*>(\d+(?:\s?\d+)*)\s*Tkr<\/td>/i,
      /(?:Summa tillgångar|Balansomslutning).*?(\d+(?:\s\d+)*)\s*Tkr/i
    ],
    currentAssets: [
      /(?:Omsättningstillgångar|OMSÄTTNINGSTILLGÅNGAR)[\s\S]*?(\d+(?:\s?\d+)*)\s*(?:Tkr|tkr|TSEK|tsek)/i,
      /<td[^>]*>Omsättningstillgångar<\/td>[\s\S]*?<td[^>]*>(\d+(?:\s?\d+)*)\s*Tkr<\/td>/i,
      /Omsättningstillgångar.*?(\d+(?:\s\d+)*)\s*Tkr/i
    ],
    fixedAssets: [
      /(?:Anläggningstillgångar|ANLÄGGNINGSTILLGÅNGAR)[\s\S]*?(\d+(?:\s?\d+)*)\s*(?:Tkr|tkr|TSEK|tsek)/i,
      /<td[^>]*>Anläggningstillgångar<\/td>[\s\S]*?<td[^>]*>(\d+(?:\s?\d+)*)\s*Tkr<\/td>/i,
      /Anläggningstillgångar.*?(\d+(?:\s\d+)*)\s*Tkr/i
    ],
    currentLiabilities: [
      /(?:Kortfristiga\s+skulder|KORTFRISTIGA\s+SKULDER)[\s\S]*?(\d+(?:\s?\d+)*)\s*(?:Tkr|tkr|TSEK|tsek)/i,
      /<td[^>]*>Kortfristiga skulder<\/td>[\s\S]*?<td[^>]*>(\d+(?:\s?\d+)*)\s*Tkr<\/td>/i,
      /Kortfristiga skulder.*?(\d+(?:\s\d+)*)\s*Tkr/i
    ],
    longTermLiabilities: [
      /(?:Långfristiga\s+skulder|LÅNGFRISTIGA\s+SKULDER)[\s\S]*?(\d+(?:\s?\d+)*)\s*(?:Tkr|tkr|TSEK|tsek)/i,
      /<td[^>]*>Långfristiga skulder<\/td>[\s\S]*?<td[^>]*>(\d+(?:\s?\d+)*)\s*Tkr<\/td>/i,
      /Långfristiga skulder.*?(\d+(?:\s\d+)*)\s*Tkr/i
    ],
    // Key ratios
    solidityRatio: [
      /(?:Soliditet|SOLIDITET)[\s\S]*?(\d+(?:[.,]\d+)?)\s*%/i,
      /<td[^>]*>Soliditet<\/td>[\s\S]*?<td[^>]*>(\d+(?:[.,]\d+)?)\s*%<\/td>/i,
      /Soliditet.*?(\d+(?:[.,]\d+)?)\s*%/i
    ],
    liquidityRatio: [
      /(?:Kassalikviditet|KASSALIKVIDITET|Likviditet)[\s\S]*?(\d+(?:[.,]\d+)?)\s*%/i,
      /<td[^>]*>(?:Kassalikviditet|Likviditet)<\/td>[\s\S]*?<td[^>]*>(\d+(?:[.,]\d+)?)\s*%<\/td>/i,
      /(?:Kassalikviditet|Likviditet).*?(\d+(?:[.,]\d+)?)\s*%/i
    ],
    profitMargin: [
      /(?:Vinstmarginal|VINSTMARGINAL)[\s\S]*?(\d+(?:[.,]\d+)?)\s*%/i,
      /<td[^>]*>Vinstmarginal<\/td>[\s\S]*?<td[^>]*>(\d+(?:[.,]\d+)?)\s*%<\/td>/i,
      /Vinstmarginal.*?(\d+(?:[.,]\d+)?)\s*%/i
    ],
    employees: [
      /Anställda[^>]*>(\d+)/i, // From HTML structure
      /(?:Anställda|ANSTÄLLDA)[\s\S]*?(\d+)/i,
      /<td[^>]*>Anställda<\/td>[\s\S]*?<td[^>]*>(\d+)<\/td>/i,
      /Antal anställda.*?(\d+)/i
    ]
  };
  
  // Extract financial figures
  for (const [key, patternList] of Object.entries(patterns)) {
    for (const pattern of patternList) {
      const match = html.match(pattern);
      if (match) {
        let value: string;
        
        // Handle special pattern for revenue with year
        if (key === 'revenue' && pattern.source.includes('(\\\d{4})')) {
          value = match[2]; // Second capture group for revenue value
          if (!financialData.year) {
            financialData.year = match[1]; // First capture group for year
          }
        } else {
          value = match[1];
        }
        
        value = value.replace(/\s/g, '');
        
        if (key === 'employees') {
          financialData[key] = value;
        } else if (['solidityRatio', 'liquidityRatio', 'profitMargin', 'returnOnEquity'].includes(key)) {
          // Percentage values - keep as is but normalize decimal separator
          financialData[key] = value.replace(',', '.');
        } else {
          // Convert Tkr to SEK for financial values
          const numValue = parseInt(value);
          if (!isNaN(numValue)) {
            financialData[key] = (numValue * 1000).toString();
          }
        }
        
        console.log(`💰 HTML Found ${key}: ${financialData[key]}`);
        break; // Use first successful pattern
      }
    }
  }
  
  // Extract year (try multiple patterns)
  if (!financialData.year) {
    const yearPatterns = [
      /(\d{4})-01-01/,
      /År\s+(\d{4})/i,
      /(\d{4})\s*års/i
    ];
    
    for (const pattern of yearPatterns) {
      const match = html.match(pattern);
      if (match) {
        financialData.year = match[1];
        console.log(`📅 HTML Found year: ${financialData.year}`);
        break;
      }
    }
  }
  
  // Extract industry/sector
  if (!financialData.industry) {
    const industryPatterns = [
      /<h2[^>]*>([^<]*(?:bransch|industri|verksamhet)[^<]*)<\/h2>/i,
      /Bransch[:\s]*([^<\n]+)/i,
      /Verksamhet[:\s]*([^<\n]+)/i
    ];
    
    for (const pattern of industryPatterns) {
      const match = html.match(pattern);
      if (match) {
        financialData.industry = match[1].trim();
        console.log(`🏭 HTML Found industry: ${financialData.industry}`);
        break;
      }
    }
  }
  
  return Object.keys(financialData).length > 0 ? financialData : null;
}

/**
 * API endpoint to scrape Swedish company data
 * For DEMO purposes only
 */
export async function POST(request: NextRequest) {
  try {
    console.log('\n🇸🇪 [Swedish Data Scraper] Starting...');

    // 1. Parse request
    const { orgNumber, companyName } = await request.json();
    
    if (!orgNumber) {
      return NextResponse.json(
        { error: 'Missing orgNumber parameter' },
        { status: 400 }
      );
    }

    console.log(`🔍 Scraping data for: ${companyName} (${orgNumber})`);

    // 2. Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please wait 2 seconds between requests.',
          retryAfter: 2000
        },
        { status: 429 }
      );
    }

    // 3. Authenticate request (simplified for demo)
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
        if (!authError) {
          user = authUser;
        }
      } catch (authError) {
        console.log('Authentication failed, continuing without user:', authError);
      }
    }

    // 4. Scrape financial data from Allabolag.se
    const scrapedData = await scrapeAllabolagData(orgNumber);
    
    if (!scrapedData) {
      return NextResponse.json({
        success: false,
        message: 'No financial data found on Allabolag.se',
        data: null
      });
    }

    // 4. Format the data for our system with SEK currency
    const formattedData = {
      financials: [
        {
          // CRITICAL: Use actual fiscal year from data, NOT current year!
          // Most recent full year data is typically (currentYear - 1)
          year: scrapedData.year || (new Date().getFullYear() - 1).toString(),
          revenue: scrapedData.revenue || 'Not available',
          operating_profit: 'Not available', // Not typically available from overview
          ebitda: 'Not available',
          profit: scrapedData.profit || 'Not available',
          net_result: scrapedData.netResult || 'Not available',
          equity: scrapedData.equity || 'Not available',
          total_assets: scrapedData.totalAssets || 'Not available',
          current_assets: scrapedData.currentAssets || 'Not available',
          current_liabilities: scrapedData.currentLiabilities || 'Not available',
          solidity_ratio: scrapedData.solidityRatio || 'Not available',
          liquidity_ratio: scrapedData.liquidityRatio || 'Not available',
          profit_margin: scrapedData.profitMargin || (scrapedData.revenue && scrapedData.profit ? 
            (parseFloat(scrapedData.profit) / parseFloat(scrapedData.revenue) * 100).toFixed(2) + '%' : 'Not available'),
          currency: 'SEK',
          source: 'Allabolag.se (scraped)'
        }
      ],
      personnel: {
        count: scrapedData.employees ? parseInt(scrapedData.employees) : null,
        source: 'Allabolag.se (scraped)'
      },
      industry: scrapedData.industry || null,
      address: scrapedData.address || null,
      currency: 'SEK',
      lastUpdated: new Date().toISOString()
    };

    console.log('✅ Successfully scraped Swedish financial data');

    return NextResponse.json({
      success: true,
      message: 'Financial data scraped successfully',
      data: formattedData,
      warning: 'This is scraped data for DEMO purposes only'
    });

  } catch (error) {
    console.error('❌ Error in Swedish data scraper:', error);
    return NextResponse.json(
      { 
        error: 'Failed to scrape Swedish company data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check if scraping is available for a company
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orgNumber = searchParams.get('orgNumber');
  
  if (!orgNumber) {
    return NextResponse.json(
      { error: 'Missing orgNumber parameter' },
      { status: 400 }
    );
  }

  const cleanOrgNumber = orgNumber.replace(/-/g, '');
  const url = `https://www.allabolag.se/what/${cleanOrgNumber}`;

  return NextResponse.json({
    available: true,
    url: url,
    note: 'Swedish financial data scraping available for DEMO purposes'
  });
}
