/**
 * New Buyer Page
 * Form to invite/add a new buyer
 */

import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface NewBuyerPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function NewBuyerPage({ params }: NewBuyerPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "buyers" });

  return (
    <div className="container mx-auto max-w-2xl space-y-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/dashboard/buyers`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{t("addBuyer")}</h1>
          <p className="text-muted-foreground">
            Kutsu uusi ostaja tarkastelemaan yrityksiäsi
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Ostajan tiedot</CardTitle>
          <CardDescription>
            Täytä ostajan yhteystiedot. Lähetämme hänelle kutsun sähköpostitse.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Nimi *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Matti Meikäläinen"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Sähköposti *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="matti@example.com"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="company" className="text-sm font-medium">
                Yritys
              </label>
              <input
                id="company"
                name="company"
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Yritys Oy"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">
                Puhelin
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="+358 40 123 4567"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium">
                Viesti ostajalle
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Haluaisin esitellä sinulle mielenkiintoisen yrityskauppamahdollisuuden..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                Lähetä kutsu
              </Button>
              <Link href={`/${locale}/dashboard/buyers`} className="flex-1">
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
          <CardTitle className="text-base">💡 Huomio</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <ul className="space-y-2 list-disc list-inside">
            <li>Ostaja saa sähköpostin, jossa on linkki rekisteröitymiseen</li>
            <li>Voit seurata ostajan toimintaa ja kauppaprosessin etenemistä</li>
            <li>Ostaja ei näe yritystietoja ennen NDA:n allekirjoitusta</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

