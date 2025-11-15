/**
 * Financial Health Module (Module 6)
 * 
 * @module enrichment-modules/financial-health
 */

import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import type { FinancialHealth, CompanyFinancialData } from '@/types/company-enrichment';

export interface FinancialHealthOptions {
  companyName: string;
  businessId: string;
  financialData: CompanyFinancialData;
  country: string;
}

export async function enrichFinancialHealth(
  options: FinancialHealthOptions,
  genAI: GoogleGenAI
): Promise<FinancialHealth> {
  console.log('💚 [Module 6] Enriching Financial Health...');

  // If no financial data, return empty
  if (!options.financialData.yearly || options.financialData.yearly.length === 0) {
    return {
      rating: 'Not available',
      creditScore: 'Not available',
      stability: '',
      cashFlow: '',
      paymentBehavior: '',
    };
  }

  const latestYear = options.financialData.yearly[0];
  const prompt = `Analyze financial health for ${options.companyName} (${options.businessId}) in ${options.country}.

Latest Financial Data (${latestYear.year}):
- Revenue: ${latestYear.revenue}
- Operating Profit: ${latestYear.operatingProfit}
- Equity Ratio: ${latestYear.equityRatio}%
- ROE: ${latestYear.returnOnEquity}%

Use Google Search to find credit rating and payment behavior. Return JSON:

{
  "rating": "A-E rating or description",
  "creditScore": "Score or description",
  "stability": "Financial stability assessment",
  "cashFlow": "Cash flow situation",
  "paymentBehavior": "Payment behavior description"
}`;

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
      },
      tools: [{ googleSearch: {} }],
    });

    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text());

    console.log('✅ [Module 6] Financial health enriched');
    
    return {
      rating: parsed.rating || 'Not available',
      creditScore: parsed.creditScore || 'Not available',
      stability: parsed.stability || '',
      cashFlow: parsed.cashFlow || '',
      paymentBehavior: parsed.paymentBehavior || '',
    };
  } catch (error) {
    console.error('❌ [Module 6] Error:', error);
    return {
      rating: 'Not available',
      creditScore: 'Not available',
      stability: '',
      cashFlow: '',
      paymentBehavior: '',
    };
  }
}

