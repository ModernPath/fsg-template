"use client";

/**
 * New Company Page
 * Create a new company listing
 */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { CompanyForm } from "@/components/companies/CompanyForm";
import { Loader2 } from "lucide-react";

export default function NewCompanyPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "en";
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        // Check authentication
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (!currentUser) {
          router.push(`/${locale}/auth/sign-in`);
          return;
        }

        setUser(currentUser);

        // Get user's profile and organization
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select(`
            id,
            role,
            user_organizations(
              organization_id,
              role
            )
          `)
          .eq("id", currentUser.id)
          .single();

        if (profileError) {
          console.error("Profile fetch error:", profileError);
          setError("Failed to load profile");
          setLoading(false);
          return;
        }

        const orgId = profile?.user_organizations?.[0]?.organization_id;

        if (!orgId) {
          setError("no_organization");
          setLoading(false);
          return;
        }

        // Check permissions
        if (!["seller", "broker", "admin"].includes(profile.role)) {
          router.push(`/${locale}/dashboard`);
          return;
        }

        setOrganizationId(orgId);
        setLoading(false);
      } catch (err) {
        console.error("Auth check error:", err);
        setError("Failed to authenticate");
        setLoading(false);
      }
    }

    checkAuth();
  }, [locale, router, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error === "no_organization") {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            No Organization
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            You need to set up your organization first.
          </p>
          <a
            href={`/${locale}/dashboard`}
            className="mt-4 inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">Error</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{error}</p>
          <a
            href={`/${locale}/dashboard`}
            className="mt-4 inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  if (!user || !organizationId) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Add New Company
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Create a new company listing
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <CompanyForm 
          mode="create" 
          organizationId={organizationId}
          userId={user.id}
        />
      </div>
    </div>
  );
}

