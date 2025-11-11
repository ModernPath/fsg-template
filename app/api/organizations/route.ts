/**
 * Organizations API - List and Create
 * GET /api/organizations - List user's organizations
 * POST /api/organizations - Create new organization (admin only)
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
 * GET /api/organizations
 * List organizations user has access to
 */
export async function GET(request: NextRequest) {
  try {
    const userContext = await requireAuth();
    const supabase = await createClient();

    // Get user's organization(s)
    const { data: organizations, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", userContext.organizationId);

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch organizations", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ organizations });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Authentication required" },
      { status: 401 },
    );
  }
}

/**
 * POST /api/organizations
 * Create a new organization (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const userContext = await requireAdmin();
    const supabase = await createClient();

    const body = await request.json();
    const { name, type, country, city, postal_code, settings } = body;

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json(
        { error: "Name and type are required" },
        { status: 400 },
      );
    }

    // Create organization
    const { data: organization, error } = await supabase
      .from("organizations")
      .insert({
        name,
        type,
        country: country || null,
        city: city || null,
        postal_code: postal_code || null,
        settings: settings || {},
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to create organization", details: error.message },
        { status: 500 },
      );
    }

    // Create audit log
    await createAuditLog(
      userContext,
      "organization.create",
      "organization",
      organization.id,
      { name, type },
    );

    return NextResponse.json(
      { organization, message: "Organization created successfully" },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: error.message?.includes("Admin") ? 403 : 401 },
    );
  }
}

