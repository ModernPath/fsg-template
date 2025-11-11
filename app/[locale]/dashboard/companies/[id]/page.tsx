/**
 * Company Detail Page
 * View detailed information about a company
 */

import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import { CompanyHeader } from "@/components/companies/CompanyHeader";
import { CompanyOverview } from "@/components/companies/CompanyOverview";
import { CompanyFinancials } from "@/components/companies/CompanyFinancials";
import { CompanyAssets } from "@/components/companies/CompanyAssets";
import { CompanyDeals } from "@/components/companies/CompanyDeals";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const supabase = await createClient();

  // Get user context
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/sign-in`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    redirect(`/${locale}/dashboard`);
  }

  // Fetch company data
  const { data: company, error } = await supabase
    .from("companies")
    .select(
      `
      *,
      company_financials(*),
      company_assets(*),
      listings(*),
      deals(*, buyer:buyer_id(email, full_name))
    `,
    )
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .single();

  if (error || !company) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Company Header */}
      <CompanyHeader company={company} locale={locale} />

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financials">
            Financials ({company.company_financials?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="assets">
            Assets ({company.company_assets?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="deals">
            Deals ({company.deals?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <CompanyOverview company={company} />
        </TabsContent>

        <TabsContent value="financials">
          <CompanyFinancials
            companyId={company.id}
            financials={company.company_financials || []}
          />
        </TabsContent>

        <TabsContent value="assets">
          <CompanyAssets
            companyId={company.id}
            assets={company.company_assets || []}
          />
        </TabsContent>

        <TabsContent value="deals">
          <CompanyDeals companyId={company.id} deals={company.deals || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

