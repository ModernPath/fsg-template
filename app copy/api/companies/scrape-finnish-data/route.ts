import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

interface YearlyFinancialData {
  year?: number;
  revenue?: string;
  profit?: string;
  netResult?: string;
  equity?: string;
  totalAssets?: string;
  employees?: string;
  solidityRatio?: string;
  [key: string]: any;
}

interface FinnishFinancialData {
  // Multi-year data array
  yearly?: YearlyFinancialData[];
  
  // Core financial metrics (latest year)
  revenue?: string;       // Liikevaihto in EUR
  profit?: string;        // Liikevoitto in EUR  
  netResult?: string;     // Tilikauden tulos in EUR
  equity?: string;        // Oma pääoma in EUR
  totalAssets?: string;   // Taseen loppusumma in EUR
  currentAssets?: string; // Vaihtuvat vastaavat in EUR
  fixedAssets?: string;   // Pysyvät vastaavat in EUR
  
  // Liabilities
  totalLiabilities?: string;    // Vieras pääoma in EUR
  currentLiabilities?: string;  // Lyhytaikainen vieras pääoma in EUR
  longTermLiabilities?: string; // Pitkäaikainen vieras pääoma in EUR
  
  // Key ratios (calculated or extracted)
  solidityRatio?: string;       // Omavaraisuusaste %
  liquidityRatio?: string;      // Quick ratio %
  profitMargin?: string;        // Liikevoittoprosentti %
  returnOnEquity?: string;      // Oman pääoman tuotto-%
  
  // Company info
  employees?: string;     // Henkilöstön määrä
  industry?: string;      // Toimiala
  year?: string;          // Tilikauden vuosi
  companyForm?: string;   // Yhtiömuoto (Oy, Oyj, etc.)
  address?: string;       // Osoite
  founded?: string;       // Perustettu
  website?: string;       // Verkkosivusto
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
 * Enhanced scraper for Finnish company financial data from multiple sources
 * Production-ready with improved error handling and data extraction
 */
async function scrapeFinnishData(businessId: string, retries = 3): Promise<FinnishFinancialData | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Clean business ID (keep format: #######-#)
      const cleanBusinessId = businessId.trim();
      
      // Validate business ID format (Finnish: #######-#)
      if (!/^\d{7}-\d$/.test(cleanBusinessId)) {
        console.log(`❌ Invalid Finnish business ID format: ${businessId}`);
        return null;
      }
      
      console.log(`🔍 [Attempt ${attempt}] Scraping Finnish data for: ${cleanBusinessId}`);
      
      // Try multiple sources in order of reliability
      const sources = [
        () => scrapeFromFinder(cleanBusinessId),
        () => scrapeFromKauppalehti(cleanBusinessId),
        () => scrapeFromAsiakastieto(cleanBusinessId)
      ];
      
      for (const source of sources) {
        try {
          const data = await source();
          if (data && Object.keys(data).length > 1) {
            console.log(`✅ Successfully scraped data from source`);
            return data;
          }
        } catch (sourceError) {
          console.log(`⚠️ Source failed:`, sourceError);
          continue; // Try next source
        }
      }
      
      // If no source worked, wait before retry
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
 * Scrape from Finder.fi
 */
async function scrapeFromFinder(businessId: string): Promise<FinnishFinancialData | null> {
  try {
    // Finder.fi URL format: https://www.finder.fi/[Y-tunnus without dash]
    const urlBusinessId = businessId.replace('-', '');
    const url = `https://www.finder.fi/${urlBusinessId}`;
    
    console.log(`🔍 Scraping Finder.fi: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fi-FI,fi;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      console.log(`❌ HTTP ${response.status} for Finder.fi`);
      return null;
    }

    const html = await response.text();
    console.log(`✅ Got HTML response (${html.length} chars) from Finder.fi`);

    // Extract data from Finder.fi structure
    return extractFinderData(html);
    
  } catch (error) {
    console.error(`❌ Error scraping Finder.fi:`, error);
    return null;
  }
}

/**
 * Scrape from Kauppalehti.fi
 */
async function scrapeFromKauppalehti(businessId: string): Promise<FinnishFinancialData | null> {
  try {
    // Kauppalehti URL format varies, try company search
    const searchUrl = `https://www.kauppalehti.fi/yritykset/haku?search=${encodeURIComponent(businessId)}`;
    
    console.log(`🔍 Scraping Kauppalehti.fi: ${searchUrl}`);
    
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fi-FI,fi;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive'
      },
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      console.log(`❌ HTTP ${response.status} for Kauppalehti.fi`);
      return null;
    }

    const html = await response.text();
    console.log(`✅ Got HTML response (${html.length} chars) from Kauppalehti.fi`);

    // Extract data from Kauppalehti structure
    return extractKauppalehtiData(html);
    
  } catch (error) {
    console.error(`❌ Error scraping Kauppalehti.fi:`, error);
    return null;
  }
}

/**
 * Scrape from Asiakastieto.fi (requires more careful approach due to anti-scraping)
 */
async function scrapeFromAsiakastieto(businessId: string): Promise<FinnishFinancialData | null> {
  try {
    // Asiakastieto URL format
    const url = `https://www.asiakastieto.fi/yritykset/${encodeURIComponent(businessId)}`;
    
    console.log(`🔍 Scraping Asiakastieto.fi: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fi-FI,fi;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
      },
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      console.log(`❌ HTTP ${response.status} for Asiakastieto.fi`);
      return null;
    }

    const html = await response.text();
    console.log(`✅ Got HTML response (${html.length} chars) from Asiakastieto.fi`);

    // Extract data from Asiakastieto structure
    return extractAsiakastietoData(html);
    
  } catch (error) {
    console.error(`❌ Error scraping Asiakastieto.fi:`, error);
    return null;
  }
}

/**
 * Extract financial data from Finder.fi HTML
 * Enhanced to extract multi-year data
 */
function extractFinderData(html: string): FinnishFinancialData | null {
  const financialData: FinnishFinancialData = {};
  
  console.log(`🔍 [Finder] Extracting multi-year financial data...`);
  
  // Try to find yearly data in structured format (charts, tables, etc.)
  // Finder.fi often has data in JSON format embedded in the page
  const jsonMatch = html.match(/<script[^>]*>.*?__NEXT_DATA__.*?=\s*(\{.*?\})\s*<\/script>/s);
  if (jsonMatch) {
    try {
      const data = JSON.parse(jsonMatch[1]);
      console.log('✅ [Finder] Found __NEXT_DATA__ structure');
      
      // Navigate through the JSON to find financial data
      // This structure may vary, so we'll do deep search
      const yearlyData = extractYearlyDataFromJSON(data);
      if (yearlyData && yearlyData.length > 0) {
        financialData.yearly = yearlyData;
        console.log(`✅ [Finder] Extracted ${yearlyData.length} years of data`);
        return financialData;
      }
    } catch (e) {
      console.log('⚠️ [Finder] Failed to parse JSON data:', e);
    }
  }
  
  // Fallback: Extract from visible text patterns
  const patterns = {
    revenue: /Liikevaihto[\s\S]*?(\d+(?:\s?\d+)*)\s*€/gi,
    profit: /Liikevoitto[\s\S]*?(-?\d+(?:\s?\d+)*)\s*€/gi,
    netResult: /Tilikauden tulos[\s\S]*?(-?\d+(?:\s?\d+)*)\s*€/gi,
    equity: /Oma pääoma[\s\S]*?(\d+(?:\s?\d+)*)\s*€/gi,
    totalAssets: /Taseen loppusumma[\s\S]*?(\d+(?:\s?\d+)*)\s*€/gi,
    solidityRatio: /Omavaraisuusaste[\s\S]*?(\d+(?:[.,]\d+)?)\s*%/gi,
    employees: /Henkilöstö[\s\S]*?(\d+)/gi,
  };
  
  // Extract years from the page
  const yearPattern = /\b(20\d{2})\b/g;
  const years: number[] = [];
  let yearMatch;
  while ((yearMatch = yearPattern.exec(html)) !== null) {
    const year = parseInt(yearMatch[1]);
    if (year >= 2015 && year <= new Date().getFullYear() && !years.includes(year)) {
      years.push(year);
    }
  }
  years.sort((a, b) => b - a); // Sort descending (newest first)
  console.log(`📅 [Finder] Found years: ${years.join(', ')}`);
  
  // For each financial metric, try to extract multiple values (one per year)
  const yearlyData: any[] = [];
  
  for (const [key, pattern] of Object.entries(patterns)) {
    const matches: RegExpExecArray[] = [];
    let match;
    pattern.lastIndex = 0; // Reset regex
    while ((match = pattern.exec(html)) !== null && matches.length < 10) {
      matches.push(match);
    }
    
    if (matches.length > 0) {
      console.log(`💰 [Finder] Found ${matches.length} ${key} values`);
      
      // Try to associate values with years
      matches.forEach((m, index) => {
        if (!yearlyData[index]) {
          // CRITICAL: Use actual years from HTML, fallback is risky!
          // Fallback assumes: index 0 = current year, index 1 = last year, etc.
          const fallbackYear = new Date().getFullYear() - index;
          if (years[index]) {
            yearlyData[index] = { year: years[index] };
          } else {
            console.warn(`⚠️ [Finder] No year found for index ${index}, falling back to ${fallbackYear}`);
            yearlyData[index] = { year: fallbackYear };
          }
        }
        
        let value = m[1].replace(/\s/g, ''); // Remove spaces
        if (key === 'solidityRatio') {
          value = value.replace(',', '.');
        }
        
        yearlyData[index][key] = value;
      });
    }
  }
  
  if (yearlyData.length > 0) {
    financialData.yearly = yearlyData.filter(y => Object.keys(y).length > 1); // At least year + one metric
    console.log(`✅ [Finder] Extracted ${financialData.yearly?.length || 0} years of data (fallback method)`);
  }
  
  // Also keep single-year format for backward compatibility
  if (yearlyData.length > 0) {
    const latest = yearlyData[0];
    Object.assign(financialData, latest);
  }
  
  return Object.keys(financialData).length > 0 ? financialData : null;
}

/**
 * Extract yearly data from JSON structure (recursive search)
 */
function extractYearlyDataFromJSON(obj: any, depth = 0): any[] | null {
  if (depth > 10) return null; // Prevent infinite recursion
  
  // Look for arrays that might contain yearly data
  if (Array.isArray(obj)) {
    // Check if this looks like financial data
    const hasYears = obj.some((item: any) => 
      typeof item === 'object' && (item.year || item.vuosi || item.fiscal_year)
    );
    
    if (hasYears) {
      console.log('✅ [Finder] Found yearly data array in JSON');
      return obj.map((item: any) => ({
        year: item.year || item.vuosi || item.fiscal_year,
        revenue: item.revenue || item.liikevaihto || item.turnover,
        profit: item.profit || item.tulos || item.result,
        employees: item.employees || item.henkilosto || item.personnel
      })).filter((item: any) => item.year);
    }
  }
  
  // Search deeper
  if (typeof obj === 'object' && obj !== null) {
    for (const key in obj) {
      const result = extractYearlyDataFromJSON(obj[key], depth + 1);
      if (result) return result;
    }
  }
  
  return null;
}

/**
 * Extract financial data from Kauppalehti.fi HTML
 */
function extractKauppalehtiData(html: string): FinnishFinancialData | null {
  const financialData: FinnishFinancialData = {};
  
  // Kauppalehti patterns (adjust based on actual HTML structure)
  const patterns = {
    revenue: /Liikevaihto[\s\S]*?(\d+(?:\s?\d+)*)/i,
    profit: /(?:Liikevoitto|Voitto)[\s\S]*?(-?\d+(?:\s?\d+)*)/i,
    employees: /Henkilöstö[\s\S]*?(\d+)/i
  };
  
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = html.match(pattern);
    if (match) {
      const value = match[1].replace(/\s/g, '');
      financialData[key as keyof FinnishFinancialData] = value;
      console.log(`💰 Kauppalehti found ${key}: ${value}`);
    }
  }
  
  return Object.keys(financialData).length > 0 ? financialData : null;
}

/**
 * Extract financial data from Asiakastieto.fi HTML
 */
function extractAsiakastietoData(html: string): FinnishFinancialData | null {
  const financialData: FinnishFinancialData = {};
  
  // Asiakastieto patterns (adjust based on actual HTML structure)
  const patterns = {
    revenue: /Liikevaihto[\s\S]*?(\d+(?:\s?\d+)*)/i,
    profit: /Liikevoitto[\s\S]*?(-?\d+(?:\s?\d+)*)/i,
    employees: /Henkilöstö[\s\S]*?(\d+)/i,
    creditRating: /Luottoluokitus[\s\S]*?([A-D][A-D]?[+\-]?)/i
  };
  
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = html.match(pattern);
    if (match) {
      const value = match[1].replace(/\s/g, '');
      financialData[key as keyof FinnishFinancialData] = value;
      console.log(`💰 Asiakastieto found ${key}: ${value}`);
    }
  }
  
  return Object.keys(financialData).length > 0 ? financialData : null;
}

/**
 * API endpoint to scrape Finnish company data
 */
export async function POST(request: NextRequest) {
  try {
    console.log('\n🇫🇮 [Finnish Data Scraper] Starting...');

    // 1. Parse request
    const { businessId, companyName } = await request.json();
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'Missing businessId parameter' },
        { status: 400 }
      );
    }

    console.log(`🔍 Scraping data for: ${companyName} (${businessId})`);

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

    // 3. Authenticate request
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

    // 4. Scrape financial data from Finnish sources
    const scrapedData = await scrapeFinnishData(businessId);
    
    if (!scrapedData) {
      return NextResponse.json({
        success: false,
        message: 'No financial data found from Finnish sources',
        data: null
      });
    }

    // 5. Format the data for our system with EUR currency
    const formattedData = {
      financials: [
        {
          // CRITICAL: Use actual fiscal year from data, NOT publication year!
          // Most recent full year data is typically (currentYear - 1)
          year: scrapedData.year || (new Date().getFullYear() - 1).toString(),
          revenue: scrapedData.revenue || 'Not available',
          operating_profit: 'Not available',
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
          currency: 'EUR',
          source: 'Finnish sources (scraped)'
        }
      ],
      personnel: {
        count: scrapedData.employees ? parseInt(scrapedData.employees) : null,
        source: 'Finnish sources (scraped)'
      },
      industry: scrapedData.industry || null,
      address: scrapedData.address || null,
      website: scrapedData.website || null,
      currency: 'EUR',
      lastUpdated: new Date().toISOString()
    };

    console.log('✅ Successfully scraped Finnish financial data');

    return NextResponse.json({
      success: true,
      message: 'Financial data scraped successfully',
      data: formattedData
    });

  } catch (error) {
    console.error('❌ Error in Finnish data scraper:', error);
    return NextResponse.json(
      { 
        error: 'Failed to scrape Finnish company data',
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
  const businessId = searchParams.get('businessId');
  
  if (!businessId) {
    return NextResponse.json(
      { error: 'Missing businessId parameter' },
      { status: 400 }
    );
  }

  return NextResponse.json({
    available: true,
    sources: ['Finder.fi', 'Kauppalehti.fi', 'Asiakastieto.fi'],
    note: 'Finnish financial data scraping available from multiple sources'
  });
}

