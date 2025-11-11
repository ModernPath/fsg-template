'use client'

import React, { use, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/app/i18n/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Building2, 
  Users, 
  Handshake, 
  BarChart3, 
  Calendar, 
  FileText, 
  Mail, 
  Globe, 
  Settings,
  TrendingUp,
  DollarSign,
  Activity,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'

interface StatsData {
  activeCompanies: {
    value: string
    change: string
    trend: string
  }
  totalUsers: {
    value: string
    change: string
    trend: string
  }
  monthlyRevenue: {
    value: string
    change: string
    trend: string
  }
  totalAnalyses: {
    value: string
    change: string
    trend: string
  }
}

interface Activity {
  id: string
  type: 'company_created' | 'analysis_completed' | 'application_submitted' | 'blog_published'
  title: string
  description: string
  timestamp: string
  timeAgo: string
  color: 'green' | 'blue' | 'orange' | 'purple'
}

export default function AdminDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  // Unwrap params using React.use() (Next.js 15 requirement)
  const { locale } = use(params)
  
  const t = useTranslations('Admin.Dashboard')
  const [stats, setStats] = useState<StatsData | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get session token for authentication
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No active session')
      }
      
      // Fetch both stats and activities in parallel
      const [statsResponse, activitiesResponse] = await Promise.all([
        fetch('/api/admin/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }),
        fetch('/api/admin/dashboard/activities', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        })
      ])
      
      if (!statsResponse.ok) {
        const errorData = await statsResponse.json()
        throw new Error(errorData.error || 'Failed to fetch dashboard stats')
      }

      if (!activitiesResponse.ok) {
        const errorData = await activitiesResponse.json()
        throw new Error(errorData.error || 'Failed to fetch activities')
      }

      const statsData = await statsResponse.json()
      const activitiesData = await activitiesResponse.json()
      
      setStats(statsData.stats)
      setActivities(activitiesData.activities || [])
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const statsConfig = stats ? [
    {
      title: t('activeCompanies', { default: 'Aktiiviset yritykset' }),
      value: stats.activeCompanies.value,
      change: stats.activeCompanies.change,
      trend: stats.activeCompanies.trend,
      icon: Building2,
      href: "/admin/companies"
    },
    {
      title: t('totalUsers', { default: 'Käyttäjät yhteensä' }),
      value: stats.totalUsers.value,
      change: stats.totalUsers.change,
      trend: stats.totalUsers.trend,
      icon: Users,
      href: "/admin/users"
    },
    {
      title: t('monthlyRevenue', { default: 'Kuukauden liikevaihto' }),
      value: stats.monthlyRevenue.value,
      change: stats.monthlyRevenue.change,
      trend: stats.monthlyRevenue.trend,
      icon: DollarSign,
      href: "/admin/analytics"
    },
    {
      title: t('totalAnalyses', { default: 'Analyysien määrä' }),
      value: stats.totalAnalyses.value,
      change: stats.totalAnalyses.change,
      trend: stats.totalAnalyses.trend,
      icon: Activity,
      href: "/admin/analytics"
    }
  ] : []

  const quickActions = [
    {
      title: "Analytics",
      description: "Seuraa käyttäjämääriä ja suorituskykyä",
      icon: BarChart3,
      href: "/admin/analytics",
      color: "bg-blue-500"
    },
    {
      title: "Kalenteri",
      description: "Hallitse tapaamisia ja tapahtumia",
      icon: Calendar,
      href: "/admin/calendar",
      color: "bg-green-500"
    },
    {
      title: "Sisällönhallinta",
      description: "Päivitä sivuston sisältöä ja blogipostauksia",
      icon: FileText,
      href: "/admin/cms",
      color: "bg-purple-500"
    },
    {
      title: "Sähköpostimallit",
      description: "Luo ja muokkaa automatisoituja viestejä",
      icon: Mail,
      href: "/admin/email-templates", 
      color: "bg-orange-500"
    },
    {
      title: "Yhteistyökumppanit",
      description: "Hallitse rahoittajia ja komissioita",
      icon: Handshake,
      href: "/admin/partners",
      color: "bg-pink-500"
    },
    {
      title: "Käännökset",
      description: "Päivitä kieliversiot ja lokalisaatiot",
      icon: Globe,
      href: "/admin/translations",
      color: "bg-indigo-500"
    }
  ]

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Spinner className="h-12 w-12 text-gold-primary" />
        <p className="text-lg text-muted-foreground">{t('loading', { default: 'Ladataan dashboard-tietoja...' })}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-2">{t('error', { default: 'Virhe' })}</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchStats} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('retry', { default: 'Yritä uudelleen' })}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">
            {t('title', { default: 'Ylläpidon hallintapaneeli' })}
          </h1>
          <p className="text-muted-foreground text-lg text-gray-300">
            {t('welcomeMessage', { default: 'Tervetuloa ylläpidon hallintapaneeliin.' })}
          </p>
        </div>
        <div className="mt-4 lg:mt-0 flex gap-3">
          <Button onClick={fetchStats} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('refresh', { default: 'Päivitä' })}
          </Button>
          <Link
            href="/admin/analytics"
            className="inline-flex items-center px-6 py-3 bg-gold-primary text-black font-semibold rounded-lg hover:bg-gold-highlight transition-colors"
          >
            <TrendingUp className="h-5 w-5 mr-2" />
            {t('viewReport', { default: 'Näytä raportti' })}
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsConfig.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Link key={index} href={stat.href} className="group">
              <Card className="bg-card border-border hover:border-gold-primary/50 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        {stat.title}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-3xl font-bold text-white">
                          {stat.value}
                        </p>
                        <ArrowUpRight className="h-4 w-4 text-gold-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-sm text-green-500 font-medium mt-1">
                        {stat.change} {t('lastMonth', { default: 'edellisestä kuukaudesta' })}
                      </p>
                    </div>
                    <div className="bg-gold-primary/10 p-3 rounded-full">
                      <IconComponent className="h-6 w-6 text-gold-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-2xl text-white flex items-center gap-2">
            <Settings className="h-6 w-6 text-gold-primary" />
            Pika-toiminnot
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <Link 
                  key={index}
                  href={action.href}
                  className="group p-6 rounded-xl border border-border hover:border-gold-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-lg bg-background"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${action.color} bg-opacity-10`}>
                      <IconComponent className={`h-6 w-6 text-white`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-2 group-hover:text-gold-primary transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-gold-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl text-white">Viimeisimmät toiminnot</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && activities.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="h-6 w-6 text-gold-primary" />
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Ei viimeaikaisia toimintoja</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.slice(0, 10).map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg bg-background">
                    <div className={`w-2 h-2 rounded-full bg-${activity.color}-500`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.description} - {activity.timeAgo}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl text-white">Järjestelmän tila</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-background">
                <span className="text-sm font-medium text-white">API Status</span>
                <span className="text-sm text-green-500 font-medium">Toiminnassa</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-background">
                <span className="text-sm font-medium text-white">Tietokanta</span>
                <span className="text-sm text-green-500 font-medium">Toiminnassa</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-background">
                <span className="text-sm font-medium text-white">Sähköposti</span>
                <span className="text-sm text-green-500 font-medium">Toiminnassa</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-background">
                <span className="text-sm font-medium text-white">Backup</span>
                <span className="text-sm text-green-500 font-medium">Valmis (12:00)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
