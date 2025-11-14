/**
 * NDAs API Routes
 * GET /api/bizexit/ndas - List all NDAs
 * POST /api/bizexit/ndas - Create new NDA
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
    const dealId = searchParams.get("deal_id");

    // Build query
    let query = supabase
      .from("ndas")
      .select(
        `
        *,
        deals(
          id,
          companies(id, name)
        ),
        signer:profiles!ndas_signer_id_fkey(full_name, email),
        witness:profiles!ndas_witness_id_fkey(full_name, email)
      `,
      )
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq("status", status);
    }
    if (dealId) {
      query = query.eq("deal_id", dealId);
    }

    const { data: ndas, error } = await query;

    if (error) {
      console.error("Error fetching NDAs:", error);
      return NextResponse.json(
        { error: "Failed to fetch NDAs" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ndas });
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

    // Check permissions
    if (
      !["broker", "admin", "partner"].includes(profile.role.toLowerCase())
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.deal_id || !body.signer_id) {
      return NextResponse.json(
        { error: "Deal ID and signer ID are required" },
        { status: 400 },
      );
    }

    // Verify deal belongs to this organization
    const { data: deal } = await supabase
      .from("deals")
      .select("organization_id")
      .eq("id", body.deal_id)
      .single();

    if (!deal || deal.organization_id !== organizationId) {
      return NextResponse.json({ error: "Invalid deal" }, { status: 400 });
    }

    // Create NDA
    const { data: nda, error } = await supabase
      .from("ndas")
      .insert({
        organization_id: organizationId,
        deal_id: body.deal_id,
        signer_id: body.signer_id,
        witness_id: user.id,
        status: "pending",
        document_url: body.document_url,
        expires_at: body.expires_at,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating NDA:", error);
      return NextResponse.json(
        { error: "Failed to create NDA" },
        { status: 500 },
      );
    }

    // Log activity
    await supabase.from("deal_activities").insert({
      deal_id: body.deal_id,
      user_id: user.id,
      activity_type: "nda_sent",
      description: "NDA sent for signature",
    });

    return NextResponse.json({ nda }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
