"use client";

/**
 * Quick Actions Component
 * Common actions for dashboard users
 */

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Building2,
  Handshake,
  FileSignature,
  Upload,
  Plus,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuickActionsProps {
  userRole: string;
}

export function QuickActions({ userRole }: QuickActionsProps) {
  const params = useParams();
  const locale = params?.locale || "en";
  const t = useTranslations("dashboard.quickActions");

  // Define actions based on role
  const actions = [
    {
      label: t("addCompany"),
      href: `/${locale}/dashboard/companies/new`,
      icon: Building2,
      color: "bg-blue-500 hover:bg-blue-600",
      roles: ["seller", "broker", "admin"],
    },
    {
      label: t("createDeal"),
      href: `/${locale}/dashboard/deals/new`,
      icon: Handshake,
      color: "bg-green-500 hover:bg-green-600",
      roles: ["seller", "broker", "admin"],
    },
    {
      label: t("uploadDocuments"),
      href: `/${locale}/dashboard/materials`,
      icon: Upload,
      color: "bg-purple-500 hover:bg-purple-600",
      roles: ["seller", "broker", "admin"],
    },
    {
      label: t("viewAnalytics"),
      href: `/${locale}/dashboard/analytics`,
      icon: TrendingUp,
      color: "bg-orange-500 hover:bg-orange-600",
      roles: ["admin", "analyst"],
    },
  ];

  const filteredActions = actions.filter((action) =>
    action.roles.includes(userRole),
  );

  if (filteredActions.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {t("title")}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.label} href={action.href}>
              <Button
                variant="outline"
                className="w-full h-auto py-4 flex flex-col items-center gap-2 hover:shadow-md transition-all"
              >
                <div
                  className={`${action.color} p-3 rounded-full text-white`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {action.label}
                </span>
              </Button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

