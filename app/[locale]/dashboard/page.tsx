"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { RoleDashboard } from "@/components/dashboard/RoleDashboard";
import { OrganizationOnboarding } from "@/components/onboarding/OrganizationOnboarding";
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Käyttäjäprofiili puuttuu
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Käyttäjätiliäsi ei ole määritetty oikein. Tämä voi johtua keskeneräisestä rekisteröinnistä tai teknisestä ongelmasta.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Päivitä sivu
            </button>
            <a
              href="/contact"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Ota yhteyttä tukeen
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Get user role and organization
  const userRole = (profile.role || "visitor") as UserRole;
  const organizationId = profile.user_organizations?.[0]?.organization_id;

  // Check if user needs organization but doesn't have one
  const needsOrganization = ["seller", "broker", "partner"].includes(userRole);
  const hasOrganization = !!organizationId;

  if (needsOrganization && !hasOrganization) {
    return (
      <OrganizationOnboarding
        userId={session!.user!.id}
        userRole={userRole}
        userName={profile.full_name || profile.username || "Käyttäjä"}
        userEmail={profile.email || session!.user!.email || ""}
      />
    );
  }

  return (
    <RoleDashboard
      role={userRole}
      userId={session!.user!.id}
      organizationId={organizationId}
    />
  );
}
