/**
 * New Listing Page
 * Form to create a new company listing
 */

import { createClient } from "@/utils/supabase/server";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";

interface NewListingPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function NewListingPage({ params }: NewListingPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "listings" });
  const supabase = await createClient();

  // Get user and their companies
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/sign-in`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(`
      id,
      user_organizations(
        organization_id
      )
    `)
    .eq("id", user.id)
    .single();

  const organizationId = profile?.user_organizations?.[0]?.organization_id;

  if (!organizationId) {
    redirect(`/${locale}/dashboard`);
  }

  // Get organization's companies
  const { data: companies } = await supabase
    .from("companies")
    .select("id, name")
    .eq("organization_id", organizationId)
    .order("name");

  return (
    <div className="container mx-auto max-w-2xl space-y-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/dashboard/listings`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{t("createListing")}</h1>
          <p className="text-muted-foreground">
            Luo uusi listaus yrityksen myyntiä varten
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Listauksen tiedot</CardTitle>
          <CardDescription>
            Valitse yritys ja määritä listauksen yksityiskohdat
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="company" className="text-sm font-medium">
                Yritys *
              </label>
              <select
                id="company"
                name="company_id"
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Valitse yritys</option>
                {companies?.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Listauksen otsikko *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Menestyvä IT-konsulttiyritys myytävänä"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="short_description" className="text-sm font-medium">
                Lyhyt kuvaus *
              </label>
              <textarea
                id="short_description"
                name="short_description"
                rows={3}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Lyhyt ja ytimekäs kuvaus yrityksestä ja mahdollisuudesta"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Pitkä kuvaus
              </label>
              <textarea
                id="description"
                name="description"
                rows={6}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Yksityiskohtainen kuvaus yrityksestä, sen toiminnasta, historiasta ja kasvupotentiaalista..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="asking_price" className="text-sm font-medium">
                  Pyyntihinta (€)
                </label>
                <input
                  id="asking_price"
                  name="asking_price"
                  type="number"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="500000"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="price_display" className="text-sm font-medium">
                  Hinnan näyttö
                </label>
                <select
                  id="price_display"
                  name="price_display"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="exact">Tarkka hinta</option>
                  <option value="range">Hintahaarukka</option>
                  <option value="negotiable">Neuvoteltavissa</option>
                  <option value="hidden">Piilossa</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="published"
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium">Julkaise heti</span>
              </label>
              <p className="text-sm text-muted-foreground">
                Jos valitset tämän, listaus on heti näkyvissä portaaleissa
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                Luo listaus
              </Button>
              <Link href={`/${locale}/dashboard/listings`} className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Peruuta
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">📌 Seuraavat vaiheet</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <ol className="space-y-2 list-decimal list-inside">
            <li>Täytä listauksen tiedot ja julkaise</li>
            <li>Listaus syndikoituu automaattisesti valituille portaaleille</li>
            <li>Saat ilmoitukset potentiaalisista ostajista</li>
            <li>Hallinnoi NDA:ita ja tarjouksia dashboard:ssa</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

