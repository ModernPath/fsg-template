/**
 * Payment Detail API Routes
 * GET /api/bizexit/payments/[id] - Get payment details
 * PUT /api/bizexit/payments/[id] - Update payment status
 */

import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createClient();
    const paymentId = params.id;

    // Get user context
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get payment with related data
    const { data: payment, error } = await supabase
      .from("payments")
      .select(
        `
        *,
        deals(
          id,
          companies(id, name, logo_url)
        )
      `,
      )
      .eq("id", paymentId)
      .single();

    if (error || !payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 },
      );
    }

    // Verify user has access
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profile?.organization_id !== payment.organization_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ payment });
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
    const paymentId = params.id;

    // Get user context
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get existing payment
    const { data: existingPayment } = await supabase
      .from("payments")
      .select("organization_id, deal_id, status")
      .eq("id", paymentId)
      .single();

    if (!existingPayment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 },
      );
    }

    // Verify user has access
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (profile?.organization_id !== existingPayment.organization_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only brokers and admins can update payments
    if (!["broker", "admin"].includes(profile.role.toLowerCase())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();

    // Update payment
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.status) {
      updateData.status = body.status;
      if (body.status === "paid") {
        updateData.paid_at = new Date().toISOString();
      }
    }

    if (body.amount !== undefined) {
      updateData.amount = body.amount;
    }

    if (body.due_date) {
      updateData.due_date = body.due_date;
    }

    if (body.description) {
      updateData.description = body.description;
    }

    const { data: payment, error } = await supabase
      .from("payments")
      .update(updateData)
      .eq("id", paymentId)
      .select()
      .single();

    if (error) {
      console.error("Error updating payment:", error);
      return NextResponse.json(
        { error: "Failed to update payment" },
        { status: 500 },
      );
    }

    // If payment was marked as paid, log activity
    if (body.status === "paid" && existingPayment.status !== "paid") {
      await supabase.from("deal_activities").insert({
        deal_id: existingPayment.deal_id,
        user_id: user.id,
        activity_type: "payment_received",
        description: `Payment received`,
      });
    }

    return NextResponse.json({ payment });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

