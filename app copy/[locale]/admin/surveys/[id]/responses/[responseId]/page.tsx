'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/components/auth/AuthProvider'
import { makeAuthenticatedRequest } from '@/utils/adminApiUtils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { 
  ArrowLeft, 
  User, 
  Building2, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Mail,
  Calendar,
  Globe,
  Edit,
  Trash2
} from 'lucide-react'
import Link from 'next/link'

interface SurveyResponse {
  id: string
  answers: Record<string, any>
  completion_status: string
  started_at: string
  completed_at: string | null
  session_duration: number | null
  ip_address: string
  user_agent: string
  created_at: string
  updated_at: string
  survey_templates: {
    id: string
    name: string
    description: string
    questions: any
    settings: any
    language: string
  }
  survey_invitations?: {
    id: string
    email: string
    sent_at: string
    opened_at: string | null
    completed_at: string | null
    invitation_status: string
  }
  profiles?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  companies?: {
    id: string
    name: string
    business_id: string
    industry: string
  }
}

export default function SurveyResponseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('Admin')
  const { session, isAdmin, loading: authLoading } = useAuth()
  
  const surveyId = params.id as string
  const responseId = params.responseId as string
  const locale = params.locale as string

  const [response, setResponse] = useState<SurveyResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return // Wait for auth to load
    if (session && isAdmin) {
      loadResponseData()
    }
  }, [session, isAdmin, responseId, authLoading])

  const loadResponseData = async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await makeAuthenticatedRequest(`/api/surveys/responses/${responseId}`)
      setResponse(data.response)

    } catch (err) {
      console.error('Error loading response:', err)
      setError(err instanceof Error ? err.message : 'Vastauksen haku epäonnistui')
    } finally {
      setLoading(false)
    }
  }

  const formatStatus = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      'completed': { 
        label: 'Valmis', 
        color: 'bg-green-100 text-green-800 border-green-200', 
        icon: <CheckCircle className="h-4 w-4" />
      },
      'in_progress': { 
        label: 'Käynnissä', 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        icon: <Clock className="h-4 w-4" />
      },
      'abandoned': { 
        label: 'Hylätty', 
        color: 'bg-red-100 text-red-800 border-red-200', 
        icon: <AlertTriangle className="h-4 w-4" />
      },
      'started': { 
        label: 'Aloitettu', 
        color: 'bg-gray-100 text-gray-800 border-gray-200', 
        icon: <Clock className="h-4 w-4" />
      }
    }
    return statusMap[status] || { 
      label: status, 
      color: 'bg-gray-100 text-gray-800 border-gray-200', 
      icon: <Clock className="h-4 w-4" />
    }
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    if (minutes > 0) {
      return `${minutes} min ${remainingSeconds} s`
    }
    return `${remainingSeconds} s`
  }

  const renderAnswerValue = (value: any): string => {
    if (value === null || value === undefined) return 'Ei vastausta'
    if (Array.isArray(value)) return value.join(', ')
    if (typeof value === 'object') {
      if (value.main && value.custom) {
        return `${value.main} (${value.custom})`
      }
      return JSON.stringify(value)
    }
    return String(value)
  }

  const getQuestionText = (questionId: string): string => {
    if (!response?.survey_templates?.questions?.sections) return questionId

    for (const section of response.survey_templates.questions.sections) {
      const question = section.questions?.find((q: any) => q.id === questionId)
      if (question) {
        return question.question || questionId
      }
    }
    return questionId
  }

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Spinner className="mx-auto mb-4" size="lg" />
            <p className="text-gray-600">
              {authLoading ? 'Tarkistetaan käyttöoikeuksia...' : 'Ladataan vastauksen tietoja...'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !response) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href={`/${locale}/admin/surveys/${surveyId}/responses`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Takaisin vastauksiin
            </Button>
          </Link>
        </div>
        
        <Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Virhe vastauksen latauksessa
            </h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadResponseData} variant="outline">
              Yritä uudelleen
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const status = formatStatus(response.completion_status)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/${locale}/admin/surveys/${surveyId}/responses`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Takaisin vastauksiin
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Vastauksen tiedot
              </h1>
              <p className="text-gray-600">
                {response.survey_templates.name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className={`${status.color} flex items-center gap-1`}>
              {status.icon}
              {status.label}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Response Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Vastauksen yhteenveto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Vastaus ID</label>
                  <p className="font-mono text-sm">{response.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Tila</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={status.color}>
                      {status.icon}
                      {status.label}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Aloitettu</label>
                  <p className="text-sm">
                    {new Date(response.started_at).toLocaleString('fi-FI')}
                  </p>
                </div>
                {response.completed_at && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Valmistunut</label>
                    <p className="text-sm">
                      {new Date(response.completed_at).toLocaleString('fi-FI')}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Kesto</label>
                  <p className="text-sm">{formatDuration(response.session_duration)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">IP-osoite</label>
                  <p className="text-sm font-mono">{response.ip_address}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Survey Answers */}
          <Card>
            <CardHeader>
              <CardTitle>Vastaukset</CardTitle>
              <CardDescription>
                Käyttäjän antamat vastaukset kyselyyn
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(response.answers).length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Ei vastauksia tallennettuna
                </p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(response.answers).map(([questionId, answer]) => (
                    <div key={questionId} className="border-b border-gray-100 pb-4 last:border-b-0">
                      <div className="mb-2">
                        <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {getQuestionText(questionId)}
                        </label>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">ID: {questionId}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <p className="text-sm text-gray-900 dark:text-gray-100">{renderAnswerValue(answer)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* User Information */}
          {(response.profiles || response.survey_invitations) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Käyttäjätiedot
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {response.profiles && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Nimi</label>
                      <p className="text-sm">
                        {response.profiles.first_name} {response.profiles.last_name}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Sähköposti</label>
                      <p className="text-sm">{response.profiles.email}</p>
                    </div>
                  </>
                )}
                
                {response.survey_invitations && (
                  <>
                    <Separator />
                    <div>
                      <label className="text-sm font-medium text-gray-500">Kutsu lähetetty</label>
                      <p className="text-sm">
                        {response.survey_invitations.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(response.survey_invitations.sent_at).toLocaleString('fi-FI')}
                      </p>
                    </div>
                    {response.survey_invitations.opened_at && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Avattu</label>
                        <p className="text-xs text-gray-500">
                          {new Date(response.survey_invitations.opened_at).toLocaleString('fi-FI')}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Company Information */}
          {response.companies && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Yritystiedot
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Yritys</label>
                  <p className="text-sm">{response.companies.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Y-tunnus</label>
                  <p className="text-sm font-mono">{response.companies.business_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Toimiala</label>
                  <p className="text-sm">{response.companies.industry}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Survey Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Kyselytiedot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Kysely</label>
                <p className="text-sm">{response.survey_templates.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Kieli</label>
                <p className="text-sm">{response.survey_templates.language.toUpperCase()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Template ID</label>
                <p className="text-xs font-mono">{response.survey_templates.id}</p>
              </div>
            </CardContent>
          </Card>

          {/* Technical Information */}
          <Card>
            <CardHeader>
              <CardTitle>Tekniset tiedot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">User Agent</label>
                <p className="text-xs break-all">{response.user_agent}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Päivitetty</label>
                <p className="text-xs">
                  {new Date(response.updated_at).toLocaleString('fi-FI')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}