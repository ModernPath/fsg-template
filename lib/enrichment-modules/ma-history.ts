/**
 * M&A History Module (Module 10)
 * 
 * Fetches M&A history, funding rounds, and ownership information
 * 
 * Data sources:
 * - Crunchbase (if available)
 * - Finnish Business Information System (YTJ)
 * - News articles and press releases (via Gemini AI grounding)
 * - Company website
 * 
 * @module enrichment-modules/ma-history
 */

import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import type { MandAHistory } from '@/types/company-enrichment';

export interface MAHistoryOptions {
  businessId: string;
  companyName: string;
  country: string;
  industry?: string;
  website?: string;
}

/**
 * Enrich M&A history for a company
 */
export async function enrichMAHistory(
  options: MAHistoryOptions,
  genAI: GoogleGenAI
): Promise<MandAHistory> {
  console.log('🔄 [Module 10] Enriching M&A History...');

  const prompt = buildMAHistoryPrompt(options);

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.2,  // Lower for factual data
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

    console.log('✅ [Module 10] M&A History enriched');
    
    return {
      previousAcquisitions: parsed.previousAcquisitions || [],
      previousDivestitures: parsed.previousDivestitures || [],
      fundingRounds: parsed.fundingRounds || [],
      ownership: parsed.ownership || {
        mainOwners: [],
        ownershipStructure: 'Unknown',
        publiclyTraded: false,
      },
    };

  } catch (error) {
    console.error('❌ [Module 10] Error:', error);
    
    // Return empty data on error
    return {
      previousAcquisitions: [],
      previousDivestitures: [],
      fundingRounds: [],
      ownership: {
        mainOwners: [],
        ownershipStructure: 'Unknown',
        publiclyTraded: false,
      },
    };
  }
}

/**
 * Build prompt for M&A history extraction
 */
function buildMAHistoryPrompt(options: MAHistoryOptions): string {
  const { businessId, companyName, country, industry, website } = options;
  
  return `You are an M&A analyst. Research the acquisition history, funding, and ownership of this company.

Company Details:
- Name: ${companyName}
- Business ID: ${businessId}
- Country: ${country}
${industry ? `- Industry: ${industry}` : ''}
${website ? `- Website: ${website}` : ''}

Use Google Search to find information from:
1. Crunchbase
2. Business registries (YTJ for Finland, Bolagsverket for Sweden)
3. News articles and press releases
4. Company announcements
5. Industry reports

Extract and return the following in JSON format:

{
  "previousAcquisitions": [
    {
      "year": 2020,
      "target": "Target Company Name",
      "value": "€500,000" or "Undisclosed",
      "description": "Brief description of the acquisition"
    }
  ],
  "previousDivestitures": [
    {
      "year": 2019,
      "asset": "Asset or business unit name",
      "buyer": "Buyer name",
      "value": "€300,000" or "Undisclosed"
    }
  ],
  "fundingRounds": [
    {
      "date": "2021-06-15",
      "type": "Seed" | "Series A" | "Series B" | "Series C" | "Bridge" | "IPO",
      "amount": "€1,000,000" or "Undisclosed",
      "investors": ["Investor 1", "Investor 2"]
    }
  ],
  "ownership": {
    "mainOwners": ["Owner 1: 60%", "Owner 2: 40%"],
    "ownershipStructure": "Privately held" | "Publicly traded" | "Family-owned" | "PE-backed",
    "publiclyTraded": false
  }
}

CRITICAL RULES:
- ONLY include VERIFIED information from reliable sources
- If no data found, return empty arrays
- Use "Undisclosed" for unknown values
- Provide source information in descriptions
- Focus on transactions in the last 5-10 years`;
}

