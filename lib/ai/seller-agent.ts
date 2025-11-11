/**
 * SellerAI Agent
 * 
 * Provides intelligent content generation and optimization for sellers.
 * Features:
 * - Listing optimization
 * - Teaser generation (public marketing document)
 * - Information Memorandum (IM) generation
 * - Confidential Information Memorandum (CIM) generation
 * - Valuation suggestions
 * - Target buyer profile identification
 */

import { genAI } from "./gemini-client";

export interface CompanyInfo {
  id: string;
  name: string;
  industry: string;
  description?: string;
  founded_year?: number;
  location?: string;
  employees?: number;
  annual_revenue?: number;
  annual_profit?: number;
  growth_rate?: number;
  asking_price?: number;
  key_strengths?: string[];
  challenges?: string[];
  unique_selling_points?: string[];
  target_market?: string;
  competitors?: string[];
}

/**
 * Optimize a company listing to make it more attractive to buyers
 */
export async function optimizeListing(
  company: CompanyInfo
): Promise<{
  optimizedTitle: string;
  optimizedDescription: string;
  keyHighlights: string[];
  improvementSuggestions: string[];
  seoKeywords: string[];
}> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are an expert M&A marketing consultant optimizing a company listing to attract qualified buyers.

**Company Information:**
- Name: ${company.name}
- Industry: ${company.industry}
- Founded: ${company.founded_year || "Not specified"}
- Location: ${company.location || "Not specified"}
- Employees: ${company.employees || "Not specified"}
- Annual Revenue: ${company.annual_revenue ? `€${company.annual_revenue.toLocaleString()}` : "Not disclosed"}
- Annual Profit: ${company.annual_profit ? `€${company.annual_profit.toLocaleString()}` : "Not disclosed"}
- Growth Rate: ${company.growth_rate ? `${company.growth_rate}%` : "Not specified"}
- Asking Price: ${company.asking_price ? `€${company.asking_price.toLocaleString()}` : "Not disclosed"}
- Current Description: ${company.description || "No description provided"}
- Key Strengths: ${company.key_strengths?.join(", ") || "Not specified"}
- Unique Selling Points: ${company.unique_selling_points?.join(", ") || "Not specified"}

**Task:**
Create an optimized listing that:
1. Has a compelling, SEO-friendly title (max 100 characters)
2. Features an engaging description that highlights value (200-300 words)
3. Emphasizes key business highlights (5-7 bullet points)
4. Provides improvement suggestions for the seller
5. Suggests SEO keywords for better discoverability

**Format as JSON:**
{
  "optimizedTitle": "Compelling title",
  "optimizedDescription": "Full optimized description",
  "keyHighlights": ["Highlight 1", "Highlight 2", ...],
  "improvementSuggestions": ["Suggestion 1", "Suggestion 2", ...],
  "seoKeywords": ["keyword1", "keyword2", ...]
}`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse AI response");
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Generate a Teaser document (public marketing document)
 */
export async function generateTeaser(
  company: CompanyInfo
): Promise<{
  title: string;
  executive_summary: string;
  business_overview: string;
  financial_highlights: string;
  investment_highlights: string;
  next_steps: string;
}> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are an investment banker creating a Teaser document for a company sale.

A Teaser is a 1-2 page anonymous marketing document designed to generate buyer interest without revealing the company's identity.

**Company Information:**
- Industry: ${company.industry}
- Location: ${company.location || "Confidential"}
- Employees: ${company.employees || "Confidential"}
- Annual Revenue: ${company.annual_revenue ? `€${company.annual_revenue.toLocaleString()}` : "€XX million"}
- Annual Profit (EBITDA): ${company.annual_profit ? `€${company.annual_profit.toLocaleString()}` : "€XX million"}
- Growth Rate: ${company.growth_rate ? `${company.growth_rate}%` : "Strong growth"}
- Key Strengths: ${company.key_strengths?.join(", ") || "Established market position"}
- USPs: ${company.unique_selling_points?.join(", ") || "Unique competitive advantages"}
- Target Market: ${company.target_market || "Growing market"}

**Task:**
Create a professional Teaser document with the following sections:
1. **Title**: Catchy, anonymous title (e.g., "Leading [Industry] Business in [Region]")
2. **Executive Summary**: 2-3 sentences summarizing the opportunity
3. **Business Overview**: 1 paragraph describing the business model (keep anonymous)
4. **Financial Highlights**: Key metrics and performance indicators
5. **Investment Highlights**: 5-7 compelling reasons to acquire this business
6. **Next Steps**: Call to action for interested buyers

Keep the company anonymous - use generic terms like "The Company" or "The Business".

**Format as JSON:**
{
  "title": "Anonymous title",
  "executive_summary": "Summary text",
  "business_overview": "Overview text",
  "financial_highlights": "Financial highlights text",
  "investment_highlights": "Investment highlights text",
  "next_steps": "Next steps text"
}`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse AI response");
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Generate an Information Memorandum (IM)
 */
export async function generateIM(
  company: CompanyInfo
): Promise<{
  sections: {
    executive_summary: string;
    company_overview: string;
    products_services: string;
    market_analysis: string;
    financial_performance: string;
    management_team: string;
    operations: string;
    growth_opportunities: string;
    transaction_structure: string;
  };
}> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are creating an Information Memorandum (IM) for a company sale.

An IM is a detailed (10-20 page) document provided to qualified buyers who have signed an NDA.

**Company Information:**
- Name: ${company.name}
- Industry: ${company.industry}
- Founded: ${company.founded_year || "Not specified"}
- Location: ${company.location || "Not specified"}
- Employees: ${company.employees || "Not specified"}
- Annual Revenue: ${company.annual_revenue ? `€${company.annual_revenue.toLocaleString()}` : "Not disclosed"}
- Annual Profit: ${company.annual_profit ? `€${company.annual_profit.toLocaleString()}` : "Not disclosed"}
- Growth Rate: ${company.growth_rate ? `${company.growth_rate}%` : "Not specified"}
- Asking Price: ${company.asking_price ? `€${company.asking_price.toLocaleString()}` : "To be discussed"}
- Description: ${company.description || "No description"}
- Key Strengths: ${company.key_strengths?.join(", ") || "Not specified"}
- Challenges: ${company.challenges?.join(", ") || "None disclosed"}
- Target Market: ${company.target_market || "Not specified"}
- Competitors: ${company.competitors?.join(", ") || "Not specified"}

**Task:**
Create a comprehensive IM with detailed sections:
1. **Executive Summary**: 1-2 paragraphs
2. **Company Overview**: History, mission, values (2-3 paragraphs)
3. **Products & Services**: Detailed description of offerings
4. **Market Analysis**: Industry trends, market position, competitive landscape
5. **Financial Performance**: Revenue breakdown, profitability analysis, historical trends
6. **Management Team**: Key personnel and organizational structure
7. **Operations**: Facilities, technology, processes
8. **Growth Opportunities**: Expansion potential, untapped markets
9. **Transaction Structure**: Deal terms, timeline, process

**Format as JSON:**
{
  "sections": {
    "executive_summary": "text",
    "company_overview": "text",
    "products_services": "text",
    "market_analysis": "text",
    "financial_performance": "text",
    "management_team": "text",
    "operations": "text",
    "growth_opportunities": "text",
    "transaction_structure": "text"
  }
}`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse AI response");
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Suggest valuation range for the company
 */
export async function suggestValuation(
  company: CompanyInfo
): Promise<{
  valuation_range: {
    low: number;
    mid: number;
    high: number;
  };
  methodology: string;
  comparables: string[];
  key_value_drivers: string[];
  risks_to_valuation: string[];
  recommendations: string;
}> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are a valuation expert assessing a company for sale.

**Company Information:**
- Name: ${company.name}
- Industry: ${company.industry}
- Annual Revenue: ${company.annual_revenue ? `€${company.annual_revenue.toLocaleString()}` : "Not disclosed"}
- Annual Profit (EBITDA): ${company.annual_profit ? `€${company.annual_profit.toLocaleString()}` : "Not disclosed"}
- Growth Rate: ${company.growth_rate ? `${company.growth_rate}%` : "Not specified"}
- Employees: ${company.employees || "Not specified"}
- Founded: ${company.founded_year || "Not specified"}
- Current Asking Price: ${company.asking_price ? `€${company.asking_price.toLocaleString()}` : "Not set"}
- Key Strengths: ${company.key_strengths?.join(", ") || "Not specified"}
- Challenges: ${company.challenges?.join(", ") || "None disclosed"}

**Task:**
Provide a comprehensive valuation analysis:
1. **Valuation Range**: Low, mid, and high estimates (in EUR)
2. **Methodology**: Explain the valuation approach (EBITDA multiple, revenue multiple, DCF, etc.)
3. **Comparables**: List similar transactions or companies
4. **Key Value Drivers**: What makes this company valuable?
5. **Risks to Valuation**: Factors that could lower the value
6. **Recommendations**: Advice for the seller on pricing strategy

**Format as JSON:**
{
  "valuation_range": {
    "low": 1000000,
    "mid": 1500000,
    "high": 2000000
  },
  "methodology": "Explanation of valuation approach",
  "comparables": ["Comparable 1", "Comparable 2"],
  "key_value_drivers": ["Driver 1", "Driver 2"],
  "risks_to_valuation": ["Risk 1", "Risk 2"],
  "recommendations": "Pricing strategy recommendations"
}`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse AI response");
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Identify ideal buyer profiles for this company
 */
export async function identifyTargetBuyers(
  company: CompanyInfo
): Promise<{
  buyer_profiles: Array<{
    type: string;
    description: string;
    motivations: string[];
    fit_score: number;
    approach_strategy: string;
  }>;
  prioritization: string;
}> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are an M&A advisor identifying ideal buyer profiles for a company.

**Company Information:**
- Name: ${company.name}
- Industry: ${company.industry}
- Annual Revenue: ${company.annual_revenue ? `€${company.annual_revenue.toLocaleString()}` : "Not disclosed"}
- Annual Profit: ${company.annual_profit ? `€${company.annual_profit.toLocaleString()}` : "Not disclosed"}
- Location: ${company.location || "Not specified"}
- Employees: ${company.employees || "Not specified"}
- Key Strengths: ${company.key_strengths?.join(", ") || "Not specified"}
- Target Market: ${company.target_market || "Not specified"}
- USPs: ${company.unique_selling_points?.join(", ") || "Not specified"}

**Task:**
Identify 3-5 ideal buyer profiles:
1. **Type**: Strategic buyer, financial buyer, competitor, etc.
2. **Description**: Who they are and why they'd be interested
3. **Motivations**: Why they would acquire this company
4. **Fit Score**: 0-100 based on how good a match they are
5. **Approach Strategy**: How to position the deal to this buyer type

Also provide prioritization advice on which buyers to target first.

**Format as JSON:**
{
  "buyer_profiles": [
    {
      "type": "Strategic Buyer - Industry Consolidator",
      "description": "Description",
      "motivations": ["Motivation 1", "Motivation 2"],
      "fit_score": 85,
      "approach_strategy": "How to approach"
    }
  ],
  "prioritization": "Which buyers to target first and why"
}`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse AI response");
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Answer seller-specific questions
 */
export async function answerSellerQuestion(
  question: string,
  context: {
    company?: CompanyInfo;
    conversationHistory?: Array<{ role: string; content: string }>;
  }
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  let contextStr = "";

  if (context.company) {
    contextStr += `\n**Company Context:**
- Name: ${context.company.name}
- Industry: ${context.company.industry}
- Revenue: ${context.company.annual_revenue ? `€${context.company.annual_revenue.toLocaleString()}` : "Not disclosed"}
- Asking Price: ${context.company.asking_price ? `€${context.company.asking_price.toLocaleString()}` : "Not set"}
`;
  }

  if (context.conversationHistory && context.conversationHistory.length > 0) {
    contextStr += `\n**Previous Conversation:**\n`;
    contextStr += context.conversationHistory
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");
  }

  const prompt = `You are an experienced M&A advisor helping a business owner sell their company.

${contextStr}

**Seller's Question:**
${question}

**Instructions:**
- Provide expert, actionable advice
- Be honest about challenges and realistic timelines
- Use specific examples when possible
- Consider legal, financial, and emotional aspects of selling
- Keep tone professional but empathetic

**Answer:**`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text();
}

