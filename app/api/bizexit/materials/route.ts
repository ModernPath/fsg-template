/**
 * Materials API Routes (AI-generated documents)
 * GET /api/bizexit/materials - List all materials
 * POST /api/bizexit/materials - Create/Generate new material
 */

import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
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

    // Get user's organization via user_organizations
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const assetType = searchParams.get("type");
    const companyId = searchParams.get("company_id");

    // Build query for materials (stored as company_assets)
    let query = supabase
      .from("company_assets")
      .select(
        `
        *,
        companies(id, name, industry)
      `,
      )
      .eq("companies.organization_id", organizationId)
      .in("asset_type", ["teaser", "im", "pitch_deck", "valuation_report"])
      .order("created_at", { ascending: false });

    // Apply filters
    if (assetType) {
      query = query.eq("asset_type", assetType);
    }
    if (companyId) {
      query = query.eq("company_id", companyId);
    }

    const { data: materials, error } = await query;

    if (error) {
      console.error("Error fetching materials:", error);
      return NextResponse.json(
        { error: "Failed to fetch materials" },
        { status: 500 },
      );
    }

    return NextResponse.json({ materials });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

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

    // Get user's organization via user_organizations
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

    // Check permissions (broker, seller, admin can create materials)
    if (!["seller", "broker", "admin", "partner"].includes(profile.role.toLowerCase())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.company_id || !body.asset_type) {
      return NextResponse.json(
        { error: "Company ID and asset type are required" },
        { status: 400 },
      );
    }

    // Verify company belongs to this organization
    const { data: company } = await supabase
      .from("companies")
      .select("organization_id")
      .eq("id", body.company_id)
      .single();

    if (!company || company.organization_id !== organizationId) {
      return NextResponse.json({ error: "Invalid company" }, { status: 400 });
    }

    // Validate asset type
    const validAssetTypes = ["teaser", "im", "pitch_deck", "valuation_report"];
    if (!validAssetTypes.includes(body.asset_type)) {
      return NextResponse.json(
        { error: "Invalid asset type" },
        { status: 400 },
      );
    }

    // Create material (as company_asset)
    const { data: material, error } = await supabase
      .from("company_assets")
      .insert({
        company_id: body.company_id,
        asset_type: body.asset_type,
        name: body.name || `${body.asset_type}_${Date.now()}`,
        description: body.description,
        type: body.asset_type, // For backwards compatibility
        mime_type: body.mime_type || 'application/pdf',
        file_size: body.file_size || 0,
        storage_path: body.storage_path || body.file_url || '',
        generated: true,
        generation_model: 'gemini-2.0-flash-exp',
        metadata: {
          generated_by: "ai",
          generated_at: new Date().toISOString(),
          ...body.metadata,
        },
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating material:", error);
      return NextResponse.json(
        { error: "Failed to create material", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ material }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
