/**
import { parseGeminiJSON } from '@/lib/utils/json-parser';
 * Market Intelligence Module (Module 8)
 * 
 * @module enrichment-modules/market-intelligence
 */

import { GoogleGenAI } from '@google/generative-ai';
import type { MarketIntelligence } from '@/types/company-enrichment';

export interface MarketIntelligenceOptions {
  companyName: string;
  website?: string;
}

export async function enrichMarketIntelligence(
  options: MarketIntelligenceOptions,
  genAI: GoogleGenAI
): Promise<MarketIntelligence> {
  console.log('📰 [Module 8] Enriching Market Intelligence...');

  const prompt = `Find recent news and market intelligence for ${options.companyName}.
${options.website ? `Website: ${options.website}` : ''}

Use Google Search to find:
1. Recent news articles (last 12 months)
2. Press releases
3. Awards and recognition
4. Partnerships and collaborations
5. Social media presence (LinkedIn, Facebook, Twitter)

Return JSON:

{
  "recentNews": ["News item 1", "News item 2"],
  "pressReleases": ["Press release 1", "Press release 2"],
  "awards": ["Award 1", "Award 2"],
  "partnerships": ["Partner 1", "Partner 2"],
  "socialMedia": {
    "linkedinFollowers": number or 0,
    "facebookLikes": number or 0,
    "twitterFollowers": number or 0
  }
}`;

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.3,
          responseMimeType: 'application/json', // Force JSON output
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
      tools: [{ googleSearch: {} }],
    });

    const result = await model.generateContent(prompt);
    const parsed = parseGeminiJSON(result.response.text());

    console.log('✅ [Module 8] Market intelligence enriched');
    
    return {
      recentNews: parsed.recentNews || [],
      pressReleases: parsed.pressReleases || [],
      awards: parsed.awards || [],
      partnerships: parsed.partnerships || [],
      socialMedia: parsed.socialMedia || {
        linkedinFollowers: 0,
        facebookLikes: 0,
        twitterFollowers: 0,
      },
    };
  } catch (error) {
    console.error('❌ [Module 8] Error:', error);
    return {
      recentNews: [],
      pressReleases: [],
      awards: [],
      partnerships: [],
      socialMedia: {
        linkedinFollowers: 0,
        facebookLikes: 0,
        twitterFollowers: 0,
      },
    };
  }
}

