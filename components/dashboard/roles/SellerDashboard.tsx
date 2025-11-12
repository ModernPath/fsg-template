"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AIChat } from "@/components/ai/AIChat";
import {
  Building2,
  TrendingUp,
  Eye,
  FileText,
  Plus,
  MessageSquare,
} from "lucide-react";

interface SellerDashboardProps {
  userId: string;
  organizationId?: string;
}

/**
 * Seller Dashboard
 * 
 * Features:
 * - AI-powered listing optimization
 * - Marketing material generation
 * - Interested buyers tracking
 * - Deal pipeline
 */
export function SellerDashboard({ userId, organizationId }: SellerDashboardProps) {
  const supabase = createClient();
  const [stats, setStats] = useState({
    companies: 0,
    listings: 0,
    interestedBuyers: 0,
    activeDeals: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        if (!organizationId) {
          setLoading(false);
          return;
        }

        const [companiesResult, dealsResult] = await Promise.all([
          supabase
            .from("companies")
            .select("*", { count: "exact", head: true })
            .eq("organization_id", organizationId)
            .eq("is_deleted", false),

          supabase
            .from("deals")
            .select(
              `
              *,
              companies!inner(
                organization_id
              )
            `,
              { count: "exact" }
            )
            .eq("companies.organization_id", organizationId)
            .eq("status", "active"),
        ]);

        setStats({
          companies: companiesResult.count || 0,
          listings: 0, // TODO: Add listings table
          interestedBuyers: 0, // TODO: Count interested buyers
          activeDeals: dealsResult.count || 0,
        });
      } catch (error) {
        console.error("Error fetching seller stats:", error);
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
          Tervetuloa, myyjä! 💼
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Myy yrityksesi parhaaseen hintaan AI:n avulla
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.companies}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Yritykset
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.listings}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Aktiiviset listaukset
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Eye className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.interestedBuyers}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Kiinnostuneet ostajat
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
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
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Pikatoiminnot
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button className="w-full justify-start">
            <Plus className="mr-2 h-4 w-4" />
            Luo uusi listaus
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Generoi markkinointimateriaali
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <MessageSquare className="mr-2 h-4 w-4" />
            Vastaa kysymyksiin
          </Button>
        </div>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Omat yritykset
            </h2>
            {stats.companies === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p className="mb-4">Et ole vielä lisännyt yrityksiä</p>
                <Button onClick={() => window.location.href = '/dashboard/companies/new'}>
                  <Plus className="mr-2 h-4 w-4" />
                  Lisää ensimmäinen yritys
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>Yrityksesi näkyvät täällä</p>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Viimeisimmät kiinnostuneet ostajat
            </h2>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>Kiinnostuneet ostajat näkyvät täällä</p>
            </div>
          </Card>
        </div>

        {/* AI Chat */}
        <div className="lg:col-span-1">
          <AIChat
            role="seller"
            placeholder="Kysy AI:lta yrityksen myynnistä..."
            className="h-[600px]"
          />
        </div>
      </div>
    </div>
  );
}

