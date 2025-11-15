"use client";

/**
 * Company Settings Page
 * 
 * Configure company-specific settings including:
 * - Gamma presentation design
 * - Enrichment module selection
 * - General company settings
 */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GammaConfigurationPanel } from "@/components/materials/GammaConfigurationPanel";
import { EnrichmentConfigurationPanel } from "@/components/materials/EnrichmentConfigurationPanel";
import Link from "next/link";
import { ArrowLeft, Loader2, Settings, Palette, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CompanySettingsPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "en";
  const id = params?.id as string;
  const supabase = createClient();
  const { toast } = useToast();

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
            user_organizations(
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

        // Check permissions
        if (!["seller", "broker", "admin", "partner"].includes(profile.role.toLowerCase())) {
          setError("You don't have permission to access settings");
          return;
        }

        // Fetch company
        const { data: companyData, error: companyError } = await supabase
          .from("companies")
          .select("*")
          .eq("id", id)
          .eq("organization_id", organizationId)
          .single();

        if (companyError || !companyData) {
          setError("Company not found");
          return;
        }

        setCompany(companyData);

      } catch (err: any) {
        console.error("Error fetching company:", err);
        setError(err.message || "Error loading company");
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
            {error || "Company not found"}
          </p>
        </div>
        <Link href={`/${locale}/dashboard/companies`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Companies
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/dashboard/companies`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Companies
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Settings className="w-8 h-8" />
              Company Settings
            </h1>
            <p className="text-muted-foreground mt-1">{company.name}</p>
          </div>
        </div>
        <Link href={`/${locale}/dashboard/companies/${id}/edit`}>
          <Button variant="outline">
            Edit Company Details
          </Button>
        </Link>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">
            <Settings className="w-4 h-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="gamma">
            <Palette className="w-4 h-4 mr-2" />
            Presentation Design
          </TabsTrigger>
          <TabsTrigger value="enrichment">
            <Database className="w-4 h-4 mr-2" />
            Data Modules
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Basic company information and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Company Name</div>
                  <div className="text-lg font-medium">{company.name}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Industry</div>
                  <div className="text-lg font-medium">{company.industry || "—"}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Business ID</div>
                  <div className="text-lg font-medium">{company.business_id || "—"}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Location</div>
                  <div className="text-lg font-medium">
                    {company.city && company.country 
                      ? `${company.city}, ${company.country}`
                      : company.country || company.city || "—"
                    }
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Company Details</div>
                    <div className="text-sm text-muted-foreground">
                      Edit basic company information
                    </div>
                  </div>
                  <Link href={`/${locale}/dashboard/companies/${id}/edit`}>
                    <Button>Edit Details</Button>
                  </Link>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Materials & Documents</div>
                    <div className="text-sm text-muted-foreground">
                      View and manage company materials
                    </div>
                  </div>
                  <Link href={`/${locale}/dashboard/materials?company=${id}`}>
                    <Button variant="outline">View Materials</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gamma Configuration */}
        <TabsContent value="gamma">
          <GammaConfigurationPanel
            companyId={id}
            initialConfig={company.gamma_config}
            onSave={(config) => {
              toast({
                title: "Settings saved",
                description: "Gamma presentation design has been updated",
              });
            }}
          />
        </TabsContent>

        {/* Enrichment Configuration */}
        <TabsContent value="enrichment">
          <EnrichmentConfigurationPanel
            companyId={id}
            initialSelection={company.enrichment_config?.modules}
            onSave={(modules) => {
              toast({
                title: "Settings saved",
                description: `${modules.length} enrichment modules selected`,
              });
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

