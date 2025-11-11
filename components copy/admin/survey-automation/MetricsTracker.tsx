'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/components/auth/AuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  RefreshCw,
  Mail,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Target,
  Zap
} from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'

interface MetricsData {
  overview: {
    total_emails_sent: number
    total_emails_delivered: number
    total_emails_opened: number
    total_emails_clicked: number
    delivery_rate: number
    open_rate: number
    click_rate: number
    conversion_rate: number
  }
  time_series: Array<{
    date: string
    emails_sent: number
    emails_delivered: number
    emails_opened: number
    emails_clicked: number
    surveys_completed: number
  }>
  trigger_performance: Array<{
    trigger_id: string
    trigger_name: string
    emails_sent: number
    delivery_rate: number
    open_rate: number
    click_rate: number
    completion_rate: number
  }>
  segment_performance: Array<{
    segment_id: string
    segment_name: string
    emails_sent: number
    engagement_score: number
    avg_completion_time: number
    satisfaction_score: number
  }>
  best_times: {
    day_of_week: Array<{day: string, performance_score: number}>
    hour_of_day: Array<{hour: number, performance_score: number}>
  }
  ab_test_results: Array<{
    test_id: string
    test_name: string
    variant_a_performance: number
    variant_b_performance: number
    confidence_level: number
    winner: 'A' | 'B' | 'inconclusive'
  }>
}

interface TimeRange {
  value: string
  label: string
}

export function MetricsTracker() {
  const t = useTranslations('Admin.SurveyAutomation.Metrics')
  const { session, isAdmin } = useAuth()
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState('30d')
  const [refreshing, setRefreshing] = useState(false)

  const timeRanges: TimeRange[] = [
    { value: '7d', label: '7 päivää' },
    { value: '30d', label: '30 päivää' },
    { value: '90d', label: '90 päivää' },
    { value: '1y', label: '1 vuosi' }
  ]

  const fetchMetrics = useCallback(async () => {
    if (!session?.access_token || !isAdmin) return

    try {
      setError(null)
      
      const response = await fetch(`/api/admin/survey-automation/metrics?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Mittareiden lataus epäonnistui')
      }

      const data = await response.json()
      setMetrics(data.metrics || null)
    } catch (err) {
      console.error('Error fetching metrics:', err)
      setError(err instanceof Error ? err.message : 'Tuntematon virhe')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [session?.access_token, isAdmin, timeRange])

  useEffect(() => {
    if (session?.access_token && isAdmin) {
      fetchMetrics()
    }
  }, [session?.access_token, isAdmin, fetchMetrics])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchMetrics()
  }

  const handleExport = async () => {
    if (!session?.access_token || !isAdmin) return

    try {
      const response = await fetch(`/api/admin/survey-automation/metrics/export?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Viennin luonti epäonnistui')
      }

      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `survey_automation_metrics_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Error exporting metrics:', err)
      setError(err instanceof Error ? err.message : 'Vienti epäonnistui')
    }
  }

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('fi-FI').format(value)
  }

  const getPerformanceColor = (rate: number) => {
    if (rate >= 0.8) return 'text-green-600'
    if (rate >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPerformanceBadge = (rate: number) => {
    if (rate >= 0.8) return <Badge className="bg-green-100 text-green-800">Erinomainen</Badge>
    if (rate >= 0.6) return <Badge className="bg-yellow-100 text-yellow-800">Hyvä</Badge>
    return <Badge className="bg-red-100 text-red-800">Parannettava</Badge>
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Spinner className="mr-2" />
          <span>Ladataan mittareita...</span>
        </CardContent>
      </Card>
    )
  }

  if (error || !metrics) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-red-600 mb-4">{error || 'Mittareita ei voitu ladata'}</div>
          <Button onClick={fetchMetrics} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Yritä uudelleen
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Suorituskyvyn mittarit</h2>
          <p className="text-gray-600">Seuraa automaation tehokkuutta ja tuloksia</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Vie CSV
          </Button>
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Päivitä
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Lähetetyt sähköpostit
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.overview.total_emails_sent)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(metrics.overview.total_emails_delivered)} toimitettu
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Toimitusaste
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPerformanceColor(metrics.overview.delivery_rate)}`}>
              {formatPercentage(metrics.overview.delivery_rate)}
            </div>
            <div className="mt-1">
              {getPerformanceBadge(metrics.overview.delivery_rate)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avausaste
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPerformanceColor(metrics.overview.open_rate)}`}>
              {formatPercentage(metrics.overview.open_rate)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(metrics.overview.total_emails_opened)} avattu
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Klikkausaste
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPerformanceColor(metrics.overview.click_rate)}`}>
              {formatPercentage(metrics.overview.click_rate)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(metrics.overview.total_emails_clicked)} klikattu
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trigger Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Triggereiden suorituskyky
          </CardTitle>
          <CardDescription>
            Vertaile eri triggereiden tehokkuutta
          </CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.trigger_performance.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Ei triggereitä analysoitavaksi
            </div>
          ) : (
            <div className="space-y-4">
              {metrics.trigger_performance.map((trigger) => (
                <div key={trigger.trigger_id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{trigger.trigger_name}</h4>
                      <p className="text-sm text-gray-600">
                        {formatNumber(trigger.emails_sent)} sähköpostia lähetetty
                      </p>
                    </div>
                    {getPerformanceBadge(trigger.completion_rate)}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Toimitusaste</div>
                      <div className={`font-medium ${getPerformanceColor(trigger.delivery_rate)}`}>
                        {formatPercentage(trigger.delivery_rate)}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Avausaste</div>
                      <div className={`font-medium ${getPerformanceColor(trigger.open_rate)}`}>
                        {formatPercentage(trigger.open_rate)}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Klikkausaste</div>
                      <div className={`font-medium ${getPerformanceColor(trigger.click_rate)}`}>
                        {formatPercentage(trigger.click_rate)}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Valmistumisaste</div>
                      <div className={`font-medium ${getPerformanceColor(trigger.completion_rate)}`}>
                        {formatPercentage(trigger.completion_rate)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Segment Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Asiakasryhmien suorituskyky
          </CardTitle>
          <CardDescription>
            Analysoi eri asiakasryhmien sitoutumista
          </CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.segment_performance.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Ei asiakasryhmiä analysoitavaksi
            </div>
          ) : (
            <div className="space-y-4">
              {metrics.segment_performance.map((segment) => (
                <div key={segment.segment_id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{segment.segment_name}</h4>
                      <p className="text-sm text-gray-600">
                        {formatNumber(segment.emails_sent)} sähköpostia lähetetty
                      </p>
                    </div>
                    <Badge variant="outline">
                      Sitoutumispisteet: {segment.engagement_score.toFixed(1)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Keskimääräinen valmistumisaika</div>
                      <div className="font-medium">
                        {Math.round(segment.avg_completion_time)} minuuttia
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Tyytyväisyyspistemäärä</div>
                      <div className="font-medium">
                        {segment.satisfaction_score.toFixed(1)}/5.0
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Sitoutumistaso</div>
                      <div className="font-medium">
                        {segment.engagement_score >= 8 ? 'Korkea' :
                         segment.engagement_score >= 5 ? 'Keskitaso' : 'Matala'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Best Times */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Parhaat lähetyspäivät
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.best_times.day_of_week.map((day) => (
                <div key={day.day} className="flex items-center justify-between">
                  <span className="font-medium">{day.day}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(day.performance_score / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {day.performance_score.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Parhaat lähetysajat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.best_times.hour_of_day.slice(0, 8).map((hour) => (
                <div key={hour.hour} className="flex items-center justify-between">
                  <span className="font-medium">
                    {hour.hour.toString().padStart(2, '0')}:00
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${(hour.performance_score / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {hour.performance_score.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* A/B Test Results */}
      {metrics.ab_test_results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              A/B-testien tulokset
            </CardTitle>
            <CardDescription>
              Vertaile eri viestivarianttien suorituskykyä
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.ab_test_results.map((test) => (
                <div key={test.test_id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium">{test.test_name}</h4>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={test.winner === 'inconclusive' ? 'secondary' : 'default'}
                      >
                        {test.winner === 'A' ? 'Voittaja: A' :
                         test.winner === 'B' ? 'Voittaja: B' : 'Epäselvä'}
                      </Badge>
                      <Badge variant="outline">
                        {formatPercentage(test.confidence_level)} varmuus
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-3 rounded">
                      <div className="text-sm text-blue-600 font-medium">Variantti A</div>
                      <div className="text-lg font-bold text-blue-900">
                        {formatPercentage(test.variant_a_performance)}
                      </div>
                    </div>
                    <div className="bg-green-50 p-3 rounded">
                      <div className="text-sm text-green-600 font-medium">Variantti B</div>
                      <div className="text-lg font-bold text-green-900">
                        {formatPercentage(test.variant_b_performance)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
