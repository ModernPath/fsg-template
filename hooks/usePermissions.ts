import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import type { UserRole } from "@/types/roles";

interface UserPermissions {
  user: {
    id: string;
    email: string;
    full_name: string | null;
    role: UserRole;
    avatar_url: string | null;
  } | null;
  organization: {
    id: string;
    name: string;
    type: string;
  } | null;
  organizationRole: string | null;
  permissions: any[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch and manage user permissions
 */
export function usePermissions(): UserPermissions {
  const [data, setData] = useState<UserPermissions>({
    user: null,
    organization: null,
    organizationRole: null,
    permissions: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchPermissions() {
      try {
        const response = await fetch("/api/permissions/user-role");

        if (!response.ok) {
          if (response.status === 401) {
            setData((prev) => ({
              ...prev,
              loading: false,
              error: "Unauthorized",
            }));
            return;
          }
          throw new Error("Failed to fetch permissions");
        }

        const result = await response.json();

        setData({
          user: result.user,
          organization: result.organization,
          organizationRole: result.organizationRole,
          permissions: result.permissions,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error("Error fetching permissions:", error);
        setData((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }));
      }
    }

    fetchPermissions();
  }, []);

  return data;
}

/**
 * Hook to check a specific permission
 */
export function useHasPermission(
  resource: string,
  action: string,
  resourceId?: string
): {
  hasPermission: boolean | null;
  loading: boolean;
  error: string | null;
} {
  const [state, setState] = useState<{
    hasPermission: boolean | null;
    loading: boolean;
    error: string | null;
  }>({
    hasPermission: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function checkPermission() {
      try {
        const response = await fetch("/api/permissions/check", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            resource,
            action,
            resourceId,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to check permission");
        }

        const result = await response.json();

        setState({
          hasPermission: result.hasPermission,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error("Error checking permission:", error);
        setState({
          hasPermission: false,
          loading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    checkPermission();
  }, [resource, action, resourceId]);

  return state;
}

/**
 * Client-side permission checker (using cached permissions)
 */
export function checkPermission(
  permissions: any[],
  resource: string,
  action: string
): boolean {
  return permissions.some(
    (p) => p.resource === resource && p.action === action && p.is_allowed
  );
}

