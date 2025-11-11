'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock, 
  Mail, 
  CheckCircle,
  AlertTriangle,
  Star,
  ThumbsUp,
  MessageSquare
} from 'lucide-react'

interface Analytics {
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
  status_distribution: {
    completed: number
    in_progress: number
    abandoned: number
    started: number
  }
}

interface SurveyInsightsProps {
  analytics: Analytics
}

export function SurveyInsights({ analytics }: SurveyInsightsProps) {
  const t = useTranslations('Survey')
  const insights = useMemo(() => {
    const insights = []

    // Completion rate insights
    if (analytics.overview.completion_rate > 80) {
      insights.push({
        type: 'success',
        icon: CheckCircle,
        title: 'Erinomainen valmistumisaste',
        description: `${analytics.overview.completion_rate.toFixed(1)}% vastaajista viimeistelee kyselyn. Tämä on erittäin hyvä tulos.`,
        recommendation: 'Jatka samalla tavalla! Kysely on selvästi hyvin suunniteltu ja motivoiva.'
      })
    } else if (analytics.overview.completion_rate > 60) {
      insights.push({
        type: 'warning',
        icon: TrendingUp,
        title: 'Hyvä valmistumisaste',
        description: `${analytics.overview.completion_rate.toFixed(1)}% vastaajista viimeistelee kyselyn.`,
        recommendation: 'Voit vielä parantaa valmistumisastetta lyhentämällä kyselyä tai parantamalla kysymysten selkeyttä.'
      })
    } else {
      insights.push({
        type: 'error',
        icon: AlertTriangle,
        title: 'Matala valmistumisaste',
        description: `Vain ${analytics.overview.completion_rate.toFixed(1)}% vastaajista viimeistelee kyselyn.`,
        recommendation: 'Harkitse kyselyn lyhentämistä, kysymysten uudelleenmuotoilua tai kannustimien lisäämistä.'
      })
    }

    // NPS insights
    if (analytics.overview.nps_score !== null) {
      if (analytics.overview.nps_score > 50) {
        insights.push({
          type: 'success',
          icon: Star,
          title: 'Erinomainen NPS-pisteet',
          description: `NPS-pisteesi on ${analytics.overview.nps_score.toFixed(1)}, mikä on erinomainen tulos.`,
          recommendation: 'Asiakkaat ovat erittäin tyytyväisiä! Hyödynnä tätä markkinoinnissa ja jatka samaa laatua.'
        })
      } else if (analytics.overview.nps_score > 0) {
        insights.push({
          type: 'warning',
          icon: ThumbsUp,
          title: 'Positiivinen NPS-pisteet',
          description: `NPS-pisteesi on ${analytics.overview.nps_score.toFixed(1)}, mikä on positiivinen.`,
          recommendation: 'Hyvä pohja! Keskity kriitikoiden palautteen analysointiin ja parannusten tekemiseen.'
        })
      } else {
        insights.push({
          type: 'error',
          icon: TrendingDown,
          title: 'Negatiivinen NPS-pisteet',
          description: `NPS-pisteesi on ${analytics.overview.nps_score.toFixed(1)}, mikä vaatii huomiota.`,
          recommendation: 'Analysoi kriittiset vastaukset huolellisesti ja tee konkreettisia parannuksia palveluun.'
        })
      }
    }

    // Completion time insights
    if (analytics.overview.average_completion_time) {
      const avgMinutes = analytics.overview.average_completion_time / 60
      if (avgMinutes > 15) {
        insights.push({
          type: 'warning',
          icon: Clock,
          title: 'Pitkä vastausaika',
          description: `Keskimääräinen vastausaika on ${avgMinutes.toFixed(1)} minuuttia.`,
          recommendation: 'Harkitse kyselyn lyhentämistä tai jakamista useampaan osaan paremman käyttökokemuksen saamiseksi.'
        })
      } else if (avgMinutes < 3) {
        insights.push({
          type: 'warning',
          icon: Clock,
          title: 'Hyvin lyhyt vastausaika',
          description: `Keskimääräinen vastausaika on vain ${avgMinutes.toFixed(1)} minuuttia.`,
          recommendation: 'Varmista, että vastaajat ehtivät lukea kysymykset huolellisesti. Liian nopeat vastaukset voivat vaikuttaa laatuun.'
        })
      } else {
        insights.push({
          type: 'success',
          icon: Clock,
          title: 'Optimaalinen vastausaika',
          description: `Keskimääräinen vastausaika on ${avgMinutes.toFixed(1)} minuuttia.`,
          recommendation: 'Erinomainen! Kysely on sopivan pituinen ja vastaajat käyttävät riittävästi aikaa.'
        })
      }
    }

    // Email performance insights
    if (analytics.invitations.total_sent > 0) {
      if (analytics.invitations.open_rate > 25) {
        insights.push({
          type: 'success',
          icon: Mail,
          title: 'Hyvä sähköpostien avausprosent',
          description: `${analytics.invitations.open_rate.toFixed(1)}% kutsuviesteistä avattiin.`,
          recommendation: 'Sähköpostiotsikot ja sisältö toimivat hyvin! Jatka samaa linjaa.'
        })
      } else {
        insights.push({
          type: 'warning',
          icon: Mail,
          title: 'Matala sähköpostien avausprosent',
          description: `Vain ${analytics.invitations.open_rate.toFixed(1)}% kutsuviesteistä avattiin.`,
          recommendation: 'Kokeile erilaisia otsikkorivejä, lähetysaikoja tai personointia paremman avausprosentin saamiseksi.'
        })
      }
    }

    // Response volume insights
    if (analytics.overview.total_responses < 50) {
      insights.push({
        type: 'info',
        icon: Users,
        title: 'Vähän vastauksia',
        description: `Kyselyyn on vastattu ${analytics.overview.total_responses} kertaa.`,
        recommendation: 'Harkitse aktiivisempaa markkinointia tai muistutusviestien lähettämistä vastausprosentin nostamiseksi.'
      })
    } else if (analytics.overview.total_responses > 200) {
      insights.push({
        type: 'success',
        icon: Users,
        title: 'Runsaasti vastauksia',
        description: `Kyselyyn on vastattu ${analytics.overview.total_responses} kertaa.`,
        recommendation: 'Erinomainen osallistumisaste! Sinulla on luotettava aineisto analyysiä varten.'
      })
    }

    // Abandonment insights
    const abandonmentRate = analytics.overview.total_responses > 0 
      ? (analytics.overview.abandoned_responses / analytics.overview.total_responses) * 100 
      : 0

    if (abandonmentRate > 30) {
      insights.push({
        type: 'error',
        icon: AlertTriangle,
        title: 'Korkea keskeytysmäärä',
        description: `${abandonmentRate.toFixed(1)}% vastaajista keskeyttää kyselyn.`,
        recommendation: 'Tarkista kyselyn pituus, kysymysten selkeys ja tekninen toimivuus. Liian pitkä tai vaikea kysely aiheuttaa keskeytyksiä.'
      })
    }

    return insights
  }, [analytics])

  const getInsightColor = (type: string) => {
    const colors = {
      success: 'border-green-200 bg-green-50',
      warning: 'border-yellow-200 bg-yellow-50',
      error: 'border-red-200 bg-red-50',
      info: 'border-blue-200 bg-blue-50'
    }
    return colors[type as keyof typeof colors] || colors.info
  }

  const getIconColor = (type: string) => {
    const colors = {
      success: 'text-green-600',
      warning: 'text-yellow-600',
      error: 'text-red-600',
      info: 'text-blue-600'
    }
    return colors[type as keyof typeof colors] || colors.info
  }

  const getBadgeVariant = (type: string) => {
    const variants = {
      success: 'default',
      warning: 'secondary',
      error: 'destructive',
      info: 'outline'
    }
    return variants[type as keyof typeof variants] || 'outline'
  }

  // Calculate trends (mock data - in real implementation, compare with previous period)
  const trends = {
    responseGrowth: 12.5, // Mock: +12.5% vs previous period
    completionImprovement: -2.1, // Mock: -2.1% vs previous period
    npsChange: 3.2 // Mock: +3.2 points vs previous period
  }

  return (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Vastaustrendi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{analytics.overview.total_responses}</div>
                <p className="text-sm text-gray-600">Vastauksia yhteensä</p>
              </div>
              <div className={`flex items-center text-sm ${trends.responseGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trends.responseGrowth > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                {Math.abs(trends.responseGrowth)}%
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Valmistuminen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{analytics.overview.completion_rate.toFixed(1)}%</div>
                <p className="text-sm text-gray-600">Valmistumisaste</p>
              </div>
              <div className={`flex items-center text-sm ${trends.completionImprovement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trends.completionImprovement > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                {Math.abs(trends.completionImprovement)}%
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tyytyväisyys</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {analytics.overview.nps_score !== null 
                    ? analytics.overview.nps_score.toFixed(1) 
                    : 'N/A'
                  }
                </div>
                <p className="text-sm text-gray-600">NPS-pisteet</p>
              </div>
              {analytics.overview.nps_score !== null && (
                <div className={`flex items-center text-sm ${trends.npsChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {trends.npsChange > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                  {Math.abs(trends.npsChange)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights and Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Analyysit ja suositukset</CardTitle>
          <CardDescription>
            Automaattiset näkemykset kyselysi suorituskyvystä ja parannusehdotukset
          </CardDescription>
        </CardHeader>
        <CardContent>
          {insights.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="mx-auto h-12 w-12 mb-4 text-gray-300" />
              <p>Ei riittävästi dataa näkemysten luomiseen</p>
              <p className="text-sm mt-1">Kerää lisää vastauksia saadaksesi automaattisia analyysejä</p>
            </div>
          ) : (
            <div className="space-y-4">
              {insights.map((insight, index) => {
                const Icon = insight.icon
                return (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border-2 ${getInsightColor(insight.type)}`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`h-5 w-5 mt-0.5 ${getIconColor(insight.type)}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{insight.title}</h4>
                          <Badge variant={getBadgeVariant(insight.type) as any}>
                            {insight.type === 'success' && 'Hyvä'}
                            {insight.type === 'warning' && 'Huomio'}
                            {insight.type === 'error' && 'Toimenpide'}
                            {insight.type === 'info' && 'Info'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{insight.description}</p>
                        <p className="text-sm font-medium text-gray-900">
                          💡 {insight.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ehdotetut toimenpiteet</CardTitle>
          <CardDescription>
            Toimenpiteet kyselyn suorituskyvyn parantamiseksi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analytics.overview.completion_rate < 70 && (
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">🎯 Paranna valmistumisastetta</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Valmistumisaste on alle 70%. Harkitse kyselyn optimointia.
                </p>
                <ul className="text-sm space-y-1">
                  <li>• Lyhennä kyselyä poistamalla ei-kriittiset kysymykset</li>
                  <li>• Lisää edistymispalkki motivoimaan vastaajia</li>
                  <li>• Tarkista kysymysten selkeys ja ymmärrettävyys</li>
                </ul>
              </div>
            )}

            {analytics.invitations.open_rate < 25 && analytics.invitations.total_sent > 0 && (
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">📧 Paranna sähköpostien avausprosenttia</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Vain {analytics.invitations.open_rate.toFixed(1)}% sähköposteista avataan.
                </p>
                <ul className="text-sm space-y-1">
                  <li>• Testaa erilaisia otsikkorivejä</li>
                  <li>• Personoi viestejä vastaanottajan nimellä</li>
                  <li>• Optimoi lähetysaika (esim. tiistai-torstai 9-11)</li>
                </ul>
              </div>
            )}

            {analytics.overview.total_responses < 100 && (
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">📈 Kasvata vastausmäärää</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Tarvitset lisää vastauksia luotettavaa analyysiä varten.
                </p>
                <ul className="text-sm space-y-1">
                  <li>• Lähetä muistutusviestejä ei-vastanneille</li>
                  <li>• Jaa kyselylinkkiä sosiaalisessa mediassa</li>
                  <li>• Harkitse pientä kannustinta (arvonta, alennus)</li>
                </ul>
              </div>
            )}

            {analytics.overview.nps_score !== null && analytics.overview.nps_score < 0 && (
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">⚠️ Paranna asiakastyytyväisyyttä</h4>
                <p className="text-sm text-gray-600 mb-3">
                  NPS-pisteesi on negatiivinen ({analytics.overview.nps_score.toFixed(1)}).
                </p>
                <ul className="text-sm space-y-1">
                  <li>• Analysoi kriittisten vastaajien palaute huolellisesti</li>
                  <li>• Ota yhteyttä tyytymättömiin asiakkaisiin</li>
                  <li>• Tee konkreettisia parannuksia palveluun</li>
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
