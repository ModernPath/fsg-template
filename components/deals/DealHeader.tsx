"use client";

/**
 * Deal Header Component
 * Shows deal title and action buttons
 */

import { Building2, ArrowLeft, MoreVertical } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DealHeaderProps {
  deal: {
    id: string;
    current_stage: string;
    companies: {
      name: string;
    };
  };
  locale: string;
}

const stageColors: Record<string, string> = {
  lead: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  qualification:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  nda_signed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  evaluation:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  loi_submitted:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  due_diligence:
    "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  negotiation:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  closed_won:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  closed_lost: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const stageLabels: Record<string, string> = {
  lead: "Lead",
  qualification: "Qualification",
  nda_signed: "NDA Signed",
  evaluation: "Evaluation",
  loi_submitted: "LOI Submitted",
  due_diligence: "Due Diligence",
  negotiation: "Negotiation",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
};

export function DealHeader({ deal, locale }: DealHeaderProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          {/* Back Button */}
          <Link href={`/${locale}/dashboard/deals`}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>

          {/* Company Logo & Info */}
          <div className="flex items-start gap-3">
            {false && deal.companies ? (
              <img
                src=""
                alt={deal.companies.name}
                className="w-12 h-12 rounded object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                <Building2 className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {deal.companies.name}
              </h1>
              <Badge className={stageColors[deal.current_stage] || ""}>
                {stageLabels[deal.current_stage] || deal.current_stage}
              </Badge>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button variant="outline">Edit Deal</Button>
          <Button variant="outline" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

