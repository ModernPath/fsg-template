"use client";

/**
 * Deal Activities Component
 * Shows activity feed for a deal
 */

import { MessageSquare, Mail, Phone, FileText, Calendar } from "lucide-react";

interface DealActivitiesProps {
  activities: Array<{
    id: string;
    activity_type: string;
    description: string;
    created_at: string;
    created_by: string;
    metadata?: any;
  }>;
  dealId: string;
}

const activityIcons: Record<string, React.ComponentType<any>> = {
  note: MessageSquare,
  email: Mail,
  call: Phone,
  document: FileText,
  meeting: Calendar,
};

export function DealActivities({ activities, dealId }: DealActivitiesProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Activity Feed
      </h3>

      {activities.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
          No activities yet
        </p>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon =
              activityIcons[activity.activity_type] || MessageSquare;

            return (
              <div
                key={activity.id}
                className="flex gap-4 pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                    <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(activity.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

