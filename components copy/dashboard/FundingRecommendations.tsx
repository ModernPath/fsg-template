'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Lightbulb
} from 'lucide-react'

interface RecommendationDetail {
  type: string
  title?: string
  amount?: number | string
  description?: string
  rationale?: string
  costs?: string
  benefits?: string
  timeframe?: string
  recommended_amount?: string
  cost_estimate?: string
  key_benefits?: string[]
  confidence?: number
  priority?: string
}

interface FundingRecommendationsProps {
  recommendations?: RecommendationDetail[]
  summary?: string
  analysis?: string
  companyId?: string
  appliedFundingTypes?: string[]
}

export function FundingRecommendations({
  recommendations = [],
  summary,
  analysis,
  companyId,
  appliedFundingTypes = []
}: FundingRecommendationsProps) {
  const t = useTranslations('Dashboard')
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  
  // Filter out already applied funding types
  const availableRecommendations = React.useMemo(() => {
    return recommendations.filter(rec => {
      // If no type specified, show it
      if (!rec.type) return true
      // Check if this funding type has already been applied for
      return !appliedFundingTypes.includes(rec.type)
    })
  }, [recommendations, appliedFundingTypes])

  const getFundingTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'business_loan':
      case 'business_loan_unsecured':
      case 'business_loan_secured':
      case 'yritysluotti':
        return <DollarSign className="h-5 w-5" />
      case 'credit_line':
      case 'luottolimiitti':
        return <TrendingUp className="h-5 w-5" />
      case 'factoring':
      case 'factoring_ar':
      case 'laskurahoitus':
        return <Clock className="h-5 w-5" />
      case 'leasing':
      case 'leasing-rahoitus':
        return <CheckCircle2 className="h-5 w-5" />
      case 'bank_guarantee':
      case 'refinancing':
        return <AlertCircle className="h-5 w-5" />
      default:
        return <Lightbulb className="h-5 w-5" />
    }
  }

  const getFundingTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      'business_loan': t('fundingTypes.businessLoan', { default: 'Yritysluotto' }),
      'business_loan_unsecured': t('fundingTypes.businessLoanUnsecured', { default: 'Vakuudeton yrityslaina' }),
      'business_loan_secured': t('fundingTypes.businessLoanSecured', { default: 'Vakuudellinen yrityslaina' }),
      'yritysluotti': t('fundingTypes.businessLoan', { default: 'Yritysluotto' }),
      'credit_line': t('fundingTypes.creditLine', { default: 'Luottolimiitti' }),
      'luottolimiitti': t('fundingTypes.creditLine', { default: 'Luottolimiitti' }),
      'factoring': t('fundingTypes.factoring', { default: 'Laskurahoitus' }),
      'factoring_ar': t('fundingTypes.factoringAr', { default: 'Laskurahoitus (myyntisaamiset)' }),
      'laskurahoitus': t('fundingTypes.factoring', { default: 'Laskurahoitus' }),
      'leasing': t('fundingTypes.leasing', { default: 'Leasing-rahoitus' }),
      'leasing-rahoitus': t('fundingTypes.leasing', { default: 'Leasing-rahoitus' }),
      'bank_guarantee': t('fundingTypes.bankGuarantee', { default: 'Pankkitakaus' }),
      'refinancing': t('fundingTypes.refinancing', { default: 'Jälleenrahoitus' }),
    }
    return typeMap[type?.toLowerCase()] || type
  }

  const extractAmount = (rec: RecommendationDetail): string | null => {
    // Try different amount fields
    if (rec.amount) {
      if (typeof rec.amount === 'number') {
        return formatCurrency(rec.amount)
      }
      return rec.amount.toString()
    }
    if (rec.recommended_amount) {
      return rec.recommended_amount
    }
    // Try to extract from description
    const amountMatch = rec.description?.match(/(\d+[\s,]*\d*)\s*€/i)
    if (amountMatch) {
      return amountMatch[0]
    }
    return null
  }

  const formatCurrency = (value: number) => {
    if (value >= 1_000_000) {
      return `€${(value / 1_000_000).toFixed(1)}M`
    }
    if (value >= 1_000) {
      return `€${(value / 1_000).toFixed(0)}k`
    }
    return `€${value}`
  }

  const handleApplyForFunding = (recommendation: RecommendationDetail) => {
    if (!companyId) {
      console.error('No company ID available')
      return
    }

    // Extract amount
    let amount = 100000 // Default
    if (recommendation.amount && typeof recommendation.amount === 'number') {
      amount = recommendation.amount
    } else if (recommendation.recommended_amount) {
      // Try to extract number from string like "150 000 €"
      const match = recommendation.recommended_amount.match(/(\d+[\s,]*\d*)/i)
      if (match) {
        amount = parseInt(match[1].replace(/[\s,]/g, ''))
      }
    }

    // Map type to funding type
    const fundingTypeMap: Record<string, string> = {
      'business_loan': 'business_loan',
      'yritysluotti': 'business_loan',
      'credit_line': 'credit_line',
      'luottolimiitti': 'credit_line',
      'factoring': 'factoring',
      'laskurahoitus': 'factoring',
      'leasing': 'leasing',
      'leasing-rahoitus': 'leasing',
    }

    const fundingType = fundingTypeMap[recommendation.type?.toLowerCase()] || 'credit_line'

    // Navigate to application with pre-filled data
    // Start from application details step
    const params = new URLSearchParams({
      step: 'application',
      fundingType: fundingType,
      companyId: companyId,
      amount: amount.toString(),
      recommendationTitle: recommendation.title || getFundingTypeName(recommendation.type),
      recommendationSummary: recommendation.description || recommendation.rationale || '',
      recommendationCostNotes: recommendation.costs || recommendation.cost_estimate || '',
    })

    // Use consistent route: /finance-application
    router.push(`/${locale}/finance-application?${params.toString()}`)
  }

  if (!availableRecommendations || availableRecommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            {t('recommendations.title', { default: 'Funding Recommendations' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">
              {recommendations.length > 0 && appliedFundingTypes.length > 0
                ? t('recommendations.allApplied', { 
                    default: 'You have already applied for all recommended funding options.' 
                  })
                : t('recommendations.noRecommendations', { 
                    default: 'No recommendations available yet. Complete the onboarding process to get personalized funding recommendations.' 
                  })
              }
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      {(summary || analysis) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              {t('recommendations.analysisTitle', { default: 'Financial Analysis' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary && (
              <div>
                <h4 className="text-sm font-semibold mb-2">
                  {t('recommendations.summary', { default: 'Summary' })}
                </h4>
                <p className="text-sm text-muted-foreground">{summary}</p>
              </div>
            )}
            {analysis && (
              <div>
                <h4 className="text-sm font-semibold mb-2">
                  {t('recommendations.analysis', { default: 'Analysis' })}
                </h4>
                <p className="text-sm text-muted-foreground">{analysis}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recommendations Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {availableRecommendations.map((rec, index) => {
          const amount = extractAmount(rec)
          const fundingTypeName = getFundingTypeName(rec.type)
          
          return (
            <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gradient-to-r from-gold-primary/5 to-gold-highlight/5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-gold-primary/10 text-gold-primary">
                      {getFundingTypeIcon(rec.type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {rec.title || fundingTypeName}
                      </CardTitle>
                      {amount && (
                        <Badge variant="secondary" className="mt-1">
                          {amount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {/* Description */}
                {(rec.description || rec.rationale) && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {rec.description || rec.rationale}
                    </p>
                  </div>
                )}

                {/* Key Benefits */}
                {rec.key_benefits && rec.key_benefits.length > 0 && (
                  <div>
                    <h5 className="text-xs font-semibold mb-2 text-green-700 dark:text-green-400">
                      {t('recommendations.benefits', { default: 'Key Benefits' })}
                    </h5>
                    <ul className="space-y-1">
                      {rec.key_benefits.map((benefit, i) => (
                        <li key={i} className="text-xs flex items-start gap-2">
                          <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-600 flex-shrink-0" />
                          <span className="text-muted-foreground">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Benefits (alternative field) */}
                {!rec.key_benefits && rec.benefits && (
                  <div>
                    <h5 className="text-xs font-semibold mb-1 text-green-700 dark:text-green-400">
                      {t('recommendations.benefits', { default: 'Benefits' })}
                    </h5>
                    <p className="text-xs text-muted-foreground">{rec.benefits}</p>
                  </div>
                )}

                {/* Costs */}
                {(rec.costs || rec.cost_estimate) && (
                  <div>
                    <h5 className="text-xs font-semibold mb-1 text-yellow-700 dark:text-yellow-400">
                      {t('recommendations.costs', { default: 'Estimated Costs' })}
                    </h5>
                    <p className="text-xs text-muted-foreground">
                      {rec.costs || rec.cost_estimate}
                    </p>
                  </div>
                )}

                {/* Timeframe */}
                {rec.timeframe && (
                  <div>
                    <h5 className="text-xs font-semibold mb-1">
                      {t('recommendations.timeframe', { default: 'Timeframe' })}
                    </h5>
                    <p className="text-xs text-muted-foreground">{rec.timeframe}</p>
                  </div>
                )}

                {/* Apply Button */}
                <Button 
                  onClick={() => handleApplyForFunding(rec)}
                  className="w-full mt-4"
                  variant="default"
                >
                  {t('recommendations.applyNow', { default: 'Apply for this funding' })}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Info Banner */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
        <CardContent className="flex items-start gap-3 pt-6">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-blue-900 dark:text-blue-200">
              {t('recommendations.infoTitle', { default: 'Personalized Recommendations' })}
            </p>
            <p className="text-blue-800 dark:text-blue-300">
              {t('recommendations.infoDescription', { default: 'These recommendations are based on your company\'s financial data and business needs. Click "Apply" to start the application process with pre-filled information.' })}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

