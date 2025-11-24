"use client";

/**
 * Dashboard Header
 * Top header with user menu and notifications
 */

import { User } from "@supabase/supabase-js";
import { Bell, Search, Menu } from "lucide-react";
import { UserMenu } from "./UserMenu";

interface DashboardHeaderProps {
  user: User;
  profile: any;
  locale: string;
  onMenuToggle?: () => void;
}

export function DashboardHeader({
  user,
  profile,
  locale,
  onMenuToggle,
}: DashboardHeaderProps) {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 gap-4">
        {/* Mobile Menu Button */}
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        {/* Search - Hidden on small mobile, visible from sm */}
        <div className="hidden sm:flex flex-1 max-w-lg">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search companies, deals..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Mobile Search Icon - Visible only on small mobile */}
        <div className="sm:hidden flex-1">
          <button className="w-full flex items-center justify-center p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <Search className="h-5 w-5" />
          </button>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
          {/* Notifications */}
          <button className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Menu */}
          <UserMenu user={user} profile={profile} locale={locale} />
        </div>
      </div>
    </header>
  );
}

