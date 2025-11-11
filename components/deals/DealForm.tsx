"use client";

/**
 * Deal Form Component
 * Form for creating and editing deals
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

interface DealFormProps {
  organizationId: string;
  companies: Array<{ id: string; name: string; industry: string }>;
  buyers: Array<{ id: string; full_name: string; email: string }>;
  preselectedCompanyId?: string;
  locale: string;
  deal?: any;
}

export function DealForm({
  organizationId,
  companies,
  buyers,
  preselectedCompanyId,
  locale,
  deal,
}: DealFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    company_id: deal?.company_id || preselectedCompanyId || "",
    buyer_id: deal?.buyer_id || "",
    estimated_value: deal?.estimated_value || "",
    current_stage: deal?.current_stage || "lead",
    notes: deal?.notes || "",
  });

  const stages = [
    { value: "lead", label: "Lead" },
    { value: "qualification", label: "Qualification" },
    { value: "nda_signed", label: "NDA Signed" },
    { value: "evaluation", label: "Evaluation" },
    { value: "loi_submitted", label: "LOI Submitted" },
    { value: "due_diligence", label: "Due Diligence" },
    { value: "negotiation", label: "Negotiation" },
    { value: "closed_won", label: "Closed Won" },
    { value: "closed_lost", label: "Closed Lost" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = deal ? `/api/deals/${deal.id}` : "/api/deals";
      const method = deal ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          organization_id: organizationId,
          estimated_value: formData.estimated_value
            ? parseFloat(formData.estimated_value)
            : null,
          buyer_id: formData.buyer_id || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save deal");
      }

      const data = await response.json();
      router.push(`/${locale}/dashboard/deals/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Deal Information
        </h2>

        <div className="space-y-6">
          <div>
            <Label htmlFor="company_id">Company *</Label>
            <Select
              value={formData.company_id}
              onValueChange={(value) =>
                setFormData({ ...formData, company_id: value })
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name} ({company.industry})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="buyer_id">Buyer (Optional)</Label>
            <Select
              value={formData.buyer_id}
              onValueChange={(value) =>
                setFormData({ ...formData, buyer_id: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a buyer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No buyer selected</SelectItem>
                {buyers.map((buyer) => (
                  <SelectItem key={buyer.id} value={buyer.id}>
                    {buyer.full_name || buyer.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="current_stage">Current Stage *</Label>
            <Select
              value={formData.current_stage}
              onValueChange={(value) =>
                setFormData({ ...formData, current_stage: value })
              }
              required
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stages.map((stage) => (
                  <SelectItem key={stage.value} value={stage.value}>
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="estimated_value">Estimated Value (€)</Label>
            <Input
              id="estimated_value"
              name="estimated_value"
              type="number"
              value={formData.estimated_value}
              onChange={(e) =>
                setFormData({ ...formData, estimated_value: e.target.value })
              }
              placeholder="1000000"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={4}
              placeholder="Add any notes about this deal..."
            />
          </div>
        </div>
      </div>

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
          {loading ? "Saving..." : deal ? "Update Deal" : "Create Deal"}
        </Button>
      </div>
    </form>
  );
}

