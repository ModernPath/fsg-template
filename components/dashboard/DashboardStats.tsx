"use client";

/**
 * Dashboard KPI Stats Cards
 */

import { Building2, Handshake, TrendingUp, Activity } from "lucide-react";

interface DashboardStatsProps {
  stats: {
    companiesCount: number;
    dealsCount: number;
    totalValue: number;
    activeDeals: number;
  };
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const cards = [
    {
      title: "Companies",
      value: stats.companiesCount,
      icon: Building2,
      change: "+12%",
      changeType: "positive" as const,
    },
    {
      title: "Total Deals",
      value: stats.dealsCount,
      icon: Handshake,
      change: "+8%",
      changeType: "positive" as const,
    },
    {
      title: "Pipeline Value",
      value: `€${(stats.totalValue / 1000000).toFixed(1)}M`,
      icon: TrendingUp,
      change: "+23%",
      changeType: "positive" as const,
    },
    {
      title: "Active Deals",
      value: stats.activeDeals,
      icon: Activity,
      change: "+5%",
      changeType: "positive" as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {card.title}
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {card.value}
                </p>
              </div>
              <div className="ml-4">
                <div className="bg-blue-100 dark:bg-blue-900/20 rounded-full p-3">
                  <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
            <div className="mt-4">
              <span
                className={`text-sm font-medium ${
                  card.changeType === "positive"
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {card.change}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                vs last month
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

