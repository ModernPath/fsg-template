'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/components/auth/AuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search,
  Filter,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  User,
  Mail,
  Activity
} from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'

interface AutomationLog {
  id: string
  trigger_id: string
  user_id: string
  user_email: string
  action_type: 'email_sent' | 'survey_created' | 'invitation_sent' | 'reminder_sent' | 'follow_up_sent'
  status: 'pending' | 'completed' | 'failed' | 'skipped'
  error_message: string | null
  metadata: Record<string, any>
  created_at: string
  completed_at: string | null
  trigger_name?: string
  template_name?: string
}

interface LogsFilter {
  status: string
  action_type: string
  search: string
  date_from: string
  date_to: string
  trigger_id: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  total_pages: number
}

export function AutomationLogsViewer() {
  const t = useTranslations('Admin.SurveyAutomation.Logs')
  const { session, isAdmin } = useAuth()
  const [logs, setLogs] = useState<AutomationLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 0
  })
  const [filters, setFilters] = useState<LogsFilter>({
    status: '',
    action_type: '',
    search: '',
    date_from: '',
    date_to: '',
    trigger_id: ''
  })
  const [triggers, setTriggers] = useState<Array<{id: string, name: string}>>([])

  const fetchLogs = useCallback(async (page = 1) => {
    if (!session?.access_token || !isAdmin) return

    try {
      setError(null)
      setLoading(true)

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      })

      // Add filters if they have values
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value)
        }
      })

      const response = await fetch(`/api/admin/survey-automation/logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Lokien lataus epäonnistui')
      }

      const data = await response.json()
      setLogs(data.logs || [])
      setPagination(prev => ({
        ...prev,
        page: data.pagination?.page || page,
        total: data.pagination?.total || 0,
        total_pages: data.pagination?.total_pages || 0
      }))
    } catch (err) {
      console.error('Error fetching logs:', err)
      setError(err instanceof Error ? err.message : 'Tuntematon virhe')
    } finally {
      setLoading(false)
    }
  }, [session?.access_token, isAdmin, pagination.limit, filters])

  const fetchTriggers = useCallback(async () => {
    if (!session?.access_token || !isAdmin) return

    try {
      const response = await fetch('/api/admin/survey-automation/triggers', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTriggers(data.triggers?.map((t: any) => ({ id: t.id, name: t.name })) || [])
      }
    } catch (err) {
      console.error('Error fetching triggers:', err)
    }
  }, [session?.access_token, isAdmin])

  useEffect(() => {
    if (session?.access_token && isAdmin) {
      fetchLogs(1)
      fetchTriggers()
    }
  }, [session?.access_token, isAdmin, fetchTriggers])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.search !== undefined) {
        fetchLogs(1)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [filters.search, fetchLogs])

  const handleFilterChange = (key: keyof LogsFilter, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleApplyFilters = () => {
    fetchLogs(1)
  }

  const handleClearFilters = () => {
    setFilters({
      status: '',
      action_type: '',
      search: '',
      date_from: '',
      date_to: '',
      trigger_id: ''
    })
    setTimeout(() => fetchLogs(1), 100)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      fetchLogs(newPage)
    }
  }

  const handleExport = async () => {
    if (!session?.access_token || !isAdmin) return

    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value)
        }
      })
      params.append('export', 'true')

      const response = await fetch(`/api/admin/survey-automation/logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Viennin luonti epäonnistui')
      }

      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `survey_automation_logs_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Error exporting logs:', err)
      setError(err instanceof Error ? err.message : 'Vienti epäonnistui')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'skipped':
        return <AlertCircle className="h-4 w-4 text-gray-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      failed: 'destructive',
      pending: 'secondary',
      skipped: 'outline'
    } as const

    const labels = {
      completed: 'Valmis',
      failed: 'Epäonnistunut',
      pending: 'Odottaa',
      skipped: 'Ohitettu'
    }

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    )
  }

  const getActionTypeLabel = (actionType: string) => {
    const labels = {
      email_sent: 'Sähköposti lähetetty',
      survey_created: 'Kysely luotu',
      invitation_sent: 'Kutsu lähetetty',
      reminder_sent: 'Muistutus lähetetty',
      follow_up_sent: 'Seuranta lähetetty'
    }
    return labels[actionType as keyof typeof labels] || actionType
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Automaatiolokit</h2>
          <p className="text-gray-600">Seuraa automaation suoritusta ja virheitä</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Vie CSV
          </Button>
          <Button onClick={() => fetchLogs(pagination.page)} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Päivitä
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Suodattimet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="search">Haku</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Hae käyttäjästä tai viestistä..."
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Tila</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Kaikki tilat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Kaikki tilat</SelectItem>
                  <SelectItem value="completed">Valmis</SelectItem>
                  <SelectItem value="failed">Epäonnistunut</SelectItem>
                  <SelectItem value="pending">Odottaa</SelectItem>
                  <SelectItem value="skipped">Ohitettu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="action_type">Toiminto</Label>
              <Select value={filters.action_type} onValueChange={(value) => handleFilterChange('action_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Kaikki toiminnot" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Kaikki toiminnot</SelectItem>
                  <SelectItem value="email_sent">Sähköposti lähetetty</SelectItem>
                  <SelectItem value="survey_created">Kysely luotu</SelectItem>
                  <SelectItem value="invitation_sent">Kutsu lähetetty</SelectItem>
                  <SelectItem value="reminder_sent">Muistutus lähetetty</SelectItem>
                  <SelectItem value="follow_up_sent">Seuranta lähetetty</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="trigger_id">Triggeri</Label>
              <Select value={filters.trigger_id} onValueChange={(value) => handleFilterChange('trigger_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Kaikki triggerit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Kaikki triggerit</SelectItem>
                  {triggers.map((trigger) => (
                    <SelectItem key={trigger.id} value={trigger.id}>
                      {trigger.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date_from">Alkaen</Label>
              <Input
                id="date_from"
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="date_to">Päättyen</Label>
              <Input
                id="date_to"
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleApplyFilters} size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Käytä suodattimia
            </Button>
            <Button onClick={handleClearFilters} variant="outline" size="sm">
              Tyhjennä
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lokitapahtumat</CardTitle>
              <CardDescription>
                Näytetään {logs.length} tapahtumaa {pagination.total} kokonaismäärästä
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="mr-2" />
              <span>Ladataan lokeja...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Ei lokitapahtumia
              </h3>
              <p className="text-gray-600">
                Lokitapahtumat näkyvät täällä kun automaatio suorittaa toimintoja.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(log.status)}
                      <div>
                        <div className="font-medium">{getActionTypeLabel(log.action_type)}</div>
                        <div className="text-sm text-gray-600">
                          {log.trigger_name || log.trigger_id}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(log.status)}
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(log.created_at).toLocaleString('fi-FI')}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <User className="h-4 w-4" />
                        Käyttäjä
                      </div>
                      <div className="font-medium">{log.user_email}</div>
                    </div>

                    {log.completed_at && (
                      <div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <Clock className="h-4 w-4" />
                          Valmistunut
                        </div>
                        <div className="font-medium">
                          {new Date(log.completed_at).toLocaleString('fi-FI')}
                        </div>
                      </div>
                    )}

                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div>
                        <div className="text-gray-600">Metadata</div>
                        <div className="font-mono text-xs bg-gray-50 p-2 rounded">
                          {JSON.stringify(log.metadata, null, 2)}
                        </div>
                      </div>
                    )}
                  </div>

                  {log.error_message && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertCircle className="h-4 w-4" />
                        <span className="font-medium">Virhe</span>
                      </div>
                      <div className="text-red-600 text-sm mt-1">
                        {log.error_message}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Sivu {pagination.page} / {pagination.total_pages} 
            (yhteensä {pagination.total} tapahtumaa)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Edellinen
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.total_pages}
            >
              Seuraava
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
