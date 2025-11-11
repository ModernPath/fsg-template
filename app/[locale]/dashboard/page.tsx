/**
 * BizExit Dashboard Page
 * Main dashboard with KPIs, recent deals, and activity feed
 */

import { createClient } from "@/utils/supabase/server";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { RecentDeals } from "@/components/dashboard/RecentDeals";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { getTranslations } from "next-intl/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const t = await getTranslations("dashboard");

  // Get user context
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
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
            {t("noOrganization.title")}
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {t("noOrganization.description")}
          </p>
        </div>
      </div>
    );
  }

  // Fetch dashboard data
  const [companiesResult, dealsResult, recentDealsResult, activitiesResult] =
    await Promise.all([
      // Companies count
      supabase
        .from("companies")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", profile.organization_id),

      // Deals count and value
      supabase
        .from("deals")
        .select("estimated_value, actual_value")
        .eq("organization_id", profile.organization_id),

      // Recent deals
      supabase
        .from("deals")
        .select(`
          *,
          companies(id, name, logo_url),
          buyers:buyer_profiles(id, company_name, full_name)
        `)
        .eq("organization_id", profile.organization_id)
        .order("created_at", { ascending: false })
        .limit(5),

      // Recent activities
      supabase
        .from("deal_activities")
        .select(`
          *,
          deals!inner(
            id,
            organization_id,
            companies(name)
          )
        `)
        .eq("deals.organization_id", profile.organization_id)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

  const companiesCount = companiesResult.count || 0;
  const deals = dealsResult.data || [];
  const dealsCount = deals.length;
  const totalValue = deals.reduce(
    (sum, deal) => sum + (Number(deal.actual_value) || Number(deal.estimated_value) || 0),
    0,
  );

  const stats = {
    companiesCount,
    dealsCount,
    totalValue,
    activeDeals: deals.filter(
      (d: any) =>
        d.status === "active" &&
        !["closed_won", "closed_lost", "cancelled"].includes(d.stage || ""),
    ).length,
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t("title")}
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          {t("welcome")}
        </p>
      </div>

      {/* Stats */}
      <DashboardStats stats={stats} />

      {/* Quick Actions */}
      <QuickActions userRole={profile.role} />

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Deals */}
        <div className="lg:col-span-2">
          <RecentDeals deals={recentDealsResult.data || []} />
        </div>

        {/* Activity Feed */}
        <div>
          <ActivityFeed activities={activitiesResult.data || []} />
        </div>
      </div>
    </div>
  );
}

