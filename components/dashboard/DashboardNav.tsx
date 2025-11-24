"use client";

/**
 * Dashboard Navigation Sidebar
 * Main navigation for BizExit platform
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Handshake,
  FileText,
  Users,
  CreditCard,
  Settings,
  LayoutDashboard,
  FileStack,
  FileSignature,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface DashboardNavProps {
  locale: string;
  profile: any;
  onClose?: () => void;
}

const navigationItems = [
  {
    key: "dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["seller", "broker", "buyer", "partner", "admin", "analyst"],
  },
  {
    key: "companies",
    href: "/dashboard/companies",
    icon: Building2,
    roles: ["seller", "broker", "admin"],
  },
  {
    key: "deals",
    href: "/dashboard/deals",
    icon: Handshake,
    roles: ["seller", "broker", "buyer", "admin", "analyst"],
  },
  {
    key: "listings",
    href: "/dashboard/listings",
    icon: FileStack,
    roles: ["broker", "admin"],
  },
  {
    key: "buyers",
    href: "/dashboard/buyers",
    icon: Users,
    roles: ["broker", "admin"],
  },
  {
    key: "ndas",
    href: "/dashboard/ndas",
    icon: FileSignature,
    roles: ["broker", "buyer", "admin"],
  },
  {
    key: "materials",
    href: "/dashboard/materials",
    icon: FileText,
    roles: ["seller", "broker", "admin"],
  },
  {
    key: "payments",
    href: "/dashboard/payments",
    icon: CreditCard,
    roles: ["seller", "broker", "admin"],
  },
  {
    key: "settings",
    href: "/dashboard/settings",
    icon: Settings,
    roles: ["seller", "broker", "buyer", "partner", "admin", "analyst"],
  },
];

export function DashboardNav({
  locale,
  profile,
  onClose,
}: DashboardNavProps) {
  const pathname = usePathname();
  const userRole = profile?.role || "buyer";
  const t = useTranslations("dashboard.nav");

  // Filter navigation based on user role
  const filteredNavigation = navigationItems.filter((item) =>
    item.roles.includes(userRole),
  );

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full flex flex-col">
      <div className="flex flex-col h-full">
        {/* Logo and Close Button */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          <Link
            href={`/${locale}/dashboard`}
            className="flex items-center"
            onClick={handleLinkClick}
          >
            <Building2 className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
              BizExit
            </span>
          </Link>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Organization */}
        {profile?.organization && (
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Organization
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {profile.organization.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {userRole}
            </p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {filteredNavigation.map((item) => {
            const isActive = pathname === `/${locale}${item.href}`;
            const Icon = item.icon;

            return (
              <Link
                key={item.key}
                href={`/${locale}${item.href}`}
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700",
                )}
              >
                <Icon className="mr-3 h-5 w-5" />
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            BizExit v1.0.0
          </p>
        </div>
      </div>
    </aside>
  );
}

