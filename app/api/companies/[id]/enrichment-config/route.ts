/**
 * API Route: /api/companies/[id]/enrichment-config
 * 
 * Manage enrichment module configuration for a company
 */

import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const VALID_MODULES = [
  // Base modules (1-9)
  "basic_info",
  "financial_data",
  "industry_analysis",
  "competitive_analysis",
  "growth_analysis",
  "financial_health",
  "personnel_info",
  "market_intelligence",
  "web_presence",
  // M&A specific modules (10-17)
  "ma_history",
  "valuation_data",
  "customer_intelligence",
  "operational_efficiency",
  "competitive_advantages",
  "risk_assessment",
  "integration_potential",
  "exit_attractiveness",
];

const REQUIRED_MODULES = ["basic_info", "financial_data"];

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
      .select("id, organization_id, enrichment_config")
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
    const defaultModules = [
      ...REQUIRED_MODULES,
      "industry_analysis",
      "competitive_analysis",
      "growth_analysis",
    ];

    return NextResponse.json({
      modules: company.enrichment_config?.modules || defaultModules,
      availableModules: VALID_MODULES,
      requiredModules: REQUIRED_MODULES,
    });
  } catch (error: any) {
    console.error("Error fetching enrichment config:", error);
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

    // Parse and validate modules
    const { modules } = await request.json();

    if (!Array.isArray(modules)) {
      return NextResponse.json(
        { error: "modules must be an array" },
        { status: 400 }
      );
    }

    // Validate all modules are valid
    const invalidModules = modules.filter(m => !VALID_MODULES.includes(m));
    if (invalidModules.length > 0) {
      return NextResponse.json(
        { error: `Invalid modules: ${invalidModules.join(", ")}` },
        { status: 400 }
      );
    }

    // Ensure required modules are included
    const missingRequired = REQUIRED_MODULES.filter(m => !modules.includes(m));
    if (missingRequired.length > 0) {
      return NextResponse.json(
        { error: `Required modules missing: ${missingRequired.join(", ")}` },
        { status: 400 }
      );
    }

    // Update company with new config
    const { error: updateError } = await supabase
      .from("companies")
      .update({
        enrichment_config: { modules },
        updated_at: new Date().toISOString(),
      })
      .eq("id", companyId);

    if (updateError) {
      throw new Error("Failed to update configuration");
    }

    return NextResponse.json({
      message: "Enrichment configuration updated successfully",
      modules,
    });
  } catch (error: any) {
    console.error("Error updating enrichment config:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

