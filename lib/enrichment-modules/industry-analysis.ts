/**
 * Industry Analysis Module (Module 3)
 * 
 * Analyzes company's industry:
 * - Industry trends and drivers
 * - Market size and growth
 * - Competitive landscape
 * - Key success factors
 * 
 * @module enrichment-modules/industry-analysis
 */

import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';
import type { IndustryAnalysis } from '@/types/company-enrichment';

export interface IndustryAnalysisOptions {
  companyName: string;
  industry: string;
  country: string;
}

/**
 * Enrich industry analysis
 */
export async function enrichIndustryAnalysis(
  options: IndustryAnalysisOptions,
  genAI: GoogleGenAI
): Promise<IndustryAnalysis> {
  console.log('🏭 [Module 3] Enriching Industry Analysis...');

  const prompt = buildIndustryAnalysisPrompt(options);

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.3,
        topP: 0.95,
        maxOutputTokens: 4096,
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
    const text = result.response.text();
    const parsed = JSON.parse(text);

    console.log('✅ [Module 3] Industry analysis enriched');
    
    return {
      industry: parsed.industry || options.industry,
      industryInfo: parsed.industryInfo || '',
      industryTrends: parsed.industryTrends || [],
      marketSize: parsed.marketSize || '',
      growthRate: parsed.growthRate || '',
      keyDrivers: parsed.keyDrivers || [],
    };

  } catch (error) {
    console.error('❌ [Module 3] Error:', error);
    return getEmptyIndustryAnalysis(options.industry);
  }
}

/**
 * Build prompt for industry analysis
 */
function buildIndustryAnalysisPrompt(options: IndustryAnalysisOptions): string {
  const { companyName, industry, country } = options;
  
  return `You are an industry analyst. Analyze the industry for this company.

Company Details:
- Name: ${companyName}
- Industry: ${industry}
- Country: ${country}

Use Google Search to find:
1. Industry reports and market research
2. Industry associations and publications
3. Recent news and trends
4. Market size and growth forecasts
5. Key success factors and challenges

Analyze and return in JSON format:

{
  "industry": "${industry}",
  "industryInfo": "Comprehensive overview of the industry (200-300 words)",
  "industryTrends": [
    "Trend 1: Description",
    "Trend 2: Description",
    "Trend 3: Description"
  ],
  "marketSize": "Market size description (e.g., €5B in Finland, growing 12% annually)",
  "growthRate": "Annual growth rate (e.g., 12% CAGR)",
  "keyDrivers": [
    "Driver 1: Description",
    "Driver 2: Description",
    "Driver 3: Description"
  ]
}

CRITICAL RULES:
- Focus on ${industry} industry in ${country}
- Include current trends (2023-2024)
- Cite credible sources
- Be specific with numbers where available
- If data not available, be explicit about it`;
}

/**
 * Get empty industry analysis
 */
function getEmptyIndustryAnalysis(industry: string): IndustryAnalysis {
  return {
    industry,
    industryInfo: '',
    industryTrends: [],
    marketSize: '',
    growthRate: '',
    keyDrivers: [],
  };
}

