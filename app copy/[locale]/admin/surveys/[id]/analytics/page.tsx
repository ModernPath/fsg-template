'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useRouter } from '@/app/i18n/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  CheckCircle,
  PieChart,
  Calendar,
  Download,
  Filter
} from 'lucide-react'
import Link from 'next/link'
import { Spinner } from '@/components/ui/spinner'
import TimelineChart from '@/components/charts/TimelineChart'
import QuestionAnalyticsChart from '@/components/charts/QuestionAnalyticsChart'
import StatusDistributionChart from '@/components/charts/StatusDistributionChart'
import InvitationMetricsChart from '@/components/charts/InvitationMetricsChart'

interface SurveyAnalytics {
  template: {
    id: string
    name: string
    description?: string
    created_at: string
    is_active: boolean
    questions: any
  }
  analytics: {
    overview: {
      total_responses: number
      completed_responses: number
      in_progress_responses: number
      abandoned_responses: number
      completion_rate: number
      average_completion_time: number | null
      nps_score: number | null
    }
    invitations: {
      total_sent: number
      opened: number
      completed: number
      open_rate: number
      completion_rate: number
    }
    timeline: Record<string, number>
    question_analytics: {
      question_id: string
      question_text: string
      question_type: string
      response_count: number
      response_rate: number
      rating_analysis?: {
        average: number
        distribution: Record<number, number>
      }
    }[]
    status_distribution: {
      completed: number
      in_progress: number
      abandoned: number
      started: number
    }
    demographic_breakdown?: {
      age_groups?: { [key: string]: number }
      company_sizes?: { [key: string]: number }
      industries?: { [key: string]: number }
    }
  }
  meta: {
    calculated_at: string
    cached: boolean
    query_params: any
  }
}

export default function SurveyAnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('Admin.Surveys')
  const { user, isAdmin, loading: authLoading } = useAuth()
  
  const [analytics, setAnalytics] = useState<SurveyAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const surveyId = params.id as string
  const locale = params.locale as string

  // Check authentication and admin status
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/auth/sign-in')
    }
  }, [user, isAdmin, authLoading, router, locale])

  // Fetch survey analytics
  useEffect(() => {
    if (!user || !isAdmin || !surveyId) return

    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Get access token from Supabase client
        const supabase = createClient()
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session?.access_token) {
          throw new Error('Ei voitu hakea valtuutusta')
        }
        
        const response = await fetch(`/api/surveys/analytics?template_id=${surveyId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        setAnalytics(data)
      } catch (err) {
        console.error('Error fetching survey analytics:', err)
        setError(err instanceof Error ? err.message : 'Tuntematon virhe')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [user, isAdmin, surveyId])

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">{t('error')}</CardTitle>
              <CardDescription>
                {t('error')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  {t('tryAgain')}
                </Button>
                <Button
                  variant="outline"
                  asChild
                >
                  <Link href={`/${locale}/admin/surveys/${surveyId}`}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t('actions.view')}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>{t('error')}</CardTitle>
              <CardDescription>
                {t('error')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild>
                <Link href={`/${locale}/admin/surveys/${surveyId}`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('actions.view')}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/${locale}/admin/surveys/${surveyId}`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Takaisin
                </Link>
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Kyselyanalytiikka
            </h1>
            <p className="text-lg text-muted-foreground mt-1">
              {analytics.template?.name || 'Kysely'}
            </p>
            {analytics.meta?.calculated_at && (
              <p className="text-sm text-muted-foreground mt-1">
                Päivitetty: {new Date(analytics.meta.calculated_at).toLocaleString('fi-FI')}
                {analytics.meta.cached && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    Välimuistista
                  </span>
                )}
              </p>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.reload()}
            >
              <Filter className="h-4 w-4 mr-2" />
              Päivitä data
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Lataa raportti
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Vastauksia yhteensä
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.analytics?.overview?.total_responses || 0}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.analytics?.invitations?.total_sent || 0} kutsua lähetetty
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Vastausprosentti
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(analytics.analytics?.overview?.completion_rate || 0).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Loppuun saakka täytetty
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Keskimääräinen aika
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.analytics?.overview?.average_completion_time ? Math.round(analytics.analytics.overview.average_completion_time / 60) : 0} min
              </div>
              <p className="text-xs text-muted-foreground">
                Vastauksen täyttämiseen
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                NPS-pistemäärä
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                analytics.analytics?.overview?.nps_score !== null 
                  ? analytics.analytics.overview.nps_score >= 50 
                    ? 'text-green-600' 
                    : analytics.analytics.overview.nps_score >= 0 
                      ? 'text-yellow-600' 
                      : 'text-red-600'
                  : 'text-gray-400'
              }`}>
                {analytics.analytics?.overview?.nps_score !== null 
                  ? analytics.analytics.overview.nps_score.toFixed(0) 
                  : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                Net Promoter Score
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Kysymyksiä
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.analytics?.question_analytics?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Kysymystä kyselyssä
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Response Distribution Chart */}
        {analytics.analytics?.timeline && Object.keys(analytics.analytics.timeline).length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Vastausten jakautuminen ajassa
              </CardTitle>
              <CardDescription>
                Päivittäiset vastausmäärät viimeisen 30 päivän aikana ({Object.keys(analytics.analytics.timeline).length} päivää dataa)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TimelineChart data={analytics.analytics.timeline} />
            </CardContent>
          </Card>
        )}

        {/* Invitation Metrics */}
        {analytics.analytics?.invitations && (
          <div className="mb-8">
            <InvitationMetricsChart data={analytics.analytics.invitations} />
          </div>
        )}

        {/* Status Distribution Chart */}
        {analytics.analytics?.status_distribution && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Vastausten tilat
              </CardTitle>
              <CardDescription>
                Vastausten jakautuminen eri tiloihin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StatusDistributionChart data={analytics.analytics.status_distribution} />
            </CardContent>
          </Card>
        )}

        {/* Question Analytics */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Kysymyskohtainen analyysi
            </CardTitle>
            <CardDescription>
              Yksityiskohtainen analyysi jokaisesta kysymyksestä
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {(analytics.analytics?.question_analytics || []).map((question, index) => (
                <div key={question.question_id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          ID: {question.question_id}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {question.question_type}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1 text-base">
                        {question.question_text || `Kysymys ${question.question_id}`}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {question.response_count || 0} vastausta
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <QuestionAnalyticsChart question={question} />
                  </div>
                </div>
              ))}

              {(analytics.analytics?.question_analytics || []).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                  <p>Ei kysymysanalytiikkaa saatavilla</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Demographic Breakdown */}
        {(analytics.analytics?.demographic_breakdown?.age_groups || 
          analytics.analytics?.demographic_breakdown?.company_sizes || 
          analytics.analytics?.demographic_breakdown?.industries) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Demografinen jakautuma
              </CardTitle>
              <CardDescription>
                Vastaajien demografiset tiedot
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {analytics.analytics?.demographic_breakdown?.age_groups && (
                  <div>
                    <h4 className="font-medium mb-3">Ikäryhmät</h4>
                    <div className="space-y-2">
                      {Object.entries(analytics.analytics.demographic_breakdown.age_groups).map(([age, count]) => (
                        <div key={age} className="flex justify-between items-center">
                          <span className="text-sm">{age}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analytics.analytics?.demographic_breakdown?.company_sizes && (
                  <div>
                    <h4 className="font-medium mb-3">Yrityksen koko</h4>
                    <div className="space-y-2">
                      {Object.entries(analytics.analytics.demographic_breakdown.company_sizes).map(([size, count]) => (
                        <div key={size} className="flex justify-between items-center">
                          <span className="text-sm">{size}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analytics.analytics?.demographic_breakdown?.industries && (
                  <div>
                    <h4 className="font-medium mb-3">Toimialat</h4>
                    <div className="space-y-2">
                      {Object.entries(analytics.analytics.demographic_breakdown.industries).map(([industry, count]) => (
                        <div key={industry} className="flex justify-between items-center">
                          <span className="text-sm">{industry}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}