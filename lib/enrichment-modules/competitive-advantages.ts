/**
 * Competitive Advantages Module (Module 14)
 * 
 * Identifies competitive moats and advantages
 * 
 * @module enrichment-modules/competitive-advantages
 */

import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';
import type { CompetitiveAdvantages, CompanyBasicInfo } from '@/types/company-enrichment';

export interface CompetitiveAdvantagesOptions {
  companyName: string;
  industry: string;
  basicInfo: CompanyBasicInfo;
}

export async function enrichCompetitiveAdvantages(
  options: CompetitiveAdvantagesOptions,
  genAI: GoogleGenAI
): Promise<CompetitiveAdvantages> {
  console.log('🛡️ [Module 14] Enriching Competitive Advantages...');

  const prompt = buildCompetitiveAdvantagesPrompt(options);

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

    console.log('✅ [Module 14] Competitive Advantages enriched');
    
    return {
      uniqueSellingPoints: parsed.uniqueSellingPoints || [],
      barriersToEntry: parsed.barriersToEntry || [],
      networkEffects: parsed.networkEffects || 'Unknown',
      switchingCosts: parsed.switchingCosts || 'Unknown',
      brandStrength: parsed.brandStrength || 'Unknown',
      proprietaryTechnology: parsed.proprietaryTechnology || [],
      patents: parsed.patents || { count: 0, key: [] },
      licenses: parsed.licenses || [],
    };

  } catch (error) {
    console.error('❌ [Module 14] Error:', error);
    
    return {
      uniqueSellingPoints: [],
      barriersToEntry: [],
      networkEffects: 'Unknown',
      switchingCosts: 'Unknown',
      brandStrength: 'Unknown',
      proprietaryTechnology: [],
      patents: { count: 0, key: [] },
      licenses: [],
    };
  }
}

function buildCompetitiveAdvantagesPrompt(options: CompetitiveAdvantagesOptions): string {
  const { companyName, industry, basicInfo } = options;
  
  return `You are a competitive strategy analyst. Identify sustainable competitive advantages (moats) for ${companyName}.

Company Details:
- Name: ${companyName}
- Industry: ${industry}
- Description: ${basicInfo.description}
- Products: ${basicInfo.products?.join(', ')}

Use Google Search to find:
1. Unique selling propositions and differentiators
2. Barriers that protect the company from competition
3. Network effects (if any)
4. Customer switching costs
5. Brand strength and recognition
6. Proprietary technology and IP
7. Patents and licenses

Return JSON:

{
  "uniqueSellingPoints": [
    "USP 1: Description",
    "USP 2: Description"
  ],
  "barriersToEntry": [
    "Barrier 1: Description",
    "Barrier 2: Description"
  ],
  "networkEffects": "Description of network effects or 'None identified'",
  "switchingCosts": "HIGH/MEDIUM/LOW with description",
  "brandStrength": "Description of brand position",
  "proprietaryTechnology": [
    "Technology 1",
    "Technology 2"
  ],
  "patents": {
    "count": number,
    "key": ["Patent 1 description", "Patent 2 description"]
  },
  "licenses": ["License 1", "License 2"]
}

RULES:
- Focus on sustainable, defensible advantages
- Be specific with examples
- Differentiate between strong and weak moats
- Include both existing and potential advantages`;
}
