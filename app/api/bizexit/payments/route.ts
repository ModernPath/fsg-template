/**
 * Payments API Routes
 * GET /api/bizexit/payments - List all payments
 * POST /api/bizexit/payments - Create new payment/invoice
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
        user_organizations(
          organization_id
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
    const type = searchParams.get("type");

    // Build query
    let query = supabase
      .from("payments")
      .select(
        `
        *,
        deals(
          id,
          companies(id, name)
        )
      `,
      )
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq("status", status);
    }
    if (type) {
      query = query.eq("type", type);
    }

    const { data: payments, error } = await query;

    if (error) {
      console.error("Error fetching payments:", error);
      return NextResponse.json(
        { error: "Failed to fetch payments" },
        { status: 500 },
      );
    }

    return NextResponse.json({ payments });
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

    // Check permissions (only brokers and admins can create payments)
    if (!["broker", "admin"].includes(profile.role.toLowerCase())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.deal_id || !body.amount || !body.type) {
      return NextResponse.json(
        { error: "Deal ID, amount, and type are required" },
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

    // Generate invoice number
    const { count } = await supabase
      .from("payments")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId);

    const invoiceNumber = `INV-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, "0")}`;

    // Create payment
    const { data: payment, error } = await supabase
      .from("payments")
      .insert({
        organization_id: organizationId,
        deal_id: body.deal_id,
        invoice_number: invoiceNumber,
        amount: body.amount,
        type: body.type,
        status: "pending",
        due_date: body.due_date,
        description: body.description,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating payment:", error);
      return NextResponse.json(
        { error: "Failed to create payment" },
        { status: 500 },
      );
    }

    // Log activity
    await supabase.from("deal_activities").insert({
      deal_id: body.deal_id,
      user_id: user.id,
      activity_type: "payment_created",
      description: `Invoice ${invoiceNumber} created`,
    });

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
