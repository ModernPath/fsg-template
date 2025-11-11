'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, AlertCircle, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface Company {
  name: string
  business_id?: string
  industry?: string
  type?: string
  description?: string | null
  products?: string[] | null
  market?: string | null
  metadata?: any
  created_at?: string
}

interface FinancialMetrics {
  fiscal_year: number
  revenue?: number
  ebitda?: number
  net_profit?: number
  total_assets?: number
  total_liabilities?: number
  equity?: number
  current_ratio?: number
  quick_ratio?: number
  debt_to_equity?: number
  roe?: number
}

interface FundabilityAnalysisProps {
  company: Company | null
  latestMetrics: FinancialMetrics | null
  hasFinancialData: boolean
}

type FundabilityScore = 'excellent' | 'good' | 'fair' | 'poor' | 'insufficient'

interface AnalysisResult {
  score: FundabilityScore
  percentage: number
  factors: Array<{
    name: string
    status: 'positive' | 'neutral' | 'negative'
    value?: string
  }>
  recommendations: string[]
}

export default function FundabilityAnalysis({
  company,
  latestMetrics,
  hasFinancialData
}: FundabilityAnalysisProps) {
  const t = useTranslations('Dashboard.Fundability')

  if (!company) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            {t('title')}
          </CardTitle>
          <CardDescription>{t('subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t('noCompany')}</p>
        </CardContent>
      </Card>
    )
  }

  // Calculate fundability score
  const analysis: AnalysisResult = hasFinancialData
    ? calculateDetailedAnalysis(company, latestMetrics)
    : calculateBasicAnalysis(company)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {t('title')}
        </CardTitle>
        <CardDescription>
          {hasFinancialData ? t('detailedAnalysis') : t('basicAnalysis')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Company Information Section */}
        {(company.description || company.products || company.market) && (
          <div className="space-y-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
            <h3 className="font-semibold text-sm text-gold-primary uppercase tracking-wide">
              Yrityksen tiedot
            </h3>
            
            {company.description && (
              <div className="space-y-1">
                <p className="text-xs text-gray-400 uppercase">Kuvaus</p>
                <p className="text-sm text-gray-200 leading-relaxed">{company.description}</p>
              </div>
            )}
            
            {company.products && Array.isArray(company.products) && company.products.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-gray-400 uppercase">Tuotteet / Palvelut</p>
                <div className="flex flex-wrap gap-2">
                  {company.products.map((product, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-200">
                      {product}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {company.market && (
              <div className="space-y-1">
                <p className="text-xs text-gray-400 uppercase">Markkina-alue</p>
                <p className="text-sm text-gray-200 leading-relaxed">{company.market}</p>
              </div>
            )}
          </div>
        )}

        {/* Overall Score */}
        <div className="flex items-center justify-between p-6 rounded-lg border-2" style={{
          borderColor: getScoreColor(analysis.score),
          backgroundColor: `${getScoreColor(analysis.score)}10`
        }}>
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">
              {t('overallScore')}
            </div>
            <div className="text-2xl font-bold">{getScoreName(analysis.score, t)}</div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold" style={{ color: getScoreColor(analysis.score) }}>
              {analysis.percentage}%
            </div>
            <div className="text-sm text-muted-foreground">
              {t('fundabilityScore')}
            </div>
          </div>
        </div>

        {/* Analysis Factors */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            {t('analysisFactors')}
          </h3>
          <div className="space-y-2">
            {analysis.factors.map((factor, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-2">
                  {factor.status === 'positive' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                  {factor.status === 'neutral' && <Minus className="h-4 w-4 text-yellow-600" />}
                  {factor.status === 'negative' && <XCircle className="h-4 w-4 text-red-600" />}
                  <span className="font-medium">{factor.name}</span>
                </div>
                {factor.value && (
                  <span className="text-sm text-muted-foreground">{factor.value}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        {analysis.recommendations.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              {t('recommendations')}
            </h3>
            <div className="space-y-2">
              {analysis.recommendations.map((recommendation, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800"
                >
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{recommendation}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Banner */}
        {!hasFinancialData && (
          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-900 dark:text-amber-100">
                {t('uploadForDetailedAnalysis')}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Calculate basic analysis based on public data
function calculateBasicAnalysis(company: Company): AnalysisResult {
  const factors: AnalysisResult['factors'] = []
  let score = 50 // Start with neutral score
  
  // Company age
  if (company.created_at) {
    const companyAge = new Date().getFullYear() - new Date(company.created_at).getFullYear()
    if (companyAge >= 3) {
      factors.push({ name: 'Yrityksen ikä', status: 'positive', value: `${companyAge} vuotta` })
      score += 15
    } else if (companyAge >= 1) {
      factors.push({ name: 'Yrityksen ikä', status: 'neutral', value: `${companyAge} vuotta` })
    } else {
      factors.push({ name: 'Yrityksen ikä', status: 'negative', value: `${companyAge} vuotta` })
      score -= 10
    }
  }

  // Company type
  if (company.type === 'Osakeyhtiö' || company.business_id) {
    factors.push({ name: 'Yritysmuoto', status: 'positive', value: company.type || 'Osakeyhtiö' })
    score += 10
  } else {
    factors.push({ name: 'Yritysmuoto', status: 'neutral', value: company.type || '-' })
  }

  // Industry (if available)
  if (company.industry) {
    factors.push({ name: 'Toimiala', status: 'neutral', value: company.industry })
  }

  // Business ID
  if (company.business_id) {
    factors.push({ name: 'Y-tunnus', status: 'positive', value: company.business_id })
    score += 5
  }

  const recommendations = [
    'Lataa tilinpäätös saadaksesi tarkemman rahoitettavuusanalyysin',
    'Tarkka analyysi huomioi taloudellisen tilanteen ja maksukyvyn',
    'Analysoimme liikevaihdon, kannattavuuden ja vakavaraisuuden'
  ]

  score = Math.max(0, Math.min(100, score)) // Clamp between 0-100
  
  return {
    score: getScoreFromPercentage(score),
    percentage: score,
    factors,
    recommendations
  }
}

// Calculate detailed analysis based on financial metrics
function calculateDetailedAnalysis(company: Company, metrics: FinancialMetrics | null): AnalysisResult {
  if (!metrics) {
    return calculateBasicAnalysis(company)
  }

  const factors: AnalysisResult['factors'] = []
  const recommendations: string[] = []
  let score = 50

  // Revenue
  if (metrics.revenue !== undefined && metrics.revenue !== null) {
    if (metrics.revenue >= 1000000) {
      factors.push({ 
        name: 'Liikevaihto', 
        status: 'positive', 
        value: `${(metrics.revenue / 1000).toFixed(0)} k€`
      })
      score += 20
    } else if (metrics.revenue >= 100000) {
      factors.push({ 
        name: 'Liikevaihto', 
        status: 'neutral', 
        value: `${(metrics.revenue / 1000).toFixed(0)} k€`
      })
      score += 10
    } else {
      factors.push({ 
        name: 'Liikevaihto', 
        status: 'negative', 
        value: `${(metrics.revenue / 1000).toFixed(0)} k€`
      })
      score -= 5
      recommendations.push('Matala liikevaihto voi vaikeuttaa rahoituksen saantia')
    }
  }

  // Profitability (EBITDA or Net Profit)
  const profitability = metrics.ebitda ?? metrics.net_profit
  if (profitability !== undefined && profitability !== null) {
    if (profitability > 0) {
      factors.push({ 
        name: 'Kannattavuus', 
        status: 'positive', 
        value: `${(profitability / 1000).toFixed(0)} k€`
      })
      score += 15
    } else {
      factors.push({ 
        name: 'Kannattavuus', 
        status: 'negative', 
        value: `${(profitability / 1000).toFixed(0)} k€`
      })
      score -= 15
      recommendations.push('Negatiivinen tulos vaikuttaa rahoitusmahdollisuuksiin')
    }
  }

  // Equity
  if (metrics.equity !== undefined && metrics.equity !== null) {
    if (metrics.equity > 50000) {
      factors.push({ 
        name: 'Oma pääoma', 
        status: 'positive', 
        value: `${(metrics.equity / 1000).toFixed(0)} k€`
      })
      score += 10
    } else if (metrics.equity > 0) {
      factors.push({ 
        name: 'Oma pääoma', 
        status: 'neutral', 
        value: `${(metrics.equity / 1000).toFixed(0)} k€`
      })
    } else {
      factors.push({ 
        name: 'Oma pääoma', 
        status: 'negative', 
        value: `${(metrics.equity / 1000).toFixed(0)} k€`
      })
      score -= 20
      recommendations.push('Negatiivinen oma pääoma vaikeuttaa rahoituksen saantia merkittävästi')
    }
  }

  // Current Ratio (Liquidity)
  if (metrics.current_ratio !== undefined && metrics.current_ratio !== null) {
    if (metrics.current_ratio >= 1.5) {
      factors.push({ 
        name: 'Maksukyky', 
        status: 'positive', 
        value: `${metrics.current_ratio.toFixed(2)}`
      })
      score += 15
    } else if (metrics.current_ratio >= 1.0) {
      factors.push({ 
        name: 'Maksukyky', 
        status: 'neutral', 
        value: `${metrics.current_ratio.toFixed(2)}`
      })
      score += 5
    } else {
      factors.push({ 
        name: 'Maksukyky', 
        status: 'negative', 
        value: `${metrics.current_ratio.toFixed(2)}`
      })
      score -= 10
      recommendations.push('Heikko maksukyky voi vaikeuttaa lyhytaikaisen rahoituksen saantia')
    }
  }

  // Debt to Equity
  if (metrics.debt_to_equity !== undefined && metrics.debt_to_equity !== null) {
    if (metrics.debt_to_equity <= 1.0) {
      factors.push({ 
        name: 'Velkaantumisaste', 
        status: 'positive', 
        value: `${(metrics.debt_to_equity * 100).toFixed(0)}%`
      })
      score += 10
    } else if (metrics.debt_to_equity <= 2.0) {
      factors.push({ 
        name: 'Velkaantumisaste', 
        status: 'neutral', 
        value: `${(metrics.debt_to_equity * 100).toFixed(0)}%`
      })
    } else {
      factors.push({ 
        name: 'Velkaantumisaste', 
        status: 'negative', 
        value: `${(metrics.debt_to_equity * 100).toFixed(0)}%`
      })
      score -= 10
      recommendations.push('Korkea velkaantumisaste voi rajoittaa lisävelan ottoa')
    }
  }

  // Return on Equity (ROE)
  if (metrics.roe !== undefined && metrics.roe !== null) {
    if (metrics.roe >= 15) {
      factors.push({ 
        name: 'Oman pääoman tuotto', 
        status: 'positive', 
        value: `${metrics.roe.toFixed(1)}%`
      })
      score += 10
    } else if (metrics.roe >= 5) {
      factors.push({ 
        name: 'Oman pääoman tuotto', 
        status: 'neutral', 
        value: `${metrics.roe.toFixed(1)}%`
      })
    } else {
      factors.push({ 
        name: 'Oman pääoman tuotto', 
        status: 'negative', 
        value: `${metrics.roe.toFixed(1)}%`
      })
    }
  }

  // Add recommendations based on score
  if (score >= 75 && recommendations.length === 0) {
    recommendations.push('Hyvät edellytykset rahoituksen saamiselle')
    recommendations.push('Kannattaa harkita kasvurahoitusta')
  } else if (score >= 50 && recommendations.length === 0) {
    recommendations.push('Kohtalaiset edellytykset rahoitukselle')
    recommendations.push('Keskity taloudellisen tilanteen parantamiseen')
  } else if (recommendations.length === 0) {
    recommendations.push('Rahoituksen saaminen voi olla haastavaa')
    recommendations.push('Suosittelemme keskustelemaan rahoitusneuvojan kanssa')
  }

  score = Math.max(0, Math.min(100, score))
  
  return {
    score: getScoreFromPercentage(score),
    percentage: score,
    factors,
    recommendations
  }
}

function getScoreFromPercentage(percentage: number): FundabilityScore {
  if (percentage >= 80) return 'excellent'
  if (percentage >= 65) return 'good'
  if (percentage >= 50) return 'fair'
  if (percentage >= 30) return 'poor'
  return 'insufficient'
}

function getScoreColor(score: FundabilityScore): string {
  switch (score) {
    case 'excellent': return '#22c55e'
    case 'good': return '#84cc16'
    case 'fair': return '#eab308'
    case 'poor': return '#f97316'
    case 'insufficient': return '#ef4444'
  }
}

function getScoreName(score: FundabilityScore, t: any): string {
  return t(`scores.${score}`)
}

