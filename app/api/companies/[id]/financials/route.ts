/**
 * Company Financials API
 * GET /api/companies/[id]/financials - Get company financial records
 * POST /api/companies/[id]/financials - Add financial record
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
 * GET /api/companies/[id]/financials
 * Get company financial records
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userContext = await requirePermission(Permission.COMPANY_READ);
    const supabase = await createClient();
    const { id: companyId } = params;

    // Check if company belongs to user's organization
    await assertResourceInOrganization(companyId, "companies", userContext);

    const { data: financials, error } = await supabase
      .from("company_financials")
      .select("*")
      .eq("company_id", companyId)
      .order("year", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch financials", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ financials });
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
 * POST /api/companies/[id]/financials
 * Add financial record for a company
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userContext = await requirePermission(Permission.COMPANY_UPDATE);
    const supabase = await createClient();
    const { id: companyId } = params;

    // Check if company belongs to user's organization
    await assertResourceInOrganization(companyId, "companies", userContext);

    const body = await request.json();
    const {
      year,
      period,
      revenue,
      ebitda,
      net_profit,
      total_assets,
      total_liabilities,
      is_audited,
      currency,
    } = body;

    // Validate required fields
    if (!year || !period) {
      return NextResponse.json(
        { error: "Year and period are required" },
        { status: 400 },
      );
    }

    // Create financial record
    const { data: financial, error } = await supabase
      .from("company_financials")
      .insert({
        company_id: companyId,
        year,
        period,
        revenue: revenue || null,
        ebitda: ebitda || null,
        net_profit: net_profit || null,
        total_assets: total_assets || null,
        total_liabilities: total_liabilities || null,
        is_audited: is_audited || false,
        currency: currency || "EUR",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to create financial record", details: error.message },
        { status: 500 },
      );
    }

    // Create audit log
    await createAuditLog(
      userContext,
      "company_financials.create",
      "company_financials",
      financial.id,
      { company_id: companyId, year, period },
    );

    return NextResponse.json(
      { financial, message: "Financial record created successfully" },
      { status: 201 },
    );
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

