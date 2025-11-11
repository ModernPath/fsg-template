'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { makeAuthenticatedRequest } from '@/utils/adminApiUtils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, FileText, Users, Calendar, Download } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Spinner } from '@/components/ui/spinner'

interface SurveyResponse {
  id: string
  user_id?: string
  email?: string
  responses: any
  completion_status: 'started' | 'completed' | 'abandoned'
  session_duration: number
  started_at: string
  completed_at?: string
  user_profile?: {
    first_name?: string
    last_name?: string
    company?: {
      name: string
    }
  }
}

export default function SurveyResponsesPage() {
  const params = useParams()
  const { session, isAdmin, loading: authLoading } = useAuth()
  const t = useTranslations('Admin.Surveys')
  const locale = params.locale as string
  const surveyId = params.id as string

  const [responses, setResponses] = useState<SurveyResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)


  useEffect(() => {
    if (authLoading) return // Wait for auth to load
    if (!session || !isAdmin || !surveyId) return

    const loadResponses = async () => {
      try {
        setLoading(true)
        setError(null)

        const data = await makeAuthenticatedRequest(`/api/surveys/responses?template_id=${surveyId}`)
        setResponses(data.responses || [])
      } catch (err) {
        console.error('Error loading responses:', err)
        setError(err instanceof Error ? err.message : 'Tuntematon virhe')
      } finally {
        setLoading(false)
      }
    }

    loadResponses()
  }, [session, isAdmin, surveyId, authLoading])

  const getStatusBadge = (response: SurveyResponse) => {
    switch (response.completion_status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Valmis</Badge>
      case 'started':
        return <Badge className="bg-blue-100 text-blue-800">Aloitettu</Badge>
      case 'abandoned':
        return <Badge className="bg-red-100 text-red-800">Keskeytetty</Badge>
      default:
        return <Badge variant="secondary">Tuntematon</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fi-FI', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getRespondentName = (response: SurveyResponse) => {
    if (response.user_profile?.first_name && response.user_profile?.last_name) {
      return `${response.user_profile.first_name} ${response.user_profile.last_name}`
    }
    if (response.email) {
      return response.email
    }
    return 'Anonyymi vastaaja'
  }

  const handleExportResponses = async () => {
    try {
      // Use the utility function but handle blob response differently
      const { getAuthenticatedHeaders } = await import('@/utils/adminApiUtils')
      const headers = await getAuthenticatedHeaders()
      
      const response = await fetch(`/api/surveys/responses/export?template_id=${surveyId}`, {
        headers
      })

      if (!response.ok) {
        throw new Error('Vastausten vienti epäonnistui')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `survey-responses-${surveyId}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Error exporting responses:', err)
      setError(err instanceof Error ? err.message : 'Vienti epäonnistui')
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground">
            {authLoading ? 'Tarkistetaan käyttöoikeuksia...' : 'Ladataan vastauksia...'}
          </p>
        </div>
      </div>
    )
  }

  const completedResponses = responses.filter(r => r.completion_status === 'completed')
  const startedResponses = responses.filter(r => r.completion_status === 'started')
  const abandonedResponses = responses.filter(r => r.completion_status === 'abandoned')

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/${locale}/admin/surveys/${surveyId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Takaisin kyselyyn
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kyselyn vastaukset</h1>
            <p className="text-gray-600 dark:text-gray-300">Tarkastele ja analysoi saatuja vastauksia</p>
          </div>
        </div>
        
        {responses.length > 0 && (
          <Button onClick={handleExportResponses} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Vie CSV
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vastauksia yhteensä</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{responses.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valmiit</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {completedResponses.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aloitetut</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {startedResponses.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Keskeytetyt</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {abandonedResponses.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Responses List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Vastaukset</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-red-500 mb-4">{error}</div>
          )}

          {responses.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-500 dark:text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Ei vastauksia vielä
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Vastaukset näkyvät tässä kun käyttäjät aloittavat kyselyn.
              </p>
              <Button asChild>
                <Link href={`/${locale}/admin/surveys/${surveyId}/invitations/new`}>
                  Lähetä kutsuja
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {responses.map((response) => (
                <div
                  key={response.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium text-black dark:text-white">
                        {getRespondentName(response)}
                      </span>
                      {getStatusBadge(response)}
                    </div>
                    <div className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                      <div>Aloitettu: {formatDate(response.started_at)}</div>
                      {response.completed_at && (
                        <div>Valmistunut: {formatDate(response.completed_at)}</div>
                      )}
                      <div>Kesto: {formatDuration(response.session_duration)}</div>
                      {response.user_profile?.company?.name && (
                        <div>Yritys: {response.user_profile.company.name}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/${locale}/admin/surveys/${surveyId}/responses/${response.id}`}>
                        Tarkastele
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
