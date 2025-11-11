'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/components/auth/AuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Activity,
  Settings,
  Users,
  Mail,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { AutomationTriggerManager } from './AutomationTriggerManager'
import { AutomationLogsViewer } from './AutomationLogsViewer'
import { SegmentManager } from './SegmentManager'
import { MetricsTracker } from './MetricsTracker'

interface AutomationStats {
  total_triggers: number
  active_triggers: number
  total_emails_sent: number
  success_rate: number
  pending_actions: number
  failed_actions: number
}

interface DashboardData {
  stats: AutomationStats
  recent_activity: Array<{
    id: string
    type: string
    status: 'pending' | 'completed' | 'failed'
    created_at: string
    user_email?: string
    trigger_name?: string
    error_message?: string
  }>
}

export function SurveyAutomationDashboard() {
  const t = useTranslations('Admin.SurveyAutomation')
  const { session, isAdmin } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchDashboardData = useCallback(async () => {
    if (!session?.access_token || !isAdmin) return

    try {
      setError(null)
      
      // Fetch automation stats and recent activity
      const [statsResponse, logsResponse] = await Promise.all([
        fetch('/api/admin/survey-automation/stats', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }),
        fetch('/api/admin/survey-automation/logs?limit=10', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
      ])

      if (!statsResponse.ok || !logsResponse.ok) {
        throw new Error('Automaatiotietojen lataus epäonnistui')
      }

      const [statsData, logsData] = await Promise.all([
        statsResponse.json(),
        logsResponse.json()
      ])

      setData({
        stats: statsData.stats || {
          total_triggers: 0,
          active_triggers: 0,
          total_emails_sent: 0,
          success_rate: 0,
          pending_actions: 0,
          failed_actions: 0
        },
        recent_activity: logsData.logs || []
      })

    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Tuntematon virhe')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [session?.access_token, isAdmin])

  useEffect(() => {
    if (session?.access_token && isAdmin) {
      fetchDashboardData()
    }
  }, [session?.access_token, isAdmin, fetchDashboardData])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDashboardData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Spinner className="mx-auto mb-4" size="lg" />
          <p className="text-gray-600">Ladataan automaatiotietoja...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchDashboardData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Yritä uudelleen
        </Button>
      </div>
    )
  }

  const stats = data?.stats || {}
  const recentActivity = data?.recent_activity || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Kyselyautomaatio
          </h1>
          <p className="text-gray-600 mt-2">
            Hallitse automaattisia kyselykutsuja ja sähköposteja
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Päivitä
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Triggereita yhteensä
            </CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_triggers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active_triggers || 0} aktiivista
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Lähetetyt sähköpostit
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_emails_sent || 0}</div>
            <p className="text-xs text-muted-foreground">
              Kaikki ajat
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Onnistumisprosentti
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.success_rate || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Viimeisen 30 päivän aikana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Odottavat toiminnot
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending_actions || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats.failed_actions || 0} epäonnistunutta
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Viimeisimmät tapahtumat
          </CardTitle>
          <CardDescription>
            Kymmenen viimeisintä automaatiotoimintoa
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Ei viimeaikaista toimintaa
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {activity.status === 'completed' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {activity.status === 'failed' && (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    {activity.status === 'pending' && (
                      <Clock className="h-5 w-5 text-yellow-500" />
                    )}
                    
                    <div>
                      <div className="font-medium">
                        {activity.trigger_name || activity.type}
                      </div>
                      {activity.user_email && (
                        <div className="text-sm text-gray-600">
                          {activity.user_email}
                        </div>
                      )}
                      {activity.error_message && (
                        <div className="text-sm text-red-600">
                          {activity.error_message}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge 
                      variant={
                        activity.status === 'completed' ? 'default' :
                        activity.status === 'failed' ? 'destructive' : 'secondary'
                      }
                    >
                      {activity.status === 'completed' ? 'Valmis' :
                       activity.status === 'failed' ? 'Epäonnistunut' : 'Odottaa'}
                    </Badge>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(activity.created_at).toLocaleDateString('fi-FI', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Management Tabs */}
      <Tabs defaultValue="triggers" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="triggers">Triggerit</TabsTrigger>
          <TabsTrigger value="segments">Asiakasryhmät</TabsTrigger>
          <TabsTrigger value="metrics">Mittarit</TabsTrigger>
          <TabsTrigger value="logs">Lokit</TabsTrigger>
        </TabsList>

        <TabsContent value="triggers">
          <AutomationTriggerManager onUpdate={fetchDashboardData} />
        </TabsContent>

        <TabsContent value="segments">
          <SegmentManager onUpdate={fetchDashboardData} />
        </TabsContent>

        <TabsContent value="metrics">
          <MetricsTracker />
        </TabsContent>

        <TabsContent value="logs">
          <AutomationLogsViewer />
        </TabsContent>
      </Tabs>
    </div>
  )
}
