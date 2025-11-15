/**
import { parseGeminiJSON } from '@/lib/utils/json-parser';
 * Exit Attractiveness Module (Module 17)
 * 
 * Assesses the company's attractiveness for potential buyers
 * 
 * @module enrichment-modules/exit-attractiveness
 */

import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import type { 
  ExitAttractiveness, 
  CompanyBasicInfo, 
  CompanyFinancialData,
  ValuationData 
} from '@/types/company-enrichment';

export interface ExitAttractivenessOptions {
  companyName: string;
  industry: string;
  basicInfo: CompanyBasicInfo;
  financialData: CompanyFinancialData;
  valuationData?: ValuationData;
}

export async function enrichExitAttractiveness(
  options: ExitAttractivenessOptions,
  genAI: GoogleGenAI
): Promise<ExitAttractiveness> {
  console.log('🚪 [Module 17] Enriching Exit Attractiveness...');

  const prompt = buildExitAttractivenessPrompt(options);

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.3,
          responseMimeType: 'application/json', // Force JSON output
        topP: 0.95,
        maxOutputTokens: 3072,
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
    const parsed = parseGeminiJSON(text);

    console.log('✅ [Module 17] Exit Attractiveness enriched');
    
    return {
      idealBuyerProfile: parsed.idealBuyerProfile || [],
      strategicValue: parsed.strategicValue || 'Unknown',
      financialValue: parsed.financialValue || 'Unknown',
      urgencyToSell: parsed.urgencyToSell || 'MEDIUM',
      sellerMotivation: parsed.sellerMotivation || 'Unknown',
      timing: parsed.timing || 'Unknown',
      marketConditions: parsed.marketConditions || 'Unknown',
    };

  } catch (error) {
    console.error('❌ [Module 17] Error:', error);
    
    return {
      idealBuyerProfile: [],
      strategicValue: 'Unknown',
      financialValue: 'Unknown',
      urgencyToSell: 'MEDIUM',
      sellerMotivation: 'Unknown',
      timing: 'Unknown',
      marketConditions: 'Unknown',
    };
  }
}

function buildExitAttractivenessPrompt(options: ExitAttractivenessOptions): string {
  const { companyName, industry, basicInfo, financialData, valuationData } = options;
  const latestYear = financialData.yearly[0];
  
  return `You are an M&A advisor. Assess the exit attractiveness and ideal buyer profile for ${companyName}.

Company Details:
- Name: ${companyName}
- Industry: ${industry}
- Description: ${basicInfo.description}
- Employees: ${basicInfo.employees || 'Unknown'}
${latestYear ? `- Revenue: €${latestYear.revenue?.toLocaleString()}` : ''}
${latestYear?.operatingProfit ? `- Operating Profit: €${latestYear.operatingProfit.toLocaleString()}` : ''}
${valuationData?.estimatedValue?.mid ? `- Estimated Value: €${valuationData.estimatedValue.mid.toLocaleString()}` : ''}

Use Google Search to assess:
1. Ideal buyer types (strategic, PE, competitor, etc.)
2. Strategic value drivers
3. Financial attractiveness
4. Market timing and conditions
5. Recent M&A activity in the sector

Return JSON:

{
  "idealBuyerProfile": [
    "Strategic buyer type 1: Description",
    "Strategic buyer type 2: Description",
    "Financial buyer type: Description"
  ],
  "strategicValue": "HIGH/MEDIUM/LOW with description of strategic value drivers",
  "financialValue": "GOOD/FAIR/POOR with description of financial attractiveness",
  "urgencyToSell": "HIGH/MEDIUM/LOW",
  "sellerMotivation": "Description of likely seller motivation",
  "timing": "EXCELLENT/GOOD/FAIR/POOR with market timing assessment",
  "marketConditions": "Description of current M&A market conditions in sector"
}

RULES:
- Be specific about buyer types
- Consider both strategic and financial buyers
- Assess realistic market timing
- Include sector-specific M&A trends
- Be honest about challenges`;
}
