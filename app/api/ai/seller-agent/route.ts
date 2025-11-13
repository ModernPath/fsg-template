import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import {
  optimizeListing,
  generateTeaser,
  generateIM,
  suggestValuation,
  identifyTargetBuyers,
  answerSellerQuestion,
  type CompanyInfo,
} from "@/lib/ai/seller-agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/ai/seller-agent
 * 
 * Handles various SellerAI agent actions:
 * - optimize: Optimize company listing
 * - teaser: Generate teaser document
 * - im: Generate Information Memorandum
 * - valuation: Suggest valuation range
 * - buyers: Identify target buyers
 * - ask: Answer a question
 */
export async function POST(request: Request) {
  try {
    // Get Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid auth header');
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    // Create authenticated client
    const authClient = await createClient();
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser(token);

    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.id);

    const body = await request.json();
    const { action, ...params } = body;

    // Use service role client for database queries
    const supabase = await createClient(undefined, true);

    // Verify user is a seller, broker, or admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (
      !profile ||
      !["seller", "broker", "admin"].includes(profile.role)
    ) {
      return NextResponse.json(
        { error: "Only sellers, brokers, and admins can access this service" },
        { status: 403 }
      );
    }

    // Log the AI interaction
    const logInteraction = async (
      userMessage: string,
      aiResponse: any,
      tokensUsed: number = 0
    ) => {
      await supabase.from("ai_interactions").insert({
        user_id: user.id,
        conversation_id: params.conversationId || null,
        user_message: userMessage,
        ai_response: JSON.stringify(aiResponse),
        context: { action, profile: profile.role },
        model_used: "gemini-2.0-flash",
        tokens_used: tokensUsed,
      });
    };

    switch (action) {
      case "optimize": {
        const { company } = params;

        if (!company) {
          return NextResponse.json(
            { error: "Missing required parameters" },
            { status: 400 }
          );
        }

        const result = await optimizeListing(company as CompanyInfo);

        await logInteraction(`Optimize listing for ${company.name}`, result);

        return NextResponse.json(result);
      }

      case "teaser": {
        const { company } = params;

        if (!company) {
          return NextResponse.json(
            { error: "Missing required parameters" },
            { status: 400 }
          );
        }

        const result = await generateTeaser(company as CompanyInfo);

        await logInteraction(`Generate teaser for ${company.name}`, result);

        return NextResponse.json(result);
      }

      case "im": {
        const { company } = params;

        if (!company) {
          return NextResponse.json(
            { error: "Missing required parameters" },
            { status: 400 }
          );
        }

        const result = await generateIM(company as CompanyInfo);

        await logInteraction(`Generate IM for ${company.name}`, result);

        return NextResponse.json(result);
      }

      case "valuation": {
        const { company } = params;

        if (!company) {
          return NextResponse.json(
            { error: "Missing required parameters" },
            { status: 400 }
          );
        }

        const result = await suggestValuation(company as CompanyInfo);

        await logInteraction(`Suggest valuation for ${company.name}`, result);

        return NextResponse.json(result);
      }

      case "buyers": {
        const { company } = params;

        if (!company) {
          return NextResponse.json(
            { error: "Missing required parameters" },
            { status: 400 }
          );
        }

        const result = await identifyTargetBuyers(company as CompanyInfo);

        await logInteraction(
          `Identify target buyers for ${company.name}`,
          result
        );

        return NextResponse.json(result);
      }

      case "ask": {
        const { question, context } = params;

        if (!question) {
          return NextResponse.json(
            { error: "Missing question" },
            { status: 400 }
          );
        }

        const answer = await answerSellerQuestion(question, context || {});

        await logInteraction(question, { answer });

        return NextResponse.json({ answer });
      }

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("SellerAI agent error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

