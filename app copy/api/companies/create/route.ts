import { NextRequest, NextResponse } from 'next/server';
import { getCurrencyCode, isSwedishCompany } from '@/lib/utils/currency-utils';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";
import { inngest } from '@/lib/inngest-client';

// Initialize Gemini Client
const geminiApiKey = process.env.GOOGLE_AI_STUDIO_KEY || process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  console.error('Missing GOOGLE_AI_STUDIO_KEY or GEMINI_API_KEY environment variable.');
  console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('GOOGLE') || k.includes('GEMINI')));
}

// For GoogleSearch grounding
const genaiClient = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

// Service role client that bypasses RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);


/**
 * Enriches company data using Gemini API with Google Search grounding.
 * Accepts ytjData to provide better context and locale for language-specific searches.
 */
async function enrichCompanyData(
    companyName: string,
    ytjData?: any,
    locale: string = 'en',
    scrapedData?: any
): Promise<any> {
    if (!companyName) {
        console.error('Cannot enrich company data: Missing company name');
        return null;
    }

    console.log(`Enriching data for company: ${companyName} in locale: ${locale}`);
    
    // Format YTJ data for context if available
    let ytjContext = '';
    if (ytjData && Object.keys(ytjData).length > 0) {
        console.log('Using YTJ data for enrichment context:', ytjData);
        
        // Build a readable context from YTJ data
        ytjContext = `
YTJ (Business Information System) data for this company:
- Registration Date: ${ytjData.registrationDate || 'Unknown'}
- Business ID: ${companyName.includes('(') ? companyName.split('(')[1].replace(')', '') : 'Unknown'}
- Status: ${ytjData.status || 'Unknown'}
- Company form: ${ytjData.companyForm || 'Unknown'}
- Main business line: ${ytjData.mainBusinessLine || 'Unknown'}
- Website: ${ytjData.website || 'Unknown'}
`;

        // Add address information if available
        if (ytjData.address || ytjData.street || ytjData.city) {
            ytjContext += `
- Address: ${ytjData.address || ''} 
  ${ytjData.street || ''} ${ytjData.buildingNumber || ''}
  ${ytjData.postCode || ''} ${ytjData.city || ''}
  ${ytjData.countryCode || 'Finland'}
`;
        }
        
        // Add postal address if different from main address
        if (ytjData.postalAddress && ytjData.postalAddress !== ytjData.address) {
            ytjContext += `
- Postal Address: ${ytjData.postalAddress || ''} 
  ${ytjData.postalStreet || ''} ${ytjData.postalBuilding || ''}
  ${ytjData.postalPostCode || ''} ${ytjData.postalCity || ''}
`;
        }
    } else {
        console.log('No YTJ data available for context');
        ytjContext = `Note: This company is not found in the YTJ (Business Information System) database or was manually entered.\n`;
    }
    
    // Extract the pure company name without business ID if present
    const pureName = companyName.includes('(') ? companyName.split('(')[0].trim() : companyName;
    
    // Language-specific search terms and instructions
    const languageConfig = {
        fi: {
            searchTerms: `"${pureName}" Finland suomi yritys liikevaihto talous`,
            sources: [
                'Finder.fi - Yritystietohakemisto (erityisesti taloustiedot)',
                'Asiakastieto.fi - Luottotietopalvelu', 
                'Kauppalehti.fi - Talouslehti',
                'Taloussanomat.fi - Talousuutiset',
                'Yrityksen virallinen verkkosivusto'
            ],
            instructions: 'Hae tietoja suomeksi ja anna vastaukset suomeksi. Etsi erityisesti taloustietoja (liikevaihto, tulos, henkilöstömäärä).',
            responseLanguage: 'suomeksi'
        },
        en: {
            searchTerms: `"${pureName}" Finland company revenue financial`,
            sources: [
                'The official company website (most authoritative)',
                'Finder.fi - Business directory (especially for financial data)',
                'Asiakastieto.fi - Credit information service',
                'Kauppalehti.fi - Business newspaper',
                'Taloussanomat - Financial news'
            ],
            instructions: 'Search for information in English and provide responses in English.',
            responseLanguage: 'in English'
        },
        sv: {
            searchTerms: `"${pureName}" Sweden svenskt företag omsättning finansiell ekonomi årsredovisning`,
            sources: [
                'Bolagsverket.se - Företagsregistret (officiell myndighet)',
                'Allabolag.se - Företagsinformation och finansdata', 
                'Ratsit.se - Företags- och kreditupplysningar',
                'Proff.se - Företagsinformation och marknadsanalys',
                'UC.se - Kreditupplysning och riskbedömning',
                'Bisnode.se - Företagsinformation och analys',
                'Retriever Business.se - Finansiell information',
                'Företagets officiella webbplats',
                'LinkedIn företagssida',
                'Branschorganisationer och förbund'
            ],
            instructions: 'Sök omfattande information på svenska. Prioritera: 1) Officiella register (Bolagsverket), 2) Finansiella databaser (Allabolag, UC), 3) Företagets egen webbplats. Fokusera på omsättning, resultat, anställda, bransch och marknadsinformation.',
            responseLanguage: 'på svenska'
        }
    };

    const config = languageConfig[locale as keyof typeof languageConfig] || languageConfig.en;
    
    try {
        if (!geminiApiKey || !genaiClient) {
            console.error('Gemini API key or client not configured');
            return null;
        }

        console.log(`Using Google Search grounding with Gemini API for locale: ${locale}`);
        
        // Craft a prompt that instructs Gemini to search for financial data using specific sources
        const isSwedishCompany = locale === 'sv';
        const countryContext = isSwedishCompany ? 'Sweden' : 'Finland';
        
        const prompt = `
I need comprehensive business intelligence about a company based in ${countryContext}. ${config.instructions}

${ytjContext}

For this company "${pureName}", perform a deep analysis and provide detailed information in JSON format:

## CORE BUSINESS ANALYSIS
1. Company description, products/services, and market position
2. Key strengths and competitive advantages
3. Market share and industry standing
4. Recent business developments and news

## FINANCIAL INTELLIGENCE
5. Detailed financial information from the last 3 years including:
   - Revenue/omsättning trends and growth patterns
   - Profitability metrics (EBITDA, operating profit, net profit)
   - Financial ratios and performance indicators
   - Cash flow patterns if available
6. Credit rating and financial stability indicators

## COMPETITIVE LANDSCAPE
7. Top 3-5 direct competitors with brief descriptions
8. Market positioning relative to competitors
9. Competitive advantages and differentiators

## MARKET CONTEXT
10. Industry trends affecting this company
11. Growth opportunities and challenges
12. Market size and company's position

Search extensively using these terms: "${config.searchTerms}" and focus on these ${isSwedishCompany ? 'Swedish' : 'Finnish'} business sources:
${config.sources.map((source, index) => `${index + 1}. ${source}`).join('\n')}

IMPORTANT: Use Google Search to find the exact URLs for this company on:
${isSwedishCompany ? `- Bolagsverket.se (format: site:bolagsverket.se "${pureName}")
- Allabolag.se (format: site:allabolag.se "${pureName}")
- Ratsit.se (format: site:ratsit.se "${pureName}")
- Proff.se (format: site:proff.se "${pureName}")` : `- Asiakastieto.fi (format: site:asiakastieto.fi "${pureName}")
- Kauppalehti.fi (format: site:kauppalehti.fi "${pureName}")  
- Finder.fi (format: site:finder.fi "${pureName}")`}
- Company's official website: ${ytjData?.website || 'search for official website'}

Once you find the specific URLs through search, use the URL context tool to analyze the detailed company pages, financial reports, and business directory entries for comprehensive insights. This two-step approach (search then deep URL analysis) will provide the most accurate and comprehensive business intelligence.

Format your response as a valid JSON object with the following enhanced structure (provide all text content ${config.responseLanguage}):
{
  "description": "Comprehensive company description including business model and strategy ${config.responseLanguage}",
  "products": ["Detailed product/service 1 ${config.responseLanguage}", "Detailed product/service 2 ${config.responseLanguage}"],
  "industry": "Specific industry classification with details ${config.responseLanguage}",
  "market": "Market position, size, and competitive landscape ${config.responseLanguage}",
  "strengths": ["Key strength 1 ${config.responseLanguage}", "Key strength 2 ${config.responseLanguage}"],
  "key_competitors": [
    {
      "name": "Competitor 1 name",
      "description": "Brief description of competitor ${config.responseLanguage}",
      "market_position": "How they compare ${config.responseLanguage}"
    }
  ],
  "website": "Company website if found",
  "recent_news": ["Recent development 1 ${config.responseLanguage}", "Recent development 2 ${config.responseLanguage}"],
  "financial_health": {
    "rating": "<A-E rating based on available data or 'Not available'>",
    "credit_score": "<Credit score if available or 'Not available'>",
    "stability": "<Financial stability assessment ${config.responseLanguage}>",
    "cash_flow": "<Cash flow situation assessment ${config.responseLanguage}>"
  },
  "personnel": {
    "count": <Number of employees as number or null>,
    "trend": "<growing/stable/decreasing with details ${config.responseLanguage}>",
    "key_management": ["Key manager 1", "Key manager 2"],
    "source": "<Source of personnel data>"
  },
  "market_analysis": {
    "industry_trends": ["Trend 1 ${config.responseLanguage}", "Trend 2 ${config.responseLanguage}"],
    "growth_opportunities": ["Opportunity 1 ${config.responseLanguage}", "Opportunity 2 ${config.responseLanguage}"],
    "challenges": ["Challenge 1 ${config.responseLanguage}", "Challenge 2 ${config.responseLanguage}"],
    "market_size": "<Market size description ${config.responseLanguage}>"
  }
}
}

CRITICAL REQUIREMENTS - DATA ACCURACY AND RELIABILITY:

🚨 ABSOLUTELY FORBIDDEN: NEVER fabricate, estimate, or guess any financial figures, numbers, or specific data points.

DATA SOURCING REQUIREMENTS:
- STEP 1: Use Google Search to discover exact URLs for this company on ${isSwedishCompany ? 'Swedish' : 'Finnish'} business sites
- STEP 2: Use URL Context tool to deeply analyze the discovered pages
- STEP 3: Only report data that is explicitly found in reliable sources

🚨 CRITICAL: FINANCIAL NUMBERS ARE HANDLED BY SPECIALIZED SCRAPERS
- DO NOT extract any financial numbers (revenue, profit, assets, liabilities, etc.)
- DO NOT include "financials" array in your response
- Focus ONLY on textual business information: industry, description, products, market analysis
- Financial metrics will be obtained separately through specialized scraping systems

TEXTUAL DATA TO FOCUS ON:
${isSwedishCompany ? `- Search on Allabolag.se, UC.se, Proff.se, and Ratsit.se for TEXTUAL company information
- Industry classification and business description
- Products and services (textual descriptions only)
- Market positioning and competitive landscape
- Company history and founding information
- Key management and organizational structure` : `- Search on Finder.fi, Asiakastieto.fi, and Kauppalehti.fi for TEXTUAL company information
- Industry classification and business description (toimiala, kuvaus)
- Products and services (tuotteet ja palvelut - textual descriptions only)
- Market positioning and competitive landscape (markkina-asema, kilpailijat)
- Company history and founding information (yrityksen historia, perustamisvuosi)
- Key management and organizational structure (johto, organisaatio)`}

DATA RELIABILITY RULES:
- Use "Not available" instead of guesses or estimates
- Always include the specific source for each piece of information
- If search results are unreliable or contradictory, mark as "Conflicting sources - verification needed"
- Include specific URLs where data was found

OUTPUT FORMAT:
- Ensure all descriptive content is provided ${config.responseLanguage}
- When you find specific business directory URLs, analyze them thoroughly for company descriptions and market positioning
- EXCLUDE all financial numbers - they will be obtained through specialized systems

QUALITY OVER QUANTITY: Better to have limited verified data than extensive unverified information.
`;

        // Use Google Search grounding and URL context for comprehensive analysis with retry logic
        let response;
        let retries = 3;
        
        while (retries > 0) {
            try {
                console.log(`Attempting Gemini API call, retries left: ${retries}`);
                response = await Promise.race([
                    genaiClient.models.generateContent({
                        model: "gemini-2.5-flash-lite",
                        contents: [
                            prompt
                        ],
                        config: {
                            tools: [
                                { googleSearch: {} }, // Enable Google Search grounding
                                { urlContext: {} } as any    // Enable URL context for deep analysis
                            ],
                            temperature: 0.2,
                            maxOutputTokens: 16384, // Increased to 16k for maximum comprehensive analysis
                            systemInstruction: "You are a comprehensive business analyst. Provide detailed, thorough analysis without truncating responses.",
                        },
                    }),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Gemini API timeout after 120 seconds')), 120000)
                    )
                ]) as any; // Type assertion for Promise.race result
                break; // Success, exit retry loop
            } catch (error: any) {
                retries--;
                console.log(`Gemini API error (${retries} retries left):`, error.message);
                
                if (error.message?.includes('503') || error.message?.includes('overloaded')) {
                    if (retries > 0) {
                        const waitTime = (4 - retries) * 5000; // 5s, 10s, 15s
                        console.log(`API overloaded, waiting ${waitTime}ms before retry...`);
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                        continue;
                    }
                }
                
                if (retries === 0) {
                    console.log('All retries exhausted, returning fallback data with retry recommendation');
                    // Return minimal fallback data with retry suggestion
                    if (isSwedishCompany) {
                        return {
                            analysis: `Grundläggande företagsinformation för ${pureName}. Tekniska begränsningar förhindrade detaljerad datahämtning. Rekommendation: Försök igen om några minuter för mer omfattande företagsanalys.`,
                            description: `${pureName} är ett svenskt företag. Detaljerad beskrivning kunde inte hämtas på grund av tekniska problem.`,
                            industry: 'Ej specificerat - kräver ny sökning',
                            keyCompetitors: [],
                            products: ['Information inte tillgänglig - försök igen senare'],
                            market: 'Information inte tillgänglig - automatisk datahämtning misslyckades',
                            website: null,
                            financial_health: {
                                rating: 'Inte tillgänglig',
                                credit_score: 'Inte tillgänglig', 
                                stability: 'Finansiell datahämtning misslyckades - försök igen om några minuter',
                                cash_flow: 'Inte tillgänglig'
                            },
                            personnel: {
                                count: null,
                                trend: 'Information kunde inte hämtas automatiskt',
                                key_management: [],
                                source: 'Datahämtning misslyckades'
                            },
                            market_analysis: {
                                industry_trends: ['Marknadsanalys kunde inte genomföras - försök igen senare'],
                                growth_opportunities: ['Detaljerad analys kräver ny datahämtning'],
                                challenges: ['Information inte tillgänglig på grund av tekniska problem'],
                                market_size: 'Inte tillgänglig'
                            },
                            recent_news: [],
                            strengths: ['Information inte tillgänglig']
                        };
                    } else {
                        return {
                            analysis: `Perustiedot yrityksestä ${pureName}. Teknisten rajoitusten vuoksi emme voineet hakea yksityiskohtaisia tietoja tällä hetkellä.`,
                            description: `${pureName} on suomalainen yritys.`,
                            industry: 'Ei määritelty',
                            keyCompetitors: [],
                            products: 'Tietoja ei saatavilla',
                            market: 'Tietoja ei saatavilla',
                            website: null,
                            financialData: {
                                yearly: [],
                                ratios: {}
                            }
                        };
                    }
                }
            }
        }

        // Extract the generated text response - check multiple ways to access the text
        let text = "";
        if (response.text) {
            text = response.text;
        } else if (response.candidates && response.candidates.length > 0) {
            const candidate = response.candidates[0];
            if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                text = candidate.content.parts.map((part: any) => part.text).join('');
            }
        }
        console.log('Raw Gemini response:', text);
        console.log('🤖 [Company Create] Response structure:', {
            hasText: !!response.text,
            hasCandidates: !!(response.candidates && response.candidates.length > 0),
            candidateCount: response.candidates?.length || 0,
            firstCandidateHasContent: !!(response.candidates?.[0]?.content),
            firstCandidatePartsCount: response.candidates?.[0]?.content?.parts?.length || 0
        });

        // Check for safety filtering or other blocking reasons
        if (response.candidates && response.candidates.length > 0) {
            const candidate = response.candidates[0];
            if (candidate.finishReason) {
                console.log('🛡️ [Company Create] Finish reason:', candidate.finishReason);
            }
            if (candidate.safetyRatings) {
                console.log('🛡️ [Company Create] Safety ratings:', JSON.stringify(candidate.safetyRatings));
            }
            
            // If content was blocked, provide informative message using scraped data if available
            if (candidate.finishReason === 'SAFETY' || candidate.finishReason === 'BLOCKED_REASON') {
                console.log('⚠️ [Company Create] Content was blocked by safety filters');
                
                if (scrapedData && isSwedishCompany) {
                    console.log('✅ [Company Create] Using scraped data despite safety filtering');
                    
                    const financials = scrapedData.financials?.[0];
                    const personnel = scrapedData.personnel;
                    const employees = personnel?.count;
                    
                    return {
                        analysis: `Företagsanalys för ${pureName} baserad på offentlig data (AI-analys blockerad av säkerhetsfilter):\n\n` +
                                 `Grundläggande finansiell information från Allabolag.se är tillgänglig. ${employees ? `Företaget har ${employees} anställda.` : ''}`,
                        description: `${pureName} är ett svenskt ${scrapedData.industry || 'företag'}. Detaljerad AI-analys begränsades av säkerhetsfilter, men grundläggande information är tillgänglig.`,
                        industry: scrapedData.industry || 'Begränsad information',
                        keyCompetitors: [],
                        products: [`Produkter inom ${scrapedData.industry || 'företagets bransch'}`],
                        market: 'AI-analys blockerad - grundläggande marknadsinfo tillgänglig',
                        website: null,
                        financialData: financials ? {
                            yearly: [{
                                year: financials.year || new Date().getFullYear(),
                                revenue: financials.revenue,
                                profit: financials.profit,
                                employees: personnel?.count,
                                currency: 'SEK',
                                source: 'Allabolag.se'
                            }],
                            ratios: {
                                profitMargin: financials?.profit_margin,
                                solidityRatio: financials?.solidity_ratio
                            }
                        } : undefined,
                        metadata: {
                            enrichment_status: 'safety_filtered_with_scraped_data',
                            blocked_reason: candidate.finishReason,
                            safety_ratings: candidate.safetyRatings,
                            data_source: 'Allabolag.se'
                        }
                    };
                } else {
                    return {
                        analysis: isSwedishCompany 
                            ? `Företagsanalys för ${pureName} kunde inte slutföras på grund av säkerhetsfilter. Grundläggande företagsinformation är tillgänglig.`
                            : `Yritysanalyysi yritykselle ${pureName} ei voitu suorittaa loppuun turvallisuussuodattimien vuoksi. Perustiedot ovat saatavilla.`,
                        description: isSwedishCompany
                            ? `${pureName} är ett svenskt företag. Detaljerad analys begränsad av säkerhetsfilter.`
                            : `${pureName} on ruotsalainen yritys. Yksityiskohtainen analyysi rajoitettu turvallisuussuodattimien vuoksi.`,
                        industry: 'Begränsad information',
                        keyCompetitors: [],
                        products: ['Information begränsad av säkerhetsfilter'],
                        market: 'Analys inte tillgänglig',
                        website: null,
                        metadata: {
                            enrichment_status: 'safety_filtered_basic',
                            blocked_reason: candidate.finishReason,
                            safety_ratings: candidate.safetyRatings
                        }
                    };
                }
            }
        }
        
        // Get grounding metadata for sources
        if (response.candidates && response.candidates.length > 0 && 
            response.candidates[0].groundingMetadata?.searchEntryPoint?.renderedContent) {
            console.log('Grounding sources:', response.candidates[0].groundingMetadata.searchEntryPoint.renderedContent);
        }
        
        // Get URL context metadata for accessed URLs
        if (response.candidates && response.candidates.length > 0 && 
            response.candidates[0].urlContextMetadata) {
            console.log('URL context metadata:', response.candidates[0].urlContextMetadata);
        }

        try {
            // Extract JSON from the response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            const jsonString = jsonMatch ? jsonMatch[0] : null;
            
            if (!jsonString) {
                console.error('No JSON found in Gemini response');
                console.log('⚠️ [Company Create] Providing fallback enrichment data using scraped data');
                
                // Use scraped data as fallback when Gemini fails
                if (scrapedData && isSwedishCompany) {
                    console.log('✅ [Company Create] Using scraped Swedish data for enrichment fallback');
                    
                    // Extract financial metrics from scraped data
                    const financials = scrapedData.financials?.[0];
                    const personnel = scrapedData.personnel;
                    
                    // Format revenue and profit for display
                    const formatSEK = (amount: string) => {
                        if (!amount || amount === 'Not available') return null;
                        const num = parseInt(amount);
                        if (isNaN(num)) return amount;
                        return `${(num / 1000000).toFixed(1)} miljoner SEK`;
                    };
                    
                    const revenueFormatted = formatSEK(financials?.revenue);
                    const profitFormatted = formatSEK(financials?.profit);
                    const employees = personnel?.count;
                    
                    // Build comprehensive analysis using scraped data
                    let analysis = `Företagsanalys för ${pureName} baserad på offentlig data från Allabolag.se:\n\n`;
                    
                    if (revenueFormatted) {
                        analysis += `💰 Omsättning: ${revenueFormatted}\n`;
                    }
                    if (profitFormatted) {
                        analysis += `📈 Resultat: ${profitFormatted}\n`;
                    }
                    if (employees) {
                        analysis += `👥 Anställda: ${employees} personer\n`;
                    }
                    if (financials?.profit_margin && financials.profit_margin !== 'Not available') {
                        analysis += `📊 Vinstmarginal: ${financials.profit_margin}\n`;
                    }
                    if (financials?.solidity_ratio && financials.solidity_ratio !== 'Not available') {
                        analysis += `🏦 Soliditet: ${financials.solidity_ratio}%\n`;
                    }
                    
                    analysis += `\nDenna information är hämtad från offentliga källor och ger en grundläggande översikt av företagets finansiella ställning.`;
                    
                    return {
                        analysis,
                        description: `${pureName} är ett svenskt ${scrapedData.industry || 'företag'} som är aktivt registrerat. ${employees ? `Företaget har ${employees} anställda` : ''} ${revenueFormatted ? `och en omsättning på ${revenueFormatted}` : ''}.`,
                        industry: scrapedData.industry || 'Bransch ej specificerad',
                        keyCompetitors: [],
                        products: [`Produkter och tjänster inom ${scrapedData.industry || 'företagets bransch'}`],
                        market: `Verksam på den svenska marknaden inom ${scrapedData.industry || 'sin bransch'}`,
                        website: null,
                        financialData: {
                            yearly: financials ? [{
                                year: financials.year || new Date().getFullYear(),
                                revenue: financials.revenue,
                                profit: financials.profit,
                                employees: personnel?.count,
                                currency: 'SEK',
                                source: 'Allabolag.se'
                            }] : [],
                            ratios: {
                                profitMargin: financials?.profit_margin,
                                solidityRatio: financials?.solidity_ratio,
                                liquidityRatio: financials?.liquidity_ratio
                            }
                        },
                        metadata: {
                            enrichment_status: 'scraped_fallback',
                            reason: 'gemini_response_empty_used_scraped_data',
                            data_source: 'Allabolag.se',
                            timestamp: new Date().toISOString()
                        }
                    };
                } else {
                    // Generic fallback when no scraped data available
                    return {
                        analysis: isSwedishCompany 
                            ? `Grundläggande företagsinformation för ${pureName}. Automatisk analys kunde inte slutföras, men företaget har registrerats framgångsrikt.`
                            : `Perustiedot yrityksestä ${pureName}. Automaattinen analyysi ei onnistunut, mutta yritys on rekisteröity onnistuneesti.`,
                        description: isSwedishCompany
                            ? `${pureName} är ett svenskt företag som är aktivt registrerat.`
                            : `${pureName} on suomalainen yritys joka on aktiivisesti rekisteröity.`,
                        industry: 'Tiedot saatavilla myöhemmin',
                        keyCompetitors: [],
                        products: ['Tuotetiedot päivitetään myöhemmin'],
                        market: 'Markkina-analyysi saatavilla myöhemmin',
                        website: null,
                        metadata: {
                            enrichment_status: 'basic_fallback',
                            reason: 'gemini_response_empty_no_scraped_data',
                            timestamp: new Date().toISOString()
                        }
                    };
                }
            }
            
            const jsonData = JSON.parse(jsonString);
            console.log('Parsed enriched data:', jsonData);
            
            // Add grounding and URL context metadata to the response if available
            if (response.candidates && response.candidates.length > 0) {
                jsonData.metadata = jsonData.metadata || {};
                jsonData.metadata.locale = locale; // Store the locale used for enrichment
                
                // Add grounding metadata
                if (response.candidates[0].groundingMetadata) {
                    jsonData.metadata.grounding = true;
                    if (response.candidates[0].groundingMetadata.searchEntryPoint?.renderedContent) {
                        jsonData.metadata.groundingSources = response.candidates[0].groundingMetadata.searchEntryPoint.renderedContent;
                    }
                }
                
                // Add URL context metadata
                if (response.candidates[0].urlContextMetadata) {
                    jsonData.metadata.urlContext = true;
                    jsonData.metadata.urlMetadata = response.candidates[0].urlContextMetadata;
                }
            }
            
            return jsonData;
        } catch (parseError) {
            console.error('Failed to parse Gemini response as JSON:', parseError);
            return null;
        }
    } catch (error) {
        console.error('🤖 [enrichCompanyData] Error calling Gemini API:', error);
        console.error('🤖 [enrichCompanyData] Full error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            name: error instanceof Error ? error.name : 'Unknown',
            stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined,
            geminiApiKey: !!geminiApiKey,
            genaiClient: !!genaiClient
        });
        return null;
    }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🏢 [Company Create] Processing company creation request');
    
    // 1. Parse request body
    const body = await request.json();
    console.log('🏢 [Company Create] Request body:', body);
    
    // 2. Verify required fields
    if (!body.name) {
      console.error('Missing required fields:', { name: !!body.name });
      return NextResponse.json({ error: 'Missing required field: name' }, { status: 400 });
    }
    
    // 3. Extract locale from request body (default to 'en')
    const locale = body.locale || 'en';
    console.log('Using locale for company creation:', locale);
    
    // 3. Extract and validate auth token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('Missing or invalid Authorization header');
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    console.log('Token received, verifying...');
    
    // 4. Verify token manually with anon client
    console.log('🔑 [Company Create] Creating anon client for token validation...');
    const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
    const authClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      }
    );
    
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error('🔑 [Company Create] Authentication error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('User authenticated:', user.id);
    
    // Variable to hold the company data (either existing or newly created)
    let company;
    let isExistingCompany = false;
    
    // Check if company with this business_id already exists
    console.log('Checking for existing company with business_id:', body.business_id);
    const { data: existingCompany, error: findError } = await supabaseAdmin
      .from('companies')
      .select('*')
      .eq('business_id', body.business_id)
      .maybeSingle();

    if (findError) {
      console.error('Error checking for existing company:', findError);
      // Don't block creation if find fails, proceed to insert attempt
    } else if (existingCompany) {
      console.log('Found existing company:', existingCompany.id);
      isExistingCompany = true;
      
      // If it belongs to the current user, return it
      if (existingCompany.created_by === user.id) {
        console.log('Existing company belongs to current user.');
        company = existingCompany;
        // Continue to enrichment (don't return early)
      } else {
        // Company exists but belongs to another user.
        // Allow association ONLY if the current user is an admin.
        console.log('Company exists but belongs to another user. Checking admin status...');
        
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error('Error checking admin status:', profileError);
            return NextResponse.json({ error: 'Failed to verify user permissions' }, { status: 500 });
        }

        if (profile?.is_admin) {
            console.log('User is admin. Associating existing company with this admin user.');
            company = existingCompany;
            // Continue to enrichment (don't return early)
        } else {
            // Current user is not admin, cannot associate company owned by someone else
            console.error('Conflict: Business ID registered to another user. Admin required for association.', { existingOwner: existingCompany.created_by, currentUserId: user.id });
            return NextResponse.json({ error: 'Business ID already registered to another user. Admin required to proceed.' }, { status: 409 });
        }
      }
    }

    // If no existing company found, create a new one
    if (!isExistingCompany) {
        console.log('No existing company found. Proceeding with creation...');
        
        // Extract all YTJ data from the request into a structured object (only for Finnish companies)
        const isSwedishCompany = locale === 'sv';
        const ytjData = isSwedishCompany ? {} : {
            // Basic info
            registrationDate: body.registrationDate,
            status: body.status,
            euId: body.euId,
            companyForm: body.companyForm,
            mainBusinessLine: body.mainBusinessLine,
            
            // Primary address
            address: body.address,
            postCode: body.postCode,
            city: body.city,
            street: body.street,
            buildingNumber: body.buildingNumber,
            entrance: body.entrance,
            apartmentNumber: body.apartmentNumber,
            
            // Postal address
            postalAddress: body.postalAddress,
            postalPostCode: body.postalPostCode,
            postalCity: body.postalCity,
            postalStreet: body.postalStreet,
            postalBuilding: body.postalBuilding,
            
            // Other data
            website: body.website,
            countryCode: body.countryCode
        };
        
        // Check if YTJ data has any actual content
        const hasYtjData = Object.values(ytjData).some(value => value !== undefined && value !== null && value !== '');
        
        // Log the YTJ data status
        if (hasYtjData) {
            console.log('Creating company with YTJ data:', ytjData);
        } else {
            console.log('Creating company without YTJ data. Only minimal info available.');
        }

    // DISABLED: Enrichment during company creation
    // This is now handled ONLY by the Inngest background job to prevent saving incorrect data
    // The background job uses the unified enrichment with strict anti-hallucination prompts
    let scrapedFinancialData = null;
    /*
    if (body.business_id) {
        console.log('🚀 [LAYERED SCRAPER] Activating intelligent data discovery...');
        try {
            // Use Unified Company Enrichment - comprehensive data extraction
            const { createUnifiedCompanyEnrichment } = await import('@/lib/financial-search/unified-company-enrichment');
            
            const enrichment = createUnifiedCompanyEnrichment();
            const aiResult = await enrichment.enrichCompany(
                body.business_id,
                body.name || '',
                {
                    country: body.countryCode || locale.toUpperCase(),
                    industry: body.mainBusinessLine || body.industry,
                    website: body.website
                }
            );

            if (aiResult && aiResult.confidence > 0) {
                console.log(`✅ [UNIFIED ENRICHMENT] Got data with confidence: ${aiResult.confidence}%`);
                console.log('📊 [UNIFIED ENRICHMENT] Raw data:', JSON.stringify(aiResult, null, 2));
                
                // Convert unified enrichment data to expected format
                const yearlyData = [];
                
                // Process revenue data
                if (aiResult.revenue && aiResult.revenue.length > 0) {
                    for (const revenueData of aiResult.revenue) {
                        if (revenueData.value !== null) {
                            yearlyData.push({
                                year: revenueData.year,
                                revenue: revenueData.value,
                                profit: null, // Will be filled from other arrays
                                netResult: null,
                                ebitda: null,
                                totalAssets: null,
                                equity: null,
                                currentAssets: null,
                                totalLiabilities: null,
                                solidityRatio: null,
                                quickRatio: null,
                                currentRatio: null,
                                employees: null,
                                source: revenueData.source,
                                confidence: revenueData.confidence
                            });
                        }
                    }
                }
                
                // Fill in other financial data for existing years
                const financialFields = {
                    operating_profit: 'operatingProfit',
                    net_profit: 'profit',
                    total_assets: 'totalAssets',
                    equity: 'equity',
                    total_liabilities: 'totalLiabilities'
                };
                
                for (const [field, key] of Object.entries(financialFields)) {
                    if (aiResult[field] && aiResult[field].length > 0) {
                        for (const data of aiResult[field]) {
                            if (data.value !== null) {
                                const existingYear = yearlyData.find(y => y.year === data.year);
                                if (existingYear) {
                                    existingYear[key] = data.value;
                                } else {
                                    yearlyData.push({
                                        year: data.year,
                                        revenue: null,
                                        profit: key === 'profit' ? data.value : null,
                                        netResult: null,
                                        ebitda: null,
                                        totalAssets: key === 'totalAssets' ? data.value : null,
                                        equity: key === 'equity' ? data.value : null,
                                        currentAssets: null,
                                        totalLiabilities: key === 'totalLiabilities' ? data.value : null,
                                        solidityRatio: null,
                                        quickRatio: null,
                                        currentRatio: null,
                                        employees: null,
                                        source: data.source,
                                        confidence: data.confidence
                                    });
                                }
                            }
                        }
                    }
                }

                console.log(`🧠 [UNIFIED ENRICHMENT] Processed yearly data (${yearlyData.length} years):`, JSON.stringify(yearlyData, null, 2));

                scrapedFinancialData = {
                    financials: yearlyData,
                    personnel: {
                        count: null // Unified enrichment doesn't provide employee count
                    },
                    industry: null, // Will be extracted from overview if needed
                    founded: null,
                    address: null,
                    website: null,
                    overview: aiResult.overview,
                    products: aiResult.products,
                    team: aiResult.team,
                    market: aiResult.market
                };
                
                console.log(`✅ [UNIFIED ENRICHMENT] SUCCESS!`);
                console.log(`   Confidence: ${aiResult.confidence}%`);
                console.log(`   Years of data: ${aiResult.yearsFound}`);
                console.log(`   Sources found: ${aiResult.sourcesFound.length}`);
                console.log('📊 Financial data:');
                yearlyData.forEach((year: any, index: number) => {
                    if (index < 3) { // Show first 3 years
                        console.log(`   ${year.year || 'Unknown'}: Revenue=${year.revenue || 'N/A'}, Profit=${year.profit || 'N/A'}, Assets=${year.totalAssets || 'N/A'}`);
                    }
                });
                console.log('🏢 Overview:', aiResult.overview?.substring(0, 100) + '...');
            } else {
                console.log(`⚠️ [UNIFIED ENRICHMENT] Failed to get data`);
                console.log(`   Confidence: ${aiResult?.confidence || 0}%`);
                console.log(`   Years found: ${aiResult?.yearsFound || 0}`);
            }
        } catch (aiError) {
            console.error('❌ [UNIFIED ENRICHMENT] Error:', aiError);
            // Continue without scraped data
        }
    }
    */
    // End of disabled enrichment during company creation

        // Detect country code from business_id format
        const detectCountryFromBusinessId = (businessId: string): string => {
          // Finnish: 1234567-8 (7 digits + dash + 1 digit/letter)
          if (/^\d{7}-[\dA-Za-z]$/.test(businessId)) return 'FI';
          // Swedish: 556677-8899 (6 digits + dash + 4 digits)
          if (/^\d{6}-\d{4}$/.test(businessId)) return 'SE';
          // Norwegian: 123456789 (9 digits)
          if (/^\d{9}$/.test(businessId)) return 'NO';
          // Danish: 12345678 (8 digits)
          if (/^\d{8}$/.test(businessId)) return 'DK';
          // Default to Finland
          return 'FI';
        };
        
        const countryCode = body.business_id ? detectCountryFromBusinessId(body.business_id) : 'FI';
        console.log('🌍 Detected country code:', countryCode, 'for business_id:', body.business_id);
        
        // Create company using service role (bypassing RLS)
        const { data: newCompany, error } = await supabaseAdmin
          .from('companies')
          .insert({
            name: body.name,
            business_id: body.business_id,
            country_code: countryCode,
            created_by: user.id,
            
            // Map YTJ data fields to company fields (if available)
            founded: body.registrationDate || null, // Use registrationDate for founded
            address: body.address || null,
            type: body.status || null, // Use status as company type
            
            // Additional fields from YTJ or direct user input
            industry: body.mainBusinessLine || body.industry || null, // Use mainBusinessLine for industry
            employees: body.employees || null,
            // Ensure website is properly extracted from YTJ data
            website: body.website || ytjData?.website || null,
            // Initialize contact_info from YTJ data if available
            contact_info: {
              address: body.address || ytjData?.address || null,
              postal_code: body.postCode || ytjData?.postCode || null,
              city: body.city || ytjData?.city || null,
              phone: body.phone || null, // YTJ doesn't provide phone
              email: body.email || null  // YTJ doesn't provide email
            },
            
            // Store detailed address components in metadata
            metadata: {
              ytj_data: hasYtjData ? ytjData : { status: 'not_found' },
              is_from_ytj: hasYtjData,
              country_code: countryCode // Also store in metadata for reference
            }
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating company:', error);
          return NextResponse.json({ error: 'Failed to create company' }, { status: 500 });
        }

        console.log('Company created successfully:', newCompany?.id);
        company = newCompany;

        // 🚀 PROGRESSIVE ENRICHMENT: Trigger background financial data enrichment
        try {
          console.log('🚀 [Progressive Enrichment] Triggering background enrichment for company:', company.id);
        await inngest.send({
          name: 'company/enrich.financial-data',  // ✅ Fixed: was 'company/enrichment.requested'
          data: {
            companyId: company.id,
            businessId: company.business_id,
            companyName: company.name,
            countryCode: countryCode, // Use detected country code, not locale
            userId: user.id,
            locale: locale || 'fi' // Pass locale for language-specific enrichment
          }
        });
          console.log('✅ [Progressive Enrichment] Background enrichment triggered');
        } catch (enrichmentError) {
          console.error('❌ [Progressive Enrichment] Failed to trigger enrichment:', enrichmentError);
          // Don't fail the entire operation if enrichment trigger fails
        }

        // REFERRAL TRACKING: Check for attribution and link company to partner
        console.log('🎯 [Company Create] Checking for referral attribution...')
        
        // Try to get session ID from request headers or create one
        let sessionId = request.headers.get('x-session-id')
        
        if (!sessionId) {
          // Generate a session ID for server-side tracking if not provided
          sessionId = `server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }

        // Use tracking client to check for attribution
        // Note: supabaseAdmin is already created at the top of this file
        
        // Get the most recent referral click for this session
        const { data: attribution } = await supabaseAdmin
          .from('partner_referral_clicks')
          .select(`
            *,
            partners (id, name),
            partner_referral_links (id, link_code, source_page, campaign_name)
          `)
          .eq('session_id', sessionId)
          .order('clicked_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        let partnerInfo = null
        
        if (attribution?.partner_id) {
          console.log('🎯 [Company Create] Found attribution to partner:', (attribution.partners as any)?.name)
          
          // Update company with partner attribution
          const { error: updateError } = await supabaseAdmin
            .from('companies')
            .update({
              partner_id: attribution.partner_id,
              referral_source: 'partner_referral',
              referral_click_id: attribution.id,
              referral_link_id: attribution.referral_link_id,
              attribution_data: {
                partner_id: attribution.partner_id,
                partner_name: (attribution.partners as any)?.name,
                referral_link: (attribution.partner_referral_links as any)?.link_code,
                source_page: (attribution.partner_referral_links as any)?.source_page,
                campaign_name: (attribution.partner_referral_links as any)?.campaign_name,
                attribution_date: new Date().toISOString()
              }
            })
            .eq('id', company.id)

          if (updateError) {
            console.error('❌ [Company Create] Failed to update company with attribution:', updateError)
          } else {
            console.log('✅ [Company Create] Company linked to partner:', attribution.partner_id)
            partnerInfo = {
              partner_id: attribution.partner_id,
              partner_name: (attribution.partners as any)?.name
            }
          }
        }

        // Track company creation conversion
        console.log('🎯 [Company Create] Tracking company_created conversion for company:', company.id)
        
        const { data: conversionId, error: trackError } = await supabaseAdmin
          .rpc('track_conversion', {
            p_session_id: sessionId,
            p_conversion_type: 'company_created',
            p_conversion_value: 0,
            p_company_id: company.id,
            p_user_id: user.id,
            p_metadata: {
              creation_method: 'companies_create_api',
              company_name: company.name,
              business_id: company.business_id,
              partner_attribution: partnerInfo,
              created_at: new Date().toISOString()
            }
          })

        if (trackError) {
          console.warn('⚠️ [Company Create] Failed to track company_created conversion:', trackError)
        } else {
          console.log('✅ [Company Create] Company creation conversion tracked:', conversionId)
        }
        
        // After creating the company, enrichment is handled by Inngest background job
        console.log(`✅ Company created: ${company.id}. Enrichment will be handled by Inngest background job.`);

        // DISABLED: Old enrichment during company creation
        // This caused incorrect data to be saved before the unified enrichment completed
        // Now ONLY the Inngest background job handles enrichment
        /*
        let enrichedData = null;
        try {
            console.log('🤖 [Company Create] Starting enrichment process...');
            console.log('🤖 [Company Create] Gemini API Key available:', !!geminiApiKey);
            console.log('🤖 [Company Create] GenAI Client initialized:', !!genaiClient);

            // Even if YTJ data is not available, we can still enrich with just the company name
            enrichedData = await enrichCompanyData(
                `${body.name} (${body.business_id})`,
                hasYtjData ? ytjData : undefined,
                locale, // Use the request locale for enrichment
                scrapedFinancialData // Pass scraped data for fallback enrichment
            );
            console.log('🤖 [Company Create] Enriched data received for new company:', !!enrichedData, enrichedData ? 'Data available' : 'No data');
            
            if (enrichedData) {
                // Update the new company with the enriched data
                const updatedMetadata: any = {
                    ytj_data: hasYtjData ? ytjData : { status: 'not_found' },
                    is_from_ytj: hasYtjData,
                    enriched_data: enrichedData,
                    last_enriched: new Date().toISOString()
                };
                
                // Merge scraped financial data intelligently
                if (scrapedFinancialData && scrapedFinancialData.financials) {
                    console.log('🔄 Intelligently merging financial data...');
                    
                    // Get newest year from both sources
                    const scrapedNewestYear = Math.max(...(scrapedFinancialData.financials.map((f: any) => parseInt(f.year) || 0)));
                    const enrichedNewestYear = Math.max(...(enrichedData.financials?.map((f: any) => parseInt(f.year) || 0) || [0]));
                    
                    console.log(`   Scraped newest: ${scrapedNewestYear}, Enriched newest: ${enrichedNewestYear}`);
                    
                    // 🔍 DATA VALIDATION: Compare scraped vs enriched for same year
                    if (scrapedNewestYear === enrichedNewestYear && enrichedData.financials) {
                        const scrapedLatest = scrapedFinancialData.financials.find((f: any) => parseInt(f.year) === scrapedNewestYear);
                        const enrichedLatest = enrichedData.financials.find((f: any) => parseInt(f.year) === enrichedNewestYear);
                        
                        if (scrapedLatest && enrichedLatest) {
                            const scrapedRevenue = parseFloat(scrapedLatest.revenue) || 0;
                            const enrichedRevenue = parseFloat(enrichedLatest.revenue) || 0;
                            
                            if (scrapedRevenue > 0 && enrichedRevenue > 0) {
                                const difference = Math.abs(scrapedRevenue - enrichedRevenue);
                                const percentDiff = (difference / Math.max(scrapedRevenue, enrichedRevenue)) * 100;
                                
                                console.log(`   🔍 DATA VALIDATION for year ${scrapedNewestYear}:`);
                                console.log(`      Scraped revenue: ${scrapedRevenue.toLocaleString()} EUR`);
                                console.log(`      Enriched revenue: ${enrichedRevenue.toLocaleString()} EUR`);
                                console.log(`      Difference: ${percentDiff.toFixed(1)}%`);
                                
                                // ✅ ALWAYS use scraped data (real numbers from financial statements)
                                // ❌ NEVER use Gemini data (invented/hallucinated numbers)
                                if (percentDiff > 10) {
                                    console.log(`   ⚠️ WARNING: Data mismatch > 10%! Gemini data is UNRELIABLE - using scraped data (verified).`);
                                }
                            }
                        }
                    }
                    
                    // DATA FLOW V2.0: Scraped data is ALWAYS the foundation
                    // Gemini can ONLY add NEWER years that scraped data doesn't have
                    if (enrichedNewestYear > scrapedNewestYear && enrichedData.financials) {
                        console.log(`   📊 Enrichment has newer data (${enrichedNewestYear} vs ${scrapedNewestYear})`);
                        console.log(`   🔀 MERGING: Enrichment (newest years) + Scraper (historical data)`);
                        
                        // Create a map of year -> data
                        const mergedData = new Map<string, any>();
                        
                        // First add ALL scraped data (comprehensive, older years)
                        scrapedFinancialData.financials.forEach((item: any) => {
                            mergedData.set(item.year.toString(), item);
                        });
                        
                        // Then overlay enrichment data (newer years, overwrites if duplicate)
                        enrichedData.financials?.forEach((item: any) => {
                            const year = item.year.toString();
                            const existingData = mergedData.get(year);
                            
                            if (existingData) {
                                // Merge fields: prefer non-null enrichment values, keep scraper values for missing fields
                                mergedData.set(year, {
                                    ...existingData, // Keep all scraper data
                                    ...item, // Overlay enrichment data
                                    // But preserve valuable scraper fields if enrichment has "Not available"
                                    ebitda: item.ebitda && item.ebitda !== 'Not available' ? item.ebitda : existingData.ebitda,
                                    profit: item.profit && item.profit !== 'Not available' ? item.profit : existingData.profit,
                                    net_result: item.net_result && item.net_result !== 'Not available' ? item.net_result : existingData.netResult,
                                });
                                console.log(`   ✨ Merged year ${year}: enrichment + scraper data`);
                            } else {
                                // New year from enrichment
                                mergedData.set(year, item);
                                console.log(`   ✅ Added year ${year} from enrichment`);
                            }
                        });
                        
                        // Convert map back to array, sorted by year descending
                        enrichedData.financials = Array.from(mergedData.values())
                            .sort((a, b) => parseInt(b.year) - parseInt(a.year));
                        
                        console.log(`   📈 Final dataset: ${enrichedData.financials.length} years (${enrichedData.financials.map((f: any) => f.year).join(', ')})`);
                    } else {
                        // Scraped data is same age or newer than enriched data
                        // → Use ONLY scraped data (verified financial statements)
                        console.log(`   ✅ Using ONLY scraped data (real financial statements)`);
                        enrichedData.financials = scrapedFinancialData.financials;
                    }
                    
                    // Update personnel count if available (scraper often has more accurate employee counts)
                    if (scrapedFinancialData.personnel?.count) {
                        enrichedData.personnel = enrichedData.personnel || {};
                        enrichedData.personnel.count = scrapedFinancialData.personnel.count;
                        console.log(`👥 Updated employee count from scraping: ${scrapedFinancialData.personnel.count}`);
                    }

                    // Update industry if available
                    if (scrapedFinancialData.industry) {
                        enrichedData.industry = scrapedFinancialData.industry;
                        console.log(`🏭 Updated industry from scraping: ${scrapedFinancialData.industry}`);
                    }
                }

                // Store all financial data in metadata if available
                if (enrichedData.financials && enrichedData.financials.length > 0) {
                    // Determine currency based on company location/country
                    const currency = getCurrencyCode(locale || 'fi');
                    
                    updatedMetadata.financial_data = {
                        // Store the full array of yearly financials
                        yearly: enrichedData.financials,
                        // Extract the latest year for quick access
                        latest: enrichedData.financials.reduce((latest: any, current: any) => {
                            // Compare years and return the latest one
                            if (!latest || parseInt(current.year) > parseInt(latest.year)) {
                                return current;
                            }
                            return latest;
                        }, null),
                        currency: currency,
                        last_updated: new Date().toISOString(),
                        source: scrapedFinancialData ? 'scraped_allabolag' : 'gemini_enriched'
                    };
                    
                    // Also store financial metrics in the financial_metrics table
                    console.log('💾 [Company Creation] Storing financial metrics from enriched data...');
                    try {
                        // Parse financial values helper
                        const parseFinancialValue = (value: any): number | null => {
                            if (typeof value === 'number') return value;
                            if (typeof value === 'string' && value !== 'Not available') {
                                const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
                                return Number.isFinite(parsed) ? parsed : null;
                            }
                            return null;
                        };

                        // Process each year's financial data
                        for (const yearData of enrichedData.financials) {
                            if (!yearData.year) {
                                console.log('⚠️ [Company Creation] Skipping year data with missing year:', yearData);
                                continue;
                            }

                            const fiscalYear = parseInt(yearData.year);
                            
                            // Determine currency based on company location/country
                            const currency = getCurrencyCode(locale || 'fi');
                            
                            // Prepare comprehensive metrics payload with ALL available fields
                            const metricsPayload = {
                                company_id: company.id,
                                fiscal_year: fiscalYear,
                                fiscal_period: 'annual',
                                // Revenue and profit metrics
                                revenue_current: parseFinancialValue(yearData.revenue),
                                operating_profit: parseFinancialValue(yearData.operating_profit), // Liikevoitto/EBIT
                                net_profit: parseFinancialValue(yearData.profit || yearData.netResult), // Nettotulos
                                ebitda: parseFinancialValue(yearData.ebitda), // Käyttökate
                                operational_cash_flow: parseFinancialValue(yearData.cash_flow), // Separate from operating profit
                                // Balance sheet metrics
                                total_assets: parseFinancialValue(yearData.totalAssets),
                                current_assets: parseFinancialValue(yearData.currentAssets),
                                total_equity: parseFinancialValue(yearData.equity),
                                total_liabilities: parseFinancialValue(yearData.totalLiabilities),
                                current_liabilities: parseFinancialValue(yearData.currentLiabilities),
                                // Financial ratios - USE EXISTING DB COLUMNS!
                                return_on_equity: parseFinancialValue(yearData.solidityRatio),
                                current_ratio: parseFinancialValue(yearData.currentRatio),
                                quick_ratio: parseFinancialValue(yearData.quickRatio),
                                debt_to_equity_ratio: (() => {
                                    const liabilities = parseFinancialValue(yearData.totalLiabilities);
                                    const equity = parseFinancialValue(yearData.equity);
                                    return (liabilities && equity && equity !== 0) ? liabilities / equity : null;
                                })(),
                                // Margin metrics - Map to existing columns
                                operating_margin: (() => {
                                    // Calculate operating_margin from profit_margin or operating_profit/revenue
                                    const margin = parseFinancialValue(yearData.profit_margin);
                                    if (margin !== null) return margin / 100; // Convert percentage to decimal
                                    const opProfit = parseFinancialValue(yearData.operating_profit);
                                    const revenue = parseFinancialValue(yearData.revenue);
                                    return (opProfit && revenue && revenue !== 0) ? opProfit / revenue : null;
                                })(),
                                net_margin: (() => {
                                    // Calculate net_margin from net profit/revenue
                                    const netProfit = parseFinancialValue(yearData.profit || yearData.netResult);
                                    const revenue = parseFinancialValue(yearData.revenue);
                                    return (netProfit && revenue && revenue !== 0) ? netProfit / revenue : null;
                                })(),
                                // Growth rate - NEW COLUMN!
                                revenue_growth_rate: (() => {
                                    const growth = parseFinancialValue(yearData.revenue_growth);
                                    if (growth !== null) return growth / 100; // Convert percentage to decimal
                                    return null;
                                })(),
                                // Metadata
                                currency: currency,
                                created_by: company.created_by,
                                data_source: 'company_metadata',
                                source_document_ids: []
                            };

                            console.log(`💾 [Company Creation] Creating metric for year ${fiscalYear}:`, {
                                revenue: metricsPayload.revenue_current,
                                operatingProfit: metricsPayload.operating_profit,
                                netProfit: metricsPayload.net_profit,
                                ebitda: metricsPayload.ebitda,
                                totalAssets: metricsPayload.total_assets,
                                equity: metricsPayload.total_equity,
                                operatingMargin: metricsPayload.operating_margin,
                                netMargin: metricsPayload.net_margin,
                                revenueGrowthRate: metricsPayload.revenue_growth_rate
                            });

                            const { error: insertError } = await supabaseAdmin
                                .from('financial_metrics')
                                .insert(metricsPayload);

                            if (insertError) {
                                console.error(`❌ [Company Creation] Error creating metric for year ${fiscalYear}:`, insertError);
                            } else {
                                console.log(`✅ [Company Creation] Successfully created metric for year ${fiscalYear}`);
                            }
                        }
                    } catch (metricsError) {
                        console.error('❌ [Company Creation] Error storing financial metrics:', metricsError);
                        // Don't fail the company creation if metrics storage fails
                    }
                } else {
                    // If enrichment didn't produce financial data, create a placeholder record
                    // This prevents UI from getting stuck waiting for financial data that doesn't exist
                    console.log('⚠️ [Company Creation] No financial data from enrichment, creating placeholder record');
                    try {
                        const currency = getCurrencyCode(locale || 'fi');
                        const currentYear = new Date().getFullYear();
                        
                        const placeholderPayload = {
                            company_id: company.id,
                            fiscal_year: currentYear,
                            fiscal_period: 'annual',
                            revenue_current: null,
                            operational_cash_flow: null,
                            currency: currency,
                            created_by: company.created_by,
                            data_source: 'placeholder',
                            source_document_ids: []
                        };
                        
                        const { error: placeholderError } = await supabaseAdmin
                            .from('financial_metrics')
                            .insert(placeholderPayload);
                            
                        if (placeholderError) {
                            console.error('❌ [Company Creation] Error creating placeholder metric:', placeholderError);
                        } else {
                            console.log('✅ [Company Creation] Created placeholder financial metric');
                        }
                    } catch (placeholderError) {
                        console.error('❌ [Company Creation] Error in placeholder creation:', placeholderError);
                    }
                }
                
                console.log('Updating new company with enriched data:', updatedMetadata);
                
                // Update the new company with enriched data
                const { data: updatedCompany, error: updateError } = await supabaseAdmin
                    .from('companies')
                    .update({
                        // Use enriched data when available
                        industry: enrichedData.industry || company.industry,
                        employees: enrichedData.personnel?.count || company.employees,
                        
                        // Extract enriched data fields to company main fields
                        description: enrichedData.description || company.description,
                        market: enrichedData.market || company.market,
                        products: enrichedData.products || company.products,
                        key_competitors: enrichedData.key_competitors || company.key_competitors,
                        
                        // Update website from enriched data if available
                        website: enrichedData.website || company.website,
                        
                        // Update contact_info with enriched data
                        contact_info: {
                            // Start with existing contact info if available, otherwise empty object
                            ...(company?.contact_info && typeof company.contact_info === 'object' ? company.contact_info : {}),
                            // Add or update with new YTJ data with proper null checking
                            address: body.address || ytjData?.address || 
                                    (company?.contact_info && typeof company.contact_info === 'object' ? company.contact_info.address : null),
                            postal_code: body.postCode || ytjData?.postCode || 
                                        (company?.contact_info && typeof company.contact_info === 'object' ? company.contact_info.postal_code : null),
                            city: body.city || ytjData?.city || 
                                (company?.contact_info && typeof company.contact_info === 'object' ? company.contact_info.city : null),
                            // Try to extract contact info from enriched data if available
                            ...(enrichedData?.contact_info && typeof enrichedData.contact_info === 'object' 
                                ? enrichedData.contact_info 
                                : {})
                        },
                        
                        // Store the enriched data in metadata
                        metadata: updatedMetadata
                    })
                    .eq('id', company.id)
                    .select()
                    .single();
                
                if (updateError) {
                    console.error('Error updating new company with enriched data:', updateError);
                } else {
                    console.log('Successfully updated new company with AI enrichment.');
                    company = updatedCompany;
                }
            }
        } catch (error) {
            console.error('🤖 [Company Create] Error enriching new company data:', error);
            console.error('🤖 [Company Create] Enrichment error details:', {
                message: error instanceof Error ? error.message : 'Unknown error',
                geminiApiKey: !!geminiApiKey,
                genaiClient: !!genaiClient
            });
        }
        */
        // End of disabled old enrichment code
    } else if (company) {
        console.log('Existing company found. Proceeding with update...');
        
        // Extract all YTJ data from existing metadata and request into a combined object
        const existingMetadata = company.metadata as any || {};
        const existingYtjData = existingMetadata.ytj_data || {};
        
        // Merge existing YTJ data with new data from request, preferring new data when available (only for Finnish companies)
        const isSwedishCompany = locale === 'sv';
        const ytjData = isSwedishCompany ? {} : {
            ...existingYtjData, // Start with existing data as base
            
            // Basic info - override with new data when available
            registrationDate: body.registrationDate || existingYtjData.registrationDate,
            status: body.status || existingYtjData.status,
            euId: body.euId || existingYtjData.euId,
            companyForm: body.companyForm || existingYtjData.companyForm,
            mainBusinessLine: body.mainBusinessLine || existingYtjData.mainBusinessLine,
            
            // Primary address
            address: body.address || existingYtjData.address,
            postCode: body.postCode || existingYtjData.postCode,
            city: body.city || existingYtjData.city,
            street: body.street || existingYtjData.street,
            buildingNumber: body.buildingNumber || existingYtjData.buildingNumber,
            entrance: body.entrance || existingYtjData.entrance,
            apartmentNumber: body.apartmentNumber || existingYtjData.apartmentNumber,
            
            // Postal address
            postalAddress: body.postalAddress || existingYtjData.postalAddress,
            postalPostCode: body.postalPostCode || existingYtjData.postalPostCode,
            postalCity: body.postalCity || existingYtjData.postalCity,
            postalStreet: body.postalStreet || existingYtjData.postalStreet,
            postalBuilding: body.postalBuilding || existingYtjData.postalBuilding,
            
            // Other data
            website: body.website || existingYtjData.website,
            countryCode: body.countryCode || existingYtjData.countryCode
        };
        
        // Check if YTJ data has any actual content
        const hasYtjData = existingYtjData.status !== 'not_found' && 
            Object.values(ytjData).some(value => value !== undefined && value !== null && value !== '');
        
        // Log the YTJ data status
        if (hasYtjData) {
            console.log('YTJ data for existing company update:', ytjData);
        } else {
            console.log('No valid YTJ data available for company update.');
        }

        // Now schedule enrichment with the combined YTJ data or just the company name
        console.log(`Scheduling enrichment for company ${company.id}...`);
        
        // Get enriched data using the company details
        let enrichedData = null;
        try {
            enrichedData = await enrichCompanyData(
                `${body.name} (${body.business_id})`,
                hasYtjData ? ytjData : undefined,
                locale // Use the request locale for enrichment
            );
            console.log('Enriched data received:', enrichedData);
        } catch (error) {
            console.error('Error enriching company data:', error);
        }
        
        // Prepare updated metadata
        // Important: Preserve ALL existing metadata here and just add our new enriched data
        const updatedMetadata = {
            ...existingMetadata, // Start with ALL existing metadata (crucial to preserve data)
            ytj_data: hasYtjData ? ytjData : { status: 'not_found' },
            is_from_ytj: hasYtjData,
            enriched_data: enrichedData, // Add new enriched data
            last_enriched: new Date().toISOString() // Update timestamp
        };
        
        // Log the final metadata we're saving
        console.log('Final metadata to save:', updatedMetadata);
        
        // Update the existing company with enriched data and all other fields
        const { data: updatedCompany, error: updateError } = await supabaseAdmin
            .from('companies')
            .update({
                // Update with the latest details (prefer new data from body over existing)
                name: body.name || company.name,
                business_id: body.business_id || company.business_id,
                founded: body.registrationDate || company.founded,
                address: body.address || company.address,
                type: body.status || company.type,
                
                // Use enriched data when available, fall back to existing data
                industry: enrichedData?.industry || body.mainBusinessLine || body.industry || company.industry,
                // For employees, use the latest year's data if available
                employees: enrichedData?.personnel?.count || body.employees || company.employees,
                
                // Extract enriched data fields to company main fields
                description: enrichedData?.description || company.description,
                market: enrichedData?.market || company.market,
                products: enrichedData?.products || company.products,
                key_competitors: enrichedData?.key_competitors || company.key_competitors,
                
                // Extract website from multiple sources in order of preference
                website: body.website || 
                         enrichedData?.website || 
                         (hasYtjData ? ytjData?.website : null) || 
                         company.website,
                
                // Update contact_info by merging available data
                contact_info: {
                    // Start with existing contact info if available, otherwise empty object
                    ...(company?.contact_info && typeof company.contact_info === 'object' ? company.contact_info : {}),
                    // Add or update with new YTJ data with proper null checking
                    address: body.address || ytjData?.address || 
                            (company?.contact_info && typeof company.contact_info === 'object' ? company.contact_info.address : null),
                    postal_code: body.postCode || ytjData?.postCode || 
                                (company?.contact_info && typeof company.contact_info === 'object' ? company.contact_info.postal_code : null),
                    city: body.city || ytjData?.city || 
                        (company?.contact_info && typeof company.contact_info === 'object' ? company.contact_info.city : null),
                    // Try to extract contact info from enriched data if available
                    ...(enrichedData?.contact_info && typeof enrichedData.contact_info === 'object' 
                        ? enrichedData.contact_info 
                        : {})
                },
                
                // Store all financial data in metadata
                metadata: {
                    ...updatedMetadata,
                    // If we have enriched financial data, process and store it
                    ...(enrichedData?.financials && {
                        financial_data: {
                            // Store the full array of yearly financials
                            yearly: enrichedData.financials,
                            // Extract the latest year for quick access
                            latest: enrichedData.financials.length > 0 
                                ? enrichedData.financials.reduce((latest: any, current: any) => {
                                    // Compare years and return the latest one
                                    if (!latest || parseInt(current.year) > parseInt(latest.year)) {
                                        return current;
                                    }
                                    return latest;
                                }, null)
                                : null,
                            last_updated: new Date().toISOString()
                        }
                    }),
                    // Store company website found from Google Search if not already set
                    ...(enrichedData?.website && !updatedMetadata.website ? {
                        website: enrichedData.website
                    } : {})
                }
            })
            .eq('id', company.id)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating company with enriched data:', updateError);
            // Log the error but continue, returning the original company data
        } else {
            console.log('Successfully updated company with AI enrichment.');
            // Use the updated company data for the response
            company = updatedCompany;
        }

        // IMPORTANT: Also create financial_metrics records for existing companies if enriched data has financials
        if (enrichedData?.financials && Array.isArray(enrichedData.financials) && enrichedData.financials.length > 0) {
            console.log(`💾 [Existing Company] Creating financial_metrics for ${enrichedData.financials.length} years...`);
            
            try {
                for (const yearData of enrichedData.financials) {
                    if (!yearData.year || yearData.revenue === 'Not available') continue;
                    
                    const fiscalYear = parseInt(yearData.year);
                    if (isNaN(fiscalYear)) continue;

                    // Check if this year already exists to avoid duplicates
                    const { data: existingMetric } = await supabaseAdmin
                        .from('financial_metrics')
                        .select('id')
                        .eq('company_id', company.id)
                        .eq('fiscal_year', fiscalYear)
                        .maybeSingle();

                    if (existingMetric) {
                        console.log(`📊 [Existing Company] Metric for year ${fiscalYear} already exists, skipping...`);
                        continue;
                    }

                    // Helper to parse financial values safely
                    const parseValue = (value: any): number | null => {
                        if (typeof value === 'number') return value;
                        if (typeof value === 'string' && value !== 'Not available') {
                            const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
                            return Number.isFinite(parsed) ? parsed : null;
                        }
                        return null;
                    };
                    
                    const metricsPayload = {
                        company_id: company.id,
                        fiscal_year: fiscalYear,
                        fiscal_period: 'annual',
                        revenue_current: parseValue(yearData.revenue),
                        operating_profit: parseValue(yearData.operating_profit), // Liikevoitto/EBIT
                        net_profit: parseValue(yearData.profit || yearData.netResult), // Nettotulos
                        ebitda: parseValue(yearData.ebitda),
                        operational_cash_flow: parseValue(yearData.cash_flow),
                        // Margin metrics - Map to existing DB columns
                        operating_margin: (() => {
                            const margin = parseValue(yearData.profit_margin);
                            if (margin !== null) return margin / 100; // Convert percentage to decimal
                            const opProfit = parseValue(yearData.operating_profit);
                            const revenue = parseValue(yearData.revenue);
                            return (opProfit && revenue && revenue !== 0) ? opProfit / revenue : null;
                        })(),
                        net_margin: (() => {
                            const netProfit = parseValue(yearData.profit || yearData.netResult);
                            const revenue = parseValue(yearData.revenue);
                            return (netProfit && revenue && revenue !== 0) ? netProfit / revenue : null;
                        })(),
                        // Growth rate - NEW COLUMN!
                        revenue_growth_rate: (() => {
                            const growth = parseValue(yearData.revenue_growth);
                            if (growth !== null) return growth / 100; // Convert percentage to decimal
                            return null;
                        })(),
                        created_by: user.id,
                        source_document_ids: []
                    };

                    console.log(`💾 [Existing Company] Creating metric for year ${fiscalYear}:`, {
                        revenue: metricsPayload.revenue_current,
                        profit: metricsPayload.operational_cash_flow
                    });

                    const { error: insertError } = await supabaseAdmin
                        .from('financial_metrics')
                        .insert(metricsPayload);

                    if (insertError) {
                        console.error(`❌ [Existing Company] Error creating metric for year ${fiscalYear}:`, insertError);
                    } else {
                        console.log(`✅ [Existing Company] Successfully created metric for year ${fiscalYear}`);
                    }
                }
            } catch (metricsError) {
                console.error('❌ [Existing Company] Error storing financial metrics:', metricsError);
                // Don't fail the company update if metrics storage fails
            }
        } else {
            // If enrichment didn't produce financial data for existing company, create placeholder
            console.log('⚠️ [Existing Company] No financial data from enrichment, creating placeholder record');
            try {
                const currency = getCurrencyCode(locale || 'fi');
                const currentYear = new Date().getFullYear();
                
                // Check if placeholder already exists
                const { data: existingMetric } = await supabaseAdmin
                    .from('financial_metrics')
                    .select('id')
                    .eq('company_id', company.id)
                    .eq('fiscal_year', currentYear)
                    .maybeSingle();
                
                if (!existingMetric) {
                    const placeholderPayload = {
                        company_id: company.id,
                        fiscal_year: currentYear,
                        fiscal_period: 'annual',
                        revenue_current: null,
                        operational_cash_flow: null,
                        currency: currency,
                        created_by: user.id,
                        data_source: 'placeholder',
                        source_document_ids: []
                    };
                    
                    const { error: placeholderError } = await supabaseAdmin
                        .from('financial_metrics')
                        .insert(placeholderPayload);
                        
                    if (placeholderError) {
                        console.error('❌ [Existing Company] Error creating placeholder metric:', placeholderError);
                    } else {
                        console.log('✅ [Existing Company] Created placeholder financial metric');
                    }
                } else {
                    console.log('📊 [Existing Company] Financial metric already exists, skipping placeholder');
                }
            } catch (placeholderError) {
                console.error('❌ [Existing Company] Error in placeholder creation:', placeholderError);
            }
        }
    }

    // Update the user's profile with the company_id (for both new and existing companies)
    await supabaseAdmin
      .from('profiles')
      .update({ company_id: company.id })
      .eq('id', user.id);
    
    console.log('Profile updated with company_id:', company.id);

    // IMPORTANT: Add user_companies relationship for the current user
    // Use service role client to bypass RLS for this specific operation
    const { error: userCompanyError } = await supabaseAdmin
      .from('user_companies')
      .upsert({
        user_id: user.id,
        company_id: company.id,
        role: 'owner'
      }, {
        onConflict: 'user_id,company_id'
      });

    if (userCompanyError) {
      console.error('Error creating user_companies relationship:', userCompanyError);
      // Don't fail the entire operation, but log the error
    } else {
      console.log('User_companies relationship created:', { user_id: user.id, company_id: company.id });
    }

    // Extract and process enriched data fields if available
    if (body.enriched_data) {
      // Extract description, market, products, and key_competitors if available
      if (body.enriched_data.description) {
        company.description = body.enriched_data.description;
      }
      
      if (body.enriched_data.market) {
        company.market = body.enriched_data.market;
      }
      
      if (body.enriched_data.products) {
        company.products = body.enriched_data.products;
      }
      
      if (body.enriched_data.key_competitors) {
        company.key_competitors = body.enriched_data.key_competitors;
      }
    }

    // Extract and process financial data if available
    if (body.financial_data && body.financial_data.latest) {
      // Add the latest financial data as a summary
      company.latest_financial = body.financial_data.latest;
    }

    // Return the company data (enriched if successful)
    console.log('Returning company data:', JSON.stringify(company));
    return NextResponse.json(company, { 
      status: isExistingCompany ? 200 : 201 // 200 for existing, 201 for newly created
    });

  } catch (error) {
    console.error('Unhandled error in company creation API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Prevent CSRF attacks
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
} 