'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from '@/app/i18n/navigation'
import { useParams } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Save, Settings, Trash2, Plus } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Spinner } from '@/components/ui/spinner'

interface SurveyTemplate {
  id: string
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
  language: string
  translations: Record<string, {
    name: string
    description: string
    questions: Record<string, any>
  }>
  created_at: string
  updated_at: string
}

// Custom Switch component that works reliably
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

export default function EditSurveyPage() {
  const router = useRouter()
  const params = useParams()
  const { isAdmin } = useAuth()
  const t = useTranslations('Admin.Surveys')
  const tCommon = useTranslations('Common')
  const locale = params.locale as string
  const surveyId = params.id as string

  const [template, setTemplate] = useState<SurveyTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState<string>('fi')
  const [translating, setTranslating] = useState(false)

  // Get content for selected language
  const getCurrentContent = () => {
    if (!template) return null
    
    if (selectedLanguage === template.language) {
      // Return original content
      return {
        name: template.name,
        description: template.description,
        questions: template.questions
      }
    } else {
      // Return translated content
      const translation = template.translations?.[selectedLanguage]
      return translation ? {
        name: translation.name,
        description: translation.description,
        questions: translation.questions
      } : null
    }
  }

  const currentContent = getCurrentContent()

  // Available languages
  const availableLanguages = [
    { code: 'fi', name: 'Suomi', flag: '🇫🇮' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'sv', name: 'Svenska', flag: '🇸🇪' }
  ]

  // AI Translation function
  const translateSurvey = async (targetLanguages: string[]) => {
    if (!template) return

    try {
      setTranslating(true)
      
      const response = await fetch('/api/surveys/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await createClient().auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          templateId: template.id,
          sourceLanguage: selectedLanguage,
          targetLanguages,
          questions: template.questions,
          name: template.name,
          description: template.description
        })
      })

      if (!response.ok) {
        throw new Error('Käännös epäonnistui')
      }

      const result = await response.json()
      console.log('Translation result:', result)
      
      // Update template with translations
      setTemplate(prev => prev ? {
        ...prev,
        translations: {
          ...prev.translations,
          ...result.translations
        }
      } : null)

    } catch (error) {
      console.error('Translation error:', error)
      setError('Käännös epäonnistui: ' + (error instanceof Error ? error.message : 'Tuntematon virhe'))
    } finally {
      setTranslating(false)
    }
  }

  // Redirect if not admin
  if (!isAdmin) {
    router.push('/auth/sign-in')
    return null
  }

  useEffect(() => {
    if (!surveyId) return

    const loadTemplate = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get access token from Supabase client
        const supabase = createClient()
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session?.access_token) {
          throw new Error('Ei voitu hakea valtuutusta')
        }

        const response = await fetch(`/api/surveys/templates?id=${surveyId}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })

        if (!response.ok) {
          throw new Error('Kyselypohjan lataus epäonnistui')
        }

        const data = await response.json()
        setTemplate(data.templates?.[0] || data.template)
      } catch (err) {
        console.error('Error loading template:', err)
        setError(err instanceof Error ? err.message : 'Tuntematon virhe')
      } finally {
        setLoading(false)
      }
    }

    loadTemplate()
  }, [surveyId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!template) return

    if (!template.name.trim()) {
      setError('Kyselyn nimi on pakollinen')
      return
    }

    try {
      setSaving(true)
      setError(null)

      // Get access token from Supabase client
      const supabase = createClient()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session?.access_token) {
        throw new Error('Ei voitu hakea valtuutusta')
      }

      const response = await fetch(`/api/surveys/templates`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          id: template.id,
          ...template
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Kyselyn päivitys epäonnistui')
      }

      router.push(`/admin/surveys/${template.id}`)
    } catch (err) {
      console.error('Error updating survey:', err)
      setError(err instanceof Error ? err.message : 'Tuntematon virhe')
    } finally {
      setSaving(false)
    }
  }

  const updateTemplate = (field: string, value: any) => {
    if (!template) return
    
    setTemplate(prev => {
      if (!prev) return null
      
      if (selectedLanguage === prev.language) {
        // Update original content
        return {
          ...prev,
          [field]: value
        }
      } else {
        // Update translation
        const updatedTranslations = {
          ...prev.translations,
          [selectedLanguage]: {
            ...prev.translations[selectedLanguage],
            [field]: value
          }
        }
        
        return {
          ...prev,
          translations: updatedTranslations
        }
      }
    })
  }

  const updateSettings = (field: string, value: any) => {
    if (!template) return
    console.log('Updating setting:', field, 'to:', value)
    setTemplate(prev => {
      if (!prev) return null
      const newTemplate = {
        ...prev,
        settings: {
          ...(prev.settings || {}),
          [field]: value
        }
      }
      console.log('New template settings:', newTemplate.settings)
      return newTemplate
    })
  }

  const addQuestion = () => {
    if (!template) return
    const questionId = `question_${Date.now()}`
    
    console.log('Adding question, current structure:', template.questions)
    
    setTemplate(prev => {
      if (!prev) return null
      
      // Handle sections structure (complex surveys)
      if (prev.questions?.sections && Array.isArray(prev.questions.sections)) {
        const newQuestions = { ...prev.questions }
        // Add to first section or create a new section
        if (newQuestions.sections.length > 0) {
          newQuestions.sections[0].questions = [
            ...newQuestions.sections[0].questions,
            {
              id: questionId,
              text: '',
              type: 'text',
              required: false
            }
          ]
        } else {
          newQuestions.sections = [{
            id: 'default_section',
            title: 'Kysymykset',
            questions: [{
              id: questionId,
              text: '',
              type: 'text',
              required: false
            }]
          }]
        }
        console.log('Updated sections structure:', newQuestions)
        return { ...prev, questions: newQuestions }
      }
      
      // Handle simple structure or create new structure
      const newQuestions = {
        ...(prev.questions || {}),
        [questionId]: {
          text: '',
          type: 'text',
          required: false
        }
      }
      
      console.log('Updated simple structure:', newQuestions)
      return {
        ...prev,
        questions: newQuestions
      }
    })
  }

  const removeQuestion = (questionId: string) => {
    if (!template) return
    setTemplate(prev => {
      if (!prev) return null
      
      // Handle sections structure
      if (prev.questions.sections && Array.isArray(prev.questions.sections)) {
        const newQuestions = { ...prev.questions }
        newQuestions.sections = newQuestions.sections.map((section: any) => ({
          ...section,
          questions: section.questions.filter((question: any) => question.id !== questionId)
        }))
        return { ...prev, questions: newQuestions }
      }
      
      // Handle simple structure
      const newQuestions = { ...prev.questions }
      delete newQuestions[questionId]
      return {
        ...prev,
        questions: newQuestions
      }
    })
  }

  const updateQuestion = (questionId: string, field: string, value: any) => {
    if (!template) return
    setTemplate(prev => {
      if (!prev) return null
      
      // Handle sections structure
      if (prev.questions.sections && Array.isArray(prev.questions.sections)) {
        const newQuestions = { ...prev.questions }
        newQuestions.sections = newQuestions.sections.map((section: any) => ({
          ...section,
          questions: section.questions.map((question: any) => 
            question.id === questionId 
              ? { ...question, [field]: value }
              : question
          )
        }))
        return { ...prev, questions: newQuestions }
      }
      
      // Handle simple structure
      if (prev.questions[questionId]) {
        return {
          ...prev,
          questions: {
            ...prev.questions,
            [questionId]: {
              ...prev.questions[questionId],
              [field]: value
            }
          }
        }
      }
      
      return prev
    })
  }

  const handleDelete = async () => {
    if (!template || !confirm('Haluatko varmasti poistaa tämän kyselyn? Tätä toimintoa ei voi peruuttaa.')) {
      return
    }

    try {
      setSaving(true)
      
      // Get access token from Supabase client
      const supabase = createClient()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session?.access_token) {
        throw new Error('Ei voitu hakea valtuutusta')
      }

      const response = await fetch(`/api/surveys/templates?id=${template.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Kyselyn poistaminen epäonnistui')
      }

      router.push('/admin/surveys')
    } catch (err) {
      console.error('Error deleting survey:', err)
      setError(err instanceof Error ? err.message : 'Tuntematon virhe')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground">Ladataan kyselyä...</p>
        </div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            Kyselyä ei löytynyt tai sinulla ei ole oikeuksia sen muokkaamiseen.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/${locale}/admin/surveys/${template.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Takaisin kyselyyn
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Muokkaa kyselyä</h1>
            <p className="text-gray-400">{template.name}</p>
          </div>
        </div>

        {/* Language Selection and Translation */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Muokkauskieli:</label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md text-sm"
            >
              {availableLanguages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const targetLanguages = availableLanguages
                .filter(lang => lang.code !== selectedLanguage)
                .map(lang => lang.code)
              translateSurvey(targetLanguages)
            }}
            disabled={translating}
            className="text-sm"
          >
            {translating ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Käännetään...
              </div>
            ) : (
              '🤖 Käännä AI:lla'
            )}
          </Button>
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
              <Label htmlFor="name" className="text-white">Kyselyn nimi * ({selectedLanguage.toUpperCase()})</Label>
              <Input
                id="name"
                value={currentContent?.name || ''}
                onChange={(e) => updateTemplate('name', e.target.value)}
                placeholder="Esim. Asiakastyytyväisyyskysely Q1 2025"
                required
              />
              {selectedLanguage !== template?.language && (
                <p className="text-xs text-yellow-400 mt-1">
                  Muokkaat käännöstä. Alkuperäinen ({template?.language}): "{template?.name}"
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description" className="text-white">Kuvaus ({selectedLanguage.toUpperCase()})</Label>
              <Textarea
                id="description"
                value={currentContent?.description || ''}
                onChange={(e) => updateTemplate('description', e.target.value)}
                placeholder="Lyhyt kuvaus kyselystä ja sen tarkoituksesta"
                rows={3}
              />
              {selectedLanguage !== template?.language && template?.description && (
                <p className="text-xs text-yellow-400 mt-1">
                  Alkuperäinen ({template?.language}): "{template?.description}"
                </p>
              )}
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
            
            {(() => {
              // Check if content exists for selected language
              if (!currentContent?.questions) return true; // Show "no questions" message
              
              // Check sections structure
              if (currentContent.questions.sections && Array.isArray(currentContent.questions.sections)) {
                return currentContent.questions.sections.length === 0;
              }
              
              // Check simple structure (excluding metadata fields)
              const questionKeys = Object.keys(currentContent.questions).filter(key => 
                !['title', 'introduction', 'sections'].includes(key)
              );
              return questionKeys.length === 0;
            })() ? (
              <div className="text-center py-8 text-gray-400">
                <p>Ei kysymyksiä vielä lisätty</p>
                <p className="text-sm">Klikkaa "Lisää kysymys" aloittaaksesi</p>
              </div>
            ) : (
              <div className="space-y-6">
                {currentContent?.questions.sections && Array.isArray(currentContent.questions.sections) ? (
                  // Existing complex structure with sections
                  currentContent.questions.sections.map((section: any, sectionIndex: number) => (
                    <div key={section.id || sectionIndex} className="border rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-4 text-white">
                        {section.title}
                      </h3>
                      <div className="space-y-4">
                        {section.questions?.map((question: any, questionIndex: number) => (
                          <div key={question.id || questionIndex} className="border-l-4 border-blue-500 pl-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-white">{question.text}</h4>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => removeQuestion(question.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="space-y-2">
                              <Input
                                placeholder="Kysymyksen teksti"
                                value={question.text || ''}
                                onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                              />
                              <div className="flex gap-2">
                                <select
                                  className="px-3 py-2 border rounded-md bg-white text-black"
                                  value={question.type || 'text'}
                                  onChange={(e) => updateQuestion(question.id, 'type', e.target.value)}
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
                                    onChange={(e) => updateQuestion(question.id, 'required', e.target.checked)}
                                  />
                                  Pakollinen
                                </label>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  // Simple structure without sections - filter out metadata
                  Object.entries(currentContent?.questions || {})
                    .filter(([key]) => !['title', 'introduction', 'sections'].includes(key))
                    .map(([questionId, question]) => (
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
                  ))
                )}
              </div>
            )}
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
                checked={template.settings?.allow_anonymous ?? true}
                onChange={(checked) => {
                  console.log('Switch clicked: allow_anonymous', checked)
                  updateSettings('allow_anonymous', checked)
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Salli useita vastauksia</Label>
                <p className="text-sm text-gray-400">Sama käyttäjä voi vastata useita kertoja</p>
              </div>
              <CustomSwitch
                checked={template.settings?.allow_multiple_responses ?? false}
                onChange={(checked) => updateSettings('allow_multiple_responses', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Näytä edistymispalkki</Label>
                <p className="text-sm text-gray-400">Näyttää vastaajan edistymisen kyselyssä</p>
              </div>
              <CustomSwitch
                checked={template.settings?.show_progress ?? true}
                onChange={(checked) => updateSettings('show_progress', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Vaadi kirjautuminen</Label>
                <p className="text-sm text-gray-400">Vain kirjautuneet käyttäjät voivat vastata</p>
              </div>
              <CustomSwitch
                checked={template.settings?.require_login ?? false}
                onChange={(checked) => updateSettings('require_login', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Tallenna osittaiset vastaukset</Label>
                <p className="text-sm text-gray-400">Tallentaa vastaukset automaattisesti kesken kyselyn</p>
              </div>
              <CustomSwitch
                checked={template.settings?.save_partial ?? true}
                onChange={(checked) => updateSettings('save_partial', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Näytä kysymysnumerot</Label>
                <p className="text-sm text-gray-400">Näyttää kysymysten numerot (1/10, 2/10 jne.)</p>
              </div>
              <CustomSwitch
                checked={template.settings?.show_question_numbers ?? false}
                onChange={(checked) => updateSettings('show_question_numbers', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Sekoita kysymysten järjestys</Label>
                <p className="text-sm text-gray-400">Näyttää kysymykset satunnaisessa järjestyksessä</p>
              </div>
              <CustomSwitch
                checked={template.settings?.randomize_questions ?? false}
                onChange={(checked) => updateSettings('randomize_questions', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Pakollinen sähköpostivahvistus</Label>
                <p className="text-sm text-gray-400">Vaatii sähköpostin vahvistamisen ennen vastaamista</p>
              </div>
              <CustomSwitch
                checked={template.settings?.require_email_verification ?? false}
                onChange={(checked) => updateSettings('require_email_verification', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Kyselyn voimassaoloaika</Label>
              <p className="text-sm text-gray-400">Aseta päivämäärä jolloin kysely sulkeutuu automaattisesti</p>
              <Input
                type="datetime-local"
                value={template.settings?.expires_at ? new Date(template.settings.expires_at).toISOString().slice(0, 16) : ''}
                onChange={(e) => updateSettings('expires_at', e.target.value ? new Date(e.target.value).toISOString() : null)}
                className="bg-gray-800 text-white border-gray-600"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Maksimi vastausaika (minuuttia)</Label>
              <p className="text-sm text-gray-400">Rajoittaa vastaamiseen käytettävän ajan</p>
              <Input
                type="number"
                min="1"
                max="120"
                value={template.settings?.max_response_time || ''}
                onChange={(e) => updateSettings('max_response_time', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Esim. 30"
                className="bg-gray-800 text-white border-gray-600"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Kiitosviesti</Label>
              <p className="text-sm text-gray-400">Näytetään kyselyn valmistumisen jälkeen</p>
              <Textarea
                value={template.settings?.completion_message || ''}
                onChange={(e) => updateSettings('completion_message', e.target.value)}
                placeholder="Kiitos vastauksistasi! Palautteesi on meille tärkeää."
                rows={3}
                className="bg-gray-800 text-white border-gray-600"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Uudelleenohjaus valmistumisen jälkeen</Label>
              <p className="text-sm text-gray-400">URL-osoite johon käyttäjä ohjataan kyselyn jälkeen</p>
              <Input
                type="url"
                value={template.settings?.redirect_url || ''}
                onChange={(e) => updateSettings('redirect_url', e.target.value)}
                placeholder="https://example.com/kiitos"
                className="bg-gray-800 text-white border-gray-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Näytä edellinen-painike</Label>
                <p className="text-sm text-gray-400">Sallii palaamisen edelliseen kysymykseen</p>
              </div>
              <CustomSwitch
                checked={template.settings?.show_previous_button ?? true}
                onChange={(checked) => updateSettings('show_previous_button', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Automaattinen tallennus</Label>
                <p className="text-sm text-gray-400">Tallentaa vastaukset automaattisesti 30 sekunnin välein</p>
              </div>
              <CustomSwitch
                checked={template.settings?.auto_save ?? true}
                onChange={(checked) => updateSettings('auto_save', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Kyselyn teema</Label>
              <p className="text-sm text-gray-400">Valitse kyselyn visuaalinen teema</p>
              <select
                className="w-full px-3 py-2 border rounded-md bg-gray-800 text-white border-gray-600"
                value={template.settings?.theme || 'default'}
                onChange={(e) => updateSettings('theme', e.target.value)}
              >
                <option value="default">Oletus</option>
                <option value="minimal">Minimalistinen</option>
                <option value="corporate">Yritys</option>
                <option value="friendly">Ystävällinen</option>
                <option value="professional">Ammattimainen</option>
              </select>
            </div>
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
                checked={template.is_active}
                onChange={(checked) => updateTemplate('is_active', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Oletuskysely</Label>
                <p className="text-sm text-gray-400">Käytetään oletusmallina uusille kyselyille</p>
              </div>
              <CustomSwitch
                checked={template.is_default}
                onChange={(checked) => updateTemplate('is_default', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={saving}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Poista kysely
          </Button>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/admin/surveys/${template.id}`)}
              disabled={saving}
            >
              Peruuta
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="min-w-32"
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Tallennetaan...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Tallenna muutokset
                </div>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
