/**
 * Deal Detail Page
 * View deal information, timeline, and activities
 */

import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CancelDealButton } from "@/components/deals/CancelDealButton";
import Link from "next/link";
import { ArrowLeft, Edit } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DealHeader } from "@/components/deals/DealHeader";
import { DealTimeline } from "@/components/deals/DealTimeline";
import { DealActivities } from "@/components/deals/DealActivities";
import { DealDocuments } from "@/components/deals/DealDocuments";
import { DealAnalysis } from "@/components/deals/DealAnalysis";

interface Props {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default async function DealDetailPage({ params }: Props) {
  const { locale, id } = await params;
  const supabase = await createClient();
  const t = await getTranslations("deals");

  // Get user context
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    redirect(`/${locale}/dashboard`);
  }

  // Fetch deal with all related data
  const { data: deal, error } = await supabase
    .from("deals")
    .select(
      `
      *,
      companies(*),
      buyers:buyer_profiles(*),
      stages:deal_stages(*),
      activities:deal_activities(
        *,
        user:profiles(full_name, email)
      ),
      ndas(*),
      payments(*)
    `,
    )
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .single();

  if (error || !deal) {
    redirect(`/${locale}/dashboard/deals`);
  }

  // Can edit/delete based on role
  const canEdit = ["seller", "broker", "admin", "partner"].includes(
    profile.role.toLowerCase(),
  );
  const canDelete = ["admin", "broker"].includes(profile.role.toLowerCase());

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: t("title"), href: `/${locale}/dashboard/deals` },
          { label: deal.companies?.name || `Deal #${id.slice(0, 8)}` },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/dashboard/deals`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("backToList")}
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <Link href={`/${locale}/dashboard/deals/${id}/edit`}>
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                {t("edit")}
              </Button>
            </Link>
          )}
          {canDelete && (
            <CancelDealButton
              dealId={id}
              companyName={deal.companies?.name || "Deal"}
              locale={locale}
            />
          )}
        </div>
      </div>

      {/* Deal Header */}
      <DealHeader deal={deal} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Deal Timeline */}
          <DealTimeline stages={deal.stages || []} currentStage={deal.stage} />

          {/* Deal Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Deal Information
            </h2>

            <dl className="space-y-4">
              {/* Company */}
              <div>
                <dt className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Company
                </dt>
                <dd>
                  <Link
                    href={`/${locale}/dashboard/companies/${deal.companies.id}`}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {deal.companies.name}
                  </Link>
                </dd>
              </div>

              {/* Buyer */}
              {deal.buyers && (
                <div>
                  <dt className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Buyer
                  </dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {deal.buyers.company_name}
                  </dd>
                </div>
              )}

              {/* Estimated Value */}
              {deal.estimated_value && (
                <div>
                  <dt className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Estimated Value
                  </dt>
                  <dd className="text-2xl font-bold text-green-600 dark:text-green-400">
                    €{(deal.estimated_value / 1000000).toFixed(1)}M
                  </dd>
                </div>
              )}

              {/* Expected Close Date */}
              {deal.expected_close_date && (
                <div>
                  <dt className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Expected Close Date
                  </dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {new Date(deal.expected_close_date).toLocaleDateString()}
                  </dd>
                </div>
              )}

              {/* Notes */}
              {deal.notes && (
                <div>
                  <dt className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Notes
                  </dt>
                  <dd className="text-gray-900 dark:text-white whitespace-pre-wrap">
                    {deal.notes}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Activities */}
          <DealActivities activities={deal.activities || []} />
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Quick Stats
            </h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-600 dark:text-gray-400">
                  Stage
                </dt>
                <dd className="mt-1">
                  <Badge variant="default">{deal.stage}</Badge>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600 dark:text-gray-400">
                  Status
                </dt>
                <dd className="mt-1">
                  <Badge
                    variant={
                      deal.status === "active" ? "default" : "secondary"
                    }
                    className={
                      deal.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }
                  >
                    {deal.status}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600 dark:text-gray-400">
                  Deal Type
                </dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                  {deal.deal_type || "acquisition"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600 dark:text-gray-400">
                  Created
                </dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                  {new Date(deal.created_at).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>

          {/* NDAs */}
          {deal.ndas && deal.ndas.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                NDAs ({deal.ndas.length})
              </h3>
              <div className="space-y-2">
                {deal.ndas.map((nda: any) => (
                  <div
                    key={nda.id}
                    className="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-700 rounded"
                  >
                    <span className="text-sm text-gray-900 dark:text-white">
                      NDA #{nda.id.slice(0, 8)}
                    </span>
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
                      {nda.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payments */}
          {deal.payments && deal.payments.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Payments ({deal.payments.length})
              </h3>
              <div className="space-y-2">
                {deal.payments.map((payment: any) => (
                  <div
                    key={payment.id}
                    className="p-2 border border-gray-200 dark:border-gray-700 rounded"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        €{Number(payment.amount).toLocaleString()}
                      </span>
                      <Badge
                        variant={
                          payment.status === "paid" ? "default" : "secondary"
                        }
                        className={
                          payment.status === "paid"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {payment.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {payment.type}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          <DealDocuments dealId={id} />
        </div>
      </div>
    </div>
  );
}
