import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

// Environment validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const geminiApiKey = process.env.GOOGLE_AI_STUDIO_KEY || process.env.GEMINI_API_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey || !geminiApiKey) {
  console.error('FATAL: Missing required environment variables:', {
    supabaseUrl: !!supabaseUrl,
    supabaseServiceRoleKey: !!supabaseServiceRoleKey,
    geminiApiKey: !!geminiApiKey
  });
  console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('GOOGLE') || k.includes('GEMINI')));
}

// Initialize clients
const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceRoleKey!);

// Create AI instance
const genAI = new GoogleGenAI({ apiKey: geminiApiKey! });

/**
 * Enhanced Company Analysis API
 * Provides deep business intelligence with wow-factor insights
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('\n🚀 [Enhanced Analysis] Starting deep company analysis...');
    
    // 1. Authenticate user
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const { companyId, locale = 'fi' } = await request.json();
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Missing companyId' },
        { status: 400 }
      );
    }

    console.log(`🏢 [Enhanced Analysis] Processing company: ${companyId}, locale: ${locale}`);

    // 3. Fetch comprehensive company data
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select(`
        *,
        financial_metrics (
          *
        ),
        financing_needs (
          *
        )
      `)
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      console.error('❌ Company not found:', companyError);
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // 4. Extract existing data for context
    const existingMetadata = company.metadata || {};
    const ytjData = existingMetadata.ytj_data || {};
    const enrichedData = existingMetadata.enriched_data || {};
    const financialMetrics = company.financial_metrics || [];

    // 5. Generate enhanced analysis with Gemini
    console.log('🧠 [Enhanced Analysis] Generating AI insights...');
    
    // Determine language and context based on locale
    const isSwedish = locale === 'sv';
    const language = isSwedish ? 'svenska' : 'suomi';
    const countryContext = isSwedish ? 'svenska' : 'suomalainen';
    const businessIdLabel = isSwedish ? 'Organisationsnummer' : 'Y-tunnus';
    const industryLabel = isSwedish ? 'Bransch' : 'Toimiala';
    const unknownLabel = isSwedish ? 'Ej känt' : 'Ei tiedossa';
    const businessDataLabel = isSwedish ? 'FÖRETAGSUPPGIFTER' : 'YTJ-TIEDOT';
    const enrichedDataLabel = isSwedish ? 'UTÖKADE UPPGIFTER' : 'RIKASTETUT TIEDOT';
    const financialDataLabel = isSwedish ? 'FINANSIELLA UPPGIFTER' : 'FINANSSITIEDOT';
    const taskLabel = isSwedish ? 'UPPGIFT' : 'TEHTÄVÄ';
    
    const analysisPrompt = isSwedish ? `
Du är en expertisk konsult som gör djupgående företagsanalyser. Analysera följande ${countryContext} företag och skapa en imponerande "wow-effekt" analys.

FÖRETAGSINFORMATION:
Namn: ${company.name}
${businessIdLabel}: ${company.business_id}
${industryLabel}: ${company.industry || unknownLabel}

${businessDataLabel}:
${JSON.stringify(ytjData, null, 2)}

${enrichedDataLabel}:
${JSON.stringify(enrichedData, null, 2)}

${financialDataLabel} (${financialMetrics.length} år):
${JSON.stringify(financialMetrics, null, 2)}

${taskLabel}:
Skapa en djupgående, imponerande analys som:
1. 📊 Ger en omfattande bild av företagets finansiella situation
2. 🎯 Identifierar tydliga styrkor och utvecklingsområden  
3. 🏆 Jämför med konkurrenter och marknadssituationen
4. 💡 Erbjuder konkreta finansieringsrekommendationer
5. 🚀 Ger kunden en "wow-känsla" från den grundliga analysen

Svara i JSON-format:` : `
Du olet asiantuntijakin konsultti, joka tekee syvällistä yritysanalyysiä. Analysoi seuraava ${countryContext} yritys ja tuota vaikuttava "wow-efekti" analyysi.

YRITYSTIEDOT:
Nimi: ${company.name}
${businessIdLabel}: ${company.business_id}
${industryLabel}: ${company.industry || unknownLabel}

${businessDataLabel}:
${JSON.stringify(ytjData, null, 2)}

${enrichedDataLabel}:
${JSON.stringify(enrichedData, null, 2)}

${financialDataLabel} (${financialMetrics.length} vuotta):
${JSON.stringify(financialMetrics, null, 2)}

${taskLabel}:
Tuota syvällinen, vaikuttava analyysi joka:
1. 📊 Antaa kattavan kuvan yrityksen taloudellisesta tilanteesta
2. 🎯 Tunnistaa selkeät vahvuudet ja kehitysalueet  
3. 🏆 Vertaa kilpailijoihin ja markkinatilanteeseen
4. 💡 Tarjoaa konkreettisia rahoitussuosituksia
5. 🚀 Antaa asiakkaalle "wow-tunteen" perusteellisesta analyysistä

Vastaa JSON-muodossa:

{
  "executive_summary": {
    "overall_score": "<score 1-100>",
    "key_insight": "Main insight about the company",
    "investment_thesis": "Why this company is interesting",
    "risk_level": "low|medium|high"
  },
  "financial_analysis": {
    "health_score": "<financial health index 1-100>",
    "liquidity_assessment": "Liquidity assessment",
    "profitability_trend": "Profitability development",
    "growth_potential": "Growth potential assessment",
    "key_metrics": {
      "revenue_growth_3y": "3-year revenue growth %",
      "profit_margin_trend": "Profit margin development",
      "debt_to_equity": "Debt ratio",
      "working_capital": "Working capital situation"
    }
  },
  "competitive_analysis": {
    "market_position": "Market position",
    "competitive_advantages": ["Advantage 1", "Advantage 2"],
    "market_threats": ["Threat 1", "Threat 2"],
    "differentiation": "How company differs from competitors"
  },
  "growth_opportunities": {
    "immediate_actions": ["Action 1", "Action 2"],
    "strategic_directions": ["Strategic direction 1", "Strategic direction 2"],
    "market_expansion": "Market expansion opportunities",
    "innovation_potential": "Innovation potential"
  },
  "financing_recommendations": {
    "optimal_amount": "Recommended financing amount",
    "best_financing_types": ["Financing type 1", "Financing type 2"],
    "timing_recommendation": "When to seek financing",
    "success_probability": "Probability of getting financing %",
    "preparation_tips": ["Preparation tip 1", "Preparation tip 2"]
  },
  "industry_insights": {
    "sector_outlook": "Industry outlook",
    "regulatory_changes": "Regulatory changes",
    "technology_trends": "Technology trends",
    "market_dynamics": "Market dynamics"
  },
  "actionable_insights": {
    "immediate_wins": ["Quick win 1", "Quick win 2"],
    "medium_term_goals": ["Medium-term goal 1"],
    "long_term_vision": "Long-term vision",
    "kpis_to_track": ["KPI to track 1", "KPI to track 2"]
  }
}

${isSwedish ? `OBS:
- Använd endast verkliga uppgifter, hitta inte på siffror
- Ge konkreta, verkställbara rekommendationer
- Fokusera på att skapa wow-effekt med djup och professionalitet
- Om uppgifter saknas, nämn det tydligt
- Skriv alla texter på svenska` : `HUOMAA:
- Käytä vain todellisia tietoja, älä keksi lukuja
- Anna konkreettisia, toimintakelpoisia suosituksia
- Keskity luomaan wow-efekti syvyydellä ja ammattimaisuudella
- Jos tietoja puuttuu, mainitse se selkeästi
- Kirjoita kaikki tekstit suomeksi`}
`;

    // Generate analysis with timeout
    const analysisResponse = await Promise.race([
      genAI.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: [{ text: analysisPrompt }],
        config: {
          temperature: 0.3,
          maxOutputTokens: 16384,
        }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Analysis timeout after 90 seconds')), 90000)
      )
    ]);

    const responseText = (analysisResponse as any).text || '';
    
    // Parse JSON response
    let analysisData;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      analysisData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('❌ Failed to parse analysis response:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse analysis results' },
        { status: 500 }
      );
    }

    // 6. Store analysis results
    const { error: updateError } = await supabaseAdmin
      .from('companies')
      .update({
        metadata: {
          ...existingMetadata,
          enhanced_analysis: {
            ...analysisData,
            generated_at: new Date().toISOString(),
            locale: locale,
            processing_time_ms: Date.now() - startTime
          }
        }
      })
      .eq('id', companyId);

    if (updateError) {
      console.error('❌ Failed to store analysis:', updateError);
    }

    const processingTime = Date.now() - startTime;
    console.log(`✅ [Enhanced Analysis] Completed in ${processingTime}ms`);

    // 7. Return enhanced analysis
    return NextResponse.json({
      success: true,
      analysis: analysisData,
      metadata: {
        processing_time_ms: processingTime,
        locale: locale,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ [Enhanced Analysis] Error after ${processingTime}ms:`, error);
    
    return NextResponse.json(
      { 
        error: 'Analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        processing_time_ms: processingTime
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Enhanced Analysis API',
    methods: ['POST'],
    description: 'Provides deep business intelligence analysis with wow-factor insights'
  });
} 