'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/components/auth/AuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { 
  Plus,
  Edit3,
  Trash2,
  Play,
  Pause,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  Save,
  X
} from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'

interface SurveyTrigger {
  id: string
  name: string
  description: string
  trigger_type: 'manual' | 'scheduled' | 'event_based'
  trigger_event: string | null
  schedule_expression: string | null
  template_id: string
  segment_id: string | null
  email_template_id: string | null
  is_active: boolean
  send_delay_hours: number
  priority: number
  max_sends_per_user: number
  conditions: Record<string, any>
  created_at: string
  updated_at: string
  template_name?: string
  segment_name?: string
  email_template_name?: string
}

interface TriggerFormData {
  name: string
  description: string
  trigger_type: 'manual' | 'scheduled' | 'event_based'
  trigger_event: string
  schedule_expression: string
  template_id: string
  segment_id: string
  email_template_id: string
  send_delay_hours: number
  priority: number
  max_sends_per_user: number
  conditions: string
}

interface AutomationTriggerManagerProps {
  onUpdate?: () => void
}

export function AutomationTriggerManager({ onUpdate }: AutomationTriggerManagerProps) {
  const t = useTranslations('Admin.SurveyAutomation.Triggers')
  const { session, isAdmin } = useAuth()
  const [triggers, setTriggers] = useState<SurveyTrigger[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState<TriggerFormData>({
    name: '',
    description: '',
    trigger_type: 'manual',
    trigger_event: '',
    schedule_expression: '',
    template_id: '',
    segment_id: '',
    email_template_id: '',
    send_delay_hours: 0,
    priority: 5,
    max_sends_per_user: 1,
    conditions: '{}'
  })

  // Dropdown options (these should come from API in real implementation)
  const [surveyTemplates, setSurveyTemplates] = useState<Array<{id: string, name: string}>>([])
  const [segments, setSegments] = useState<Array<{id: string, name: string}>>([])
  const [emailTemplates, setEmailTemplates] = useState<Array<{id: string, name: string}>>([])

  const fetchTriggers = useCallback(async () => {
    if (!session?.access_token || !isAdmin) return

    try {
      setError(null)
      const response = await fetch('/api/admin/survey-automation/triggers', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Triggereiden lataus epäonnistui')
      }

      const data = await response.json()
      setTriggers(data.triggers || [])
    } catch (err) {
      console.error('Error fetching triggers:', err)
      setError(err instanceof Error ? err.message : 'Tuntematon virhe')
    } finally {
      setLoading(false)
    }
  }, [session?.access_token, isAdmin])

  const fetchFormOptions = useCallback(async () => {
    if (!session?.access_token || !isAdmin) return

    try {
      // Fetch survey templates, segments, and email templates
      const [templatesResponse, segmentsResponse, emailTemplatesResponse] = await Promise.all([
        fetch('/api/surveys/templates', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        }),
        fetch('/api/admin/survey-automation/segments', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        }),
        fetch('/api/admin/email-templates?type=survey', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
      ])

      if (templatesResponse.ok) {
        const templatesData = await templatesResponse.json()
        setSurveyTemplates(templatesData.templates?.map((t: any) => ({ id: t.id, name: t.name })) || [])
      }

      if (segmentsResponse.ok) {
        const segmentsData = await segmentsResponse.json()
        setSegments(segmentsData.segments?.map((s: any) => ({ id: s.id, name: s.name })) || [])
      }

      if (emailTemplatesResponse.ok) {
        const emailData = await emailTemplatesResponse.json()
        setEmailTemplates(emailData.templates?.map((e: any) => ({ id: e.id, name: e.name })) || [])
      }
    } catch (err) {
      console.error('Error fetching form options:', err)
    }
  }, [session?.access_token, isAdmin])

  useEffect(() => {
    if (session?.access_token && isAdmin) {
      fetchTriggers()
      fetchFormOptions()
    }
  }, [session?.access_token, isAdmin, fetchTriggers, fetchFormOptions])

  const handleCreate = () => {
    setIsCreating(true)
    setEditingId(null)
    setFormData({
      name: '',
      description: '',
      trigger_type: 'manual',
      trigger_event: '',
      schedule_expression: '',
      template_id: '',
      segment_id: '',
      email_template_id: '',
      send_delay_hours: 0,
      priority: 5,
      max_sends_per_user: 1,
      conditions: '{}'
    })
  }

  const handleEdit = (trigger: SurveyTrigger) => {
    setEditingId(trigger.id)
    setIsCreating(false)
    setFormData({
      name: trigger.name,
      description: trigger.description,
      trigger_type: trigger.trigger_type,
      trigger_event: trigger.trigger_event || '',
      schedule_expression: trigger.schedule_expression || '',
      template_id: trigger.template_id,
      segment_id: trigger.segment_id || '',
      email_template_id: trigger.email_template_id || '',
      send_delay_hours: trigger.send_delay_hours,
      priority: trigger.priority,
      max_sends_per_user: trigger.max_sends_per_user,
      conditions: JSON.stringify(trigger.conditions, null, 2)
    })
  }

  const handleCancel = () => {
    setIsCreating(false)
    setEditingId(null)
  }

  const handleSave = async () => {
    if (!session?.access_token || !isAdmin) return

    try {
      setError(null)
      
      // Validate required fields
      if (!formData.name.trim() || !formData.template_id) {
        throw new Error('Nimi ja kyselypohja ovat pakollisia')
      }

      // Parse conditions JSON
      let conditions = {}
      try {
        conditions = JSON.parse(formData.conditions)
      } catch {
        throw new Error('Ehdot eivät ole kelvollista JSON-muotoa')
      }

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        trigger_type: formData.trigger_type,
        trigger_event: formData.trigger_event || null,
        schedule_expression: formData.schedule_expression || null,
        template_id: formData.template_id,
        segment_id: formData.segment_id || null,
        email_template_id: formData.email_template_id || null,
        send_delay_hours: formData.send_delay_hours,
        priority: formData.priority,
        max_sends_per_user: formData.max_sends_per_user,
        conditions
      }

      const url = isCreating 
        ? '/api/admin/survey-automation/triggers'
        : `/api/admin/survey-automation/triggers?id=${editingId}`

      const response = await fetch(url, {
        method: isCreating ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Tallentaminen epäonnistui')
      }

      await fetchTriggers()
      onUpdate?.()
      handleCancel()
    } catch (err) {
      console.error('Error saving trigger:', err)
      setError(err instanceof Error ? err.message : 'Tallentaminen epäonnistui')
    }
  }

  const handleToggleActive = async (triggerId: string, isActive: boolean) => {
    if (!session?.access_token || !isAdmin) return

    try {
      const response = await fetch(`/api/admin/survey-automation/triggers?id=${triggerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ is_active: !isActive })
      })

      if (!response.ok) {
        throw new Error('Tilan muutos epäonnistui')
      }

      await fetchTriggers()
      onUpdate?.()
    } catch (err) {
      console.error('Error toggling trigger:', err)
      setError(err instanceof Error ? err.message : 'Tilan muutos epäonnistui')
    }
  }

  const handleDelete = async (triggerId: string, triggerName: string) => {
    if (!confirm(`Haluatko varmasti poistaa triggerin "${triggerName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/survey-automation/triggers?id=${triggerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Poistaminen epäonnistui')
      }

      await fetchTriggers()
      onUpdate?.()
    } catch (err) {
      console.error('Error deleting trigger:', err)
      setError(err instanceof Error ? err.message : 'Poistaminen epäonnistui')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Spinner className="mr-2" />
          <span>Ladataan triggereita...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Automaatiotriggerit</h2>
          <p className="text-gray-600">Hallitse automaattisia kyselykutsuja</p>
        </div>
        <Button onClick={handleCreate} disabled={isCreating || editingId !== null}>
          <Plus className="w-4 h-4 mr-2" />
          Uusi triggeri
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {isCreating ? 'Luo uusi triggeri' : 'Muokkaa triggeriä'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nimi *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Triggerin nimi"
                />
              </div>

              <div>
                <Label htmlFor="trigger_type">Tyyppi</Label>
                <Select
                  value={formData.trigger_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, trigger_type: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manuaalinen</SelectItem>
                    <SelectItem value="scheduled">Ajastettu</SelectItem>
                    <SelectItem value="event_based">Tapahtumaperusteinen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="template_id">Kyselypohja *</Label>
                <Select
                  value={formData.template_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, template_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Valitse kyselypohja" />
                  </SelectTrigger>
                  <SelectContent>
                    {surveyTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="email_template_id">Sähköpostimalli</Label>
                <Select
                  value={formData.email_template_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, email_template_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Valitse sähköpostimalli" />
                  </SelectTrigger>
                  <SelectContent>
                    {emailTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="segment_id">Asiakasryhmä</Label>
                <Select
                  value={formData.segment_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, segment_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Valitse asiakasryhmä" />
                  </SelectTrigger>
                  <SelectContent>
                    {segments.map((segment) => (
                      <SelectItem key={segment.id} value={segment.id}>
                        {segment.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="send_delay_hours">Lähetyksen viive (tuntia)</Label>
                <Input
                  id="send_delay_hours"
                  type="number"
                  min="0"
                  value={formData.send_delay_hours}
                  onChange={(e) => setFormData(prev => ({ ...prev, send_delay_hours: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div>
                <Label htmlFor="priority">Prioriteetti (1-10)</Label>
                <Input
                  id="priority"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 5 }))}
                />
              </div>

              <div>
                <Label htmlFor="max_sends_per_user">Max lähetyksiä per käyttäjä</Label>
                <Input
                  id="max_sends_per_user"
                  type="number"
                  min="1"
                  value={formData.max_sends_per_user}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_sends_per_user: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>

            {formData.trigger_type === 'event_based' && (
              <div>
                <Label htmlFor="trigger_event">Tapahtuma</Label>
                <Input
                  id="trigger_event"
                  value={formData.trigger_event}
                  onChange={(e) => setFormData(prev => ({ ...prev, trigger_event: e.target.value }))}
                  placeholder="esim. user_registered, subscription_created"
                />
              </div>
            )}

            {formData.trigger_type === 'scheduled' && (
              <div>
                <Label htmlFor="schedule_expression">Cron-lauseke</Label>
                <Input
                  id="schedule_expression"
                  value={formData.schedule_expression}
                  onChange={(e) => setFormData(prev => ({ ...prev, schedule_expression: e.target.value }))}
                  placeholder="esim. 0 9 * * 1 (joka maanantai klo 9)"
                />
              </div>
            )}

            <div>
              <Label htmlFor="description">Kuvaus</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Triggerin kuvaus"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="conditions">Ehdot (JSON)</Label>
              <Textarea
                id="conditions"
                value={formData.conditions}
                onChange={(e) => setFormData(prev => ({ ...prev, conditions: e.target.value }))}
                placeholder='{"customer_type": "premium", "last_survey_days_ago": 30}'
                rows={4}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Tallenna
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Peruuta
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Triggers List */}
      <div className="space-y-4">
        {triggers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Settings className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Ei triggereita
              </h3>
              <p className="text-gray-600 mb-6">
                Luo ensimmäinen automaattitriggeri aloittaaksesi kyselyiden automatisoinnin.
              </p>
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Luo triggeri
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {triggers.map((trigger) => (
              <Card key={trigger.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg">{trigger.name}</CardTitle>
                        <div className="flex gap-2">
                          <Badge variant={trigger.is_active ? "default" : "secondary"}>
                            {trigger.is_active ? "Aktiivinen" : "Ei aktiivinen"}
                          </Badge>
                          <Badge variant="outline">
                            {trigger.trigger_type === 'manual' ? 'Manuaalinen' :
                             trigger.trigger_type === 'scheduled' ? 'Ajastettu' : 'Tapahtumaperusteinen'}
                          </Badge>
                        </div>
                      </div>
                      <CardDescription>
                        {trigger.description || "Ei kuvausta"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-600">Kyselypohja</div>
                      <div className="font-medium">{trigger.template_name || trigger.template_id}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Prioriteetti</div>
                      <div className="font-medium">{trigger.priority}/10</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Viive</div>
                      <div className="font-medium">{trigger.send_delay_hours}h</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Max lähetyksiä</div>
                      <div className="font-medium">{trigger.max_sends_per_user}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(trigger)}
                      disabled={editingId !== null || isCreating}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Muokkaa
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(trigger.id, trigger.is_active)}
                    >
                      {trigger.is_active ? (
                        <>
                          <Pause className="w-4 h-4 mr-2" />
                          Deaktivoi
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Aktivoi
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(trigger.id, trigger.name)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Poista
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
