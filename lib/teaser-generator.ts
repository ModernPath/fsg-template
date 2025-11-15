/**
 * Teaser Generator
 * 
 * Generates compelling M&A teaser documents using:
 * - Enriched company data (17 modules)
 * - User questionnaire responses
 * - Extracted financial data
 * - AI-powered content generation (Gemini)
 */

import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';

export interface TeaserGenerationInput {
  companyOverview: {
    name: string;
    industry?: string;
    description?: string;
  };
  enrichedData?: any; // Full enriched data from 17 modules
  financialData?: any[];
  questionnaireData?: any[];
}

export interface TeaserContent {
  title: string;
  tagline: string;
  summary: string;
  investmentHighlights: string[];
  businessOverview: {
    description: string;
    industry: string;
    products: string[];
    marketPosition: string;
  };
  financialSnapshot: {
    revenue: string;
    profitMargin: string;
    growthRate: string;
    ebitda: string;
  };
  competitiveAdvantages: string[];
  growthOpportunities: string[];
  idealBuyer: string[];
  transactionRationale: string;
  nextSteps: string;
}

/**
 * Generate M&A teaser content using enriched data
 */
export async function generateTeaser(
  input: TeaserGenerationInput,
  apiKey: string
): Promise<TeaserContent> {
  const genAI = new GoogleGenAI({ apiKey });

  const prompt = buildTeaserPrompt(input);

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.7, // Creative but factual
        topP: 0.95,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);

    return {
      title: parsed.title || `Investment Opportunity: ${input.companyOverview.name}`,
      tagline: parsed.tagline || '',
      summary: parsed.summary || '',
      investmentHighlights: parsed.investmentHighlights || [],
      businessOverview: parsed.businessOverview || {
        description: input.companyOverview.description || '',
        industry: input.companyOverview.industry || '',
        products: [],
        marketPosition: '',
      },
      financialSnapshot: parsed.financialSnapshot || {
        revenue: 'N/A',
        profitMargin: 'N/A',
        growthRate: 'N/A',
        ebitda: 'N/A',
      },
      competitiveAdvantages: parsed.competitiveAdvantages || [],
      growthOpportunities: parsed.growthOpportunities || [],
      idealBuyer: parsed.idealBuyer || [],
      transactionRationale: parsed.transactionRationale || '',
      nextSteps: parsed.nextSteps || 'Contact us for more information.',
    };
  } catch (error) {
    console.error('❌ Teaser generation error:', error);
    throw new Error('Failed to generate teaser');
  }
}

/**
 * Build comprehensive prompt for teaser generation
 */
function buildTeaserPrompt(input: TeaserGenerationInput): string {
  const { companyOverview, enrichedData, financialData, questionnaireData } = input;

  // Extract key data from enriched modules
  const basicInfo = enrichedData?.basic_info || {};
  const financialHealth = enrichedData?.financial_health || {};
  const growthAnalysis = enrichedData?.growth_analysis || {};
  const competitiveAdvantages = enrichedData?.competitive_advantages || {};
  const valuationData = enrichedData?.valuation_data || {};
  const exitAttractiveness = enrichedData?.exit_attractiveness || {};
  const industryAnalysis = enrichedData?.industry_analysis || {};
  const marketIntelligence = enrichedData?.market_intelligence || {};

  return `You are an M&A advisory expert. Create a compelling, professional teaser document for this acquisition opportunity.

# COMPANY INFORMATION

Company Name: ${companyOverview.name}
Industry: ${companyOverview.industry || basicInfo.industry || 'Not specified'}
Description: ${companyOverview.description || basicInfo.description || 'Company description'}

# ENRICHED INTELLIGENCE (17 Modules)

## Basic Information
${JSON.stringify(basicInfo, null, 2)}

## Financial Health
${JSON.stringify(financialHealth, null, 2)}

## Growth Analysis
${JSON.stringify(growthAnalysis, null, 2)}

## Competitive Advantages
${JSON.stringify(competitiveAdvantages, null, 2)}

## Industry Analysis
${JSON.stringify(industryAnalysis, null, 2)}

## Market Intelligence
${JSON.stringify(marketIntelligence, null, 2)}

## Valuation Data
${JSON.stringify(valuationData, null, 2)}

## Exit Attractiveness
${JSON.stringify(exitAttractiveness, null, 2)}

# FINANCIAL DATA (Extracted)
${financialData ? JSON.stringify(financialData, null, 2) : 'No extracted financial data available'}

# QUESTIONNAIRE RESPONSES
${questionnaireData ? JSON.stringify(questionnaireData, null, 2) : 'No questionnaire data available'}

---

# TASK: Generate M&A Teaser

Create a compelling, professional teaser that will attract qualified buyers. Return JSON in this exact format:

{
  "title": "Compelling title (e.g., 'Leading Nordic SaaS Company - Strategic Acquisition Opportunity')",
  "tagline": "One-line elevator pitch (max 100 chars)",
  "summary": "Executive summary paragraph (150-250 words) - compelling narrative about the opportunity",
  "investmentHighlights": [
    "Highlight 1: Quantifiable metric or unique advantage",
    "Highlight 2: Growth opportunity or market position",
    "Highlight 3: Financial performance or profitability",
    "Highlight 4: Competitive moat or strategic value",
    "Highlight 5: Exit timing or market conditions"
  ],
  "businessOverview": {
    "description": "Business model and operations (100-150 words)",
    "industry": "Specific industry sector",
    "products": ["Product/Service 1", "Product/Service 2"],
    "marketPosition": "Market position and competitive landscape (50-75 words)"
  },
  "financialSnapshot": {
    "revenue": "Most recent annual revenue with growth rate",
    "profitMargin": "Operating margin or EBITDA margin with context",
    "growthRate": "Historical and projected growth rates",
    "ebitda": "EBITDA figure with margin percentage"
  },
  "competitiveAdvantages": [
    "Advantage 1: Sustainable competitive moat",
    "Advantage 2: Market position or brand strength",
    "Advantage 3: Technology or IP advantage"
  ],
  "growthOpportunities": [
    "Opportunity 1: Geographic expansion potential",
    "Opportunity 2: Product development pipeline",
    "Opportunity 3: Market consolidation opportunities"
  ],
  "idealBuyer": [
    "Buyer Type 1: Strategic rationale",
    "Buyer Type 2: Synergy potential",
    "Buyer Type 3: Financial buyer angle"
  ],
  "transactionRationale": "Why now is the right time for this transaction (75-100 words)",
  "nextSteps": "Call to action for interested parties"
}

# CRITICAL RULES:

1. **Be Specific**: Use actual data from the enriched intelligence
2. **Be Compelling**: Frame everything as opportunities, not just facts
3. **Be Honest**: Don't exaggerate or fabricate data
4. **Be Professional**: Use M&A industry terminology
5. **Be Concise**: Each section should be punchy and readable
6. **Quantify**: Include specific numbers, percentages, and metrics wherever possible
7. **Focus on Value**: Highlight strategic value and synergy potential
8. **Maintain Confidentiality**: Don't include sensitive information that shouldn't be in a teaser

Generate the teaser now:`;
}

