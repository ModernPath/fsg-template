/**
 * BizExit Dashboard Page
 * Main dashboard with KPIs, recent deals, and activity feed
 */

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { RecentDeals } from "@/components/dashboard/RecentDeals";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { useTranslations } from "next-intl";

export default function DashboardPage() {
  const { session } = useAuth();
  const supabase = createClient();
  const t = useTranslations("dashboard");

  const [stats, setStats] = useState({
    companies: 0,
    totalDeals: 0,
    pipelineValue: 0,
    activeDeals: 0,
  });
  const [recentDeals, setRecentDeals] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Get user profile with organization
        const { data: profileData } = await supabase
          .from("profiles")
          .select(`
            *,
            user_organizations!inner(
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

        const orgId = profileData?.user_organizations?.[0]?.organization_id;

        if (!orgId) {
          setLoading(false);
          return;
        }

        // Fetch dashboard data in parallel
        const [companiesResult, dealsResult, recentDealsResult, activitiesResult] =
          await Promise.all([
            // Companies count
            supabase
              .from("companies")
              .select("*", { count: "exact", head: true })
              .eq("organization_id", orgId)
              .eq("is_deleted", false),

            // Deals count and value via companies
            supabase
              .from("deals")
              .select(`
                estimated_value,
                actual_value,
                status,
                stage,
                companies!inner(
                  organization_id
                )
              `)
              .eq("companies.organization_id", orgId),

            // Recent deals
            supabase
              .from("deals")
              .select(`
                *,
                companies!inner(
                  id,
                  name,
                  logo_url,
                  organization_id
                ),
                buyer_profiles(
                  id,
                  company_name,
                  full_name
                )
              `)
              .eq("companies.organization_id", orgId)
              .order("created_at", { ascending: false })
              .limit(5),

            // Recent activities
            supabase
              .from("deal_activities")
              .select(`
                *,
                deals!inner(
                  id,
                  companies!inner(
                    name,
                    organization_id
                  )
                ),
                profiles(
                  id,
                  full_name,
                  avatar_url
                )
              `)
              .eq("deals.companies.organization_id", orgId)
              .order("created_at", { ascending: false })
              .limit(10),
          ]);

        // Process stats
        const companiesCount = companiesResult.count || 0;
        const deals = dealsResult.data || [];
        const dealsCount = deals.length;
        const totalValue = deals.reduce(
          (sum, deal) =>
            sum + (Number(deal.actual_value) || Number(deal.estimated_value) || 0),
          0
        );

        setStats({
          companies: companiesCount,
          totalDeals: dealsCount,
          pipelineValue: totalValue,
          activeDeals: deals.filter(
            (d: any) =>
              d.status === "active" &&
              !["closed_won", "closed_lost", "cancelled"].includes(d.stage || "")
          ).length,
        });

        setRecentDeals(recentDealsResult.data || []);
        setActivities(activitiesResult.data || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [session?.user?.id, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!profile?.user_organizations?.[0]?.organization_id) {
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

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t("title")}
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">{t("welcome")}</p>
      </div>

      {/* Stats */}
      <DashboardStats stats={stats} />

      {/* Quick Actions */}
      <QuickActions
        userRole={profile?.user_organizations?.[0]?.role || profile?.role}
      />

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Deals */}
        <div className="lg:col-span-2">
          <RecentDeals deals={recentDeals} />
        </div>

        {/* Activity Feed */}
        <div>
          <ActivityFeed activities={activities} />
        </div>
      </div>
    </div>
  );
}
