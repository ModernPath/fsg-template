/**
 * Operational Efficiency Module (Module 13)
 * 
 * Calculates operational efficiency metrics
 * 
 * @module enrichment-modules/operational-efficiency
 */

import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';
import type { OperationalEfficiency, CompanyFinancialData, PersonnelInfo } from '@/types/company-enrichment';

export interface OperationalEfficiencyOptions {
  companyName: string;
  industry: string;
  financialData: CompanyFinancialData;
  personnelInfo?: PersonnelInfo;
}

export async function enrichOperationalEfficiency(
  options: OperationalEfficiencyOptions,
  genAI: GoogleGenAI
): Promise<OperationalEfficiency> {
  console.log('⚙️ [Module 13] Enriching Operational Efficiency...');

  const latestYear = options.financialData.yearly[0];
  
  if (!latestYear) {
    console.warn('⚠️ [Module 13] No financial data available');
    return getEmptyOperationalEfficiency();
  }

  // Calculate basic metrics from financial data
  const employeeCount = options.personnelInfo?.count || null;
  const revenue = latestYear.revenue || 0;
  const operatingProfit = latestYear.operatingProfit || 0;
  const totalAssets = latestYear.totalAssets || 0;

  const calculatedMetrics = {
    revenuePerEmployee: employeeCount && revenue ? revenue / employeeCount : 0,
    profitPerEmployee: employeeCount && operatingProfit ? operatingProfit / employeeCount : 0,
    assetTurnover: totalAssets ? revenue / totalAssets : 0,
  };

  const prompt = buildOperationalEfficiencyPrompt(options, calculatedMetrics);

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.2,
        topP: 0.95,
        maxOutputTokens: 1024,
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

    console.log('✅ [Module 13] Operational Efficiency enriched');
    
    return {
      revenuePerEmployee: calculatedMetrics.revenuePerEmployee,
      profitPerEmployee: calculatedMetrics.profitPerEmployee,
      assetTurnover: calculatedMetrics.assetTurnover,
      inventoryTurnover: parsed.inventoryTurnover || null,
      workingCapitalCycle: parsed.workingCapitalCycle || 45,
      automationLevel: parsed.automationLevel || 'Unknown',
    };

  } catch (error) {
    console.error('❌ [Module 13] Error:', error);
    
    return {
      revenuePerEmployee: calculatedMetrics.revenuePerEmployee,
      profitPerEmployee: calculatedMetrics.profitPerEmployee,
      assetTurnover: calculatedMetrics.assetTurnover,
      inventoryTurnover: null,
      workingCapitalCycle: 45,
      automationLevel: 'Unknown',
    };
  }
}

function buildOperationalEfficiencyPrompt(
  options: OperationalEfficiencyOptions,
  calculatedMetrics: any
): string {
  const { companyName, industry, financialData, personnelInfo } = options;
  const latestYear = financialData.yearly[0];
  
  return `You are an operational efficiency analyst. Provide additional operational metrics for ${companyName}.

Company Details:
- Name: ${companyName}
- Industry: ${industry}
- Employees: ${personnelInfo?.count || 'Unknown'}
- Latest Revenue: €${latestYear.revenue?.toLocaleString()}

Calculated Metrics:
- Revenue per Employee: €${calculatedMetrics.revenuePerEmployee.toFixed(0)}
- Profit per Employee: €${calculatedMetrics.profitPerEmployee.toFixed(0)}
- Asset Turnover: ${calculatedMetrics.assetTurnover.toFixed(2)}x

Use Google Search to estimate:
1. Inventory turnover (if applicable to industry)
2. Working capital cycle in days
3. Level of automation and technology adoption

Return JSON:

{
  "inventoryTurnover": number or null (if not applicable),
  "workingCapitalCycle": number (days),
  "automationLevel": "High/Medium/Low with description"
}

RULES:
- Use industry benchmarks if specific data unavailable
- Mark null for non-applicable metrics
- Provide context in descriptions`;
}

function getEmptyOperationalEfficiency(): OperationalEfficiency {
  return {
    revenuePerEmployee: 0,
    profitPerEmployee: 0,
    assetTurnover: 0,
    inventoryTurnover: null,
    workingCapitalCycle: 45,
    automationLevel: 'Unknown',
  };
}
