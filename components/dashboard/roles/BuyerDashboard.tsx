"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AIChat } from "@/components/ai/AIChat";
import {
  Search,
  TrendingUp,
  FileText,
  Star,
  Eye,
  CheckCircle,
} from "lucide-react";

interface BuyerDashboardProps {
  userId: string;
}

/**
 * Buyer Dashboard
 * 
 * Features:
 * - AI-powered company recommendations
 * - Saved searches and watchlist
 * - Active NDAs and document access
 * - Deal pipeline
 */
export function BuyerDashboard({ userId }: BuyerDashboardProps) {
  const supabase = createClient();
  const [stats, setStats] = useState({
    watchlist: 0,
    ndas: 0,
    activeDeals: 0,
    viewedCompanies: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // TODO: Implement actual queries when tables are ready
        setStats({
          watchlist: 0,
          ndas: 0,
          activeDeals: 0,
          viewedCompanies: 0,
        });
      } catch (error) {
        console.error("Error fetching buyer stats:", error);
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
          Tervetuloa, ostaja! 🎯
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Löydä täydellinen yritysostokohde AI:n avulla
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Star className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.watchlist}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Seurattavat
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.ndas}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Allekirjoitetut NDA:t
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
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Eye className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.viewedCompanies}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Katsottuja yrityksiä
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
          <Button className="w-full justify-start" variant="outline">
            <Search className="mr-2 h-4 w-4" />
            Etsi yrityksiä
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Katso NDA:t
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <TrendingUp className="mr-2 h-4 w-4" />
            Kauppojeni tilanne
          </Button>
        </div>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Recommendations */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary-600" />
              AI-suositukset sinulle
            </h2>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>Täydennä profiilisi, niin AI voi suositella sopivia yrityksiä</p>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Seurattavat yritykset
            </h2>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>Lisää yrityksiä seurantalistallesi</p>
            </div>
          </Card>
        </div>

        {/* AI Chat */}
        <div className="lg:col-span-1">
          <AIChat
            role="buyer"
            placeholder="Kysy AI:lta yritysostamisesta..."
            className="h-[600px]"
          />
        </div>
      </div>
    </div>
  );
}

