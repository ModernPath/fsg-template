/**
 * Listings Page
 * Manage company listings and portal syndication
 */

import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import { Plus, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface ListingsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function ListingsPage({ params }: ListingsPageProps) {
  const { locale } = await params;
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

  // Build query - Listings link via company, not directly via organization
  let listingsQuery = supabase
    .from("listings")
    .select(
      `
      *,
      companies!inner(
        id,
        name,
        industry,
        organization_id
      ),
      listing_portals(
        id,
        portal_name,
        status,
        portal_listing_id,
        views_count,
        leads_count
      )
    `,
    )
    .order("created_at", { ascending: false });

  // Filter by organization if user has one (via companies join)
  if (organizationId) {
    listingsQuery = listingsQuery.eq("companies.organization_id", organizationId);
  }

  // Fetch listings with company and portal data
  const { data: listings, error } = await listingsQuery;

  if (error) {
    console.error("Error fetching listings:", error);
    return <div>Error loading listings</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Listings
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Manage your listings and portal syndication
          </p>
        </div>
        <Link href={`/${locale}/dashboard/listings/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Listing
          </Button>
        </Link>
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 gap-6">
        {listings && listings.length > 0 ? (
          listings.map((listing: any) => (
            <div
              key={listing.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  {false && listing.companies ? (
                    <img
                      src=""
                      alt={listing.companies.name}
                      className="w-16 h-16 rounded object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded" />
                  )}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {listing.companies.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {listing.companies.industry}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        variant={
                          listing.published ? "default" : "secondary"
                        }
                      >
                        {listing.published ? "Published" : "Draft"}
                      </Badge>
                      {listing.price_display && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {listing.price_display}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Link href={`/${locale}/dashboard/listings/${listing.id}`}>
                  <Button variant="outline">View Details</Button>
                </Link>
              </div>

              {/* Portal Syndication Status */}
              {listing.listing_portals &&
                listing.listing_portals.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Portal Syndication
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {listing.listing_portals.map((portal: any) => (
                        <div
                          key={portal.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {portal.portal_name}
                              </span>
                              <Badge
                                variant={
                                  portal.status === "active"
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-xs"
                              >
                                {portal.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                              <span>
                                {portal.views_count || 0} views
                              </span>
                              <span>
                                {portal.leads_count || 0} leads
                              </span>
                            </div>
                          </div>
                          {portal.portal_listing_id && (
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No listings yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create your first listing to start syndication
            </p>
            <Link href={`/${locale}/dashboard/listings/new`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Listing
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

