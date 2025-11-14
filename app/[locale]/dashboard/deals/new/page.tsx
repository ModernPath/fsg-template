/**
 * New Deal Page
 * Create a new M&A deal
 */

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { DealForm } from "@/components/deals/DealForm";

interface NewDealPageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    company?: string;
  }>;
}

export default async function NewDealPage({
  params,
  searchParams,
}: NewDealPageProps) {
  const { locale } = await params;
  const { company: companyId } = await searchParams;
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
    .select("role, is_admin, user_organizations(organization_id)")
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

  // Get companies for selection
  const { data: companies } = await supabase
    .from("companies")
    .select("id, name, industry")
    .eq("organization_id", profile.organization_id)
    .eq("status", "active")
    .order("name");

  // Get buyers for selection
  const { data: buyers } = await supabase
    .from("buyer_profiles")
    .select("id, company_name")
    .eq("organization_id", profile.organization_id)
    .order("company_name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Create New Deal
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Start tracking a new M&A opportunity
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <DealForm
          initialData={
            companyId
              ? {
                  company_id: companyId,
                  stage: "lead",
                }
              : undefined
          }
          companies={companies || []}
          buyers={buyers || []}
          mode="create"
        />
      </div>
    </div>
  );
}

