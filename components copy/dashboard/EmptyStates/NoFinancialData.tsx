'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileUp, TrendingUp, BarChart3 } from 'lucide-react'

interface NoFinancialDataProps {
  companyId?: string
  className?: string
}

export function NoFinancialData({ companyId, className }: NoFinancialDataProps) {
  const t = useTranslations('Dashboard.emptyStates.noFinancialData')
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  const handleUploadDocument = () => {
    router.push(`/${locale}/dashboard/documents`)
  }

  const benefits = [
    {
      icon: TrendingUp,
      title: t('benefit1Title', { default: 'Get Funding Recommendations' }),
      description: t('benefit1Desc', { default: 'AI-powered analysis of your financial situation' })
    },
    {
      icon: BarChart3,
      title: t('benefit2Title', { default: 'Track Financial Trends' }),
      description: t('benefit2Desc', { default: 'Visualize your company growth over time' })
    },
    {
      icon: FileUp,
      title: t('benefit3Title', { default: 'Faster Applications' }),
      description: t('benefit3Desc', { default: 'Pre-filled funding applications with your data' })
    }
  ]

  return (
    <Card className={className}>
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4 h-24 w-24 rounded-full bg-muted flex items-center justify-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground" />
        </div>
        <CardTitle className="text-2xl">
          {t('title', { default: 'No Financial Data Yet' })}
        </CardTitle>
        <CardDescription className="text-base">
          {t('description', { 
            default: 'Upload your financial statements to unlock personalized insights and funding recommendations' 
          })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Benefits Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex flex-col items-center text-center p-4 rounded-lg border bg-card">
              <benefit.icon className="h-8 w-8 mb-2 text-primary" />
              <h4 className="font-semibold mb-1">{benefit.title}</h4>
              <p className="text-sm text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button onClick={handleUploadDocument} size="lg" className="gap-2">
            <FileUp className="h-5 w-5" />
            {t('uploadButton', { default: 'Upload Financial Statement' })}
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => router.push(`/${locale}/onboarding`)}
          >
            {t('guideButton', { default: 'View Upload Guide' })}
          </Button>
        </div>

        {/* Info Box */}
        <div className="mt-4 p-4 rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground text-center">
            {t('acceptedFormats', { 
              default: 'We accept: PDF, Excel, and image files of balance sheets, income statements, and financial reports' 
            })}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

