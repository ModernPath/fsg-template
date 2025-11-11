"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AIChat } from "@/components/ai/AIChat";
import {
  Search,
  Building2,
  TrendingUp,
  MapPin,
  DollarSign,
  Users,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

/**
 * Visitor Dashboard (Public View)
 * 
 * Features:
 * - Public company listings (limited info)
 * - Search and filters
 * - Industry statistics
 * - AI chatbot guidance
 * - CTA to register
 */
export function VisitorDashboard() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-6">
      {/* Welcome Hero */}
      <Card className="p-8 bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold mb-4">
            Tervetuloa BizExit-platformalle! 👋
          </h1>
          <p className="text-xl text-primary-100 mb-6">
            Löydä täydellinen yritysostokohde tai myy yrityksesi parhaaseen hintaan.
            AI-avusteinen M&A-platforma ammattilaisille.
          </p>
          <div className="flex gap-4">
            <Link href="/auth/sign-up">
              <Button size="lg" variant="secondary">
                Rekisteröidy ostajana
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/sign-up?role=seller">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Rekisteröidy myyjänä
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                150+
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Yritystä myynnissä
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                €50M+
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Kauppojen arvo
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Users className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                500+
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Aktiivista käyttäjää
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <MapPin className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                15
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Toimialaa
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Search Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Etsi yrityksiä
        </h2>
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              type="search"
              placeholder="Hae toimialan, sijainnin tai koon mukaan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Button>
            <Search className="mr-2 h-4 w-4" />
            Hae
          </Button>
        </div>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Listings */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Uusimmat listaukset
            </h2>
            <div className="space-y-4">
              {/* Mock Listing 1 */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-primary-500 transition-colors cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      IT-konsulttiyritys
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Teknologia • Helsinki • 10-25 henkilöä
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <DollarSign className="h-4 w-4" />
                        €2-3M
                      </div>
                      <div className="text-gray-400">•</div>
                      <div className="text-gray-600 dark:text-gray-400">
                        Liikevaihto: €1.5M
                      </div>
                    </div>
                  </div>
                  <div className="ml-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Aktiivinen
                    </span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Rekisteröidy nähdäksesi täydelliset tiedot →
                  </p>
                </div>
              </div>

              {/* Mock Listing 2 */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-primary-500 transition-colors cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Verkkokauppa-alusta
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      E-commerce • Koko Suomi • 5-10 henkilöä
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <DollarSign className="h-4 w-4" />
                        €1-1.5M
                      </div>
                      <div className="text-gray-400">•</div>
                      <div className="text-gray-600 dark:text-gray-400">
                        Liikevaihto: €800K
                      </div>
                    </div>
                  </div>
                  <div className="ml-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Aktiivinen
                    </span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Rekisteröidy nähdäksesi täydelliset tiedot →
                  </p>
                </div>
              </div>

              {/* CTA */}
              <div className="text-center py-6">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Näet vain osan listauksista. Rekisteröidy nähdäksesi kaikki yritykset ja niiden tarkat tiedot.
                </p>
                <Link href="/auth/sign-up">
                  <Button size="lg">
                    Näe kaikki listaukset
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Miksi valita BizExit?
            </h2>
            <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-0.5">✓</span>
                <span>🤖 <strong>AI-avusteinen matchmaking</strong> - Löydä täydellinen ostaja tai yritys</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-0.5">✓</span>
                <span>📊 <strong>Automaattinen analyysi</strong> - AI analysoi taloudelliset tiedot</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-0.5">✓</span>
                <span>🔒 <strong>Turvallinen ja luottamuksellinen</strong> - NDA-suojatut tiedot</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-0.5">✓</span>
                <span>⚡ <strong>Nopea prosessi</strong> - Automatisoidut työvirrat</span>
              </li>
            </ul>
          </Card>
        </div>

        {/* AI Chat */}
        <div className="lg:col-span-1">
          <AIChat
            role="visitor"
            placeholder="Kysy AI:lta BizExitistä ja yritysostoista..."
            className="h-[600px]"
          />
        </div>
      </div>
    </div>
  );
}

