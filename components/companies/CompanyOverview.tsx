"use client";

import { Building2, TrendingUp, Users, Calendar, Globe } from "lucide-react";

export function CompanyOverview({ company }: any) {
  const stats = [
    {
      label: "Asking Price",
      value: company.asking_price
        ? `€${(company.asking_price / 1000000).toFixed(1)}M`
        : "Not set",
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      label: "Annual Revenue",
      value: company.annual_revenue
        ? `€${(company.annual_revenue / 1000000).toFixed(1)}M`
        : "Not set",
      icon: Building2,
      color: "text-blue-600",
    },
    {
      label: "EBITDA",
      value: company.annual_ebitda
        ? `€${(company.annual_ebitda / 1000000).toFixed(1)}M`
        : "Not set",
      icon: TrendingUp,
      color: "text-purple-600",
    },
    {
      label: "Employees",
      value: company.employees || "Not set",
      icon: Users,
      color: "text-orange-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Stats */}
      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {stat.label}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Description */}
        {company.description && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Description
            </h3>
            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {company.description}
            </p>
          </div>
        )}

        {/* Reason for Sale */}
        {company.reason_for_sale && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Reason for Sale
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {company.reason_for_sale}
            </p>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Company Details
          </h3>
          <dl className="space-y-3">
            {company.founded_year && (
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-600 dark:text-gray-400">
                  Founded
                </dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white">
                  {company.founded_year}
                </dd>
              </div>
            )}
            {company.website && (
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-600 dark:text-gray-400">
                  Website
                </dt>
                <dd className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    Visit
                  </a>
                </dd>
              </div>
            )}
            {company.total_assets && (
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-600 dark:text-gray-400">
                  Total Assets
                </dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white">
                  €{(company.total_assets / 1000000).toFixed(1)}M
                </dd>
              </div>
            )}
            {company.total_liabilities && (
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-600 dark:text-gray-400">
                  Liabilities
                </dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white">
                  €{(company.total_liabilities / 1000000).toFixed(1)}M
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}

