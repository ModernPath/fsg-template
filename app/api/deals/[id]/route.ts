/**
 * Deal Detail API
 * GET /api/deals/[id] - Get deal details
 * PATCH /api/deals/[id] - Update deal
 * DELETE /api/deals/[id] - Delete deal
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  requireAuth,
  requirePermission,
  Permission,
  assertResourceInOrganization,
  createAuditLog,
} from "@/lib/rbac";

export const dynamic = "force-dynamic";

/**
 * GET /api/deals/[id]
 * Get deal details with related data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userContext = await requirePermission(Permission.DEAL_READ);
    const supabase = await createClient();
    const { id } = params;

    // Check if deal belongs to user's organization
    await assertResourceInOrganization(id, "deals", userContext);

    const { data: deal, error } = await supabase
      .from("deals")
      .select(`
        *,
        companies(*),
        buyer:buyer_id(id, email, full_name),
        deal_stage_history(*),
        deal_activities(*),
        payments(*)
      `)
      .eq("id", id)
      .single();

    if (error || !deal) {
      return NextResponse.json(
        { error: "Deal not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ deal });
  } catch (error: any) {
    if (error.message?.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: error.message || "Authentication required" },
      { status: 401 },
    );
  }
}

/**
 * PATCH /api/deals/[id]
 * Update deal details
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userContext = await requirePermission(Permission.DEAL_UPDATE);
    const supabase = await createClient();
    const { id } = params;

    // Check if deal belongs to user's organization
    await assertResourceInOrganization(id, "deals", userContext);

    const body = await request.json();

    // Build update object
    const updates: any = {};
    const allowedFields = [
      "buyer_id",
      "current_stage",
      "fixed_fee",
      "success_fee_percentage",
      "estimated_value",
      "actual_value",
      "expected_close_date",
      "notes",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    // Get current deal to check for stage changes
    const { data: currentDeal } = await supabase
      .from("deals")
      .select("current_stage")
      .eq("id", id)
      .single();

    const { data: deal, error } = await supabase
      .from("deals")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to update deal", details: error.message },
        { status: 500 },
      );
    }

    // If stage changed, create history entry
    if (updates.current_stage && updates.current_stage !== currentDeal?.current_stage) {
      await supabase
        .from("deal_stage_history")
        .insert({
          deal_id: id,
          stage: updates.current_stage,
          changed_by: userContext.userId,
          notes: body.stage_notes || null,
        });
    }

    // Create audit log
    await createAuditLog(
      userContext,
      "deal.update",
      "deal",
      id,
      updates,
    );

    return NextResponse.json({
      deal,
      message: "Deal updated successfully",
    });
  } catch (error: any) {
    if (error.message?.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: error.message?.includes("Permission") ? 403 : 401 },
    );
  }
}

/**
 * DELETE /api/deals/[id]
 * Delete deal
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userContext = await requirePermission(Permission.DEAL_DELETE);
    const supabase = await createClient();
    const { id } = params;

    // Check if deal belongs to user's organization
    await assertResourceInOrganization(id, "deals", userContext);

    // Delete deal (CASCADE will handle related records)
    const { error } = await supabase
      .from("deals")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to delete deal", details: error.message },
        { status: 500 },
      );
    }

    // Create audit log
    await createAuditLog(
      userContext,
      "deal.delete",
      "deal",
      id,
    );

    return NextResponse.json({
      message: "Deal deleted successfully",
    });
  } catch (error: any) {
    if (error.message?.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: error.message?.includes("Permission") ? 403 : 401 },
    );
  }
}

