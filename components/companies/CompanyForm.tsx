"use client";

/**
 * Company Form Component
 * Form for creating and editing companies
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { Sparkles, TrendingUp, FileText, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface CompanyFormData {
  name: string;
  legal_name?: string;
  business_id?: string;
  website?: string;
  description?: string;
  industry: string;
  country: string;
  city?: string;
  founded_year?: number;
  employees?: number;
  owner_type?: string;
  revenue?: number;
  ebitda?: number;
  asking_price?: number;
  currency?: string;
}

interface CompanyFormProps {
  initialData?: CompanyFormData;
  companyId?: string;
  mode?: "create" | "edit";
}

export function CompanyForm({
  initialData,
  companyId,
  mode = "create",
}: CompanyFormProps) {
  const router = useRouter();
  const t = useTranslations("companies");
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    legal_name: initialData?.legal_name || "",
    business_id: initialData?.business_id || "",
    country: initialData?.country || "Finland",
    city: initialData?.city || "",
    founded_year: initialData?.founded_year || "",
    website: initialData?.website || "",
    industry: initialData?.industry || "",
    description: initialData?.description || "",
    employees: initialData?.employees || "",
    owner_type: initialData?.owner_type || "family_owned",
    revenue: initialData?.revenue || "",
    ebitda: initialData?.ebitda || "",
    asking_price: initialData?.asking_price || "",
    currency: initialData?.currency || "EUR",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url =
        mode === "edit" && companyId
          ? `/api/bizexit/companies/${companyId}`
          : "/api/bizexit/companies";
      const method = mode === "edit" ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          legal_name: formData.legal_name || null,
          business_id: formData.business_id || null,
          website: formData.website || null,
          description: formData.description || null,
          industry: formData.industry,
          country: formData.country,
          city: formData.city || null,
          founded_year: formData.founded_year
            ? parseInt(String(formData.founded_year))
            : null,
          employees: formData.employees
            ? parseInt(String(formData.employees))
            : null,
          owner_type: formData.owner_type || "family_owned",
          asking_price: formData.asking_price
            ? parseFloat(String(formData.asking_price))
            : null,
          currency: formData.currency || "EUR",
          financials: {
            revenue: formData.revenue
              ? parseFloat(String(formData.revenue))
              : null,
            ebitda: formData.ebitda
              ? parseFloat(String(formData.ebitda))
              : null,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save company");
      }

      const data = await response.json();
      router.push(`/dashboard/companies/${data.company.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // AI Helper Functions
  const getCompanyDataForAI = () => ({
    id: companyId || "new",
    name: formData.name,
    industry: formData.industry,
    description: formData.description,
    founded_year: formData.founded_year
      ? parseInt(String(formData.founded_year))
      : undefined,
    location: formData.city ? `${formData.city}, ${formData.country}` : formData.country,
    employees: formData.employees
      ? parseInt(String(formData.employees))
      : undefined,
    annual_revenue: formData.revenue
      ? parseFloat(String(formData.revenue))
      : undefined,
    annual_profit: formData.ebitda
      ? parseFloat(String(formData.ebitda))
      : undefined,
    asking_price: formData.asking_price
      ? parseFloat(String(formData.asking_price))
      : undefined,
  });

  const handleOptimizeListing = async () => {
    if (!formData.name || !formData.industry) {
      toast({
        title: "Missing Information",
        description: "Please fill in company name and industry first",
        variant: "destructive",
      });
      return;
    }

    setAiLoading("optimize");
    try {
      const response = await fetch("/api/ai/seller-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "optimize",
          company: getCompanyDataForAI(),
        }),
      });

      if (!response.ok) throw new Error("Failed to optimize listing");

      const data = await response.json();
      
      // Apply optimization suggestions
      setFormData({
        ...formData,
        description: data.optimizedDescription,
      });

      toast({
        title: "✨ Listing Optimized!",
        description: `Applied ${data.keyHighlights.length} key highlights and SEO optimization`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to optimize",
        variant: "destructive",
      });
    } finally {
      setAiLoading(null);
    }
  };

  const handleSuggestValuation = async () => {
    if (!formData.revenue || !formData.ebitda) {
      toast({
        title: "Missing Financial Data",
        description: "Please fill in revenue and EBITDA for valuation",
        variant: "destructive",
      });
      return;
    }

    setAiLoading("valuation");
    try {
      const response = await fetch("/api/ai/seller-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "valuation",
          company: getCompanyDataForAI(),
        }),
      });

      if (!response.ok) throw new Error("Failed to get valuation");

      const data = await response.json();
      
      // Apply mid-range valuation
      setFormData({
        ...formData,
        asking_price: data.valuation_range.mid,
      });

      toast({
        title: "💰 Valuation Suggested",
        description: `Range: €${data.valuation_range.low.toLocaleString()} - €${data.valuation_range.high.toLocaleString()}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get valuation",
        variant: "destructive",
      });
    } finally {
      setAiLoading(null);
    }
  };

  const handleGenerateTeaser = async () => {
    if (!formData.name || !formData.industry) {
      toast({
        title: "Missing Information",
        description: "Please fill in basic company information first",
        variant: "destructive",
      });
      return;
    }

    setAiLoading("teaser");
    try {
      const response = await fetch("/api/ai/seller-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "teaser",
          company: getCompanyDataForAI(),
        }),
      });

      if (!response.ok) throw new Error("Failed to generate teaser");

      const data = await response.json();
      
      toast({
        title: "📄 Teaser Generated",
        description: "Marketing document has been created (would be saved to documents)",
      });

      // In a real implementation, you'd save this to the documents table
      console.log("Generated Teaser:", data);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate teaser",
        variant: "destructive",
      });
    } finally {
      setAiLoading(null);
    }
  };

  const handleIdentifyBuyers = async () => {
    if (!formData.name || !formData.industry) {
      toast({
        title: "Missing Information",
        description: "Please fill in basic company information first",
        variant: "destructive",
      });
      return;
    }

    setAiLoading("buyers");
    try {
      const response = await fetch("/api/ai/seller-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "buyers",
          company: getCompanyDataForAI(),
        }),
      });

      if (!response.ok) throw new Error("Failed to identify buyers");

      const data = await response.json();
      
      toast({
        title: "🎯 Target Buyers Identified",
        description: `Found ${data.buyer_profiles.length} ideal buyer profiles`,
      });

      // In a real implementation, you'd display these in a dialog
      console.log("Target Buyers:", data);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to identify buyers",
        variant: "destructive",
      });
    } finally {
      setAiLoading(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Basic Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="name">Company Name *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Acme Corporation"
            />
          </div>

          <div>
            <Label htmlFor="legal_name">Legal Name</Label>
            <Input
              id="legal_name"
              name="legal_name"
              value={formData.legal_name}
              onChange={handleChange}
              placeholder="Acme Corporation Oy"
            />
          </div>

          <div>
            <Label htmlFor="business_id">Business ID</Label>
            <Input
              id="business_id"
              name="business_id"
              value={formData.business_id}
              onChange={handleChange}
              placeholder="1234567-8"
            />
          </div>

          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              type="url"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://example.com"
            />
          </div>

          <div>
            <Label htmlFor="country">Country *</Label>
            <Select
              value={formData.country}
              onValueChange={(value) =>
                setFormData({ ...formData, country: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FI">Finland</SelectItem>
                <SelectItem value="SE">Sweden</SelectItem>
                <SelectItem value="NO">Norway</SelectItem>
                <SelectItem value="DK">Denmark</SelectItem>
                <SelectItem value="US">United States</SelectItem>
                <SelectItem value="GB">United Kingdom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Helsinki"
            />
          </div>

          <div>
            <Label htmlFor="founded_year">Founded Year</Label>
            <Input
              id="founded_year"
              name="founded_year"
              type="number"
              value={formData.founded_year}
              onChange={handleChange}
              placeholder="2010"
              min="1800"
              max={new Date().getFullYear()}
            />
          </div>

          <div>
            <Label htmlFor="employees_count">Number of Employees</Label>
            <Input
              id="employees_count"
              name="employees_count"
              type="number"
              value={formData.employees_count}
              onChange={handleChange}
              placeholder="50"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Business Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Business Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="industry">Industry *</Label>
            <Input
              id="industry"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              required
              placeholder="Technology"
            />
          </div>

          <div>
            <Label htmlFor="sub_industry">Sub-Industry</Label>
            <Input
              id="sub_industry"
              name="sub_industry"
              value={formData.sub_industry}
              onChange={handleChange}
              placeholder="SaaS"
            />
          </div>

          <div>
            <Label htmlFor="legal_structure">Legal Structure</Label>
            <Select
              value={formData.legal_structure}
              onValueChange={(value) =>
                setFormData({ ...formData, legal_structure: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select structure" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LLC">LLC</SelectItem>
                <SelectItem value="Corporation">Corporation</SelectItem>
                <SelectItem value="Partnership">Partnership</SelectItem>
                <SelectItem value="Sole Proprietorship">
                  Sole Proprietorship
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Brief description of the company and its business..."
            />
          </div>
        </div>
      </div>

      {/* AI Assistant Tools */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            AI Assistant
          </h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Let our AI help you create a compelling listing and set the right price
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleOptimizeListing}
            disabled={aiLoading !== null || !formData.name || !formData.industry}
            className="justify-start"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {aiLoading === "optimize" ? "Optimizing..." : "Optimize Listing"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleSuggestValuation}
            disabled={aiLoading !== null || !formData.revenue || !formData.ebitda}
            className="justify-start"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            {aiLoading === "valuation" ? "Analyzing..." : "Suggest Valuation"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleGenerateTeaser}
            disabled={aiLoading !== null || !formData.name || !formData.industry}
            className="justify-start"
          >
            <FileText className="w-4 h-4 mr-2" />
            {aiLoading === "teaser" ? "Generating..." : "Generate Teaser"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleIdentifyBuyers}
            disabled={aiLoading !== null || !formData.name || !formData.industry}
            className="justify-start"
          >
            <Users className="w-4 h-4 mr-2" />
            {aiLoading === "buyers" ? "Identifying..." : "Identify Target Buyers"}
          </Button>
        </div>
      </div>

      {/* Financial Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Financial Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={formData.currency}
              onValueChange={(value) =>
                setFormData({ ...formData, currency: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
                <SelectItem value="SEK">SEK (kr)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="annual_revenue">Annual Revenue</Label>
            <Input
              id="annual_revenue"
              name="annual_revenue"
              type="number"
              value={formData.annual_revenue}
              onChange={handleChange}
              placeholder="1000000"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <Label htmlFor="annual_ebitda">Annual EBITDA</Label>
            <Input
              id="annual_ebitda"
              name="annual_ebitda"
              type="number"
              value={formData.annual_ebitda}
              onChange={handleChange}
              placeholder="200000"
              step="0.01"
            />
          </div>

          <div>
            <Label htmlFor="asking_price">Asking Price</Label>
            <Input
              id="asking_price"
              name="asking_price"
              type="number"
              value={formData.asking_price}
              onChange={handleChange}
              placeholder="2000000"
              min="0"
              step="0.01"
            />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading
            ? "Saving..."
            : company
              ? "Update Company"
              : "Create Company"}
        </Button>
      </div>
    </form>
  );
}

