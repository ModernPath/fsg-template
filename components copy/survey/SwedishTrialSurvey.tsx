'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { SurveyForm } from '@/components/survey/SurveyForm'
import { Spinner } from '@/components/ui/spinner'
import { AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface SurveyInvitation {
  id: string
  token: string
  status: string
  expires_at: string
  created_at: string
}

interface SurveyTemplate {
  id: string
  name: string
  description: string
  questions: any
  settings: any
  is_active: boolean
}

interface ExistingResponse {
  id: string
  answers: Record<string, any>
  completion_status: string
  created_at: string
}

interface SurveyData {
  invitation: SurveyInvitation
  survey: SurveyTemplate
  existing_response?: ExistingResponse
  already_completed?: boolean
  response_id?: string
  can_start: boolean
  message: string
}

interface SwedishTrialSurveyProps {
  locale: string
  onSurveyComplete?: () => void
}

export default function SwedishTrialSurvey({ locale, onSurveyComplete }: SwedishTrialSurveyProps) {
  const t = useTranslations('Survey')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [showSurvey, setShowSurvey] = useState(false)

  // Load survey data on mount
  useEffect(() => {
    loadSurveyData()
  }, [])

  const loadSurveyData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Create a public survey invitation for swedish-trial page
      const response = await fetch('/api/surveys/invitations/public', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: 'swedish-trial',
          email: null // No email required for public invitations
        })
      })

      if (!response.ok) {
        throw new Error(t('errors.loadFailed'))
      }

      const data = await response.json()
      
      // Now load the survey data using the token
      const surveyResponse = await fetch(`/api/surveys/token/${data.invitation.token}`)
      
      if (!surveyResponse.ok) {
        throw new Error(t('errors.loadFailed'))
      }

      const surveyData = await surveyResponse.json()
      setSurveyData(surveyData)

      // If already completed, show completion state
      if (surveyData.already_completed) {
        setCompleted(true)
      }

    } catch (err) {
      console.error('Error loading survey:', err)
      setError(err instanceof Error ? err.message : t('error'))
    } finally {
      setLoading(false)
    }
  }


  const handleSurveySubmit = async (answers: Record<string, any>, completionStatus: string = 'completed') => {
    if (!surveyData) return

    try {
      console.log('🚀 [Survey] handleSurveySubmit called with:', { answers, completionStatus })
      setSubmitting(true)
      setError(null)

      const response = await fetch(`/api/surveys/token/${surveyData.invitation.token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers,
          completion_status: completionStatus,
          session_duration: calculateSessionDuration()
        })
      })

      console.log('📡 [Survey] API response status:', response.status)
      const data = await response.json()
      console.log('📡 [Survey] API response data:', data)

      if (!response.ok) {
        // Use errorCode for localized error messages if available
        const errorMessage = data.errorCode && t.has(`errors.${data.errorCode}`) 
          ? t(`errors.${data.errorCode}`)
          : data.error || t('errors.submitFailed')
        
        throw new Error(errorMessage)
      }

      // Handle completion
      if (completionStatus === 'completed') {
        console.log('✅ [Survey] Survey completed successfully')
        setCompleted(true)
        onSurveyComplete?.()
      }

      return data

    } catch (err) {
      console.error('❌ [Survey] Error submitting survey:', err)
      setError(err instanceof Error ? err.message : t('errors.submitFailed'))
      throw err
    } finally {
      setSubmitting(false)
    }
  }

  const handlePartialSave = async (answers: Record<string, any>) => {
    if (!surveyData) return

    try {
      console.log('💾 [Survey] handlePartialSave called with:', answers)
      const response = await fetch(`/api/surveys/token/${surveyData.invitation.token}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers,
          completion_status: 'in_progress'
        })
      })
      console.log('💾 [Survey] Partial save response status:', response.status)
    } catch (err) {
      console.error('❌ [Survey] Error saving partial response:', err)
      // Don't show error to user for auto-save
    }
  }

  const calculateSessionDuration = () => {
    if (surveyData?.existing_response) {
      const startTime = new Date(surveyData.existing_response.created_at).getTime()
      return Math.floor((Date.now() - startTime) / 1000)
    }
    return null
  }

  const startSurvey = () => {
    setShowSurvey(true)
  }

  // Loading state
  if (loading) {
    return (
      <div className="bg-gray-800/30 rounded-lg p-6 text-center">
        <Spinner className="mx-auto mb-4" size="lg" />
        <h3 className="text-xl font-semibold text-white mb-2">
          {t('loading')}
        </h3>
        <p className="text-gray-300">
          {t('loadingDescription', { default: 'Vänta en stund, vi hämtar enkätinformation.' })}
        </p>
      </div>
    )
  }

  // Error state
  if (error || !surveyData) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-400 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">
          {t('errors.loadFailed')}
        </h3>
        <p className="text-gray-300 mb-4">
          {error || t('errors.loadFailedDescription', { default: 'Enkäten kunde inte laddas. Kontrollera länken och försök igen.' })}
        </p>
        <Button onClick={loadSurveyData} variant="outline" className="border-red-500 text-red-400 hover:bg-red-500/10">
          {t('tryAgain')}
        </Button>
      </div>
    )
  }

  // Completed state
  if (completed) {
    return (
      <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-6 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-green-400 mb-4" />
        <h3 className="text-2xl font-bold text-white mb-4">
          {t('completion.title')}
        </h3>
        <p className="text-gray-300 mb-6">
          {t('completion.message')}
        </p>
        <div className="text-sm text-gray-400">
          <p>{t('completion.followUp')}</p>
          <p className="mt-2">
            {t('completion.contact')}
          </p>
        </div>
      </div>
    )
  }

  // Survey invitation state
  if (!showSurvey) {
    return (
      <div className="bg-gray-800/30 rounded-lg p-6 text-center">
        <h3 className="text-2xl font-bold text-white mb-4">
          {surveyData.survey.name}
        </h3>
        {surveyData.survey.description && (
          <p className="text-gray-300 mb-6">
            {surveyData.survey.description}
          </p>
        )}
        
        {/* Survey intro from questions structure */}
        {surveyData.survey.questions?.introduction && (
          <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <p className="text-blue-300">
              {surveyData.survey.questions.introduction}
            </p>
          </div>
        )}

        <Button 
          onClick={startSurvey}
          className="bg-gold-primary hover:bg-gold-highlight text-black font-semibold px-8 py-3 rounded-lg"
        >
          {t('startSurvey', { default: 'Starta enkät' })}
        </Button>
      </div>
    )
  }

  // Survey form
  return (
    <div className="bg-gray-800/30 rounded-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">
          {surveyData.survey.name}
        </h3>
        {surveyData.survey.description && (
          <p className="text-gray-300">
            {surveyData.survey.description}
          </p>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-red-300">
                {t('error')}
              </h4>
              <p className="text-sm text-red-200 mt-1">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Survey Form */}
      <SurveyForm
        survey={surveyData.survey}
        existingResponse={surveyData.existing_response}
        onSubmit={handleSurveySubmit}
        onPartialSave={handlePartialSave}
        submitting={submitting}
        locale={locale}
        context="swedish-trial"
      />
    </div>
  )
}
