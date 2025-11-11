'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/components/auth/AuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowLeft, 
  Calendar,
  DollarSign,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface FundingApplication {
  id: string
  company_id: string
  type: string
  amount: number
  purpose: string
  status: string
  created_at: string
  updated_at: string
  submitted_at?: string
  decision_at?: string
  decision_notes?: string
  companies: {
    id: string
    name: string
    business_id: string
  }
}

export default function ApplicationDetailPage() {
  const t = useTranslations('Dashboard.applications')
  const tCommon = useTranslations('Common')
  const { session, loading: authLoading } = useAuth()
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string
  const applicationId = params.applicationId as string

  const [application, setApplication] = useState<FundingApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.access_token || authLoading) return

    const fetchApplication = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/applications/${applicationId}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch application')
        }

        const data = await response.json()
        setApplication(data.application)
      } catch (err) {
        console.error('Error fetching application:', err)
        setError(err instanceof Error ? err.message : 'Failed to load application')
      } finally {
        setLoading(false)
      }
    }

    fetchApplication()
  }, [applicationId, session?.access_token, authLoading])

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !application) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || t('loadError', { default: 'Failed to load application' })}
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push(`/${locale}/dashboard`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tCommon('backToDashboard', { default: 'Takaisin dashboardiin' })}
        </Button>
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'processing':
      case 'submitted':
        return <Clock className="h-5 w-5 text-blue-500" />
      default:
        return <FileText className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default'
      case 'rejected':
        return 'destructive'
      case 'draft':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fi-FI', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fi-FI', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/${locale}/dashboard`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('backToList', { default: 'Takaisin' })}
            </Button>
          </div>
          <h1 className="text-3xl font-bold">
            {t('viewTitle', { default: 'Rahoitushakemus' })}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon(application.status)}
          <Badge variant={getStatusVariant(application.status)}>
            {t(`status.${application.status}`, { default: application.status })}
          </Badge>
        </div>
      </div>

      {/* Application Details */}
      <Card>
        <CardHeader>
          <CardTitle>{application.companies.name}</CardTitle>
          <CardDescription>
            {t('businessId', { default: 'Y-tunnus' })}: {application.companies.business_id}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Application Type */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              {t('type', { default: 'Rahoitustyyppi' })}
            </label>
            <p className="text-lg mt-1">
              {application.type 
                ? application.type.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')
                : t('notSpecified', { default: 'Ei määritelty' })
              }
            </p>
          </div>

          {/* Amount */}
          <div>
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {t('amount', { default: 'Haettava summa' })}
            </label>
            <p className="text-2xl font-bold mt-1">{formatCurrency(application.amount)}</p>
          </div>

          {/* Purpose */}
          <div>
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t('purpose', { default: 'Rahoituksen tarkoitus' })}
            </label>
            <p className="text-base mt-2 whitespace-pre-wrap">
              {application.purpose || t('noPurpose', { default: 'Ei määritelty' })}
            </p>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t('createdAt', { default: 'Luotu' })}
              </label>
              <p className="text-sm mt-1">{formatDate(application.created_at)}</p>
            </div>
            {application.submitted_at && (
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {t('submittedAt', { default: 'Lähetetty' })}
                </label>
                <p className="text-sm mt-1">{formatDate(application.submitted_at)}</p>
              </div>
            )}
            {application.decision_at && (
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {t('decisionAt', { default: 'Päätös tehty' })}
                </label>
                <p className="text-sm mt-1">{formatDate(application.decision_at)}</p>
              </div>
            )}
          </div>

          {/* Decision Notes */}
          {application.decision_notes && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold mb-1">
                  {t('decisionNotes', { default: 'Päätöksen perustelut' })}
                </p>
                <p className="text-sm">{application.decision_notes}</p>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => router.push(`/${locale}/dashboard`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tCommon('backToDashboard', { default: 'Takaisin dashboardiin' })}
        </Button>
      </div>
    </div>
  )
}

