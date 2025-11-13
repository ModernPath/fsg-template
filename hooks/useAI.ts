import { useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import type { UserRole } from "@/types/roles";

interface AIMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIContext {
  role?: UserRole;
  resourceType?: string;
  resourceId?: string;
}

interface UseAIReturn {
  messages: AIMessage[];
  loading: boolean;
  error: string | null;
  conversationId: string | null;
  sendMessage: (message: string, context?: AIContext) => Promise<void>;
  generateContent: (
    type: string,
    resourceType: string,
    resourceId: string,
    params?: Record<string, any>
  ) => Promise<string | null>;
  clearConversation: () => void;
}

/**
 * Hook for AI interactions
 */
export function useAI(): UseAIReturn {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  /**
   * Send a chat message to AI
   */
  const sendMessage = useCallback(
    async (message: string, context?: AIContext) => {
      setLoading(true);
      setError(null);

      // Add user message to UI immediately
      const userMessage: AIMessage = {
        role: "user",
        content: message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      try {
        // Get current session for auth token
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error("Kirjaudu sisään käyttääksesi AI-chatia");
        }

        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            message,
            context,
            conversationId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(errorData.error || `AI request failed with status ${response.status}`);
        }

        const result = await response.json();

        // Add AI response to UI
        const aiMessage: AIMessage = {
          role: "assistant",
          content: result.response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);

        // Update conversation ID
        if (result.conversationId) {
          setConversationId(result.conversationId);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        console.error("AI chat error:", err);
      } finally {
        setLoading(false);
      }
    },
    [conversationId]
  );

  /**
   * Generate specific content (teaser, IM, CIM, etc.)
   */
  const generateContent = useCallback(
    async (
      type: string,
      resourceType: string,
      resourceId: string,
      params?: Record<string, any>
    ): Promise<string | null> => {
      setLoading(true);
      setError(null);

      try {
        // Get current session for auth token
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error("Kirjaudu sisään käyttääksesi AI-palveluja");
        }

        const response = await fetch("/api/ai/generate-content", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            type,
            resourceType,
            resourceId,
            params,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate content");
        }

        const result = await response.json();
        return result.content;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        console.error("Content generation error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Clear conversation history
   */
  const clearConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
  }, []);

  return {
    messages,
    loading,
    error,
    conversationId,
    sendMessage,
    generateContent,
    clearConversation,
  };
}

