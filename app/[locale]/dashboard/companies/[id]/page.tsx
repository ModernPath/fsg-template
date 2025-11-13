/**
 * Company Detail Page
 * View company information and related data
 */

import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { DeleteCompanyButton } from "@/components/companies/DeleteCompanyButton";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Building2,
  MapPin,
  Calendar,
  Users,
  Globe,
} from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

interface Props {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default async function CompanyDetailPage({ params }: Props) {
  const { locale, id } = await params;
  const supabase = await createClient();
  const t = await getTranslations("companies");

  // Get user context
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

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

  if (!organizationId) {
    redirect(`/${locale}/dashboard`);
  }

  // Fetch company with all related data
  const { data: company, error } = await supabase
    .from("companies")
    .select(
      `
      *,
      financials:company_financials(*),
      assets:company_assets(*),
      listings(*),
      deals(
        id,
        stage,
        status,
        estimated_value,
        created_at
      )
    `,
    )
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (error || !company) {
    redirect(`/${locale}/dashboard/companies`);
  }

  // Get latest financials
  const latestFinancials = company.financials?.[0];

  // Can edit/delete based on role
  const canEdit = ["seller", "broker", "admin", "partner"].includes(
    profile.role.toLowerCase(),
  );
  const canDelete = ["admin", "broker"].includes(profile.role.toLowerCase());

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: t("title"), href: `/${locale}/dashboard/companies` },
          { label: company.name },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/dashboard/companies`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("backToList")}
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <Link href={`/${locale}/dashboard/companies/${id}/edit`}>
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                {t("edit")}
              </Button>
            </Link>
          )}
          {canDelete && (
            <DeleteCompanyButton
              companyId={id}
              companyName={company.name}
              locale={locale}
            />
          )}
        </div>
      </div>

      {/* Company Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start gap-6">
          {/* Logo */}
          {company.logo_url ? (
            <img
              src={company.logo_url}
              alt={company.name}
              className="w-24 h-24 rounded-lg object-cover"
            />
          ) : (
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <Building2 className="w-12 h-12 text-gray-400" />
            </div>
          )}

          {/* Company Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {company.name}
                </h1>
                {company.legal_name && company.legal_name !== company.name && (
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {company.legal_name}
                  </p>
                )}
              </div>
              <Badge
                variant={
                  company.status === "active" ? "default" : "secondary"
                }
                className={
                  company.status === "active"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }
              >
                {company.status}
              </Badge>
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {company.industry && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Building2 className="w-4 h-4" />
                  {company.industry}
                </div>
              )}
              {company.city && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4" />
                  {company.city}, {company.country}
                </div>
              )}
              {company.founded_year && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  Founded {company.founded_year}
                </div>
              )}
              {company.employees && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Users className="w-4 h-4" />
                  {company.employees} employees
                </div>
              )}
            </div>

            {/* Links */}
            {company.website && (
              <div className="mt-4">
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                >
                  <Globe className="w-4 h-4" />
                  {company.website}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {company.description && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              About
            </h3>
            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {company.description}
            </p>
          </div>
        )}
      </div>

      {/* Financial Information */}
      {latestFinancials && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Financial Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {latestFinancials.revenue && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Annual Revenue
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  €{(latestFinancials.revenue / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Year {latestFinancials.year}
                </p>
              </div>
            )}

            {latestFinancials.ebitda && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  EBITDA
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  €{(latestFinancials.ebitda / 1000000).toFixed(1)}M
                </p>
                {latestFinancials.revenue && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {((latestFinancials.ebitda / latestFinancials.revenue) * 100).toFixed(1)}% margin
                  </p>
                )}
              </div>
            )}

            {company.asking_price && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Asking Price
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {company.currency || "EUR"}{" "}
                  {(company.asking_price / 1000000).toFixed(1)}M
                </p>
                {latestFinancials.ebitda && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {(company.asking_price / latestFinancials.ebitda).toFixed(1)}x EBITDA
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Related Deals */}
      {company.deals && company.deals.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Related Deals ({company.deals.length})
          </h2>

          <div className="space-y-3">
            {company.deals.map((deal: any) => (
              <Link
                key={deal.id}
                href={`/${locale}/dashboard/deals/${deal.id}`}
                className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Deal #{deal.id.slice(0, 8)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Stage: {deal.stage} • Status: {deal.status}
                    </p>
                  </div>
                  {deal.estimated_value && (
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      €{(deal.estimated_value / 1000000).toFixed(1)}M
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Additional Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Business Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Business Details
          </h3>
          <dl className="space-y-3">
            {company.business_id && (
              <div>
                <dt className="text-sm text-gray-600 dark:text-gray-400">
                  Business ID
                </dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white">
                  {company.business_id}
                </dd>
              </div>
            )}
            {company.owner_type && (
              <div>
                <dt className="text-sm text-gray-600 dark:text-gray-400">
                  Owner Type
                </dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white">
                  {company.owner_type}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Activity
          </h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-600 dark:text-gray-400">
                Created
              </dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-white">
                {new Date(company.created_at).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600 dark:text-gray-400">
                Last Updated
              </dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-white">
                {new Date(company.updated_at).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
