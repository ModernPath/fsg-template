'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/components/auth/AuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowLeft, 
  Save,
  Send,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

interface FundingApplication {
  id: string
  company_id: string
  type: string
  amount: number
  purpose: string
  status: string
  created_at: string
  updated_at: string
  companies: {
    id: string
    name: string
    business_id: string
  }
}

export default function ApplicationEditPage() {
  const t = useTranslations('Dashboard.applications')
  const tCommon = useTranslations('Common')
  const { session, loading: authLoading } = useAuth()
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string
  const applicationId = params.applicationId as string

  const [application, setApplication] = useState<FundingApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [amount, setAmount] = useState<number>(0)
  const [purpose, setPurpose] = useState<string>('')

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
        const app = data.application
        
        // Check if application is draft
        if (app.status !== 'draft') {
          toast.error(t('cannotEditNonDraft', { default: 'Vain luonnoksia voi muokata' }))
          router.push(`/${locale}/dashboard/applications/${applicationId}`)
          return
        }

        setApplication(app)
        setAmount(app.amount || 0)
        setPurpose(app.purpose || '')
      } catch (err) {
        console.error('Error fetching application:', err)
        setError(err instanceof Error ? err.message : 'Failed to load application')
      } finally {
        setLoading(false)
      }
    }

    fetchApplication()
  }, [applicationId, session?.access_token, authLoading, router, locale, t])

  const handleSave = async () => {
    if (!session?.access_token || !application) return

    try {
      setSaving(true)
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          amount,
          purpose,
          status: 'draft'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save application')
      }

      const data = await response.json()
      setApplication(data.application)
      toast.success(t('savedSuccessfully', { default: 'Hakemus tallennettu' }))
    } catch (err) {
      console.error('Error saving application:', err)
      toast.error(t('saveFailed', { default: 'Tallennus epäonnistui' }))
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (!session?.access_token || !application) return

    // Validate
    if (!amount || amount <= 0) {
      toast.error(t('amountRequired', { default: 'Anna haettava summa' }))
      return
    }

    if (!purpose || purpose.trim().length < 10) {
      toast.error(t('purposeRequired', { default: 'Kerro rahoituksen tarkoitus (vähintään 10 merkkiä)' }))
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          amount,
          purpose,
          status: 'submitted',
          submitted_at: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit application')
      }

      toast.success(t('submittedSuccessfully', { default: 'Hakemus lähetetty!' }))
      router.push(`/${locale}/dashboard`)
    } catch (err) {
      console.error('Error submitting application:', err)
      toast.error(t('submitFailed', { default: 'Lähetys epäonnistui' }))
    } finally {
      setSubmitting(false)
    }
  }

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
            {t('editTitle', { default: 'Muokkaa hakemusta' })}
          </h1>
        </div>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>{application.companies.name}</CardTitle>
          <CardDescription>
            {t('businessId', { default: 'Y-tunnus' })}: {application.companies.business_id}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Application Type (Read-only) */}
          <div>
            <Label>{t('type', { default: 'Rahoitustyyppi' })}</Label>
            <p className="text-lg mt-1 text-muted-foreground">
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
            <Label htmlFor="amount">{t('amount', { default: 'Haettava summa' })} *</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="1000"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="Esim. 50000"
              className="mt-1"
            />
            <p className="text-sm text-muted-foreground mt-1">
              {new Intl.NumberFormat('fi-FI', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(amount || 0)}
            </p>
          </div>

          {/* Purpose */}
          <div>
            <Label htmlFor="purpose">{t('purpose', { default: 'Rahoituksen tarkoitus' })} *</Label>
            <Textarea
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder={t('purposePlaceholder', { 
                default: 'Kerro mihin rahoitus tarvitaan ja miten sitä käytetään...' 
              })}
              rows={6}
              className="mt-1"
            />
            <p className="text-sm text-muted-foreground mt-1">
              {purpose.length} {t('characters', { default: 'merkkiä' })} (min. 10)
            </p>
          </div>

          {/* Info Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('draftInfo', { 
                default: 'Voit tallentaa hakemuksen luonnoksena ja jatkaa myöhemmin. Lähetä hakemus kun olet valmis.' 
              })}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => router.push(`/${locale}/dashboard`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tCommon('cancel', { default: 'Peruuta' })}
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={saving || submitting}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('saving', { default: 'Tallennetaan...' })}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {t('saveDraft', { default: 'Tallenna luonnos' })}
              </>
            )}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('submitting', { default: 'Lähetetään...' })}
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {t('submitApplication', { default: 'Lähetä hakemus' })}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

