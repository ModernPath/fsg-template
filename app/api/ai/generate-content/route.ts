import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_AI_STUDIO_KEY || process.env.GEMINI_API_KEY || ""
);

/**
 * POST /api/ai/generate-content
 * 
 * Generate AI content for specific purposes
 * 
 * Body:
 * - type: "teaser" | "im" | "cim" | "due_diligence" | "risk_assessment" | "recommendation"
 * - resourceType: "company" | "deal"
 * - resourceId: string
 * - params?: Record<string, any> (additional parameters)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('\n📝 [POST /api/ai/generate-content]');
    
    // 1. Get and verify Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid auth header');
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    // 2. Create auth client and verify token
    console.log('🔑 Creating auth client...');
    const authClient = await createClient();
    
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser(authHeader.split(' ')[1]);

    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', user.id);

    // 3. Create service role client for database operations
    console.log('🔑 Creating service role client...');
    const supabase = await createClient(undefined, true);

    const { type, resourceType, resourceId, params, context } = await request.json();

    // Allow onboarding types without resourceType/resourceId
    const onboardingTypes = ["organization_name", "organization_description"];
    const isOnboarding = onboardingTypes.includes(type);

    if (!isOnboarding && (!type || !resourceType || !resourceId)) {
      return NextResponse.json(
        { error: "Missing required fields: type, resourceType, resourceId" },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { error: "Missing required field: type" },
        { status: 400 }
      );
    }

    // Get user profile
    console.log('👤 Fetching profile for user:', user.id);
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    console.log('👤 Profile data:', profile);
    console.log('👤 Profile error:', profileError);
    console.log('👤 User role:', profile?.role);
    console.log('📝 Content type:', type);

    // Check permissions based on content type
    if (!canGenerateContent(profile?.role, type)) {
      console.error('❌ Permission denied:', {
        role: profile?.role,
        type,
        hasPermission: canGenerateContent(profile?.role, type)
      });
      return NextResponse.json(
        { error: `Forbidden: Insufficient permissions (role: ${profile?.role}, type: ${type})` },
        { status: 403 }
      );
    }

    console.log('✅ Permission granted for role:', profile?.role);

    let resourceData = null;
    let prompt = "";

    // Handle onboarding types
    if (isOnboarding) {
      prompt = buildOnboardingPrompt(type, context);
    } else {
      // Fetch resource data for regular content types
      resourceData = await fetchResourceData(
        supabase,
        resourceType,
        resourceId
      );

      if (!resourceData) {
        return NextResponse.json(
          { error: "Resource not found" },
          { status: 404 }
        );
      }

      // Generate content based on type
      prompt = buildPromptForType(type, resourceData, params);
    }
    
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const generatedContent = response.text();

    // Save generated content to database (skip for onboarding types)
    let savedContent = null;
    if (!isOnboarding) {
      const { data, error: saveError } = await supabase
        .from("ai_generated_content")
        .insert({
          user_id: user.id,
          content_type: type,
          content: generatedContent,
          resource_type: resourceType,
          resource_id: resourceId,
          model_used: "gemini-2.0-flash-exp",
          metadata: {
            params,
            resourceData: {
              name: resourceData?.name,
              type: resourceType,
            },
          },
        })
        .select()
        .single();

      if (saveError) {
        console.error("Failed to save generated content:", saveError);
      } else {
        savedContent = data;
      }
    }

    return NextResponse.json({
      content: generatedContent,
      contentId: savedContent?.id,
      type,
      resourceType: resourceType || null,
      resourceId: resourceId || null,
    });
  } catch (error) {
    console.error("Content generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}

/**
 * Check if user role can generate specific content type
 */
function canGenerateContent(role: string | undefined, contentType: string): boolean {
  const permissions: Record<string, string[]> = {
    teaser: ["seller", "broker", "admin"],
    im: ["seller", "broker", "admin"],
    cim: ["seller", "broker", "admin"],
    pitch_deck: ["seller", "broker", "admin"],
    valuation: ["seller", "broker", "admin"],
    due_diligence: ["buyer", "broker", "partner", "admin"],
    risk_assessment: ["buyer", "partner", "admin"],
    recommendation: ["buyer", "seller", "broker", "admin"],
    organization_name: ["seller", "broker", "partner", "admin", "buyer", "visitor"],
    organization_description: ["seller", "broker", "partner", "admin", "buyer", "visitor"],
  };

  return permissions[contentType]?.includes(role || "") || false;
}

/**
 * Fetch resource data
 */
async function fetchResourceData(
  supabase: any,
  resourceType: string,
  resourceId: string
): Promise<any> {
  if (resourceType === "company") {
    const { data, error } = await supabase
      .from("companies")
      .select(
        `
        *,
        company_financials(*),
        company_assets(*)
      `
      )
      .eq("id", resourceId)
      .single();

    return error ? null : data;
  } else if (resourceType === "deal") {
    const { data, error } = await supabase
      .from("deals")
      .select(
        `
        *,
        companies(*),
        buyer_profiles(*)
      `
      )
      .eq("id", resourceId)
      .single();

    return error ? null : data;
  }

  return null;
}

/**
 * Build prompt for content type
 */
function buildPromptForType(
  type: string,
  resourceData: any,
  params?: Record<string, any>
): string {
  const prompts: Record<string, string> = {
    teaser: `Generate a compelling 1-page **Teaser** for the following company.

A teaser is a brief, anonymous marketing document designed to spark interest in a potential acquisition without revealing the company's identity.

**Company Information:**
${formatCompanyData(resourceData)}

**Requirements:**
- Keep it to 1 page (300-400 words)
- Do NOT reveal company name or specific identifying details
- Highlight key strengths and investment opportunity
- Include industry overview, business model, financial highlights, growth potential
- Use professional, engaging language
- End with a call-to-action

Generate the teaser now:`,

    im: `Generate a detailed **Information Memorandum (IM)** for the following company.

An IM is a comprehensive marketing document that provides detailed information about the company to qualified buyers who have signed an NDA.

**Company Information:**
${formatCompanyData(resourceData)}

**Requirements:**
- 5-10 pages worth of content
- Include: Executive Summary, Company Overview, Products/Services, Market Analysis, Financial Performance, Management Team, Growth Opportunities, Investment Highlights
- Use data, charts descriptions, and metrics where applicable
- Professional, detailed, factual tone
- Format with clear sections and headings

Generate the IM now:`,

    cim: `Generate a comprehensive **Confidential Information Memorandum (CIM)** for the following company.

A CIM is the most detailed marketing document, providing in-depth analysis for serious buyers.

**Company Information:**
${formatCompanyData(resourceData)}

**Requirements:**
- 15-30 pages worth of content
- Include: Detailed financials (3-5 years), operational metrics, customer analysis, competitive landscape, SWOT analysis, risk factors, growth projections, management bios
- Use tables, financial ratios, and detailed analysis
- Highly professional, investment-grade quality
- Clear section structure with table of contents

Generate the CIM now:`,

    pitch_deck: `Generate a comprehensive **Pitch Deck** presentation for the following company.

A pitch deck is a visual presentation designed to showcase the company's value proposition to potential investors or buyers.

**Company Information:**
${formatCompanyData(resourceData)}

**Requirements:**
- 10-15 slide structure with clear headings
- Include: Cover, Problem/Solution, Market Opportunity, Business Model, Traction/Metrics, Competition, Team, Financials, Investment Ask, Contact
- Each slide should have a clear title and 3-5 bullet points
- Use compelling, concise language
- Include data points and metrics where available
- Professional, investor-focused tone

Generate the pitch deck slides now (format as Slide 1: [Title], content bullets, etc.):`,

    valuation: `Generate a detailed **Valuation Report** for the following company.

A valuation report provides a comprehensive analysis of the company's worth using multiple valuation methodologies.

**Company Information:**
${formatCompanyData(resourceData)}

${params?.additionalContext ? `**Additional Context:**
${params.additionalContext}

` : ""}**Requirements:**
- Use multiple valuation methods: DCF (Discounted Cash Flow), Comparable Companies, Precedent Transactions, Asset-Based
- For each method: explain methodology, show calculations, provide valuation range
- Include key assumptions and sensitivities
- Provide weighted average valuation and final recommendation
- Professional, analytical tone with clear explanations
- Include summary of strengths, risks, and value drivers

Generate the valuation report now:`,

    due_diligence: `Generate a **Due Diligence Question List** for the following ${resourceData.deal_name ? "deal" : "company"}.

**${resourceData.deal_name ? "Deal" : "Company"} Information:**
${resourceData.deal_name ? formatDealData(resourceData) : formatCompanyData(resourceData)}

**Requirements:**
- Comprehensive list of 30-50 questions
- Cover: Financial, Legal, Operational, Commercial, HR, IT, Environmental, Regulatory areas
- Prioritize by importance (Critical, High, Medium)
- Be specific and actionable
- Format as numbered list with categories

Generate the due diligence questions now:`,

    risk_assessment: `Generate a detailed **Risk Assessment Report** for the following ${resourceData.deal_name ? "deal" : "company"}.

**${resourceData.deal_name ? "Deal" : "Company"} Information:**
${resourceData.deal_name ? formatDealData(resourceData) : formatCompanyData(resourceData)}

**Requirements:**
- Identify 10-15 key risks across categories: Financial, Market, Operational, Legal, Regulatory
- For each risk: describe it, assess likelihood (Low/Medium/High), assess impact (Low/Medium/High), provide mitigation strategies
- Include overall risk score
- Professional, analytical tone

Generate the risk assessment now:`,

    recommendation: `Generate an **Investment Recommendation** for the following ${resourceData.deal_name ? "deal" : "company"}.

**${resourceData.deal_name ? "Deal" : "Company"} Information:**
${resourceData.deal_name ? formatDealData(resourceData) : formatCompanyData(resourceData)}

**Additional Context:**
${JSON.stringify(params, null, 2)}

**Requirements:**
- Clear recommendation: "Strong Buy", "Buy", "Hold", "Pass"
- Rationale for recommendation (3-5 key points)
- Financial analysis and valuation commentary
- Key strengths and concerns
- Next steps
- Professional, balanced tone

Generate the recommendation now:`,
  };

  return prompts[type] || "Generate relevant content based on the provided data.";
}

/**
 * Format company data for prompts
 */
function formatCompanyData(company: any): string {
  return `
**Name:** ${company.name}
**Industry:** ${company.industry || "N/A"}
**Location:** ${company.city ? `${company.city}, ${company.country}` : company.country || "N/A"}
**Description:** ${company.description || "N/A"}
**Founded:** ${company.founded_year || "N/A"}
**Employees:** ${company.employees_count || "N/A"}
**Legal Structure:** ${company.legal_structure || "N/A"}
**Business ID:** ${company.business_id || "N/A"}
**Asking Price:** ${company.asking_price ? `${company.currency || "EUR"} ${company.asking_price.toLocaleString()}` : "N/A"}
**Annual Revenue:** ${company.annual_revenue ? `${company.currency || "EUR"} ${company.annual_revenue.toLocaleString()}` : "N/A"}
**Annual EBITDA:** ${company.annual_ebitda ? `${company.currency || "EUR"} ${company.annual_ebitda.toLocaleString()}` : "N/A"}

${company.company_financials?.length > 0 ? `
**Financial History:**
${company.company_financials.map((f: any) => `
- Year ${f.fiscal_year}: Revenue ${company.currency || "EUR"} ${f.revenue?.toLocaleString() || "N/A"}, EBITDA ${company.currency || "EUR"} ${f.ebitda?.toLocaleString() || "N/A"}, Net Income ${company.currency || "EUR"} ${f.net_income?.toLocaleString() || "N/A"}
`).join("")}
` : ""}

${company.company_assets?.length > 0 ? `
**Key Documents/Assets:**
${company.company_assets.map((a: any) => `- ${a.document_type || a.type}: ${a.name || a.description || "N/A"}`).join("\n")}
` : ""}
`;
}

/**
 * Format deal data for prompts
 */
function formatDealData(deal: any): string {
  return `
**Deal Name:** ${deal.deal_name}
**Stage:** ${deal.stage || "N/A"}
**Status:** ${deal.status || "N/A"}
**Estimated Value:** ${deal.estimated_value ? `€${deal.estimated_value.toLocaleString()}` : "N/A"}

**Company Information:**
${deal.companies ? formatCompanyData(deal.companies) : "N/A"}

${deal.buyer_profiles ? `
**Buyer:** ${deal.buyer_profiles.company_name || deal.buyer_profiles.full_name || "N/A"}
` : ""}
`;
}

/**
 * Build prompt for onboarding content types
 */
function buildOnboardingPrompt(type: string, context: any): string {
  if (type === "organization_name") {
    return `Generate a professional organization name based on the following information:

**User Information:**
- Name: ${context.userName || "N/A"}
- Email: ${context.userEmail || "N/A"}
- Role: ${context.userRole || "N/A"}
- Industry: ${context.industry || "N/A"}

**Requirements:**
- Generate ONE professional company name
- The name should be appropriate for the ${context.userRole} role
- ${context.industry ? `The name should reflect the ${context.industry} industry` : ""}
- Keep it short, professional, and memorable (max 50 characters)
- Do NOT include legal suffixes like Oy, Ab, Ltd (user will add these)
- Return ONLY the company name, nothing else

Generate the organization name now:`;
  }

  if (type === "organization_description") {
    return `Generate a professional organization description based on the following information:

**Organization Information:**
- Name: ${context.name}
- Industry: ${context.industry || "N/A"}
- Role: ${context.userRole || "N/A"}

**Requirements:**
- Write a 2-3 sentence professional description
- Highlight the organization's focus and expertise in ${context.industry}
- Keep it concise, professional, and engaging
- Appropriate for a ${context.userRole} in the business services industry
- Return ONLY the description, nothing else

Generate the organization description now:`;
  }

  return "Generate relevant content based on the provided information.";
}

