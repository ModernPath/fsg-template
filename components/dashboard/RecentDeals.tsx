"use client";

/**
 * Recent Deals List Component
 */

import Link from "next/link";
import { ArrowRight, Clock, Handshake } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/ui/empty-state";

interface Deal {
  id: string;
  stage: string;
  status: string;
  estimated_value: number;
  created_at: string;
  companies: {
    id: string;
    name: string;
  } | null;
  buyers: {
    id: string;
    company_name: string | null;
    full_name: string | null;
  } | null;
}

interface RecentDealsProps {
  deals: Deal[];
}

const stageColors: Record<string, string> = {
  initial_contact: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  nda_review: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  nda_signed: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  due_diligence: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  loi_submitted: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
  negotiation: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
  final_agreement: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400",
  closing: "bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-400",
  closed_won: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  closed_lost: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  on_hold: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
  cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
};

export function RecentDeals({ deals }: RecentDealsProps) {
  const params = useParams();
  const locale = params?.locale || "en";
  const t = useTranslations("dashboard.recentDeals");
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t("title")}
          </h2>
          <Link
            href={`/${locale}/dashboard/deals`}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center"
          >
            {t("viewAll")}
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {deals.length === 0 ? (
          <EmptyState
            icon={Handshake}
            title={t("empty")}
            description="Start tracking your M&A deals and buyer relationships"
          />
        ) : (
          deals.map((deal) => (
            <Link
              key={deal.id}
              href={`/${locale}/dashboard/deals/${deal.id}`}
              className="block px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {deal.companies?.name || "Unnamed Company"}
                    </p>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        stageColors[deal.stage] || stageColors.initial_contact
                      }`}
                    >
                      {deal.stage?.replace(/_/g, " ") || "Initial"}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    {deal.buyers && (
                      <span>
                        {t("columns.buyer")}: {deal.buyers.company_name || deal.buyers.full_name}
                      </span>
                    )}
                    <span className="flex items-center">
                      <Clock className="mr-1 h-3 w-3" />
                      {formatDistanceToNow(new Date(deal.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
                <div className="ml-4 text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    €{(deal.estimated_value / 1000000).toFixed(1)}M
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("columns.value")}
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

