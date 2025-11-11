'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lightbulb, Upload, Building2, FileText } from 'lucide-react'

interface NoRecommendationsProps {
  hasFinancialData?: boolean
  hasCompanyProfile?: boolean
  className?: string
}

export function NoRecommendations({ 
  hasFinancialData = false, 
  hasCompanyProfile = true,
  className 
}: NoRecommendationsProps) {
  const t = useTranslations('Dashboard.emptyStates.noRecommendations')
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  const requirements = [
    {
      icon: Building2,
      title: t('req1Title', { default: 'Company Profile' }),
      description: t('req1Desc', { default: 'Basic company information and business details' }),
      completed: hasCompanyProfile
    },
    {
      icon: FileText,
      title: t('req2Title', { default: 'Financial Statements' }),
      description: t('req2Desc', { default: 'Recent balance sheet and income statement' }),
      completed: hasFinancialData
    },
    {
      icon: Lightbulb,
      title: t('req3Title', { default: 'AI Analysis' }),
      description: t('req3Desc', { default: 'Automated analysis of your funding needs' }),
      completed: hasFinancialData && hasCompanyProfile
    }
  ]

  const getNextStep = () => {
    if (!hasCompanyProfile) {
      return {
        title: t('nextStepProfile', { default: 'Complete Company Profile' }),
        action: () => router.push(`/${locale}/onboarding`)
      }
    }
    if (!hasFinancialData) {
      return {
        title: t('nextStepDocuments', { default: 'Upload Financial Documents' }),
        action: () => router.push(`/${locale}/dashboard/documents`)
      }
    }
    return {
      title: t('nextStepAnalysis', { default: 'Run Financial Analysis' }),
      action: () => router.push(`/${locale}/finance-application`)
    }
  }

  const nextStep = getNextStep()

  return (
    <Card className={className}>
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4 h-24 w-24 rounded-full bg-muted flex items-center justify-center">
          <Lightbulb className="h-12 w-12 text-muted-foreground" />
        </div>
        <CardTitle className="text-2xl">
          {t('title', { default: 'Getting Your Recommendations Ready' })}
        </CardTitle>
        <CardDescription className="text-base">
          {t('description', { 
            default: 'Complete the following steps to receive personalized funding recommendations' 
          })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Requirements Checklist */}
        <div className="space-y-3">
          {requirements.map((req, index) => (
            <div 
              key={index} 
              className={`flex items-start gap-4 p-4 rounded-lg border ${
                req.completed ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' : 'bg-card'
              }`}
            >
              <div className={`p-2 rounded-lg ${
                req.completed ? 'bg-green-100 dark:bg-green-900' : 'bg-muted'
              }`}>
                <req.icon className={`h-6 w-6 ${
                  req.completed ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                }`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">{req.title}</h4>
                  {req.completed && (
                    <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                      {t('completed', { default: 'Completed' })}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{req.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {t('progress', { default: 'Setup Progress' })}
            </span>
            <span className="font-medium">
              {Math.round((requirements.filter(r => r.completed).length / requirements.length) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500"
              style={{ 
                width: `${(requirements.filter(r => r.completed).length / requirements.length) * 100}%` 
              }}
            />
          </div>
        </div>

        {/* Next Step CTA */}
        <div className="pt-4">
          <Button 
            onClick={nextStep.action} 
            size="lg" 
            className="w-full gap-2"
          >
            <Upload className="h-5 w-5" />
            {nextStep.title}
          </Button>
        </div>

        {/* Info */}
        <div className="mt-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <span className="font-semibold">{t('infoTitle', { default: 'Why do we need this?' })}</span>
            <br />
            {t('infoDesc', { 
              default: 'Our AI needs your financial data to analyze your situation and recommend the best funding options for your business needs.' 
            })}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

