"use client";

/**
 * Generate Materials Page
 * AI-powered material generation
 */

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Sparkles, FileText, Presentation } from "lucide-react";
import Link from "next/link";

const materialTypes = [
  {
    value: "teaser",
    label: "Teaser",
    description: "2-page executive summary",
    icon: FileText,
  },
  {
    value: "im",
    label: "Information Memorandum",
    description: "20-50 page detailed document",
    icon: FileText,
  },
  {
    value: "pitch_deck",
    label: "Pitch Deck",
    description: "10-15 slide presentation",
    icon: Presentation,
  },
  {
    value: "valuation",
    label: "Valuation Report",
    description: "AI-assisted valuation analysis",
    icon: FileText,
  },
];

export default function GenerateMaterialsPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "en";
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    company_id: "",
    material_type: "",
    additional_context: "",
  });

  useEffect(() => {
    async function loadCompanies() {
      try {
        setLoadingCompanies(true);
        
        // Get user and organization
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select(`
            id,
            user_organizations!inner(
              organization_id
            )
          `)
          .eq("id", user.id)
          .single();

        const orgId = profile?.user_organizations?.[0]?.organization_id;
        setOrganizationId(orgId);

        if (orgId) {
          // Fetch companies
          const { data: companiesData, error: companiesError } = await supabase
            .from("companies")
            .select("id, name, description, industry, annual_revenue, annual_ebitda")
            .eq("organization_id", orgId)
            .order("name");

          if (companiesError) throw companiesError;
          setCompanies(companiesData || []);
        }
      } catch (err: any) {
        console.error("Error loading companies:", err);
        setError(err.message);
      } finally {
        setLoadingCompanies(false);
      }
    }

    loadCompanies();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !organizationId || !formData.company_id || !formData.material_type) return;

    try {
      setLoading(true);
      setError(null);

      // Get session for Authorization header
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("No session found");

      // Call AI generate-content API
      const response = await fetch("/api/ai/generate-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          type: formData.material_type,
          resourceType: "company",
          resourceId: formData.company_id,
          params: {
            additionalContext: formData.additional_context,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate material");
      }

      const data = await response.json();

      // Create company_asset record
      const company = companies.find((c) => c.id === formData.company_id);
      const materialType = materialTypes.find((t) => t.value === formData.material_type);
      
      const { error: insertError } = await supabase.from("company_assets").insert({
        company_id: formData.company_id,
        name: `${materialType?.label} - ${company?.name}`,
        description: `AI-generated ${materialType?.label}`,
        type: "document",
        document_type: formData.material_type,
        mime_type: "text/markdown",
        file_size: new Blob([data.content]).size,
        storage_path: `/materials/${formData.company_id}/${formData.material_type}-${Date.now()}.md`,
        generated: true,
        generation_prompt: data.prompt || formData.additional_context,
        generation_model: "gemini-2.0-flash-exp",
        access_level: formData.material_type === "teaser" ? "teaser" : "nda_signed",
        metadata: {
          content: data.content,
          generatedAt: new Date().toISOString(),
        },
      });

      if (insertError) throw insertError;

      // Success - redirect back to materials
      router.push(`/${locale}/dashboard/materials`);
    } catch (err: any) {
      console.error("Error generating material:", err);
      setError(err.message || "Failed to generate material");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loadingCompanies) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/dashboard/materials`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-yellow-500" />
            Generate AI Material
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Create professional sale materials with AI
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {companies.length === 0 && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                You need to create a company first before generating materials.
              </p>
              <Link href={`/${locale}/dashboard/companies/new`}>
                <Button className="mt-2" size="sm">
                  Create Company
                </Button>
              </Link>
            </div>
          )}

          {/* Company Selection */}
          <div>
            <Label htmlFor="company_id">
              Select Company <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.company_id}
              onValueChange={(value) => handleChange("company_id", value)}
              disabled={companies.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name} - {company.industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Material Type */}
          <div>
            <Label htmlFor="material_type">
              Material Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.material_type}
              onValueChange={(value) => handleChange("material_type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose material type" />
              </SelectTrigger>
              <SelectContent>
                {materialTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-gray-500">
                            {type.description}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Additional Context */}
          <div>
            <Label htmlFor="additional_context">
              Additional Context{" "}
              <span className="text-gray-500">(Optional)</span>
            </Label>
            <Textarea
              id="additional_context"
              rows={4}
              value={formData.additional_context}
              onChange={(e) =>
                handleChange("additional_context", e.target.value)
              }
              placeholder="Add any specific information or requirements for the AI to consider..."
            />
            <p className="text-xs text-gray-500 mt-1">
              E.g., target audience, key selling points, specific metrics to highlight
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              type="submit"
              disabled={
                loading ||
                !formData.company_id ||
                !formData.material_type ||
                companies.length === 0
              }
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Generating..." : "Generate Material"}
            </Button>
            <Link href={`/${locale}/dashboard/materials`}>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
          </div>

          {loading && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-pulse" />
                AI is generating your material... This may take a minute.
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

