/**
 * Organization Detail API
 * GET /api/organizations/[id] - Get organization details
 * PATCH /api/organizations/[id] - Update organization
 * DELETE /api/organizations/[id] - Delete organization (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  requireAuth,
  requireAdmin,
  Permission,
  hasPermission,
  createAuditLog,
} from "@/lib/rbac";

export const dynamic = "force-dynamic";

/**
 * GET /api/organizations/[id]
 * Get organization details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userContext = await requireAuth();
    const supabase = await createClient();
    const { id } = params;

    // Check if user belongs to this organization
    if (userContext.organizationId !== id && !userContext.isAdmin) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 },
      );
    }

    const { data: organization, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ organization });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Authentication required" },
      { status: 401 },
    );
  }
}

/**
 * PATCH /api/organizations/[id]
 * Update organization
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userContext = await requireAuth();
    const supabase = await createClient();
    const { id } = params;

    // Check permission
    if (!hasPermission(userContext, Permission.ORG_UPDATE)) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 },
      );
    }

    // Check if user belongs to this organization
    if (userContext.organizationId !== id && !userContext.isAdmin) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { name, country, city, postal_code, settings } = body;

    // Build update object (only include provided fields)
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (country !== undefined) updates.country = country;
    if (city !== undefined) updates.city = city;
    if (postal_code !== undefined) updates.postal_code = postal_code;
    if (settings !== undefined) updates.settings = settings;

    const { data: organization, error } = await supabase
      .from("organizations")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to update organization", details: error.message },
        { status: 500 },
      );
    }

    // Create audit log
    await createAuditLog(
      userContext,
      "organization.update",
      "organization",
      id,
      updates,
    );

    return NextResponse.json({
      organization,
      message: "Organization updated successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: error.message?.includes("Permission") ? 403 : 401 },
    );
  }
}

/**
 * DELETE /api/organizations/[id]
 * Delete organization (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userContext = await requireAdmin();
    const supabase = await createClient();
    const { id } = params;

    // Delete organization (CASCADE will handle related records)
    const { error } = await supabase
      .from("organizations")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to delete organization", details: error.message },
        { status: 500 },
      );
    }

    // Create audit log
    await createAuditLog(
      userContext,
      "organization.delete",
      "organization",
      id,
    );

    return NextResponse.json({
      message: "Organization deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: error.message?.includes("Admin") ? 403 : 401 },
    );
  }
}

