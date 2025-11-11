"use client";

import Link from "next/link";
import { ArrowLeft, Pencil, Share2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CompanyHeader({ company, locale }: any) {
  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800",
    active: "bg-green-100 text-green-800",
    under_review: "bg-yellow-100 text-yellow-800",
    sold: "bg-blue-100 text-blue-800",
    archived: "bg-red-100 text-red-800",
  };

  return (
    <div>
      <Link
        href={`/${locale}/dashboard/companies`}
        className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Companies
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {company.name}
              </h1>
              <div className="mt-2 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                {company.business_id && <span>{company.business_id}</span>}
                <span>
                  {company.city && `${company.city}, `}
                  {company.country}
                </span>
                {company.industry && <span>{company.industry}</span>}
              </div>
              <div className="mt-2">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    statusColors[company.status] || statusColors.draft
                  }`}
                >
                  {company.status.replace("_", " ")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Link href={`/${locale}/dashboard/companies/${company.id}/edit`}>
              <Button size="sm">
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

