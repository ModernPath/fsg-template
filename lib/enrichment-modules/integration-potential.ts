/**
 * Integration Potential Module (Module 16)
 * 
 * Assesses post-acquisition integration potential
 * 
 * @module enrichment-modules/integration-potential
 */

import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import type { IntegrationPotential, CompanyBasicInfo, CompanyFinancialData } from '@/types/company-enrichment';

export interface IntegrationPotentialOptions {
  companyName: string;
  industry: string;
  basicInfo: CompanyBasicInfo;
  financialData: CompanyFinancialData;
}

export async function enrichIntegrationPotential(
  options: IntegrationPotentialOptions,
  genAI: GoogleGenAI
): Promise<IntegrationPotential> {
  console.log('🔗 [Module 16] Enriching Integration Potential...');

  const prompt = buildIntegrationPotentialPrompt(options);

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.3,
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
    const parsed = JSON.parse(text);

    console.log('✅ [Module 16] Integration Potential enriched');
    
    return {
      synergies: parsed.synergies || {
        revenueSynergies: [],
        costSynergies: [],
        estimatedSynergyValue: 'Unknown',
      },
      culturalFit: parsed.culturalFit || 'Unknown',
      integrationComplexity: parsed.integrationComplexity || 'MEDIUM',
      technologyCompatibility: parsed.technologyCompatibility || 'Unknown',
      organizationalAlignment: parsed.organizationalAlignment || 'Unknown',
      geographicOverlap: parsed.geographicOverlap || 'Unknown',
    };

  } catch (error) {
    console.error('❌ [Module 16] Error:', error);
    
    return {
      synergies: {
        revenueSynergies: [],
        costSynergies: [],
        estimatedSynergyValue: 'Unknown',
      },
      culturalFit: 'Unknown',
      integrationComplexity: 'MEDIUM',
      technologyCompatibility: 'Unknown',
      organizationalAlignment: 'Unknown',
      geographicOverlap: 'Unknown',
    };
  }
}

function buildIntegrationPotentialPrompt(options: IntegrationPotentialOptions): string {
  const { companyName, industry, basicInfo, financialData } = options;
  const latestYear = financialData.yearly[0];
  
  return `You are an M&A integration specialist. Assess the integration potential and synergies for ${companyName}.

Company Details:
- Name: ${companyName}
- Industry: ${industry}
- Description: ${basicInfo.description}
- Employees: ${basicInfo.employees || 'Unknown'}
${latestYear ? `- Revenue: €${latestYear.revenue?.toLocaleString()}` : ''}

Analyze and return JSON:

{
  "synergies": {
    "revenueSynergies": [
      "Cross-selling opportunities",
      "Market expansion",
      "Product bundling"
    ],
    "costSynergies": [
      "Shared infrastructure",
      "Economies of scale",
      "Redundancy elimination"
    ],
    "estimatedSynergyValue": "€500k-1M annually (estimated)" or "Unknown"
  },
  "culturalFit": "Description of organizational culture and fit potential",
  "integrationComplexity": "HIGH" | "MEDIUM" | "LOW",
  "technologyCompatibility": "Description of tech stack compatibility",
  "organizationalAlignment": "Description of organizational structure alignment",
  "geographicOverlap": "Description of geographic presence and overlap"
}

RULES:
- Focus on realistic, achievable synergies
- Consider both opportunities and challenges
- Assess integration complexity honestly
- Provide specific examples where possible
- Mark unknowns clearly`;
}
