"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AIChat } from "@/components/ai/AIChat";
import {
  Users,
  TrendingUp,
  DollarSign,
  CheckCircle,
  BarChart3,
  Clock,
  AlertCircle,
  Plus,
} from "lucide-react";

interface BrokerDashboardProps {
  userId: string;
  organizationId?: string;
}

/**
 * Broker Dashboard
 * 
 * Features:
 * - Deal pipeline management (Kanban view)
 * - Client portfolio (buyers + sellers)
 * - Commission tracking
 * - AI-powered matchmaking
 * - Task automation
 */
export function BrokerDashboard({ userId, organizationId }: BrokerDashboardProps) {
  const supabase = createClient();
  const [stats, setStats] = useState({
    activeDeals: 0,
    clients: 0,
    estimatedCommission: 0,
    closedThisMonth: 0,
    pendingTasks: 0,
    upcomingDeadlines: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        if (!organizationId) {
          setLoading(false);
          return;
        }

        const [dealsResult, companiesResult] = await Promise.all([
          supabase
            .from("deals")
            .select(
              `
              *,
              companies!inner(
                organization_id
              )
            `
            )
            .eq("companies.organization_id", organizationId)
            .eq("status", "active"),

          supabase
            .from("companies")
            .select("*", { count: "exact", head: true })
            .eq("organization_id", organizationId)
            .eq("is_deleted", false),
        ]);

        // Calculate estimated commission (assuming 3% of deal values)
        const estimatedCommission =
          (dealsResult.data || []).reduce(
            (sum, deal) =>
              sum + ((deal.estimated_value || 0) * 0.03),
            0
          );

        setStats({
          activeDeals: dealsResult.data?.length || 0,
          clients: companiesResult.count || 0,
          estimatedCommission,
          closedThisMonth: 0, // TODO: Calculate from deals
          pendingTasks: 0, // TODO: Add tasks table
          upcomingDeadlines: 0, // TODO: Add deadlines
        });
      } catch (error) {
        console.error("Error fetching broker stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [userId, organizationId, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Tervetuloa, välittäjä! 🤝
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Hallitse kauppoja ja yhdistä oikeat ostajat myyjiin AI:n avulla
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.activeDeals}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Aktiiviset kaupat
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.clients}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Asiakkaat
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <DollarSign className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                €{Math.round(stats.estimatedCommission).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Arvioidut provisiot
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <CheckCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.closedThisMonth}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Suljetut tässä kuussa
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
              <Clock className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.pendingTasks}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Avoimet tehtävät
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.upcomingDeadlines}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Lähestyvät deadlinet
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Pikatoiminnot
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Button className="w-full justify-start">
            <Plus className="mr-2 h-4 w-4" />
            Uusi kauppa
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <Users className="mr-2 h-4 w-4" />
            Matchmaking (AI)
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytiikka
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <Clock className="mr-2 h-4 w-4" />
            Tehtävälistat
          </Button>
        </div>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline & Deals */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary-600" />
              Kauppojen Pipeline (Kanban)
            </h2>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>Kanban-näkymä kaupoista (Lead → Qualification → Proposal → Negotiation → Closing)</p>
              <p className="text-xs mt-2">Toteutetaan seuraavassa vaiheessa</p>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              🤖 AI-Matchmaking Suositukset
            </h2>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>AI ehdottaa sopivia ostaja-myyjä-pareja</p>
              <p className="text-xs mt-2">Tulee kun on riittävästi dataa</p>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Asiakkaat (Myyjät + Ostajat)
            </h2>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>Asiakasportfolio näkyy täällä</p>
            </div>
          </Card>
        </div>

        {/* AI Chat */}
        <div className="lg:col-span-1">
          <AIChat
            role="broker"
            placeholder="Kysy AI:lta kaupan välityksestä..."
            className="h-[600px]"
          />
        </div>
      </div>
    </div>
  );
}

