/**
 * Materials Generation - Initiate
 * POST /api/bizexit/materials/generate/initiate
 * 
 * Starts a new materials generation job
 */

import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/lib/inngest-client";

export async function POST(request: NextRequest) {
  try {
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
        role,
        user_organizations(
          organization_id,
          role
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

    // Check permissions (broker, seller, admin can initiate)
    if (!["seller", "broker", "admin", "partner"].includes(profile.role.toLowerCase())) {
      return NextResponse.json(
        { error: "Insufficient permissions to generate materials" },
        { status: 403 },
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.company_id) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 },
      );
    }

    // Verify company belongs to this organization
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, name, organization_id, industry")
      .eq("id", body.company_id)
      .single();

    if (companyError || !company || company.organization_id !== organizationId) {
      return NextResponse.json(
        { error: "Invalid company or access denied" },
        { status: 400 },
      );
    }

    // Check if there's an active job already
    const { data: existingJob } = await supabase
      .from("material_generation_jobs")
      .select("id, status")
      .eq("company_id", body.company_id)
      .in("status", ["initiated", "collecting_data", "awaiting_uploads", "processing_uploads", "questionnaire_pending", "questionnaire_in_progress", "consolidating", "generating_teaser", "generating_im", "generating_pitch_deck"])
      .maybeSingle();

    if (existingJob) {
      return NextResponse.json(
        { 
          error: "A materials generation job is already in progress for this company",
          existing_job_id: existingJob.id,
          status: existingJob.status
        },
        { status: 409 },
      );
    }

    // Determine what to generate
    const generateTeaser = body.generate_teaser !== false; // Default true
    const generateIM = body.generate_im === true; // Default false
    const generatePitchDeck = body.generate_pitch_deck === true; // Default false

    if (!generateTeaser && !generateIM && !generatePitchDeck) {
      return NextResponse.json(
        { error: "At least one material type must be selected" },
        { status: 400 },
      );
    }

    // Create generation job
    const { data: job, error: jobError } = await supabase
      .from("material_generation_jobs")
      .insert({
        company_id: body.company_id,
        organization_id: organizationId,
        created_by: user.id,
        status: "initiated",
        progress_percentage: 0,
        generate_teaser: generateTeaser,
        generate_im: generateIM,
        generate_pitch_deck: generatePitchDeck,
        started_at: new Date().toISOString(),
        metadata: {
          company_name: company.name,
          industry: company.industry,
          initiated_by_name: profile?.full_name || user.email,
          options: body.options || {},
        },
      })
      .select()
      .single();

    if (jobError) {
      console.error("Error creating generation job:", jobError);
      return NextResponse.json(
        { error: "Failed to create generation job", details: jobError.message },
        { status: 500 },
      );
    }

    // Trigger Inngest workflow (async background processing)
    try {
      await inngest.send({
        name: "materials/generate.initiated",
        data: {
          jobId: job.id,
          companyId: company.id,
          organizationId: organizationId,
          types: {
            teaser: generateTeaser,
            im: generateIM,
            pitchDeck: generatePitchDeck,
          },
          userId: user.id,
        },
      });
    } catch (inngestError) {
      console.error("Error triggering Inngest workflow:", inngestError);
      // Don't fail the request - job is created, can be processed manually or retried
    }

    // Return job details
    return NextResponse.json(
      {
        success: true,
        job: {
          id: job.id,
          status: job.status,
          progress: job.progress_percentage,
          company_id: job.company_id,
          company_name: company.name,
          generating: {
            teaser: generateTeaser,
            im: generateIM,
            pitch_deck: generatePitchDeck,
          },
          created_at: job.created_at,
          estimated_completion_minutes: generateIM ? 240 : generatePitchDeck ? 120 : 15,
        },
        message: "Materials generation job initiated successfully",
        next_steps: [
          "The system is now collecting public data about your company",
          generateIM || generatePitchDeck ? "You will be asked to upload financial documents" : null,
          "You will receive an AI-generated questionnaire to complete",
          "Once all data is collected, materials will be generated automatically",
        ].filter(Boolean),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Unexpected error in materials generation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

