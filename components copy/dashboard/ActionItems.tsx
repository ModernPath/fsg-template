'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileUp,
  Rocket,
  Clock,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Lightbulb,
  Target,
  type LucideIcon
} from 'lucide-react'

export interface ActionItem {
  id: string
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  action?: () => void
  icon: LucideIcon
  completed?: boolean
  actionLabel?: string
}

interface ActionItemsProps {
  dashboardData: any
  className?: string
}

const PRIORITY_ORDER = {
  high: 1,
  medium: 2,
  low: 3
}

export function ActionItems({ dashboardData, className }: ActionItemsProps) {
  const t = useTranslations('Dashboard.actionItems')
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  const generateActionItems = (): ActionItem[] => {
    const items: ActionItem[] = []

    // Calculate metrics completeness
    const metricsCompleteness = dashboardData?.metrics?.length > 0 ? 
      (dashboardData.metrics[0]?.revenue ? 25 : 0) +
      (dashboardData.metrics[0]?.ebitda ? 25 : 0) +
      (dashboardData.metrics[0]?.net_profit ? 25 : 0) +
      (dashboardData.metrics[0]?.total_assets ? 25 : 0) : 0

    // No financial data at all
    if (!dashboardData?.metrics || dashboardData.metrics.length === 0) {
      items.push({
        id: 'upload_financials',
        priority: 'high',
        title: t('uploadFinancials', { default: 'Upload Financial Statements' }),
        description: t('uploadFinancialsDesc', { 
          default: 'Get personalized funding recommendations by uploading your balance sheet and income statement' 
        }),
        action: () => router.push(`/${locale}/dashboard/documents`),
        icon: FileUp,
        actionLabel: t('upload', { default: 'Upload Now' })
      })
    }

    // Financial data incomplete
    if (metricsCompleteness > 0 && metricsCompleteness < 70) {
      const missingFields = []
      if (!dashboardData.metrics[0]?.revenue) missingFields.push('Revenue')
      if (!dashboardData.metrics[0]?.ebitda) missingFields.push('EBITDA')
      if (!dashboardData.metrics[0]?.net_profit) missingFields.push('Net Profit')
      if (!dashboardData.metrics[0]?.total_assets) missingFields.push('Total Assets')

      items.push({
        id: 'complete_data',
        priority: 'medium',
        title: t('completeData', { default: 'Complete Financial Data' }),
        description: t('completeDataDesc', { 
          missing: missingFields.join(', '),
          default: `Missing: ${missingFields.join(', ')}. Upload complete financial statements for better recommendations.` 
        }),
        action: () => router.push(`/${locale}/dashboard/documents`),
        icon: AlertCircle,
        actionLabel: t('uploadMore', { default: 'Upload More' })
      })
    }

    // No applications but has recommendations
    const hasApplications = dashboardData?.funding_applications?.length > 0
    const hasRecommendations = dashboardData?.recommendations?.recommendation_details?.length > 0

    if (!hasApplications && hasRecommendations && metricsCompleteness >= 50) {
      items.push({
        id: 'start_application',
        priority: 'high',
        title: t('startApplication', { default: 'Start Your First Application' }),
        description: t('startApplicationDesc', { 
          default: 'You have personalized recommendations. Apply now to receive offers from lenders.' 
        }),
        action: () => router.push(`/${locale}/finance-application`),
        icon: Rocket,
        actionLabel: t('apply', { default: 'Apply Now' })
      })
    }

    // Pending applications
    const pendingApps = dashboardData?.funding_applications?.filter((app: any) => 
      app.status === 'submitted' || app.status === 'processing'
    ).length || 0

    if (pendingApps > 0) {
      items.push({
        id: 'check_applications',
        priority: 'medium',
        title: t('checkApplications', { 
          default: `Check Application Status`,
          count: pendingApps 
        }),
        description: t('checkApplicationsDesc', { 
          default: `You have ${pendingApps} pending application(s). Check if you've received any offers.`,
          count: pendingApps 
        }),
        action: () => {
          // ✅ Fixed: Use router to navigate to applications page
          router.push(`/${locale}/dashboard/applications`)
        },
        icon: Clock,
        actionLabel: t('viewApplications', { default: 'View Applications' })
      })
    }

    // Old data warning
    if (dashboardData?.metrics?.[0]) {
      const latestYear = dashboardData.metrics[0].fiscal_year
      const currentYear = new Date().getFullYear()
      
      if (currentYear - latestYear > 1) {
        items.push({
          id: 'update_data',
          priority: 'medium',
          title: t('updateData', { default: 'Update Financial Data' }),
          description: t('updateDataDesc', { 
            default: `Your latest data is from ${latestYear}. Upload recent statements for accurate recommendations.`,
            year: latestYear 
          }),
          action: () => router.push(`/${locale}/dashboard/documents`),
          icon: TrendingUp,
          actionLabel: t('updateNow', { default: 'Update Now' })
        })
      }
    }

    // No recommendations yet
    if (!hasRecommendations && metricsCompleteness >= 50) {
      items.push({
        id: 'get_recommendations',
        priority: 'high',
        title: t('getRecommendations', { default: 'Get Funding Recommendations' }),
        description: t('getRecommendationsDesc', { 
          default: 'Run financial analysis to receive personalized funding options for your business.' 
        }),
        action: () => router.push(`/${locale}/finance-application?step=1`),
        icon: Lightbulb,
        actionLabel: t('analyze', { default: 'Analyze Now' })
      })
    }

    // Approved applications with no action
    const approvedApps = dashboardData?.funding_applications?.filter((app: any) => 
      app.status === 'approved'
    ).length || 0

    if (approvedApps > 0) {
      items.push({
        id: 'review_offers',
        priority: 'high',
        title: t('reviewOffers', { 
          default: `Review and Accept Offers`,
          count: approvedApps 
        }),
        description: t('reviewOffersDesc', { 
          default: `You have ${approvedApps} approved offer(s) waiting for your review. Don't miss out!`,
          count: approvedApps 
        }),
        action: () => {
          const section = document.getElementById('funding-applications')
          section?.scrollIntoView({ behavior: 'smooth' })
        },
        icon: Target,
        actionLabel: t('reviewNow', { default: 'Review Now' })
      })
    }

    // Sort by priority
    return items.sort((a, b) => 
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    )
  }

  const actionItems = generateActionItems()

  if (actionItems.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <p className="font-semibold text-lg mb-2">
              {t('allCaughtUp', { default: 'You\'re All Caught Up!' })}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('allCaughtUpDesc', { default: 'No pending actions. Check back later for new opportunities.' })}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          {t('title', { default: 'Action Items' })}
          <Badge variant="secondary" className="ml-auto">
            {actionItems.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {actionItems.map((item) => {
            const Icon = item.icon
            const priorityConfig = {
              high: { 
                color: 'text-red-600 dark:text-red-400', 
                bgColor: 'bg-red-50 dark:bg-red-950',
                borderColor: 'border-red-200 dark:border-red-800'
              },
              medium: { 
                color: 'text-yellow-600 dark:text-yellow-400', 
                bgColor: 'bg-yellow-50 dark:bg-yellow-950',
                borderColor: 'border-yellow-200 dark:border-yellow-800'
              },
              low: { 
                color: 'text-blue-600 dark:text-blue-400', 
                bgColor: 'bg-blue-50 dark:bg-blue-950',
                borderColor: 'border-blue-200 dark:border-blue-800'
              }
            }

            const config = priorityConfig[item.priority]

            return (
              <div
                key={item.id}
                className={`flex items-start gap-4 p-4 rounded-lg border ${config.borderColor} ${config.bgColor} transition-all hover:shadow-md`}
              >
                <div className={`p-2 rounded-lg bg-card`}>
                  <Icon className={`h-5 w-5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{item.title}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {item.description}
                  </p>
                  {item.action && (
                    <Button 
                      size="sm" 
                      variant={item.priority === 'high' ? 'default' : 'outline'}
                      onClick={item.action}
                      className="h-8"
                    >
                      {item.actionLabel || t('takeAction', { default: 'Take Action' })}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

