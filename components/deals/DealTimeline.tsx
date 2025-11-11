"use client";

/**
 * Deal Timeline Component
 * Shows progression through deal stages
 */

import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DealTimelineProps {
  currentStage: string;
  stages: Array<{
    id: string;
    stage: string;
    entered_at: string;
    exited_at?: string;
    notes?: string;
  }>;
}

const stageOrder = [
  "lead",
  "qualification",
  "nda_signed",
  "evaluation",
  "loi_submitted",
  "due_diligence",
  "negotiation",
  "closed_won",
];

const stageLabels: Record<string, string> = {
  lead: "Lead",
  qualification: "Qualification",
  nda_signed: "NDA Signed",
  evaluation: "Evaluation",
  loi_submitted: "LOI Submitted",
  due_diligence: "Due Diligence",
  negotiation: "Negotiation",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
};

export function DealTimeline({ currentStage, stages }: DealTimelineProps) {
  const currentStageIndex = stageOrder.indexOf(currentStage);
  const completedStages = new Set(stages.map((s) => s.stage));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Deal Progress
      </h3>

      <div className="relative">
        {/* Progress Line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
        <div
          className="absolute left-4 top-0 w-0.5 bg-blue-600 transition-all duration-500"
          style={{
            height: `${(currentStageIndex / (stageOrder.length - 1)) * 100}%`,
          }}
        />

        {/* Stages */}
        <div className="space-y-6">
          {stageOrder.map((stage, index) => {
            const isCompleted = completedStages.has(stage);
            const isCurrent = stage === currentStage;
            const stageData = stages.find((s) => s.stage === stage);

            return (
              <div key={stage} className="relative flex items-start gap-4">
                {/* Stage Indicator */}
                <div className="relative z-10 flex-shrink-0">
                  {isCompleted || isCurrent ? (
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      {isCompleted && !isCurrent ? (
                        <Check className="w-5 h-5 text-white" />
                      ) : (
                        <Circle className="w-5 h-5 text-white fill-current" />
                      )}
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <Circle className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Stage Content */}
                <div className="flex-1 pb-6">
                  <div className="flex items-center justify-between">
                    <h4
                      className={cn(
                        "font-medium",
                        isCurrent
                          ? "text-blue-600 dark:text-blue-400"
                          : isCompleted
                            ? "text-gray-900 dark:text-white"
                            : "text-gray-500 dark:text-gray-400",
                      )}
                    >
                      {stageLabels[stage] || stage}
                    </h4>
                    {stageData && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(stageData.entered_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {stageData?.notes && (
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {stageData.notes}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

