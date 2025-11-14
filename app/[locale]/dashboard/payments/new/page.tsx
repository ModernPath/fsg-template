"use client";

/**
 * Create Invoice/Payment Page
 * Create new invoice or record payment
 */

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
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
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NewPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "en";
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deals, setDeals] = useState<any[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    deal_id: undefined as string | undefined,
    amount: "",
    currency: "EUR",
    type: "commission",
    status: "pending",
    description: "",
    due_date: "",
  });

  useEffect(() => {
    async function loadData() {
      try {
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
          // Fetch deals for dropdown
          const { data: dealsData } = await supabase
            .from("deals")
            .select(`
              id,
              companies(id, name)
            `)
            .eq("organization_id", orgId)
            .order("created_at", { ascending: false });

          setDeals(dealsData || []);
        }
      } catch (err: any) {
        console.error("Error loading data:", err);
        setError(err.message);
      }
    }

    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !organizationId) return;

    try {
      setLoading(true);
      setError(null);

      const { error: insertError } = await supabase.from("payments").insert({
        organization_id: organizationId,
        deal_id: formData.deal_id || null,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        type: formData.type,
        status: formData.status,
        description: formData.description || null,
        due_date: formData.due_date || null,
      });

      if (insertError) throw insertError;

      // Success - redirect back to payments
      router.push(`/${locale}/dashboard/payments`);
    } catch (err: any) {
      console.error("Error creating payment:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/dashboard/payments`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Create Invoice/Payment
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Create a new invoice or record a payment
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

          {/* Deal Selection */}
          <div>
            <Label htmlFor="deal_id">
              Related Deal <span className="text-gray-500">(Optional)</span>
            </Label>
            <Select
              value={formData.deal_id || undefined}
              onValueChange={(value) => handleChange("deal_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a deal (optional)" />
              </SelectTrigger>
              <SelectContent>
                {deals.map((deal) => (
                  <SelectItem key={deal.id} value={deal.id}>
                    {deal.companies?.name || `Deal ${deal.id.slice(0, 8)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="amount">
                Amount <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => handleChange("amount", e.target.value)}
                placeholder="10000.00"
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => handleChange("currency", value)}
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
          </div>

          {/* Type */}
          <div>
            <Label htmlFor="type">
              Payment Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleChange("type", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="commission">Commission</SelectItem>
                <SelectItem value="deposit">Deposit</SelectItem>
                <SelectItem value="milestone">Milestone Payment</SelectItem>
                <SelectItem value="final">Final Payment</SelectItem>
                <SelectItem value="retainer">Retainer</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="status">
              Status <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="succeeded">Succeeded</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Due Date */}
          <div>
            <Label htmlFor="due_date">
              Due Date <span className="text-gray-500">(Optional)</span>
            </Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => handleChange("due_date", e.target.value)}
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">
              Description <span className="text-gray-500">(Optional)</span>
            </Label>
            <Textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Add details about this payment..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <Button type="submit" disabled={loading || !formData.amount}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Payment
            </Button>
            <Link href={`/${locale}/dashboard/payments`}>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

