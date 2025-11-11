"use client";

/**
 * Deal Card Component
 * Displays deal summary in kanban board
 */

import Link from "next/link";
import { Building2, User, Calendar, Euro } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DealCardProps {
  deal: {
    id: string;
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
  };
}

export function DealCard({ deal }: DealCardProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `€${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `€${(value / 1000).toFixed(0)}K`;
    } else {
      return `€${value.toFixed(0)}`;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString();
  };

  return (
    <Link href={`/dashboard/deals/${deal.id}`}>
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer">
        {/* Company Name */}
        <div className="flex items-start gap-3 mb-3">
          {deal.companies.logo_url ? (
            <img
              src={deal.companies.logo_url}
              alt={deal.companies.name}
              className="w-10 h-10 rounded object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
              <Building2 className="w-5 h-5 text-gray-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 dark:text-white truncate">
              {deal.companies.name}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {deal.companies.industry}
            </p>
          </div>
        </div>

        {/* Deal Value */}
        {deal.estimated_value > 0 && (
          <div className="flex items-center gap-2 mb-2">
            <Euro className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {formatCurrency(deal.estimated_value)}
            </span>
          </div>
        )}

        {/* Buyer */}
        {deal.buyer && (
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {deal.buyer.full_name || deal.buyer.email}
            </span>
          </div>
        )}

        {/* Last Updated */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Updated {formatDate(deal.updated_at)}
          </span>
        </div>
      </div>
    </Link>
  );
}

