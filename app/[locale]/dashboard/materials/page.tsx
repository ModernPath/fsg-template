"use client";

/**
 * Materials Page
 * AI-generated sale materials (Teasers, IMs, Pitch Decks)
 */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  FileText,
  Presentation,
  Download,
  Eye,
  Sparkles,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function MaterialsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMaterials() {
      try {
        setLoading(true);
        setError(null);

        // Get user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("Please log in");
          return;
        }

        console.log('📄 [Materials] User:', user.id);

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
        console.log('📄 [Materials] Organization:', organizationId);

        if (!organizationId) {
          setError("No organization found");
          return;
        }

        // Fetch materials (stored as company_assets with specific document types)
        const { data: materialsData, error: materialsError } = await supabase
          .from("company_assets")
          .select(`
            *,
            companies(id, name)
          `)
          .eq("companies.organization_id", organizationId)
          .in("document_type", ["teaser", "im", "pitch_deck", "valuation"])
          .order("created_at", { ascending: false });

        console.log('📄 [Materials] Found:', materialsData?.length || 0, 'materials');
        console.log('📄 [Materials] Data:', materialsData);

        if (materialsError) {
          console.error("📄 [Materials] Error:", materialsError);
          setError(materialsError.message);
          return;
        }

        setMaterials(materialsData || []);
      } catch (err: any) {
        console.error("📄 [Materials] Unexpected error:", err);
        setError(err.message || "Failed to load materials");
      } finally {
        setLoading(false);
      }
    }

    fetchMaterials();
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

  const materialTypes = [
    {
      type: "teaser",
      name: "Teasers",
      icon: FileText,
      description: "2-page executive summaries",
      color: "blue",
    },
    {
      type: "im",
      name: "Information Memorandums",
      icon: FileText,
      description: "20-50 page detailed documents",
      color: "purple",
    },
    {
      type: "pitch_deck",
      name: "Pitch Decks",
      icon: Presentation,
      description: "Investor presentations",
      color: "green",
    },
    {
      type: "valuation_report",
      name: "Valuation Reports",
      icon: FileText,
      description: "AI-assisted valuations",
      color: "orange",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-yellow-500" />
            AI Materials
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            AI-generated sale materials for your companies
          </p>
        </div>
        <Link href={`/${locale}/dashboard/materials/generate`}>
          <Button>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Materials
          </Button>
        </Link>
      </div>

      {/* Material Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {materialTypes.map((type) => {
          const Icon = type.icon;
          const count =
            materials.filter((m) => m.asset_type === type.type).length || 0;

          return (
            <div
              key={type.type}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 bg-${type.color}-100 dark:bg-${type.color}-900/20 rounded-lg flex items-center justify-center`}
                >
                  <Icon
                    className={`w-6 h-6 text-${type.color}-600 dark:text-${type.color}-400`}
                  />
                </div>
                <Badge variant="secondary">{count}</Badge>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {type.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {type.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Materials List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Recent Materials
          </h2>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {materials && materials.length > 0 ? (
            materials.map((material: any) => {
              const typeInfo = materialTypes.find(
                (t) => t.type === material.asset_type,
              );
              const Icon = typeInfo?.icon || FileText;

              return (
                <div
                  key={material.id}
                  className="p-6 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {material.companies?.logo_url ? (
                        <img
                          src={material.companies.logo_url}
                          alt={material.companies.name}
                          className="w-16 h-16 rounded object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                          <Icon className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {material.companies?.name || "Unknown Company"}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {typeInfo?.name || material.asset_type}
                        </p>
                        {material.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl">
                            {material.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                          <span>
                            Created{" "}
                            {new Date(
                              material.created_at,
                            ).toLocaleDateString()}
                          </span>
                          {material.file_size && (
                            <span>
                              {(material.file_size / 1024 / 1024).toFixed(2)}{" "}
                              MB
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                      {material.file_url && (
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center">
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No materials yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Generate your first AI-powered sale material
              </p>
              <Link href={`/${locale}/dashboard/materials/generate`}>
                <Button>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Materials
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
