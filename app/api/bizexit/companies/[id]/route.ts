/**
 * Company Detail API Routes
 * GET /api/bizexit/companies/[id] - Get company details
 * PUT /api/bizexit/companies/[id] - Update company
 * DELETE /api/bizexit/companies/[id] - Delete company
 */

import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: companyId } = await params;
    const supabase = await createClient();

    // Get user context
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get company with related data
    const { data: company, error } = await supabase
      .from("companies")
      .select(
        `
        *,
        financials:company_financials(*),
        assets:company_assets(*),
        listings(*)
      `,
      )
      .eq("id", companyId)
      .single();

    if (error || !company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 },
      );
    }

    // Verify user has access to this company via user_organizations
    const { data: profile } = await supabase
      .from("profiles")
      .select(`
        id,
        user_organizations!inner(
          organization_id
        )
      `)
      .eq("id", user.id)
      .single();

    const userOrgId = profile?.user_organizations?.[0]?.organization_id;

    if (!userOrgId || userOrgId !== company.organization_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ company });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: companyId } = await params;
    
    console.log('\n📝 [PUT /api/bizexit/companies/:id]', companyId);

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
    
    // Create authenticated client
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

    // Use service role client for database queries
    const supabase = await createClient(undefined, true);

    // Get existing company
    const { data: existingCompany } = await supabase
      .from("companies")
      .select("organization_id")
      .eq("id", companyId)
      .single();

    if (!existingCompany) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 },
      );
    }

    // Verify user has access via user_organizations
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
      .single();

    const userOrgId = profile?.user_organizations?.[0]?.organization_id;

    if (!userOrgId || userOrgId !== existingCompany.organization_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check permissions
    if (!["seller", "broker", "admin", "partner"].includes(profile.role.toLowerCase())) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();

    // Update company
    const { data: company, error } = await supabase
      .from("companies")
      .update({
        name: body.name,
        business_id: body.business_id,
        website: body.website,
        description: body.description,
        industry: body.industry,
        country: body.country,
        city: body.city,
        founded_year: body.founded_year,
        employees: body.employees,
        owner_type: body.owner_type,
        status: body.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", companyId)
      .select()
      .single();

    if (error) {
      console.error("Error updating company:", error);
      return NextResponse.json(
        { error: "Failed to update company" },
        { status: 500 },
      );
    }

    return NextResponse.json({ company });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: companyId } = await params;
    
    console.log('\n🗑️ [DELETE /api/bizexit/companies/:id]', companyId);

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
    
    // Create authenticated client
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

    // Use service role client for database queries
    const supabase = await createClient(undefined, true);

    // Get existing company
    const { data: existingCompany } = await supabase
      .from("companies")
      .select("organization_id")
      .eq("id", companyId)
      .single();

    if (!existingCompany) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 },
      );
    }

    // Verify user has access and is admin via user_organizations
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
      .single();

    const userOrgId = profile?.user_organizations?.[0]?.organization_id;

    if (!userOrgId || userOrgId !== existingCompany.organization_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!["admin", "broker"].includes(profile.role.toLowerCase())) {
      return NextResponse.json(
        { error: "Only admins and brokers can delete companies" },
        { status: 403 },
      );
    }

    // Soft delete: update status to 'inactive'
    const { error } = await supabase
      .from("companies")
      .update({
        status: "inactive",
        updated_at: new Date().toISOString(),
      })
      .eq("id", companyId);

    if (error) {
      console.error("Error deleting company:", error);
      return NextResponse.json(
        { error: "Failed to delete company" },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: "Company deleted successfully" });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

