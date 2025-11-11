import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/permissions/user-role
 * 
 * Get current user's role and permissions
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user profile with role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(`
        id,
        email,
        full_name,
        role,
        avatar_url,
        user_organizations(
          organization_id,
          role,
          organizations(
            id,
            name,
            type
          )
        )
      `)
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Get role permissions
    const { data: permissions, error: permissionsError } = await supabase
      .from("role_permissions")
      .select("*")
      .eq("role", profile.role);

    if (permissionsError) {
      console.error("Failed to fetch permissions:", permissionsError);
    }

    return NextResponse.json({
      user: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        avatar_url: profile.avatar_url,
      },
      organization: profile.user_organizations?.[0]?.organizations || null,
      organizationRole: profile.user_organizations?.[0]?.role || null,
      permissions: permissions || [],
    });
  } catch (error) {
    console.error("User role fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/permissions/user-role
 * 
 * Change user role (admin only)
 * 
 * Body:
 * - targetUserId: string
 * - newRole: UserRole
 * - reason: string
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const { targetUserId, newRole, reason } = await request.json();

    if (!targetUserId || !newRole || !reason) {
      return NextResponse.json(
        { error: "Missing required fields: targetUserId, newRole, reason" },
        { status: 400 }
      );
    }

    // Call the database function to change role
    const { data, error } = await supabase.rpc("change_user_role", {
      target_user_id: targetUserId,
      new_user_role: newRole,
      reason,
    });

    if (error) {
      console.error("Role change error:", error);
      return NextResponse.json(
        { error: "Failed to change user role" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User role changed successfully",
    });
  } catch (error) {
    console.error("Role change error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

