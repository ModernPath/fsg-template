/**
 * Deal Detail API Routes
 * GET /api/bizexit/deals/[id] - Get deal details
 * PUT /api/bizexit/deals/[id] - Update deal
 * DELETE /api/bizexit/deals/[id] - Delete deal
 */

import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createClient();
    const dealId = params.id;

    // Get user context
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get deal with related data
    const { data: deal, error } = await supabase
      .from("deals")
      .select(
        `
        *,
        companies(*),
        buyers:buyer_profiles(*),
        stages:deal_stages(*),
        activities:deal_activities(
          *,
          user:profiles(full_name, email)
        ),
        ndas(*)
      `,
      )
      .eq("id", dealId)
      .single();

    if (error || !deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    // Verify user has access to this deal via user_organizations
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

    const organizationId = profile?.user_organizations?.[0]?.organization_id;

    if (!organizationId || organizationId !== deal.organization_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ deal });
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
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createClient();
    const dealId = params.id;

    // Get user context
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get existing deal
    const { data: existingDeal } = await supabase
      .from("deals")
      .select("organization_id, stage")
      .eq("id", dealId)
      .single();

    if (!existingDeal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    // Verify user has access via user_organizations
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

    if (!organizationId || organizationId !== existingDeal.organization_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();

    // Check if stage is changing
    const stageChanged = body.stage && body.stage !== existingDeal.stage;

    // Update deal
    const { data: deal, error } = await supabase
      .from("deals")
      .update({
        buyer_id: body.buyer_id,
        stage: body.stage,
        status: body.status,
        deal_type: body.deal_type,
        estimated_value: body.estimated_value,
        expected_close_date: body.expected_close_date,
        actual_close_date: body.actual_close_date,
        notes: body.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", dealId)
      .select()
      .single();

    if (error) {
      console.error("Error updating deal:", error);
      return NextResponse.json(
        { error: "Failed to update deal" },
        { status: 500 },
      );
    }

    // If stage changed, create new stage record
    if (stageChanged) {
      await supabase.from("deal_stages").insert({
        deal_id: dealId,
        stage: body.stage,
        entered_at: new Date().toISOString(),
      });

      // Log activity
      await supabase.from("deal_activities").insert({
        deal_id: dealId,
        user_id: user.id,
        activity_type: "stage_changed",
        description: `Stage changed to ${body.stage}`,
      });
    }

    return NextResponse.json({ deal });
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
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createClient();
    const dealId = params.id;

    // Get user context
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get existing deal
    const { data: existingDeal } = await supabase
      .from("deals")
      .select("organization_id")
      .eq("id", dealId)
      .single();

    if (!existingDeal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    // Verify user has access and is admin/broker via user_organizations
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

    if (!organizationId || organizationId !== existingDeal.organization_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!["admin", "broker"].includes(profile.role.toLowerCase())) {
      return NextResponse.json(
        { error: "Only admins and brokers can delete deals" },
        { status: 403 },
      );
    }

    // Soft delete: update status to 'cancelled'
    const { error } = await supabase
      .from("deals")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", dealId);

    if (error) {
      console.error("Error deleting deal:", error);
      return NextResponse.json(
        { error: "Failed to delete deal" },
        { status: 500 },
      );
    }

    // Log activity
    await supabase.from("deal_activities").insert({
      deal_id: dealId,
      user_id: user.id,
      activity_type: "cancelled",
      description: "Deal cancelled",
    });

    return NextResponse.json({ message: "Deal deleted successfully" });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
