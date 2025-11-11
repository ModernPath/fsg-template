"use client";

/**
 * Recent Deals List Component
 */

import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Deal {
  id: string;
  current_stage: string;
  estimated_value: number;
  created_at: string;
  companies: {
    name: string;
  } | null;
  buyer: {
    email: string;
    full_name: string | null;
  } | null;
}

interface RecentDealsProps {
  deals: Deal[];
}

const stageColors: Record<string, string> = {
  initial_contact: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  nda_signed: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  due_diligence: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  negotiation: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
  closed: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  lost: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
};

export function RecentDeals({ deals }: RecentDealsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Deals
          </h2>
          <Link
            href="/dashboard/deals"
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center"
          >
            View all
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {deals.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">No deals yet</p>
          </div>
        ) : (
          deals.map((deal) => (
            <Link
              key={deal.id}
              href={`/dashboard/deals/${deal.id}`}
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
                        stageColors[deal.current_stage] || stageColors.initial_contact
                      }`}
                    >
                      {deal.current_stage?.replace(/_/g, " ") || "Initial"}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    {deal.buyer && (
                      <span>
                        Buyer: {deal.buyer.full_name || deal.buyer.email}
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
                    Estimated
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

