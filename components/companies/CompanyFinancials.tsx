"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

export function CompanyFinancials({ companyId, financials }: any) {
  if (financials.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          No financial records yet
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-700/50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              Year
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              Period
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              Revenue
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              EBITDA
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              Net Profit
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              Audited
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {financials.map((record: any) => (
            <tr key={record.id}>
              <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                {record.year}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 capitalize">
                {record.period}
              </td>
              <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">
                {record.revenue
                  ? `€${(record.revenue / 1000000).toFixed(2)}M`
                  : "-"}
              </td>
              <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">
                {record.ebitda
                  ? `€${(record.ebitda / 1000000).toFixed(2)}M`
                  : "-"}
              </td>
              <td className="px-6 py-4 text-sm text-right">
                {record.net_profit ? (
                  <span
                    className={
                      record.net_profit > 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }
                  >
                    €{(record.net_profit / 1000000).toFixed(2)}M
                  </span>
                ) : (
                  "-"
                )}
              </td>
              <td className="px-6 py-4 text-center">
                {record.is_audited ? (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    Yes
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                    No
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

