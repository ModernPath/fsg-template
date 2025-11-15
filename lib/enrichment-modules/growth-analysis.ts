/**
 * Growth Analysis Module (Module 5)
 * 
 * @module enrichment-modules/growth-analysis
 */

import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import type { GrowthAnalysis, CompanyBasicInfo } from '@/types/company-enrichment';

export interface GrowthAnalysisOptions {
  companyName: string;
  industry: string;
  basicInfo: CompanyBasicInfo;
}

export async function enrichGrowthAnalysis(
  options: GrowthAnalysisOptions,
  genAI: GoogleGenAI
): Promise<GrowthAnalysis> {
  console.log('📈 [Module 5] Enriching Growth Analysis...');

  const prompt = `You are a growth strategy analyst. Analyze growth opportunities for ${options.companyName} in ${options.industry}.

Company: ${options.companyName}
Industry: ${options.industry}
Description: ${options.basicInfo.description}
Products: ${options.basicInfo.products?.join(', ')}

Use Google Search to find growth opportunities and return JSON:

{
  "growthOpportunities": ["Opportunity 1", "Opportunity 2", "Opportunity 3"],
  "businessModel": "Business model description",
  "revenueStreams": ["Stream 1", "Stream 2", "Stream 3"],
  "expansionPotential": "Expansion potential description"
}`;

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
      tools: [{ googleSearch: {} }],
    });

    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text());

    console.log('✅ [Module 5] Growth analysis enriched');
    
    return {
      growthOpportunities: parsed.growthOpportunities || [],
      businessModel: parsed.businessModel || '',
      revenueStreams: parsed.revenueStreams || [],
      expansionPotential: parsed.expansionPotential || '',
    };
  } catch (error) {
    console.error('❌ [Module 5] Error:', error);
    return {
      growthOpportunities: [],
      businessModel: '',
      revenueStreams: [],
      expansionPotential: '',
    };
  }
}

