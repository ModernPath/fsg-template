/**
 * BrokerAI Agent
 * 
 * Provides intelligent matchmaking and workflow automation for brokers.
 * Features:
 * - Buyer-seller matchmaking with ML scoring
 * - Deal workflow automation and stage management
 * - Deal success probability prediction
 * - Timeline estimation
 * - Communication template generation
 * - Negotiation insights and recommendations
 */

import { genAI } from "./gemini-client";

export interface BuyerInfo {
  id: string;
  industries: string[];
  budget_min?: number;
  budget_max?: number;
  location_preferences?: string[];
  investment_purpose?: string;
  experience_level?: string;
}

export interface CompanyListing {
  id: string;
  name: string;
  industry: string;
  asking_price?: number;
  annual_revenue?: number;
  annual_profit?: number;
  location?: string;
  description?: string;
}

export interface DealInfo {
  id: string;
  company: CompanyListing;
  buyer: BuyerInfo;
  stage: string;
  created_at: string;
  activities?: Array<{
    type: string;
    description: string;
    created_at: string;
  }>;
}

/**
 * Match buyers with suitable companies
 */
export async function matchBuyersWithCompanies(
  buyers: BuyerInfo[],
  companies: CompanyListing[]
): Promise<{
  matches: Array<{
    buyer_id: string;
    company_id: string;
    match_score: number;
    reasoning: string;
    compatibility_factors: {
      industry_fit: number;
      budget_fit: number;
      location_fit: number;
      overall: number;
    };
    recommended_approach: string;
  }>;
  insights: string;
}> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are an expert M&A broker performing intelligent buyer-seller matchmaking.

**Buyers:**
${buyers.map((b, i) => `
${i + 1}. Buyer ${b.id}
   - Industries: ${b.industries.join(", ")}
   - Budget: ${b.budget_min ? `€${b.budget_min.toLocaleString()}` : "Not specified"} - ${b.budget_max ? `€${b.budget_max.toLocaleString()}` : "Not specified"}
   - Locations: ${b.location_preferences?.join(", ") || "Any"}
   - Purpose: ${b.investment_purpose || "Not specified"}
   - Experience: ${b.experience_level || "Not specified"}
`).join("\n")}

**Companies:**
${companies.map((c, i) => `
${i + 1}. ${c.name} (${c.id})
   - Industry: ${c.industry}
   - Price: ${c.asking_price ? `€${c.asking_price.toLocaleString()}` : "Not disclosed"}
   - Revenue: ${c.annual_revenue ? `€${c.annual_revenue.toLocaleString()}` : "Not disclosed"}
   - Location: ${c.location || "Not disclosed"}
`).join("\n")}

**Task:**
1. Analyze compatibility between each buyer and company
2. Calculate match scores considering:
   - Industry alignment
   - Budget/price fit
   - Location preferences
   - Strategic fit
3. For each strong match (score > 60), provide:
   - Match score (0-100)
   - Reasoning
   - Compatibility breakdown
   - Recommended approach for introduction
4. Provide overall matchmaking insights

**Format as JSON:**
{
  "matches": [
    {
      "buyer_id": "buyer_id",
      "company_id": "company_id",
      "match_score": 85,
      "reasoning": "Why this is a good match",
      "compatibility_factors": {
        "industry_fit": 90,
        "budget_fit": 80,
        "location_fit": 85,
        "overall": 85
      },
      "recommended_approach": "How to introduce"
    }
  ],
  "insights": "Overall matchmaking insights"
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
 * Predict deal success probability and timeline
 */
export async function predictDealOutcome(
  deal: DealInfo
): Promise<{
  success_probability: number;
  estimated_timeline_days: {
    optimistic: number;
    realistic: number;
    pessimistic: number;
  };
  key_success_factors: string[];
  risk_factors: string[];
  current_stage_analysis: string;
  recommended_actions: string[];
}> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const daysSinceCreated = Math.floor(
    (new Date().getTime() - new Date(deal.created_at).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const prompt = `You are an M&A data scientist predicting deal outcomes.

**Deal Information:**
- Company: ${deal.company.name}
- Industry: ${deal.company.industry}
- Asking Price: ${deal.company.asking_price ? `€${deal.company.asking_price.toLocaleString()}` : "Not disclosed"}
- Current Stage: ${deal.stage}
- Days in Process: ${daysSinceCreated}
- Recent Activities: ${deal.activities?.slice(0, 5).map((a) => `${a.type}: ${a.description}`).join("; ") || "None"}

**Buyer Profile:**
- Industries of Interest: ${deal.buyer.industries.join(", ")}
- Budget: ${deal.buyer.budget_min ? `€${deal.buyer.budget_min.toLocaleString()}` : "Not specified"} - ${deal.buyer.budget_max ? `€${deal.buyer.budget_max.toLocaleString()}` : "Not specified"}
- Experience Level: ${deal.buyer.experience_level || "Not specified"}

**Task:**
Analyze this deal and predict:
1. **Success Probability** (0-100): Likelihood of closing
2. **Timeline Estimates**: Optimistic, realistic, and pessimistic scenarios (in days)
3. **Key Success Factors**: What's going well
4. **Risk Factors**: What could derail the deal
5. **Current Stage Analysis**: Assessment of current position
6. **Recommended Actions**: Next steps to improve success probability

**Format as JSON:**
{
  "success_probability": 75,
  "estimated_timeline_days": {
    "optimistic": 45,
    "realistic": 60,
    "pessimistic": 90
  },
  "key_success_factors": ["Factor 1", "Factor 2"],
  "risk_factors": ["Risk 1", "Risk 2"],
  "current_stage_analysis": "Analysis of current stage",
  "recommended_actions": ["Action 1", "Action 2", "Action 3"]
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
 * Generate communication templates for various deal stages
 */
export async function generateCommunicationTemplate(
  templateType:
    | "initial_introduction"
    | "nda_request"
    | "meeting_invitation"
    | "offer_submission"
    | "negotiation_update"
    | "deal_closing"
    | "deal_declined",
  context: {
    buyer_name?: string;
    seller_name?: string;
    company_name?: string;
    additional_info?: string;
  }
): Promise<{
  subject: string;
  body: string;
  tone: string;
  follow_up_timing: string;
}> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are an experienced M&A broker crafting professional communications.

**Template Type:** ${templateType}

**Context:**
- Buyer: ${context.buyer_name || "[Buyer Name]"}
- Seller: ${context.seller_name || "[Seller Name]"}
- Company: ${context.company_name || "[Company Name]"}
- Additional Info: ${context.additional_info || "None"}

**Task:**
Create a professional email template for this stage of the M&A process.

Requirements:
1. **Subject Line**: Clear and professional
2. **Body**: Well-structured, professional tone, actionable
3. **Tone Description**: Guidance on delivery
4. **Follow-up Timing**: When to follow up if no response

The template should:
- Be concise yet complete
- Use merge fields (e.g., {{buyer_name}}) for personalization
- Include clear next steps or calls to action
- Maintain professional M&A standards
- Be culturally appropriate for international deals

**Format as JSON:**
{
  "subject": "Email subject line",
  "body": "Full email body with merge fields",
  "tone": "Description of recommended tone",
  "follow_up_timing": "When to follow up"
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
 * Provide negotiation insights and strategy recommendations
 */
export async function provideNegotiationInsights(
  deal: DealInfo,
  currentOffer?: {
    amount: number;
    terms: string;
  }
): Promise<{
  strategy_assessment: string;
  buyer_position_strength: number;
  seller_position_strength: number;
  deal_temperature: "hot" | "warm" | "cold";
  negotiation_tactics: Array<{
    tactic: string;
    description: string;
    timing: string;
    success_probability: number;
  }>;
  counter_offer_suggestions?: {
    recommended_amount: number;
    reasoning: string;
    terms_to_adjust: string[];
  };
  walk_away_signals: string[];
}> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are a master negotiator providing strategic insights for an M&A deal.

**Deal Context:**
- Company: ${deal.company.name}
- Asking Price: ${deal.company.asking_price ? `€${deal.company.asking_price.toLocaleString()}` : "Not disclosed"}
- Current Stage: ${deal.stage}
- Deal Age: ${Math.floor((new Date().getTime() - new Date(deal.created_at).getTime()) / (1000 * 60 * 60 * 24))} days

${
  currentOffer
    ? `**Current Offer:**
- Amount: €${currentOffer.amount.toLocaleString()}
- Terms: ${currentOffer.terms}`
    : ""
}

**Recent Activities:**
${deal.activities?.slice(0, 5).map((a) => `- ${a.type}: ${a.description}`).join("\n") || "No recent activities"}

**Task:**
Provide comprehensive negotiation analysis:
1. **Strategy Assessment**: Overall evaluation of negotiation progress
2. **Position Strength**: Scores for buyer and seller (0-100)
3. **Deal Temperature**: hot/warm/cold assessment
4. **Negotiation Tactics**: Specific tactics to use now, with timing and success probability
5. **Counter-Offer Suggestions**: If current offer exists, suggest counter-offer
6. **Walk-Away Signals**: Warning signs to watch for

**Format as JSON:**
{
  "strategy_assessment": "Overall assessment",
  "buyer_position_strength": 65,
  "seller_position_strength": 70,
  "deal_temperature": "warm",
  "negotiation_tactics": [
    {
      "tactic": "Tactic name",
      "description": "How to apply",
      "timing": "When to use",
      "success_probability": 75
    }
  ],
  "counter_offer_suggestions": {
    "recommended_amount": 1250000,
    "reasoning": "Why this amount",
    "terms_to_adjust": ["Term 1", "Term 2"]
  },
  "walk_away_signals": ["Signal 1", "Signal 2"]
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
 * Generate workflow recommendations for deal progression
 */
export async function generateWorkflowRecommendations(
  deal: DealInfo
): Promise<{
  current_stage_tasks: Array<{
    task: string;
    priority: "high" | "medium" | "low";
    estimated_time: string;
    assignee_role: string;
  }>;
  next_stage_requirements: string[];
  blockers: Array<{
    blocker: string;
    severity: "critical" | "moderate" | "minor";
    resolution: string;
  }>;
  automation_opportunities: string[];
  timeline_projection: string;
}> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are a process optimization expert analyzing M&A deal workflow.

**Deal:**
- Company: ${deal.company.name}
- Stage: ${deal.stage}
- Days Active: ${Math.floor((new Date().getTime() - new Date(deal.created_at).getTime()) / (1000 * 60 * 60 * 24))}

**Recent Activities:**
${deal.activities?.map((a) => `- ${a.type}: ${a.description} (${a.created_at})`).join("\n") || "No activities"}

**Task:**
Provide workflow optimization recommendations:
1. **Current Stage Tasks**: What needs to be done now (prioritized)
2. **Next Stage Requirements**: What's needed to progress
3. **Blockers**: Current impediments and how to resolve them
4. **Automation Opportunities**: Tasks that could be automated
5. **Timeline Projection**: Estimated time to next stage and close

**Format as JSON:**
{
  "current_stage_tasks": [
    {
      "task": "Task description",
      "priority": "high",
      "estimated_time": "2 hours",
      "assignee_role": "broker"
    }
  ],
  "next_stage_requirements": ["Requirement 1", "Requirement 2"],
  "blockers": [
    {
      "blocker": "Issue description",
      "severity": "critical",
      "resolution": "How to resolve"
    }
  ],
  "automation_opportunities": ["Opportunity 1", "Opportunity 2"],
  "timeline_projection": "Expected timeline to progress"
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
 * Answer broker-specific questions
 */
export async function answerBrokerQuestion(
  question: string,
  context: {
    deal?: DealInfo;
    conversationHistory?: Array<{ role: string; content: string }>;
  }
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  let contextStr = "";

  if (context.deal) {
    contextStr += `\n**Deal Context:**
- Company: ${context.deal.company.name}
- Stage: ${context.deal.stage}
- Days Active: ${Math.floor((new Date().getTime() - new Date(context.deal.created_at).getTime()) / (1000 * 60 * 60 * 24))}
`;
  }

  if (context.conversationHistory && context.conversationHistory.length > 0) {
    contextStr += `\n**Previous Conversation:**\n`;
    contextStr += context.conversationHistory
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");
  }

  const prompt = `You are an experienced M&A broker providing expert advice.

${contextStr}

**Broker's Question:**
${question}

**Instructions:**
- Provide actionable, professional advice
- Consider legal, financial, and relational aspects
- Suggest specific next steps when appropriate
- Reference industry best practices
- Keep tone professional and strategic

**Answer:**`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text();
}

