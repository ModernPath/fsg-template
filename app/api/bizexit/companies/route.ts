/**
 * Companies API Routes
 * GET /api/bizexit/companies - List all companies
 * POST /api/bizexit/companies - Create new company
 */

import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    console.log('\n📝 [GET /api/bizexit/companies]');
    
    // Get Authorization header (optional for GET, but recommended)
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    
    const authClient = await createClient();

    // Get user context
    const {
      data: { user },
      error: authError,
    } = token ? await authClient.auth.getUser(token) : await authClient.auth.getUser();

    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.id);

    // Use service role client for database queries
    const supabase = await createClient(undefined, true);

    // Get user's profile and organization via user_organizations
    const { data: profile } = await supabase
      .from("profiles")
      .select(`
        id,
        role,
        user_organizations!inner(
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
      .eq("organization_id", organizationId)
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
    console.log('\n📝 [POST /api/bizexit/companies]');
    
    // Get Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid auth header');
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    // Use regular client to verify the token
    const authClient = await createClient();
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser(token);

    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.id);

    // Use service role client for database queries to avoid JWT issues
    const supabase = await createClient(undefined, true);

    // Get user's profile and organization via user_organizations
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(`
        id,
        role,
        user_organizations!inner(
          organization_id,
          role
        )
      `)
      .eq("id", user.id)
      .single();

    console.log('📊 Profile query result:', {
      profile: profile,
      error: profileError,
      user_organizations: profile?.user_organizations
    });

    const organizationId = profile?.user_organizations?.[0]?.organization_id;

    console.log('🏢 Extracted Organization ID:', organizationId);

    if (!organizationId) {
      console.error('❌ No organization found for user');
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
      console.error('❌ Insufficient permissions:', profile.role);
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

    console.log('\n📝 Creating company:', {
      name: body.name,
      organization_id: organizationId,
      user_id: user.id,
    });

    // Create company
    const { data: company, error } = await supabase
      .from("companies")
      .insert({
        organization_id: organizationId,
        name: body.name,
        business_id: body.business_id,
        website: body.website,
        description: body.description,
        industry: body.industry,
        country: body.country || "Finland",
        city: body.city,
        founded_year: body.founded_year,
        employees_count: body.employees,
        legal_structure: body.owner_type || "family_owned",
        status: "active",
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Error creating company:", {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return NextResponse.json(
        { error: `Failed to create company: ${error.message}` },
        { status: 500 },
      );
    }

    console.log('✅ Company created successfully:', company.id);

    // If financial data is provided, create financials record
    if (body.financials) {
      const { error: financialsError } = await supabase
        .from("company_financials")
        .insert({
          company_id: company.id,
          fiscal_year: new Date().getFullYear(),
          revenue: body.financials.revenue,
          ebitda: body.financials.ebitda,
          net_income: body.financials.net_profit,
          total_assets: body.financials.assets,
          total_liabilities: body.financials.liabilities,
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

