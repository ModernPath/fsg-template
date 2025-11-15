"use client";

/**
 * New Material Generation Page
 * 
 * Wizard for creating new business materials (teasers, IMs, pitch decks)
 */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { MaterialGenerationWizard } from "@/components/materials/MaterialGenerationWizard";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NewMaterialPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'fi';
  const supabase = createClient();
  
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCompanies() {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push(`/${locale}/auth/sign-in`);
          return;
        }

        // Get user's organization
        const { data: userOrg, error: orgError } = await supabase
          .from("user_organizations")
          .select("organization_id")
          .eq("user_id", user.id)
          .eq("active", true)
          .single();

        if (orgError || !userOrg) {
          setError("Sinulla ei ole organisaatiota");
          setLoading(false);
          return;
        }

        // Get companies
        const { data: companiesData, error: companiesError } = await supabase
          .from("companies")
          .select("*")
          .eq("organization_id", userOrg.organization_id)
          .order("name");

        if (companiesError) {
          setError(companiesError.message);
        } else {
          setCompanies(companiesData || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Virhe ladattaessa yrityksiä");
      } finally {
        setLoading(false);
      }
    }

    loadCompanies();
  }, [supabase, router, locale]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            Virhe
          </h3>
          <p className="text-red-700 dark:text-red-300">{error}</p>
          <Link href={`/${locale}/dashboard/materials`} className="mt-4 inline-block">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Takaisin
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="container mx-auto py-10">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
            Ei yrityksiä
          </h3>
          <p className="text-blue-700 dark:text-blue-300 mb-4">
            Lisää ensin yritys, jotta voit luoda materiaaleja.
          </p>
          <div className="flex gap-2">
            <Link href={`/${locale}/dashboard/companies/new`}>
              <Button>
                Lisää yritys
              </Button>
            </Link>
            <Link href={`/${locale}/dashboard/materials`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Takaisin
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/dashboard/materials`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Luo uutta materiaalia
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            AI-pohjainen teaser, information memorandum tai pitch deck
          </p>
        </div>
      </div>

      {/* Material Generation Wizard */}
      <MaterialGenerationWizard
        companies={companies}
        onComplete={(jobId) => {
          // Redirect to materials page after successful start
          router.push(`/${locale}/dashboard/materials?job=${jobId}`);
        }}
        onCancel={() => {
          router.push(`/${locale}/dashboard/materials`);
        }}
      />
    </div>
  );
}
