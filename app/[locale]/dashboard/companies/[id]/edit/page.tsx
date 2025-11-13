"use client";

/**
 * Edit Company Page
 * Edit existing company details
 */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { CompanyForm } from "@/components/companies/CompanyForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function EditCompanyPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "en";
  const id = params?.id as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCompany() {
      try {
        setLoading(true);
        setError(null);

        // Get user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push(`/${locale}/auth/sign-in`);
          return;
        }

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

        if (!organizationId) {
          router.push(`/${locale}/dashboard`);
          return;
        }

        // Fetch company with financials
        const { data: companyData, error: companyError } = await supabase
          .from("companies")
          .select(`*`)
          .eq("id", id)
          .eq("organization_id", organizationId)
          .maybeSingle();

        if (companyError || !companyData) {
          setError("Yritystä ei löytynyt");
          return;
        }

        setCompany(companyData);

      } catch (err: any) {
        console.error("Error fetching company:", err);
        setError(err.message || "Virhe yrityksen lataamisessa");
      } finally {
        setLoading(false);
      }
    }

    fetchCompany();
  }, [id, locale, router, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">
            {error || "Yritystä ei löytynyt"}
          </p>
        </div>
        <Link href={`/${locale}/dashboard/companies`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Takaisin yrityksiin
          </Button>
        </Link>
      </div>
    );
  }

  const latestFinancials = company.financials?.[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/dashboard/companies`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Takaisin yrityksiin
          </Button>
        </Link>
      </div>

      {/* Company Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Muokkaa yritystä
        </h1>

        <CompanyForm
          mode="edit"
          companyId={id}
          initialData={{
            name: company.name,
            legal_name: company.legal_name,
            business_id: company.business_id,
            website: company.website,
            description: company.description,
            industry: company.industry,
            country: company.country,
            city: company.city,
            founded_year: company.founded_year,
            employees: company.employees_count,
            owner_type: company.legal_structure,
            revenue: latestFinancials?.revenue,
            ebitda: latestFinancials?.ebitda,
            asking_price: company.asking_price,
            currency: company.currency,
          }}
        />
      </div>
    </div>
  );
}
