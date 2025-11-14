/**
 * Materials Generation - Document Upload API
 * POST /api/bizexit/materials/generate/[jobId]/upload
 * 
 * Upload financial documents for materials generation
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
        user_organizations(
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
    if (job.status !== "awaiting_uploads") {
      return NextResponse.json(
        { error: "Job is not awaiting document uploads" },
        { status: 400 },
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 },
      );
    }

    // Validate file types (PDF, Excel, etc.)
    const allowedTypes = [
      "application/pdf",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
      "image/jpeg",
      "image/png",
    ];

    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      return NextResponse.json(
        { 
          error: "Invalid file type(s)",
          invalid_files: invalidFiles.map(f => f.name),
          allowed_types: allowedTypes,
        },
        { status: 400 },
      );
    }

    // Upload files to Supabase Storage
    const uploadedDocuments: string[] = [];
    
    for (const file of files) {
      try {
        // Generate unique filename
        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const storagePath = `materials/${organizationId}/${job.company_id}/${jobId}/${timestamp}_${sanitizedName}`;

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("documents")
          .upload(storagePath, buffer, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          console.error(`Failed to upload ${file.name}:`, uploadError);
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from("documents")
          .getPublicUrl(storagePath);

        // Create company_assets record
        const { data: asset, error: assetError } = await supabase
          .from("company_assets")
          .insert({
            company_id: job.company_id,
            organization_id: organizationId,
            name: file.name,
            type: "financial_document",
            storage_path: storagePath,
            file_url: publicUrl,
            file_size: file.size,
            mime_type: file.type,
            metadata: {
              job_id: jobId,
              uploaded_for: "materials_generation",
            },
          })
          .select()
          .single();

        if (assetError) {
          console.error(`Failed to create asset record for ${file.name}:`, assetError);
          continue;
        }

        uploadedDocuments.push(asset.id);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }

    if (uploadedDocuments.length === 0) {
      return NextResponse.json(
        { error: "Failed to upload any documents" },
        { status: 500 },
      );
    }

    // Trigger document processing
    try {
      await inngest.send({
        name: "materials/process-uploads",
        data: {
          jobId: jobId,
          companyId: job.company_id,
          organizationId: organizationId,
          documentIds: uploadedDocuments,
          userId: user.id,
        },
      });
    } catch (inngestError) {
      console.error("Error triggering document processing:", inngestError);
      // Don't fail - documents are uploaded
    }

    return NextResponse.json({
      success: true,
      message: "Documents uploaded successfully",
      uploaded: uploadedDocuments.length,
      total: files.length,
      document_ids: uploadedDocuments,
    });
  } catch (error) {
    console.error("Error in document upload:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

