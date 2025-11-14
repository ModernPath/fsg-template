"use client";

/**
 * Deals Pipeline Page
 * Kanban board view for managing M&A deals
 */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { DealsKanban } from "@/components/deals/DealsKanban";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import Link from "next/link";

export default function DealsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDeals() {
      try {
        setLoading(true);
        setError(null);

        // Get user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("Please log in");
          return;
        }

        console.log('🤝 [Deals] User:', user.id);

        // Get profile and organization
        const { data: profile } = await supabase
          .from("profiles")
          .select(`
            id,
            role,
            user_organizations!inner(
              organization_id,
              role
            )
          `)
          .eq("id", user.id)
          .single();

        const organizationId = profile?.user_organizations?.[0]?.organization_id;
        console.log('🤝 [Deals] Organization:', organizationId);

        if (!organizationId) {
          setError("No organization found");
          return;
        }

        // Fetch all deals with related data
        const { data: dealsData, error: dealsError } = await supabase
          .from("deals")
          .select(`
            *,
            companies(id, name, industry),
            buyer:profiles!deals_buyer_id_fkey(id, full_name, email),
            deal_stages(
              id,
              stage,
              entered_at,
              notes
            )
          `)
          .eq("organization_id", organizationId)
          .order("created_at", { ascending: false });

        console.log('🤝 [Deals] Found:', dealsData?.length || 0, 'deals');
        console.log('🤝 [Deals] Data:', dealsData);

        if (dealsError) {
          console.error("🤝 [Deals] Error:", dealsError);
          setError(dealsError.message);
          return;
        }

        setDeals(dealsData || []);
      } catch (err: any) {
        console.error("🤝 [Deals] Unexpected error:", err);
        setError(err.message || "Failed to load deals");
      } finally {
        setLoading(false);
      }
    }

    fetchDeals();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  // Define deal stages
  const stages = [
    { id: "lead", name: "Lead", color: "gray" },
    { id: "qualification", name: "Qualification", color: "yellow" },
    { id: "nda_signed", name: "NDA Signed", color: "blue" },
    { id: "evaluation", name: "Evaluation", color: "purple" },
    { id: "loi_submitted", name: "LOI Submitted", color: "indigo" },
    { id: "due_diligence", name: "Due Diligence", color: "cyan" },
    { id: "negotiation", name: "Negotiation", color: "orange" },
    { id: "closed_won", name: "Closed Won", color: "green" },
    { id: "closed_lost", name: "Closed Lost", color: "red" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Deals Pipeline
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Manage your M&A deal pipeline
          </p>
        </div>
        <Link href={`/${locale}/dashboard/deals/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Deal
          </Button>
        </Link>
      </div>

      {/* Kanban Board */}
      <DealsKanban deals={deals} stages={stages} />
    </div>
  );
}
