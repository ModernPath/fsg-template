/**
 * Web Presence Module (Module 9)
 * 
 * @module enrichment-modules/web-presence
 */

import { GoogleGenAI } from '@google/genai';
import type { WebPresence } from '@/types/company-enrichment';

export interface WebPresenceOptions {
  companyName: string;
  website?: string;
}

export async function enrichWebPresence(
  options: WebPresenceOptions,
  genAI: GoogleGenAI
): Promise<WebPresence> {
  console.log('🌐 [Module 9] Enriching Web Presence...');

  if (!options.website) {
    return {
      website: null,
      websiteQuality: 'No website found',
      seoRanking: 0,
      contentQuality: '',
      customerTestimonials: [],
    };
  }

  const prompt = `Analyze web presence for ${options.companyName}.
Website: ${options.website}

Use Google Search to find:
1. Website quality assessment
2. SEO ranking indicators
3. Content quality (blog, case studies, resources)
4. Customer testimonials and reviews

Return JSON:

{
  "websiteQuality": "Quality assessment (Professional/Good/Basic/Poor)",
  "seoRanking": number (0-100 estimate),
  "contentQuality": "Content quality description",
  "customerTestimonials": ["Testimonial 1", "Testimonial 2"]
}`;

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
      },
      tools: [{ googleSearch: {} }],
    });

    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text());

    console.log('✅ [Module 9] Web presence enriched');
    
    return {
      website: options.website,
      websiteQuality: parsed.websiteQuality || '',
      seoRanking: parsed.seoRanking || 0,
      contentQuality: parsed.contentQuality || '',
      customerTestimonials: parsed.customerTestimonials || [],
    };
  } catch (error) {
    console.error('❌ [Module 9] Error:', error);
    return {
      website: options.website,
      websiteQuality: '',
      seoRanking: 0,
      contentQuality: '',
      customerTestimonials: [],
    };
  }
}

