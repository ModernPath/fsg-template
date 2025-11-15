"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Settings } from "lucide-react";
import Link from "next/link";

export default function CompaniesPage() {
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
          .order("created_at", { ascending: false });

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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Yritykset
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Hallitse yrityksiä ja kauppoja
          </p>
        </div>
        <Link href={`/${locale}/dashboard/companies/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Lisää yritys
          </Button>
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">
            Virhe: {error}
          </p>
        </div>
      )}

      {/* Companies List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Löydettiin {companies.length} yritystä
          </p>
          
          {companies.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Ei yrityksiä
              </p>
              <Link href={`/${locale}/dashboard/companies/new`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Lisää ensimmäinen yritys
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {companies.map((company) => (
                <div
                  key={company.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-primary-500 transition-colors"
                >
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {company.name}
                  </h3>
                  {company.industry && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {company.industry}
                    </p>
                  )}
                  {company.location && (
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                      📍 {company.location}
                    </p>
                  )}
                  <div className="mt-4 flex gap-2">
                    <Link href={`/${locale}/dashboard/companies/${company.id}`}>
                      <Button variant="outline" size="sm">
                        Näytä tiedot
                      </Button>
                    </Link>
                    <Link href={`/${locale}/dashboard/companies/${company.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        Muokkaa
                      </Button>
                    </Link>
                    <Link href={`/${locale}/dashboard/companies/${company.id}/settings`}>
                      <Button variant="ghost" size="sm">
                        <Settings className="w-4 h-4 mr-1" />
                        Asetukset
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
