/**
 * Business Valuation Page
 * AI-powered business valuation service
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, PieChart, DollarSign, CheckCircle } from "lucide-react";

export default function ValuationPage() {
  const modules = [
    "Basic Company Information",
    "Financial Data Analysis",
    "Industry Analysis",
    "Competitive Analysis",
    "Growth Analysis",
    "Financial Health Assessment",
    "Personnel Information",
    "Market Intelligence",
    "Web Presence Analysis",
    "M&A History",
    "Valuation Data",
    "Customer Intelligence",
    "Operational Efficiency",
    "Competitive Advantages",
    "Risk Assessment",
    "Integration Potential",
    "Exit Attractiveness"
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-600 via-blue-600 to-green-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <BarChart3 className="w-12 h-12 mr-3" />
              <h1 className="text-5xl font-bold">
                AI-Powered Business Valuation
              </h1>
            </div>
            <p className="text-xl text-green-100 mb-8 max-w-3xl mx-auto">
              Get comprehensive business valuation using 17+ AI enrichment modules in minutes
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/dashboard/companies/new">
                <Button size="lg" className="bg-white text-green-600 hover:bg-green-50">
                  Value Your Business
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                  Speak with Expert
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Comprehensive 17-Module Analysis
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Our AI analyzes your business from every angle using data from public registries,
              financial databases, and market intelligence sources
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {modules.map((module, index) => (
              <div
                key={module}
                className="flex items-start bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 mt-1 flex-shrink-0" />
                <span className="text-gray-900 dark:text-white">
                  {index + 1}. {module}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Valuation Features
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-green-100 dark:bg-green-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Multiple Methods</h3>
              <p className="text-gray-600 dark:text-gray-400">
                DCF, comparable companies, market multiples, and asset-based valuation
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <PieChart className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Industry Benchmarks</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Compare against industry peers and market standards
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 dark:bg-purple-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Risk Analysis</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Comprehensive risk assessment and mitigation strategies
              </p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 dark:bg-orange-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Value Drivers</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Identify key factors affecting your business value
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Valuation Process
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-green-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                Enter Company Details
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Provide basic information and financial data. Our AI will enrich it with public data.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                AI Analysis
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                17 modules analyze your business from financial health to market position.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                Get Valuation Report
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Receive detailed valuation report with actionable insights and recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Get started for free, upgrade when you need more features
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-900 p-8 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Basic Valuation
              </h3>
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Free
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  9 core enrichment modules
                </li>
                <li className="flex items-start text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  Basic valuation report
                </li>
                <li className="flex items-start text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  Public data enrichment
                </li>
              </ul>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard/companies/new">Get Started</Link>
              </Button>
            </div>
            <div className="bg-gradient-to-br from-green-600 to-blue-600 p-8 rounded-lg text-white relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-white/20 px-3 py-1 rounded-full text-xs font-semibold">
                RECOMMENDED
              </div>
              <h3 className="text-2xl font-bold mb-2">
                Professional Valuation
              </h3>
              <div className="text-4xl font-bold mb-4">
                Contact Us
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 mr-2 mt-0.5" />
                  All 17 enrichment modules
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 mr-2 mt-0.5" />
                  Professional valuation report
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 mr-2 mt-0.5" />
                  M&A-specific analysis
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 mr-2 mt-0.5" />
                  Expert consultation
                </li>
              </ul>
              <Button className="w-full bg-white text-green-600 hover:bg-white/90" asChild>
                <Link href="/contact">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Start Your Free Valuation Today
          </h2>
          <p className="text-xl text-green-100 mb-8">
            See what your business is worth in minutes
          </p>
          <Link href="/dashboard/companies/new">
            <Button size="lg" className="bg-white text-green-600 hover:bg-green-50">
              Get Free Valuation
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

