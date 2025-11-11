"use client";

/**
 * Deals Kanban Board
 * Drag-and-drop interface for deal pipeline management
 */

import { useState } from "react";
import { DealCard } from "./DealCard";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Deal {
  id: string;
  current_stage: string;
  estimated_value: number;
  companies: {
    id: string;
    name: string;
    industry: string;
    logo_url?: string;
  };
  buyer?: {
    id: string;
    full_name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

interface Stage {
  id: string;
  name: string;
  color: string;
}

interface DealsKanbanProps {
  deals: Deal[];
  stages: Stage[];
}

export function DealsKanban({ deals, stages }: DealsKanbanProps) {
  const [localDeals, setLocalDeals] = useState(deals);

  // Group deals by stage
  const dealsByStage = stages.reduce(
    (acc, stage) => {
      acc[stage.id] = localDeals.filter(
        (deal) => deal.current_stage === stage.id,
      );
      return acc;
    },
    {} as Record<string, Deal[]>,
  );

  // Calculate stage totals
  const stageValues = stages.reduce(
    (acc, stage) => {
      const stageDeals = dealsByStage[stage.id] || [];
      acc[stage.id] = stageDeals.reduce(
        (sum, deal) => sum + (Number(deal.estimated_value) || 0),
        0,
      );
      return acc;
    },
    {} as Record<string, number>,
  );

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `€${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `€${(value / 1000).toFixed(0)}K`;
    } else {
      return `€${value.toFixed(0)}`;
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map((stage) => {
        const stageDeals = dealsByStage[stage.id] || [];
        const stageValue = stageValues[stage.id] || 0;

        return (
          <div
            key={stage.id}
            className="flex-shrink-0 w-80 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            {/* Stage Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {stage.name}
                  </h3>
                  <Badge variant="secondary" className="rounded-full">
                    {stageDeals.length}
                  </Badge>
                </div>
              </div>
              {stageValue > 0 && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {formatCurrency(stageValue)}
                </p>
              )}
            </div>

            {/* Stage Content */}
            <div className="p-4 space-y-3 min-h-[200px]">
              {stageDeals.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-sm text-gray-500 dark:text-gray-400">
                  No deals in this stage
                </div>
              ) : (
                stageDeals.map((deal) => (
                  <DealCard key={deal.id} deal={deal} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

