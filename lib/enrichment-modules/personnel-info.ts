/**
 * Personnel Info Module (Module 7)
 * 
 * @module enrichment-modules/personnel-info
 */

import { GoogleGenAI } from '@google/generative-ai';
import type { PersonnelInfo, CompanyBasicInfo } from '@/types/company-enrichment';

export interface PersonnelInfoOptions {
  companyName: string;
  businessId: string;
  basicInfo: CompanyBasicInfo;
}

export async function enrichPersonnelInfo(
  options: PersonnelInfoOptions,
  genAI: GoogleGenAI
): Promise<PersonnelInfo> {
  console.log('👥 [Module 7] Enriching Personnel Info...');

  const prompt = `Find personnel information for ${options.companyName} (${options.businessId}).

Current employees: ${options.basicInfo.employees || 'Unknown'}

Use Google Search to find:
1. Current employee count
2. Growth trend
3. Key management (CEO, CTO, CFO)
4. Board members

Return JSON:

{
  "count": number or null,
  "trend": "Growing/Stable/Decreasing with details",
  "keyManagement": ["CEO: Name", "CTO: Name"],
  "boardMembers": ["Chair: Name", "Member: Name"],
  "source": "Source of information"
}`;

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
      },
      tools: [{ googleSearch: {} }],
    });

    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text());

    console.log('✅ [Module 7] Personnel info enriched');
    
    return {
      count: parsed.count || options.basicInfo.employees || null,
      trend: parsed.trend || '',
      keyManagement: parsed.keyManagement || [],
      boardMembers: parsed.boardMembers || [],
      source: parsed.source || 'Not available',
    };
  } catch (error) {
    console.error('❌ [Module 7] Error:', error);
    return {
      count: options.basicInfo.employees || null,
      trend: '',
      keyManagement: [],
      boardMembers: [],
      source: '',
    };
  }
}

