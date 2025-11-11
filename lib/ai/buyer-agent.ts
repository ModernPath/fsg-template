/**
 * BuyerAI Agent
 * 
 * Provides intelligent recommendations and analysis for buyers looking to acquire companies.
 * Features:
 * - Company recommendations based on buyer profile
 * - Deal analysis and risk assessment
 * - Comparative analysis of multiple companies
 * - Q&A about specific companies or deals
 */

import { genAI } from "./gemini-client";

export interface BuyerProfile {
  id: string;
  industries: string[];
  min_price?: number;
  max_price?: number;
  min_revenue?: number;
  max_revenue?: number;
  locations?: string[];
  company_size_preference?: string;
  investment_purpose?: string;
}

export interface CompanyData {
  id: string;
  name: string;
  industry: string;
  description?: string;
  asking_price?: number;
  annual_revenue?: number;
  annual_profit?: number;
  location?: string;
  employees?: number;
  founded_year?: number;
}

export interface DealData {
  id: string;
  company: CompanyData;
  stage: string;
  buyer_notes?: string;
  seller_notes?: string;
}

/**
 * Generate personalized company recommendations for a buyer
 */
export async function generateCompanyRecommendations(
  buyerProfile: BuyerProfile,
  availableCompanies: CompanyData[],
  limit: number = 5
): Promise<{
  recommendations: Array<{
    company: CompanyData;
    matchScore: number;
    reasoning: string;
    strengths: string[];
    risks: string[];
  }>;
  summary: string;
}> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are an experienced M&A advisor helping a buyer find the perfect company to acquire.

**Buyer Profile:**
- Industries of interest: ${buyerProfile.industries.join(", ")}
- Budget: ${buyerProfile.min_price ? `€${buyerProfile.min_price.toLocaleString()}` : "Not specified"} - ${buyerProfile.max_price ? `€${buyerProfile.max_price.toLocaleString()}` : "Not specified"}
- Preferred revenue range: ${buyerProfile.min_revenue ? `€${buyerProfile.min_revenue.toLocaleString()}` : "Not specified"} - ${buyerProfile.max_revenue ? `€${buyerProfile.max_revenue.toLocaleString()}` : "Not specified"}
- Preferred locations: ${buyerProfile.locations?.join(", ") || "Any"}
- Investment purpose: ${buyerProfile.investment_purpose || "Not specified"}

**Available Companies:**
${availableCompanies.map((c, i) => `
${i + 1}. ${c.name}
   - Industry: ${c.industry}
   - Asking Price: ${c.asking_price ? `€${c.asking_price.toLocaleString()}` : "Not disclosed"}
   - Annual Revenue: ${c.annual_revenue ? `€${c.annual_revenue.toLocaleString()}` : "Not disclosed"}
   - Annual Profit: ${c.annual_profit ? `€${c.annual_profit.toLocaleString()}` : "Not disclosed"}
   - Location: ${c.location || "Not disclosed"}
   - Employees: ${c.employees || "Not disclosed"}
   - Description: ${c.description || "No description available"}
`).join("\n")}

**Task:**
1. Analyze each company against the buyer's profile
2. Rank the top ${limit} companies that best match the buyer's needs
3. For each recommended company, provide:
   - Match score (0-100)
   - Reasoning for the recommendation
   - Key strengths (3-5 points)
   - Potential risks or concerns (2-3 points)
4. Provide an executive summary

**Format your response as JSON:**
{
  "recommendations": [
    {
      "companyId": "company_id",
      "matchScore": 85,
      "reasoning": "Brief explanation of why this is a good match",
      "strengths": ["Strength 1", "Strength 2", "Strength 3"],
      "risks": ["Risk 1", "Risk 2"]
    }
  ],
  "summary": "Executive summary of the recommendations"
}`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  // Parse JSON response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse AI response");
  }

  const aiResponse = JSON.parse(jsonMatch[0]);

  // Map company IDs to full company data
  const recommendations = aiResponse.recommendations.map((rec: any) => {
    const company = availableCompanies.find((c) => c.id === rec.companyId);
    if (!company) {
      throw new Error(`Company not found: ${rec.companyId}`);
    }
    return {
      company,
      matchScore: rec.matchScore,
      reasoning: rec.reasoning,
      strengths: rec.strengths,
      risks: rec.risks,
    };
  });

  return {
    recommendations,
    summary: aiResponse.summary,
  };
}

/**
 * Analyze a specific deal from the buyer's perspective
 */
export async function analyzeDeal(
  deal: DealData,
  buyerProfile: BuyerProfile
): Promise<{
  overallAssessment: string;
  financialAnalysis: {
    valueScore: number;
    comments: string;
  };
  strategicFit: {
    score: number;
    comments: string;
  };
  risks: Array<{
    category: string;
    severity: "high" | "medium" | "low";
    description: string;
    mitigation: string;
  }>;
  opportunities: string[];
  recommendation: "proceed" | "negotiate" | "pass";
  nextSteps: string[];
}> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are an experienced M&A advisor analyzing a potential acquisition for your client.

**Buyer Profile:**
- Industries of interest: ${buyerProfile.industries.join(", ")}
- Budget: ${buyerProfile.min_price ? `€${buyerProfile.min_price.toLocaleString()}` : "Not specified"} - ${buyerProfile.max_price ? `€${buyerProfile.max_price.toLocaleString()}` : "Not specified"}
- Investment purpose: ${buyerProfile.investment_purpose || "Not specified"}

**Deal Information:**
- Company: ${deal.company.name}
- Industry: ${deal.company.industry}
- Asking Price: ${deal.company.asking_price ? `€${deal.company.asking_price.toLocaleString()}` : "Not disclosed"}
- Annual Revenue: ${deal.company.annual_revenue ? `€${deal.company.annual_revenue.toLocaleString()}` : "Not disclosed"}
- Annual Profit: ${deal.company.annual_profit ? `€${deal.company.annual_profit.toLocaleString()}` : "Not disclosed"}
- Current Stage: ${deal.stage}
- Buyer Notes: ${deal.buyer_notes || "None"}

**Task:**
Provide a comprehensive analysis of this deal including:
1. Overall assessment (2-3 paragraphs)
2. Financial analysis with value score (0-100) and comments
3. Strategic fit analysis with score (0-100) and comments
4. Identified risks (categorize as high/medium/low with mitigation strategies)
5. Key opportunities
6. Final recommendation (proceed/negotiate/pass)
7. Suggested next steps

**Format your response as JSON:**
{
  "overallAssessment": "Comprehensive assessment text",
  "financialAnalysis": {
    "valueScore": 75,
    "comments": "Financial analysis comments"
  },
  "strategicFit": {
    "score": 85,
    "comments": "Strategic fit comments"
  },
  "risks": [
    {
      "category": "Financial",
      "severity": "medium",
      "description": "Risk description",
      "mitigation": "How to mitigate this risk"
    }
  ],
  "opportunities": ["Opportunity 1", "Opportunity 2"],
  "recommendation": "proceed",
  "nextSteps": ["Step 1", "Step 2", "Step 3"]
}`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  // Parse JSON response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse AI response");
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Compare multiple companies side-by-side
 */
export async function compareCompanies(
  companies: CompanyData[],
  criteriaWeights?: {
    financials?: number;
    growth?: number;
    location?: number;
    industry?: number;
  }
): Promise<{
  comparison: {
    [companyId: string]: {
      scores: {
        financials: number;
        growth: number;
        location: number;
        industry: number;
        overall: number;
      };
      comments: string;
    };
  };
  winner: string;
  summary: string;
}> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const weights = {
    financials: criteriaWeights?.financials || 40,
    growth: criteriaWeights?.growth || 30,
    location: criteriaWeights?.location || 15,
    industry: criteriaWeights?.industry || 15,
  };

  const prompt = `You are an M&A analyst comparing multiple companies for acquisition.

**Companies to Compare:**
${companies.map((c, i) => `
${i + 1}. ${c.name}
   - Industry: ${c.industry}
   - Asking Price: ${c.asking_price ? `€${c.asking_price.toLocaleString()}` : "Not disclosed"}
   - Annual Revenue: ${c.annual_revenue ? `€${c.annual_revenue.toLocaleString()}` : "Not disclosed"}
   - Annual Profit: ${c.annual_profit ? `€${c.annual_profit.toLocaleString()}` : "Not disclosed"}
   - Location: ${c.location || "Not disclosed"}
   - Employees: ${c.employees || "Not disclosed"}
   - Founded: ${c.founded_year || "Not disclosed"}
   - Description: ${c.description || "No description"}
`).join("\n")}

**Comparison Criteria Weights:**
- Financials: ${weights.financials}%
- Growth Potential: ${weights.growth}%
- Location: ${weights.location}%
- Industry Attractiveness: ${weights.industry}%

**Task:**
Compare these companies across all criteria and provide:
1. Individual scores (0-100) for each criterion per company
2. Weighted overall score
3. Brief comments for each company
4. Identify the overall winner
5. Executive summary of the comparison

**Format as JSON:**
{
  "comparison": {
    "company_id": {
      "scores": {
        "financials": 85,
        "growth": 70,
        "location": 90,
        "industry": 80,
        "overall": 81
      },
      "comments": "Brief comments about this company"
    }
  },
  "winner": "company_id_of_winner",
  "summary": "Executive summary of comparison"
}`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  // Parse JSON response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse AI response");
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Answer buyer-specific questions about companies or deals
 */
export async function answerBuyerQuestion(
  question: string,
  context: {
    buyerProfile?: BuyerProfile;
    company?: CompanyData;
    deal?: DealData;
    conversationHistory?: Array<{ role: string; content: string }>;
  }
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  let contextStr = "";

  if (context.buyerProfile) {
    contextStr += `\n**Buyer Profile:**
- Industries: ${context.buyerProfile.industries.join(", ")}
- Budget: ${context.buyerProfile.min_price ? `€${context.buyerProfile.min_price.toLocaleString()}` : "Not specified"} - ${context.buyerProfile.max_price ? `€${context.buyerProfile.max_price.toLocaleString()}` : "Not specified"}
`;
  }

  if (context.company) {
    contextStr += `\n**Company:**
- Name: ${context.company.name}
- Industry: ${context.company.industry}
- Asking Price: ${context.company.asking_price ? `€${context.company.asking_price.toLocaleString()}` : "Not disclosed"}
- Revenue: ${context.company.annual_revenue ? `€${context.company.annual_revenue.toLocaleString()}` : "Not disclosed"}
- Profit: ${context.company.annual_profit ? `€${context.company.annual_profit.toLocaleString()}` : "Not disclosed"}
`;
  }

  if (context.conversationHistory && context.conversationHistory.length > 0) {
    contextStr += `\n**Previous Conversation:**\n`;
    contextStr += context.conversationHistory
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");
  }

  const prompt = `You are an experienced M&A advisor helping a buyer with their acquisition questions.

${contextStr}

**Buyer's Question:**
${question}

**Instructions:**
- Provide a clear, professional, and actionable answer
- Use specific numbers and data from the context when available
- If you don't have enough information, clearly state what additional information would be helpful
- Be honest about risks and uncertainties
- Keep the tone professional but approachable

**Answer:**`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text();
}

