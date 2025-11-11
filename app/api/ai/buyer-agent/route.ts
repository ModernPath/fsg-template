import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import {
  generateCompanyRecommendations,
  analyzeDeal,
  compareCompanies,
  answerBuyerQuestion,
  type BuyerProfile,
  type CompanyData,
  type DealData,
} from "@/lib/ai/buyer-agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/ai/buyer-agent
 * 
 * Handles various BuyerAI agent actions:
 * - recommend: Generate company recommendations
 * - analyze: Analyze a specific deal
 * - compare: Compare multiple companies
 * - ask: Answer a question
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...params } = body;

    // Verify user is a buyer (or admin)
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "buyer" && profile.role !== "admin")) {
      return NextResponse.json(
        { error: "Only buyers can access this service" },
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
      case "recommend": {
        const { buyerProfile, availableCompanies, limit } = params;

        if (!buyerProfile || !availableCompanies) {
          return NextResponse.json(
            { error: "Missing required parameters" },
            { status: 400 }
          );
        }

        const result = await generateCompanyRecommendations(
          buyerProfile as BuyerProfile,
          availableCompanies as CompanyData[],
          limit
        );

        await logInteraction(
          `Generate recommendations for buyer profile`,
          result
        );

        return NextResponse.json(result);
      }

      case "analyze": {
        const { deal, buyerProfile } = params;

        if (!deal || !buyerProfile) {
          return NextResponse.json(
            { error: "Missing required parameters" },
            { status: 400 }
          );
        }

        const result = await analyzeDeal(
          deal as DealData,
          buyerProfile as BuyerProfile
        );

        await logInteraction(`Analyze deal: ${deal.company.name}`, result);

        return NextResponse.json(result);
      }

      case "compare": {
        const { companies, criteriaWeights } = params;

        if (!companies || !Array.isArray(companies)) {
          return NextResponse.json(
            { error: "Missing required parameters" },
            { status: 400 }
          );
        }

        const result = await compareCompanies(
          companies as CompanyData[],
          criteriaWeights
        );

        await logInteraction(`Compare ${companies.length} companies`, result);

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

        const answer = await answerBuyerQuestion(question, context || {});

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
    console.error("BuyerAI agent error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

