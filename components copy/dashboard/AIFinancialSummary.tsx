'use client'

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Save,
  X,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FinancialMetric {
  fiscal_year: number
  revenue?: number | null
  operating_profit?: number | null
  net_profit?: number | null
  ebitda?: number | null
  total_assets?: number | null
  total_equity?: number | null
  return_on_equity?: number | null
  current_ratio?: number | null
  debt_to_equity_ratio?: number | null
  operating_margin?: number | null
  net_margin?: number | null
  revenue_growth_rate?: number | null
}

interface AIFinancialSummaryProps {
  metrics: FinancialMetric[]
  companyName?: string
  locale?: string
}

interface AnalysisInsight {
  type: 'strength' | 'warning' | 'neutral'
  title: string
  description: string
  metric?: string
  value?: string
}

export function AIFinancialSummary({ metrics, companyName = 'Yritys', locale = 'fi' }: AIFinancialSummaryProps) {
  const t = useTranslations('Dashboard')
  const [isEditing, setIsEditing] = useState(false)
  const [customNotes, setCustomNotes] = useState('')
  const [savedNotes, setSavedNotes] = useState('')

  if (!metrics || metrics.length === 0) {
    return null
  }

  // Sort metrics by year descending
  const sortedMetrics = [...metrics].sort((a, b) => b.fiscal_year - a.fiscal_year)
  const latestMetric = sortedMetrics[0]
  const previousMetric = sortedMetrics[1]

  // Generate AI insights
  const insights: AnalysisInsight[] = []

  // 1. Revenue Growth Analysis
  if (latestMetric.revenue && previousMetric?.revenue) {
    const growth = ((latestMetric.revenue - previousMetric.revenue) / previousMetric.revenue) * 100
    insights.push({
      type: growth > 10 ? 'strength' : growth < -5 ? 'warning' : 'neutral',
      title: growth > 0 ? 'Liikevaihdon kasvu' : 'Liikevaihdon lasku',
      description: `Liikevaihto ${growth > 0 ? 'kasvoi' : 'laski'} ${Math.abs(growth).toFixed(1)}% vuodesta ${previousMetric.fiscal_year} vuoteen ${latestMetric.fiscal_year}`,
      metric: 'Liikevaihto',
      value: `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`
    })
  }

  // 2. Profitability Analysis
  if (latestMetric.net_margin !== null && latestMetric.net_margin !== undefined) {
    const margin = latestMetric.net_margin
    insights.push({
      type: margin > 10 ? 'strength' : margin < 0 ? 'warning' : 'neutral',
      title: margin > 10 ? 'Erinomainen kannattavuus' : margin < 0 ? 'Heikko kannattavuus' : 'Kohtalainen kannattavuus',
      description: `Nettomarginaali on ${margin.toFixed(1)}%, mikä ${margin > 10 ? 'on alan keskiarvoa parempi' : margin < 0 ? 'vaatii huomiota' : 'on tyypillinen'}`,
      metric: 'Nettomarginaali',
      value: `${margin.toFixed(1)}%`
    })
  }

  // 3. Liquidity Analysis
  if (latestMetric.current_ratio !== null && latestMetric.current_ratio !== undefined) {
    const cr = latestMetric.current_ratio
    insights.push({
      type: cr > 1.5 ? 'strength' : cr < 1 ? 'warning' : 'neutral',
      title: cr > 1.5 ? 'Hyvä maksukyky' : cr < 1 ? 'Heikko maksukyky' : 'Tyydyttävä maksukyky',
      description: `Current Ratio ${cr.toFixed(2)} ${cr > 1.5 ? 'osoittaa vahvaa lyhyen aikavälin maksukykyä' : cr < 1 ? 'viittaa mahdollisiin likviditeettiongelmiin' : 'on riittävä lyhyen aikavälin velvoitteiden hoitoon'}`,
      metric: 'Current Ratio',
      value: cr.toFixed(2)
    })
  }

  // 4. ROE Analysis  
  if (latestMetric.return_on_equity !== null && latestMetric.return_on_equity !== undefined) {
    const roe = latestMetric.return_on_equity
    insights.push({
      type: roe > 15 ? 'strength' : roe < 5 ? 'warning' : 'neutral',
      title: roe > 15 ? 'Vahva pääoman tuotto' : roe < 5 ? 'Heikko pääoman tuotto' : 'Kohtalainen pääoman tuotto',
      description: `ROE ${roe.toFixed(1)}% ${roe > 15 ? 'osoittaa tehokasta oman pääoman käyttöä' : roe < 5 ? 'viittaa alhaiseen kannattavuuteen' : 'on tyypillistä toimialalle'}`,
      metric: 'ROE',
      value: `${roe.toFixed(1)}%`
    })
  }

  // 5. Debt Level Analysis
  if (latestMetric.debt_to_equity_ratio !== null && latestMetric.debt_to_equity_ratio !== undefined) {
    const de = latestMetric.debt_to_equity_ratio
    insights.push({
      type: de < 1 ? 'strength' : de > 3 ? 'warning' : 'neutral',
      title: de < 1 ? 'Matala velkaantuneisuus' : de > 3 ? 'Korkea velkaantuneisuus' : 'Kohtalainen velkaantuneisuus',
      description: `Debt-to-Equity ${de.toFixed(2)} ${de < 1 ? 'tarjoaa vahvan rahoitusaseman' : de > 3 ? 'saattaa rajoittaa joustavuutta' : 'on yleinen teollisuudessa'}`,
      metric: 'D/E',
      value: de.toFixed(2)
    })
  }

  // Calculate overall score
  const strengths = insights.filter(i => i.type === 'strength').length
  const warnings = insights.filter(i => i.type === 'warning').length
  const overallScore = Math.min(100, Math.max(0, 50 + (strengths * 15) - (warnings * 20)))

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-blue-500'
    if (score >= 40) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Erinomainen'
    if (score >= 60) return 'Hyvä'
    if (score >= 40) return 'Tyydyttävä'
    return 'Vaatii huomiota'
  }

  const handleSaveNotes = () => {
    setSavedNotes(customNotes)
    setIsEditing(false)
    // Here you could also save to backend if needed
  }

  const handleCancelEdit = () => {
    setCustomNotes(savedNotes)
    setIsEditing(false)
  }

  return (
    <Card className="border-gold-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-gold-highlight" />
            <CardTitle className="text-xl">
              AI Talousanalyysi
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-lg font-bold">
            <span className={getScoreColor(overallScore)}>{overallScore}/100</span>
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {getScoreLabel(overallScore)}
            </span>
          </Badge>
        </div>
        <CardDescription>
          Automaattinen analyysi {latestMetric.fiscal_year} tilinpäätöksestä • {sortedMetrics.length} vuotta dataa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Insights */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Keskeiset havainnot
          </h3>
          {insights.map((insight, index) => (
            <div
              key={index}
              className={cn(
                "flex items-start gap-3 p-4 rounded-lg border",
                insight.type === 'strength' && "bg-green-500/5 border-green-500/20",
                insight.type === 'warning' && "bg-yellow-500/5 border-yellow-500/20",
                insight.type === 'neutral' && "bg-blue-500/5 border-blue-500/20"
              )}
            >
              {insight.type === 'strength' && <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />}
              {insight.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />}
              {insight.type === 'neutral' && <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5" />}
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{insight.title}</h4>
                  {insight.value && (
                    <Badge variant="outline" className="font-mono">
                      {insight.value}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {insight.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Historical Trend Summary */}
        {sortedMetrics.length >= 3 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Trendi ({sortedMetrics.length} vuotta)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Revenue Trend */}
              {sortedMetrics.every(m => m.revenue) && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="text-xs text-muted-foreground mb-1">Liikevaihto</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold">
                      €{(sortedMetrics[0].revenue! / 1000000).toFixed(1)}M
                    </span>
                    {(() => {
                      const oldRevenue = sortedMetrics[sortedMetrics.length - 1].revenue!
                      const newRevenue = sortedMetrics[0].revenue!
                      const totalGrowth = ((newRevenue - oldRevenue) / oldRevenue) * 100
                      return (
                        <span className={cn("text-sm flex items-center", totalGrowth > 0 ? "text-green-500" : "text-red-500")}>
                          {totalGrowth > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                          {totalGrowth.toFixed(1)}%
                        </span>
                      )
                    })()}
                  </div>
                </div>
              )}

              {/* Profit Trend */}
              {sortedMetrics.every(m => m.net_profit !== null) && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="text-xs text-muted-foreground mb-1">Nettotulos</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold">
                      €{((sortedMetrics[0].net_profit || 0) / 1000000).toFixed(1)}M
                    </span>
                    {(() => {
                      const oldProfit = sortedMetrics[sortedMetrics.length - 1].net_profit || 0
                      const newProfit = sortedMetrics[0].net_profit || 0
                      if (oldProfit !== 0) {
                        const totalGrowth = ((newProfit - oldProfit) / Math.abs(oldProfit)) * 100
                        return (
                          <span className={cn("text-sm flex items-center", totalGrowth > 0 ? "text-green-500" : "text-red-500")}>
                            {totalGrowth > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                            {totalGrowth.toFixed(1)}%
                          </span>
                        )
                      }
                      return null
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Editable Notes Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Omat muistiinpanot
            </h3>
            {!isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-8"
              >
                <Edit3 className="h-4 w-4 mr-1" />
                Muokkaa
              </Button>
            )}
          </div>
          
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Lisää omia havaintoja, suunnitelmia tai muistiinpanoja tähän analyysiin..."
                className="min-h-[120px]"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveNotes}
                  size="sm"
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-1" />
                  Tallenna
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  size="sm"
                >
                  <X className="h-4 w-4 mr-1" />
                  Peruuta
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-muted/30 min-h-[60px]">
              {savedNotes || (
                <p className="text-sm text-muted-foreground italic">
                  Ei muistiinpanoja. Klikkaa "Muokkaa" lisätäksesi omia havaintojasi.
                </p>
              )}
              {savedNotes && <p className="text-sm whitespace-pre-wrap">{savedNotes}</p>}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1">
            <RefreshCw className="h-4 w-4 mr-2" />
            Päivitä analyysi
          </Button>
          <Button variant="outline" size="sm">
            Lataa raportti
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

