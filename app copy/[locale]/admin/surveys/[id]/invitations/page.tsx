'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Mail, Send, Users, Calendar } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Spinner } from '@/components/ui/spinner'

interface SurveyInvitation {
  id: string
  email: string
  sent_at: string
  opened_at?: string
  responded_at?: string
  status: 'pending' | 'sent' | 'opened' | 'responded'
  invitation_token: string
}

export default function SurveyInvitationsPage() {
  const params = useParams()
  const { session, isAdmin } = useAuth()
  const t = useTranslations('Admin.Surveys')
  const locale = params.locale as string
  const surveyId = params.id as string

  const [invitations, setInvitations] = useState<SurveyInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const loadInvitations = async (forceRefresh = false) => {
    if (!session?.access_token || !isAdmin || !surveyId) return

    if (forceRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      setError(null)

      const response = await fetch(`/api/surveys/invitations?template_id=${surveyId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Kutsujen lataus epäonnistui')
      }

      const data = await response.json()
      setInvitations(data.invitations || [])
    } catch (err) {
      console.error('Error loading invitations:', err)
      setError(err instanceof Error ? err.message : 'Tuntematon virhe')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadInvitations()
  }, [session?.access_token, isAdmin, surveyId])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!session?.access_token || !isAdmin || !surveyId) return

    const interval = setInterval(() => {
      loadInvitations(true)
    }, 30000)

    return () => clearInterval(interval)
  }, [session?.access_token, isAdmin, surveyId])

  const getStatusBadge = (invitation: SurveyInvitation) => {
    if (invitation.responded_at) {
      return <Badge variant="default">Vastattu</Badge>
    }
    if (invitation.opened_at) {
      return <Badge variant="default">Avattu</Badge>
    }
    if (invitation.sent_at) {
      return <Badge variant="default">Lähetetty</Badge>
    }
    return <Badge variant="secondary">Odottaa</Badge>
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground">Ladataan kutsuja...</p>
        </div>
      </div>
    )
  }

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
            <h1 className="text-2xl font-bold text-white">Kyselyn kutsut</h1>
            <p className="text-gray-400">Hallitse ja seuraa kyselykutsuja</p>
          </div>
        </div>
        
        <Button asChild>
          <Link href={`/${locale}/admin/surveys/${surveyId}/invitations/new`}>
            <Send className="h-4 w-4 mr-2" />
            Lähetä uusia kutsuja
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kutsuja yhteensä</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invitations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lähetetty</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invitations.filter(inv => inv.sent_at).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avattu</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invitations.filter(inv => inv.opened_at).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vastattu</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invitations.filter(inv => inv.responded_at).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invitations List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-white">Kutsut</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-red-500 mb-4">{error}</div>
          )}

          {invitations.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                Ei kutsuja lähetetty
              </h3>
              <p className="text-gray-400 mb-6">
                Aloita lähettämällä ensimmäiset kyselykutsut.
              </p>
              <Button asChild>
                <Link href={`/${locale}/admin/surveys/${surveyId}/invitations/new`}>
                  <Send className="h-4 w-4 mr-2" />
                  Lähetä kutsut
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium text-white">
                        {invitation.email}
                      </span>
                      {getStatusBadge(invitation)}
                    </div>
                    <div className="text-sm text-gray-500 space-y-1">
                      {invitation.sent_at && (
                        <div>Lähetetty: {formatDate(invitation.sent_at)}</div>
                      )}
                      {invitation.opened_at && (
                        <div>Avattu: {formatDate(invitation.opened_at)}</div>
                      )}
                      {invitation.responded_at && (
                        <div>Vastattu: {formatDate(invitation.responded_at)}</div>
                      )}
                    </div>
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
