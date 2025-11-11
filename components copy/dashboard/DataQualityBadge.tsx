'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { CheckCircle2, AlertCircle, XCircle, Info } from 'lucide-react'

export interface DataQualityMetrics {
  completeness: number // 0-100
  lastUpdated?: Date
  missingFields?: string[]
  hasFinancialData: boolean
  hasDocuments: boolean
  hasRecommendations: boolean
}

interface DataQualityBadgeProps {
  metrics: DataQualityMetrics
  showDetails?: boolean
  variant?: 'default' | 'compact'
}

export function DataQualityBadge({ 
  metrics, 
  showDetails = false,
  variant = 'default'
}: DataQualityBadgeProps) {
  const t = useTranslations('Dashboard.dataQuality')

  const getQualityLevel = (completeness: number) => {
    if (completeness >= 90) return 'complete'
    if (completeness >= 50) return 'partial'
    return 'incomplete'
  }

  const getQualityConfig = (level: string) => {
    switch (level) {
      case 'complete':
        return {
          icon: CheckCircle2,
          label: t('complete', { default: 'Complete' }),
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-950',
          borderColor: 'border-green-200 dark:border-green-800',
          badgeVariant: 'default' as const,
          emoji: '🟢'
        }
      case 'partial':
        return {
          icon: AlertCircle,
          label: t('partial', { default: 'Partial' }),
          color: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-yellow-50 dark:bg-yellow-950',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          badgeVariant: 'secondary' as const,
          emoji: '🟡'
        }
      case 'incomplete':
        return {
          icon: XCircle,
          label: t('incomplete', { default: 'Incomplete' }),
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-950',
          borderColor: 'border-red-200 dark:border-red-800',
          badgeVariant: 'destructive' as const,
          emoji: '🔴'
        }
      default:
        return {
          icon: Info,
          label: t('unknown', { default: 'Unknown' }),
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-50 dark:bg-gray-950',
          borderColor: 'border-gray-200 dark:border-gray-800',
          badgeVariant: 'secondary' as const,
          emoji: '⚪'
        }
    }
  }

  const level = getQualityLevel(metrics.completeness)
  const config = getQualityConfig(level)
  const Icon = config.icon

  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return t('today', { default: 'today' })
    if (days === 1) return t('yesterday', { default: 'yesterday' })
    if (days < 7) return t('daysAgo', { default: `${days} days ago`, days })
    if (days < 30) return t('weeksAgo', { default: `${Math.floor(days / 7)} weeks ago`, weeks: Math.floor(days / 7) })
    return date.toLocaleDateString()
  }

  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant={config.badgeVariant} className="gap-1.5 cursor-help">
              <span>{config.emoji}</span>
              <span>{metrics.completeness}%</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-2">
              <p className="font-semibold">
                {t('dataQualityTitle', { default: 'Data Quality' })}: {config.label}
              </p>
              <div className="text-sm space-y-1">
                <p className="flex items-center gap-2">
                  {metrics.hasFinancialData ? '✅' : '❌'}
                  {t('financialData', { default: 'Financial Data' })}
                </p>
                <p className="flex items-center gap-2">
                  {metrics.hasDocuments ? '✅' : '❌'}
                  {t('documents', { default: 'Documents' })}
                </p>
                <p className="flex items-center gap-2">
                  {metrics.hasRecommendations ? '✅' : '❌'}
                  {t('recommendations', { default: 'Recommendations' })}
                </p>
              </div>
              {metrics.lastUpdated && (
                <p className="text-xs text-muted-foreground">
                  {t('lastUpdated', { default: 'Updated' })}: {formatDate(metrics.lastUpdated)}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Default variant - full display
  return (
    <div className={`rounded-lg border ${config.borderColor} ${config.bgColor} p-4`}>
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 mt-0.5 ${config.color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm">
              {t('dataQualityTitle', { default: 'Data Quality' })}: {config.label}
            </h3>
            <Badge variant={config.badgeVariant} className="ml-2">
              {metrics.completeness}%
            </Badge>
          </div>

          {showDetails && (
            <>
              {/* Progress Bar */}
              <div className="mb-3">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      level === 'complete' ? 'bg-green-600' :
                      level === 'partial' ? 'bg-yellow-600' :
                      'bg-red-600'
                    } transition-all duration-500`}
                    style={{ width: `${metrics.completeness}%` }}
                  />
                </div>
              </div>

              {/* Status Items */}
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2">
                  {metrics.hasFinancialData ? 
                    <CheckCircle2 className="h-4 w-4 text-green-600" /> : 
                    <XCircle className="h-4 w-4 text-red-600" />
                  }
                  <span className={metrics.hasFinancialData ? '' : 'text-muted-foreground'}>
                    {t('financialData', { default: 'Financial Data' })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {metrics.hasDocuments ? 
                    <CheckCircle2 className="h-4 w-4 text-green-600" /> : 
                    <XCircle className="h-4 w-4 text-red-600" />
                  }
                  <span className={metrics.hasDocuments ? '' : 'text-muted-foreground'}>
                    {t('documents', { default: 'Documents' })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {metrics.hasRecommendations ? 
                    <CheckCircle2 className="h-4 w-4 text-green-600" /> : 
                    <XCircle className="h-4 w-4 text-red-600" />
                  }
                  <span className={metrics.hasRecommendations ? '' : 'text-muted-foreground'}>
                    {t('recommendations', { default: 'Recommendations' })}
                  </span>
                </div>
              </div>

              {/* Missing Fields */}
              {metrics.missingFields && metrics.missingFields.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs font-medium mb-1">
                    {t('missingFields', { default: 'Missing fields' })}:
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {metrics.missingFields.join(', ')}
                  </p>
                </div>
              )}

              {/* Last Updated */}
              {metrics.lastUpdated && (
                <p className="text-xs text-muted-foreground mt-3">
                  {t('lastUpdated', { default: 'Updated' })}: {formatDate(metrics.lastUpdated)}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Helper function to calculate data quality metrics
export function calculateDataQuality(dashboardData: any): DataQualityMetrics {
  let completeness = 0
  const checks = []

  // Check financial data (40 points)
  const hasFinancialData = dashboardData?.metrics && dashboardData.metrics.length > 0
  if (hasFinancialData) {
    completeness += 40
    const latestMetrics = dashboardData.metrics[0]
    if (latestMetrics?.revenue) completeness += 5
    if (latestMetrics?.ebitda) completeness += 5
    if (latestMetrics?.net_profit) completeness += 5
    if (latestMetrics?.total_assets) completeness += 5
  }
  checks.push({ field: 'financial_data', present: hasFinancialData })

  // Check documents (30 points)
  const hasDocuments = dashboardData?.documents && dashboardData.documents.length > 0
  if (hasDocuments) {
    completeness += 30
  }
  checks.push({ field: 'documents', present: hasDocuments })

  // Check recommendations (20 points)
  const hasRecommendations = dashboardData?.recommendations?.recommendation_details && 
                             dashboardData.recommendations.recommendation_details.length > 0
  if (hasRecommendations) {
    completeness += 20
  }
  checks.push({ field: 'recommendations', present: hasRecommendations })

  // Check company profile (10 points)
  const hasCompanyProfile = dashboardData?.company && dashboardData.company.id
  if (hasCompanyProfile) {
    completeness += 10
  }

  const missingFields = checks
    .filter(check => !check.present)
    .map(check => check.field)

  return {
    completeness: Math.min(100, completeness),
    lastUpdated: dashboardData?.updated_at ? new Date(dashboardData.updated_at) : new Date(),
    missingFields,
    hasFinancialData,
    hasDocuments,
    hasRecommendations
  }
}

