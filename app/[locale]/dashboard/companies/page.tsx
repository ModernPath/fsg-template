/**
 * Companies List Page
 * View and manage all companies in the organization
 */

import { createClient } from "@/utils/supabase/server";
import { CompaniesTable } from "@/components/companies/CompaniesTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  // Get user context
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    return null;
  }

  // Parse query params
  const status = params.status || "all";
  const page = parseInt(params.page || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  // Build query
  let query = supabase
    .from("companies")
    .select("*, listings(count), deals(count)", { count: "exact" })
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data: companies, error, count } = await query;

  if (error) {
    console.error("Error fetching companies:", error);
    return <div>Error loading companies</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Companies
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Manage your company listings and deals
          </p>
        </div>
        <Link href="/dashboard/companies/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Company
          </Button>
        </Link>
      </div>

      {/* Companies Table */}
      <CompaniesTable
        companies={companies || []}
        totalCount={count || 0}
        currentPage={page}
        limit={limit}
        statusFilter={status}
      />
    </div>
  );
}

