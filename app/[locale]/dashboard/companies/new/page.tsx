/**
 * New Company Page
 * Create a new company listing
 */

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { CompanyForm } from "@/components/companies/CompanyForm";

interface NewCompanyPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function NewCompanyPage({ params }: NewCompanyPageProps) {
  const { locale } = await params;
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/sign-in`);
  }

  // Get user's organization
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            No Organization
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Please contact support to set up your organization.
          </p>
        </div>
      </div>
    );
  }

  // Check permissions
  if (!["seller", "broker", "admin"].includes(profile.role)) {
    redirect(`/${locale}/dashboard`);
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
        <CompanyForm mode="create" />
      </div>
    </div>
  );
}

