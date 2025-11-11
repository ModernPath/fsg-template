/**
 * Companies API - List and Create
 * GET /api/companies - List companies in user's organization
 * POST /api/companies - Create new company
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
 * GET /api/companies
 * List companies in user's organization
 * Query params:
 *   - status: filter by status (draft, active, under_review, sold, archived)
 *   - limit: number of results (default 50)
 *   - offset: pagination offset
 */
export async function GET(request: NextRequest) {
  try {
    const userContext = await requirePermission(Permission.COMPANY_READ);
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("companies")
      .select("*, company_financials(*), listings(*)", { count: "exact" })
      .eq("organization_id", userContext.organizationId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply status filter if provided
    if (status) {
      query = query.eq("status", status);
    }

    const { data: companies, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch companies", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      companies,
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
 * POST /api/companies
 * Create a new company
 */
export async function POST(request: NextRequest) {
  try {
    const userContext = await requirePermission(Permission.COMPANY_CREATE);
    const supabase = await createClient();

    const body = await request.json();
    const {
      name,
      business_id,
      country,
      city,
      postal_code,
      industry,
      employees,
      founded_year,
      website,
      description,
      asking_price,
      annual_revenue,
      annual_ebitda,
      total_assets,
      total_liabilities,
      reason_for_sale,
      status,
    } = body;

    // Validate required fields
    if (!name || !country) {
      return NextResponse.json(
        { error: "Name and country are required" },
        { status: 400 },
      );
    }

    // Create company
    const { data: company, error } = await supabase
      .from("companies")
      .insert({
        organization_id: userContext.organizationId,
        name,
        business_id: business_id || null,
        country,
        city: city || null,
        postal_code: postal_code || null,
        industry: industry || null,
        employees: employees || null,
        founded_year: founded_year || null,
        website: website || null,
        description: description || null,
        asking_price: asking_price || null,
        annual_revenue: annual_revenue || null,
        annual_ebitda: annual_ebitda || null,
        total_assets: total_assets || null,
        total_liabilities: total_liabilities || null,
        reason_for_sale: reason_for_sale || null,
        status: status || "draft",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to create company", details: error.message },
        { status: 500 },
      );
    }

    // Create audit log
    await createAuditLog(
      userContext,
      "company.create",
      "company",
      company.id,
      { name, country, industry },
    );

    return NextResponse.json(
      { company, message: "Company created successfully" },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: error.message?.includes("Permission") ? 403 : 401 },
    );
  }
}

