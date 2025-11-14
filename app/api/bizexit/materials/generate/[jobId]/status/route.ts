/**
 * Materials Generation - Job Status
 * GET /api/bizexit/materials/generate/[jobId]/status
 * 
 * Check the status of a materials generation job
 */

import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

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

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from("material_generation_jobs")
      .select(`
        *,
        companies(id, name, industry),
        created_by:profiles!material_generation_jobs_created_by_fkey(id, full_name, email)
      `)
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 },
      );
    }

    // Verify user has access to this job
    if (job.organization_id !== organizationId) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 },
      );
    }

    // Get related assets if generated
    const assets: any = {};
    
    if (job.teaser_asset_id) {
      const { data: teaserAsset } = await supabase
        .from("company_assets")
        .select("id, name, storage_path, created_at, gamma_presentation_url")
        .eq("id", job.teaser_asset_id)
        .single();
      assets.teaser = teaserAsset;
    }

    if (job.im_asset_id) {
      const { data: imAsset } = await supabase
        .from("company_assets")
        .select("id, name, storage_path, created_at, gamma_presentation_url")
        .eq("id", job.im_asset_id)
        .single();
      assets.im = imAsset;
    }

    if (job.pitch_deck_asset_id) {
      const { data: pitchDeckAsset } = await supabase
        .from("company_assets")
        .select("id, name, storage_path, created_at, gamma_presentation_url")
        .eq("id", job.pitch_deck_asset_id)
        .single();
      assets.pitch_deck = pitchDeckAsset;
    }

    // Get data collection status
    const { count: cachedDataCount } = await supabase
      .from("generation_data_cache")
      .select("*", { count: "exact", head: true })
      .eq("job_id", jobId);

    // Get questionnaire status
    const { data: questionnaireResponses } = await supabase
      .from("material_questionnaire_responses")
      .select("id, answered_at")
      .eq("job_id", jobId);

    const totalQuestions = questionnaireResponses?.length || 0;
    const answeredQuestions = questionnaireResponses?.filter(q => q.answered_at).length || 0;

    // Calculate estimated time remaining
    let estimatedMinutesRemaining = 0;
    if (job.status === "initiated" || job.status === "collecting_data") {
      estimatedMinutesRemaining = job.generate_im ? 240 : job.generate_pitch_deck ? 120 : 15;
    } else if (job.status === "awaiting_uploads" || job.status === "questionnaire_pending") {
      estimatedMinutesRemaining = job.generate_im ? 200 : job.generate_pitch_deck ? 100 : 10;
    } else if (job.status === "generating_teaser" || job.status === "generating_im" || job.status === "generating_pitch_deck") {
      estimatedMinutesRemaining = 5;
    }

    // Determine what actions user can take
    const availableActions: string[] = [];
    if (job.status === "awaiting_uploads") {
      availableActions.push("upload_documents");
    }
    if (job.status === "questionnaire_pending" || job.status === "questionnaire_in_progress") {
      availableActions.push("complete_questionnaire");
    }
    if (job.status === "review") {
      availableActions.push("review_materials", "approve_materials", "request_changes");
    }
    if (["initiated", "collecting_data", "awaiting_uploads", "questionnaire_pending"].includes(job.status)) {
      availableActions.push("cancel_job");
    }

    // Build response
    return NextResponse.json({
      job: {
        id: job.id,
        status: job.status,
        progress: job.progress_percentage,
        current_step: job.current_step,
        company: {
          id: job.companies.id,
          name: job.companies.name,
          industry: job.companies.industry,
        },
        generating: {
          teaser: job.generate_teaser,
          im: job.generate_im,
          pitch_deck: job.generate_pitch_deck,
        },
        phases: {
          public_data_collected: job.public_data_collected,
          public_data_collected_at: job.public_data_collected_at,
          documents_uploaded: job.documents_uploaded,
          documents_uploaded_at: job.documents_uploaded_at,
          questionnaire_completed: job.questionnaire_completed,
          questionnaire_completed_at: job.questionnaire_completed_at,
          data_consolidated: job.data_consolidated,
          data_consolidated_at: job.data_consolidated_at,
        },
        data_collection: {
          cached_data_sources: cachedDataCount || 0,
          questionnaire: {
            total_questions: totalQuestions,
            answered_questions: answeredQuestions,
            completion_percentage: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0,
          },
        },
        generated_assets: Object.keys(assets).length > 0 ? assets : null,
        timing: {
          created_at: job.created_at,
          started_at: job.started_at,
          completed_at: job.completed_at,
          estimated_minutes_remaining: estimatedMinutesRemaining,
          estimated_completion_at: job.estimated_completion_at,
        },
        error: job.error_message ? {
          message: job.error_message,
          retry_count: job.retry_count,
        } : null,
        available_actions: availableActions,
      },
    });
  } catch (error) {
    console.error("Error fetching job status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

