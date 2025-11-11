/**
 * Deal Detail Page
 * View and manage individual deal details
 */

import { createClient } from "@/utils/supabase/server";
import { DealHeader } from "@/components/deals/DealHeader";
import { DealTimeline } from "@/components/deals/DealTimeline";
import { DealActivities } from "@/components/deals/DealActivities";
import { DealDocuments } from "@/components/deals/DealDocuments";
import { notFound } from "next/navigation";

interface DealPageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

export default async function DealPage({ params }: DealPageProps) {
  const { id, locale } = await params;
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
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    return null;
  }

  // Fetch deal with all related data
  const { data: deal, error } = await supabase
    .from("deals")
    .select(
      `
      *,
      companies(
        id,
        name,
        industry,
        description,
        logo_url,
        website,
        annual_revenue,
        annual_ebitda,
        employees_count
      ),
      buyer:profiles!deals_buyer_id_fkey(
        id,
        full_name,
        email,
        avatar_url
      ),
      deal_stages(
        id,
        stage,
        entered_at,
        exited_at,
        notes
      ),
      deal_activities(
        id,
        activity_type,
        description,
        created_at,
        created_by,
        metadata
      ),
      ndas(
        id,
        status,
        signed_at,
        document_url
      ),
      payments(
        id,
        amount,
        type,
        status,
        due_date,
        paid_at
      )
    `,
    )
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .single();

  if (error || !deal) {
    console.error("Error fetching deal:", error);
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Deal Header */}
      <DealHeader deal={deal} locale={locale} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stage Timeline */}
          <DealTimeline
            currentStage={deal.current_stage}
            stages={deal.deal_stages || []}
          />

          {/* Activities */}
          <DealActivities
            activities={deal.deal_activities || []}
            dealId={deal.id}
          />
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Deal Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Deal Information
            </h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-600 dark:text-gray-400">
                  Estimated Value
                </dt>
                <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                  €{Number(deal.estimated_value).toLocaleString()}
                </dd>
              </div>
              {deal.actual_value && (
                <div>
                  <dt className="text-sm text-gray-600 dark:text-gray-400">
                    Actual Value
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                    €{Number(deal.actual_value).toLocaleString()}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm text-gray-600 dark:text-gray-400">
                  Created
                </dt>
                <dd className="text-sm text-gray-900 dark:text-white">
                  {new Date(deal.created_at).toLocaleDateString()}
                </dd>
              </div>
              {deal.closed_at && (
                <div>
                  <dt className="text-sm text-gray-600 dark:text-gray-400">
                    Closed
                  </dt>
                  <dd className="text-sm text-gray-900 dark:text-white">
                    {new Date(deal.closed_at).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Company Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Company
            </h3>
            <div className="flex items-start gap-3">
              {deal.companies.logo_url ? (
                <img
                  src={deal.companies.logo_url}
                  alt={deal.companies.name}
                  className="w-12 h-12 rounded object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded" />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {deal.companies.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {deal.companies.industry}
                </p>
              </div>
            </div>
          </div>

          {/* Documents */}
          <DealDocuments dealId={deal.id} ndas={deal.ndas || []} />
        </div>
      </div>
    </div>
  );
}

