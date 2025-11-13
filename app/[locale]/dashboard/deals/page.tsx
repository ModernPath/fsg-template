/**
 * Deals Pipeline Page
 * Kanban board view for managing M&A deals
 */

import { createClient } from "@/utils/supabase/server";
import { DealsKanban } from "@/components/deals/DealsKanban";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function DealsPage() {
  const supabase = await createClient();

  // Get user context
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

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

  console.log('🤝 [Deals] User:', user.id);
  console.log('🤝 [Deals] Organization:', organizationId);

  if (!organizationId) {
    return (
      <div className="p-12 text-center">
        <p className="text-red-600">No organization found. Please contact support.</p>
      </div>
    );
  }

  // Fetch all deals with related data
  const { data: deals, error } = await supabase
    .from("deals")
    .select(
      `
      *,
      companies(id, name, industry, logo_url),
      buyer:profiles!deals_buyer_id_fkey(id, full_name, email),
      deal_stages(
        id,
        stage,
        entered_at,
        notes
      )
    `,
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  console.log('🤝 [Deals] Found:', deals?.length || 0, 'deals');
  if (error) {
    console.error("🤝 [Deals] Error:", error);
    return <div className="p-12 text-center text-red-600">Error loading deals: {error.message}</div>;
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
        <Link href="/dashboard/deals/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Deal
          </Button>
        </Link>
      </div>

      {/* Kanban Board */}
      <DealsKanban deals={deals || []} stages={stages} />
    </div>
  );
}

