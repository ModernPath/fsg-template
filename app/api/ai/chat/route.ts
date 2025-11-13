import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const GEMINI_API_KEY = process.env.GOOGLE_AI_STUDIO_KEY || process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("⚠️ Gemini API key not configured! Set GEMINI_API_KEY or GOOGLE_AI_STUDIO_KEY in .env.local");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || "");

/**
 * POST /api/ai/chat
 * 
 * AI Chat endpoint with role-aware context
 * 
 * Body:
 * - message: string
 * - context?: {
 *     role: UserRole
 *     resourceType?: string (company, deal, etc.)
 *     resourceId?: string
 *   }
 * - conversationId?: string (for maintaining conversation history)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('\n📝 [POST /api/ai/chat]');
    
    // Check if Gemini API key is configured
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API-avain puuttuu. Lisää GEMINI_API_KEY tai GOOGLE_AI_STUDIO_KEY .env.local-tiedostoon." },
        { status: 500 }
      );
    }

    // 1. Get and verify Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid auth header');
      return NextResponse.json(
        { error: "Kirjaudu sisään käyttääksesi AI-chatia" },
        { status: 401 }
      );
    }

    // 2. Create auth client and verify token
    console.log('🔑 Creating auth client...');
    const supabase = await createClient();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.split(' ')[1]);

    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json(
        { error: "Kirjaudu sisään käyttääksesi AI-chatia" },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', user.id);

    const { message, context, conversationId } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Get user profile for role context
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single();

    const userRole = context?.role || profile?.role || "visitor";

    // Build system prompt based on role
    let systemPrompt = getSystemPromptForRole(userRole);

    // Add resource-specific context if provided
    if (context?.resourceType && context?.resourceId) {
      const resourceContext = await getResourceContext(
        supabase,
        context.resourceType,
        context.resourceId
      );
      if (resourceContext) {
        systemPrompt += `\n\n**Current Context:**\n${resourceContext}`;
      }
    }

    // Get conversation history if conversationId provided
    let conversationHistory: any[] = [];
    if (conversationId) {
      const { data: historyData } = await supabase
        .from("ai_interactions")
        .select("user_message, ai_response")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(10);

      if (historyData) {
        conversationHistory = historyData.flatMap((item) => [
          { role: "user", parts: [{ text: item.user_message }] },
          { role: "model", parts: [{ text: item.ai_response }] },
        ]);
      }
    }

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      systemInstruction: systemPrompt,
    });

    // Generate response
    const chat = model.startChat({
      history: conversationHistory,
    });

    const result = await chat.sendMessage(message);
    const response = result.response;
    const aiResponse = response.text();

    // Log interaction to database
    const newConversationId = conversationId || crypto.randomUUID();
    await supabase.from("ai_interactions").insert({
      user_id: user.id,
      conversation_id: newConversationId,
      user_message: message,
      ai_response: aiResponse,
      context: {
        role: userRole,
        resourceType: context?.resourceType,
        resourceId: context?.resourceId,
      },
      model_used: "gemini-2.0-flash-exp",
    });

    return NextResponse.json({
      response: aiResponse,
      conversationId: newConversationId,
      role: userRole,
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json(
      { error: "Failed to generate AI response" },
      { status: 500 }
    );
  }
}

/**
 * Get system prompt based on user role
 */
function getSystemPromptForRole(role: string): string {
  const basePrompt = `You are an AI assistant for BizExit, a mergers and acquisitions (M&A) platform. Be professional, concise, and helpful.`;

  const rolePrompts: Record<string, string> = {
    buyer: `${basePrompt}

You are assisting a **Buyer** looking to acquire businesses. Your goals:
- Help them discover suitable companies
- Analyze financial health and risks
- Generate due diligence questions
- Provide market insights and valuation guidance
- Guide them through the acquisition process

Be analytical, risk-aware, and strategic.`,

    seller: `${basePrompt}

You are assisting a **Seller** preparing to sell their business. Your goals:
- Help optimize their company listing
- Generate marketing materials (teasers, IMs, CIMs)
- Provide pricing recommendations
- Suggest improvements to increase value
- Guide them through the sales process

Be constructive, optimistic, and strategic.`,

    broker: `${basePrompt}

You are assisting a **Broker/Intermediary** facilitating M&A deals. Your goals:
- Help match buyers with sellers
- Prioritize and manage deal pipelines
- Generate deal documents and proposals
- Provide market insights and forecasts
- Automate workflow tasks

Be efficient, data-driven, and proactive.`,

    partner: `${basePrompt}

You are assisting a **Partner** (bank, insurance company, law firm, or financial institution). Your goals:
- Conduct risk assessments
- Generate financing proposals and insurance plans
- Assist with due diligence and legal documents
- Provide compliance and regulatory guidance

Be thorough, precise, and compliance-focused.`,

    admin: `${basePrompt}

You are assisting an **Admin** managing the BizExit platform. Your goals:
- Monitor system health and user activity
- Detect fraud and moderate content
- Provide analytics and insights
- Optimize platform performance
- Assist with user management

Be analytical, security-focused, and efficient.`,

    visitor: `${basePrompt}

You are assisting a **Visitor** exploring the BizExit platform. Your goals:
- Explain how BizExit works
- Help them find relevant companies for sale
- Answer general M&A questions
- Guide them to register as a Buyer or Seller

Be welcoming, informative, and encouraging.`,
  };

  return rolePrompts[role] || rolePrompts.visitor;
}

/**
 * Get context about a specific resource
 */
async function getResourceContext(
  supabase: any,
  resourceType: string,
  resourceId: string
): Promise<string | null> {
  try {
    if (resourceType === "company") {
      const { data } = await supabase
        .from("companies")
        .select(
          `
          name,
          industry,
          location,
          description,
          asking_price,
          revenue,
          ebitda,
          company_financials(
            revenue,
            ebitda,
            net_profit
          )
        `
        )
        .eq("id", resourceId)
        .single();

      if (data) {
        return `Company: ${data.name}
Industry: ${data.industry || "N/A"}
Location: ${data.location || "N/A"}
Asking Price: ${data.asking_price ? `€${data.asking_price.toLocaleString()}` : "N/A"}
Revenue: ${data.revenue ? `€${data.revenue.toLocaleString()}` : "N/A"}
EBITDA: ${data.ebitda ? `€${data.ebitda.toLocaleString()}` : "N/A"}
Description: ${data.description || "N/A"}`;
      }
    } else if (resourceType === "deal") {
      const { data } = await supabase
        .from("deals")
        .select(
          `
          deal_name,
          stage,
          status,
          estimated_value,
          companies(
            name,
            industry
          )
        `
        )
        .eq("id", resourceId)
        .single();

      if (data) {
        return `Deal: ${data.deal_name}
Company: ${data.companies?.name || "N/A"}
Industry: ${data.companies?.industry || "N/A"}
Stage: ${data.stage || "N/A"}
Status: ${data.status || "N/A"}
Estimated Value: ${data.estimated_value ? `€${data.estimated_value.toLocaleString()}` : "N/A"}`;
      }
    }
  } catch (error) {
    console.error("Error fetching resource context:", error);
  }

  return null;
}

