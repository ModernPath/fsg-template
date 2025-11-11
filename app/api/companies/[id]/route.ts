/**
 * Company Detail API
 * GET /api/companies/[id] - Get company details
 * PATCH /api/companies/[id] - Update company
 * DELETE /api/companies/[id] - Delete company
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
 * GET /api/companies/[id]
 * Get company details with related data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userContext = await requirePermission(Permission.COMPANY_READ);
    const supabase = await createClient();
    const { id } = params;

    // Check if company belongs to user's organization
    await assertResourceInOrganization(id, "companies", userContext);

    const { data: company, error } = await supabase
      .from("companies")
      .select(`
        *,
        company_financials(*),
        company_assets(*),
        listings(*),
        deals(*)
      `)
      .eq("id", id)
      .single();

    if (error || !company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ company });
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
 * PATCH /api/companies/[id]
 * Update company details
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userContext = await requirePermission(Permission.COMPANY_UPDATE);
    const supabase = await createClient();
    const { id } = params;

    // Check if company belongs to user's organization
    await assertResourceInOrganization(id, "companies", userContext);

    const body = await request.json();

    // Build update object (only include provided fields)
    const updates: any = {};
    const allowedFields = [
      "name",
      "business_id",
      "country",
      "city",
      "postal_code",
      "industry",
      "employees",
      "founded_year",
      "website",
      "description",
      "asking_price",
      "annual_revenue",
      "annual_ebitda",
      "total_assets",
      "total_liabilities",
      "reason_for_sale",
      "status",
      "confidential_info",
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

    const { data: company, error } = await supabase
      .from("companies")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to update company", details: error.message },
        { status: 500 },
      );
    }

    // Create audit log
    await createAuditLog(
      userContext,
      "company.update",
      "company",
      id,
      updates,
    );

    return NextResponse.json({
      company,
      message: "Company updated successfully",
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
 * DELETE /api/companies/[id]
 * Delete company (soft delete by setting status to 'archived')
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userContext = await requirePermission(Permission.COMPANY_DELETE);
    const supabase = await createClient();
    const { id } = params;

    // Check if company belongs to user's organization
    await assertResourceInOrganization(id, "companies", userContext);

    // Soft delete: set status to archived
    const { error } = await supabase
      .from("companies")
      .update({ status: "archived" })
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to delete company", details: error.message },
        { status: 500 },
      );
    }

    // Create audit log
    await createAuditLog(
      userContext,
      "company.delete",
      "company",
      id,
    );

    return NextResponse.json({
      message: "Company archived successfully",
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

