'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/components/auth/AuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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

import { 
  Plus,
  Edit3,
  Trash2,
  Users,
  Target,
  Filter,
  AlertCircle,
  Save,
  X,
  Code,
  Eye
} from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'

interface SurveySegment {
  id: string
  name: string
  description: string
  conditions: Record<string, any>
  is_active: boolean
  estimated_size: number
  created_at: string
  updated_at: string
}

interface SegmentFormData {
  name: string
  description: string
  conditions: string
  is_active: boolean
}

interface SegmentManagerProps {
  onUpdate?: () => void
}

export function SegmentManager({ onUpdate }: SegmentManagerProps) {
  const t = useTranslations('Admin.SurveyAutomation.Segments')
  const { session, isAdmin } = useAuth()
  const [segments, setSegments] = useState<SurveySegment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<{count: number, preview: Array<{email: string, name?: string}>} | null>(null)
  const [formData, setFormData] = useState<SegmentFormData>({
    name: '',
    description: '',
    conditions: '{}',
    is_active: true
  })

  const fetchSegments = useCallback(async () => {
    if (!session?.access_token || !isAdmin) return

    try {
      setError(null)
      const response = await fetch('/api/admin/survey-automation/segments', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Asiakasryhmien lataus epäonnistui')
      }

      const data = await response.json()
      setSegments(data.segments || [])
    } catch (err) {
      console.error('Error fetching segments:', err)
      setError(err instanceof Error ? err.message : 'Tuntematon virhe')
    } finally {
      setLoading(false)
    }
  }, [session?.access_token, isAdmin])

  useEffect(() => {
    if (session?.access_token && isAdmin) {
      fetchSegments()
    }
  }, [session?.access_token, isAdmin, fetchSegments])

  const handleCreate = () => {
    setIsCreating(true)
    setEditingId(null)
    setFormData({
      name: '',
      description: '',
      conditions: JSON.stringify({
        customer_type: "premium",
        last_login_days_ago: 30,
        survey_participation: "active"
      }, null, 2),
      is_active: true
    })
  }

  const handleEdit = (segment: SurveySegment) => {
    setEditingId(segment.id)
    setIsCreating(false)
    setFormData({
      name: segment.name,
      description: segment.description,
      conditions: JSON.stringify(segment.conditions, null, 2),
      is_active: segment.is_active
    })
  }

  const handleCancel = () => {
    setIsCreating(false)
    setEditingId(null)
    setTestResults(null)
  }

  const handleSave = async () => {
    if (!session?.access_token || !isAdmin) return

    try {
      setError(null)
      
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('Nimi on pakollinen')
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
        conditions,
        is_active: formData.is_active
      }

      const url = isCreating 
        ? '/api/admin/survey-automation/segments'
        : `/api/admin/survey-automation/segments?id=${editingId}`

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

      await fetchSegments()
      onUpdate?.()
      handleCancel()
    } catch (err) {
      console.error('Error saving segment:', err)
      setError(err instanceof Error ? err.message : 'Tallentaminen epäonnistui')
    }
  }

  const handleTest = async (segmentId?: string) => {
    if (!session?.access_token || !isAdmin) return

    const targetId = segmentId || editingId
    let conditions = {}

    try {
      if (segmentId) {
        // Testing existing segment
        const segment = segments.find(s => s.id === segmentId)
        if (!segment) return
        conditions = segment.conditions
      } else {
        // Testing current form data
        conditions = JSON.parse(formData.conditions)
      }

      setTestingId(targetId || 'form')
      setTestResults(null)

      const response = await fetch('/api/admin/survey-automation/segments/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ conditions })
      })

      if (!response.ok) {
        throw new Error('Testin suoritus epäonnistui')
      }

      const data = await response.json()
      setTestResults(data)
    } catch (err) {
      console.error('Error testing segment:', err)
      setError(err instanceof Error ? err.message : 'Testin suoritus epäonnistui')
    } finally {
      setTestingId(null)
    }
  }

  const handleToggleActive = async (segmentId: string, isActive: boolean) => {
    if (!session?.access_token || !isAdmin) return

    try {
      const response = await fetch(`/api/admin/survey-automation/segments?id=${segmentId}`, {
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

      await fetchSegments()
      onUpdate?.()
    } catch (err) {
      console.error('Error toggling segment:', err)
      setError(err instanceof Error ? err.message : 'Tilan muutos epäonnistui')
    }
  }

  const handleDelete = async (segmentId: string, segmentName: string) => {
    if (!confirm(`Haluatko varmasti poistaa asiakasryhmän "${segmentName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/survey-automation/segments?id=${segmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Poistaminen epäonnistui')
      }

      await fetchSegments()
      onUpdate?.()
    } catch (err) {
      console.error('Error deleting segment:', err)
      setError(err instanceof Error ? err.message : 'Poistaminen epäonnistui')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Spinner className="mr-2" />
          <span>Ladataan asiakasryhmiä...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Asiakasryhmät</h2>
          <p className="text-gray-600">Hallitse kohdennettuja asiakasryhmiä automaatiota varten</p>
        </div>
        <Button onClick={handleCreate} disabled={isCreating || editingId !== null}>
          <Plus className="w-4 h-4 mr-2" />
          Uusi asiakasryhmä
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
              {isCreating ? 'Luo uusi asiakasryhmä' : 'Muokkaa asiakasryhmää'}
            </CardTitle>
            <CardDescription>
              Määritä ehdot jotka määrittävät kuka kuuluu tähän asiakasryhmään
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nimi *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Asiakasryhmän nimi"
                />
              </div>

              <div className="flex items-center space-x-2">
                <CustomSwitch
                  checked={formData.is_active}
                  onChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Aktiivinen</Label>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Kuvaus</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Asiakasryhmän kuvaus"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="conditions">Ehdot (JSON) *</Label>
              <Textarea
                id="conditions"
                value={formData.conditions}
                onChange={(e) => setFormData(prev => ({ ...prev, conditions: e.target.value }))}
                placeholder='{"customer_type": "premium", "last_login_days_ago": 30}'
                rows={8}
                className="font-mono text-sm"
              />
              <div className="text-xs text-gray-500 mt-1">
                Käytettävissä olevat kentät: customer_type, last_login_days_ago, survey_participation, subscription_status, registration_date, total_purchases
              </div>
            </div>

            {/* Test Results */}
            {testResults && (
              <div className="border rounded-lg p-4 bg-blue-50">
                <h4 className="font-medium text-blue-900 mb-2">Testin tulokset</h4>
                <div className="text-blue-800">
                  <p className="mb-2">Löydettiin <strong>{testResults.count}</strong> käyttäjää jotka täyttävät ehdot.</p>
                  {testResults.preview.length > 0 && (
                    <div>
                      <p className="mb-2">Esimerkkejä käyttäjistä:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {testResults.preview.map((user, index) => (
                          <li key={index} className="text-sm">
                            {user.email} {user.name && `(${user.name})`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Tallenna
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleTest()}
                disabled={testingId === 'form'}
              >
                {testingId === 'form' ? (
                  <Spinner className="w-4 h-4 mr-2" />
                ) : (
                  <Target className="w-4 h-4 mr-2" />
                )}
                Testaa ehdot
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Peruuta
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Segments List */}
      <div className="space-y-4">
        {segments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Ei asiakasryhmiä
              </h3>
              <p className="text-gray-600 mb-6">
                Luo ensimmäinen asiakasryhmä kohdentaaksesi automaatiota tietyille käyttäjille.
              </p>
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Luo asiakasryhmä
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {segments.map((segment) => (
              <Card key={segment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg">{segment.name}</CardTitle>
                        <div className="flex gap-2">
                          <Badge variant={segment.is_active ? "default" : "secondary"}>
                            {segment.is_active ? "Aktiivinen" : "Ei aktiivinen"}
                          </Badge>
                          <Badge variant="outline">
                            ~{segment.estimated_size} käyttäjää
                          </Badge>
                        </div>
                      </div>
                      <CardDescription>
                        {segment.description || "Ei kuvausta"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Conditions Preview */}
                  <div className="mb-4">
                    <div className="text-sm text-gray-600 mb-2">Ehdot:</div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap">
                        {JSON.stringify(segment.conditions, null, 2)}
                      </pre>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(segment)}
                      disabled={editingId !== null || isCreating}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Muokkaa
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTest(segment.id)}
                      disabled={testingId === segment.id}
                    >
                      {testingId === segment.id ? (
                        <Spinner className="w-4 h-4 mr-2" />
                      ) : (
                        <Target className="w-4 h-4 mr-2" />
                      )}
                      Testaa
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(segment.id, segment.is_active)}
                    >
                      {segment.is_active ? "Deaktivoi" : "Aktivoi"}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(segment.id, segment.name)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Poista
                    </Button>
                  </div>

                  <div className="text-xs text-gray-500 mt-2">
                    Luotu: {new Date(segment.created_at).toLocaleDateString('fi-FI')} | 
                    Päivitetty: {new Date(segment.updated_at).toLocaleDateString('fi-FI')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Ehtojen määrittäminen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">
              Asiakasryhmien ehdot määritetään JSON-muodossa. Käytettävissä olevat kentät:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Perustiedot</h4>
                <ul className="space-y-1 text-gray-600">
                  <li><code>customer_type</code>: "premium", "standard", "trial"</li>
                  <li><code>subscription_status</code>: "active", "cancelled", "expired"</li>
                  <li><code>registration_date</code>: "2024-01-01" (YYYY-MM-DD)</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Aktiivisuus</h4>
                <ul className="space-y-1 text-gray-600">
                  <li><code>last_login_days_ago</code>: 30 (viimeksi kirjautunut)</li>
                  <li><code>survey_participation</code>: "active", "inactive"</li>
                  <li><code>total_purchases</code>: 5 (ostojen määrä)</li>
                </ul>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Esimerkkejä:</h4>
              <div className="bg-gray-50 p-3 rounded-lg font-mono text-sm">
                <div className="mb-2">{"// Premium-asiakkaat jotka eivät ole vastanneet kyselyyn"}</div>
                <div className="mb-2">{"{"}</div>
                <div className="mb-2">{"  \"customer_type\": \"premium\","}</div>
                <div className="mb-2">{"  \"survey_participation\": \"inactive\","}</div>
                <div className="mb-2">{"  \"last_login_days_ago\": 7"}</div>
                <div>{"}"}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
