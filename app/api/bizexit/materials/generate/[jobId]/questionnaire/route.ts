/**
 * Materials Generation - Questionnaire API
 * GET /api/bizexit/materials/generate/[jobId]/questionnaire - Get questions
 * POST /api/bizexit/materials/generate/[jobId]/questionnaire - Submit answers
 */

import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/lib/inngest-client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const supabase = await createClient();

    // Get user context
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select(`
        id,
        user_organizations!inner(
          organization_id
        )
      `)
      .eq("id", user.id)
      .single();

    const organizationId = profile?.user_organizations?.[0]?.organization_id;

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    // Get job and verify access
    const { data: job, error: jobError } = await supabase
      .from("material_generation_jobs")
      .select("id, organization_id, status")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 },
      );
    }

    if (job.organization_id !== organizationId) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 },
      );
    }

    // Get questionnaire questions
    const { data: questions, error: questionsError } = await supabase
      .from("material_questionnaire_responses")
      .select("*")
      .eq("job_id", jobId)
      .order("display_order", { ascending: true });

    if (questionsError) {
      console.error("Error fetching questions:", questionsError);
      return NextResponse.json(
        { error: "Failed to fetch questionnaire" },
        { status: 500 },
      );
    }

    // Calculate progress
    const totalQuestions = questions?.length || 0;
    const answeredQuestions = questions?.filter(q => q.answered_at).length || 0;
    const completionPercentage = totalQuestions > 0 
      ? Math.round((answeredQuestions / totalQuestions) * 100) 
      : 0;

    return NextResponse.json({
      questions: questions || [],
      progress: {
        total: totalQuestions,
        answered: answeredQuestions,
        percentage: completionPercentage,
      },
    });
  } catch (error) {
    console.error("Error in questionnaire GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const supabase = await createClient();

    // Get user context
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select(`
        id,
        user_organizations!inner(
          organization_id
        )
      `)
      .eq("id", user.id)
      .single();

    const organizationId = profile?.user_organizations?.[0]?.organization_id;

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    // Get job and verify access
    const { data: job, error: jobError } = await supabase
      .from("material_generation_jobs")
      .select("id, organization_id, status, company_id")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 },
      );
    }

    if (job.organization_id !== organizationId) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 },
      );
    }

    // Check if job is in correct state
    if (!["questionnaire_pending", "questionnaire_in_progress"].includes(job.status)) {
      return NextResponse.json(
        { error: "Job is not awaiting questionnaire responses" },
        { status: 400 },
      );
    }

    // Parse request body
    const body = await request.json();
    const { answers } = body; // answers: { questionId: answer }

    if (!answers || typeof answers !== "object") {
      return NextResponse.json(
        { error: "Invalid answers format" },
        { status: 400 },
      );
    }

    // Update job status to in_progress
    if (job.status === "questionnaire_pending") {
      await supabase
        .from("material_generation_jobs")
        .update({ status: "questionnaire_in_progress" })
        .eq("id", jobId);
    }

    // Save answers
    const answerIds = Object.keys(answers);
    const updatePromises = answerIds.map(async (questionId) => {
      return await supabase
        .from("material_questionnaire_responses")
        .update({
          answer_text: answers[questionId],
          answered_at: new Date().toISOString(),
        })
        .eq("id", questionId)
        .eq("job_id", jobId); // Ensure we only update questions for this job
    });

    const results = await Promise.all(updatePromises);
    
    // Check if any updates failed
    const failed = results.filter(r => r.error);
    if (failed.length > 0) {
      console.error("Some answers failed to save:", failed);
      return NextResponse.json(
        { error: "Failed to save some answers" },
        { status: 500 },
      );
    }

    // Check if all required questions are answered
    const { data: allQuestions } = await supabase
      .from("material_questionnaire_responses")
      .select("*")
      .eq("job_id", jobId);

    const requiredQuestions = allQuestions?.filter(q => q.is_required) || [];
    const allRequiredAnswered = requiredQuestions.every(q => q.answered_at);

    if (allRequiredAnswered) {
      // Trigger completion event
      try {
        await inngest.send({
          name: "materials/questionnaire-completed",
          data: {
            jobId: jobId,
            companyId: job.company_id,
            organizationId: organizationId,
            userId: user.id,
          },
        });
      } catch (inngestError) {
        console.error("Error triggering questionnaire completion:", inngestError);
        // Don't fail the request - answers are saved
      }

      return NextResponse.json({
        success: true,
        message: "Questionnaire completed",
        completed: true,
        saved_answers: answerIds.length,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Answers saved",
      completed: false,
      saved_answers: answerIds.length,
      remaining_required: requiredQuestions.filter(q => !q.answered_at).length,
    });
  } catch (error) {
    console.error("Error in questionnaire POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

