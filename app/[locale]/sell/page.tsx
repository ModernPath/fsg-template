/**
 * Sell Your Business Page
 * Information for business sellers
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle, TrendingUp, Shield, Zap } from "lucide-react";

export default function SellPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">
              Sell Your Business with Confidence
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              AI-powered platform that helps you maximize your business value and find the right buyer
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/dashboard/companies/new">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                  Talk to an Expert
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Why Sell with BizExit?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">AI-Powered Valuation</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Get accurate business valuation using advanced AI analysis
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 dark:bg-purple-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Maximize Value</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Professional materials that showcase your business potential
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 dark:bg-green-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Secure & Confidential</h3>
              <p className="text-gray-600 dark:text-gray-400">
                NDA management and secure data room for sensitive information
              </p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 dark:bg-orange-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Qualified Buyers</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Access to verified buyers actively seeking opportunities
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Add Your Business
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Enter your company details and our AI will enrich the data with public information
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
              <div className="bg-purple-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Generate Materials
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Create professional teasers, IMs, and pitch decks automatically
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
              <div className="bg-green-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Connect with Buyers
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Manage inquiries, NDAs, and negotiations all in one place
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Sell Your Business?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join hundreds of successful business owners who found the right buyer
          </p>
          <Link href="/dashboard/companies/new">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
              Start Your Exit Journey
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

