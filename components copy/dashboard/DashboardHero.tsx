'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { DataQualityBadge, type DataQualityMetrics } from './DataQualityBadge'
import { FileUp, Rocket, BookOpen } from 'lucide-react'

interface DashboardHeroProps {
  companyName: string
  userName?: string
  dataQuality: DataQualityMetrics
}

export function DashboardHero({ companyName, userName, dataQuality }: DashboardHeroProps) {
  const t = useTranslations('Dashboard.hero')
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return t('goodMorning', { default: 'Good morning' })
    if (hour < 18) return t('goodAfternoon', { default: 'Good afternoon' })
    return t('goodEvening', { default: 'Good evening' })
  }

  const quickActions = [
    {
      icon: FileUp,
      label: t('uploadDocuments', { default: 'Upload Documents' }),
      description: t('uploadDocumentsDesc', { default: 'Add financial statements' }),
      action: () => router.push(`/${locale}/dashboard/documents`),
      variant: 'default' as const,
      show: dataQuality.completeness < 90
    },
    {
      icon: Rocket,
      label: t('newApplication', { default: 'New Application' }),
      description: t('newApplicationDesc', { default: 'Apply for funding' }),
      action: () => router.push(`/${locale}/finance-application`),
      variant: 'default' as const,
      show: dataQuality.hasFinancialData
    },
    {
      icon: BookOpen,
      label: t('viewGuide', { default: 'View Guide' }),
      description: t('viewGuideDesc', { default: 'Learn how it works' }),
      action: () => router.push(`/${locale}/help`),
      variant: 'outline' as const,
      show: true
    }
  ]

  const visibleActions = quickActions.filter(action => action.show)

  return (
    <div className="rounded-lg border bg-gradient-to-br from-card via-card to-muted/20 p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        {/* Left side - Greeting & Company */}
        <div className="flex-1">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {getGreeting()}{userName ? `, ${userName}` : ''}! 👋
            </h1>
            <p className="text-lg text-muted-foreground">
              {companyName}
            </p>
          </div>

          {/* Data Quality Badge */}
          <div className="mt-6">
            <DataQualityBadge 
              metrics={dataQuality} 
              variant="compact"
            />
          </div>

          {/* Quick Stats */}
          {dataQuality.completeness < 100 && (
            <div className="mt-4 p-4 rounded-lg bg-muted/50">
              <p className="text-sm font-medium mb-2">
                {t('quickTip', { default: '💡 Quick Tip' })}
              </p>
              <p className="text-sm text-muted-foreground">
                {dataQuality.completeness < 50 ? 
                  t('tipLow', { 
                    default: 'Upload your financial statements to get personalized funding recommendations.' 
                  }) :
                  t('tipMedium', { 
                    default: 'You\'re almost there! Complete your profile to unlock all features.' 
                  })
                }
              </p>
            </div>
          )}
        </div>

        {/* Right side - Quick Actions */}
        <div className="md:w-80">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground mb-3">
              {t('quickActions', { default: 'Quick Actions' })}
            </p>
            <div className="space-y-2">
              {visibleActions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant}
                  className="w-full justify-start gap-3 h-auto py-3"
                  onClick={action.action}
                >
                  <action.icon className="h-5 w-5 flex-shrink-0" />
                  <div className="flex flex-col items-start text-left">
                    <span className="font-semibold">{action.label}</span>
                    <span className="text-xs opacity-80">{action.description}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

