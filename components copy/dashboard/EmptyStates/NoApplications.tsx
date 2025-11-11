'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Rocket, Clock, CheckCircle2, Lightbulb } from 'lucide-react'

interface NoApplicationsProps {
  hasRecommendations?: boolean
  className?: string
}

export function NoApplications({ hasRecommendations = false, className }: NoApplicationsProps) {
  const t = useTranslations('Dashboard.emptyStates.noApplications')
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  const handleStartApplication = () => {
    router.push(`/${locale}/finance-application`)
  }

  const handleViewRecommendations = () => {
    // Scroll to recommendations section
    document.getElementById('funding-recommendations')?.scrollIntoView({ behavior: 'smooth' })
  }

  const steps = [
    {
      icon: Lightbulb,
      title: t('step1Title', { default: 'Get Recommendations' }),
      description: t('step1Desc', { default: 'AI analyzes your finances and suggests best funding options' })
    },
    {
      icon: Rocket,
      title: t('step2Title', { default: 'Apply in Minutes' }),
      description: t('step2Desc', { default: 'Pre-filled application with your company data' })
    },
    {
      icon: Clock,
      title: t('step3Title', { default: 'Receive Offers' }),
      description: t('step3Desc', { default: 'Get multiple offers from lenders in 24-48 hours' })
    },
    {
      icon: CheckCircle2,
      title: t('step4Title', { default: 'Choose & Accept' }),
      description: t('step4Desc', { default: 'Compare offers and accept the best one for your business' })
    }
  ]

  return (
    <Card className={className}>
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4 h-24 w-24 rounded-full bg-muted flex items-center justify-center">
          <Rocket className="h-12 w-12 text-muted-foreground" />
        </div>
        <CardTitle className="text-2xl">
          {t('title', { default: 'No Funding Applications Yet' })}
        </CardTitle>
        <CardDescription className="text-base">
          {t('description', { 
            default: 'Start your first funding application and get offers from multiple lenders' 
          })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* How it Works */}
        <div>
          <h3 className="font-semibold text-center mb-4">
            {t('howItWorks', { default: 'How It Works' })}
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={index} className="relative flex flex-col items-center text-center p-4 rounded-lg border bg-card">
                <div className="absolute -top-3 -left-3 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <step.icon className="h-8 w-8 mb-2 text-primary" />
                <h4 className="font-semibold mb-1 text-sm">{step.title}</h4>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          {hasRecommendations ? (
            <>
              <Button onClick={handleStartApplication} size="lg" className="gap-2">
                <Rocket className="h-5 w-5" />
                {t('startButton', { default: 'Start Application' })}
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={handleViewRecommendations}
              >
                {t('viewRecommendations', { default: 'View Recommendations' })}
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleStartApplication} size="lg" className="gap-2">
                <Rocket className="h-5 w-5" />
                {t('startButton', { default: 'Start Application' })}
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => router.push(`/${locale}/dashboard/documents`)}
              >
                {t('uploadFirst', { default: 'Upload Documents First' })}
              </Button>
            </>
          )}
        </div>

        {/* Trust Indicator */}
        <div className="mt-4 p-4 rounded-lg bg-muted/50 text-center">
          <p className="text-sm font-medium mb-1">
            {t('trustTitle', { default: '🔒 Secure & Confidential' })}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('trustDesc', { 
              default: 'Your data is encrypted and only shared with lenders you choose' 
            })}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

