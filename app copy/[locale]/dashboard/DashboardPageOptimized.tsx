'use client'

import React, { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter, useParams } from 'next/navigation'
import { 
  useDashboardData, 
  useProcessedChartData, 
  useInvalidateDashboardData,
  type FinancialMetrics,
  type YearlyFinancialData,
  type CurrentFinancialRatios
} from '@/hooks/useDashboardQueries'

// Import existing components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  AlertCircle,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  Building2,
  Download,
  Eye as EyeIcon,
  Info,
  CheckCircle,
  Clock,
  XCircle,
  HelpCircle
} from 'lucide-react'

// Import new dashboard components
import { CompanyOverview } from '@/components/dashboard/CompanyOverview'
import { FundingRecommendations } from '@/components/dashboard/FundingRecommendations'
import { AdvancedFinancialCharts } from '@/components/dashboard/AdvancedFinancialCharts'
import { ReportExport } from '@/components/dashboard/ReportExport'
import FundabilityAnalysis from '@/components/dashboard/FundabilityAnalysis'
import { AIFinancialSummary } from '@/components/dashboard/AIFinancialSummary'

// Import Sprint 2 components
import { NoFinancialData, NoApplications, NoRecommendations } from '@/components/dashboard/EmptyStates'
import { DataQualityBadge, calculateDataQuality } from '@/components/dashboard/DataQualityBadge'
import { DashboardHero } from '@/components/dashboard/DashboardHero'
import { ActionItems } from '@/components/dashboard/ActionItems'

// Import Sprint 3 components
import { DashboardSkeleton } from '@/components/dashboard/skeletons'
import { DashboardErrorBoundary } from '@/components/dashboard/ErrorBoundary'

interface DashboardPageOptimizedProps {
  // Props for backward compatibility if needed
}

export default function DashboardPageOptimized({}: DashboardPageOptimizedProps) {
  console.log('🚀 ========== DASHBOARD COMPONENT MOUNTED ==========')
  
  // Hooks
  const t = useTranslations('Dashboard')
  const tCommon = useTranslations('Common')
  const { session, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  
  console.log('🔐 Auth status:', { 
    hasSession: !!session, 
    loading: authLoading,
    userId: session?.user?.id 
  })

  // State for UI
  const [selectedYearIndex, setSelectedYearIndex] = useState(0)
  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null)

  // React Query hooks
  const { 
    data: dashboardData, 
    isLoading, 
    error: dashboardError,
    refetch: refetchDashboard 
  } = useDashboardData()

  const {
    yearlyData,
    latestRatios,
    hasData,
    sortedMetrics,
    isLoading: chartDataLoading,
    error: chartDataError
  } = useProcessedChartData()

  const { invalidateAll } = useInvalidateDashboardData()

  // Derived state
  const companyId = dashboardData?.company_id
  const recentDocuments = dashboardData?.documents || []
  const recommendations = dashboardData?.recommendations
  const fundingApplications = dashboardData?.funding_applications || []
  const allFinancialMetrics = sortedMetrics || []
  
  // Calculate already applied funding types (excluding rejected and cancelled)
  const appliedFundingTypes = React.useMemo(() => {
    return fundingApplications
      .filter(app => app.status !== 'rejected' && app.status !== 'cancelled' && app.status !== 'withdrawn')
      .map(app => app.type) // Use 'type' not 'funding_type'
      .filter(Boolean) as string[]
  }, [fundingApplications])

  // Selected year metrics
  const selectedMetrics = useMemo(() => {
    if (!allFinancialMetrics || allFinancialMetrics.length === 0) return null
    return allFinancialMetrics[selectedYearIndex] || allFinancialMetrics[0]
  }, [allFinancialMetrics, selectedYearIndex])

  // Debug logging
  React.useEffect(() => {
    console.log('📊 Dashboard Data:', {
      hasData: !!dashboardData,
      companyId,
      documentsCount: recentDocuments.length,
      metricsCount: allFinancialMetrics.length,
      recommendationsCount: recommendations?.recommendation_details?.length || 0,
      applicationsCount: fundingApplications.length,
      hasFinancialData: hasData,
      latestMetrics: selectedMetrics,
      fullDashboardData: dashboardData
    })
  }, [dashboardData, companyId, recentDocuments, allFinancialMetrics, recommendations, fundingApplications, hasData, selectedMetrics])

  // Handle authentication redirect
  React.useEffect(() => {
    if (!authLoading && !session) {
      router.push(`/${locale}/auth/sign-in`)
    }
  }, [session, authLoading, router, locale])

  // Handle refresh
  const handleRefresh = React.useCallback(async () => {
    console.log('🔄 Refresh button clicked')
    try {
      const result = await refetchDashboard()
      console.log('✅ Refresh completed:', {
        status: result.status,
        hasData: !!result.data,
        error: result.error
      })
    } catch (error) {
      console.error('❌ Refresh failed:', error)
    }
  }, [refetchDashboard])

  // Handle document preview
  const handlePreviewDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/user-preview`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to preview document');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      // Cleanup after a delay (5 seconds)
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 5000);
      
    } catch (err) {
      console.error('Error previewing document:', err);
      alert(err instanceof Error ? err.message : 'Failed to preview document');
    }
  }

  // Handle document download
  const handleDownloadDocument = async (documentId: string, documentName: string) => {
    try {
      setDownloadingDoc(documentId);
      
      const response = await fetch(`/api/documents/${documentId}/user-download`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to download document');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = documentName;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (err) {
      console.error('Error downloading document:', err);
      alert(err instanceof Error ? err.message : 'Failed to download document');
    } finally {
      setDownloadingDoc(null);
    }
  }

  // Calculate data quality
  const dataQuality = React.useMemo(() => {
    return calculateDataQuality(dashboardData)
  }, [dashboardData])

  // Loading state with skeleton
  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto py-8">
        <DashboardSkeleton />
      </div>
    )
  }

  // Error state
  if (dashboardError) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {dashboardError.message || tCommon('errors.loadDataFailed')}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              className="ml-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {tCommon('retry')}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // No authentication
  if (!session) {
    return null
  }

  return (
    <DashboardErrorBoundary>
      <div className="container mx-auto py-8 space-y-8">
        {/* Dashboard Hero with Data Quality */}
        <DashboardHero
          companyName={dashboardData?.company?.name || 'Company'}
          userName={session?.user?.email?.split('@')[0]}
          dataQuality={dataQuality}
        />

      {/* Onboarding Progress - TODO: Implement if needed */}
      {/* <OnboardingProgress /> */}

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('stats.totalDocuments', { default: 'Documents' })}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentDocuments.length}</div>
            <p className="text-xs text-muted-foreground">
              {t('stats.recentUploads', { default: 'Recent uploads' })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('stats.fundingApplications', { default: 'Applications' })}
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fundingApplications.length}</div>
            <p className="text-xs text-muted-foreground">
              {t('stats.totalApplications', { default: 'Total applications' })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('stats.latestRevenue', { default: 'Latest Revenue' })}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {selectedMetrics?.revenue && selectedMetrics.revenue > 0
                ? `€${(selectedMetrics.revenue / 1000).toFixed(0)}k`
                : '€0'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedMetrics?.fiscal_year || 'No data'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('stats.recommendations', { default: 'Recommendations' })}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recommendations?.recommendation_details?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('stats.activeRecommendations', { default: 'Active recommendations' })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{t('tabs.overview', { default: 'Overview' })}</TabsTrigger>
          <TabsTrigger value="financials">{t('tabs.financials', { default: 'Financials' })}</TabsTrigger>
          <TabsTrigger value="advanced">
            <BarChart3 className="h-4 w-4 mr-2" />
            {t('tabs.advanced', { default: 'Advanced Analysis' })}
          </TabsTrigger>
          <TabsTrigger value="documents">{t('tabs.documents', { default: 'Documents' })}</TabsTrigger>
          <TabsTrigger value="applications">{t('tabs.applications', { default: 'Applications' })}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Company Overview */}
          <CompanyOverview
            companyName={dashboardData?.company?.name}
            businessId={dashboardData?.company?.business_id}
            industry={dashboardData?.company?.industry}
            employeeCount={dashboardData?.company?.employee_count}
            latestRevenue={selectedMetrics?.revenue}
            latestProfit={selectedMetrics?.ebitda}
            totalAssets={selectedMetrics?.total_assets}
            applicationCount={fundingApplications.length}
            documentsCount={recentDocuments.length}
            recommendationsCount={recommendations?.recommendation_details?.length || 0}
            fundingApplications={fundingApplications}
            // Extended financial metrics
            operatingProfit={selectedMetrics?.operating_profit}
            revenueGrowth={selectedMetrics?.revenue_growth_pct}
            totalEquity={selectedMetrics?.total_equity}
            grossMargin={selectedMetrics?.gross_margin}
            equityRatio={selectedMetrics?.equity_ratio_pct}
            debtRatio={selectedMetrics?.debt_ratio_pct}
            quickRatio={selectedMetrics?.quick_ratio}
            debtToEquity={selectedMetrics?.debt_to_equity_ratio}
            currentRatio={selectedMetrics?.current_ratio}
            dscr={selectedMetrics?.dscr}
            roe={selectedMetrics?.return_on_equity}
            // Previous year data for trends
            previousRevenue={sortedMetrics?.[1]?.revenue}
            previousProfit={sortedMetrics?.[1]?.ebitda}
            previousAssets={sortedMetrics?.[1]?.total_assets}
          />

          {/* AI Financial Summary - Editable and Interactive */}
          {hasData && sortedMetrics && sortedMetrics.length > 0 && (
            <AIFinancialSummary
              metrics={sortedMetrics}
              companyName={dashboardData?.company?.name}
              locale={locale}
            />
          )}

          {/* Fundability Analysis */}
          <FundabilityAnalysis
            company={dashboardData?.company as any || null}
            latestMetrics={selectedMetrics || null}
            hasFinancialData={hasData}
          />

          {/* All Funding Recommendations */}
          {recommendations?.recommendation_details && recommendations.recommendation_details.length > 0 && (
            <FundingRecommendations
              recommendations={recommendations.recommendation_details as any}
              summary={recommendations.summary}
              analysis={recommendations.analysis}
              companyId={companyId}
              appliedFundingTypes={appliedFundingTypes}
            />
          )}

          {/* Financial Charts */}
          {hasData ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    {t('charts.revenueGrowth', { default: 'Revenue Growth' })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={yearlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fiscal_year" />
                      <YAxis />
                      <RechartsTooltip 
                        formatter={(value: number) => [`€${(value / 1000).toFixed(0)}k`, 'Revenue']}
                      />
                      <Bar dataKey="revenue" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4" />
                    {t('charts.financialRatios', { default: 'Financial Ratios' })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {latestRatios.currentRatio && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-between cursor-help">
                              <div className="flex items-center gap-1">
                                <span className="text-sm">{t('ratios.currentRatio', { default: 'Current Ratio' })}</span>
                                <HelpCircle className="h-3 w-3 text-muted-foreground" />
                              </div>
                              <Badge variant={latestRatios.currentRatio > 1 ? 'default' : 'destructive'}>
                                {latestRatios.currentRatio.toFixed(2)}
                              </Badge>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="font-semibold mb-1">Current Ratio (Maksuvalmius)</p>
                            <p className="text-xs mb-2">Mittaa yrityksen kykyä maksaa lyhytaikaiset velat vaihto-omaisuudella ja rahavaroilla.</p>
                            <p className="text-xs font-mono bg-muted p-1 rounded">
                              Vaihto-omaisuus ÷ Lyhytaikaiset velat
                            </p>
                            <p className="text-xs mt-2 text-muted-foreground">
                              Hyvä: &gt;2.0 | Tyydyttävä: 1.0-2.0 | Heikko: &lt;1.0
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {latestRatios.quickRatio && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-between cursor-help">
                              <div className="flex items-center gap-1">
                                <span className="text-sm">{t('ratios.quickRatio', { default: 'Quick Ratio' })}</span>
                                <HelpCircle className="h-3 w-3 text-muted-foreground" />
                              </div>
                              <Badge variant={latestRatios.quickRatio > 1 ? 'default' : 'destructive'}>
                                {latestRatios.quickRatio.toFixed(2)}
                              </Badge>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="font-semibold mb-1">Quick Ratio (Happotesti)</p>
                            <p className="text-xs mb-2">Mittaa yrityksen kykyä maksaa lyhytaikaiset velat nopeasti rahaksi muutettavilla varoilla.</p>
                            <p className="text-xs font-mono bg-muted p-1 rounded">
                              (Rahat + Myyntisaamiset) ÷ Lyhytaikaiset velat
                            </p>
                            <p className="text-xs mt-2 text-muted-foreground">
                              Erinomainen: &gt;1.0 | Tyydyttävä: 0.5-1.0 | Heikko: &lt;0.5
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {latestRatios.roe && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-between cursor-help">
                              <div className="flex items-center gap-1">
                                <span className="text-sm">{t('ratios.roe', { default: 'ROE' })}</span>
                                <HelpCircle className="h-3 w-3 text-muted-foreground" />
                              </div>
                              <Badge variant={latestRatios.roe > 0 ? 'default' : 'destructive'}>
                                {latestRatios.roe.toFixed(1)}%
                              </Badge>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="font-semibold mb-1">ROE - Return on Equity</p>
                            <p className="text-xs mb-2">Mittaa kuinka tehokkaasti yritys käyttää omaa pääomaansa tuoton saavuttamiseen.</p>
                            <p className="text-xs font-mono bg-muted p-1 rounded">
                              (Nettotulos ÷ Oma pääoma) × 100
                            </p>
                            <p className="text-xs mt-2 text-muted-foreground">
                              Erinomainen: &gt;15% | Hyvä: 10-15% | Tyydyttävä: &lt;10%
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {latestRatios.dscr && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-between cursor-help">
                              <div className="flex items-center gap-1">
                                <span className="text-sm">{t('ratios.dscr', { default: 'DSCR' })}</span>
                                <HelpCircle className="h-3 w-3 text-muted-foreground" />
                              </div>
                              <Badge variant={latestRatios.dscr >= 1.25 ? 'default' : latestRatios.dscr >= 1.0 ? 'secondary' : 'destructive'}>
                                {latestRatios.dscr.toFixed(2)}
                              </Badge>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="font-semibold mb-1">DSCR - Velanhoitokyky</p>
                            <p className="text-xs mb-2">Mittaa yrityksen kykyä maksaa velkansa kassavirralla. Rahoittajat arvioivat tällä lainanmaksukykyä.</p>
                            <p className="text-xs font-mono bg-muted p-1 rounded">
                              EBITDA ÷ (Korot + Lainojen lyhennykset)
                            </p>
                            <p className="text-xs mt-2 text-muted-foreground">
                              Hyvä: ≥1.25 | Kohtalainen: 1.0-1.25 | Heikko: &lt;1.0
                            </p>
                            <p className="text-xs mt-1 text-amber-600">
                              ⚠️ Laskettu arvioilla (5% korko, 5v lyhennys)
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {t('noData.title', { default: 'No Financial Data' })}
                  </h3>
                  <p className="text-muted-foreground">
                    {t('noData.description', { default: 'Upload financial documents to see charts and insights' })}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="financials" className="space-y-4">
          {/* Year selector */}
          {allFinancialMetrics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('financials.yearSelector', { default: 'Select Year' })}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  {allFinancialMetrics.map((metric, index) => (
                    <Button
                      key={metric.id}
                      variant={selectedYearIndex === index ? 'default' : 'outline'}
                      onClick={() => setSelectedYearIndex(index)}
                    >
                      {metric.fiscal_year}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Selected year details */}
          {selectedMetrics && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{t('metrics.revenue', { default: 'Revenue' })}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    €{selectedMetrics.revenue && selectedMetrics.revenue > 0 
                      ? (selectedMetrics.revenue / 1000).toFixed(0) 
                      : '0'}k
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{t('metrics.ebitda', { default: 'EBITDA' })}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    €{selectedMetrics.ebitda && selectedMetrics.ebitda > 0 
                      ? (selectedMetrics.ebitda / 1000).toFixed(0) 
                      : '0'}k
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{t('metrics.totalAssets', { default: 'Total Assets' })}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    €{selectedMetrics.total_assets && selectedMetrics.total_assets > 0 
                      ? (selectedMetrics.total_assets / 1000).toFixed(0) 
                      : '0'}k
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          {hasData && yearlyData && yearlyData.length > 0 ? (
            <>
              <div className="flex justify-end mb-4">
                <ReportExport
                  data={yearlyData.map(item => ({
                    fiscalYear: item.fiscal_year,
                    revenue: item.revenue || undefined,
                    ebitda: item.ebitda || undefined,
                    netProfit: undefined,
                    totalAssets: item.totalAssets || undefined,
                    totalEquity: item.totalEquity || undefined,
                    totalLiabilities: undefined,
                    cashAndEquivalents: item.cashAndReceivables || undefined,
                    dso: item.dso || undefined,
                    currentRatio: latestRatios.currentRatio || undefined,
                    quickRatio: latestRatios.quickRatio || undefined,
                    debtToEquity: item.debtToEquity || undefined,
                    dscr: item.dscr || undefined,
                    roe: item.roe || undefined
                  }))}
                  companyName={dashboardData?.company_id || 'Yritys'}
                  currency="EUR"
                />
              </div>
              <AdvancedFinancialCharts
                data={yearlyData.map(item => ({
                  fiscal_year: item.fiscal_year,
                  revenue: item.revenue || undefined,
                  ebitda: item.ebitda || undefined,
                  netProfit: item.netProfit || undefined,
                  totalAssets: item.totalAssets || undefined,
                  totalEquity: item.totalEquity || undefined,
                  totalLiabilities: item.totalLiabilities || undefined,
                  cashAndEquivalents: item.cashAndReceivables || undefined,
                  dso: item.dso || undefined,
                  currentRatio: latestRatios.currentRatio || undefined,
                  quickRatio: latestRatios.quickRatio || undefined,
                  debtToEquity: item.debtToEquity || undefined,
                  dscr: item.dscr || undefined,
                  roe: item.roe || undefined
                }))}
                currency="EUR"
                locale={locale}
              />
            </>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">
                    {t('advancedCharts.noData', { default: 'Lataa taloustietoja nähdäksesi kehittyneet analyysit' })}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t('documents.title', { default: 'Dokumentit' })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentDocuments && recentDocuments.length > 0 ? (
                <div className="space-y-4">
                  {recentDocuments.map((doc: any, index: number) => (
                    <div key={doc.id || index} className="border rounded-lg p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg">{doc.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {doc.document_types?.name || 'Tuntematon tyyppi'}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePreviewDocument(doc.id)}
                                  className="gap-2"
                                >
                                  <EyeIcon className="h-4 w-4" />
                                  {t('documents.preview', { default: 'Esikatsele' })}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{t('documents.previewTooltip', { default: 'Avaa dokumentti uuteen välilehteen' })}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleDownloadDocument(doc.id, doc.name)}
                                  disabled={downloadingDoc === doc.id}
                                  className="gap-2"
                                >
                                  <Download className="h-4 w-4" />
                                  {downloadingDoc === doc.id ? 
                                    t('documents.downloading', { default: 'Ladataan...' }) : 
                                    t('documents.download', { default: 'Lataa' })
                                  }
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{t('documents.downloadTooltip', { default: 'Lataa dokumentti tietokoneellesi' })}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                          <Info className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">
                              {t('documents.fileSize', { default: 'Tiedostokoko' })}
                            </p>
                            <p className="text-sm font-medium">
                              {doc.file_size ? `${(doc.file_size / (1024 * 1024)).toFixed(2)} MB` : 'Tuntematon'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">
                              {t('documents.fiscalYear', { default: 'Tilikausi' })}
                            </p>
                            <p className="text-sm font-medium">
                              {doc.fiscal_year ? `${doc.fiscal_year} (${doc.fiscal_period || 'annual'})` : 'Ei määritelty'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {doc.processing_status === 'completed' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : doc.processing_status === 'processing' ? (
                            <Clock className="h-4 w-4 text-yellow-500" />
                          ) : doc.processing_status === 'failed' ? (
                            <XCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div>
                            <p className="text-xs text-muted-foreground">
                              {t('documents.status', { default: 'Käsittelytila' })}
                            </p>
                            <Badge variant={doc.processed ? 'default' : 'secondary'}>
                              {doc.processing_status === 'completed' ? t('documents.statusCompleted', { default: 'Valmis' }) :
                               doc.processing_status === 'processing' ? t('documents.statusProcessing', { default: 'Käsitellään' }) :
                               doc.processing_status === 'failed' ? t('documents.statusFailed', { default: 'Epäonnistui' }) :
                               doc.processing_status === 'pending' ? t('documents.statusPending', { default: 'Odottaa' }) : 
                               t('documents.statusUnknown', { default: 'Tuntematon' })}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">
                              {t('documents.uploaded', { default: 'Ladattu' })}
                            </p>
                            <p className="text-sm font-medium">
                              {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString('fi-FI') : 'Tuntematon'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Info className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">
                              {t('documents.mimeType', { default: 'MIME-tyyppi' })}
                            </p>
                            <p className="text-sm font-medium">
                              {doc.mime_type || 'Tuntematon'}
                            </p>
                          </div>
                        </div>
                        
                        {doc.fiscal_period && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">
                                {t('documents.period', { default: 'Jakso' })}
                              </p>
                              <p className="text-sm font-medium">{doc.fiscal_period}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {t('documents.noDocuments', { default: 'Ei dokumentteja löytynyt' })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t('documents.noDocumentsDescription', { default: 'Lataa dokumentteja analysoitavaksi' })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications" className="space-y-4" id="funding-applications">
          <Card>
            <CardHeader>
              <CardTitle>{t('applications.title', { default: 'Funding Applications' })}</CardTitle>
            </CardHeader>
            <CardContent>
              {fundingApplications.length > 0 ? (
                <div className="space-y-2">
                  {fundingApplications.map((app) => {
                    // Map funding type to localized name - convert snake_case to camelCase
                    const snakeToCamel = (str: string) => str.replace(/_([a-z])/g, (g) => g[1].toUpperCase())
                    const typeKey = app.type ? `fundingTypes.${snakeToCamel(app.type)}` : 'fundingTypes.businessLoan'
                    const typeName = t(typeKey, { 
                      default: app.type 
                        ? app.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                        : 'Rahoitushakemus'
                    })
                    
                    const isDraft = app.status === 'draft'
                    const canEdit = isDraft
                    const statusVariant = app.status === 'approved' ? 'default' : 
                                        app.status === 'rejected' ? 'destructive' :
                                        app.status === 'draft' ? 'secondary' : 'secondary'
                    
                    return (
                    <div 
                      key={app.id} 
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => {
                        if (canEdit) {
                          // Navigate to edit/continue application
                          router.push(`/${locale}/dashboard/applications/${app.id}/edit`)
                        } else {
                          // Navigate to view-only application
                          router.push(`/${locale}/dashboard/applications/${app.id}`)
                        }
                      }}
                    >
                      <div className="flex-1">
                        <div className="font-semibold flex items-center gap-2">
                          {typeName}
                          {canEdit && (
                            <Badge variant="outline" className="text-xs">
                              {t('applications.draft', { default: 'Luonnos' })}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {app.amount && app.amount > 0 
                            ? `€${(Number(app.amount) / 1000).toFixed(0)}k haettu`
                            : 'Summa ei saatavilla'
                          }
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={statusVariant}>
                          {t(`applications.status.${app.status}`, { default: app.status })}
                        </Badge>
                        {canEdit ? (
                          <Button variant="ghost" size="sm" onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/${locale}/dashboard/applications/${app.id}/edit`)
                          }}>
                            {t('applications.continue', { default: 'Jatka' })}
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/${locale}/dashboard/applications/${app.id}`)
                          }}>
                            {t('applications.view', { default: 'Näytä' })}
                          </Button>
                        )}
                      </div>
                    </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {t('applications.noApplications', { default: 'No funding applications yet' })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Items */}
      {dashboardData && (
        <ActionItems dashboardData={dashboardData} />
      )}
    </div>
    </DashboardErrorBoundary>
  )
}
