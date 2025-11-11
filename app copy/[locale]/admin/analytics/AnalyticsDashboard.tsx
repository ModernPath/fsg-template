'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { 
  getAnalyticsData, 
  getRealtimeAnalytics, 
  getConversionData, 
  getEngagementData,
  type AnalyticsData,
  type RealtimeAnalytics,
  type ConversionData,
  type EngagementData
} from './services'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RefreshCw, Users, Eye, Clock, TrendingUp, Globe, Monitor, MousePointer, Calendar, Smartphone, Target, Activity, Download, Filter, BarChart3 } from 'lucide-react'
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import UserAgentAnalytics from './user-agents'
import GeographicAnalytics from './geographic'
import ABTestingDashboard from './ab-testing'

// Color palette for charts - matching survey analytics
const COLORS = ['#e5c07b', '#d4a373', '#c2956a', '#b08968', '#a67c5a', '#9c6f4c', '#3b82f6', '#10b981']

// Export utility functions
function generateCSVReport(analyticsData?: AnalyticsData, conversionData?: ConversionData, engagementData?: EngagementData) {
  const headers = [
    'Metric',
    'Value',
    'Description'
  ]
  
  const rows = [
    ['Sivulataukset', analyticsData?.totalPageViews || 0, 'Kokonaissivulataukset'],
    ['Uniikkeja kävijöitä', analyticsData?.uniqueVisitors || 0, 'Eri käyttäjiä'],
    ['Keskimääräinen istunto (s)', Math.round(analyticsData?.avgSessionDuration || 0), 'Aika sivustolla'],
    ['Poistumisprosentti (%)', (analyticsData?.bounceRate || 0).toFixed(1), 'Yhden sivun istunnot'],
    ['Konversio (%)', (conversionData?.conversionRate || 0).toFixed(1), 'Ostoksi päätyneet'],
    ['Liikevaihto (€)', (conversionData?.totalRevenue || 0).toFixed(2), 'Kokonaismyynti'],
    ['Keskiostos (€)', (conversionData?.averageOrderValue || 0).toFixed(2), 'AOV'],
    ['Sitoutumisaste (%)', (engagementData?.engagementRate || 0).toFixed(1), 'Aktiiviset istunnot']
  ]
  
  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-8 bg-gray-200 rounded w-1/2"></div>
    </div>
  )
}

// Chart loading skeleton
function ChartSkeleton() {
  return (
    <div className="animate-pulse h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-2 animate-pulse"></div>
        <div className="text-sm text-muted-foreground">Ladataan kaavioita...</div>
      </div>
    </div>
  )
}

// Date range selector component
function DateRangeSelector({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const dateRangeOptions = [
    { value: '1h', label: 'Last Hour' },
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' }
  ]

  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {dateRangeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// Enhanced MetricCard component with trend indicators and comparison
function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  loading = false,
  change,
  changeType = 'neutral',
  previousValue,
  format = 'number',
  description
}: {
  title: string
  value: string | number
  icon: any
  trend?: string
  loading?: boolean
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  previousValue?: number
  format?: 'number' | 'percentage' | 'duration' | 'currency'
  description?: string
}) {
  // Calculate percentage change if previousValue is provided
  let calculatedChange = change
  let calculatedChangeType = changeType
  
  if (previousValue !== undefined && typeof value === 'number') {
    const percentChange = previousValue > 0 ? ((value - previousValue) / previousValue) * 100 : 0
    calculatedChange = `${percentChange > 0 ? '+' : ''}${percentChange.toFixed(1)}%`
    calculatedChangeType = percentChange > 0 ? 'positive' : percentChange < 0 ? 'negative' : 'neutral'
  }

  // Format value based on type
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val
    
    switch (format) {
      case 'percentage':
        return `${val.toFixed(1)}%`
      case 'duration':
        return val >= 60 ? `${Math.round(val / 60)}m` : `${Math.round(val)}s`
      case 'currency':
        return `€${val.toFixed(2)}`
      default:
        return val.toLocaleString()
    }
  }

  const getChangeColor = () => {
    switch (calculatedChangeType) {
      case 'positive': return 'text-green-600 dark:text-green-400'
      case 'negative': return 'text-red-600 dark:text-red-400'
      default: return 'text-gray-500 dark:text-gray-400'
    }
  }

  const getChangeIcon = () => {
    switch (calculatedChangeType) {
      case 'positive': return '↗'
      case 'negative': return '↘'
      default: return '→'
    }
  }

  return (
    <Card className="relative overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {formatValue(value)}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                {calculatedChange && (
                  <div className={`text-xs font-medium flex items-center gap-1 ${getChangeColor()}`}>
                    <span>{getChangeIcon()}</span>
                    {calculatedChange}
                    {!change && ' vs edellinen'}
                  </div>
                )}
                {trend && (
                  <p className="text-xs text-muted-foreground mt-0.5">{trend}</p>
                )}
              </div>
              
              {description && (
                <div className="text-xs text-muted-foreground text-right max-w-[100px] truncate">
                  {description}
                </div>
              )}
            </div>
            
            {previousValue !== undefined && (
              <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                <div className="text-xs text-muted-foreground">
                  Edellinen: {formatValue(previousValue)}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// Page views chart component
function PageViewsChart({ data, loading }: { data?: AnalyticsData; loading: boolean }) {
  if (loading) {
    return <ChartSkeleton />
  }

  // Use actual time series data from the analytics service
  const chartData = data?.timeSeriesData || []

  // Show empty state if no data
  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <div className="text-2xl mb-2">📊</div>
          <p>No data available for the selected period</p>
          <p className="text-sm">Start browsing your site to see analytics data</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <defs>
          <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke="#374151" 
          strokeOpacity={0.3}
          horizontal={true}
          vertical={false}
        />
        <XAxis 
          dataKey="date" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 500 }}
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 500 }}
          width={30}
        />
        <Tooltip
          contentStyle={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.98)', 
            border: '1px solid rgba(0, 0, 0, 0.1)', 
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            color: '#1f2937'
          }}
          formatter={(value, name) => [
            <span key="value" style={{ color: name === 'Page Views' ? '#3b82f6' : '#10b981', fontWeight: 600 }}>
              {value}
            </span>, 
            <span key="label" style={{ color: '#374151', fontWeight: 500 }}>
              {name}
            </span>
          ]}
          labelStyle={{ color: '#1f2937', fontWeight: 600 }}
        />
        <Legend />
        <Area 
          type="monotone" 
          dataKey="pageViews" 
          stroke="#3b82f6" 
          strokeWidth={3}
          fillOpacity={1} 
          fill="url(#colorViews)"
          name="Page Views"
        />
        <Area 
          type="monotone" 
          dataKey="uniqueVisitors" 
          stroke="#10b981" 
          strokeWidth={3}
          fillOpacity={1} 
          fill="url(#colorUsers)"
          name="Unique Users"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// Enhanced Top pages bar chart with better visualization
function TopPagesChart({ data, loading }: { data?: AnalyticsData; loading: boolean }) {
  if (loading) {
    return <ChartSkeleton />
  }

  const chartData = data?.topPages.slice(0, 8).map((page, index) => ({
    page: page.page.length > 35 ? page.page.substring(0, 35) + '...' : page.page,
    fullPage: page.page,
    views: page.views,
    time: page.avg_time,
    rank: index + 1,
    percentage: data.topPages.length > 0 ? (page.views / data.topPages[0].views) * 100 : 0
  })) || []

  // Show empty state if no data
  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <div className="text-2xl mb-2">📄</div>
          <p>Ei sivudataa saatavilla</p>
          <p className="text-sm">Sivulataukset näkyvät täällä kun sivustolla on liikennettä</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>Top {chartData.length} sivua</span>
        <span>Yhteensä {chartData.reduce((sum, item) => sum + item.views, 0)} katselua</span>
      </div>

      {/* Enhanced list view with bars */}
      <div className="space-y-3">
        {chartData.map((item, index) => (
          <div key={index} className="relative">
            {/* Background bar */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 rounded-lg"
                 style={{ width: `${Math.max(item.percentage, 10)}%` }} />
            
            {/* Content */}
            <div className="relative flex items-center justify-between p-3 rounded-lg border hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Rank badge */}
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                  index === 1 ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' :
                  index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                  'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>
                  {item.rank}
                </div>
                
                {/* Page info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate" title={item.fullPage}>
                    {item.page}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Keskiaika: {Math.round(item.time)}s • {item.percentage.toFixed(1)}% kaikista
                  </div>
                </div>
              </div>
              
              {/* Views count */}
              <div className="flex-shrink-0 text-right">
                <div className="font-bold text-lg text-blue-600 dark:text-blue-400">
                  {item.views.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">katselua</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show more indicator if there are more pages */}
      {data && data.topPages.length > 8 && (
        <div className="text-center text-sm text-muted-foreground pt-2 border-t">
          ... ja {data.topPages.length - 8} muuta sivua
        </div>
      )}
    </div>
  )
}

// Enhanced Traffic sources visualization
function TrafficSourcesChart({ data, loading }: { data?: AnalyticsData; loading: boolean }) {
  if (loading) {
    return <ChartSkeleton />
  }

  const chartData = data?.trafficSources.map((source, index) => ({
    name: source.source === 'Direct' ? 'Suora liikenne' : 
          source.source === 'Google' ? 'Google-haku' :
          source.source === 'Facebook' ? 'Facebook' :
          source.source === 'LinkedIn' ? 'LinkedIn' :
          source.source === 'Twitter' ? 'Twitter' :
          source.source,
    originalName: source.source,
    value: source.visitors,
    percentage: source.percentage,
    color: COLORS[index % COLORS.length]
  })) || []

  // Show empty state if no data
  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <div className="text-2xl mb-2">🌐</div>
          <p>Ei liikennelähdetietoja saatavilla</p>
          <p className="text-sm">Liikennölähteet näkyvät täällä kun sivustolla on kävijöitä</p>
        </div>
      </div>
    )
  }

  const totalVisitors = chartData.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>{chartData.length} liikennölähdettä</span>
        <span>Yhteensä {totalVisitors.toLocaleString()} kävijää</span>
      </div>

      {/* Enhanced list with visual bars */}
      <div className="space-y-3">
        {chartData.map((item, index) => (
          <div key={index} className="relative">
            {/* Background bar */}
            <div 
              className="absolute inset-0 rounded-lg opacity-20"
              style={{ 
                backgroundColor: item.color,
                width: `${Math.max(item.percentage, 5)}%` 
              }} 
            />
            
            {/* Content */}
            <div className="relative flex items-center justify-between p-3 rounded-lg border hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-3 flex-1">
                {/* Color indicator */}
                <div 
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                
                {/* Source info */}
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.percentage.toFixed(1)}% kaikesta liikenteestä
                  </div>
                </div>
              </div>
              
              {/* Visitor count */}
              <div className="text-right">
                <div className="font-bold text-lg" style={{ color: item.color }}>
                  {item.value.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">kävijää</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Insights */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="text-sm">
          <div className="font-medium text-blue-900 dark:text-blue-100 mb-1">
            💡 Oivallus
          </div>
          <div className="text-blue-700 dark:text-blue-300">
            {chartData[0]?.name} on suurin liikennölähde ({chartData[0]?.percentage.toFixed(1)}% kaikesta liikenteestä)
          </div>
        </div>
      </div>
    </div>
  )
}

// Enhanced Engagement metrics visualization
function EngagementChart({ data, loading }: { data?: EngagementData; loading: boolean }) {
  if (loading) {
    return <ChartSkeleton />
  }

  // Only show real data - no mock data
  if (!data || (data.averageTimeOnPage === 0 && data.averageScrollDepth === 0 && data.engagementRate === 0)) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <div className="text-2xl mb-2">📈</div>
          <p>Ei sitoutumisdataa saatavilla</p>
          <p className="text-sm">Sitoutumismetriikat näkyvät täällä kun käyttäjät ovat vuorovaikutuksessa sivuston kanssa</p>
        </div>
      </div>
    )
  }

  const metrics = [
    {
      name: 'Keskiaika sivulla',
      value: Math.round(data.averageTimeOnPage),
      unit: 's',
      color: '#3b82f6',
      icon: '⏱️',
      description: 'Kuinka kauan käyttäjät viipyvät sivulla',
      benchmark: data.averageTimeOnPage > 60 ? 'Erinomainen' : data.averageTimeOnPage > 30 ? 'Hyvä' : 'Parannettavaa',
      benchmarkColor: data.averageTimeOnPage > 60 ? 'text-green-600' : data.averageTimeOnPage > 30 ? 'text-yellow-600' : 'text-red-600'
    },
    {
      name: 'Keskimääräinen vierityssyvyys',
      value: Math.round(data.averageScrollDepth),
      unit: '%',
      color: '#10b981',
      icon: '📜',
      description: 'Kuinka pitkälle käyttäjät vierittävät sivua',
      benchmark: data.averageScrollDepth > 75 ? 'Erinomainen' : data.averageScrollDepth > 50 ? 'Hyvä' : 'Parannettavaa',
      benchmarkColor: data.averageScrollDepth > 75 ? 'text-green-600' : data.averageScrollDepth > 50 ? 'text-yellow-600' : 'text-red-600'
    },
    {
      name: 'Sitoutumisaste',
      value: Math.round(data.engagementRate),
      unit: '%',
      color: '#f59e0b',
      icon: '🎯',
      description: 'Aktiivisten istuntojen osuus',
      benchmark: data.engagementRate > 70 ? 'Erinomainen' : data.engagementRate > 50 ? 'Hyvä' : 'Parannettavaa',
      benchmarkColor: data.engagementRate > 70 ? 'text-green-600' : data.engagementRate > 50 ? 'text-yellow-600' : 'text-red-600'
    }
  ]

  return (
    <div className="space-y-4">
      {/* Metrics cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric, index) => (
          <div key={index} className="relative overflow-hidden rounded-lg border p-4 hover:shadow-sm transition-shadow">
            {/* Background gradient */}
            <div 
              className="absolute inset-0 opacity-5"
              style={{ backgroundColor: metric.color }}
            />
            
            <div className="relative">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="text-2xl">{metric.icon}</div>
                <div className={`text-xs font-medium px-2 py-1 rounded-full ${metric.benchmarkColor} bg-opacity-10`}>
                  {metric.benchmark}
                </div>
              </div>
              
              {/* Value */}
              <div className="mb-2">
                <div className="text-2xl font-bold" style={{ color: metric.color }}>
                  {metric.value.toLocaleString()}{metric.unit}
                </div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {metric.name}
                </div>
              </div>
              
              {/* Description */}
              <div className="text-xs text-muted-foreground">
                {metric.description}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Top engaging pages */}
      {data.topEngagingPages && data.topEngagingPages.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
            Sitoutuvimmat sivut
          </h4>
          <div className="space-y-2">
            {data.topEngagingPages.slice(0, 3).map((page, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{page.page}</div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round(page.avg_time)}s • {Math.round(page.avg_scroll)}% vieritys
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-orange-600 dark:text-orange-400">
                    {Math.round(page.engagement_score)}
                  </div>
                  <div className="text-xs text-muted-foreground">pistettä</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
        <div className="text-sm">
          <div className="font-medium text-orange-900 dark:text-orange-100 mb-1">
            💡 Sitoutumisen oivallus
          </div>
          <div className="text-orange-700 dark:text-orange-300">
            {data.engagementRate > 70 
              ? 'Erinomainen sitoutuminen! Käyttäjät ovat aktiivisia sivustollasi.'
              : data.engagementRate > 50
              ? 'Hyvä sitoutuminen. Voit parantaa sisältöä entisestään.'
              : 'Sitoutumista voi parantaa. Harkitse sisällön ja käyttökokemuksen optimointia.'}
          </div>
        </div>
      </div>
    </div>
  )
}

// Revenue chart component
function RevenueChart({ data, loading }: { data?: ConversionData; loading: boolean }) {
  if (loading) {
    return <ChartSkeleton />
  }

  const chartData = data?.revenueByDate || []

  // Show empty state if no data
  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <div className="text-2xl mb-2">💰</div>
          <p>Ei liikevaihtodataa saatavilla</p>
          <p className="text-sm">Liikevaihto näkyy täällä kun ensimmäiset ostokset tehdään</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="colorTransactions" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke="#374151" 
          strokeOpacity={0.3}
          horizontal={true}
          vertical={false}
        />
        <XAxis 
          dataKey="date" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 500 }}
          tickFormatter={(value) => new Date(value).toLocaleDateString('fi-FI', { month: 'short', day: 'numeric' })}
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 500 }}
          width={50}
          tickFormatter={(value) => `€${value}`}
        />
        <Tooltip
          contentStyle={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.98)', 
            border: '1px solid rgba(0, 0, 0, 0.1)', 
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            color: '#1f2937'
          }}
          formatter={(value, name) => [
            <span key="value" style={{ color: name === 'Liikevaihto' ? '#10b981' : '#3b82f6', fontWeight: 600 }}>
              {name === 'Liikevaihto' ? `€${Number(value).toFixed(2)}` : `${value} kpl`}
            </span>, 
            <span key="label" style={{ color: '#374151', fontWeight: 500 }}>
              {name}
            </span>
          ]}
          labelFormatter={(label) => new Date(label).toLocaleDateString('fi-FI', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
          labelStyle={{ color: '#1f2937', fontWeight: 600 }}
        />
        <Legend />
        <Area 
          type="monotone" 
          dataKey="revenue" 
          stroke="#10b981" 
          strokeWidth={3}
          fillOpacity={1} 
          fill="url(#colorRevenue)"
          name="Liikevaihto"
        />
        <Area 
          type="monotone" 
          dataKey="transactions" 
          stroke="#3b82f6" 
          strokeWidth={3}
          fillOpacity={1} 
          fill="url(#colorTransactions)"
          name="Transaktiot"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// Enhanced Device types visualization
function DeviceTypesChart({ data, loading }: { data?: AnalyticsData; loading: boolean }) {
  if (loading) {
    return <ChartSkeleton />
  }

  const chartData = data?.deviceTypes.map((device, index) => ({
    name: device.type === 'desktop' ? 'Tietokone' :
          device.type === 'mobile' ? 'Mobiili' :
          device.type === 'tablet' ? 'Tabletti' :
          device.type,
    originalType: device.type,
    value: device.percentage,
    count: device.count,
    color: COLORS[index % COLORS.length],
    icon: device.type === 'desktop' ? '💻' :
          device.type === 'mobile' ? '📱' :
          device.type === 'tablet' ? '📱' : '🖥️'
  })) || []

  // Show empty state if no data
  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <div className="text-2xl mb-2">📱</div>
          <p>Ei laitetietoja saatavilla</p>
          <p className="text-sm">Laitetyypit näkyvät täällä kun sivustolla on kävijöitä</p>
        </div>
      </div>
    )
  }

  const totalCount = chartData.reduce((sum, item) => sum + item.count, 0)

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>{chartData.length} laitetyyppiä</span>
        <span>Yhteensä {totalCount.toLocaleString()} käyttäjää</span>
      </div>

      {/* Device breakdown */}
      <div className="space-y-3">
        {chartData.map((device, index) => (
          <div key={index} className="relative">
            {/* Background bar */}
            <div 
              className="absolute inset-0 rounded-lg opacity-20"
              style={{ 
                backgroundColor: device.color,
                width: `${Math.max(device.value, 5)}%` 
              }} 
            />
            
            {/* Content */}
            <div className="relative flex items-center justify-between p-4 rounded-lg border hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-4 flex-1">
                {/* Device icon */}
                <div className="text-2xl">{device.icon}</div>
                
                {/* Device info */}
                <div className="flex-1">
                  <div className="font-medium text-lg">{device.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {device.count.toLocaleString()} käyttäjää
                  </div>
                </div>
              </div>
              
              {/* Percentage */}
              <div className="text-right">
                <div className="text-2xl font-bold" style={{ color: device.color }}>
                  {device.value.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">kaikista</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile-first insights */}
      <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
        <div className="text-sm">
          <div className="font-medium text-purple-900 dark:text-purple-100 mb-1">
            📱 Mobiilikokemus
          </div>
          <div className="text-purple-700 dark:text-purple-300">
            {chartData.find(d => d.originalType === 'mobile')?.value || 0 > 50 
              ? 'Mobiili on tärkein alusta - varmista optimaalinen mobiilikokemus!'
              : 'Tietokone on pääasiallinen alusta, mutta älä unohda mobiilioptimointia.'}
          </div>
        </div>
      </div>

      {/* Responsive design tip */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
        <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
          <div className="font-medium">Mobiili</div>
          <div>{chartData.find(d => d.originalType === 'mobile')?.value.toFixed(1) || 0}%</div>
        </div>
        <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
          <div className="font-medium">Tietokone</div>
          <div>{chartData.find(d => d.originalType === 'desktop')?.value.toFixed(1) || 0}%</div>
        </div>
        <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
          <div className="font-medium">Tabletti</div>
          <div>{chartData.find(d => d.originalType === 'tablet')?.value.toFixed(1) || 0}%</div>
        </div>
      </div>
    </div>
  )
}

// Real-time activity component
function RealtimeActivity({ data, loading }: { data?: RealtimeAnalytics; loading: boolean }) {
  const t = useTranslations('Admin.analytics')

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            {t('realtime.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSkeleton />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          {t('realtime.title')}
          <Badge variant="secondary">{data?.metrics.activeUsers || 0} active</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Page Views</p>
              <p className="text-xl font-semibold">{data?.metrics.pageViews || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Revenue</p>
              <p className="text-xl font-semibold">€{data?.metrics.totalRevenue?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
          
          {data?.content.topPages && data.content.topPages.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Top Pages Right Now</p>
              <div className="space-y-1">
                {data.content.topPages.slice(0, 3).map((page, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="truncate">{page.page}</span>
                    <span className="text-muted-foreground">{page.views}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Top pages component
function TopPagesTable({ data, loading }: { data?: AnalyticsData; loading: boolean }) {
  const t = useTranslations('Admin.analytics')

  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t('tables.topPages')}</h3>
      <div className="rounded-md border">
        <div className="grid grid-cols-3 gap-4 p-4 font-medium border-b">
          <div>Page</div>
          <div>Views</div>
          <div>Avg. Time</div>
        </div>
        {data?.topPages.map((page, index) => (
          <div key={index} className="grid grid-cols-3 gap-4 p-4 border-b last:border-b-0">
            <div className="truncate">{page.page}</div>
            <div>{page.views}</div>
            <div>{Math.round(page.avg_time)}s</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Traffic sources component
function TrafficSourcesTable({ data, loading }: { data?: AnalyticsData; loading: boolean }) {
  const t = useTranslations('Admin.analytics')

  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t('tables.trafficSources')}</h3>
      <div className="rounded-md border">
        <div className="grid grid-cols-3 gap-4 p-4 font-medium border-b">
          <div>Source</div>
          <div>Visitors</div>
          <div>Percentage</div>
        </div>
        {data?.trafficSources.map((source, index) => (
          <div key={index} className="grid grid-cols-3 gap-4 p-4 border-b last:border-b-0">
            <div className="truncate">{source.source}</div>
            <div>{source.visitors}</div>
            <div>{source.percentage.toFixed(1)}%</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AnalyticsDashboard() {
  const t = useTranslations('Admin.analytics')
  const [dateRange, setDateRange] = useState('7d')
  const [loading, setLoading] = useState(true)
  const [realtimeLoading, setRealtimeLoading] = useState(true)
  
  // Data states
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>()
  const [realtimeData, setRealtimeData] = useState<RealtimeAnalytics>()
  const [conversionData, setConversionData] = useState<ConversionData>()
  const [engagementData, setEngagementData] = useState<EngagementData>()

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      const [analytics, conversions, engagement] = await Promise.all([
        getAnalyticsData(dateRange),
        getConversionData(dateRange),
        getEngagementData(dateRange)
      ])
      
      setAnalyticsData(analytics)
      setConversionData(conversions)
      setEngagementData(engagement)
    } catch (error) {
      console.error('Error fetching analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch real-time data
  const fetchRealtimeData = async () => {
    try {
      setRealtimeLoading(true)
      const realtime = await getRealtimeAnalytics()
      setRealtimeData(realtime)
    } catch (error) {
      console.error('Error fetching real-time data:', error)
    } finally {
      setRealtimeLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchAnalyticsData()
  }, [dateRange])

  useEffect(() => {
    fetchRealtimeData()
    
    // Set up real-time data refresh every 30 seconds
    const interval = setInterval(fetchRealtimeData, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold dark:text-white">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Seuraa sivustosi suorituskykyä ja käyttäjäkäyttäytymistä
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              // Export functionality
              const csvData = generateCSVReport(analyticsData, conversionData, engagementData)
              downloadCSV(csvData, `analytics-report-${dateRange}.csv`)
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Vie raportti
          </Button>
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
          <Button onClick={fetchAnalyticsData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Päivitä
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Sivulataukset"
          value={analyticsData?.totalPageViews || 0}
          icon={Eye}
          loading={loading}
          format="number"
          description="Kaikki sivulataukset"
          trend="Viimeisen 24h aikana"
        />
        <MetricCard
          title="Uniikkeja kävijöitä"
          value={analyticsData?.uniqueVisitors || 0}
          icon={Users}
          loading={loading}
          format="number"
          description="Eri käyttäjiä"
          trend="Aktiiviset käyttäjät"
        />
        <MetricCard
          title="Keskimääräinen istunto"
          value={analyticsData?.avgSessionDuration || 0}
          icon={Clock}
          loading={loading}
          format="duration"
          description="Aika sivustolla"
          trend="Käyttäjäkokemus"
        />
        <MetricCard
          title="Poistumisprosentti"
          value={analyticsData?.bounceRate || 0}
          icon={TrendingUp}
          loading={loading}
          format="percentage"
          description="Yhden sivun istunnot"
          trend="Sitoutuminen"
        />
      </div>

      {/* Additional KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          title="Konversio"
          value={conversionData?.conversionRate || 0}
          icon={Target}
          loading={loading}
          format="percentage"
          description="Ostoksi päätyneet"
          trend="Myynti"
        />
        <MetricCard
          title="Liikevaihto"
          value={conversionData?.totalRevenue || 0}
          icon={TrendingUp}
          loading={loading}
          format="currency"
          description="Kokonaismyynti"
          trend="Tulot"
        />
        <MetricCard
          title="Keskiostos"
          value={conversionData?.averageOrderValue || 0}
          icon={Activity}
          loading={loading}
          format="currency"
          description="AOV"
          trend="Ostoskäyttäytyminen"
        />
        <MetricCard
          title="Sitoutumisaste"
          value={engagementData?.engagementRate || 0}
          icon={MousePointer}
          loading={loading}
          format="percentage"
          description="Aktiiviset istunnot"
          trend="Käyttäjäkokemus"
        />
        <MetricCard
          title="Aktiiviset nyt"
          value={realtimeData?.metrics.activeUsers || 0}
          icon={Activity}
          loading={realtimeLoading}
          format="number"
          description="Live-käyttäjät"
          trend="Reaaliaikainen"
        />
      </div>

      {/* Real-time Activity */}
      <RealtimeActivity data={realtimeData} loading={realtimeLoading} />

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Sivulataukset ajassa
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              Päivittäiset sivulataukset ja uniikkien kävijöiden määrä
            </div>
          </CardHeader>
          <CardContent>
            <PageViewsChart data={analyticsData} loading={loading} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Liikennölähteet
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              Mistä kävijät tulevat sivustollesi
            </div>
          </CardHeader>
          <CardContent>
            <TrafficSourcesChart data={analyticsData} loading={loading} />
          </CardContent>
        </Card>
      </div>

      {/* Revenue & Conversion Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Liikevaihto ajassa
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              Päivittäinen liikevaihto ja transaktiot
            </div>
          </CardHeader>
          <CardContent>
            <RevenueChart data={conversionData} loading={loading} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Sitoutumismetriikat
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              Käyttäjien sitoutuminen ja vuorovaikutus
            </div>
          </CardHeader>
          <CardContent>
            <EngagementChart data={engagementData} loading={loading} />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Yleiskatsaus
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Oivallukset
          </TabsTrigger>
          <TabsTrigger value="user-agents" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Laitteet
          </TabsTrigger>
          <TabsTrigger value="geographic" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Maantiede
          </TabsTrigger>
          <TabsTrigger value="ab-testing" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            A/B Testit
          </TabsTrigger>
          <TabsTrigger value="real-time" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Reaaliaikainen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Suosituimmat sivut
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              Sivujen suorituskyky katselukertojen ja keskiajan mukaan
            </div>
          </CardHeader>
          <CardContent>
            <TopPagesChart data={analyticsData} loading={loading} />
          </CardContent>
        </Card>
            <div className="space-y-6">
              <TopPagesTable data={analyticsData} loading={loading} />
            </div>
          </div>
          <TrafficSourcesTable data={analyticsData} loading={loading} />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Performance Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Suorituskyvyn oivallukset
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div>
                      <div className="font-medium text-blue-900 dark:text-blue-100">
                        Sivulatausten trendi
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        {analyticsData?.totalPageViews && analyticsData.totalPageViews > 1000 
                          ? 'Hyvä liikenne - yli 1000 sivulatausta' 
                          : 'Kasvupotentiaalia - alle 1000 sivulatausta'}
                      </div>
                    </div>
                    <div className="text-2xl">
                      {analyticsData?.totalPageViews && analyticsData.totalPageViews > 1000 ? '📈' : '🎯'}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div>
                      <div className="font-medium text-green-900 dark:text-green-100">
                        Poistumisprosentti
                      </div>
                      <div className="text-sm text-green-700 dark:text-green-300">
                        {analyticsData?.bounceRate && analyticsData.bounceRate < 40 
                          ? 'Erinomainen sitoutuminen' 
                          : analyticsData?.bounceRate && analyticsData.bounceRate < 60
                          ? 'Hyvä sitoutuminen'
                          : 'Parannettavaa sitoutumisessa'}
                      </div>
                    </div>
                    <div className="text-2xl">
                      {analyticsData?.bounceRate && analyticsData.bounceRate < 40 ? '🎉' : 
                       analyticsData?.bounceRate && analyticsData.bounceRate < 60 ? '👍' : '⚠️'}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div>
                      <div className="font-medium text-purple-900 dark:text-purple-100">
                        Konversio-optimointi
                      </div>
                      <div className="text-sm text-purple-700 dark:text-purple-300">
                        {conversionData?.conversionRate && conversionData.conversionRate > 2 
                          ? 'Erinomainen konversio' 
                          : 'Optimointipotentiaalia'}
                      </div>
                    </div>
                    <div className="text-2xl">
                      {conversionData?.conversionRate && conversionData.conversionRate > 2 ? '💰' : '🔧'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Performing Content */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Parhaiten suoriutuvat sivut
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData?.topPages.slice(0, 5).map((page, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{page.page}</div>
                        <div className="text-sm text-muted-foreground">
                          Keskiaika: {Math.round(page.avg_time)}s
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{page.views}</div>
                        <div className="text-xs text-muted-foreground">katselua</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Suositukset parantamiseen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg">
                  <div className="font-medium mb-2">📊 Seuranta</div>
                  <div className="text-sm text-muted-foreground">
                    Lisää tavoitteiden seurantaa ja konversioiden mittaamista
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="font-medium mb-2">🎯 Optimointi</div>
                  <div className="text-sm text-muted-foreground">
                    Testaa erilaisia sisältöjä ja käyttöliittymäratkaisuja
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="font-medium mb-2">📱 Mobiili</div>
                  <div className="text-sm text-muted-foreground">
                    Varmista optimaalinen mobiilikokemus kaikilla laitteilla
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              title="Avg. Time on Page"
              value={`${Math.round(engagementData?.averageTimeOnPage || 0)}s`}
              icon={Clock}
              loading={loading}
            />
            <MetricCard
              title="Avg. Scroll Depth"
              value={`${Math.round(engagementData?.averageScrollDepth || 0)}%`}
              icon={MousePointer}
              loading={loading}
            />
            <MetricCard
              title="Engagement Rate"
              value={`${engagementData?.engagementRate?.toFixed(1) || 0}%`}
              icon={TrendingUp}
              loading={loading}
            />
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Engagement Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <EngagementChart data={engagementData} loading={loading} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard
              title="Total Revenue"
              value={`€${conversionData?.totalRevenue?.toFixed(2) || '0.00'}`}
              icon={TrendingUp}
              loading={loading}
            />
            <MetricCard
              title="Total Transactions"
              value={conversionData?.totalTransactions || 0}
              icon={TrendingUp}
              loading={loading}
            />
            <MetricCard
              title="Avg. Order Value"
              value={`€${conversionData?.averageOrderValue?.toFixed(2) || '0.00'}`}
              icon={TrendingUp}
              loading={loading}
            />
            <MetricCard
              title="Conversion Rate"
              value={`${conversionData?.conversionRate?.toFixed(2) || 0}%`}
              icon={TrendingUp}
              loading={loading}
            />
          </div>
        </TabsContent>

        <TabsContent value="audience" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Device Types */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  Device Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DeviceTypesChart data={analyticsData} loading={loading} />
              </CardContent>
            </Card>

            {/* Countries */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Countries
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <LoadingSkeleton />
                ) : (
                  <div className="space-y-2">
                    {analyticsData?.countries.map((country, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{country.country}</span>
                        <span>{country.percentage.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="user-agents" className="space-y-4">
          <UserAgentAnalytics dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="geographic" className="space-y-4">
          <GeographicAnalytics dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="ab-testing" className="space-y-4">
          <ABTestingDashboard />
        </TabsContent>

        <TabsContent value="real-time" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Real-time Analytics
              </CardTitle>
              <p>
                Live visitor activity and real-time metrics
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Real-time Dashboard Coming Soon</h3>
                <p className="text-gray-600 mb-4">
                  Live visitor tracking and real-time analytics dashboard
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <p>✅ Real-time data collection active</p>
                  <p>✅ Session tracking implemented</p>
                  <p>🔄 Live dashboard in development</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 