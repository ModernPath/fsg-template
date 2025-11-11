"use client";

import Link from "next/link";
import { Handshake, ArrowRight, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function CompanyDeals({ companyId, deals }: any) {
  const stageColors: Record<string, string> = {
    initial_contact: "bg-gray-100 text-gray-800",
    nda_signed: "bg-blue-100 text-blue-800",
    due_diligence: "bg-yellow-100 text-yellow-800",
    negotiation: "bg-purple-100 text-purple-800",
    closed: "bg-green-100 text-green-800",
    lost: "bg-red-100 text-red-800",
  };

  if (deals.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-12 text-center">
        <Handshake className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          No deals for this company yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {deals.map((deal: any) => (
        <Link
          key={deal.id}
          href={`/dashboard/deals/${deal.id}`}
          className="block bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    stageColors[deal.current_stage] || stageColors.initial_contact
                  }`}
                >
                  {deal.current_stage?.replace(/_/g, " ") || "Initial"}
                </span>
                {deal.buyer && (
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Buyer: {deal.buyer.full_name || deal.buyer.email}
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center">
                  <Clock className="mr-1 h-3 w-3" />
                  {formatDistanceToNow(new Date(deal.created_at), {
                    addSuffix: true,
                  })}
                </span>
                {deal.estimated_value && (
                  <span>
                    Value: €{(deal.estimated_value / 1000000).toFixed(1)}M
                  </span>
                )}
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400" />
          </div>
        </Link>
      ))}
    </div>
  );
}

