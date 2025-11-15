/**
 * Buy a Business Page
 * Information for business buyers
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search, Filter, FileCheck, Handshake } from "lucide-react";

export default function BuyPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">
              Find Your Next Business Acquisition
            </h1>
            <p className="text-xl text-purple-100 mb-8 max-w-3xl mx-auto">
              Access verified business opportunities with comprehensive AI-analyzed data
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/dashboard/listings">
                <Button size="lg" className="bg-white text-purple-600 hover:bg-purple-50">
                  Browse Opportunities
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                  Schedule Consultation
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
            Why Buy with BizExit?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-purple-100 dark:bg-purple-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Smart Search</h3>
              <p className="text-gray-600 dark:text-gray-400">
                AI-powered filters to find businesses matching your criteria
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileCheck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Verified Data</h3>
              <p className="text-gray-600 dark:text-gray-400">
                All listings verified with public registry and financial data
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 dark:bg-green-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Filter className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Detailed Analysis</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Comprehensive financial and market analysis for each opportunity
              </p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 dark:bg-orange-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Handshake className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Deal Management</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Track negotiations and manage documentation in one platform
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Acquisition Process
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
              <div className="bg-purple-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Search
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Browse verified business listings with detailed information
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Analyze
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Review AI-generated analysis and financial metrics
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
              <div className="bg-green-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Connect
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Sign NDA and access confidential information
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
              <div className="bg-orange-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl mb-4">
                4
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Close
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Negotiate and complete the transaction
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Start Your Acquisition Journey
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Discover verified business opportunities today
          </p>
          <Link href="/dashboard/listings">
            <Button size="lg" className="bg-white text-purple-600 hover:bg-purple-50">
              Browse Businesses
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

