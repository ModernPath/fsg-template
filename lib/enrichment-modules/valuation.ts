/**
 * Valuation Module (Module 11)
 * 
 * Calculates company valuation using multiple methods:
 * - Industry multiples (EV/Revenue, EV/EBITDA, P/E)
 * - Comparable transactions
 * - Asset-based valuation
 * 
 * @module enrichment-modules/valuation
 */

import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';
import type { ValuationData, CompanyFinancialData } from '@/types/company-enrichment';

export interface ValuationOptions {
  companyName: string;
  industry: string;
  financialData: CompanyFinancialData;
  country: string;
}

/**
 * Enrich valuation data
 */
export async function enrichValuation(
  options: ValuationOptions,
  genAI: GoogleGenAI
): Promise<ValuationData> {
  console.log('💎 [Module 11] Enriching Valuation...');

  // Extract latest financials
  const latestYear = options.financialData.yearly[0];
  
  if (!latestYear) {
    console.warn('⚠️ [Module 11] No financial data available');
    return getEmptyValuationData();
  }

  const prompt = buildValuationPrompt(options, latestYear);

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.1,  // Very low for numerical data
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

    console.log('✅ [Module 11] Valuation enriched');
    
    return {
      estimatedValue: parsed.estimatedValue || {
        low: 0,
        mid: 0,
        high: 0,
        method: 'Not available',
        confidence: 'LOW',
      },
      industryMultiples: parsed.industryMultiples || {
        evToRevenue: 0,
        evToEbitda: 0,
        priceToEarnings: 0,
        source: 'Not available',
      },
      comparableTransactions: parsed.comparableTransactions || [],
      assetValue: parsed.assetValue || {
        tangibleAssets: latestYear.totalAssets || 0,
        intangibleAssets: 0,
        total: latestYear.totalAssets || 0,
      },
    };

  } catch (error) {
    console.error('❌ [Module 11] Error:', error);
    return getEmptyValuationData();
  }
}

/**
 * Build prompt for valuation calculation
 */
function buildValuationPrompt(options: ValuationOptions, latestYear: any): string {
  const { companyName, industry, country } = options;
  
  return `You are a valuation expert. Calculate company valuation using industry multiples and comparable transactions.

Company Details:
- Name: ${companyName}
- Industry: ${industry}
- Country: ${country}

Latest Financial Data (${latestYear.year}):
- Revenue: €${latestYear.revenue?.toLocaleString() || 'N/A'}
- Operating Profit: €${latestYear.operatingProfit?.toLocaleString() || 'N/A'}
- EBITDA: €${latestYear.ebitda?.toLocaleString() || 'N/A'}
- Total Assets: €${latestYear.totalAssets?.toLocaleString() || 'N/A'}
- Equity: €${latestYear.equity?.toLocaleString() || 'N/A'}

Use Google Search to find:
1. Industry valuation multiples for ${industry} companies
2. Recent M&A transactions in ${industry} sector
3. Public company comparables
4. Industry reports and market data

Calculate and return in JSON format:

{
  "estimatedValue": {
    "low": number (conservative estimate),
    "mid": number (most likely value),
    "high": number (optimistic estimate),
    "method": "Revenue multiple" | "EBITDA multiple" | "Asset-based" | "Comparable transactions",
    "confidence": "HIGH" | "MEDIUM" | "LOW"
  },
  "industryMultiples": {
    "evToRevenue": number (typical EV/Revenue for industry),
    "evToEbitda": number (typical EV/EBITDA for industry),
    "priceToEarnings": number (typical P/E for industry),
    "source": "Source of multiples data"
  },
  "comparableTransactions": [
    {
      "date": "YYYY-MM-DD",
      "target": "Company name",
      "buyer": "Buyer name",
      "value": "Transaction value",
      "multiple": "3.5x revenue" or similar
    }
  ],
  "assetValue": {
    "tangibleAssets": number (from balance sheet),
    "intangibleAssets": number (estimated brand, IP value),
    "total": number
  }
}

CRITICAL RULES:
- Base calculations on ACTUAL financial data provided
- Use industry-standard valuation methods
- Include confidence level based on data quality
- Cite sources for multiples and comparables
- If insufficient data, mark confidence as LOW`;
}

/**
 * Get empty valuation data
 */
function getEmptyValuationData(): ValuationData {
  return {
    estimatedValue: {
      low: 0,
      mid: 0,
      high: 0,
      method: 'Not available',
      confidence: 'LOW',
    },
    industryMultiples: {
      evToRevenue: 0,
      evToEbitda: 0,
      priceToEarnings: 0,
      source: 'Not available',
    },
    comparableTransactions: [],
    assetValue: {
      tangibleAssets: 0,
      intangibleAssets: 0,
      total: 0,
    },
  };
}

