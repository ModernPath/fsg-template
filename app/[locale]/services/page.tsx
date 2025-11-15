/**
 * Services Page
 * Overview of BizExit services
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  TrendingUp, 
  FileText, 
  Shield, 
  Users, 
  BarChart3,
  Search,
  Zap
} from "lucide-react";

export default function ServicesPage() {
  const services = [
    {
      icon: Building2,
      title: "Business Valuation",
      description: "AI-powered valuation using 17+ data enrichment modules including financial analysis, market intelligence, and competitive positioning.",
      features: [
        "Automated financial metrics analysis",
        "Industry benchmarking",
        "Growth trajectory assessment",
        "Risk evaluation"
      ],
      color: "blue",
      link: "/valuation"
    },
    {
      icon: FileText,
      title: "Marketing Materials Generation",
      description: "Professional teasers, information memorandums, and pitch decks created automatically using AI and your company data.",
      features: [
        "AI-generated content",
        "Professional design templates",
        "Customizable branding",
        "Multiple export formats"
      ],
      color: "purple",
      link: "/dashboard/materials/new"
    },
    {
      icon: Search,
      title: "Deal Sourcing",
      description: "Access verified business opportunities with comprehensive data enrichment and analysis.",
      features: [
        "Verified business listings",
        "Advanced search filters",
        "AI-powered matching",
        "Detailed company profiles"
      ],
      color: "green",
      link: "/buy"
    },
    {
      icon: Shield,
      title: "NDA Management",
      description: "Secure document sharing with automated NDA creation, tracking, and digital signatures.",
      features: [
        "Template-based NDA generation",
        "Digital signature support",
        "Access control",
        "Audit trail"
      ],
      color: "orange",
      link: "/dashboard/ndas"
    },
    {
      icon: Users,
      title: "Deal Pipeline Management",
      description: "Track and manage your M&A deals from initial contact to closing.",
      features: [
        "Kanban-style workflow",
        "Activity tracking",
        "Document management",
        "Team collaboration"
      ],
      color: "pink",
      link: "/dashboard/deals"
    },
    {
      icon: BarChart3,
      title: "Data Enrichment",
      description: "Comprehensive company data gathering from public sources, enriched with AI analysis.",
      features: [
        "Public registry integration",
        "Financial data aggregation",
        "Market intelligence",
        "Web presence analysis"
      ],
      color: "indigo",
      link: "/how-it-works"
    }
  ];

  const colorClasses: Record<string, { bg: string; icon: string; border: string }> = {
    blue: { bg: "bg-blue-100 dark:bg-blue-900/30", icon: "text-blue-600 dark:text-blue-400", border: "border-blue-200 dark:border-blue-800" },
    purple: { bg: "bg-purple-100 dark:bg-purple-900/30", icon: "text-purple-600 dark:text-purple-400", border: "border-purple-200 dark:border-purple-800" },
    green: { bg: "bg-green-100 dark:bg-green-900/30", icon: "text-green-600 dark:text-green-400", border: "border-green-200 dark:border-green-800" },
    orange: { bg: "bg-orange-100 dark:bg-orange-900/30", icon: "text-orange-600 dark:text-orange-400", border: "border-orange-200 dark:border-orange-800" },
    pink: { bg: "bg-pink-100 dark:bg-pink-900/30", icon: "text-pink-600 dark:text-pink-400", border: "border-pink-200 dark:border-pink-800" },
    indigo: { bg: "bg-indigo-100 dark:bg-indigo-900/30", icon: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-200 dark:border-indigo-800" },
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <Zap className="w-12 h-12 mr-3" />
              <h1 className="text-5xl font-bold">
                AI-Powered M&A Services
              </h1>
            </div>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Everything you need to buy or sell a business, powered by artificial intelligence
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => {
              const Icon = service.icon;
              const colors = colorClasses[service.color];
              
              return (
                <div 
                  key={service.title}
                  className={`bg-white dark:bg-gray-800 rounded-lg border ${colors.border} p-6 hover:shadow-lg transition-shadow`}
                >
                  <div className={`${colors.bg} w-16 h-16 rounded-full flex items-center justify-center mb-4`}>
                    <Icon className={`w-8 h-8 ${colors.icon}`} />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {service.description}
                  </p>
                  <ul className="space-y-2 mb-6">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                        <span className={`mr-2 ${colors.icon}`}>✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href={service.link}>
                    <Button variant="outline" className="w-full">
                      Learn More
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Powered by Advanced AI
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              BizExit uses Google Gemini AI and 17+ enrichment modules to analyze companies
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">17+</div>
              <p className="text-gray-700 dark:text-gray-300">Data Enrichment Modules</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">100%</div>
              <p className="text-gray-700 dark:text-gray-300">Automated Analysis</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">Instant</div>
              <p className="text-gray-700 dark:text-gray-300">Material Generation</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Experience the future of M&A transactions
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/sell">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                Sell Your Business
              </Button>
            </Link>
            <Link href="/buy">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                Find Opportunities
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

