/**
 * NDAs Page
 * Manage Non-Disclosure Agreements
 */

import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, CheckCircle, Clock, FileSignature } from "lucide-react";
import Link from "next/link";

export default async function NDAsPage() {
  const supabase = await createClient();

  // Get user context
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(`
      role,
      is_admin,
      user_organizations(organization_id)
    `)
    .eq("id", user.id)
    .single();

  const organizationId = profile?.user_organizations?.[0]?.organization_id;
  const isAdmin = profile?.is_admin || false;

  // Admins without org can see all, others need org
  if (!organizationId && !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">
            No organization found. Please complete onboarding.
          </p>
        </div>
      </div>
    );
  }

  // Build query
  let ndasQuery = supabase
    .from("ndas")
    .select(
      `
      *,
      deals(
        id,
        companies(id, name)
      ),
      signer:profiles!ndas_signer_id_fkey(
        id,
        full_name,
        email
      ),
      witness:profiles!ndas_witness_id_fkey(
        id,
        full_name,
        email
      )
    `,
    )
    .order("created_at", { ascending: false });

  // Filter by organization if user has one
  if (organizationId) {
    ndasQuery = ndasQuery.eq("organization_id", organizationId);
  }

  // Fetch NDAs with related data
  const { data: ndas, error } = await ndasQuery;

  if (error) {
    console.error("Error fetching NDAs:", error);
    return <div>Error loading NDAs</div>;
  }

  const pendingNDAs = ndas?.filter((nda) => nda.status === "pending") || [];
  const signedNDAs = ndas?.filter((nda) => nda.status === "signed") || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            NDAs
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Manage Non-Disclosure Agreements
          </p>
        </div>
        <Link href="/dashboard/ndas/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create NDA
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total NDAs
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {ndas?.length || 0}
              </p>
            </div>
            <FileSignature className="w-12 h-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pending
              </p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">
                {pendingNDAs.length}
              </p>
            </div>
            <Clock className="w-12 h-12 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Signed
              </p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {signedNDAs.length}
              </p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>
      </div>

      {/* NDAs List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Signer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {ndas && ndas.length > 0 ? (
                ndas.map((nda: any) => (
                  <tr
                    key={nda.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {false && nda.deals?.companies ? (
                          <img
                            src=""
                            alt={nda.deals.companies.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded" />
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {nda.deals?.companies?.name || "N/A"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {nda.signer?.full_name || nda.signer?.email || "N/A"}
                      </div>
                      {nda.signer?.email && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {nda.signer.email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={
                          nda.status === "signed" ? "default" : "secondary"
                        }
                        className={
                          nda.status === "signed"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {nda.status === "signed" ? (
                          <CheckCircle className="w-3 h-3 mr-1 inline" />
                        ) : (
                          <Clock className="w-3 h-3 mr-1 inline" />
                        )}
                        {nda.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {nda.signed_at
                        ? new Date(nda.signed_at).toLocaleDateString()
                        : new Date(nda.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        {nda.document_url && (
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                        <Link href={`/dashboard/ndas/${nda.id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="text-gray-500 dark:text-gray-400">
                      <FileSignature className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">No NDAs yet</p>
                      <p className="text-sm">
                        Create your first NDA to start managing agreements
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

