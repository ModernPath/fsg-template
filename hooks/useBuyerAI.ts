/**
 * useBuyerAI Hook
 * 
 * React hook for interacting with the BuyerAI agent.
 * Provides methods for:
 * - Getting company recommendations
 * - Analyzing deals
 * - Comparing companies
 * - Asking questions
 */

import { useState, useCallback } from "react";
import type {
  BuyerProfile,
  CompanyData,
  DealData,
} from "@/lib/ai/buyer-agent";

interface UseBuyerAIReturn {
  // Recommendations
  recommendations: any | null;
  getRecommendations: (
    buyerProfile: BuyerProfile,
    availableCompanies: CompanyData[],
    limit?: number
  ) => Promise<void>;

  // Deal analysis
  dealAnalysis: any | null;
  analyzeDeal: (deal: DealData, buyerProfile: BuyerProfile) => Promise<void>;

  // Company comparison
  comparison: any | null;
  compareCompanies: (
    companies: CompanyData[],
    criteriaWeights?: {
      financials?: number;
      growth?: number;
      location?: number;
      industry?: number;
    }
  ) => Promise<void>;

  // Q&A
  answer: string | null;
  askQuestion: (
    question: string,
    context?: {
      buyerProfile?: BuyerProfile;
      company?: CompanyData;
      deal?: DealData;
      conversationHistory?: Array<{ role: string; content: string }>;
    }
  ) => Promise<void>;

  // State
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useBuyerAI(): UseBuyerAIReturn {
  const [recommendations, setRecommendations] = useState<any | null>(null);
  const [dealAnalysis, setDealAnalysis] = useState<any | null>(null);
  const [comparison, setComparison] = useState<any | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getRecommendations = useCallback(
    async (
      buyerProfile: BuyerProfile,
      availableCompanies: CompanyData[],
      limit: number = 5
    ) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/ai/buyer-agent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "recommend",
            buyerProfile,
            availableCompanies,
            limit,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to get recommendations");
        }

        const data = await response.json();
        setRecommendations(data);
      } catch (err: any) {
        setError(err.message);
        console.error("Error getting recommendations:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const analyzeDeal = useCallback(
    async (deal: DealData, buyerProfile: BuyerProfile) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/ai/buyer-agent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "analyze",
            deal,
            buyerProfile,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to analyze deal");
        }

        const data = await response.json();
        setDealAnalysis(data);
      } catch (err: any) {
        setError(err.message);
        console.error("Error analyzing deal:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const compareCompanies = useCallback(
    async (
      companies: CompanyData[],
      criteriaWeights?: {
        financials?: number;
        growth?: number;
        location?: number;
        industry?: number;
      }
    ) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/ai/buyer-agent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "compare",
            companies,
            criteriaWeights,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to compare companies");
        }

        const data = await response.json();
        setComparison(data);
      } catch (err: any) {
        setError(err.message);
        console.error("Error comparing companies:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const askQuestion = useCallback(
    async (
      question: string,
      context?: {
        buyerProfile?: BuyerProfile;
        company?: CompanyData;
        deal?: DealData;
        conversationHistory?: Array<{ role: string; content: string }>;
      }
    ) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/ai/buyer-agent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "ask",
            question,
            context,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to get answer");
        }

        const data = await response.json();
        setAnswer(data.answer);
      } catch (err: any) {
        setError(err.message);
        console.error("Error asking question:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    recommendations,
    getRecommendations,
    dealAnalysis,
    analyzeDeal,
    comparison,
    compareCompanies,
    answer,
    askQuestion,
    loading,
    error,
    clearError,
  };
}

