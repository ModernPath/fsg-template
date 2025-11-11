'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Eye, Download, Filter } from 'lucide-react'

interface SurveyResponse {
  id: string
  completion_status: string
  started_at: string
  completed_at: string | null
  session_duration: number | null
  ip_address: string
  survey_invitations?: {
    email: string
    sent_at: string
  }
  answers: Record<string, any>
}

interface SurveyResponsesTableProps {
  surveyId: string
}

export function SurveyResponsesTable({ surveyId }: SurveyResponsesTableProps) {
  const { session } = useAuth()
  const [responses, setResponses] = useState<SurveyResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    loadResponses()
  }, [surveyId, filter])

  const loadResponses = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        template_id: surveyId,
        limit: '50',
        offset: (page * 50).toString()
      })

      if (filter !== 'all') {
        params.append('status', filter)
      }

      const response = await fetch(`/api/surveys/responses?${params}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Vastausten lataus epäonnistui')
      }

      const data = await response.json()
      setResponses(data.responses || [])
      setHasMore(data.responses?.length === 50)

    } catch (err) {
      console.error('Error loading responses:', err)
      setError(err instanceof Error ? err.message : 'Tuntematon virhe')
    } finally {
      setLoading(false)
    }
  }

  const formatStatus = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      'completed': { label: 'Valmis', color: 'bg-green-100 text-green-800' },
      'in_progress': { label: 'Käynnissä', color: 'bg-yellow-100 text-yellow-800' },
      'abandoned': { label: 'Hylätty', color: 'bg-red-100 text-red-800' },
      'started': { label: 'Aloitettu', color: 'bg-gray-100 text-gray-800' }
    }
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' }
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    if (minutes > 0) {
      return `${minutes}min ${remainingSeconds}s`
    }
    return `${remainingSeconds}s`
  }

  const handleViewResponse = (responseId: string) => {
    // Navigate to response detail page
    const currentPath = window.location.pathname
    const pathParts = currentPath.split('/')
    const locale = pathParts[1] // Extract locale from path
    const surveyId = pathParts[4] // Extract survey ID from path
    
    if (surveyId && locale) {
      window.location.href = `/${locale}/admin/surveys/${surveyId}/responses/${responseId}`
    } else {
      console.error('Could not extract survey ID or locale from path:', currentPath, { pathParts, locale, surveyId })
    }
  }

  const handleExportResponses = async () => {
    try {
      // TODO: Implement CSV export
      alert('Vientitoiminto tulossa pian')
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Spinner className="mx-auto mb-4" size="lg" />
            <p className="text-gray-600">Ladataan vastauksia...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadResponses} variant="outline">
            Yritä uudelleen
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Vastaukset</CardTitle>
            <CardDescription>
              Kaikki kyselyyn saadut vastaukset
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border rounded px-3 py-1 text-sm"
            >
              <option value="all">Kaikki tilat</option>
              <option value="completed">Valmis</option>
              <option value="in_progress">Käynnissä</option>
              <option value="abandoned">Hylätty</option>
              <option value="started">Aloitettu</option>
            </select>
            <Button onClick={handleExportResponses} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Vie CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {responses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Ei vastauksia löytynyt valituilla suodattimilla
          </div>
        ) : (
          <div className="space-y-4">
            {/* Table for larger screens */}
            <div className="hidden md:block">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Vastaus ID</th>
                      <th className="text-left py-3 px-4 font-medium">Tila</th>
                      <th className="text-left py-3 px-4 font-medium">Sähköposti</th>
                      <th className="text-left py-3 px-4 font-medium">Aloitettu</th>
                      <th className="text-left py-3 px-4 font-medium">Valmistunut</th>
                      <th className="text-left py-3 px-4 font-medium">Kesto</th>
                      <th className="text-left py-3 px-4 font-medium">Toiminnot</th>
                    </tr>
                  </thead>
                  <tbody>
                    {responses.map((response) => {
                      const status = formatStatus(response.completion_status)
                      return (
                        <tr key={response.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-mono text-sm">
                            {response.id.slice(0, 8)}...
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={status.color}>
                              {status.label}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            {response.survey_invitations?.email || 'Anonyymi'}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {new Date(response.started_at).toLocaleDateString('fi-FI')}
                            <br />
                            <span className="text-gray-500">
                              {new Date(response.started_at).toLocaleTimeString('fi-FI')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {response.completed_at ? (
                              <>
                                {new Date(response.completed_at).toLocaleDateString('fi-FI')}
                                <br />
                                <span className="text-gray-500">
                                  {new Date(response.completed_at).toLocaleTimeString('fi-FI')}
                                </span>
                              </>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {formatDuration(response.session_duration)}
                          </td>
                          <td className="py-3 px-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewResponse(response.id)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Tarkastele
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cards for mobile */}
            <div className="md:hidden space-y-4">
              {responses.map((response) => {
                const status = formatStatus(response.completion_status)
                return (
                  <div key={response.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm">
                        {response.id.slice(0, 12)}...
                      </span>
                      <Badge className={status.color}>
                        {status.label}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Sähköposti: </span>
                        {response.survey_invitations?.email || 'Anonyymi'}
                      </div>
                      <div>
                        <span className="font-medium">Aloitettu: </span>
                        {new Date(response.started_at).toLocaleString('fi-FI')}
                      </div>
                      {response.completed_at && (
                        <div>
                          <span className="font-medium">Valmistunut: </span>
                          {new Date(response.completed_at).toLocaleString('fi-FI')}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Kesto: </span>
                        {formatDuration(response.session_duration)}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewResponse(response.id)}
                      className="w-full"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Tarkastele vastauksia
                    </Button>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {hasMore && (
              <div className="flex justify-center pt-6">
                <Button
                  onClick={() => {
                    setPage(page + 1)
                    loadResponses()
                  }}
                  variant="outline"
                >
                  Lataa lisää
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
