"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AIChat } from "@/components/ai/AIChat";
import { ContentGenerator } from "@/components/ai/ContentGenerator";
import {
  Shield,
  FileText,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  Clock,
  DollarSign,
} from "lucide-react";

interface PartnerDashboardProps {
  userId: string;
  organizationId?: string;
}

/**
 * Partner Dashboard (Banks, Insurance, Law Firms, Financial Institutions)
 * 
 * Features:
 * - Risk assessment tools
 * - Financing proposal generation
 * - Due diligence automation
 * - Compliance tracking
 * - AI-powered document generation
 */
export function PartnerDashboard({
  userId,
  organizationId,
}: PartnerDashboardProps) {
  const supabase = createClient();
  const [stats, setStats] = useState({
    activeDeals: 0,
    pendingAssessments: 0,
    completedAssessments: 0,
    approvalRate: 0,
    averageRiskScore: 0,
    totalFinancing: 0,
  });
  const [loading, setLoading] = useState(true);
  const [partnerType, setPartnerType] = useState<string>("bank"); // bank, insurance, law_firm, financial

  useEffect(() => {
    async function fetchStats() {
      try {
        // Get organization type to determine partner role
        if (organizationId) {
          const { data: org } = await supabase
            .from("organizations")
            .select("type")
            .eq("id", organizationId)
            .single();

          if (org?.type) {
            setPartnerType(org.type);
          }
        }

        // TODO: Implement actual queries when tables are ready
        setStats({
          activeDeals: 0,
          pendingAssessments: 0,
          completedAssessments: 0,
          approvalRate: 0,
          averageRiskScore: 0,
          totalFinancing: 0,
        });
      } catch (error) {
        console.error("Error fetching partner stats:", error);
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

  const getPartnerTitle = () => {
    switch (partnerType) {
      case "bank":
        return "Tervetuloa, rahoituskumppani! 🏦";
      case "insurance":
        return "Tervetuloa, vakuutuskumppani! 🛡️";
      case "law_firm":
        return "Tervetuloa, lakikumppani! ⚖️";
      default:
        return "Tervetuloa, kumppani! 🤝";
    }
  };

  const getPartnerDescription = () => {
    switch (partnerType) {
      case "bank":
        return "Arvioi riskejä ja luo rahoitusehdotuksia AI:n avulla";
      case "insurance":
        return "Luo vakuutussuunnitelmia ja arvioi riskejä";
      case "law_firm":
        return "Automatisoi due diligence ja lakidokumentit";
      default:
        return "Tue yrityskauppoja asiantuntemuksellasi";
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {getPartnerTitle()}
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          {getPartnerDescription()}
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
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.pendingAssessments}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Odottavat arvioinnit
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
                {stats.completedAssessments}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Valmiit arvioinnit
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.approvalRate}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Hyväksymisprosentti
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
                {stats.averageRiskScore}/10
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Keskimääräinen riski
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
                €{stats.totalFinancing.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Kokonaisrahoitus
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
            <Shield className="mr-2 h-4 w-4" />
            Uusi riskiarvio
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Luo rahoitusehdotus
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <CheckCircle className="mr-2 h-4 w-4" />
            Due Diligence
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Compliance-tarkistus
          </Button>
        </div>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Section */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary-600" />
              Odottavat riskiarviot
            </h2>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>Arvioitavat kaupat näkyvät täällä</p>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Viimeisimmät arvioinnit
            </h2>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>Valmiit riskiarviot ja rahoitusehdotukset</p>
            </div>
          </Card>
        </div>

        {/* AI Tools Section */}
        <div className="space-y-6">
          <AIChat
            role="partner"
            placeholder="Kysy AI:lta riskiarvioista ja rahoituksesta..."
            className="h-[400px]"
          />

          {/* AI Content Generator would go here when a deal is selected */}
        </div>
      </div>
    </div>
  );
}

