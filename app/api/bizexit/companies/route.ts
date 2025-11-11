/**
 * Companies API Routes
 * GET /api/bizexit/companies - List all companies
 * POST /api/bizexit/companies - Create new company
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

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const industry = searchParams.get("industry");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query
    let query = supabase
      .from("companies")
      .select(
        `
        *,
        financials:company_financials(*)
      `,
        { count: "exact" },
      )
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) {
      query = query.eq("status", status);
    }
    if (industry) {
      query = query.eq("industry", industry);
    }

    const { data: companies, error, count } = await query;

    if (error) {
      console.error("Error fetching companies:", error);
      return NextResponse.json(
        { error: "Failed to fetch companies" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      companies,
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

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    // Check permissions (Seller or Broker can create companies)
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
    if (!body.name || !body.industry) {
      return NextResponse.json(
        { error: "Name and industry are required" },
        { status: 400 },
      );
    }

    // Create company
    const { data: company, error } = await supabase
      .from("companies")
      .insert({
        organization_id: profile.organization_id,
        name: body.name,
        business_id: body.business_id,
        website: body.website,
        description: body.description,
        industry: body.industry,
        country: body.country || "Finland",
        city: body.city,
        founded_year: body.founded_year,
        employees: body.employees,
        owner_type: body.owner_type || "family_owned",
        status: "active",
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating company:", error);
      return NextResponse.json(
        { error: "Failed to create company" },
        { status: 500 },
      );
    }

    // If financial data is provided, create financials record
    if (body.financials) {
      const { error: financialsError } = await supabase
        .from("company_financials")
        .insert({
          company_id: company.id,
          year: new Date().getFullYear(),
          revenue: body.financials.revenue,
          ebitda: body.financials.ebitda,
          net_profit: body.financials.net_profit,
          assets: body.financials.assets,
          liabilities: body.financials.liabilities,
        });

      if (financialsError) {
        console.error("Error creating financials:", financialsError);
      }
    }

    return NextResponse.json({ company }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

