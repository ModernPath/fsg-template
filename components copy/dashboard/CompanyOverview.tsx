'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  Building2, 
  TrendingUp, 
  TrendingDown,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  HelpCircle
} from 'lucide-react'

interface CompanyOverviewProps {
  companyName?: string
  businessId?: string
  industry?: string
  employeeCount?: number
  latestRevenue?: number
  latestProfit?: number
  totalAssets?: number
  applicationCount?: number
  documentsCount?: number
  recommendationsCount?: number
  fundingApplications?: Array<{
    id: string
    status: string
    amount: number | string
    type?: string
  }>
  // Extended financial metrics
  operatingProfit?: number
  revenueGrowth?: number  // Percentage
  totalEquity?: number
  grossMargin?: number
  equityRatio?: number  // Percentage
  debtRatio?: number  // Percentage
  quickRatio?: number
  debtToEquity?: number
  currentRatio?: number
  dscr?: number  // Debt Service Coverage Ratio
  roe?: number  // Percentage
  // Previous year data for trends
  previousRevenue?: number
  previousProfit?: number
  previousAssets?: number
}

export function CompanyOverview({
  companyName = 'Your Company',
  businessId,
  industry,
  employeeCount,
  latestRevenue = 0,
  latestProfit = 0,
  totalAssets = 0,
  applicationCount = 0,
  documentsCount = 0,
  recommendationsCount = 0,
  fundingApplications = [],
  // Extended financial metrics
  operatingProfit = 0,
  revenueGrowth,
  totalEquity = 0,
  grossMargin,
  equityRatio,
  debtRatio,
  quickRatio,
  debtToEquity,
  currentRatio,
  dscr,
  roe,
  // Previous year data
  previousRevenue,
  previousProfit,
  previousAssets
}: CompanyOverviewProps) {
  const t = useTranslations('Dashboard')

  // Calculate application statuses
  const pendingApps = fundingApplications.filter(app => 
    app.status === 'pending' || app.status === 'submitted' || app.status === 'processing'
  ).length
  const approvedApps = fundingApplications.filter(app => 
    app.status === 'approved'
  ).length
  const rejectedApps = fundingApplications.filter(app => 
    app.status === 'rejected'
  ).length

  // Calculate health score (0-100)
  const healthScore = React.useMemo(() => {
    let score = 50 // Base score
    
    // Financial health (40 points)
    if (latestRevenue > 0) score += 10
    if (latestProfit > 0) score += 15
    if (totalAssets > latestRevenue) score += 15

    // Activity score (30 points)
    if (documentsCount > 0) score += 10
    if (applicationCount > 0) score += 10
    if (recommendationsCount > 0) score += 10

    // Application success rate (20 points)
    if (applicationCount > 0) {
      const successRate = approvedApps / applicationCount
      score += Math.floor(successRate * 20)
    }

    return Math.min(100, Math.max(0, score))
  }, [latestRevenue, latestProfit, totalAssets, documentsCount, applicationCount, recommendationsCount, approvedApps])

  const getHealthStatus = () => {
    if (healthScore >= 80) return { 
      label: t('overview.healthExcellent', { default: 'Excellent' }), 
      variant: 'default' as const,
      color: 'text-green-600'
    }
    if (healthScore >= 60) return { 
      label: t('overview.healthGood', { default: 'Good' }), 
      variant: 'secondary' as const,
      color: 'text-blue-600'
    }
    if (healthScore >= 40) return { 
      label: t('overview.healthFair', { default: 'Fair' }), 
      variant: 'outline' as const,
      color: 'text-yellow-600'
    }
    return { 
      label: t('overview.healthPoor', { default: 'Needs Attention' }), 
      variant: 'destructive' as const,
      color: 'text-red-600'
    }
  }

  const healthStatus = getHealthStatus()

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) {
      return '€0'
    }
    if (value >= 1_000_000) {
      return `€${(value / 1_000_000).toFixed(1)}M`
    }
    if (value >= 1_000) {
      return `€${(value / 1_000).toFixed(0)}k`
    }
    return `€${Math.round(value)}`
  }

  // Calculate percentage change
  const calculateChange = (current?: number, previous?: number): { percent: number, isPositive: boolean } | null => {
    if (!current || !previous || previous === 0) return null
    const change = ((current - previous) / previous) * 100
    return {
      percent: Math.abs(change),
      isPositive: change > 0
    }
  }

  // Format percentage
  const formatPercent = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) return '-'
    return `${value.toFixed(1)}%`
  }

  // Format ratio
  const formatRatio = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) return '-'
    return value.toFixed(2)
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-gold-primary/10 to-gold-highlight/10">
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {t('overview.title', { default: 'Company Overview' })}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-2">{companyName}</h3>
            <div className="flex flex-wrap gap-2">
              {businessId && (
                <Badge variant="outline">
                  {t('overview.businessId', { default: 'Y-tunnus' })}: {businessId}
                </Badge>
              )}
              {industry && (
                <Badge variant="outline">
                  {industry}
                </Badge>
              )}
              {employeeCount && employeeCount > 0 && (
                <Badge variant="outline">
                  {employeeCount} {t('overview.employees', { default: 'employees' })}
                </Badge>
              )}
            </div>
          </div>

          {/* Health Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {t('overview.healthScore', { default: 'Company Health Score' })}
              </span>
              <Badge variant={healthStatus.variant} className={healthStatus.color}>
                {healthScore}/100 - {healthStatus.label}
              </Badge>
            </div>
            <Progress value={healthScore} className="h-2" />
          </div>

          {/* Financial Summary - Expanded */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">
              {t('overview.financialHighlights', { default: 'Financial Highlights' })}
            </h4>
            
            {/* Primary Metrics - 3 columns */}
            <div className="grid grid-cols-3 gap-4">
              {/* Revenue */}
              <div className="space-y-1 p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">
                  {t('overview.latestRevenue', { default: 'Liikevaihto' })}
                </p>
                <p className="text-lg font-bold flex items-center gap-2">
                  {formatCurrency(latestRevenue)}
                  {(() => {
                    const change = calculateChange(latestRevenue, previousRevenue)
                    if (change) {
                      return (
                        <span className={`text-xs font-normal flex items-center gap-1 ${change.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {change.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {formatPercent(change.percent)}
                        </span>
                      )
                    }
                    return null
                  })()}
                </p>
                {revenueGrowth !== undefined && revenueGrowth !== null && (
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    {t('overview.growth', { default: 'Kasvu' })}: {formatPercent(revenueGrowth)}
                  </p>
                )}
              </div>

              {/* Operating Profit / EBITDA */}
              <div className="space-y-1 p-3 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 border border-green-200 dark:border-green-800">
                <p className="text-xs text-green-700 dark:text-green-400 font-medium">
                  {operatingProfit ? t('overview.operatingProfit', { default: 'Liikevoitto' }) : t('overview.latestProfit', { default: 'EBITDA' })}
                </p>
                <p className="text-lg font-bold flex items-center gap-2">
                  {formatCurrency(operatingProfit || latestProfit)}
                  {(() => {
                    const current = operatingProfit || latestProfit
                    const previous = previousProfit
                    const change = calculateChange(current, previous)
                    if (change) {
                      return (
                        <span className={`text-xs font-normal flex items-center gap-1 ${change.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {change.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {formatPercent(change.percent)}
                        </span>
                      )
                    }
                    return (operatingProfit || latestProfit) > 0 ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />
                  })()}
                </p>
              </div>

              {/* ROE */}
              <div className="space-y-1 p-3 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 border border-purple-200 dark:border-purple-800">
                <p className="text-xs text-purple-700 dark:text-purple-400 font-medium">
                  {t('overview.roe', { default: 'ROE' })}
                </p>
                <p className="text-lg font-bold">
                  {formatPercent(roe)}
                </p>
              </div>
            </div>

            {/* Secondary Metrics - 4 columns */}
            <div className="grid grid-cols-4 gap-3">
              {/* Total Assets */}
              <div className="space-y-1 p-2.5 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">
                  {t('overview.totalAssets', { default: 'Varat' })}
                </p>
                <p className="text-sm font-bold flex items-center gap-1.5">
                  {formatCurrency(totalAssets)}
                  {(() => {
                    const change = calculateChange(totalAssets, previousAssets)
                    if (change) {
                      return (
                        <span className={`text-xs font-normal ${change.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {change.isPositive ? '↑' : '↓'}{formatPercent(change.percent)}
                        </span>
                      )
                    }
                    return null
                  })()}
                </p>
              </div>

              {/* Total Equity */}
              <div className="space-y-1 p-2.5 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">
                  {t('overview.totalEquity', { default: 'Oma pääoma' })}
                </p>
                <p className="text-sm font-bold">
                  {formatCurrency(totalEquity)}
                </p>
              </div>

              {/* Gross Margin */}
              {grossMargin !== undefined && grossMargin !== null && (
                <div className="space-y-1 p-2.5 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">
                    {t('overview.grossMargin', { default: 'Bruttokate' })}
                  </p>
                  <p className="text-sm font-bold">
                    {formatCurrency(grossMargin)}
                  </p>
                </div>
              )}

              {/* Current Ratio */}
              {currentRatio !== undefined && currentRatio !== null && (
                <div className="space-y-1 p-2.5 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">
                    {t('overview.currentRatio', { default: 'Current Ratio' })}
                  </p>
                  <p className="text-sm font-bold">
                    {formatRatio(currentRatio)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Financial Ratios - New Section */}
          {(equityRatio !== undefined || debtRatio !== undefined || quickRatio !== undefined || debtToEquity !== undefined || dscr !== undefined) && (
            <div className="space-y-3 pt-4 border-t">
              <h4 className="text-sm font-semibold">
                {t('overview.financialRatios', { default: 'Tunnusluvut' })}
              </h4>
              <div className="grid grid-cols-4 gap-3">
                {/* Equity Ratio */}
                {equityRatio !== undefined && equityRatio !== null && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="space-y-1 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 cursor-help">
                          <div className="flex items-center gap-1">
                            <p className="text-xs text-blue-700 dark:text-blue-400">
                              {t('overview.equityRatio', { default: 'Omavaraisuus-%' })}
                            </p>
                            <HelpCircle className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                          </div>
                          <p className="text-sm font-bold">
                            {formatPercent(equityRatio)}
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-semibold mb-1">Omavaraisuusaste</p>
                        <p className="text-xs mb-2">Mittaa yrityksen vakavaraisuutta ja kykyä selviytyä veloistaan pitkällä aikavälillä.</p>
                        <p className="text-xs font-mono bg-muted p-1 rounded">
                          (Oma pääoma ÷ Taseen loppusumma) × 100
                        </p>
                        <p className="text-xs mt-2 text-muted-foreground">
                          Hyvä: &gt;40% | Tyydyttävä: 20-40% | Heikko: &lt;20%
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                {/* Debt Ratio */}
                {debtRatio !== undefined && debtRatio !== null && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="space-y-1 p-2.5 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 cursor-help">
                          <div className="flex items-center gap-1">
                            <p className="text-xs text-orange-700 dark:text-orange-400">
                              {t('overview.debtRatio', { default: 'Velkaantumis-%' })}
                            </p>
                            <HelpCircle className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                          </div>
                          <p className="text-sm font-bold">
                            {formatPercent(debtRatio)}
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-semibold mb-1">Velkaantumisaste</p>
                        <p className="text-xs mb-2">Osoittaa kuinka suuri osuus yrityksen varoista on rahoitettu vieraalla pääomalla.</p>
                        <p className="text-xs font-mono bg-muted p-1 rounded">
                          (Vieras pääoma ÷ Taseen loppusumma) × 100
                        </p>
                        <p className="text-xs mt-2 text-muted-foreground">
                          Hyvä: &lt;40% | Kohtalainen: 40-60% | Korkea: &gt;60%
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                {/* Quick Ratio */}
                {quickRatio !== undefined && quickRatio !== null && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="space-y-1 p-2.5 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 cursor-help">
                          <div className="flex items-center gap-1">
                            <p className="text-xs text-green-700 dark:text-green-400">
                              {t('overview.quickRatio', { default: 'Quick Ratio' })}
                            </p>
                            <HelpCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                          </div>
                          <p className="text-sm font-bold">
                            {formatRatio(quickRatio)}
                          </p>
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

                {/* Debt to Equity */}
                {debtToEquity !== undefined && debtToEquity !== null && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="space-y-1 p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 cursor-help">
                          <div className="flex items-center gap-1">
                            <p className="text-xs text-purple-700 dark:text-purple-400">
                              {t('overview.debtToEquity', { default: 'D/E Ratio' })}
                            </p>
                            <HelpCircle className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                          </div>
                          <p className="text-sm font-bold">
                            {formatRatio(debtToEquity)}
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-semibold mb-1">Debt-to-Equity Ratio</p>
                        <p className="text-xs mb-2">Kertoo miten yritys on rahoittanut toimintansa velan ja oman pääoman suhteella.</p>
                        <p className="text-xs font-mono bg-muted p-1 rounded">
                          Vieras pääoma ÷ Oma pääoma
                        </p>
                        <p className="text-xs mt-2 text-muted-foreground">
                          Hyvä: &lt;1.0 | Kohtalainen: 1.0-2.0 | Korkea: &gt;2.0
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                {/* DSCR - Debt Service Coverage Ratio */}
                {dscr !== undefined && dscr !== null && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="space-y-1 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 cursor-help">
                          <div className="flex items-center gap-1">
                            <p className="text-xs text-red-700 dark:text-red-400 font-medium">
                              {t('overview.dscr', { default: 'DSCR' })}
                            </p>
                            <HelpCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
                          </div>
                          <p className="text-sm font-bold">
                            {formatRatio(dscr)}
                          </p>
                          <p className="text-xs text-red-600 dark:text-red-400">
                            {dscr >= 1.25 ? t('overview.dscrGood', { default: 'Hyvä' }) : 
                             dscr >= 1.0 ? t('overview.dscrFair', { default: 'Kohtalainen' }) : 
                             t('overview.dscrPoor', { default: 'Huono' })}
                          </p>
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
            </div>
          )}

          {/* Activity Summary */}
          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-semibold">
              {t('overview.activitySummary', { default: 'Activity Summary' })}
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{documentsCount}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('overview.documents', { default: 'Documents' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{recommendationsCount}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('overview.recommendations', { default: 'Recommendations' })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Application Status */}
          {applicationCount > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <h4 className="text-sm font-semibold">
                {t('overview.applicationStatus', { default: 'Application Status' })}
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <div>
                    <p className="text-sm font-bold">{pendingApps}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('overview.pending', { default: 'Pending' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-bold">{approvedApps}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('overview.approved', { default: 'Approved' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/20">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <div>
                    <p className="text-sm font-bold">{rejectedApps}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('overview.rejected', { default: 'Rejected' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Warning if no data */}
          {latestRevenue === 0 && documentsCount === 0 && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-yellow-900 dark:text-yellow-200">
                  {t('overview.noDataTitle', { default: 'Limited Data Available' })}
                </p>
                <p className="text-yellow-800 dark:text-yellow-300">
                  {t('overview.noDataDescription', { default: 'Upload financial documents to get personalized insights and recommendations' })}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

