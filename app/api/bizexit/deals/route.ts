/**
 * Deals API Routes
 * GET /api/bizexit/deals - List all deals
 * POST /api/bizexit/deals - Create new deal
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const stage = searchParams.get("stage");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query
    let query = supabase
      .from("deals")
      .select(
        `
        *,
        companies(id, name, industry),
        buyers:buyer_profiles(id, company_name),
        stages:deal_stages(*)
      `,
        { count: "exact" },
      )
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (stage) {
      query = query.eq("stage", stage);
    }
    if (status) {
      query = query.eq("status", status);
    }

    const { data: deals, error, count } = await query;

    if (error) {
      console.error("Error fetching deals:", error);
      return NextResponse.json(
        { error: "Failed to fetch deals" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      deals,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    });
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

    // Check permissions (Broker, Admin, Seller can create deals)
    if (
      !["seller", "broker", "admin", "partner"].includes(
        profile.role.toLowerCase(),
      )
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.company_id || !body.stage) {
      return NextResponse.json(
        { error: "Company ID and stage are required" },
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

    // Create deal
    const { data: deal, error } = await supabase
      .from("deals")
      .insert({
        organization_id: organizationId,
        company_id: body.company_id,
        buyer_id: body.buyer_id,
        stage: body.stage || "lead",
        status: "active",
        deal_type: body.deal_type || "acquisition",
        estimated_value: body.estimated_value,
        expected_close_date: body.expected_close_date,
        notes: body.notes,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating deal:", error);
      return NextResponse.json(
        { error: "Failed to create deal" },
        { status: 500 },
      );
    }

    // Create initial deal stage record
    await supabase.from("deal_stages").insert({
      deal_id: deal.id,
      stage: body.stage || "lead",
      entered_at: new Date().toISOString(),
    });

    // Create activity log
    await supabase.from("deal_activities").insert({
      deal_id: deal.id,
      user_id: user.id,
      activity_type: "created",
      description: "Deal created",
    });

    return NextResponse.json({ deal }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
