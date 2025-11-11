"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { RoleDashboard } from "@/components/dashboard/RoleDashboard";
import type { UserRole } from "@/types/roles";

/**
 * Main Dashboard Page
 * 
 * Routes to the appropriate role-based dashboard based on user's role
 */
export default function DashboardPage() {
  const { session } = useAuth();
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data: profileData } = await supabase
          .from("profiles")
          .select(`
            *,
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
          .eq("id", session.user.id)
          .single();

        setProfile(profileData);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [session?.user?.id, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Profiilia ei löytynyt
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Ota yhteyttä tukeen
          </p>
        </div>
      </div>
    );
  }

  // Get user role and organization
  const userRole = (profile.role || "visitor") as UserRole;
  const organizationId = profile.user_organizations?.[0]?.organization_id;

  return (
    <RoleDashboard
      role={userRole}
      userId={session!.user!.id}
      organizationId={organizationId}
    />
  );
}
