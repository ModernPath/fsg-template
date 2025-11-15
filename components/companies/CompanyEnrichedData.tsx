/**
 * CompanyEnrichedData Component
 * 
 * Displays enriched company data from all 17 modules
 * Organized in tabs for easy navigation
 */

'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Users, Shield, Target, Building2, DollarSign, AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { 
  CompanyBasicInfo,
  CompanyFinancialData,
  IndustryAnalysis,
  CompetitiveAnalysis,
  GrowthAnalysis,
  FinancialHealth,
  PersonnelInfo,
  MarketIntelligence,
  WebPresence,
  MandAHistory,
  ValuationData,
  CustomerIntelligence,
  OperationalEfficiency,
  CompetitiveAdvantages,
  RiskAssessment,
  IntegrationPotential,
  ExitAttractiveness
} from '@/types/company-enrichment';

interface EnrichedData {
  basicInfo: CompanyBasicInfo;
  financialData: CompanyFinancialData;
  industryAnalysis: IndustryAnalysis;
  competitiveAnalysis: CompetitiveAnalysis;
  growthAnalysis: GrowthAnalysis;
  financialHealth: FinancialHealth;
  personnelInfo: PersonnelInfo;
  marketIntelligence: MarketIntelligence;
  webPresence: WebPresence;
  maHistory: MandAHistory;
  valuationData: ValuationData;
  customerIntelligence: CustomerIntelligence;
  operationalEfficiency: OperationalEfficiency;
  competitiveAdvantages: CompetitiveAdvantages;
  riskAssessment: RiskAssessment;
  integrationPotential: IntegrationPotential;
  exitAttractiveness: ExitAttractiveness;
  confidence_score: number;
  completeness_score: number;
}

interface CompanyEnrichedDataProps {
  companyId: string;
}

export default function CompanyEnrichedData({ companyId }: CompanyEnrichedDataProps) {
  const t = useTranslations('companies.enriched');
  const [data, setData] = useState<EnrichedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEnrichedData = async () => {
      try {
        const res = await fetch(`/api/companies/${companyId}/enriched-data`);
        if (!res.ok) {
          throw new Error('Failed to fetch enriched data');
        }
        const result = await res.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchEnrichedData();
  }, [companyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">{error || t('noData')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quality Indicators */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('confidenceScore')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(data.confidence_score)}%</div>
            <p className="text-xs text-muted-foreground">{t('dataReliability')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('completenessScore')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(data.completeness_score)}%</div>
            <p className="text-xs text-muted-foreground">{t('dataCoverage')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabbed Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="overview">
            <Building2 className="mr-2 h-4 w-4" />
            {t('tabs.overview')}
          </TabsTrigger>
          <TabsTrigger value="financial">
            <DollarSign className="mr-2 h-4 w-4" />
            {t('tabs.financial')}
          </TabsTrigger>
          <TabsTrigger value="market">
            <TrendingUp className="mr-2 h-4 w-4" />
            {t('tabs.market')}
          </TabsTrigger>
          <TabsTrigger value="operations">
            <Users className="mr-2 h-4 w-4" />
            {t('tabs.operations')}
          </TabsTrigger>
          <TabsTrigger value="competitive">
            <Shield className="mr-2 h-4 w-4" />
            {t('tabs.competitive')}
          </TabsTrigger>
          <TabsTrigger value="valuation">
            <Target className="mr-2 h-4 w-4" />
            {t('tabs.valuation')}
          </TabsTrigger>
          <TabsTrigger value="risks">
            <AlertTriangle className="mr-2 h-4 w-4" />
            {t('tabs.risks')}
          </TabsTrigger>
          <TabsTrigger value="exit">
            {t('tabs.exit')}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('basicInfo.title')}</CardTitle>
              <CardDescription>{data.basicInfo.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div><strong>{t('basicInfo.industry')}:</strong> {data.basicInfo.industry}</div>
              <div><strong>{t('basicInfo.founded')}:</strong> {data.basicInfo.founded || t('unknown')}</div>
              <div><strong>{t('basicInfo.employees')}:</strong> {data.basicInfo.employees || t('unknown')}</div>
              {data.basicInfo.website && (
                <div><strong>{t('basicInfo.website')}:</strong> <a href={data.basicInfo.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{data.basicInfo.website}</a></div>
              )}
              {data.basicInfo.products && data.basicInfo.products.length > 0 && (
                <div>
                  <strong>{t('basicInfo.products')}:</strong>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {data.basicInfo.products.map((product, idx) => (
                      <Badge key={idx} variant="secondary">{product}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('industryAnalysis.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div><strong>{t('industryAnalysis.trends')}:</strong> {data.industryAnalysis.trends?.join(', ')}</div>
              <div><strong>{t('industryAnalysis.marketSize')}:</strong> {data.industryAnalysis.marketSize}</div>
              <div><strong>{t('industryAnalysis.growthRate')}:</strong> {data.industryAnalysis.growthRate}</div>
              <div><strong>{t('industryAnalysis.outlook')}:</strong> {data.industryAnalysis.outlook}</div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('financialData.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              {data.financialData.yearly && data.financialData.yearly.length > 0 ? (
                <div className="space-y-4">
                  {data.financialData.yearly.slice(0, 3).map((year, idx) => (
                    <div key={idx} className="rounded-lg border p-4">
                      <h4 className="mb-2 font-semibold">{year.year}</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                        <div>
                          <div className="text-muted-foreground">{t('financialData.revenue')}</div>
                          <div className="font-medium">€{year.revenue?.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">{t('financialData.profit')}</div>
                          <div className="font-medium">€{year.operatingProfit?.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">{t('financialData.assets')}</div>
                          <div className="font-medium">€{year.totalAssets?.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">{t('financialData.equity')}</div>
                          <div className="font-medium">€{year.equity?.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">{t('noFinancialData')}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('financialHealth.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div><strong>{t('financialHealth.profitability')}:</strong> {data.financialHealth.profitability}</div>
              <div><strong>{t('financialHealth.liquidity')}:</strong> {data.financialHealth.liquidity}</div>
              <div><strong>{t('financialHealth.solvency')}:</strong> {data.financialHealth.solvency}</div>
              <div><strong>{t('financialHealth.overall')}:</strong> {data.financialHealth.overallHealth}</div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Market Tab */}
        <TabsContent value="market" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('marketIntelligence.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div><strong>{t('marketIntelligence.position')}:</strong> {data.marketIntelligence.marketPosition}</div>
              <div><strong>{t('marketIntelligence.share')}:</strong> {data.marketIntelligence.estimatedMarketShare}</div>
              <div><strong>{t('marketIntelligence.sentiment')}:</strong> {data.marketIntelligence.customerSentiment}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('competitiveAnalysis.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              {data.competitiveAnalysis.competitors && data.competitiveAnalysis.competitors.length > 0 ? (
                <div className="space-y-2">
                  {data.competitiveAnalysis.competitors.map((competitor, idx) => (
                    <div key={idx} className="rounded-lg border p-3">
                      <div className="font-medium">{competitor.name}</div>
                      <div className="text-sm text-muted-foreground">{competitor.description}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">{t('noCompetitors')}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('personnelInfo.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div><strong>{t('personnelInfo.count')}:</strong> {data.personnelInfo.count}</div>
              <div><strong>{t('personnelInfo.growth')}:</strong> {data.personnelInfo.growthRate}</div>
              {data.personnelInfo.keyPersonnel && data.personnelInfo.keyPersonnel.length > 0 && (
                <div>
                  <strong>{t('personnelInfo.keyPersonnel')}:</strong>
                  <div className="mt-2 space-y-1">
                    {data.personnelInfo.keyPersonnel.map((person, idx) => (
                      <div key={idx} className="text-sm">{person}</div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('operationalEfficiency.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div><strong>{t('operationalEfficiency.revenuePerEmployee')}:</strong> €{data.operationalEfficiency.revenuePerEmployee?.toFixed(0)}</div>
              <div><strong>{t('operationalEfficiency.profitPerEmployee')}:</strong> €{data.operationalEfficiency.profitPerEmployee?.toFixed(0)}</div>
              <div><strong>{t('operationalEfficiency.automation')}:</strong> {data.operationalEfficiency.automationLevel}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('customerIntelligence.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div><strong>{t('customerIntelligence.concentration')}:</strong> {data.customerIntelligence.customerConcentration}</div>
              <div><strong>{t('customerIntelligence.retention')}:</strong> {data.customerIntelligence.customerRetentionRate}</div>
              <div><strong>{t('customerIntelligence.recurring')}:</strong> {data.customerIntelligence.recurringRevenue}</div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Competitive Tab */}
        <TabsContent value="competitive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('competitiveAdvantages.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.competitiveAdvantages.uniqueSellingPoints && data.competitiveAdvantages.uniqueSellingPoints.length > 0 && (
                <div>
                  <strong>{t('competitiveAdvantages.usp')}:</strong>
                  <ul className="mt-2 list-inside list-disc space-y-1">
                    {data.competitiveAdvantages.uniqueSellingPoints.map((usp, idx) => (
                      <li key={idx}>{usp}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div><strong>{t('competitiveAdvantages.brand')}:</strong> {data.competitiveAdvantages.brandStrength}</div>
              <div><strong>{t('competitiveAdvantages.switching')}:</strong> {data.competitiveAdvantages.switchingCosts}</div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Valuation Tab */}
        <TabsContent value="valuation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('valuationData.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.valuationData.estimatedValue && (
                <>
                  <div><strong>{t('valuationData.low')}:</strong> €{data.valuationData.estimatedValue.low?.toLocaleString()}</div>
                  <div><strong>{t('valuationData.mid')}:</strong> €{data.valuationData.estimatedValue.mid?.toLocaleString()}</div>
                  <div><strong>{t('valuationData.high')}:</strong> €{data.valuationData.estimatedValue.high?.toLocaleString()}</div>
                </>
              )}
              {data.valuationData.comparableTransactions && data.valuationData.comparableTransactions.length > 0 && (
                <div>
                  <strong>{t('valuationData.comparables')}:</strong>
                  <div className="mt-2 space-y-2">
                    {data.valuationData.comparableTransactions.map((comp, idx) => (
                      <div key={idx} className="rounded border p-2 text-sm">
                        <div className="font-medium">{comp.target}</div>
                        <div className="text-muted-foreground">{comp.date} - {comp.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('maHistory.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              {data.maHistory.previousAcquisitions && data.maHistory.previousAcquisitions.length > 0 ? (
                <div className="space-y-2">
                  <strong>{t('maHistory.acquisitions')}:</strong>
                  {data.maHistory.previousAcquisitions.map((acq, idx) => (
                    <div key={idx} className="rounded border p-2 text-sm">
                      <div className="font-medium">{acq.target} ({acq.year})</div>
                      <div className="text-muted-foreground">{acq.value}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">{t('maHistory.noAcquisitions')}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risks Tab */}
        <TabsContent value="risks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('riskAssessment.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              {data.riskAssessment.keyRisks && data.riskAssessment.keyRisks.length > 0 ? (
                <div className="space-y-3">
                  {data.riskAssessment.keyRisks.map((risk, idx) => (
                    <div key={idx} className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={risk.severity === 'HIGH' ? 'destructive' : risk.severity === 'MEDIUM' ? 'default' : 'secondary'}>
                          {risk.severity}
                        </Badge>
                        <span className="font-medium">{risk.risk}</span>
                      </div>
                      {risk.mitigation && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          <strong>{t('riskAssessment.mitigation')}:</strong> {risk.mitigation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">{t('riskAssessment.noRisks')}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exit Tab */}
        <TabsContent value="exit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('exitAttractiveness.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.exitAttractiveness.idealBuyerProfile && data.exitAttractiveness.idealBuyerProfile.length > 0 && (
                <div>
                  <strong>{t('exitAttractiveness.buyers')}:</strong>
                  <ul className="mt-2 list-inside list-disc space-y-1">
                    {data.exitAttractiveness.idealBuyerProfile.map((buyer, idx) => (
                      <li key={idx}>{buyer}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div><strong>{t('exitAttractiveness.strategicValue')}:</strong> {data.exitAttractiveness.strategicValue}</div>
              <div><strong>{t('exitAttractiveness.timing')}:</strong> {data.exitAttractiveness.timing}</div>
              <div><strong>{t('exitAttractiveness.market')}:</strong> {data.exitAttractiveness.marketConditions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('integrationPotential.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.integrationPotential.synergies && (
                <div>
                  <strong>{t('integrationPotential.synergies')}:</strong>
                  <div className="mt-2 space-y-2">
                    {data.integrationPotential.synergies.revenueSynergies && data.integrationPotential.synergies.revenueSynergies.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">{t('integrationPotential.revenue')}:</div>
                        <ul className="mt-1 list-inside list-disc text-sm">
                          {data.integrationPotential.synergies.revenueSynergies.map((syn, idx) => (
                            <li key={idx}>{syn}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {data.integrationPotential.synergies.costSynergies && data.integrationPotential.synergies.costSynergies.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">{t('integrationPotential.cost')}:</div>
                        <ul className="mt-1 list-inside list-disc text-sm">
                          {data.integrationPotential.synergies.costSynergies.map((syn, idx) => (
                            <li key={idx}>{syn}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div><strong>{t('integrationPotential.complexity')}:</strong> {data.integrationPotential.integrationComplexity}</div>
              <div><strong>{t('integrationPotential.cultural')}:</strong> {data.integrationPotential.culturalFit}</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

