'use client'

import React, { useState } from 'react'
import { useRouter } from '@/app/i18n/navigation'
import { useParams } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Send, Users, Mail } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function NewSurveyInvitationsPage() {
  const router = useRouter()
  const params = useParams()
  const { session, isAdmin } = useAuth()
  const t = useTranslations('Admin.Surveys')
  const locale = params.locale as string
  const surveyId = params.id as string

  const [emails, setEmails] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Redirect if not admin
  if (!isAdmin) {
    router.push('/auth/sign-in')
    return null
  }

  const parseEmails = (emailText: string): string[] => {
    return emailText
      .split(/[,;\n\r\t\s]+/)
      .map(email => email.trim())
      .filter(email => email.length > 0 && email.includes('@'))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const emailList = parseEmails(emails)
    
    if (emailList.length === 0) {
      setError('Lisää vähintään yksi sähköpostiosoite')
      return
    }

    // Basic email validation
    const invalidEmails = emailList.filter(email => 
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    )
    
    if (invalidEmails.length > 0) {
      setError(`Virheelliset sähköpostiosoitteet: ${invalidEmails.join(', ')}`)
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const response = await fetch('/api/surveys/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          template_id: surveyId,
          emails: emailList,
          custom_message: customMessage.trim() || undefined
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Kutsujen lähettäminen epäonnistui')
      }

      const data = await response.json()
      setSuccess(`${data.sent_count} kutsua lähetetty onnistuneesti!`)
      
      // Clear form
      setEmails('')
      setCustomMessage('')
      
      // Redirect after short delay
      setTimeout(() => {
        router.push(`/admin/surveys/${surveyId}/invitations`)
      }, 2000)
      
    } catch (err) {
      console.error('Error sending invitations:', err)
      setError(err instanceof Error ? err.message : 'Tuntematon virhe')
    } finally {
      setLoading(false)
    }
  }

  const emailCount = parseEmails(emails).length

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${locale}/admin/surveys/${surveyId}/invitations`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Takaisin kutsulkiin
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white">Lähetä kyselykutsuja</h1>
          <p className="text-gray-400">Kutsu vastaajia osallistumaan kyselyyn</p>
        </div>
      </div>

      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Addresses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Mail className="h-5 w-5" />
              Sähköpostiosoitteet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="emails" className="text-white">
                Vastaajien sähköpostiosoitteet *
              </Label>
              <Textarea
                id="emails"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                placeholder="Syötä sähköpostiosoitteet pilkulla, puolipisteellä tai rivinvaihdolla erotettuna:&#10;&#10;esimerkki1@yritys.fi&#10;esimerkki2@yritys.fi, esimerkki3@yritys.fi"
                rows={6}
                required
              />
              {emails && (
                <p className="text-sm text-gray-400 mt-2">
                  {emailCount} sähköpostiosoitetta tunnistettu
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Custom Message */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Users className="h-5 w-5" />
              Mukautettu viesti (valinnainen)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="customMessage" className="text-white">
                Lisäviesti kutsuun
              </Label>
              <Textarea
                id="customMessage"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Kirjoita lisäviesti, joka näytetään kyselykutsussa. Esimerkiksi kyselyn konteksti tai kiitos osallistumisesta."
                rows={4}
              />
              <p className="text-sm text-gray-400 mt-2">
                Tämä viesti näytetään vakioviestin lisäksi kyselykutsussa.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/admin/surveys/${surveyId}/invitations`)}
            disabled={loading}
          >
            Peruuta
          </Button>
          <Button
            type="submit"
            disabled={loading || emailCount === 0}
            className="min-w-32"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Lähetetään...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Lähetä {emailCount} kutsua
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
