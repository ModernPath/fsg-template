/**
 * useSellerAI Hook
 * 
 * React hook for interacting with the SellerAI agent.
 * Provides methods for:
 * - Optimizing listings
 * - Generating documents (Teaser, IM)
 * - Getting valuation suggestions
 * - Identifying target buyers
 * - Asking questions
 */

import { useState, useCallback } from "react";
import type { CompanyInfo } from "@/lib/ai/seller-agent";

interface UseSellerAIReturn {
  // Optimize listing
  optimizedListing: any | null;
  optimizeListing: (company: CompanyInfo) => Promise<void>;

  // Generate teaser
  teaser: any | null;
  generateTeaser: (company: CompanyInfo) => Promise<void>;

  // Generate IM
  im: any | null;
  generateIM: (company: CompanyInfo) => Promise<void>;

  // Valuation
  valuation: any | null;
  suggestValuation: (company: CompanyInfo) => Promise<void>;

  // Target buyers
  targetBuyers: any | null;
  identifyTargetBuyers: (company: CompanyInfo) => Promise<void>;

  // Q&A
  answer: string | null;
  askQuestion: (
    question: string,
    context?: {
      company?: CompanyInfo;
      conversationHistory?: Array<{ role: string; content: string }>;
    }
  ) => Promise<void>;

  // State
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useSellerAI(): UseSellerAIReturn {
  const [optimizedListing, setOptimizedListing] = useState<any | null>(null);
  const [teaser, setTeaser] = useState<any | null>(null);
  const [im, setIM] = useState<any | null>(null);
  const [valuation, setValuation] = useState<any | null>(null);
  const [targetBuyers, setTargetBuyers] = useState<any | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const optimizeListing = useCallback(async (company: CompanyInfo) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/seller-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "optimize",
          company,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to optimize listing");
      }

      const data = await response.json();
      setOptimizedListing(data);
    } catch (err: any) {
      setError(err.message);
      console.error("Error optimizing listing:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const generateTeaser = useCallback(async (company: CompanyInfo) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/seller-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "teaser",
          company,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate teaser");
      }

      const data = await response.json();
      setTeaser(data);
    } catch (err: any) {
      setError(err.message);
      console.error("Error generating teaser:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const generateIM = useCallback(async (company: CompanyInfo) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/seller-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "im",
          company,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate IM");
      }

      const data = await response.json();
      setIM(data);
    } catch (err: any) {
      setError(err.message);
      console.error("Error generating IM:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const suggestValuation = useCallback(async (company: CompanyInfo) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/seller-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "valuation",
          company,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get valuation");
      }

      const data = await response.json();
      setValuation(data);
    } catch (err: any) {
      setError(err.message);
      console.error("Error getting valuation:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const identifyTargetBuyers = useCallback(async (company: CompanyInfo) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/seller-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "buyers",
          company,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to identify buyers");
      }

      const data = await response.json();
      setTargetBuyers(data);
    } catch (err: any) {
      setError(err.message);
      console.error("Error identifying buyers:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const askQuestion = useCallback(
    async (
      question: string,
      context?: {
        company?: CompanyInfo;
        conversationHistory?: Array<{ role: string; content: string }>;
      }
    ) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/ai/seller-agent", {
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
    optimizedListing,
    optimizeListing,
    teaser,
    generateTeaser,
    im,
    generateIM,
    valuation,
    suggestValuation,
    targetBuyers,
    identifyTargetBuyers,
    answer,
    askQuestion,
    loading,
    error,
    clearError,
  };
}

