/**
 * API Route: /api/companies/[id]/gamma-config
 * 
 * Manage Gamma presentation configuration for a company
 */

import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get company and verify access
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, organization_id, gamma_config")
      .eq("id", companyId)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Verify user has access to this company's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select(`
        id,
        user_organizations!inner(
          organization_id
        )
      `)
      .eq("id", user.id)
      .eq("user_organizations.organization_id", company.organization_id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Return configuration (with defaults if not set)
    const defaultConfig = {
      theme: "professional",
      brandColor: "#D4AF37",
      secondaryColor: "#1F2937",
      fontStyle: "sans",
      slideLayout: "widescreen",
      includeCompanyLogo: true,
      includeFooter: true,
      slideTransitions: true,
    };

    return NextResponse.json({
      config: company.gamma_config || defaultConfig,
    });
  } catch (error: any) {
    console.error("Error fetching Gamma config:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get company and verify access
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, organization_id")
      .eq("id", companyId)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Verify user has access to this company's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select(`
        id,
        role,
        user_organizations!inner(
          organization_id
        )
      `)
      .eq("id", user.id)
      .eq("user_organizations.organization_id", company.organization_id)
      .single();

    if (!profile || !["seller", "broker", "admin", "partner"].includes(profile.role.toLowerCase())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse and validate config
    const config = await request.json();

    // Validate config structure (basic validation)
    const validThemes = ["professional", "modern", "minimal", "creative", "corporate"];
    const validFonts = ["sans", "serif", "modern", "classic"];
    const validLayouts = ["standard", "widescreen", "compact"];

    if (config.theme && !validThemes.includes(config.theme)) {
      return NextResponse.json({ error: "Invalid theme" }, { status: 400 });
    }
    if (config.fontStyle && !validFonts.includes(config.fontStyle)) {
      return NextResponse.json({ error: "Invalid font style" }, { status: 400 });
    }
    if (config.slideLayout && !validLayouts.includes(config.slideLayout)) {
      return NextResponse.json({ error: "Invalid slide layout" }, { status: 400 });
    }

    // Update company with new config
    const { error: updateError } = await supabase
      .from("companies")
      .update({
        gamma_config: config,
        updated_at: new Date().toISOString(),
      })
      .eq("id", companyId);

    if (updateError) {
      throw new Error("Failed to update configuration");
    }

    return NextResponse.json({
      message: "Gamma configuration updated successfully",
      config,
    });
  } catch (error: any) {
    console.error("Error updating Gamma config:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

