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
import { Switch } from '@/components/ui/switch'

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

import { ArrowLeft, Save, Settings, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { createClient } from '@/utils/supabase/client'

interface SurveyFormData {
  name: string
  description: string
  questions: Record<string, any> // Changed from any[] to Record<string, any>
  settings: {
    allow_anonymous: boolean
    allow_multiple_responses: boolean
    show_progress: boolean
    require_login: boolean
  }
  is_active: boolean
  is_default: boolean
}

export default function NewSurveyPage() {
  const router = useRouter()
  const params = useParams()
  const { isAdmin } = useAuth()
  const t = useTranslations('Admin.Surveys')
  const locale = params.locale as string

  const [formData, setFormData] = useState<SurveyFormData>({
    name: '',
    description: '',
    questions: {}, // Changed from [] to {}
    settings: {
      allow_anonymous: true,
      allow_multiple_responses: false,
      show_progress: true,
      require_login: false
    },
    is_active: true,
    is_default: false
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect if not admin
  if (!isAdmin) {
    router.push('/auth/sign-in')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('Kyselyn nimi on pakollinen')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Get access token from Supabase client
      const supabase = createClient()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session?.access_token) {
        throw new Error('Ei voitu hakea valtuutusta')
      }

      const response = await fetch('/api/surveys/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Kyselyn luominen epäonnistui')
      }

      const data = await response.json()
      router.push(`/admin/surveys/${data.template.id}`)
    } catch (err) {
      console.error('Error creating survey:', err)
      setError(err instanceof Error ? err.message : 'Tuntematon virhe')
    } finally {
      setLoading(false)
    }
  }

  const updateFormData = (field: keyof SurveyFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const updateSettings = (field: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value
      }
    }))
  }

  const addQuestion = () => {
    const questionId = `question_${Date.now()}`
    setFormData(prev => ({
      ...prev,
      questions: {
        ...prev.questions,
        [questionId]: {
          text: '',
          type: 'text',
          required: false
        }
      }
    }))
  }

  const removeQuestion = (questionId: string) => {
    setFormData(prev => {
      const newQuestions = { ...prev.questions }
      delete newQuestions[questionId]
      return {
        ...prev,
        questions: newQuestions
      }
    })
  }

  const updateQuestion = (questionId: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      questions: {
        ...prev.questions,
        [questionId]: {
          ...prev.questions[questionId],
          [field]: value
        }
      }
    }))
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${locale}/admin/surveys`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Takaisin kyselyihin
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white">Uusi kysely</h1>
          <p className="text-gray-400">Luo uusi asiakastyytyväisyyskysely</p>
        </div>
      </div>

      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Perustiedot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-white">Kyselyn nimi *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                placeholder="Esim. Asiakastyytyväisyyskysely Q1 2025"
                required
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-white">Kuvaus</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder="Lyhyt kuvaus kyselystä ja sen tarkoituksesta"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Survey Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Settings className="h-5 w-5" />
              Kyselyn asetukset
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Salli anonyymit vastaukset</Label>
                <p className="text-sm text-gray-400">Vastaajien ei tarvitse kirjautua sisään</p>
              </div>
              <CustomSwitch
                checked={formData.settings.allow_anonymous}
                onChange={(checked) => updateSettings('allow_anonymous', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Salli useita vastauksia</Label>
                <p className="text-sm text-gray-400">Sama käyttäjä voi vastata useita kertoja</p>
              </div>
              <CustomSwitch
                checked={formData.settings.allow_multiple_responses}
                onChange={(checked) => updateSettings('allow_multiple_responses', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Näytä edistymispalkki</Label>
                <p className="text-sm text-gray-400">Näyttää vastaajan edistymisen kyselyssä</p>
              </div>
              <CustomSwitch
                checked={formData.settings.show_progress}
                onChange={(checked) => updateSettings('show_progress', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Vaadi kirjautuminen</Label>
                <p className="text-sm text-gray-400">Vain kirjautuneet käyttäjät voivat vastata</p>
              </div>
              <CustomSwitch
                checked={formData.settings.require_login}
                onChange={(checked) => updateSettings('require_login', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Questions Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <span>Kysymykset</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addQuestion()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Lisää kysymys
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(formData.questions).length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>Ei kysymyksiä vielä lisätty</p>
                <p className="text-sm">Klikkaa "Lisää kysymys" aloittaaksesi</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(formData.questions).map(([questionId, question]) => (
                  <div key={questionId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-white">Kysymys {questionId}</h4>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeQuestion(questionId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Input
                        placeholder="Kysymyksen teksti"
                        value={question.text || ''}
                        onChange={(e) => updateQuestion(questionId, 'text', e.target.value)}
                      />
                      <div className="flex gap-2">
                        <select
                          className="px-3 py-2 border rounded-md bg-white text-black"
                          value={question.type || 'text'}
                          onChange={(e) => updateQuestion(questionId, 'type', e.target.value)}
                        >
                          <option value="text">Teksti</option>
                          <option value="textarea">Pitkä teksti</option>
                          <option value="radio">Valintanapit</option>
                          <option value="checkbox">Valintaruudut</option>
                          <option value="scale">Asteikko</option>
                        </select>
                        <label className="flex items-center gap-2 text-white">
                          <input
                            type="checkbox"
                            checked={question.required || false}
                            onChange={(e) => updateQuestion(questionId, 'required', e.target.checked)}
                          />
                          Pakollinen
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Tila</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Aktiivinen</Label>
                <p className="text-sm text-gray-400">Kysely on käytettävissä vastaajille</p>
              </div>
              <CustomSwitch
                checked={formData.is_active}
                onChange={(checked) => updateFormData('is_active', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Oletuskysely</Label>
                <p className="text-sm text-gray-400">Käytetään oletusmallina uusille kyselyille</p>
              </div>
              <CustomSwitch
                checked={formData.is_default}
                onChange={(checked) => updateFormData('is_default', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/surveys')}
            disabled={loading}
          >
            Peruuta
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="min-w-32"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Luodaan...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Luo kysely
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
