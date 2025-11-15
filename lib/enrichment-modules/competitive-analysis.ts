/**
 * Competitive Analysis Module (Module 4)
 * 
 * @module enrichment-modules/competitive-analysis
 */

import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import type { CompetitiveAnalysis } from '@/types/company-enrichment';

export interface CompetitiveAnalysisOptions {
  companyName: string;
  industry: string;
  country: string;
}

export async function enrichCompetitiveAnalysis(
  options: CompetitiveAnalysisOptions,
  genAI: GoogleGenAI
): Promise<CompetitiveAnalysis> {
  console.log('⚔️ [Module 4] Enriching Competitive Analysis...');

  const prompt = `You are a competitive intelligence analyst. Analyze the competitive landscape for ${options.companyName}.

Company: ${options.companyName}
Industry: ${options.industry}
Country: ${options.country}

Use Google Search to find:
1. Main competitors in the ${options.industry} industry
2. Market positioning and differentiation
3. Company's strengths and weaknesses
4. Market share estimates

Return JSON:

{
  "competitiveLandscape": "Description of competitive landscape (200 words)",
  "keyCompetitors": [
    {
      "name": "Competitor name",
      "description": "Brief description",
      "marketPosition": "Market leader/Challenger/Niche",
      "estimatedRevenue": "Revenue estimate if available"
    }
  ],
  "marketShare": "Market share description",
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "weaknesses": ["Weakness 1", "Weakness 2"]
}

RULES:
- Focus on direct competitors
- Be objective about strengths/weaknesses
- Use reliable sources
- Mark unknowns clearly`;

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 3072,
        responseMimeType: 'application/json',
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
      tools: [{ googleSearch: {} }],
    });

    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text());

    console.log('✅ [Module 4] Competitive analysis enriched');
    
    return {
      competitiveLandscape: parsed.competitiveLandscape || '',
      keyCompetitors: parsed.keyCompetitors || [],
      marketShare: parsed.marketShare || '',
      strengths: parsed.strengths || [],
      weaknesses: parsed.weaknesses || [],
    };
  } catch (error) {
    console.error('❌ [Module 4] Error:', error);
    return {
      competitiveLandscape: '',
      keyCompetitors: [],
      marketShare: '',
      strengths: [],
      weaknesses: [],
    };
  }
}

