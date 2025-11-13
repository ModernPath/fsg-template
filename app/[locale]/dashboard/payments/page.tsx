"use client";

/**
 * Payments Page
 * Manage payments, invoices, and commissions
 */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function PaymentsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPayments() {
      try {
        setLoading(true);
        setError(null);

        // Get user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("Please log in");
          return;
        }

        console.log('💰 [Payments] User:', user.id);

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
        console.log('💰 [Payments] Organization:', organizationId);

        if (!organizationId) {
          setError("No organization found");
          return;
        }

        // Fetch payments
        const { data: paymentsData, error: paymentsError } = await supabase
          .from("payments")
          .select(`
            *,
            deals(
              id,
              companies(id, name)
            )
          `)
          .eq("organization_id", organizationId)
          .order("created_at", { ascending: false });

        console.log('💰 [Payments] Found:', paymentsData?.length || 0, 'payments');
        console.log('💰 [Payments] Data:', paymentsData);

        if (paymentsError) {
          console.error("💰 [Payments] Error:", paymentsError);
          setError(paymentsError.message);
          return;
        }

        setPayments(paymentsData || []);
      } catch (err: any) {
        console.error("💰 [Payments] Unexpected error:", err);
        setError(err.message || "Failed to load payments");
      } finally {
        setLoading(false);
      }
    }

    fetchPayments();
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

  const stats = {
    total: payments.reduce((sum, p) => sum + Number(p.amount), 0) || 0,
    paid:
      payments
        .filter((p) => p.status === "paid" || p.status === "succeeded")
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0,
    pending:
      payments
        .filter((p) => p.status === "pending")
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0,
    overdue:
      payments
        .filter((p) => p.status === "overdue")
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Payments
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Manage payments, invoices, and commissions
          </p>
        </div>
        <Link href={`/${locale}/dashboard/payments/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Revenue
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                €{(stats.total / 1000).toFixed(1)}K
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Paid</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                €{(stats.paid / 1000).toFixed(1)}K
              </p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pending
              </p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">
                €{(stats.pending / 1000).toFixed(1)}K
              </p>
            </div>
            <Clock className="w-12 h-12 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Overdue
              </p>
              <p className="text-3xl font-bold text-red-600 mt-1">
                €{(stats.overdue / 1000).toFixed(1)}K
              </p>
            </div>
            <AlertCircle className="w-12 h-12 text-red-600" />
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Invoice #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Deal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {payments && payments.length > 0 ? (
                payments.map((payment: any) => (
                  <tr
                    key={payment.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      #{payment.invoice_number || payment.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {payment.deals?.companies?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="secondary">
                        {payment.type === "fixed_fee"
                          ? "Fixed Fee"
                          : "Success Fee"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      €{Number(payment.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {payment.due_date
                        ? new Date(payment.due_date).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={
                          payment.status === "paid" || payment.status === "succeeded" ? "default" : "secondary"
                        }
                        className={
                          payment.status === "paid" || payment.status === "succeeded"
                            ? "bg-green-100 text-green-800"
                            : payment.status === "overdue"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {payment.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Link href={`/${locale}/dashboard/payments/${payment.id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-gray-500 dark:text-gray-400">
                      <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">
                        No payments yet
                      </p>
                      <p className="text-sm">
                        Create your first invoice to start tracking payments
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
