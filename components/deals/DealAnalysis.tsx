"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import { useBrokerAI } from "@/hooks/useBrokerAI";
import { useToast } from "@/components/ui/use-toast";
import type { DealInfo } from "@/lib/ai/broker-agent";

interface DealAnalysisProps {
  deal: {
    id: string;
    company: {
      id: string;
      name: string;
      industry: string;
      revenue?: number;
      ebitda?: number;
      employees?: number;
      location?: string;
    };
    buyer?: {
      id: string;
      name: string;
      interests: string[];
      budget?: { min: number; max: number };
    };
    currentOffer?: number;
    stage: string;
  };
}

export function DealAnalysis({ deal }: DealAnalysisProps) {
  const { toast } = useToast();
  const {
    prediction,
    predictDealOutcome,
    negotiationInsights,
    getNegotiationInsights,
    workflowRecommendations,
    getWorkflowRecommendations,
    loading,
    error,
  } = useBrokerAI();

  const [activeTab, setActiveTab] = useState<
    "prediction" | "negotiation" | "workflow"
  >("prediction");

  const handleAnalyzeDeal = async () => {
    const dealInfo: DealInfo = {
      company: {
        id: deal.company.id,
        name: deal.company.name,
        industry: deal.company.industry,
        annual_revenue: deal.company.revenue,
        annual_profit: deal.company.ebitda,
        employees: deal.company.employees,
        location: deal.company.location || "Unknown",
      },
      buyer: deal.buyer
        ? {
            id: deal.buyer.id,
            name: deal.buyer.name,
            interests: deal.buyer.interests,
            budget: deal.buyer.budget,
          }
        : undefined,
      stage: deal.stage,
      timeline: {
        start_date: new Date().toISOString().split("T")[0],
      },
    };

    try {
      switch (activeTab) {
        case "prediction":
          await predictDealOutcome(dealInfo);
          break;
        case "negotiation":
          await getNegotiationInsights(dealInfo, deal.currentOffer);
          break;
        case "workflow":
          await getWorkflowRecommendations(dealInfo);
          break;
      }

      toast({
        title: "✨ Analysis Complete",
        description: "AI has generated insights for your deal",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: error || "Failed to analyze deal",
        variant: "destructive",
      });
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 75) return "text-green-600";
    if (probability >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getProbabilityBadge = (probability: number) => {
    if (probability >= 75)
      return <Badge className="bg-green-100 text-green-800">High</Badge>;
    if (probability >= 50)
      return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
    return <Badge className="bg-red-100 text-red-800">Low</Badge>;
  };

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI Deal Analysis
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Get intelligent insights to close this deal faster
            </p>
          </div>
        </div>

        <Button
          onClick={handleAnalyzeDeal}
          disabled={loading}
          className="bg-gradient-to-r from-purple-600 to-blue-600"
        >
          {loading ? (
            <>
              <Sparkles className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Analyze Deal
            </>
          )}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === "prediction" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("prediction")}
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Prediction
        </Button>
        <Button
          variant={activeTab === "negotiation" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("negotiation")}
        >
          <Lightbulb className="w-4 h-4 mr-2" />
          Negotiation
        </Button>
        <Button
          variant={activeTab === "workflow" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("workflow")}
        >
          <Clock className="w-4 h-4 mr-2" />
          Workflow
        </Button>
      </div>

      <Separator className="mb-6" />

      {/* Content */}
      <div className="space-y-6">
        {activeTab === "prediction" && prediction && (
          <>
            {/* Success Probability */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Success Probability
                </span>
                {getProbabilityBadge(prediction.success_probability)}
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    prediction.success_probability >= 75
                      ? "bg-green-600"
                      : prediction.success_probability >= 50
                        ? "bg-yellow-600"
                        : "bg-red-600"
                  }`}
                  style={{ width: `${prediction.success_probability}%` }}
                />
              </div>
              <p
                className={`text-2xl font-bold ${getProbabilityColor(prediction.success_probability)}`}
              >
                {prediction.success_probability}%
              </p>
            </div>

            {/* Timeline */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-gray-900 dark:text-white">
                  Expected Timeline
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {prediction.estimated_timeline}
              </p>
            </div>

            {/* Key Factors */}
            {prediction.key_factors && prediction.key_factors.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Key Success Factors
                </h4>
                <div className="space-y-2">
                  {prediction.key_factors.map(
                    (factor: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {factor}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Risk Factors */}
            {prediction.risk_factors && prediction.risk_factors.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Risk Factors
                </h4>
                <div className="space-y-2">
                  {prediction.risk_factors.map(
                    (risk: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {risk}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {prediction.recommendations &&
              prediction.recommendations.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Recommendations
                  </h4>
                  <div className="space-y-2">
                    {prediction.recommendations.map(
                      (rec: string, index: number) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg"
                        >
                          <Lightbulb className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {rec}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
          </>
        )}

        {activeTab === "negotiation" && negotiationInsights && (
          <>
            {/* Valuation Range */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Fair Valuation Range
              </h4>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Low
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    €{negotiationInsights.fair_valuation_range?.low.toLocaleString()}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Mid
                  </p>
                  <p className="text-lg font-bold text-blue-600">
                    €{negotiationInsights.fair_valuation_range?.mid.toLocaleString()}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    High
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    €{negotiationInsights.fair_valuation_range?.high.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Negotiation Points */}
            {negotiationInsights.negotiation_points &&
              negotiationInsights.negotiation_points.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Negotiation Points
                  </h4>
                  <div className="space-y-2">
                    {negotiationInsights.negotiation_points.map(
                      (point: string, index: number) => (
                        <div key={index} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {point}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

            {/* Compromises */}
            {negotiationInsights.potential_compromises &&
              negotiationInsights.potential_compromises.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Potential Compromises
                  </h4>
                  <div className="space-y-2">
                    {negotiationInsights.potential_compromises.map(
                      (compromise: string, index: number) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg"
                        >
                          <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {compromise}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
          </>
        )}

        {activeTab === "workflow" && workflowRecommendations && (
          <>
            {/* Next Steps */}
            {workflowRecommendations.next_steps &&
              workflowRecommendations.next_steps.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Next Steps
                  </h4>
                  <div className="space-y-3">
                    {workflowRecommendations.next_steps.map(
                      (
                        step: { action: string; priority: string },
                        index: number
                      ) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-600">
                              {index + 1}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {step.action}
                            </p>
                            <Badge
                              variant={
                                step.priority === "high"
                                  ? "destructive"
                                  : step.priority === "medium"
                                    ? "default"
                                    : "secondary"
                              }
                              className="mt-2"
                            >
                              {step.priority} priority
                            </Badge>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

            {/* Documents Required */}
            {workflowRecommendations.documents_required &&
              workflowRecommendations.documents_required.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Documents Required
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {workflowRecommendations.documents_required.map(
                      (doc: string, index: number) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg"
                        >
                          <CheckCircle2 className="w-4 h-4 text-purple-600" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {doc}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

            {/* Automation Opportunities */}
            {workflowRecommendations.automation_opportunities &&
              workflowRecommendations.automation_opportunities.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Automation Opportunities
                  </h4>
                  <div className="space-y-2">
                    {workflowRecommendations.automation_opportunities.map(
                      (opportunity: string, index: number) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
                        >
                          <Sparkles className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {opportunity}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
          </>
        )}

        {/* Empty State */}
        {((activeTab === "prediction" && !prediction) ||
          (activeTab === "negotiation" && !negotiationInsights) ||
          (activeTab === "workflow" && !workflowRecommendations)) && (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Click "Analyze Deal" to generate AI insights
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

