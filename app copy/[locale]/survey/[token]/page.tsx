'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { SurveyForm } from '@/components/survey/SurveyForm'
import { Spinner } from '@/components/ui/spinner'
import { AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface SurveyInvitation {
  id: string
  email: string
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

export default function SurveyPage() {
  const params = useParams()
  const t = useTranslations('Survey')
  const token = params.token as string
  const locale = params.locale as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [showEncouragement, setShowEncouragement] = useState(false)
  const [analysisLink, setAnalysisLink] = useState<string | null>(null)

  // Load survey data on mount
  useEffect(() => {
    loadSurveyData()
  }, [token])

  const loadSurveyData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/surveys/token/${token}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t('errors.loadFailed'))
      }

      setSurveyData(data)

      // If already completed, show completion state
      if (data.already_completed) {
        setCompleted(true)
      }

    } catch (err) {
      console.error('Error loading survey:', err)
      setError(err instanceof Error ? err.message : t('errors.networkError'))
    } finally {
      setLoading(false)
    }
  }

  const handleSurveySubmit = async (answers: Record<string, any>, completionStatus: string = 'completed') => {
    try {
      console.log('🚀 [Survey] handleSurveySubmit called with:', { answers, completionStatus })
      setSubmitting(true)
      setError(null)

      const response = await fetch(`/api/surveys/token/${token}`, {
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
        // Handle duplicate response specifically
        if (response.status === 409 && data.code === 'DUPLICATE_RESPONSE') {
          console.log('ℹ️ [Survey] Duplicate response detected, marking as completed')
          setCompleted(true)
          setError(null) // Clear error since this is actually a success state
          return data
        }
        
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
        setShowEncouragement(data.show_analysis_encouragement || false)
        setAnalysisLink(data.analysis_link || null)
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
    try {
      console.log('💾 [Survey] handlePartialSave called with:', answers)
      const response = await fetch(`/api/surveys/token/${token}`, {
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
    // If no existing response, we can't calculate accurate duration
    return null
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Spinner className="mx-auto mb-4" size="lg" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {t('loading')}
          </h2>
          <p className="text-gray-600">
            {t('loadingDescription')}
          </p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !surveyData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center bg-white rounded-lg shadow-lg p-8">
          <AlertTriangle className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t('errors.loadFailed')}
          </h2>
          <p className="text-gray-600 mb-6">
            {error || t('errors.loadFailedDescription')}
          </p>
          <Button onClick={loadSurveyData} variant="outline">
            {t('tryAgain')}
          </Button>
        </div>
      </div>
    )
  }

  // Completed state
  if (completed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {t('completion.title')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            {t('completion.message')}
          </p>

          {/* Show encouragement for analysis if user didn't do it */}
          {showEncouragement && analysisLink && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-3">
                {t('completion.analysisEncouragement.title')}
              </h3>
              <p className="text-blue-800 dark:text-blue-200 mb-4">
                {t('completion.analysisEncouragement.message')}
              </p>
              <Link href={analysisLink}>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {t('completion.analysisEncouragement.startButton')}
                </Button>
              </Link>
            </div>
          )}

          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>{t('completion.followUp')}</p>
            <p className="mt-2">
              {t('completion.contact')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Survey form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {surveyData.survey.name}
            </h1>
            {surveyData.survey.description && (
              <p className="text-lg text-gray-600 dark:text-gray-300">
                {surveyData.survey.description}
              </p>
            )}
            
            {/* Survey intro from questions structure */}
            {surveyData.survey.questions?.introduction && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                <p className="text-blue-900 dark:text-blue-100">
                  {surveyData.survey.questions.introduction}
                </p>
              </div>
            )}
          </div>

          {/* Error display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    {t('error')}
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Survey Form */}
        <div className="max-w-4xl mx-auto">
          <SurveyForm
            survey={surveyData.survey}
            existingResponse={surveyData.existing_response}
            onSubmit={handleSurveySubmit}
            onPartialSave={handlePartialSave}
            submitting={submitting}
            locale={locale}
          />
        </div>
      </div>
    </div>
  )
}
