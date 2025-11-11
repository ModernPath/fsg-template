"use client";

/**
 * Activity Feed Component
 * Shows recent activities in the organization
 */

import { formatDistanceToNow } from "date-fns";
import {
  FileText,
  MessageSquare,
  UserPlus,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

interface Activity {
  id: string;
  activity_type: string;
  description: string | null;
  created_at: string;
  deals: {
    id: string;
    companies: {
      name: string;
    } | null;
  } | null;
}

interface ActivityFeedProps {
  activities: Activity[];
}

const activityIcons: Record<string, any> = {
  note: MessageSquare,
  document: FileText,
  stage_change: CheckCircle,
  user_added: UserPlus,
  meeting: Clock,
  default: FileText,
};

const activityColors: Record<string, string> = {
  note: "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
  document:
    "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
  stage_change:
    "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400",
  user_added:
    "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400",
  meeting: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
  default: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Activity
        </h2>
      </div>

      <div className="p-6">
        {activities.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-4">
            No recent activity
          </p>
        ) : (
          <div className="space-y-4">
            {activities.slice(0, 8).map((activity) => {
              const Icon =
                activityIcons[activity.activity_type] || activityIcons.default;
              const colorClass =
                activityColors[activity.activity_type] ||
                activityColors.default;

              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`rounded-full p-2 ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {activity.description || "Activity"}
                    </p>
                    {activity.deals?.companies && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {activity.deals.companies.name}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(activity.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

