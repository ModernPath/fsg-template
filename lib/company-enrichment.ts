/**
 * BizExit Company Enrichment using Gemini AI with Google Search Grounding
 * 
 * This module uses Google's Gemini API with Google Search grounding to:
 * 1. Fetch company basic information from YTJ and public sources
 * 2. Extract financial data from public Finnish sources (Finder.fi, Asiakastieto.fi)
 * 3. Gather business intelligence for deal analysis
 * 
 * Based on Trusty Finance's unified-company-enrichment.ts
 * Adapted for BizExit M&A platform
 */

import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';

export interface CompanyBasicInfo {
  name: string;
  businessId: string;
  industry?: string;
  companyForm?: string;
  registrationDate?: string;
  address?: string;
  website?: string;
  employees?: number | null;
  description?: string;
  products?: string[];
  marketPosition?: string;
  recentNews?: string[];
  // Data quality indicators
  dataQuality: {
    verified: boolean; // YTJ-vahvistettu
    aiGenerated: boolean; // AI-generoitu
    needsVerification: boolean; // Vaatii käyttäjän vahvistuksen
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    missingFields: string[]; // Puuttuvat kentät
  };
}

export interface YearlyFinancialData {
  year: number;
  revenue: number | null;
  operatingProfit: number | null;
  netProfit: number | null;
  totalAssets: number | null;
  equity: number | null;
  totalLiabilities: number | null;
  source: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface CompanyFinancialData {
  yearly: YearlyFinancialData[];
  currency: 'EUR' | 'SEK' | 'NOK' | 'DKK';
  lastUpdated: Date;
  sourcesUsed: string[];
  yearsFound: number;
}

export interface EnrichedCompanyData {
  basicInfo: CompanyBasicInfo;
  financialData: CompanyFinancialData;
  searchQueriesUsed: string[];
  sourcesFound: string[];
  confidence: number;
  extractedAt: Date;
}

interface EnrichmentConfig {
  apiKey: string;
  model?: string;
  locale?: string;
}

export class CompanyEnrichment {
  private genAI: GoogleGenAI;
  private model: string;
  private locale: string;

  constructor(config: EnrichmentConfig) {
    this.genAI = new GoogleGenAI({ apiKey: config.apiKey });
    this.model = config.model || 'gemini-2.0-flash-exp';
    this.locale = config.locale || 'fi';
  }

  /**
   * Main enrichment method - fetches both basic info and financial data
   */
  async enrichCompany(
    businessId: string,
    companyName: string,
    options: {
      country?: string;
      industry?: string;
      website?: string;
    } = {}
  ): Promise<EnrichedCompanyData> {
    console.log(`\n🔍 [BizExit Enrichment] Starting for: ${companyName} (${businessId})`);
    console.log(`🌍 Country: ${options.country || 'Finland'}, Locale: ${this.locale}`);

    const startTime = Date.now();

    try {
      // Run both calls in parallel for speed
      const [basicInfoResult, financialDataResult] = await Promise.allSettled([
        this.fetchBasicInfo(businessId, companyName, options),
        this.fetchFinancialData(businessId, companyName, options),
      ]);

      // Extract results
      const basicInfo: CompanyBasicInfo = basicInfoResult.status === 'fulfilled'
        ? basicInfoResult.value
        : {
            name: companyName,
            businessId: businessId,
          };

      const financialData: CompanyFinancialData = financialDataResult.status === 'fulfilled'
        ? financialDataResult.value
        : {
            yearly: [],
            currency: 'EUR',
            lastUpdated: new Date(),
            sourcesUsed: [],
            yearsFound: 0,
          };

      // Log any errors
      if (basicInfoResult.status === 'rejected') {
        console.error('❌ [Basic Info] Failed:', basicInfoResult.reason);
      }
      if (financialDataResult.status === 'rejected') {
        console.error('❌ [Financial Data] Failed:', financialDataResult.reason);
      }

      // Calculate overall confidence
      const confidence = this.calculateConfidence(basicInfo, financialData);

      const enrichedData: EnrichedCompanyData = {
        basicInfo,
        financialData,
        searchQueriesUsed: [
          `${companyName} ${businessId} yritys`,
          `${companyName} taloustiedot`,
        ],
        sourcesFound: [...new Set(financialData.sourcesUsed)],
        confidence,
        extractedAt: new Date(),
      };

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`\n✅ [BizExit Enrichment] Complete in ${duration}s`);
      console.log(`   Confidence: ${confidence}%`);
      console.log(`   Years found: ${financialData.yearsFound}`);

      return enrichedData;
    } catch (error) {
      console.error('❌ [BizExit Enrichment] Unexpected error:', error);
      throw error;
    }
  }

  /**
   * Fetch basic company information using Gemini with Google Search
   */
  private async fetchBasicInfo(
    businessId: string,
    companyName: string,
    options: { country?: string; industry?: string; website?: string }
  ): Promise<CompanyBasicInfo> {
    console.log(`\n🏢 [Basic Info] Fetching for ${companyName}...`);

    const prompt = this.buildBasicInfoPrompt(businessId, companyName, options);

    try {
      const model = this.genAI.models.generateContent({
        model: this.model,
        contents: [prompt],
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0.7,
          maxOutputTokens: 8000,
          systemInstruction: this.getSystemInstruction('basic_info'),
        },
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
      } as any);

      const result = await model;
      const text = result.text || '';

      console.log(`📊 [Basic Info] Response length: ${text.length} chars`);

      // Parse JSON
      const parsed = this.parseJSON(text, 'Basic Info');

      // CRITICAL: Validate data quality and track what's missing
      const missingFields: string[] = [];
      const aiGeneratedFields: string[] = [];
      
      // Check critical fields
      if (!parsed.industry) missingFields.push('industry');
      if (!parsed.companyForm) missingFields.push('companyForm');
      if (!parsed.registrationDate) missingFields.push('registrationDate');
      if (!parsed.address) missingFields.push('address');
      if (!parsed.employees) missingFields.push('employees');
      
      // Determine if data needs verification
      const needsVerification = missingFields.length > 0 || parsed.confidence !== 'HIGH';
      
      // Track AI-generated vs verified data
      if (parsed.description && !parsed.description_source) {
        aiGeneratedFields.push('description');
      }
      if (parsed.marketPosition && !parsed.marketPosition_source) {
        aiGeneratedFields.push('marketPosition');
      }

      const basicInfo: CompanyBasicInfo = {
        name: parsed.name || companyName,
        businessId: businessId,
        industry: parsed.industry || options.industry,
        companyForm: parsed.companyForm,
        registrationDate: parsed.registrationDate,
        address: parsed.address,
        website: parsed.website || options.website,
        employees: parsed.employees ? parseInt(parsed.employees) : null,
        description: parsed.description || '',
        products: parsed.products || [],
        marketPosition: parsed.marketPosition || '',
        recentNews: parsed.recentNews || [],
        dataQuality: {
          verified: false, // Will be set to true after YTJ verification
          aiGenerated: aiGeneratedFields.length > 0,
          needsVerification: needsVerification,
          confidence: this.calculateBasicInfoConfidence(parsed, missingFields),
          missingFields: missingFields,
        },
      };

      console.log(`✅ [Basic Info] Success!`);
      console.log(`   Missing fields: ${missingFields.join(', ') || 'none'}`);
      console.log(`   AI-generated fields: ${aiGeneratedFields.join(', ') || 'none'}`);
      console.log(`   Needs verification: ${needsVerification ? 'YES ⚠️' : 'NO'}`);
      
      return basicInfo;
    } catch (error) {
      console.error('❌ [Basic Info] Failed:', error);
      throw error;
    }
  }

  /**
   * Fetch financial data using Gemini with Google Search
   * Focuses on Finnish sources: Finder.fi, Asiakastieto.fi, Kauppalehti.fi
   */
  private async fetchFinancialData(
    businessId: string,
    companyName: string,
    options: { country?: string }
  ): Promise<CompanyFinancialData> {
    console.log(`\n💰 [Financial Data] Fetching for ${companyName}...`);

    const country = options.country || 'FI';
    const currency = country === 'FI' || country === 'Finland' ? 'EUR' : 'SEK';

    // Build URLs for Finnish sources
    const finderUrl = `https://finder.fi/${businessId.replace('-', '')}`;
    const asiakastietoSlug = companyName
      .toLowerCase()
      .replace(/ oy(j)?$/i, '')
      .replace(/ ab$/i, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    const asiakastietoUrl = `https://asiakastieto.fi/yritykset/fi/${asiakastietoSlug}/${businessId.replace(/-/g, '')}/taloustiedot`;

    const prompt = this.buildFinancialDataPrompt(businessId, companyName, {
      currency,
      finderUrl,
      asiakastietoUrl,
    });

    try {
      const model = this.genAI.models.generateContent({
        model: this.model,
        contents: [prompt],
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0.5,
          maxOutputTokens: 10000,
          systemInstruction: this.getSystemInstruction('financial_data'),
        },
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
      } as any);

      const result = await model;
      const text = result.text || '';

      console.log(`📊 [Financial Data] Response length: ${text.length} chars`);

      // Parse JSON
      const parsed = this.parseJSON(text, 'Financial Data');

      // Validate and transform to our format
      const yearly: YearlyFinancialData[] = (parsed.revenue || [])
        .map((item: any, index: number) => ({
          year: item.year,
          revenue: item.value,
          operatingProfit: parsed.operating_profit?.[index]?.value || null,
          netProfit: parsed.net_profit?.[index]?.value || null,
          totalAssets: parsed.total_assets?.[index]?.value || null,
          equity: parsed.equity?.[index]?.value || null,
          totalLiabilities: parsed.total_liabilities?.[index]?.value || null,
          source: item.source,
          confidence: item.confidence || 'MEDIUM',
        }))
        .filter((item: YearlyFinancialData) => item.revenue !== null);

      const yearsFound = new Set(yearly.map((y) => y.year)).size;

      console.log(`✅ [Financial Data] Found ${yearsFound} years of data`);

      return {
        yearly,
        currency: currency as 'EUR' | 'SEK',
        lastUpdated: new Date(),
        sourcesUsed: parsed.sourcesFound || [],
        yearsFound,
      };
    } catch (error) {
      console.error('❌ [Financial Data] Failed:', error);
      throw error;
    }
  }

  /**
   * Build prompt for basic company information
   */
  private buildBasicInfoPrompt(
    businessId: string,
    companyName: string,
    options: { country?: string; industry?: string; website?: string }
  ): string {
    const country = options.country || 'Finland';

    return `
Extract comprehensive company information for ${companyName} (Business ID: ${businessId}, Country: ${country}).

Search company website, YTJ registry, Finder.fi, Kauppalehti.fi, and other Finnish business sources.

Extract the following information:

1. **Company Name**: Official registered name
2. **Industry**: Main industry/sector (e.g., "Technology", "Manufacturing", "Retail")
3. **Company Form**: Legal form (e.g., "Oy", "Oyj", "Ay", "Ky")
4. **Registration Date**: When the company was founded/registered
5. **Address**: Official business address
6. **Website**: Company website URL if available
7. **Employees**: Number of employees (integer)
8. **Description**: Brief company description (2-3 sentences about what they do)
9. **Products**: Array of main products or services offered
10. **Market Position**: Target market and competitive position (1-2 sentences)
11. **Recent News**: Recent news or developments (last 6 months) - array of strings

IMPORTANT:
- Extract ONLY factual information found in sources
- DO NOT invent or estimate any data
- If information is not found, leave field empty or null
- Focus on Finnish sources: YTJ, Finder.fi, company website

Return JSON with this structure:
{
  "name": "Company official name",
  "industry": "Industry name",
  "companyForm": "Oy",
  "registrationDate": "YYYY-MM-DD",
  "address": "Street, City, Postal Code",
  "website": "https://company.fi",
  "employees": 50,
  "description": "Company description...",
  "products": ["Product 1", "Product 2"],
  "marketPosition": "Market position description...",
  "recentNews": ["News item 1", "News item 2"]
}
`;
  }

  /**
   * Build prompt for financial data extraction
   */
  private buildFinancialDataPrompt(
    businessId: string,
    companyName: string,
    options: { currency: string; finderUrl: string; asiakastietoUrl: string }
  ): string {
    const currentYear = new Date().getFullYear();

    return `
Extract financial data for ${companyName} (Business ID: ${businessId}) from Finnish sources.

🚨 CRITICAL INSTRUCTIONS:

1. READ THESE SPECIFIC URLS:
   - Primary: ${options.asiakastietoUrl}
   - Secondary: ${options.finderUrl}
   - Additional: Search for "${companyName} ${businessId} taloustiedot"

2. EXTRACT MULTI-YEAR DATA (2020-${currentYear}):
   - Revenue (Liikevaihto) in ${options.currency}
   - Operating Profit (Liikevoitto) in ${options.currency}
   - Net Profit (Tilikauden tulos) in ${options.currency}
   - Total Assets (Taseen loppusumma) in ${options.currency}
   - Equity (Oma pääoma) in ${options.currency}
   - Total Liabilities (Vieras pääoma) in ${options.currency}

3. UNIT CONVERSION RULES:
   - "tuhatta euroa" or "(1000 €)" means thousands → multiply by 1000
   - Example: "224 tuhatta euroa" → 224000 (NOT 224)
   - "miljoonaa euroa" means millions → multiply by 1000000
   - Example: "2.5 miljoonaa euroa" → 2500000 (NOT 2.5)
   - Always extract FULL PRECISION numbers

4. DATA VALIDATION:
   - Include the EXACT source URL for each value
   - Mark confidence: HIGH (exact match), MEDIUM (calculated), LOW (estimated)
   - Only extract if you can verify from the source
   - If data not found, return empty array

Return JSON with this structure:
{
  "revenue": [
    {"value": 224000, "year": ${currentYear}, "source": "https://...", "confidence": "HIGH"},
    {"value": 329000, "year": ${currentYear - 1}, "source": "https://...", "confidence": "HIGH"}
  ],
  "operating_profit": [...],
  "net_profit": [...],
  "total_assets": [...],
  "equity": [...],
  "total_liabilities": [...],
  "sourcesFound": ["https://finder.fi/...", "https://asiakastieto.fi/..."]
}

REMEMBER: All values must be in FULL PRECISION (complete numbers, not abbreviated).
`;
  }

  /**
   * Get system instruction based on task
   */
  private getSystemInstruction(task: 'basic_info' | 'financial_data'): string {
    const languageMap = {
      fi: 'FINNISH',
      sv: 'SWEDISH',
      en: 'ENGLISH',
    };

    const language = languageMap[this.locale as keyof typeof languageMap] || 'FINNISH';

    if (task === 'basic_info') {
      return `You are a business intelligence analyst. Extract company information from web sources. 
Return valid JSON only, no markdown formatting. 
All text content must be in ${language}.`;
    }

    return `You are a financial data extractor. 
Find financial data from Finnish sources (Finder.fi, Asiakastieto.fi). 
Return valid JSON only, no markdown formatting.
Pay careful attention to units: "tuhatta euroa" means thousands (multiply by 1000).
Extract ALL years available (2020-${new Date().getFullYear()}).`;
  }

  /**
   * Parse JSON response with error recovery
   */
  private parseJSON(text: string, context: string): any {
    let jsonStr = text.trim();

    // Extract JSON from markdown code blocks
    const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1];
    } else {
      const jsonMatch = jsonStr.match(/\{.*\}/s);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
    }

    try {
      // Fix common JSON issues
      let fixedJson = jsonStr
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters

      return JSON.parse(fixedJson);
    } catch (error: any) {
      console.error(`❌ [${context}] JSON parse error:`, error.message);
      console.error(`JSON preview: ${jsonStr.substring(0, 500)}...`);
      throw error;
    }
  }

  /**
   * Calculate confidence for basic info only
   */
  private calculateBasicInfoConfidence(
    parsed: any,
    missingFields: string[]
  ): 'HIGH' | 'MEDIUM' | 'LOW' {
    // HIGH: All critical fields present and from verified sources
    if (missingFields.length === 0 && parsed.confidence === 'HIGH') {
      return 'HIGH';
    }

    // LOW: Many missing fields or low source confidence
    if (missingFields.length >= 3 || parsed.confidence === 'LOW') {
      return 'LOW';
    }

    // MEDIUM: Some missing fields or medium source confidence
    return 'MEDIUM';
  }

  /**
   * Calculate overall confidence score
   */
  private calculateConfidence(
    basicInfo: CompanyBasicInfo,
    financialData: CompanyFinancialData
  ): number {
    let score = 0;

    // Basic info scoring (max 50 points)
    if (basicInfo.name) score += 10;
    if (basicInfo.industry) score += 10;
    if (basicInfo.description && basicInfo.description.length > 50) score += 10;
    if (basicInfo.employees !== null) score += 10;
    if (basicInfo.website) score += 5;
    if (basicInfo.products && basicInfo.products.length > 0) score += 5;

    // Financial data scoring (max 50 points)
    const yearsWithData = financialData.yearly.length;
    if (yearsWithData >= 1) score += 10;
    if (yearsWithData >= 3) score += 15;
    if (yearsWithData >= 5) score += 10;

    // High confidence data
    const highConfidenceCount = financialData.yearly.filter(
      (y) => y.confidence === 'HIGH'
    ).length;
    if (highConfidenceCount >= 3) score += 15;

    return Math.min(score, 100);
  }
}

/**
 * Factory function to create enrichment instance
 */
export function createCompanyEnrichment(locale: string = 'fi'): CompanyEnrichment {
  const apiKey = process.env.GOOGLE_AI_STUDIO_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GOOGLE_AI_STUDIO_KEY or GEMINI_API_KEY required');
  }

  return new CompanyEnrichment({
    apiKey,
    model: 'gemini-2.0-flash-exp',
    locale,
  });
}

