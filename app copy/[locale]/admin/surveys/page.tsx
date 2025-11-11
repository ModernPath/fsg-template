'use client'

import React from 'react'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  Users, 
  Mail, 
  Settings, 
  Plus, 
  Eye, 
  Edit3, 
  Trash2,
  Send,
  Download,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'
import { Spinner } from '@/components/ui/spinner'

interface SurveyTemplate {
  id: string
  name: string
  description: string
  is_active: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

interface SurveyStats {
  total_responses: number
  completed_responses: number
  completion_rate: number
  total_invitations: number
  invitation_completion_rate: number
}

export default function SurveysAdminPage() {
  const t = useTranslations('Admin.Surveys')
  const params = useParams()
  const locale = params.locale as string
  const { user, isAdmin, session, loading: authLoading } = useAuth()
  const [templates, setTemplates] = useState<SurveyTemplate[]>([])
  const [stats, setStats] = useState<Record<string, SurveyStats>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user && isAdmin) {
      loadSurveyData()
    }
  }, [user, isAdmin])

  const loadSurveyData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get session token
      const { createClient } = await import('@/utils/supabase/client')
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('Ei valtuutusta')
      }

      // Load survey templates
      const templatesResponse = await fetch(`/api/surveys/templates?include_inactive=true&locale=${locale}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!templatesResponse.ok) {
        throw new Error('Kyselypohjien lataus epäonnistui')
      }

      const templatesData = await templatesResponse.json()
      setTemplates(templatesData.templates || [])

      // Load stats for each template
      const statsPromises = templatesData.templates.map(async (template: SurveyTemplate) => {
        try {
          const statsResponse = await fetch(`/api/surveys/analytics?template_id=${template.id}&locale=${locale}`, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          })

          if (statsResponse.ok) {
            const statsData = await statsResponse.json()
            return { templateId: template.id, stats: statsData.analytics?.overview }
          }
        } catch (error) {
          console.error(`Error loading stats for template ${template.id}:`, error)
        }
        return { templateId: template.id, stats: null }
      })

      const statsResults = await Promise.all(statsPromises)
      const statsMap: Record<string, SurveyStats> = {}
      
      statsResults.forEach(result => {
        if (result.stats) {
          statsMap[result.templateId] = result.stats
        }
      })

      setStats(statsMap)

    } catch (err) {
      console.error('Error loading survey data:', err)
      setError(err instanceof Error ? err.message : 'Tuntematon virhe')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTemplate = async (templateId: string, templateName: string) => {
    if (!confirm(`Haluatko varmasti poistaa kyselypohjan "${templateName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/surveys/templates?id=${templateId}&locale=${locale}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Poistaminen epäonnistui')
      }

      // Reload data
      await loadSurveyData()

    } catch (err) {
      console.error('Error deleting template:', err)
      alert(err instanceof Error ? err.message : 'Poistaminen epäonnistui')
    }
  }

  const handleToggleActive = async (templateId: string, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/surveys/templates?id=${templateId}&locale=${locale}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          id: templateId,
          is_active: !currentActive
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Päivitys epäonnistui')
      }

      // Reload data
      await loadSurveyData()

    } catch (err) {
      console.error('Error toggling active status:', err)
      alert(err instanceof Error ? err.message : 'Päivitys epäonnistui')
    }
  }

  const handleSendInvitations = async (templateId: string, templateName: string) => {
    if (!confirm(`Haluatko lähettää kyselykutsut kaikille rekisteröityneille käyttäjille kyselylle "${templateName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/surveys/invitations?template_id=${templateId}&locale=${locale}`, {
        method: 'PUT', // Bulk invitations
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          template_id: templateId,
          target: 'active_users',
          send_immediately: true
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Kutsujen lähetys epäonnistui')
      }

      const data = await response.json()
      alert(`${data.meta.created_count} kutsua lähetetty onnistuneesti!`)

      // Reload data
      await loadSurveyData()

    } catch (err) {
      console.error('Error sending invitations:', err)
      alert(err instanceof Error ? err.message : 'Kutsujen lähetys epäonnistui')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Spinner className="mx-auto mb-4" size="lg" />
          <p className="text-gray-600">Ladataan kyselyitä...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadSurveyData} variant="outline">
          Yritä uudelleen
        </Button>
      </div>
    )
  }

  const totalResponses = Object.values(stats).reduce((sum, stat) => sum + (stat.total_responses || 0), 0)
  const totalCompleted = Object.values(stats).reduce((sum, stat) => sum + (stat.completed_responses || 0), 0)
  const averageCompletionRate = templates.length > 0 
    ? Object.values(stats).reduce((sum, stat) => sum + (stat.completion_rate || 0), 0) / templates.length
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Kyselyhallinta
          </h1>
          <p className="text-gray-600 mt-2">
            Hallitse asiakastyytyväisyyskyselyitä ja analysoi tuloksia
          </p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/admin/surveys/new`}>
            <Plus className="w-4 h-4 mr-2" />
            Uusi kysely
          </Link>
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Kyselypohja
            </CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
            <p className="text-xs text-muted-foreground">
              {templates.filter(t => t.is_active).length} aktiivista
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Vastauksia yhteensä
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalResponses}</div>
            <p className="text-xs text-muted-foreground">
              {totalCompleted} valmista
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Keskimääräinen valmistumisaste
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averageCompletionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Kaikki kyselyt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Aktiiviset kyselyt
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {templates.filter(t => t.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Vastauksia kerätään
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Survey Templates List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Kyselypohjat
        </h2>

        {templates.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Settings className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Ei kyselypohjia
              </h3>
              <p className="text-gray-600 mb-6">
                Luo ensimmäinen kyselypohja aloittaaksesi vastausten keräämisen.
              </p>
              <Button asChild>
                <Link href={`/${locale}/admin/surveys/new`}>
                  <Plus className="w-4 h-4 mr-2" />
                  Luo kyselypohja
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {templates.map((template) => {
              const templateStats = stats[template.id]
              
              return (
                <Card key={template.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg">
                            {template.name}
                          </CardTitle>
                          <div className="flex gap-2">
                            <Badge variant={template.is_active ? "default" : "secondary"}>
                              {template.is_active ? "Aktiivinen" : "Ei aktiivinen"}
                            </Badge>
                            {template.is_default && (
                              <Badge variant="outline">
                                Oletus
                              </Badge>
                            )}
                          </div>
                        </div>
                        <CardDescription className="text-sm">
                          {template.description || "Ei kuvausta"}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {/* Stats */}
                    {templateStats && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {templateStats.total_responses || 0}
                          </div>
                          <div className="text-sm text-gray-600">
                            Vastauksia
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {templateStats.completed_responses || 0}
                          </div>
                          <div className="text-sm text-gray-600">
                            Valmista
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {(templateStats.completion_rate || 0).toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-600">
                            Valmistumisaste
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">
                            {templateStats.total_invitations || 0}
                          </div>
                          <div className="text-sm text-gray-600">
                            Kutsuja
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/${locale}/admin/surveys/${template.id}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          Tarkastele
                        </Link>
                      </Button>

                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/${locale}/admin/surveys/${template.id}/edit`}>
                          <Edit3 className="w-4 h-4 mr-2" />
                          Muokkaa
                        </Link>
                      </Button>

                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/${locale}/admin/surveys/${template.id}/analytics`}>
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Analytiikka
                        </Link>
                      </Button>

                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSendInvitations(template.id, template.name)}
                        disabled={!template.is_active}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Lähetä kutsut
                      </Button>

                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleToggleActive(template.id, template.is_active)}
                      >
                        {template.is_active ? "Deaktivoi" : "Aktivoi"}
                      </Button>

                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id, template.name)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Poista
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
