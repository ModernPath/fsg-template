import SwedishDataIntegrationDemo from '@/components/demo/SwedishDataIntegrationDemo';

export default function DemoSwedishDataPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <SwedishDataIntegrationDemo />
    </div>
  );
}

export async function generateMetadata() {
  return {
    title: 'Swedish Data Integration Demo - Trusty Finance',
    description: 'Demonstration of web scraping integration for Swedish financial data from Allabolag.se',
    robots: 'noindex, nofollow', // Demo page should not be indexed
  };
}
