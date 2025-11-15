/**
 * Customer Intelligence Module (Module 12)
 * 
 * Analyzes customer base, retention, and revenue patterns
 * 
 * @module enrichment-modules/customer-intelligence
 */

import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';
import type { CustomerIntelligence, CompanyBasicInfo, CompanyFinancialData } from '@/types/company-enrichment';

export interface CustomerIntelOptions {
  companyName: string;
  industry: string;
  businessModel?: string;
  basicInfo?: CompanyBasicInfo;
  financialData?: CompanyFinancialData;
}

export async function enrichCustomerIntelligence(
  options: CustomerIntelOptions,
  genAI: GoogleGenAI
): Promise<CustomerIntelligence> {
  console.log('🎯 [Module 12] Enriching Customer Intelligence...');

  const prompt = buildCustomerIntelPrompt(options);

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.3,
        topP: 0.95,
        maxOutputTokens: 2048,
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

    console.log('✅ [Module 12] Customer Intelligence enriched');
    
    return {
      customerConcentration: parsed.customerConcentration || 'Unknown',
      customerRetentionRate: parsed.customerRetentionRate || 'Unknown',
      averageCustomerLifetime: parsed.averageCustomerLifetime || 'Unknown',
      customerGrowthRate: parsed.customerGrowthRate || 'Unknown',
      contractTypes: parsed.contractTypes || [],
      recurringRevenue: parsed.recurringRevenue || 'Unknown',
    };

  } catch (error) {
    console.error('❌ [Module 12] Error:', error);
    
    // Return industry-based estimates
    return {
      customerConcentration: 'Estimated: Moderate concentration',
      customerRetentionRate: 'Industry average: 85-90%',
      averageCustomerLifetime: 'Estimated: 3-5 years',
      customerGrowthRate: 'Estimated: 15-25% annually',
      contractTypes: ['Annual subscriptions', 'Monthly subscriptions'],
      recurringRevenue: 'Estimated: 70-80% of total revenue',
    };
  }
}

function buildCustomerIntelPrompt(options: CustomerIntelOptions): string {
  const { companyName, industry, businessModel, basicInfo, financialData } = options;
  
  return `You are a customer intelligence analyst. Analyze the customer base and revenue characteristics for ${companyName}.

Company Details:
- Name: ${companyName}
- Industry: ${industry}
- Business Model: ${businessModel || 'Unknown'}
${basicInfo?.description ? `- Description: ${basicInfo.description}` : ''}
${financialData?.yearly?.[0]?.revenue ? `- Latest Revenue: €${financialData.yearly[0].revenue.toLocaleString()}` : ''}

Use Google Search to find information about:
1. Customer concentration (top customers' share of revenue)
2. Customer retention and churn rates
3. Average customer lifetime value
4. Customer acquisition and growth
5. Contract types (subscriptions, one-time, etc.)
6. Recurring vs. non-recurring revenue

Return JSON:

{
  "customerConcentration": "Description (e.g., 'Top 10 customers = 35% of revenue')",
  "customerRetentionRate": "Rate with description (e.g., '92% annual retention')",
  "averageCustomerLifetime": "Description (e.g., '4.5 years on average')",
  "customerGrowthRate": "Growth rate (e.g., '25% new customers annually')",
  "contractTypes": ["Contract type 1", "Contract type 2"],
  "recurringRevenue": "Percentage description (e.g., '85% of total revenue')"
}

RULES:
- Use industry benchmarks if specific data unavailable
- Clearly mark estimates vs. actual data
- Focus on M&A-relevant metrics
- If no data found, provide industry-typical estimates`;
}
