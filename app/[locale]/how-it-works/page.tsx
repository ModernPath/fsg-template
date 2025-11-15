/**
 * How It Works Page
 * Explains the BizExit process
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Sparkles, 
  FileText, 
  Users, 
  Handshake, 
  CheckCircle,
  ArrowRight 
} from "lucide-react";

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">
              How BizExit Works
            </h1>
            <p className="text-xl text-indigo-100 mb-8 max-w-3xl mx-auto">
              From listing to closing, we guide you through every step of your M&A journey
            </p>
          </div>
        </div>
      </section>

      {/* For Sellers */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              For Business Sellers
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Exit your business with confidence
            </p>
          </div>

          <div className="space-y-16">
            {/* Step 1 */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                <div className="bg-blue-100 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                  <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  1. Add Your Business
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                  Enter your company's basic information. Our AI will automatically fetch and 
                  verify data from public registries (YTJ/PRH in Finland, Bolagsverket in Sweden).
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start text-gray-700 dark:text-gray-300">
                    <CheckCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                    Automated data enrichment
                  </li>
                  <li className="flex items-start text-gray-700 dark:text-gray-300">
                    <CheckCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                    Financial data integration
                  </li>
                  <li className="flex items-start text-gray-700 dark:text-gray-300">
                    <CheckCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                    Market intelligence gathering
                  </li>
                </ul>
              </div>
              <div className="order-1 md:order-2 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-8 rounded-lg h-64 flex items-center justify-center">
                <Building2 className="w-32 h-32 text-blue-600 dark:text-blue-400 opacity-20" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-8 rounded-lg h-64 flex items-center justify-center">
                <Sparkles className="w-32 h-32 text-purple-600 dark:text-purple-400 opacity-20" />
              </div>
              <div>
                <div className="bg-purple-100 dark:bg-purple-900/30 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                  <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  2. AI Enrichment (17 Modules)
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                  Our AI analyzes your business using 17 specialized modules covering financial 
                  health, market position, growth potential, and M&A readiness.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start text-gray-700 dark:text-gray-300">
                    <CheckCircle className="w-5 h-5 text-purple-600 mr-3 mt-0.5" />
                    Financial analysis & valuation
                  </li>
                  <li className="flex items-start text-gray-700 dark:text-gray-300">
                    <CheckCircle className="w-5 h-5 text-purple-600 mr-3 mt-0.5" />
                    Competitive & industry analysis
                  </li>
                  <li className="flex items-start text-gray-700 dark:text-gray-300">
                    <CheckCircle className="w-5 h-5 text-purple-600 mr-3 mt-0.5" />
                    Risk assessment & opportunities
                  </li>
                </ul>
              </div>
            </div>

            {/* Step 3 */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                <div className="bg-green-100 dark:bg-green-900/30 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                  <FileText className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  3. Generate Marketing Materials
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                  Create professional teasers, information memorandums, and pitch decks 
                  automatically using AI and Gamma.app integration.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start text-gray-700 dark:text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
                    AI-generated content
                  </li>
                  <li className="flex items-start text-gray-700 dark:text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
                    Professional design templates
                  </li>
                  <li className="flex items-start text-gray-700 dark:text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
                    Customizable & brandable
                  </li>
                </ul>
              </div>
              <div className="order-1 md:order-2 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-8 rounded-lg h-64 flex items-center justify-center">
                <FileText className="w-32 h-32 text-green-600 dark:text-green-400 opacity-20" />
              </div>
            </div>

            {/* Step 4 */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-8 rounded-lg h-64 flex items-center justify-center">
                <Users className="w-32 h-32 text-orange-600 dark:text-orange-400 opacity-20" />
              </div>
              <div>
                <div className="bg-orange-100 dark:bg-orange-900/30 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                  <Users className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  4. Connect with Buyers
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                  Your listing is shared with verified buyers. Manage inquiries, NDAs, and 
                  confidential data sharing securely in one platform.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start text-gray-700 dark:text-gray-300">
                    <CheckCircle className="w-5 h-5 text-orange-600 mr-3 mt-0.5" />
                    Verified buyer database
                  </li>
                  <li className="flex items-start text-gray-700 dark:text-gray-300">
                    <CheckCircle className="w-5 h-5 text-orange-600 mr-3 mt-0.5" />
                    NDA management
                  </li>
                  <li className="flex items-start text-gray-700 dark:text-gray-300">
                    <CheckCircle className="w-5 h-5 text-orange-600 mr-3 mt-0.5" />
                    Secure data room
                  </li>
                </ul>
              </div>
            </div>

            {/* Step 5 */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                <div className="bg-pink-100 dark:bg-pink-900/30 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                  <Handshake className="w-8 h-8 text-pink-600 dark:text-pink-400" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  5. Manage Deal to Closing
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                  Track your deal through our pipeline management system, from initial interest 
                  to successful closing.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start text-gray-700 dark:text-gray-300">
                    <CheckCircle className="w-5 h-5 text-pink-600 mr-3 mt-0.5" />
                    Deal pipeline tracking
                  </li>
                  <li className="flex items-start text-gray-700 dark:text-gray-300">
                    <CheckCircle className="w-5 h-5 text-pink-600 mr-3 mt-0.5" />
                    Activity logging
                  </li>
                  <li className="flex items-start text-gray-700 dark:text-gray-300">
                    <CheckCircle className="w-5 h-5 text-pink-600 mr-3 mt-0.5" />
                    Document management
                  </li>
                </ul>
              </div>
              <div className="order-1 md:order-2 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 p-8 rounded-lg h-64 flex items-center justify-center">
                <Handshake className="w-32 h-32 text-pink-600 dark:text-pink-400 opacity-20" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Buyers */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              For Business Buyers
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Find and acquire your next business
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Search & Filter
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Browse verified business listings with advanced AI-powered filters
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg">
              <div className="bg-purple-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Review Analysis
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Access comprehensive AI-generated business analysis and valuations
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg">
              <div className="bg-green-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Sign NDA
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Digitally sign NDAs and access confidential business information
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg">
              <div className="bg-orange-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl mb-4">
                4
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Negotiate & Close
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Manage negotiations and complete the transaction
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Start Your M&A Journey?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join BizExit and experience the future of M&A transactions
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/sell">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50">
                Sell Your Business
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/buy">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                Find Businesses
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

