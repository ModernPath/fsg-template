import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@/utils/supabase/server';

const genAI = new GoogleGenAI({ 
  apiKey: process.env.GOOGLE_AI_STUDIO_KEY || process.env.GEMINI_API_KEY || '' 
});

/**
 * POST /api/financial-data/parse
 * 
 * Parse financial data from natural language text
 * Extracts numbers and identifies missing fields
 */
export async function POST(request: NextRequest) {
  try {
    console.log('\n📝 [POST /api/financial-data/parse]');

    // 1. Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid auth header');
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    // 2. Verify token
    const authClient = await createClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser(
      authHeader.split(' ')[1]
    );
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', user.id);

    // 3. Parse request body
    const { text, companyId, fiscalYear } = await request.json();

    if (!text || !companyId) {
      console.error('❌ Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: text, companyId' },
        { status: 400 }
      );
    }

    console.log('📊 Parsing financial text:', text);

    // 4. Use Gemini to parse natural language
    const extractedData = await parseFinancialText(text, fiscalYear || new Date().getFullYear());

    console.log('✅ Extracted data:', extractedData);

    // 5. Validate and identify missing fields
    const { isValid, missingFields, warnings } = validateFinancialData(extractedData);

    if (!isValid) {
      console.log('⚠️ Missing fields:', missingFields);
      return NextResponse.json({
        success: false,
        extracted: extractedData,
        missing: missingFields,
        warnings,
        question: generateFollowUpQuestion(missingFields),
        needsMoreInfo: true
      });
    }

    // 6. Save to database
    console.log('💾 Saving financial metrics to database...');
    const supabase = await createClient(undefined, true);

    // Calculate derived metrics
    const calculatedMetrics = calculateDerivedMetrics(extractedData);

    // Prepare data for database
    const financialMetrics = {
      company_id: companyId,
      fiscal_year: extractedData.fiscal_year,
      fiscal_period: 'annual' as const,
      
      // Core metrics
      revenue_current: extractedData.revenue,
      operating_profit: extractedData.operating_profit,
      net_profit: extractedData.net_profit,
      total_equity: extractedData.equity,
      total_assets: extractedData.total_assets,
      total_liabilities: extractedData.total_liabilities,
      current_assets: extractedData.current_assets,
      current_liabilities: extractedData.current_liabilities,
      
      // Calculated metrics
      ebitda: calculatedMetrics.ebitda,
      return_on_equity: calculatedMetrics.return_on_equity,
      current_ratio: calculatedMetrics.current_ratio,
      quick_ratio: calculatedMetrics.quick_ratio,
      debt_to_equity_ratio: calculatedMetrics.debt_to_equity_ratio,
      profit_margin: calculatedMetrics.profit_margin,
      
      // Metadata
      data_source: 'manual_input',
      data_confidence: extractedData.confidence,
      created_by: user.id,
      created_at: new Date().toISOString(),
    };

    const { data: savedMetrics, error: saveError } = await supabase
      .from('financial_metrics')
      .upsert(financialMetrics, {
        onConflict: 'company_id,fiscal_year,fiscal_period'
      })
      .select()
      .single();

    if (saveError) {
      console.error('❌ Failed to save financial metrics:', saveError);
      return NextResponse.json(
        { error: 'Failed to save financial data', details: saveError.message },
        { status: 500 }
      );
    }

    console.log('✅ Financial metrics saved successfully');

    // 7. Update company metadata
    const { error: updateError } = await supabase
      .from('companies')
      .update({
        metadata: {
          financial_data: {
            source: 'manual_input',
            confidence: extractedData.confidence,
            latest_year: extractedData.fiscal_year,
            updated_at: new Date().toISOString()
          }
        }
      })
      .eq('id', companyId);

    if (updateError) {
      console.error('⚠️ Failed to update company metadata:', updateError);
    }

    return NextResponse.json({
      success: true,
      data: extractedData,
      calculated: calculatedMetrics,
      saved: savedMetrics,
      warnings,
      message: 'Taloustiedot tallennettu onnistuneesti'
    });

  } catch (error: any) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Parse financial text using Gemini AI
 */
async function parseFinancialText(text: string, defaultYear: number) {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      temperature: 0.1, // Low temperature for accuracy
      responseMimeType: 'application/json',
    }
  });

  const prompt = `You are a financial data extraction assistant. Extract financial metrics from the user's text.

CRITICAL RULES:
- Extract ONLY numbers explicitly mentioned in the text
- NEVER invent, estimate, or guess any numbers
- If a metric is not mentioned, return null
- Accept Finnish, Swedish, and English terms
- Handle various number formats: "500000", "500 000", "500k", "0,5M"
- Return confidence score based on text clarity

🚨 CRITICAL PRECISION REQUIREMENTS:
- ALL values MUST be in FULL PRECISION - NO rounding to thousands (k), millions (M), or any other abbreviation
- If text shows "266k" or "266 thousand" → extract as 266000 (full number)
- If text shows "2.066M" or "2.066 million" → extract as 2066000 (full number)
- If text shows "2066088" → extract as 2066088 (exact number, no rounding)
- NEVER round or abbreviate numbers - always extract the complete, full-precision value
- Convert abbreviations to full numbers: "500k" → 500000, "1,5M" → 1500000, "2.066M" → 2066000

USER INPUT:
${text}

Extract the following (return null if not mentioned):
{
  "revenue": number | null,           // Liikevaihto, Revenue, Omsättning - FULL PRECISION
  "operating_profit": number | null,  // Liikevoitto, Operating Profit, Rörelseresultat - FULL PRECISION
  "net_profit": number | null,        // Nettotulos, Net Profit, Nettovinst - FULL PRECISION
  "equity": number | null,            // Oma pääoma, Equity, Eget kapital - FULL PRECISION
  "total_assets": number | null,      // Varat yhteensä, Total Assets, Tillgångar - FULL PRECISION
  "total_liabilities": number | null, // Velat yhteensä, Total Liabilities, Skulder - FULL PRECISION
  "current_assets": number | null,    // Lyhytaikaiset varat, Current Assets - FULL PRECISION
  "current_liabilities": number | null, // Lyhytaikaiset velat, Current Liabilities - FULL PRECISION
  "fiscal_year": number,              // Tilikausi, Fiscal Year (default: ${defaultYear})
  "confidence": number                // 0-100 based on text clarity
}

EXAMPLES:
Input: "Liikevaihto oli 500 000 €, liikevoitto 50 000 € ja oma pääoma 200 000 €"
Output: {"revenue": 500000, "operating_profit": 50000, "equity": 200000, "fiscal_year": ${defaultYear}, "confidence": 95, ...rest null}

Input: "Meillä oli 1,5 miljoonan liikevaihto"
Output: {"revenue": 1500000, "fiscal_year": ${defaultYear}, "confidence": 80, ...rest null}

Input: "Liikevaihto oli 266k"
Output: {"revenue": 266000, "fiscal_year": ${defaultYear}, "confidence": 75, ...rest null}

Input: "Liikevaihto oli 2.066M"
Output: {"revenue": 2066000, "fiscal_year": ${defaultYear}, "confidence": 75, ...rest null}

Return ONLY valid JSON. No explanations.`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  
  console.log('🤖 [Gemini] Raw response:', responseText);

  try {
    const parsed = JSON.parse(responseText);
    return parsed;
  } catch (e) {
    console.error('❌ Failed to parse Gemini response:', e);
    throw new Error('Failed to parse financial data');
  }
}

/**
 * Validate extracted financial data
 */
function validateFinancialData(data: any) {
  const missingFields: string[] = [];
  const warnings: string[] = [];

  // Revenue is REQUIRED
  if (!data.revenue || data.revenue <= 0) {
    missingFields.push('revenue');
  }

  // Fiscal year is REQUIRED
  if (!data.fiscal_year) {
    missingFields.push('fiscal_year');
  }

  // Logical validation
  if (data.operating_profit && data.revenue && data.operating_profit > data.revenue) {
    warnings.push('Liikevoitto ei voi olla suurempi kuin liikevaihto');
  }

  if (data.net_profit && data.operating_profit && data.net_profit > data.operating_profit) {
    warnings.push('Nettotulos ei voi olla suurempi kuin liikevoitto');
  }

  // Balance sheet equation: Assets = Liabilities + Equity
  if (data.total_assets && data.total_liabilities && data.equity) {
    const calculatedEquity = data.total_assets - data.total_liabilities;
    const diff = Math.abs(calculatedEquity - data.equity);
    
    if (diff > data.equity * 0.1) { // >10% difference
      warnings.push('Tase ei täsmää: Varat - Velat ≠ Oma pääoma');
    }
  }

  // Current ratio components
  if (data.current_assets && data.current_liabilities && data.current_assets < data.current_liabilities * 0.5) {
    warnings.push('Lyhytaikaiset varat ovat huolestuttavan pienet verrattuna velkoihin');
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
    warnings
  };
}

/**
 * Generate follow-up question for missing fields
 */
function generateFollowUpQuestion(missingFields: string[]) {
  const fieldNames: Record<string, string> = {
    revenue: 'liikevaihto',
    fiscal_year: 'tilikausi',
    operating_profit: 'liikevoitto',
    net_profit: 'nettotulos',
    equity: 'oma pääoma',
    total_assets: 'varat yhteensä',
    total_liabilities: 'velat yhteensä',
  };

  if (missingFields.includes('revenue')) {
    return 'Kerro vielä liikevaihto (pakollinen tieto)?';
  }

  if (missingFields.includes('fiscal_year')) {
    return 'Miltä tilikaudelta nämä luvut ovat (esim. 2024)?';
  }

  const missing = missingFields.map(f => fieldNames[f] || f).join(', ');
  return `Kerro vielä: ${missing}?`;
}

/**
 * Calculate derived financial metrics
 */
function calculateDerivedMetrics(data: any) {
  const metrics: any = {
    ebitda: null,
    return_on_equity: null,
    current_ratio: null,
    quick_ratio: null,
    debt_to_equity_ratio: null,
    profit_margin: null,
  };

  // EBITDA (simplified - without depreciation/amortization)
  if (data.operating_profit) {
    metrics.ebitda = data.operating_profit;
  }

  // Return on Equity (ROE)
  if (data.net_profit && data.equity && data.equity > 0) {
    metrics.return_on_equity = (data.net_profit / data.equity) * 100;
  }

  // Current Ratio
  if (data.current_assets && data.current_liabilities && data.current_liabilities > 0) {
    metrics.current_ratio = data.current_assets / data.current_liabilities;
  }

  // Quick Ratio (assuming no inventory data)
  if (data.current_assets && data.current_liabilities && data.current_liabilities > 0) {
    metrics.quick_ratio = (data.current_assets * 0.8) / data.current_liabilities; // Rough estimate
  }

  // Debt-to-Equity Ratio
  if (data.total_liabilities && data.equity && data.equity > 0) {
    metrics.debt_to_equity_ratio = data.total_liabilities / data.equity;
  }

  // Profit Margin
  if (data.net_profit && data.revenue && data.revenue > 0) {
    metrics.profit_margin = (data.net_profit / data.revenue) * 100;
  }

  return metrics;
}

