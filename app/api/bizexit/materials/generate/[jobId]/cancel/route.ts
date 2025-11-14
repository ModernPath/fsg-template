/**
 * Materials Generation - Cancel Job
 * POST /api/bizexit/materials/generate/[jobId]/cancel
 * 
 * Cancel an in-progress materials generation job
 */

import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/lib/inngest-client";

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

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from("material_generation_jobs")
      .select("*")
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

    // Check if job can be cancelled
    const cancellableStatuses = [
      "initiated",
      "collecting_data",
      "awaiting_uploads",
      "processing_uploads",
      "questionnaire_pending",
      "questionnaire_in_progress",
      "consolidating",
    ];

    if (!cancellableStatuses.includes(job.status)) {
      return NextResponse.json(
        { 
          error: "Job cannot be cancelled in its current state",
          current_status: job.status,
          reason: job.status === "completed" ? "Job is already completed" :
                  job.status === "cancelled" ? "Job is already cancelled" :
                  job.status === "failed" ? "Job has already failed" :
                  "Job is in final generation stage"
        },
        { status: 400 },
      );
    }

    // Update job status to cancelled
    const { error: updateError } = await supabase
      .from("material_generation_jobs")
      .update({
        status: "cancelled",
        completed_at: new Date().toISOString(),
        error_message: "Cancelled by user",
      })
      .eq("id", jobId);

    if (updateError) {
      console.error("Error cancelling job:", updateError);
      return NextResponse.json(
        { error: "Failed to cancel job" },
        { status: 500 },
      );
    }

    // Send cancellation event to Inngest (to stop any running workers)
    try {
      await inngest.send({
        name: "materials/generate.cancelled",
        data: {
          jobId: job.id,
          companyId: job.company_id,
          organizationId: organizationId,
          userId: user.id,
          previousStatus: job.status,
        },
      });
    } catch (inngestError) {
      console.error("Error sending cancellation to Inngest:", inngestError);
      // Job is cancelled in DB, so continue
    }

    return NextResponse.json({
      success: true,
      message: "Job cancelled successfully",
      job: {
        id: job.id,
        status: "cancelled",
        previous_status: job.status,
        cancelled_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error cancelling job:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

