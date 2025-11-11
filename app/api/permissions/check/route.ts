import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type { PermissionKey } from "@/types/roles";

/**
 * POST /api/permissions/check
 * 
 * Check if user has permission to perform an action on a resource
 * 
 * Body:
 * - resource: string (e.g., "company", "deal", "nda")
 * - action: string (e.g., "view", "create", "update", "delete")
 * - resourceId?: string (optional, for ownership/participant checks)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", hasPermission: false },
        { status: 401 }
      );
    }

    const { resource, action, resourceId } = await request.json();

    if (!resource || !action) {
      return NextResponse.json(
        { error: "Missing required fields: resource, action", hasPermission: false },
        { status: 400 }
      );
    }

    // Call the database function to check permission
    const { data, error } = await supabase.rpc("has_permission", {
      user_id: user.id,
      resource,
      action,
    });

    if (error) {
      console.error("Permission check error:", error);
      return NextResponse.json(
        { error: "Failed to check permission", hasPermission: false },
        { status: 500 }
      );
    }

    // Additional checks for specific resources if resourceId is provided
    let hasAccess = data === true;

    if (hasAccess && resourceId) {
      // Check ownership or participation for specific resource types
      if (resource === "company") {
        const { data: company } = await supabase
          .from("companies")
          .select("organization_id, profiles!inner(id)")
          .eq("id", resourceId)
          .maybeSingle();

        if (company) {
          const { data: userOrg } = await supabase
            .from("user_organizations")
            .select("organization_id")
            .eq("user_id", user.id)
            .eq("organization_id", company.organization_id)
            .maybeSingle();

          hasAccess = !!userOrg;
        }
      } else if (resource === "deal") {
        const { data: deal } = await supabase
          .from("deals")
          .select(`
            id,
            companies!inner(
              organization_id
            )
          `)
          .eq("id", resourceId)
          .maybeSingle();

        if (deal) {
          const { data: userOrg } = await supabase
            .from("user_organizations")
            .select("organization_id")
            .eq("user_id", user.id)
            .eq("organization_id", deal.companies.organization_id)
            .maybeSingle();

          hasAccess = !!userOrg;
        }
      }
    }

    return NextResponse.json({
      hasPermission: hasAccess,
      resource,
      action,
    });
  } catch (error) {
    console.error("Permission check error:", error);
    return NextResponse.json(
      { error: "Internal server error", hasPermission: false },
      { status: 500 }
    );
  }
}

