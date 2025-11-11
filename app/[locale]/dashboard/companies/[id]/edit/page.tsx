/**
 * Edit Company Page
 * Edit existing company details
 */

import { createClient } from "@/utils/supabase/server";
import { CompanyForm } from "@/components/companies/CompanyForm";
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

export default async function EditCompanyPage({ params }: Props) {
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

  // Fetch company with financials
  const { data: company, error } = await supabase
    .from("companies")
    .select(
      `
      *,
      financials:company_financials(*)
    `,
    )
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .single();

  if (error || !company) {
    redirect(`/${locale}/dashboard/companies`);
  }

  // Get latest financials
  const latestFinancials = company.financials?.[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/dashboard/companies`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Companies
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Edit Company
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Update company information and financials
        </p>
      </div>

      {/* Company Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <CompanyForm
          initialData={{
            name: company.name || "",
            legal_name: company.legal_name || "",
            business_id: company.business_id || "",
            website: company.website || "",
            description: company.description || "",
            industry: company.industry || "",
            country: company.country || "Finland",
            city: company.city || "",
            founded_year: company.founded_year || undefined,
            employees: company.employees || undefined,
            owner_type: company.owner_type || "family_owned",
            revenue: latestFinancials?.revenue || undefined,
            ebitda: latestFinancials?.ebitda || undefined,
            asking_price: company.asking_price || undefined,
            currency: company.currency || "EUR",
          }}
          companyId={id}
          mode="edit"
        />
      </div>
    </div>
  );
}

