/**
 * Buyers Page
 * Manage buyer profiles and NDA status
 */

import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import { Plus, Mail, Phone, FileSignature } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getTranslations } from "next-intl/server";

interface BuyersPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function BuyersPage({ params }: BuyersPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "buyers" });
  const supabase = await createClient();

  // Get user context
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_admin, user_organizations(organization_id)")
    .eq("id", user.id)
    .single();

  const organizationId = profile?.user_organizations?.[0]?.organization_id;
    const isAdmin = profile?.is_admin || false;

    if (!organizationId && !isAdmin) {
    return null;
  }

  // Fetch buyers with their deals and NDAs
  const { data: buyers, error } = await supabase
    .from("profiles")
    .select(
      `
      *,
      deals:deals!deals_buyer_id_fkey(
        id,
        current_stage,
        estimated_value,
        companies(name)
      ),
      ndas(
        id,
        status,
        signed_at
      )
    `,
    )
    .eq("role", "buyer")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching buyers:", error);
    return <div>{t("error.loading")}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t("title")}
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            {t("subtitle")}
          </p>
        </div>
        <Link href={`/${locale}/dashboard/buyers/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t("addBuyer")}
          </Button>
        </Link>
      </div>

      {/* Buyers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {buyers && buyers.length > 0 ? (
          buyers.map((buyer: any) => {
            const activeDeals = buyer.deals?.filter(
              (d: any) =>
                !["closed_won", "closed_lost"].includes(d.current_stage),
            ).length || 0;
            const signedNDAs =
              buyer.ndas?.filter((n: any) => n.status === "signed")
                .length || 0;

            return (
              <div
                key={buyer.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
              >
                {/* Buyer Info */}
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {buyer.full_name || "Unnamed Buyer"}
                      </h3>
                      {buyer.company_name && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {buyer.company_name}
                        </p>
                      )}
                    </div>
                    {buyer.email_verified && (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        {t("verified")}
                      </Badge>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 text-sm">
                    {buyer.email && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{buyer.email}</span>
                      </div>
                    )}
                    {buyer.phone && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Phone className="w-4 h-4" />
                        <span>{buyer.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {activeDeals}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {t("activeDeals")}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-1">
                      <FileSignature className="w-5 h-5" />
                      {signedNDAs}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {t("ndasSigned")}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    href={`/${locale}/dashboard/buyers/${buyer.id}`}
                    className="flex-1"
                  >
                    <Button variant="outline" className="w-full">
                      {t("viewProfile")}
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      window.location.href = `mailto:${buyer.email}`;
                    }}
                  >
                    <Mail className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t("empty.title")}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t("empty.description")}
            </p>
            <Link href={`/${locale}/dashboard/buyers/new`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t("addBuyer")}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

