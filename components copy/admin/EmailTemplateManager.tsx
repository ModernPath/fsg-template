'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'

interface EmailTemplate {
  id: string
  name: string
  type: string
  subject: string
  body: string
  variables: Record<string, any>
  language: string
  master_template_id?: string
  is_active: boolean
  is_default: boolean
  description?: string
  created_at: string
  updated_at: string
  language_versions?: EmailTemplate[]
}

interface EmailTemplateManagerProps {
  initialTemplates: EmailTemplate[]
  user: User
}

export default function EmailTemplateManager({ initialTemplates, user }: EmailTemplateManagerProps) {
  const [templates, setTemplates] = useState(initialTemplates)
  const [isTranslating, setIsTranslating] = useState(false)
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      welcome: 'bg-green-100 text-green-800',
      document_upload: 'bg-blue-100 text-blue-800',
      custom: 'bg-purple-100 text-purple-800',
      funding_options: 'bg-orange-100 text-orange-800',
      progress_update: 'bg-yellow-100 text-yellow-800',
      notification: 'bg-red-100 text-red-800',
      detailed: 'bg-gray-100 text-gray-800',
      marketing: 'bg-pink-100 text-pink-800',
      booking: 'bg-indigo-100 text-indigo-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const getLanguageFlag = (lang: string) => {
    const flags: Record<string, string> = {
      fi: '🇫🇮',
      en: '🇬🇧',
      sv: '🇸🇪',
      de: '🇩🇪',
      fr: '🇫🇷',
      es: '🇪🇸',
      no: '🇳🇴',
      da: '🇩🇰'
    }
    return flags[lang] || '🌐'
  }

  const handleTranslateAll = async () => {
    setIsTranslating(true)
    try {
      const supabase = createClient()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session?.access_token) {
        throw new Error('No valid session found')
      }
      
      const response = await fetch('/api/admin/email-templates/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          auto_translate_all: true,
          target_languages: ['en', 'sv']
        })
      })

      if (!response.ok) {
        throw new Error('Translation failed')
      }

      const result = await response.json()
      console.log('Translation result:', result)
      
      // Refresh the page to show updated templates
      window.location.reload()
      
    } catch (error) {
      console.error('Translation error:', error)
      alert('Translation failed. Please try again.')
    } finally {
      setIsTranslating(false)
    }
  }

  const templateTypes = [...new Set(templates.map(t => t.type))]
  const totalLanguageVersions = templates.reduce((acc, t) => acc + (t.language_versions?.length || 0), 0)

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{templates.length}</div>
            <p className="text-sm text-gray-600">Master Templates</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{totalLanguageVersions}</div>
            <p className="text-sm text-gray-600">Language Versions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{templateTypes.length}</div>
            <p className="text-sm text-gray-600">Template Types</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Button 
              onClick={handleTranslateAll}
              disabled={isTranslating}
              className="w-full"
              variant="outline"
            >
              {isTranslating ? (
                <>🔄 Translating...</>
              ) : (
                <>🌐 Auto-Translate All</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Template Types Overview */}
      <Card>
        <CardHeader>
          <CardTitle>📧 Template Types</CardTitle>
          <CardDescription>
            Overview of all email template categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {templateTypes.map(type => {
              const count = templates.filter(t => t.type === type).length
              return (
                <Badge key={type} className={getTypeColor(type)}>
                  {type} ({count})
                </Badge>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Templates List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">📝 Master Templates</h2>
        {templates.map(template => (
          <Card key={template.id} className="border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <Badge className={getTypeColor(template.type)}>
                    {template.type}
                  </Badge>
                  <Badge variant="outline">
                    {getLanguageFlag(template.language)} {template.language.toUpperCase()}
                  </Badge>
                  {template.is_default && (
                    <Badge variant="default">DEFAULT</Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedTemplate(
                    expandedTemplate === template.id ? null : template.id
                  )}
                >
                  {expandedTemplate === template.id ? 'Collapse' : 'Expand'}
                </Button>
              </div>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            
            {expandedTemplate === template.id && (
              <CardContent className="space-y-4">
                {/* Subject */}
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-1">Subject:</h4>
                  <p className="text-sm bg-gray-50 p-2 rounded">{template.subject}</p>
                </div>

                {/* Variables */}
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-1">Variables:</h4>
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(template.variables || {}).map(variable => (
                      <Badge key={variable} variant="secondary" className="text-xs">
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Language Versions */}
                {template.language_versions && template.language_versions.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">
                      Language Versions ({template.language_versions.length}):
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {template.language_versions.map(version => (
                        <div key={version.id} className="bg-gray-50 p-3 rounded border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">
                              {getLanguageFlag(version.language)} {version.language.toUpperCase()}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              v{version.updated_at ? 'Updated' : 'Created'}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 truncate">{version.subject}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Body Preview */}
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-1">Body Preview:</h4>
                  <div className="bg-gray-50 p-3 rounded text-xs max-h-32 overflow-y-auto">
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: template.body.substring(0, 300) + '...' 
                      }} 
                    />
                  </div>
                </div>

                {/* Metadata */}
                <div className="text-xs text-gray-500 border-t pt-2">
                  <p>Created: {new Date(template.created_at).toLocaleDateString()}</p>
                  <p>Updated: {new Date(template.updated_at).toLocaleDateString()}</p>
                  <p>ID: {template.id}</p>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">🔧 Usage Instructions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700 space-y-2">
          <p><strong>Auto-Translation:</strong> Click "Auto-Translate All" to generate English and Swedish versions of all Finnish master templates.</p>
          <p><strong>Template Usage:</strong> Use template types in your code (e.g., 'welcome', 'custom', 'notification').</p>
          <p><strong>Language Fallback:</strong> If a requested language version doesn't exist, the system automatically falls back to Finnish.</p>
          <p><strong>AI Translation:</strong> Translations are generated using Google Gemini AI with context-aware financial terminology.</p>
        </CardContent>
      </Card>
    </div>
  )
} 