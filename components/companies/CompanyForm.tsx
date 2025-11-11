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

interface CompanyFormProps {
  organizationId: string;
  locale: string;
  company?: any;
}

export function CompanyForm({
  organizationId,
  locale,
  company,
}: CompanyFormProps) {
  const router = useRouter();
  const t = useTranslations("companies");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: company?.name || "",
    legal_name: company?.legal_name || "",
    business_id: company?.business_id || "",
    country: company?.country || "FI",
    city: company?.city || "",
    founded_year: company?.founded_year || "",
    website: company?.website || "",
    industry: company?.industry || "",
    sub_industry: company?.sub_industry || "",
    description: company?.description || "",
    employees_count: company?.employees_count || "",
    legal_structure: company?.legal_structure || "",
    annual_revenue: company?.annual_revenue || "",
    annual_ebitda: company?.annual_ebitda || "",
    asking_price: company?.asking_price || "",
    currency: company?.currency || "EUR",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = company
        ? `/api/companies/${company.id}`
        : "/api/companies";
      const method = company ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          organization_id: organizationId,
          founded_year: formData.founded_year
            ? parseInt(formData.founded_year)
            : null,
          employees_count: formData.employees_count
            ? parseInt(formData.employees_count)
            : null,
          annual_revenue: formData.annual_revenue
            ? parseFloat(formData.annual_revenue)
            : null,
          annual_ebitda: formData.annual_ebitda
            ? parseFloat(formData.annual_ebitda)
            : null,
          asking_price: formData.asking_price
            ? parseFloat(formData.asking_price)
            : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save company");
      }

      const data = await response.json();
      router.push(`/${locale}/dashboard/companies/${data.id}`);
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

