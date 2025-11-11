'use client'

/**
 * BizExit Landing Page
 * Main marketing page for the M&A platform
 */

import Image from "next/image"
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Link } from '@/app/i18n/navigation'
import { 
  Building2, 
  Handshake, 
  FileText, 
  Users, 
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Clock,
  Shield,
  Zap
} from 'lucide-react'

interface Props {
  params: {
    locale: string
  }
}

export default function BizExitLanding({ params }: Props) {
  const { locale } = params
  const t = useTranslations('BizExit')

  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column: Hero Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span className="text-sm font-medium">{t('hero.badge')}</span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
                {t('hero.title')}
                <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300">
                  {t('hero.titleHighlight')}
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-200 leading-relaxed mb-8">
                {t('hero.description')}
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg"
                  className="bg-white text-blue-900 hover:bg-gray-100"
                  href={`/${locale}/auth/register`}
                >
                  {t('hero.ctaPrimary')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                  href={`/${locale}/book/demo`}
                >
                  {t('hero.ctaSecondary')}
                </Button>
              </div>

              {/* Social Proof */}
              <div className="mt-12 flex items-center gap-8">
                <div>
                  <div className="text-3xl font-bold">500+</div>
                  <div className="text-sm text-gray-300">{t('hero.stats.deals')}</div>
                </div>
                <div className="h-12 w-px bg-white/20" />
                <div>
                  <div className="text-3xl font-bold">€2.5B+</div>
                  <div className="text-sm text-gray-300">{t('hero.stats.value')}</div>
                </div>
                <div className="h-12 w-px bg-white/20" />
                <div>
                  <div className="text-3xl font-bold">95%</div>
                  <div className="text-sm text-gray-300">{t('hero.stats.satisfaction')}</div>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Image/Illustration */}
            <div className="relative">
              <div className="relative bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Building2 className="w-24 h-24 text-white opacity-50" />
                </div>
              </div>
              {/* Floating Cards */}
              <div className="absolute -top-4 -right-4 bg-white text-gray-900 px-4 py-3 rounded-lg shadow-xl">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span className="font-semibold">{t('hero.floatingCard1')}</span>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white text-gray-900 px-4 py-3 rounded-lg shadow-xl">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <span className="font-semibold">{t('hero.floatingCard2')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Who Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('forWho.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('forWho.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Sellers */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {t('forWho.sellers.title')}
              </h3>
              <p className="text-gray-600 mb-6">
                {t('forWho.sellers.description')}
              </p>
              <ul className="space-y-3">
                {[1, 2, 3, 4].map((num) => (
                  <li key={num} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{t(`forWho.sellers.benefit${num}`)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Brokers */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
              <div className="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center mb-6">
                <Handshake className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {t('forWho.brokers.title')}
              </h3>
              <p className="text-gray-600 mb-6">
                {t('forWho.brokers.description')}
              </p>
              <ul className="space-y-3">
                {[1, 2, 3, 4].map((num) => (
                  <li key={num} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{t(`forWho.brokers.benefit${num}`)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Buyers */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
              <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {t('forWho.buyers.title')}
              </h3>
              <p className="text-gray-600 mb-6">
                {t('forWho.buyers.description')}
              </p>
              <ul className="space-y-3">
                {[1, 2, 3, 4].map((num) => (
                  <li key={num} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{t(`forWho.buyers.benefit${num}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('features.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* AI Materials */}
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <Sparkles className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {t('features.ai.title')}
              </h3>
              <p className="text-gray-600">
                {t('features.ai.description')}
              </p>
            </div>

            {/* Deal Pipeline */}
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <TrendingUp className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {t('features.pipeline.title')}
              </h3>
              <p className="text-gray-600">
                {t('features.pipeline.description')}
              </p>
            </div>

            {/* Document Management */}
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <FileText className="w-12 h-12 text-green-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {t('features.documents.title')}
              </h3>
              <p className="text-gray-600">
                {t('features.documents.description')}
              </p>
            </div>

            {/* NDA Management */}
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <Shield className="w-12 h-12 text-orange-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {t('features.nda.title')}
              </h3>
              <p className="text-gray-600">
                {t('features.nda.description')}
              </p>
            </div>

            {/* Multi-Portal Sync */}
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <Zap className="w-12 h-12 text-yellow-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {t('features.portals.title')}
              </h3>
              <p className="text-gray-600">
                {t('features.portals.description')}
              </p>
            </div>

            {/* Analytics */}
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <TrendingUp className="w-12 h-12 text-pink-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {t('features.analytics.title')}
              </h3>
              <p className="text-gray-600">
                {t('features.analytics.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('howItWorks.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('howItWorks.subtitle')}
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {[1, 2, 3, 4, 5].map((num) => (
              <div key={num} className="flex gap-6 mb-12 last:mb-0">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center font-bold text-xl">
                    {num}
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {t(`howItWorks.step${num}.title`)}
                  </h3>
                  <p className="text-gray-600 text-lg">
                    {t(`howItWorks.step${num}.description`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            {t('cta.title')}
          </h2>
          <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            {t('cta.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-white text-blue-900 hover:bg-gray-100"
              href={`/${locale}/auth/register`}
            >
              {t('cta.primaryButton')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
              href={`/${locale}/book/demo`}
            >
              {t('cta.secondaryButton')}
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}

