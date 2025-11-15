/**
 * About Page
 * Company information and mission
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Target, Users, Zap, Heart } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">
              About BizExit
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              We're revolutionizing M&A transactions with AI-powered technology
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Our Mission
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
              To democratize business acquisitions by making professional M&A services 
              accessible to everyone through artificial intelligence. We believe every 
              business owner deserves a fair, transparent, and efficient exit process.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Our Values
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg text-center">
              <div className="bg-blue-100 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Transparency
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Clear pricing, verified data, and honest communication
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg text-center">
              <div className="bg-purple-100 dark:bg-purple-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Innovation
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Cutting-edge AI technology for better outcomes
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg text-center">
              <div className="bg-green-100 dark:bg-green-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Trust
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Building long-term relationships with integrity
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg text-center">
              <div className="bg-orange-100 dark:bg-orange-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Excellence
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Committed to delivering exceptional results
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Built on Advanced AI
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                BizExit leverages Google's Gemini AI and 17+ data enrichment modules to provide 
                comprehensive business analysis. Our platform automatically gathers and analyzes 
                data from public registries, financial databases, and market intelligence sources.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                This technology enables us to generate professional marketing materials, accurate 
                valuations, and detailed company reports in minutes instead of weeks.
              </p>
              <Link href="/services">
                <Button>Learn About Our Services</Button>
              </Link>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 p-8 rounded-lg">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Key Features
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start text-gray-700 dark:text-gray-300">
                  <span className="text-blue-600 dark:text-blue-400 mr-2">✓</span>
                  AI-powered company valuation
                </li>
                <li className="flex items-start text-gray-700 dark:text-gray-300">
                  <span className="text-purple-600 dark:text-purple-400 mr-2">✓</span>
                  Automated material generation
                </li>
                <li className="flex items-start text-gray-700 dark:text-gray-300">
                  <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                  17+ data enrichment modules
                </li>
                <li className="flex items-start text-gray-700 dark:text-gray-300">
                  <span className="text-orange-600 dark:text-orange-400 mr-2">✓</span>
                  Secure NDA management
                </li>
                <li className="flex items-start text-gray-700 dark:text-gray-300">
                  <span className="text-pink-600 dark:text-pink-400 mr-2">✓</span>
                  Deal pipeline tracking
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section - Placeholder */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Based in Finland
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              We're a Finnish company combining Nordic business culture with cutting-edge technology. 
              Our platform serves the Nordic and European M&A markets.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Join Us on This Journey
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Be part of the future of M&A transactions
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/sell">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                Get Started
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
