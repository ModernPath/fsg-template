'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/app/i18n/navigation'
import { useParams } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Save, Eye, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { EmailTemplate, EmailTemplateType, EmailTemplateFormData } from '@/types/email'

// Custom Switch component that works reliably (copied from surveys)
const CustomSwitch = ({ checked, onChange, disabled = false }: { 
  checked: boolean, 
  onChange: (checked: boolean) => void,
  disabled?: boolean 
}) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input
      type="checkbox"
      className="sr-only peer"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
    />
    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
  </label>
)

export default function EditEmailTemplatePage() {
  const router = useRouter()
  const params = useParams()
  const { session, isAdmin } = useAuth()
  const locale = params.locale as string
  const templateId = params.templateId as string

  const [template, setTemplate] = useState<EmailTemplate | null>(null)
  const [formData, setFormData] = useState<EmailTemplateFormData>({
    name: '',
    type: 'custom',
    subject: '',
    body: '',
    description: '',
    variables: {},
    is_active: true,
    is_default: false
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect if not admin
  if (!isAdmin) {
    router.push('/auth/sign-in')
    return null
  }

  // Load template data
  useEffect(() => {
    const loadTemplate = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/admin/email-templates/${templateId}`, {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          }
        })

        if (!response.ok) {
          throw new Error('Mallin lataaminen epäonnistui')
        }

        const { template } = await response.json()
        setTemplate(template)
        setFormData({
          name: template.name,
          type: template.type,
          subject: template.subject,
          body: template.body,
          description: template.description || '',
          variables: template.variables || {},
          is_active: template.is_active,
          is_default: template.is_default
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Tuntematon virhe')
      } finally {
        setLoading(false)
      }
    }

    if (session?.access_token) {
      loadTemplate()
    }
  }, [templateId, session?.access_token])

  const handleInputChange = (field: keyof EmailTemplateFormData, value: any) => {
    console.log('🔄 handleInputChange:', field, value)
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      }
      console.log('📊 New formData:', newData)
      return newData
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.subject || !formData.body) {
      setError('Nimi, aihe ja sisältö ovat pakollisia')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const response = await fetch(`/api/admin/email-templates/${templateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Mallin päivittäminen epäonnistui')
      }

      const { template: updatedTemplate } = await response.json()
      setTemplate(updatedTemplate)
      
      // Redirect to templates list
      router.push('/admin/email-templates')
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tuntematon virhe')
    } finally {
      setSaving(false)
    }
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
          <AlertTriangle className="h-4 w-4" />
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
          <h1 className="text-3xl font-bold">Muokkaa sähköpostimallia</h1>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Mallin tiedot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Mallin nimi *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Esim. Yksityiskohtainen rahoitushakemus"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="type">Mallin tyyppi</Label>
                  <Select value={formData.type} onValueChange={(value: EmailTemplateType) => handleInputChange('type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="detailed">Yksityiskohtainen</SelectItem>
                      <SelectItem value="marketing">Markkinointi</SelectItem>
                      <SelectItem value="custom">Mukautettu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Kuvaus</Label>
                  <Input
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Lyhyt kuvaus mallin käyttötarkoituksesta"
                  />
                </div>

                <div>
                  <Label htmlFor="subject">Aihe *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    placeholder="Sähköpostin aihe (voi sisältää muuttujia: {{company_name}})"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="body">Sähköpostin sisältö *</Label>
                  <Textarea
                    id="body"
                    value={formData.body}
                    onChange={(e) => handleInputChange('body', e.target.value)}
                    placeholder="Sähköpostin HTML-sisältö (voi sisältää muuttujia ja ehtoja)"
                    required
                    rows={12}
                    className="font-mono text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Asetukset</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Debug info */}
                <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
                  Debug: is_active={String(formData.is_active)}, is_default={String(formData.is_default)}
                  <br />
                  <button 
                    onClick={() => handleInputChange('is_active', !formData.is_active)}
                    className="mt-1 px-2 py-1 bg-blue-500 text-white text-xs rounded"
                  >
                    Toggle is_active (test)
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">Aktiivinen</Label>
                  <CustomSwitch
                    checked={Boolean(formData.is_active)}
                    onChange={(checked) => {
                      console.log('🔘 CustomSwitch is_active clicked:', checked)
                      handleInputChange('is_active', checked)
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is_default">Oletusmalli</Label>
                  <CustomSwitch
                    checked={Boolean(formData.is_default)}
                    onChange={(checked) => {
                      console.log('🔘 CustomSwitch is_default clicked:', checked)
                      handleInputChange('is_default', checked)
                    }}
                  />
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    <strong>Versio:</strong> {template.version}<br />
                    <strong>Luotu:</strong> {new Date(template.created_at).toLocaleDateString('fi-FI')}<br />
                    <strong>Päivitetty:</strong> {new Date(template.updated_at).toLocaleDateString('fi-FI')}
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Käytettävissä olevat muuttujat:</h4>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div><code>{'{{company_name}}'}</code> - Yrityksen nimi</div>
                    <div><code>{'{{business_id}}'}</code> - Y-tunnus</div>
                    <div><code>{'{{lender_name}}'}</code> - Rahoittajan nimi</div>
                    <div><code>{'{{sender_name}}'}</code> - Lähettäjän nimi</div>
                    <div><code>{'{{applicant_name}}'}</code> - Hakijan nimi</div>
                    <div><code>{'{{amount}}'}</code> - Rahoitussumma</div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Ehdolliset lohkot:</h4>
                  <div className="text-xs text-muted-foreground">
                    <code>{'{{#if variable}}'}...{'{{/if}}'}</code>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Toiminnot</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/${locale}/admin/email-templates/${templateId}/preview`}>
                  <Button variant="outline" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    Esikatsele malli
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-2">
          <Link href={`/${locale}/admin/email-templates`}>
            <Button variant="outline" type="button">
              Peruuta
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Tallennetaan...' : 'Tallenna muutokset'}
          </Button>
        </div>
      </form>
    </div>
  )
} 