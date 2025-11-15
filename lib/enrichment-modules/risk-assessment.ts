/**
 * Risk Assessment Module (Module 15)
 * 
 * Identifies business, financial, and operational risks
 * 
 * @module enrichment-modules/risk-assessment
 */

import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import type { RiskAssessment, CompanyBasicInfo, CompanyFinancialData } from '@/types/company-enrichment';

export interface RiskAssessmentOptions {
  companyName: string;
  businessId: string;
  industry: string;
  basicInfo: CompanyBasicInfo;
  financialData: CompanyFinancialData;
}

export async function enrichRiskAssessment(
  options: RiskAssessmentOptions,
  genAI: GoogleGenAI
): Promise<RiskAssessment> {
  console.log('⚠️ [Module 15] Enriching Risk Assessment...');

  const prompt = buildRiskAssessmentPrompt(options);

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

    console.log('✅ [Module 15] Risk Assessment enriched');
    
    return {
      keyRisks: parsed.keyRisks || [],
      legalIssues: parsed.legalIssues || [],
      environmentalLiabilities: parsed.environmentalLiabilities || [],
      pendingLitigation: parsed.pendingLitigation || [],
      regulatoryRisks: parsed.regulatoryRisks || [],
      customerConcentrationRisk: parsed.customerConcentrationRisk || 'MEDIUM',
      supplierDependency: parsed.supplierDependency || 'MEDIUM',
      keyPersonRisk: parsed.keyPersonRisk || 'MEDIUM',
    };

  } catch (error) {
    console.error('❌ [Module 15] Error:', error);
    
    return {
      keyRisks: [],
      legalIssues: [],
      environmentalLiabilities: [],
      pendingLitigation: [],
      regulatoryRisks: [],
      customerConcentrationRisk: 'MEDIUM',
      supplierDependency: 'MEDIUM',
      keyPersonRisk: 'MEDIUM',
    };
  }
}

function buildRiskAssessmentPrompt(options: RiskAssessmentOptions): string {
  const { companyName, businessId, industry, basicInfo, financialData } = options;
  const latestYear = financialData.yearly[0];
  
  return `You are a risk assessment analyst for M&A due diligence. Identify key risks for ${companyName}.

Company Details:
- Name: ${companyName}
- Business ID: ${businessId}
- Industry: ${industry}
- Employees: ${basicInfo.employees || 'Unknown'}
${latestYear ? `- Latest Revenue: €${latestYear.revenue?.toLocaleString()}` : ''}

Use Google Search to find:
1. Key business risks and challenges
2. Legal issues or disputes
3. Environmental liabilities
4. Pending litigation
5. Regulatory compliance risks
6. Customer concentration
7. Supplier dependencies
8. Key person dependencies

Return JSON:

{
  "keyRisks": [
    {
      "risk": "Risk description",
      "severity": "HIGH" | "MEDIUM" | "LOW",
      "mitigation": "Mitigation strategy or 'None identified'"
    }
  ],
  "legalIssues": ["Issue 1", "Issue 2"] or [],
  "environmentalLiabilities": ["Liability 1"] or [],
  "pendingLitigation": ["Case 1"] or [],
  "regulatoryRisks": [
    "GDPR compliance",
    "Industry-specific regulations"
  ],
  "customerConcentrationRisk": "HIGH/MEDIUM/LOW",
  "supplierDependency": "HIGH/MEDIUM/LOW",
  "keyPersonRisk": "HIGH/MEDIUM/LOW with description"
}

RULES:
- Focus on material risks that could impact valuation
- Use HIGH/MEDIUM/LOW severity ratings
- Include both identified and potential risks
- Be objective and factual
- Mark unknown risks clearly`;
}
