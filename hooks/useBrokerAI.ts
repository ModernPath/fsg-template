/**
 * useBrokerAI Hook
 * 
 * React hook for interacting with the BrokerAI agent.
 * Provides methods for:
 * - Matching buyers with companies
 * - Predicting deal outcomes
 * - Generating communication templates
 * - Negotiation insights
 * - Workflow recommendations
 * - Asking questions
 */

import { useState, useCallback } from "react";
import type { BuyerInfo, CompanyListing, DealInfo } from "@/lib/ai/broker-agent";

interface UseBrokerAIReturn {
  // Matching
  matches: any | null;
  matchBuyersWithCompanies: (
    buyers: BuyerInfo[],
    companies: CompanyListing[]
  ) => Promise<void>;

  // Deal prediction
  prediction: any | null;
  predictDealOutcome: (deal: DealInfo) => Promise<void>;

  // Communication
  communicationTemplate: any | null;
  generateCommunicationTemplate: (
    templateType: string,
    context?: any
  ) => Promise<void>;

  // Negotiation
  negotiationInsights: any | null;
  getNegotiationInsights: (
    deal: DealInfo,
    currentOffer?: number
  ) => Promise<void>;

  // Workflow
  workflowRecommendations: any | null;
  getWorkflowRecommendations: (deal: DealInfo) => Promise<void>;

  // Q&A
  answer: string | null;
  askQuestion: (question: string, context?: any) => Promise<void>;

  // State
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useBrokerAI(): UseBrokerAIReturn {
  const [matches, setMatches] = useState<any | null>(null);
  const [prediction, setPrediction] = useState<any | null>(null);
  const [communicationTemplate, setCommunicationTemplate] = useState<any | null>(null);
  const [negotiationInsights, setNegotiationInsights] = useState<any | null>(null);
  const [workflowRecommendations, setWorkflowRecommendations] = useState<any | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const matchBuyersWithCompanies = useCallback(
    async (buyers: BuyerInfo[], companies: CompanyListing[]) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/ai/broker-agent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "match",
            buyers,
            companies,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to match buyers with companies");
        }

        const data = await response.json();
        setMatches(data);
      } catch (err: any) {
        setError(err.message);
        console.error("Error matching buyers with companies:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const predictDealOutcome = useCallback(async (deal: DealInfo) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/broker-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "predict",
          deal,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to predict deal outcome");
      }

      const data = await response.json();
      setPrediction(data);
    } catch (err: any) {
      setError(err.message);
      console.error("Error predicting deal outcome:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const generateCommunicationTemplate = useCallback(
    async (templateType: string, context?: any) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/ai/broker-agent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "communicate",
            templateType,
            context,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to generate communication template");
        }

        const data = await response.json();
        setCommunicationTemplate(data);
      } catch (err: any) {
        setError(err.message);
        console.error("Error generating communication template:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getNegotiationInsights = useCallback(
    async (deal: DealInfo, currentOffer?: number) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/ai/broker-agent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "negotiate",
            deal,
            currentOffer,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to get negotiation insights");
        }

        const data = await response.json();
        setNegotiationInsights(data);
      } catch (err: any) {
        setError(err.message);
        console.error("Error getting negotiation insights:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getWorkflowRecommendations = useCallback(async (deal: DealInfo) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/broker-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "workflow",
          deal,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get workflow recommendations");
      }

      const data = await response.json();
      setWorkflowRecommendations(data);
    } catch (err: any) {
      setError(err.message);
      console.error("Error getting workflow recommendations:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const askQuestion = useCallback(async (question: string, context?: any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/broker-agent", {
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
  }, []);

  return {
    matches,
    matchBuyersWithCompanies,
    prediction,
    predictDealOutcome,
    communicationTemplate,
    generateCommunicationTemplate,
    negotiationInsights,
    getNegotiationInsights,
    workflowRecommendations,
    getWorkflowRecommendations,
    answer,
    askQuestion,
    loading,
    error,
    clearError,
  };
}

