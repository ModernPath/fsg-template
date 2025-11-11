'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { SurveyQuestion } from './SurveyQuestion'
import { ChevronLeft, ChevronRight, Save, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SurveyFormProps {
  survey: {
    id: string
    name: string
    questions: any
    settings: any
  }
  existingResponse?: {
    id: string
    answers: Record<string, any>
    completion_status: string
  }
  onSubmit: (answers: Record<string, any>, completionStatus?: string) => Promise<any>
  onPartialSave?: (answers: Record<string, any>) => Promise<void>
  submitting: boolean
  locale: string
  context?: string
}

interface Question {
  id: string
  type: string
  text: string
  required: boolean
  options?: Array<{ value: string; label: string }>
  scale?: { min: number; max: number; minLabel: string; maxLabel: string }
  rows?: number
  placeholder?: string
  customInput?: { showWhen: string; placeholder: string; type?: string }
  showWhen?: Record<string, any>
  conditionalLogic?: Record<string, any>
}

interface Section {
  id: string
  title: string
  questions: Question[]
  showWhen?: Record<string, any>
}

export function SurveyForm({
  survey,
  existingResponse,
  onSubmit,
  onPartialSave,
  submitting,
  locale,
  context
}: SurveyFormProps) {
  const t = useTranslations('Survey')
  
  // Determine if we should use SEK instead of EUR based on context
  const useSek = context === 'swedish-trial'
  
  const [answers, setAnswers] = useState<Record<string, any>>(
    existingResponse?.answers || {}
  )
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [autoSaving, setAutoSaving] = useState(false)
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null)


  // Extract sections from survey questions
  const sections: Section[] = survey.questions?.sections || []
  const currentSection = sections[currentSectionIndex]

  // Helper function to check if element should be visible
  const isElementVisible = (element: Section | Question, currentAnswers: Record<string, any>): boolean => {
    if (!element.showWhen) return true

    // Check if all conditions are met
    return Object.entries(element.showWhen).every(([questionId, expectedValue]) => {
      return currentAnswers[questionId] === expectedValue
    })
  }

  // Filter visible sections based on conditional logic
  const visibleSections = sections.filter(section => 
    isElementVisible(section, answers)
  )

  // Calculate progress
  const progress = visibleSections.length > 0 
    ? ((currentSectionIndex + 1) / visibleSections.length) * 100 
    : 0

  // Auto-save functionality
  useEffect(() => {
    if (!onPartialSave) return

    const autoSaveInterval = setInterval(() => {
      if (Object.keys(answers).length > 0) {
        handleAutoSave()
      }
    }, 30000) // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval)
  }, [answers, onPartialSave])

  const handleAutoSave = useCallback(async () => {
    if (!onPartialSave || autoSaving) return

    try {
      setAutoSaving(true)
      await onPartialSave(answers)
      setLastSaveTime(new Date())
    } catch (error) {
      console.error('Auto-save failed:', error)
    } finally {
      setAutoSaving(false)
    }
  }, [answers, onPartialSave, autoSaving])

  const handleAnswerChange = (questionId: string, value: any) => {
    const newAnswers = { ...answers, [questionId]: value }
    setAnswers(newAnswers)

    // Clear error for this question
    if (errors[questionId]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[questionId]
        return newErrors
      })
    }

    // Handle conditional logic
    handleConditionalLogic(questionId, value, newAnswers)
  }

  const handleConditionalLogic = (questionId: string, value: any, currentAnswers: Record<string, any>) => {
    // Find the question that was answered
    const question = findQuestionById(questionId)
    if (!question?.conditionalLogic) return

    const logic = question.conditionalLogic[value]
    if (!logic) return

    // Handle hiding/showing questions based on conditional logic
    if (logic.hideQuestions) {
      const updatedAnswers = { ...currentAnswers }
      
      // Clear answers for hidden questions
      logic.hideQuestions.forEach((hiddenQuestionId: string) => {
        if (hiddenQuestionId === 'all_other_questions') {
          // Clear all questions except the current section
          sections.forEach(section => {
            if (section.id !== currentSection.id) {
              section.questions.forEach(q => {
                delete updatedAnswers[q.id]
              })
            }
          })
        } else {
          delete updatedAnswers[hiddenQuestionId]
        }
      })
      
      setAnswers(updatedAnswers)
    }
  }

  const findQuestionById = (questionId: string): Question | null => {
    for (const section of sections) {
      const question = section.questions.find(q => q.id === questionId)
      if (question) return question
    }
    return null
  }

  const validateCurrentSection = (): boolean => {
    if (!currentSection) return true

    const newErrors: Record<string, string> = {}
    
    // Get visible questions in current section
    const visibleQuestions = currentSection.questions.filter(question => 
      isElementVisible(question, answers)
    )

    visibleQuestions.forEach(question => {
      if (question.required) {
        const answer = answers[question.id]
        
        if (answer === undefined || answer === null || answer === '' || 
            (Array.isArray(answer) && answer.length === 0)) {
          // Store the translation key instead of translated text
          newErrors[question.id] = 'required'
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (!validateCurrentSection()) return

    if (currentSectionIndex < visibleSections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1)
    }
  }

  const handleSubmit = async () => {
    // Validate all visible sections
    let isValid = true
    const allErrors: Record<string, string> = {}

    visibleSections.forEach(section => {
      const visibleQuestions = section.questions.filter(question => 
        isElementVisible(question, answers)
      )

      visibleQuestions.forEach(question => {
        if (question.required) {
          const answer = answers[question.id]
          
          if (answer === undefined || answer === null || answer === '' || 
              (Array.isArray(answer) && answer.length === 0)) {
            // Store the translation key instead of translated text
            allErrors[question.id] = 'required'
            isValid = false
          }
        }
      })
    })

    if (!isValid) {
      setErrors(allErrors)
      // Navigate to first section with errors
      const firstErrorSection = visibleSections.findIndex(section =>
        section.questions.some(q => allErrors[q.id])
      )
      if (firstErrorSection !== -1) {
        setCurrentSectionIndex(firstErrorSection)
      }
      return
    }

    try {
      console.log('🎯 [SurveyForm] Calling onSubmit with:', { answers, status: 'completed' })
      await onSubmit(answers, 'completed')
      console.log('✅ [SurveyForm] onSubmit completed successfully')
    } catch (error) {
      console.error('❌ [SurveyForm] Submit failed:', error)
    }
  }

  const handleSaveDraft = async () => {
    try {
      await onSubmit(answers, 'in_progress')
    } catch (error) {
      console.error('Save draft failed:', error)
    }
  }

  if (!currentSection) {
    return (
      <div className="bg-gray-900/60 border border-gold-primary/30 rounded-lg shadow-sm p-8 text-center">
        <p className="text-gray-300">{t('noQuestions')}</p>
      </div>
    )
  }

  const isFirstSection = currentSectionIndex === 0
  const isLastSection = currentSectionIndex === visibleSections.length - 1
  const visibleQuestions = currentSection.questions.filter(question => 
    isElementVisible(question, answers)
  )

  return (
    <div className="bg-gray-900/60 border border-gold-primary/30 rounded-lg shadow-sm">
      {/* Progress bar */}
      {survey.settings?.show_progress !== false && (
        <div className="p-6 border-b border-gold-primary/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gold-primary">
              {t('step')} {currentSectionIndex + 1} {t('of')} {visibleSections.length}
            </span>
            <span className="text-sm text-gray-300">
              {Math.round(progress)}% {t('complete')}
            </span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      )}

      {/* Section content */}
      <div className="p-6">
        {/* Section title */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gold-primary mb-2">
            {currentSection.title}
          </h2>
          
          {/* Auto-save indicator */}
          {lastSaveTime && (
            <p className="text-sm text-gray-400">
              {autoSaving ? (
                <>
                  <Save className="inline w-4 h-4 mr-1 animate-spin" />
                  Tallennetaan...
                </>
              ) : (
                <>
                  <Save className="inline w-4 h-4 mr-1" />
                  Tallennettu {lastSaveTime.toLocaleTimeString('fi-FI')}
                </>
              )}
            </p>
          )}
        </div>

        {/* Questions */}
        <div className="space-y-8">
          {visibleQuestions.map((question, index) => (
            <div key={question.id}>
              <SurveyQuestion
                question={question}
                value={answers[question.id]}
                onChange={(value) => handleAnswerChange(question.id, value)}
                error={errors[question.id] ? t(errors[question.id]) : undefined}
                locale={locale}
                context={context}
                useSek={useSek}
              />
              
              {/* Show encouragement for analysis if user said no */}
              {question.id === 'did_analysis' && 
               answers[question.id] === 'no' && 
               question.conditionalLogic?.no?.showEncouragement && (
                <div className="mt-4 p-4 bg-gold-primary/10 border border-gold-primary/30 rounded-lg">
                  <h4 className="font-semibold text-gold-primary mb-2">
                    {t('encouragement.title')}
                  </h4>
                  <ul className="text-sm text-gray-300 space-y-1 mb-3">
                    {t('encouragement.benefits').map((benefit: string, index: number) => (
                      <li key={index}>• {benefit}</li>
                    ))}
                  </ul>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gold-primary/40 text-gold-primary hover:bg-gold-primary/10"
                    onClick={() => window.open(`/${locale}/onboarding`, '_blank')}
                  >
                    {t('encouragement.startAnalysis')}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="px-6 py-4 border-t border-gold-primary/20 bg-gray-800/40 rounded-b-lg">
        <div className="flex items-center justify-between">
          {/* Previous button */}
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={isFirstSection}
            className={cn(
              "flex items-center border-gold-primary/40 text-gold-primary hover:bg-gold-primary/10",
              isFirstSection && "invisible"
            )}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {t('previous')}
          </Button>

          {/* Save draft button (middle) */}
          {!isLastSection && survey.settings?.save_partial !== false && (
            <Button
              variant="ghost"
              onClick={handleSaveDraft}
              disabled={submitting}
              className="text-gray-400 hover:text-gold-primary hover:bg-gold-primary/10"
            >
              <Save className="w-4 h-4 mr-2" />
              {t('saveDraft')}
            </Button>
          )}

          {/* Next/Submit button */}
          {isLastSection ? (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center bg-gold-primary hover:bg-gold-primary/90 text-black font-medium"
            >
              {submitting ? (
                <>
                  <Save className="w-4 h-4 mr-2 animate-spin" />
                  {t('submitting')}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {t('submit')}
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="flex items-center bg-gold-primary hover:bg-gold-primary/90 text-black font-medium"
            >
              {t('next')}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
