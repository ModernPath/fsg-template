/**
 * NDA Detail API Routes
 * GET /api/bizexit/ndas/[id] - Get NDA details
 * PUT /api/bizexit/ndas/[id] - Update NDA (e.g., mark as signed)
 */

import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createClient();
    const ndaId = params.id;

    // Get user context
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get NDA with related data
    const { data: nda, error } = await supabase
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
      .eq("id", ndaId)
      .single();

    if (error || !nda) {
      return NextResponse.json({ error: "NDA not found" }, { status: 404 });
    }

    // Verify user has access
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profile?.organization_id !== nda.organization_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ nda });
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
    const ndaId = params.id;

    // Get user context
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get existing NDA
    const { data: existingNDA } = await supabase
      .from("ndas")
      .select("organization_id, deal_id, status")
      .eq("id", ndaId)
      .single();

    if (!existingNDA) {
      return NextResponse.json({ error: "NDA not found" }, { status: 404 });
    }

    // Verify user has access
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profile?.organization_id !== existingNDA.organization_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();

    // Update NDA
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.status) {
      updateData.status = body.status;
      if (body.status === "signed") {
        updateData.signed_at = new Date().toISOString();
      }
    }

    if (body.document_url) {
      updateData.document_url = body.document_url;
    }

    const { data: nda, error } = await supabase
      .from("ndas")
      .update(updateData)
      .eq("id", ndaId)
      .select()
      .single();

    if (error) {
      console.error("Error updating NDA:", error);
      return NextResponse.json(
        { error: "Failed to update NDA" },
        { status: 500 },
      );
    }

    // If NDA was signed, log activity
    if (body.status === "signed" && existingNDA.status !== "signed") {
      await supabase.from("deal_activities").insert({
        deal_id: existingNDA.deal_id,
        user_id: user.id,
        activity_type: "nda_signed",
        description: "NDA signed",
      });
    }

    return NextResponse.json({ nda });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

