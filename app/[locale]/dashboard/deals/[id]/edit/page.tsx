/**
 * Edit Deal Page
 * Edit existing deal details
 */

import { createClient } from "@/utils/supabase/server";
import { DealForm } from "@/components/deals/DealForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";

interface Props {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default async function EditDealPage({ params }: Props) {
  const { locale, id } = await params;
  const supabase = await createClient();

  // Get user context
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    redirect(`/${locale}/dashboard`);
  }

  // Fetch deal with relations
  const { data: deal, error } = await supabase
    .from("deals")
    .select(
      `
      *,
      companies(id, name),
      buyers:buyer_profiles(id, company_name)
    `,
    )
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .single();

  if (error || !deal) {
    redirect(`/${locale}/dashboard/deals`);
  }

  // Fetch all companies for the form
  const { data: companies } = await supabase
    .from("companies")
    .select("id, name")
    .eq("organization_id", profile.organization_id)
    .eq("status", "active")
    .order("name");

  // Fetch all buyers for the form
  const { data: buyers } = await supabase
    .from("buyer_profiles")
    .select("id, company_name")
    .eq("organization_id", profile.organization_id)
    .order("company_name");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/dashboard/deals/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Deal
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Edit Deal
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Update deal information and progress
        </p>
      </div>

      {/* Deal Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <DealForm
          initialData={{
            company_id: deal.company_id,
            buyer_id: deal.buyer_id || undefined,
            stage: deal.stage,
            estimated_value: deal.estimated_value || undefined,
            notes: deal.notes || "",
          }}
          companies={companies || []}
          buyers={buyers || []}
          dealId={id}
          mode="edit"
        />
      </div>
    </div>
  );
}

