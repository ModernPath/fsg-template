/**
 * API Route: /api/materials/[id]/export
 * 
 * Export material to PDF or PPTX format
 */

import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: materialId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get material and verify access
    const { data: material, error: materialError } = await supabase
      .from("company_assets")
      .select(`
        id,
        name,
        type,
        content,
        gamma_presentation_id,
        gamma_presentation_url,
        companies!inner(
          id,
          organization_id
        )
      `)
      .eq("id", materialId)
      .single();

    if (materialError || !material) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    // Verify user has access to this material's company organization
    const { data: profile } = await supabase
      .from("profiles")
      .select(`
        id,
        user_organizations!inner(
          organization_id
        )
      `)
      .eq("id", user.id)
      .eq("user_organizations.organization_id", material.companies.organization_id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse format from request
    const { format } = await request.json();

    if (!["pdf", "pptx"].includes(format)) {
      return NextResponse.json(
        { error: "Invalid format. Must be 'pdf' or 'pptx'" },
        { status: 400 }
      );
    }

    // If Gamma presentation exists, fetch from Gamma API
    if (material.gamma_presentation_id) {
      const gammaApiKey = process.env.GAMMA_API_KEY;

      if (!gammaApiKey) {
        return NextResponse.json(
          { error: "Gamma API key not configured" },
          { status: 500 }
        );
      }

      try {
        // Request export from Gamma API
        const gammaResponse = await fetch(
          `https://api.gamma.app/v1/cards/${material.gamma_presentation_id}/export`,
          {
            method: "POST",
            headers: {
              "X-API-KEY": gammaApiKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              format: format === "pptx" ? "pptx" : "pdf",
            }),
          }
        );

        if (!gammaResponse.ok) {
          throw new Error(`Gamma export failed: ${gammaResponse.statusText}`);
        }

        // Get export URL or file
        const exportData = await gammaResponse.json();

        if (exportData.download_url) {
          // Gamma provides a download URL
          const fileResponse = await fetch(exportData.download_url);
          const fileBlob = await fileResponse.blob();

          return new NextResponse(fileBlob, {
            headers: {
              "Content-Type":
                format === "pptx"
                  ? "application/vnd.openxmlformats-officedocument.presentationml.presentation"
                  : "application/pdf",
              "Content-Disposition": `attachment; filename="${material.name}.${format}"`,
            },
          });
        }
      } catch (error: any) {
        console.error("Gamma export error:", error);
        // Fall through to generate from content
      }
    }

    // Fallback: Generate from content using a PDF/PPTX library
    // This is a placeholder - you'd need to implement actual PDF/PPTX generation
    // using libraries like pdfkit, puppeteer, or pptxgenjs

    return NextResponse.json(
      {
        error: "Export functionality not fully implemented",
        message:
          "Gamma export failed and local generation is not yet implemented",
      },
      { status: 501 }
    );
  } catch (error: any) {
    console.error("Error exporting material:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

