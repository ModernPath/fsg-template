/**
 * Deals API - List and Create
 * GET /api/deals - List deals in user's organization
 * POST /api/deals - Create new deal
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  requireAuth,
  requirePermission,
  Permission,
  createAuditLog,
} from "@/lib/rbac";

export const dynamic = "force-dynamic";

/**
 * GET /api/deals
 * List deals in user's organization
 * Query params:
 *   - stage: filter by stage
 *   - company_id: filter by company
 *   - limit: number of results (default 50)
 *   - offset: pagination offset
 */
export async function GET(request: NextRequest) {
  try {
    const userContext = await requirePermission(Permission.DEAL_READ);
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const stage = searchParams.get("stage");
    const companyId = searchParams.get("company_id");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("deals")
      .select(`
        *,
        companies(*),
        buyer:buyer_id(id, email, full_name),
        deal_stage_history(*),
        deal_activities(*)
      `, { count: "exact" })
      .eq("organization_id", userContext.organizationId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (stage) {
      query = query.eq("current_stage", stage);
    }
    if (companyId) {
      query = query.eq("company_id", companyId);
    }

    const { data: deals, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch deals", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      deals,
      count,
      limit,
      offset,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Authentication required" },
      { status: 401 },
    );
  }
}

/**
 * POST /api/deals
 * Create a new deal
 */
export async function POST(request: NextRequest) {
  try {
    const userContext = await requirePermission(Permission.DEAL_CREATE);
    const supabase = await createClient();

    const body = await request.json();
    const {
      company_id,
      buyer_id,
      current_stage,
      fixed_fee,
      success_fee_percentage,
      estimated_value,
      notes,
    } = body;

    // Validate required fields
    if (!company_id) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 },
      );
    }

    // Verify company belongs to user's organization
    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("id", company_id)
      .eq("organization_id", userContext.organizationId)
      .single();

    if (!company) {
      return NextResponse.json(
        { error: "Company not found in your organization" },
        { status: 404 },
      );
    }

    // Create deal
    const { data: deal, error } = await supabase
      .from("deals")
      .insert({
        organization_id: userContext.organizationId,
        company_id,
        buyer_id: buyer_id || null,
        current_stage: current_stage || "initial_contact",
        fixed_fee: fixed_fee || null,
        success_fee_percentage: success_fee_percentage || null,
        estimated_value: estimated_value || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to create deal", details: error.message },
        { status: 500 },
      );
    }

    // Create initial stage history entry
    await supabase
      .from("deal_stage_history")
      .insert({
        deal_id: deal.id,
        stage: deal.current_stage,
        changed_by: userContext.userId,
        notes: "Deal created",
      });

    // Create audit log
    await createAuditLog(
      userContext,
      "deal.create",
      "deal",
      deal.id,
      { company_id, current_stage },
    );

    return NextResponse.json(
      { deal, message: "Deal created successfully" },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: error.message?.includes("Permission") ? 403 : 401 },
    );
  }
}

