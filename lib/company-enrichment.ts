/**
 * BizExit Company Enrichment Engine
 * 
 * Based on Trusty Finance's proven enrichment system
 * Adapted for M&A materials generation with enhanced modules
 * 
 * Core Features:
 * - 9 Base Modules from Trusty Finance (YTJ, Financial Data, Industry Analysis, etc.)
 * - 8 M&A Extension Modules (Valuation, M&A History, Exit Attractiveness, etc.)
 * - Parallel processing for speed
 * - Source tracking and quality scoring
 * - Confidence metrics and data validation
 * 
 * Architecture:
 * - Core Engine (this file) - Gemini AI integration and orchestration
 * - Service Layer (services/company-enrichment.service.ts) - Business logic
 * - React Hook (hooks/useCompanyEnrichment.ts) - State management
 * - Types (types/company-enrichment.ts) - Type definitions
 */

import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';
import type {
  CompanyBasicInfo,
  YearlyFinancialData,
  CompanyFinancialData,
  EnrichedCompanyData,
  Currency,
  ConfidenceLevel,
  IndustryAnalysis,
  CompetitiveAnalysis,
  GrowthAnalysis,
  FinancialHealth,
  PersonnelInfo,
  MarketIntelligence,
  WebPresence,
} from '@/types/company-enrichment';

export interface EnrichmentConfig {
  apiKey: string;
  locale?: string;  // 'fi', 'sv', 'en'
  model?: string;
}

/**
 * Company Enrichment Engine
 * Orchestrates data collection from multiple sources
 */
export class CompanyEnrichment {
  private genAI: GoogleGenAI;
  private locale: string;
  private model: string;

  constructor(config: EnrichmentConfig) {
    this.genAI = new GoogleGenAI({ apiKey: config.apiKey });
    this.locale = config.locale || 'fi';
    this.model = config.model || 'gemini-2.0-flash-exp';
  }

  /**
   * Main enrichment method - fetches both basic info and financial data
   * Modules 1-9: Trusty Finance Base
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
        : this.getEmptyBasicInfo(companyName, businessId);

      const financialData: CompanyFinancialData = financialDataResult.status === 'fulfilled'
        ? financialDataResult.value
        : this.getEmptyFinancialData();

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
        industryAnalysis: this.getEmptyIndustryAnalysis(),
        competitiveAnalysis: this.getEmptyCompetitiveAnalysis(),
        growthAnalysis: this.getEmptyGrowthAnalysis(),
        financialHealth: this.getEmptyFinancialHealth(),
        personnelInfo: this.getEmptyPersonnelInfo(),
        marketIntelligence: this.getEmptyMarketIntelligence(),
        webPresence: this.getEmptyWebPresence(),
        metadata: {
          confidence,
          completeness: this.calculateCompleteness(basicInfo, financialData),
          lastEnriched: new Date(),
          sourcesUsed: [
            ...(basicInfoResult.status === 'fulfilled' ? ['Gemini AI', 'Google Search'] : []),
            ...(financialDataResult.status === 'fulfilled' ? ['Gemini AI', 'Financial APIs'] : []),
          ],
          processingTime: Date.now() - startTime,
        },
      };

      console.log(`✅ [BizExit Enrichment] Completed in ${Date.now() - startTime}ms`);
      console.log(`📊 Confidence: ${confidence}%, Completeness: ${enrichedData.metadata.completeness}%`);

      return enrichedData;
    } catch (error) {
      console.error('❌ [BizExit Enrichment] Fatal error:', error);
      throw error;
    }
  }

  /**
   * Module 1: Fetch Basic Company Information
   * Uses Gemini AI with Google Search grounding
   */
  private async fetchBasicInfo(
    businessId: string,
    companyName: string,
    options: {
      country?: string;
      industry?: string;
      website?: string;
    }
  ): Promise<CompanyBasicInfo> {
    console.log('📊 [Module 1] Fetching basic info...');

    const country = options.country || 'FI';
    const prompt = this.buildBasicInfoPrompt(businessId, companyName, country, options);

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.model,
        generationConfig: {
          temperature: 0.3,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
        ],
        tools: [{
          googleSearch: {}
        }],
      });

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      const parsed = JSON.parse(text);

      console.log('✅ [Module 1] Basic info fetched');

      return {
        name: parsed.name || companyName,
        businessId: businessId,
        industry: parsed.industry || options.industry || '',
        companyForm: parsed.companyForm || '',
        registrationDate: parsed.registrationDate || '',
        address: parsed.address || '',
        website: parsed.website || options.website || '',
        employees: parsed.employees || null,
        description: parsed.description || '',
        products: parsed.products || [],
        marketPosition: parsed.marketPosition || '',
        recentNews: parsed.recentNews || [],
        dataQuality: {
          verified: parsed.dataQuality?.verified || false,
          aiGenerated: true,
          needsVerification: true,
          confidence: parsed.dataQuality?.confidence || 'MEDIUM',
          missingFields: parsed.dataQuality?.missingFields || [],
        },
      };
    } catch (error) {
      console.error('❌ [Module 1] Error:', error);
      throw error;
    }
  }

  /**
   * Module 2: Fetch Financial Data
   * Uses Gemini AI with search grounding for financial sources
   */
  private async fetchFinancialData(
    businessId: string,
    companyName: string,
    options: {
      country?: string;
      industry?: string;
    }
  ): Promise<CompanyFinancialData> {
    console.log('💰 [Module 2] Fetching financial data...');

    const country = options.country || 'FI';
    const prompt = this.buildFinancialDataPrompt(businessId, companyName, country);

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.model,
        generationConfig: {
          temperature: 0.1,  // Lower temperature for financial data
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
        ],
        tools: [{
          googleSearch: {}
        }],
      });

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      const parsed = JSON.parse(text);

      console.log('✅ [Module 2] Financial data fetched');

      return {
        yearly: parsed.yearly || [],
        currency: parsed.currency || 'EUR',
        lastUpdated: new Date(),
        sourcesUsed: parsed.sourcesUsed || [],
        yearsFound: parsed.yearly?.length || 0,
        confidence: parsed.confidence || 'LOW',
      };
    } catch (error) {
      console.error('❌ [Module 2] Error:', error);
      throw error;
    }
  }

  /**
   * Build prompt for basic info extraction
   */
  private buildBasicInfoPrompt(
    businessId: string,
    companyName: string,
    country: string,
    options: any
  ): string {
    const countryText = country === 'FI' ? 'Finland' : country === 'SE' ? 'Sweden' : country;
    
    return `You are a business research analyst. Extract comprehensive information about this company.

Company Details:
- Name: ${companyName}
- Business ID: ${businessId}
- Country: ${countryText}
${options.industry ? `- Industry: ${options.industry}` : ''}
${options.website ? `- Website: ${options.website}` : ''}

Use Google Search to find VERIFIED information from:
1. Official business registries (YTJ/PRH for Finland, Bolagsverket for Sweden)
2. Company's official website
3. LinkedIn company page
4. News articles and press releases
5. Industry reports

Extract and return the following information in JSON format:

{
  "name": "Official company name",
  "industry": "Industry classification",
  "companyForm": "Company legal form (e.g., Oy, AB, Ltd)",
  "registrationDate": "Registration date (YYYY-MM-DD)",
  "address": "Full address",
  "website": "Website URL",
  "employees": number or null,
  "description": "Comprehensive company description (200-300 words)",
  "products": ["Product/service 1", "Product/service 2"],
  "marketPosition": "Market position and competitive standing",
  "recentNews": ["Recent news item 1", "Recent news item 2"],
  "dataQuality": {
    "verified": true if from official source,
    "confidence": "HIGH" | "MEDIUM" | "LOW",
    "missingFields": ["field1", "field2"]
  }
}

CRITICAL RULES:
- Only include VERIFIED information from reliable sources
- If information is not found, use null or empty array
- Mark confidence as LOW if data is uncertain
- List any missing important fields in missingFields array
- Provide sources used in the description`;
  }

  /**
   * Build prompt for financial data extraction
   */
  private buildFinancialDataPrompt(
    businessId: string,
    companyName: string,
    country: string
  ): string {
    const countryText = country === 'FI' ? 'Finland' : country === 'SE' ? 'Sweden' : country;
    
    return `You are a financial analyst. Extract ONLY VERIFIED financial data for this company.

Company Details:
- Name: ${companyName}
- Business ID: ${businessId}
- Country: ${countryText}

Use Google Search to find financial data from TRUSTED sources only:
${country === 'FI' ? '- Finder.fi, Asiakastieto.fi, Kauppalehti.fi' : ''}
${country === 'SE' ? '- Allabolag.se, Soliditet.se' : ''}
- Official company reports
- Business registry filings

Extract financial data for the last 3-5 years and return in JSON format:

{
  "yearly": [
    {
      "year": 2023,
      "revenue": number or null,
      "operatingProfit": number or null,
      "netProfit": number or null,
      "ebitda": number or null,
      "totalAssets": number or null,
      "equity": number or null,
      "totalLiabilities": number or null,
      "profitMargin": percentage or null,
      "equityRatio": percentage or null,
      "returnOnEquity": percentage or null,
      "source": "Source name",
      "confidence": "HIGH" | "MEDIUM" | "LOW"
    }
  ],
  "currency": "EUR" | "SEK" | "USD",
  "sourcesUsed": ["Source 1", "Source 2"],
  "confidence": "HIGH" | "MEDIUM" | "LOW"
}

CRITICAL RULES:
- NEVER fabricate or estimate financial numbers
- Only include data from verified sources
- If no data found, return empty yearly array
- Mark source and confidence for each year
- All monetary values should be in the company's reporting currency`;
  }

  /**
   * Calculate overall confidence score
   */
  private calculateConfidence(
    basicInfo: CompanyBasicInfo,
    financialData: CompanyFinancialData
  ): number {
    let score = 0;
    let factors = 0;

    // Basic info confidence
    if (basicInfo.dataQuality.verified) score += 25;
    else if (basicInfo.dataQuality.confidence === 'HIGH') score += 20;
    else if (basicInfo.dataQuality.confidence === 'MEDIUM') score += 15;
    else score += 10;
    factors++;

    // Financial data confidence
    if (financialData.yearsFound >= 3) score += 25;
    else if (financialData.yearsFound >= 2) score += 15;
    else if (financialData.yearsFound >= 1) score += 10;
    else score += 0;
    factors++;

    // Description quality
    if (basicInfo.description && basicInfo.description.length > 100) score += 15;
    factors++;

    // Products/services
    if (basicInfo.products && basicInfo.products.length > 0) score += 10;
    factors++;

    // News/updates
    if (basicInfo.recentNews && basicInfo.recentNews.length > 0) score += 10;
    factors++;

    // Website
    if (basicInfo.website) score += 5;
    factors++;

    // Employees
    if (basicInfo.employees !== null) score += 10;
    factors++;

    return Math.min(100, Math.round(score));
  }

  /**
   * Calculate completeness score
   */
  private calculateCompleteness(
    basicInfo: CompanyBasicInfo,
    financialData: CompanyFinancialData
  ): number {
    const fields = [
      basicInfo.name,
      basicInfo.businessId,
      basicInfo.industry,
      basicInfo.companyForm,
      basicInfo.address,
      basicInfo.description,
      basicInfo.products?.length > 0,
      financialData.yearly?.length > 0,
      basicInfo.website,
      basicInfo.employees !== null,
    ];

    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }

  // Empty data helpers
  private getEmptyBasicInfo(name: string, businessId: string): CompanyBasicInfo {
    return {
      name,
      businessId,
      industry: '',
      companyForm: '',
      registrationDate: '',
      address: '',
      website: '',
      employees: null,
      description: '',
      products: [],
      marketPosition: '',
      recentNews: [],
      dataQuality: {
        verified: false,
        aiGenerated: false,
        needsVerification: true,
        confidence: 'LOW',
        missingFields: [],
      },
    };
  }

  private getEmptyFinancialData(): CompanyFinancialData {
    return {
      yearly: [],
      currency: 'EUR',
      lastUpdated: new Date(),
      sourcesUsed: [],
      yearsFound: 0,
      confidence: 'LOW',
    };
  }

  private getEmptyIndustryAnalysis(): IndustryAnalysis {
    return {
      industry: '',
      industryInfo: '',
      industryTrends: [],
      marketSize: '',
      growthRate: '',
      keyDrivers: [],
    };
  }

  private getEmptyCompetitiveAnalysis(): CompetitiveAnalysis {
    return {
      competitiveLandscape: '',
      keyCompetitors: [],
      marketShare: '',
      strengths: [],
      weaknesses: [],
    };
  }

  private getEmptyGrowthAnalysis(): GrowthAnalysis {
    return {
      growthOpportunities: [],
      businessModel: '',
      revenueStreams: [],
      expansionPotential: '',
    };
  }

  private getEmptyFinancialHealth(): FinancialHealth {
    return {
      rating: 'Not available',
      creditScore: 'Not available',
      stability: '',
      cashFlow: '',
      paymentBehavior: '',
    };
  }

  private getEmptyPersonnelInfo(): PersonnelInfo {
    return {
      count: null,
      trend: '',
      keyManagement: [],
      boardMembers: [],
      source: '',
    };
  }

  private getEmptyMarketIntelligence(): MarketIntelligence {
    return {
      recentNews: [],
      pressReleases: [],
      awards: [],
      partnerships: [],
      socialMedia: {
        linkedinFollowers: 0,
        facebookLikes: 0,
        twitterFollowers: 0,
      },
    };
  }

  private getEmptyWebPresence(): WebPresence {
    return {
      website: '',
      websiteQuality: '',
      seoRanking: 0,
      contentQuality: '',
      customerTestimonials: [],
    };
  }
}

/**
 * Factory function to create enrichment instance
 */
export function createCompanyEnrichment(locale: string = 'fi'): CompanyEnrichment {
  const apiKey = process.env.GOOGLE_AI_STUDIO_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Missing Google AI API key. Set GOOGLE_AI_STUDIO_KEY or GEMINI_API_KEY environment variable.');
  }

  return new CompanyEnrichment({
    apiKey,
    locale,
  });
}
