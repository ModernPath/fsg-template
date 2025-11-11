'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  FileUp, 
  BarChart3, 
  Lightbulb, 
  FileText, 
  Shield, 
  CheckCircle2,
  ArrowRight,
  Building2,
  CreditCard,
  TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter, useParams } from 'next/navigation'

export default function HelpPage() {
  const t = useTranslations('Help')
  const tCommon = useTranslations('Common')
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  const steps = [
    {
      icon: Building2,
      title: t('step1.title', { default: 'Register Your Company' }),
      description: t('step1.description', { 
        default: 'Start by creating an account and registering your company. Provide basic information such as business ID, company name, and industry.'
      }),
      details: [
        t('step1.detail1', { default: 'Enter your company\'s business ID' }),
        t('step1.detail2', { default: 'System automatically fetches public company data' }),
        t('step1.detail3', { default: 'Verify and complete your company profile' })
      ]
    },
    {
      icon: FileUp,
      title: t('step2.title', { default: 'Upload Financial Statements' }),
      description: t('step2.description', { 
        default: 'Upload your company\'s financial statements to enable AI-powered analysis and personalized funding recommendations.'
      }),
      details: [
        t('step2.detail1', { default: 'Supported formats: PDF, Excel, images' }),
        t('step2.detail2', { default: 'Upload balance sheets, income statements, and financial reports' }),
        t('step2.detail3', { default: 'AI automatically extracts key financial metrics' })
      ]
    },
    {
      icon: BarChart3,
      title: t('step3.title', { default: 'AI Financial Analysis' }),
      description: t('step3.description', { 
        default: 'Our AI analyzes your financial data and generates comprehensive insights about your company\'s financial health.'
      }),
      details: [
        t('step3.detail1', { default: 'Automated calculation of key financial ratios' }),
        t('step3.detail2', { default: 'Trend analysis and financial health scoring' }),
        t('step3.detail3', { default: 'Benchmarking against industry standards' })
      ]
    },
    {
      icon: Lightbulb,
      title: t('step4.title', { default: 'Get Funding Recommendations' }),
      description: t('step4.description', { 
        default: 'Receive personalized funding recommendations based on your company\'s profile and financial situation.'
      }),
      details: [
        t('step4.detail1', { default: 'Tailored recommendations for business loans, credit lines, and factoring' }),
        t('step4.detail2', { default: 'Estimated amounts and terms' }),
        t('step4.detail3', { default: 'Clear rationale for each recommendation' })
      ]
    },
    {
      icon: FileText,
      title: t('step5.title', { default: 'Submit Funding Applications' }),
      description: t('step5.description', { 
        default: 'Apply for funding directly through the platform with pre-filled application forms.'
      }),
      details: [
        t('step5.detail1', { default: 'Choose from recommended funding options' }),
        t('step5.detail2', { default: 'Forms are pre-filled with your data' }),
        t('step5.detail3', { default: 'Complete KYC verification' })
      ]
    },
    {
      icon: Shield,
      title: t('step6.title', { default: 'Track Application Status' }),
      description: t('step6.description', { 
        default: 'Monitor your funding applications in real-time through the dashboard.'
      }),
      details: [
        t('step6.detail1', { default: 'View all your applications in one place' }),
        t('step6.detail2', { default: 'Get notifications on status changes' }),
        t('step6.detail3', { default: 'Receive and review financing offers' })
      ]
    }
  ]

  const faqs = [
    {
      question: t('faq1.question', { default: 'What documents do I need to upload?' }),
      answer: t('faq1.answer', { 
        default: 'You need to upload your company\'s financial statements including balance sheets, income statements, and annual reports. We accept PDF files, Excel spreadsheets, and images of financial documents.'
      })
    },
    {
      question: t('faq2.question', { default: 'How secure is my data?' }),
      answer: t('faq2.answer', { 
        default: 'We use bank-level encryption (TLS/SSL) to protect your data in transit and at rest. All financial data is stored securely in EU data centers and never shared with third parties without your explicit consent.'
      })
    },
    {
      question: t('faq3.question', { default: 'How long does the analysis take?' }),
      answer: t('faq3.answer', { 
        default: 'The AI analysis typically completes within 2-5 minutes after uploading your documents. You\'ll receive an email notification when your analysis and recommendations are ready.'
      })
    },
    {
      question: t('faq4.question', { default: 'What types of funding can I apply for?' }),
      answer: t('faq4.answer', { 
        default: 'TrustyFinance supports applications for business loans (secured and unsecured), credit lines, invoice factoring, leasing, and bank guarantees. The available options depend on your company\'s profile and financial situation.'
      })
    },
    {
      question: t('faq5.question', { default: 'Is there a fee for using the service?' }),
      answer: t('faq5.answer', { 
        default: 'The basic analysis and recommendations are free. We earn a commission from lenders when you successfully secure funding through our platform. There are no upfront costs or hidden fees.'
      })
    },
    {
      question: t('faq6.question', { default: 'How do I update my financial data?' }),
      answer: t('faq6.answer', { 
        default: 'Simply upload new financial statements through the Documents section in your dashboard. The system will automatically update your financial metrics and may generate new recommendations based on the latest data.'
      })
    }
  ]

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4">
          {t('title', { default: 'How to Use TrustyFinance' })}
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          {t('subtitle', { 
            default: 'A complete guide to getting funding for your business with AI-powered financial analysis'
          })}
        </p>
      </div>

      {/* Quick Start */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            {t('quickStart.title', { default: 'Quick Start' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto py-4 justify-start"
              onClick={() => router.push(`/${locale}/onboarding`)}
            >
              <div className="text-left">
                <div className="font-semibold mb-1">
                  {t('quickStart.onboarding', { default: 'Start Onboarding' })}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t('quickStart.onboardingDesc', { default: 'New user? Begin here' })}
                </div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 justify-start"
              onClick={() => router.push(`/${locale}/dashboard/documents`)}
            >
              <div className="text-left">
                <div className="font-semibold mb-1">
                  {t('quickStart.upload', { default: 'Upload Documents' })}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t('quickStart.uploadDesc', { default: 'Add financial statements' })}
                </div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 justify-start"
              onClick={() => router.push(`/${locale}/finance-application`)}
            >
              <div className="text-left">
                <div className="font-semibold mb-1">
                  {t('quickStart.apply', { default: 'Apply for Funding' })}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t('quickStart.applyDesc', { default: 'Start your application' })}
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Step-by-Step Guide */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold mb-6">
          {t('stepsTitle', { default: 'Step-by-Step Guide' })}
        </h2>
        <div className="space-y-6">
          {steps.map((step, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      {t('stepNumber', { default: 'Step', number: index + 1 })} {index + 1}
                    </div>
                    <div>{step.title}</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{step.description}</p>
                <ul className="space-y-2">
                  {step.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQs */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold mb-6">
          {t('faqTitle', { default: 'Frequently Asked Questions' })}
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg">{faq.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Support */}
      <Card className="bg-primary/5">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-2">
              {t('support.title', { default: 'Need More Help?' })}
            </h3>
            <p className="text-muted-foreground mb-6">
              {t('support.description', { 
                default: 'Our support team is here to help you with any questions or issues.'
              })}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="default"
                onClick={() => window.location.href = 'mailto:info@trustyfinance.fi'}
              >
                {t('support.email', { default: 'Email Support' })}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/${locale}/dashboard`)}
              >
                {t('support.dashboard', { default: 'Go to Dashboard' })}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

