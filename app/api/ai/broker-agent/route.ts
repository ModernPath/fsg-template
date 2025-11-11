import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import {
  matchBuyersWithCompanies,
  predictDealOutcome,
  generateCommunicationTemplate,
  provideNegotiationInsights,
  generateWorkflowRecommendations,
  answerBrokerQuestion,
  type BuyerInfo,
  type CompanyListing,
  type DealInfo,
} from "@/lib/ai/broker-agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/ai/broker-agent
 * 
 * Handles various BrokerAI agent actions:
 * - match: Match buyers with companies
 * - predict: Predict deal outcome and timeline
 * - communicate: Generate communication templates
 * - negotiate: Provide negotiation insights
 * - workflow: Generate workflow recommendations
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

    // Verify user is a broker or admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["broker", "admin"].includes(profile.role)) {
      return NextResponse.json(
        { error: "Only brokers and admins can access this service" },
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
      case "match": {
        const { buyers, companies } = params;

        if (!buyers || !companies) {
          return NextResponse.json(
            { error: "Missing required parameters" },
            { status: 400 }
          );
        }

        const result = await matchBuyersWithCompanies(
          buyers as BuyerInfo[],
          companies as CompanyListing[]
        );

        await logInteraction(
          `Match ${buyers.length} buyers with ${companies.length} companies`,
          result
        );

        return NextResponse.json(result);
      }

      case "predict": {
        const { deal } = params;

        if (!deal) {
          return NextResponse.json(
            { error: "Missing required parameters" },
            { status: 400 }
          );
        }

        const result = await predictDealOutcome(deal as DealInfo);

        await logInteraction(
          `Predict outcome for deal: ${deal.company.name}`,
          result
        );

        return NextResponse.json(result);
      }

      case "communicate": {
        const { templateType, context } = params;

        if (!templateType) {
          return NextResponse.json(
            { error: "Missing template type" },
            { status: 400 }
          );
        }

        const result = await generateCommunicationTemplate(
          templateType,
          context || {}
        );

        await logInteraction(
          `Generate ${templateType} communication template`,
          result
        );

        return NextResponse.json(result);
      }

      case "negotiate": {
        const { deal, currentOffer } = params;

        if (!deal) {
          return NextResponse.json(
            { error: "Missing required parameters" },
            { status: 400 }
          );
        }

        const result = await provideNegotiationInsights(deal, currentOffer);

        await logInteraction(
          `Negotiation insights for deal: ${deal.company.name}`,
          result
        );

        return NextResponse.json(result);
      }

      case "workflow": {
        const { deal } = params;

        if (!deal) {
          return NextResponse.json(
            { error: "Missing required parameters" },
            { status: 400 }
          );
        }

        const result = await generateWorkflowRecommendations(deal as DealInfo);

        await logInteraction(
          `Workflow recommendations for deal: ${deal.company.name}`,
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

        const answer = await answerBrokerQuestion(question, context || {});

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
    console.error("BrokerAI agent error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

