'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Eye, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { EmailTemplate, EmailTemplateVariables } from '@/types/email'
import { createClient } from '@/utils/supabase/client'

export default function PreviewEmailTemplatePage() {
  const params = useParams()
  const { session, isAdmin } = useAuth()
  const locale = params.locale as string
  const templateId = params.templateId as string

  const [template, setTemplate] = useState<EmailTemplate | null>(null)
  const [variables, setVariables] = useState<EmailTemplateVariables>({
    company_name: 'Esimerkki Oy',
    business_id: '1234567-8',
    lender_name: 'Suomen Lainapalvelu',
    sender_name: 'Matti Meikäläinen',
    applicant_name: 'Liisa Lainahakija',
    amount: '50000',
    funding_type: 'Työpääomalaina',
    term_months: '12'
  })
  const [preview, setPreview] = useState<{
    subject: string
    body: string
    variables_used: string[]
  } | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [previewing, setPreviewing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect if not admin
  if (!isAdmin) {
    return null
  }

  // Load template data
  useEffect(() => {
    const loadTemplate = async () => {
      try {
        setLoading(true)
        
        const supabase = createClient()
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session?.access_token) {
          throw new Error('No valid session found')
        }
        
        const response = await fetch(`/api/admin/email-templates/${templateId}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error('Mallin lataaminen epäonnistui')
        }

        const { template } = await response.json()
        setTemplate(template)
        
        // Generate initial preview
        generatePreview(template, variables)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Tuntematon virhe')
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      loadTemplate()
    }
  }, [templateId, session])

  const generatePreview = async (currentTemplate?: EmailTemplate, currentVariables?: EmailTemplateVariables) => {
    if (!currentTemplate && !template) return
    
    try {
      setPreviewing(true)
      
      const supabase = createClient()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session?.access_token) {
        throw new Error('No valid session found')
      }
      
      const response = await fetch(`/api/admin/email-templates/${templateId}/preview`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          variables: currentVariables || variables
        })
      })

      if (!response.ok) {
        throw new Error('Esikatselun luominen epäonnistui')
      }

      const previewData = await response.json()
      setPreview(previewData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tuntematon virhe')
    } finally {
      setPreviewing(false)
    }
  }

  const handleVariableChange = (key: keyof EmailTemplateVariables, value: string) => {
    const newVariables = { ...variables, [key]: value }
    setVariables(newVariables)
  }

  const handleRefreshPreview = () => {
    generatePreview()
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Ladataan mallia...</div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="container mx-auto py-6">
        <Alert>
          <AlertDescription>Mallia ei löytynyt</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/admin/email-templates`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Takaisin
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Mallin esikatselu</h1>
          <p className="text-muted-foreground">
            {template.name} (v{template.version})
          </p>
        </div>
      </div>

      {error && (
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Variables Panel */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Muuttujat
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRefreshPreview}
                  disabled={previewing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${previewing ? 'animate-spin' : ''}`} />
                  Päivitä
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Yrityksen nimi</Label>
                <Input
                  value={variables.company_name || ''}
                  onChange={(e) => handleVariableChange('company_name', e.target.value)}
                  placeholder="Esimerkki Oy"
                />
              </div>

              <div>
                <Label>Y-tunnus</Label>
                <Input
                  value={variables.business_id || ''}
                  onChange={(e) => handleVariableChange('business_id', e.target.value)}
                  placeholder="1234567-8"
                />
              </div>

              <div>
                <Label>Rahoittajan nimi</Label>
                <Input
                  value={variables.lender_name || ''}
                  onChange={(e) => handleVariableChange('lender_name', e.target.value)}
                  placeholder="Suomen Lainapalvelu"
                />
              </div>

              <div>
                <Label>Lähettäjän nimi</Label>
                <Input
                  value={variables.sender_name || ''}
                  onChange={(e) => handleVariableChange('sender_name', e.target.value)}
                  placeholder="Matti Meikäläinen"
                />
              </div>

              <div>
                <Label>Hakijan nimi</Label>
                <Input
                  value={variables.applicant_name || ''}
                  onChange={(e) => handleVariableChange('applicant_name', e.target.value)}
                  placeholder="Liisa Lainahakija"
                />
              </div>

              <div>
                <Label>Rahoitussumma</Label>
                <Input
                  value={variables.amount || ''}
                  onChange={(e) => handleVariableChange('amount', e.target.value)}
                  placeholder="50000"
                />
              </div>

              <div>
                <Label>Rahoitustyyppi</Label>
                <Input
                  value={variables.funding_type || ''}
                  onChange={(e) => handleVariableChange('funding_type', e.target.value)}
                  placeholder="Työpääomalaina"
                />
              </div>

              <div>
                <Label>Laina-aika (kuukautta)</Label>
                <Input
                  value={variables.term_months || ''}
                  onChange={(e) => handleVariableChange('term_months', e.target.value)}
                  placeholder="12"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>
                <Eye className="h-5 w-5 mr-2 inline" />
                Esikatselu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {preview ? (
                <>
                  <div>
                    <Label className="text-sm font-medium">Aihe:</Label>
                    <div className="mt-1 p-3 bg-muted rounded border">
                      <div className="font-medium">{preview.subject}</div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Sisältö:</Label>
                    <div className="mt-1 p-4 bg-white border rounded max-h-96 overflow-y-auto">
                      <div dangerouslySetInnerHTML={{ __html: preview.body }} />
                    </div>
                  </div>

                  {preview.variables_used && preview.variables_used.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Käytetyt muuttujat:</Label>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {preview.variables_used.map((variable, index) => (
                          <span key={index} className="px-2 py-1 bg-primary/10 text-white text-xs rounded">
                            {`{{${variable}}}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {previewing ? 'Luodaan esikatselua...' : 'Esikatselu ei ole saatavilla'}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            <Link href={`/${locale}/admin/email-templates/${templateId}/edit`} className="flex-1">
              <Button variant="outline" className="w-full">
                Muokkaa mallia
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 