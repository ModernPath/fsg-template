'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

interface FinancialData {
  year: string;
  revenue: string;
  profit: string;
  net_result: string;
  equity: string;
  profit_margin: string;
  source: string;
}

interface SwedishCompanyData {
  financials: FinancialData[];
  personnel: {
    count: number;
    source: string;
  };
  industry: string;
  lastUpdated: string;
  note: string;
  originalAllabolagData: {
    omsattning_2025: string;
    resultat_efter_finansnetto_2025: string;
    arets_resultat: string;
    eget_kapital: string;
    anstallda: string;
    bolagsform: string;
    registreringsaar: string;
  };
}

export default function SwedishDataIntegrationDemo() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SwedishCompanyData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDemoData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/test-swedish-integration?orgNumber=559048-7301');
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message || 'Failed to fetch data');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    if (value === 'Not available') return value;
    const num = parseInt(value);
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🇸🇪 Swedish Financial Data Integration Demo
            <Badge variant="outline">DEMO</Badge>
          </CardTitle>
          <CardDescription>
            Demonstration of how web scraping could be used to fetch real financial data from Allabolag.se for Swedish companies like SP Capital AB (559048-7301).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={fetchDemoData} 
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fetching Demo Data...
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Fetch Swedish Financial Data (Demo)
                </>
              )}
            </Button>

            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    Error: {error}
                  </div>
                </CardContent>
              </Card>
            )}

            {data && (
              <div className="space-y-6">
                {/* Success indicator */}
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="h-4 w-4" />
                      Successfully fetched Swedish financial data!
                    </div>
                  </CardContent>
                </Card>

                {/* Raw Allabolag data */}
                <Card>
                  <CardHeader>
                    <CardTitle>🔍 Raw Data from Allabolag.se</CardTitle>
                    <CardDescription>This is what would be scraped from the website</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Financial Overview 2025</h4>
                        <ul className="space-y-1 text-sm">
                          <li><strong>Omsättning:</strong> {data.originalAllabolagData.omsattning_2025}</li>
                          <li><strong>Resultat efter finansnetto:</strong> {data.originalAllabolagData.resultat_efter_finansnetto_2025}</li>
                          <li><strong>Årets resultat:</strong> {data.originalAllabolagData.arets_resultat}</li>
                          <li><strong>Eget kapital:</strong> {data.originalAllabolagData.eget_kapital}</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Company Details</h4>
                        <ul className="space-y-1 text-sm">
                          <li><strong>Anställda:</strong> {data.originalAllabolagData.anstallda}</li>
                          <li><strong>Bolagsform:</strong> {data.originalAllabolagData.bolagsform}</li>
                          <li><strong>Registreringsår:</strong> {data.originalAllabolagData.registreringsaar}</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Processed financial data */}
                <Card>
                  <CardHeader>
                    <CardTitle>📊 Processed Financial Data</CardTitle>
                    <CardDescription>Converted and structured for our system</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {data.financials.map((financial, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold">Year {financial.year}</h4>
                            <Badge variant="secondary">{financial.source}</Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Revenue</p>
                              <p className="font-semibold">{formatCurrency(financial.revenue)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Profit after Financial Items</p>
                              <p className="font-semibold">{formatCurrency(financial.profit)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Net Result</p>
                              <p className="font-semibold">{formatCurrency(financial.net_result)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Equity</p>
                              <p className="font-semibold">{formatCurrency(financial.equity)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Profit Margin</p>
                              <p className="font-semibold">{financial.profit_margin}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Employees</p>
                              <p className="font-semibold">{data.personnel.count}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Implementation details */}
                <Card>
                  <CardHeader>
                    <CardTitle>⚙️ Implementation Strategy</CardTitle>
                    <CardDescription>How this would work in production</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">1. Web Scraping Approach</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li>Fetch HTML from <code>allabolag.se/what/{'{orgNumber}'}</code></li>
                          <li>Use regex patterns to extract financial figures</li>
                          <li>Convert Tkr (thousands SEK) to full SEK amounts</li>
                          <li>Handle rate limiting and error cases gracefully</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">2. Data Integration</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li>Integrate scraping into company creation flow</li>
                          <li>Prioritize scraped data over AI-generated estimates</li>
                          <li>Store source information for transparency</li>
                          <li>Update financial_metrics table with real data</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">3. Org Number Search</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li>Search by company name to find organization numbers</li>
                          <li>Present multiple matches for user selection</li>
                          <li>Auto-populate org number field based on selection</li>
                          <li>Validate format before submission</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">4. Production Considerations</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li>Use proper User-Agent headers to appear as browser</li>
                          <li>Implement retry logic with exponential backoff</li>
                          <li>Consider using Apify or similar service for robustness</li>
                          <li>Cache results to minimize scraping frequency</li>
                          <li>Monitor for website structure changes</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-6">
                    <p className="text-blue-800 text-sm">
                      <strong>Note:</strong> This demonstrates the potential of web scraping for Swedish financial data. 
                      The actual implementation would require careful consideration of legal and technical factors, 
                      rate limiting, and potentially using specialized scraping services like Apify.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
