'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  Edit3, 
  BarChart3, 
  Send, 
  Users, 
  Mail, 
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Eye
} from 'lucide-react'
import Link from 'next/link'
import { Spinner } from '@/components/ui/spinner'

interface SurveyTemplate {
  id: string
  name: string
  description: string
  questions: any[]
  settings: any
  is_active: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

interface SurveyStats {
  total_responses: number
  completed_responses: number
  in_progress_responses: number
  abandoned_responses: number
  invitation_completion_rate: number
  average_session_duration: number
  total_invitations: number
  sent_invitations: number
  opened_invitations: number
}

interface SurveyResponse {
  id: string
  user_id: string
  completion_status: 'started' | 'in_progress' | 'completed' | 'abandoned'
  created_at: string
  completed_at?: string
  session_duration?: number
  answers: Record<string, any>
  profiles?: {
    first_name?: string
    last_name?: string
    email?: string
  }
}

interface SurveyInvitation {
  id: string
  email: string
  invitation_status: 'pending' | 'sent' | 'opened' | 'completed' | 'expired'
  sent_at?: string
  opened_at?: string
  completed_at?: string
  expires_at: string
  profiles?: {
    first_name?: string
    last_name?: string
  }
}

export default function SurveyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('Admin.Surveys')
  const { session, isAdmin } = useAuth()
  const surveyId = params.id as string
  const locale = params.locale as string

  const [template, setTemplate] = useState<SurveyTemplate | null>(null)
  const [stats, setStats] = useState<SurveyStats | null>(null)
  const [recentResponses, setRecentResponses] = useState<SurveyResponse[]>([])
  const [recentInvitations, setRecentInvitations] = useState<SurveyInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session?.access_token && isAdmin) {
      loadSurveyData()
    }
  }, [session?.access_token, isAdmin, surveyId])

  const loadSurveyData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load survey template
      const templateResponse = await fetch(`/api/surveys/templates?id=${surveyId}`)

      if (!templateResponse.ok) {
        throw new Error('Kyselypohjan lataus epäonnistui')
      }

      const templateData = await templateResponse.json()
      setTemplate(templateData.templates?.[0] || null)

      // Load analytics
      const analyticsResponse = await fetch(`/api/surveys/analytics?template_id=${surveyId}`)

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json()
        setStats(analyticsData.analytics?.overview || null)
      }

      // Load recent responses
      const responsesResponse = await fetch(`/api/surveys/responses?template_id=${surveyId}&limit=5`)

      if (responsesResponse.ok) {
        const responsesData = await responsesResponse.json()
        setRecentResponses(responsesData.responses || [])
      }

      // Load recent invitations
      const invitationsResponse = await fetch(`/api/surveys/invitations?template_id=${surveyId}&limit=5`)

      if (invitationsResponse.ok) {
        const invitationsData = await invitationsResponse.json()
        setRecentInvitations(invitationsData.invitations || [])
      }

    } catch (err) {
      console.error('Error loading survey data:', err)
      setError(err instanceof Error ? err.message : 'Tuntematon virhe')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'abandoned':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getInvitationStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'opened':
        return <Eye className="h-4 w-4 text-blue-600" />
      case 'sent':
        return <Mail className="h-4 w-4 text-gray-600" />
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fi-FI', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (seconds: number) => {
    if (!seconds) return '-'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Virhe</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Takaisin
          </Button>
        </div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-600 mb-4">Kyselypohjaa ei löytynyt</h1>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Takaisin
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Takaisin
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{template.name}</h1>
            <p className="text-gray-600 mt-1">{template.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Link href={`/${locale}/admin/surveys/${surveyId}/edit`}>
            <Button>
              <Edit3 className="h-4 w-4 mr-2" />
              Muokkaa
            </Button>
          </Link>
          <Link href={`/${locale}/admin/surveys/${surveyId}/analytics`}>
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytiikka
            </Button>
          </Link>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex items-center space-x-4 mb-6">
        <Badge variant={template.is_active ? "default" : "secondary"}>
          {template.is_active ? 'Aktiivinen' : 'Ei aktiivinen'}
        </Badge>
        {template.is_default && (
          <Badge variant="outline">Oletus</Badge>
        )}
        <span className="text-sm text-gray-500">
          Luotu: {formatDate(template.created_at)}
        </span>
        <span className="text-sm text-gray-500">
          Päivitetty: {formatDate(template.updated_at)}
        </span>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vastauksia yhteensä</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_responses}</div>
              <p className="text-xs text-muted-foreground">
                {stats.completed_responses} valmista
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valmistumisaste</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.invitation_completion_rate?.toFixed(1) || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Kaikki kyselyt
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Keskimääräinen aika</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatDuration(stats.average_session_duration || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Vastausaika
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kutsuja lähetetty</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_invitations}</div>
              <p className="text-xs text-muted-foreground">
                {stats.opened_invitations} avattu
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Responses */}
        <Card>
          <CardHeader>
            <CardTitle>Viimeisimmät vastaukset</CardTitle>
            <CardDescription>
              {recentResponses.length} vastausta näytetään
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentResponses.length > 0 ? (
              <div className="space-y-4">
                {recentResponses.map((response) => (
                  <div key={response.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(response.completion_status)}
                      <div>
                        <p className="font-medium">
                          {response.profiles?.first_name && response.profiles?.last_name
                            ? `${response.profiles.first_name} ${response.profiles.last_name}`
                            : response.profiles?.email || 'Tuntematon käyttäjä'
                          }
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(response.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">
                        {response.completion_status === 'completed' ? 'Valmis' :
                         response.completion_status === 'in_progress' ? 'Kesken' :
                         response.completion_status === 'abandoned' ? 'Hylätty' : 'Aloitettu'}
                      </Badge>
                      {response.session_duration && (
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDuration(response.session_duration)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Ei vastauksia vielä</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Invitations */}
        <Card>
          <CardHeader>
            <CardTitle>Viimeisimmät kutsut</CardTitle>
            <CardDescription>
              {recentInvitations.length} kutsu näytetään
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentInvitations.length > 0 ? (
              <div className="space-y-4">
                {recentInvitations.map((invitation) => (
                  <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getInvitationStatusIcon(invitation.invitation_status)}
                      <div>
                        <p className="font-medium">{invitation.email}</p>
                        <p className="text-sm text-gray-500">
                          {invitation.sent_at ? formatDate(invitation.sent_at) : 'Ei lähetetty'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">
                        {invitation.invitation_status === 'completed' ? 'Valmis' :
                         invitation.invitation_status === 'opened' ? 'Avattu' :
                         invitation.invitation_status === 'sent' ? 'Lähetetty' :
                         invitation.invitation_status === 'expired' ? 'Vanhentunut' : 'Odottaa'}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        Vanhenee: {formatDate(invitation.expires_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Ei kutsuja vielä</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Pikatoiminnot</CardTitle>
          <CardDescription>
            Hallitse kyselyä ja kutsuja
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Link href={`/${locale}/admin/surveys/${surveyId}/invitations/new`}>
              <Button>
                <Send className="h-4 w-4 mr-2" />
                Lähetä kutsut
              </Button>
            </Link>
            <Link href={`/${locale}/admin/surveys/${surveyId}/responses`}>
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Katso kaikki vastaukset
              </Button>
            </Link>
            <Link href={`/${locale}/admin/surveys/${surveyId}/invitations`}>
              <Button variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Hallitse kutsuja
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
