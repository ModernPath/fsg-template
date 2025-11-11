"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AIChat } from "@/components/ai/AIChat";
import {
  Users,
  Building2,
  TrendingUp,
  AlertTriangle,
  Activity,
  DollarSign,
  Shield,
  Database,
  Settings,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

interface AdminDashboardProps {
  userId: string;
}

/**
 * Admin Dashboard
 * 
 * Features:
 * - Platform analytics and monitoring
 * - User management
 * - Content moderation (AI-powered)
 * - Fraud detection
 * - System health monitoring
 * - Revenue tracking
 */
export function AdminDashboard({ userId }: AdminDashboardProps) {
  const supabase = createClient();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCompanies: 0,
    totalDeals: 0,
    activeDeals: 0,
    platformRevenue: 0,
    monthlyGrowth: 0,
    pendingModeration: 0,
    systemHealth: 100,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [usersResult, companiesResult, dealsResult, activeDealsResult] =
          await Promise.all([
            supabase
              .from("profiles")
              .select("*", { count: "exact", head: true }),

            supabase
              .from("companies")
              .select("*", { count: "exact", head: true })
              .eq("is_deleted", false),

            supabase
              .from("deals")
              .select("estimated_value, actual_value"),

            supabase
              .from("deals")
              .select("*", { count: "exact", head: true })
              .eq("status", "active"),
          ]);

        const totalRevenue = (dealsResult.data || []).reduce(
          (sum, deal) =>
            sum + ((deal.actual_value || deal.estimated_value || 0) * 0.03), // 3% platform fee
          0
        );

        setStats({
          totalUsers: usersResult.count || 0,
          totalCompanies: companiesResult.count || 0,
          totalDeals: dealsResult.data?.length || 0,
          activeDeals: activeDealsResult.count || 0,
          platformRevenue: totalRevenue,
          monthlyGrowth: 0, // TODO: Calculate from historical data
          pendingModeration: 0, // TODO: Add moderation queue
          systemHealth: 100, // TODO: Implement health checks
        });
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [userId, supabase]);

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
          Admin Dashboard 👑
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Hallitse alustaa, käyttäjiä ja sisältöä AI:n avulla
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalUsers}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Käyttäjät
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <Building2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalCompanies}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Yritykset
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <TrendingUp className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalDeals}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Kaupat (kaikki)
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
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
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
              <DollarSign className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                €{Math.round(stats.platformRevenue).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Alustan liikevaihto
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-pink-100 dark:bg-pink-900 rounded-lg">
              <TrendingUp className="h-6 w-6 text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                +{stats.monthlyGrowth}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Kuukausikasvu
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.pendingModeration}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Odottaa moderointia
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-100 dark:bg-teal-900 rounded-lg">
              <Activity className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.systemHealth}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Järjestelmän terveys
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Hallintatyökalut
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Link href="/admin/users" className="w-full">
            <Button className="w-full justify-start" variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Käyttäjät
            </Button>
          </Link>
          <Link href="/admin/companies" className="w-full">
            <Button className="w-full justify-start" variant="outline">
              <Building2 className="mr-2 h-4 w-4" />
              Yritykset
            </Button>
          </Link>
          <Link href="/admin/deals" className="w-full">
            <Button className="w-full justify-start" variant="outline">
              <TrendingUp className="mr-2 h-4 w-4" />
              Kaupat
            </Button>
          </Link>
          <Button className="w-full justify-start" variant="outline">
            <Shield className="mr-2 h-4 w-4" />
            Moderointi
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Asetukset
          </Button>
        </div>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analytics & Monitoring */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary-600" />
              Reaaliaikainen analytiikka
            </h2>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>Käyttäjäaktiivisuus, kauppojen määrä, liikevaihto (kaavioit)</p>
              <p className="text-xs mt-2">Toteutetaan seuraavassa vaiheessa</p>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              🤖 AI-Petostentunnistus
            </h2>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>AI tunnistaa epäilyttävät kaupat ja käyttäjät automaattisesti</p>
              <p className="text-xs mt-2">Tulee kun on riittävästi dataa</p>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Viimeisimmät toiminnot
            </h2>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>Audit log - käyttäjien toimet platformilla</p>
            </div>
          </Card>
        </div>

        {/* AI Assistant */}
        <div className="lg:col-span-1">
          <AIChat
            role="admin"
            placeholder="Kysy AI:lta alustan hallinnasta..."
            className="h-[600px]"
          />
        </div>
      </div>
    </div>
  );
}

