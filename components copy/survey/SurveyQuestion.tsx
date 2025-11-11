'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'

interface Question {
  id: string
  type: string
  text?: string
  question?: string // Alternative property name used in survey templates
  required: boolean
  options?: Array<{ value: string; label: string }>
  scale?: { min: number; max: number; minLabel?: string; maxLabel?: string; labels?: Record<string, string> }
  rows?: number
  placeholder?: string
  customInput?: { showWhen: string; placeholder: string; type?: string }
  multiple?: boolean
  multiline?: boolean
}

interface SurveyQuestionProps {
  question: Question
  value: any
  onChange: (value: any) => void
  error?: string
  locale: string
  context?: string
  useSek?: boolean
}

export function SurveyQuestion({
  question,
  value,
  onChange,
  error,
  locale,
  context,
  useSek
}: SurveyQuestionProps) {
  const t = useTranslations('Survey')
  const [customInputValue, setCustomInputValue] = useState('')

  // Initialize custom input value from existing data
  useEffect(() => {
    if (typeof value === 'object' && value?.custom) {
      setCustomInputValue(value.custom)
    } else {
      setCustomInputValue('')
    }
  }, [value])

  // Function to get appropriate options based on context
  const getContextualOptions = (baseKey: string) => {
    if (useSek && t.raw(`options.${baseKey}Sek`) !== undefined) {
      return t.raw(`options.${baseKey}Sek`)
    }
    return t.raw(`options.${baseKey}`)
  }

  // Function to get appropriate placeholder based on context
  const getContextualPlaceholder = (baseKey: string) => {
    if (useSek && t.raw(`placeholders.${baseKey}Sek`) !== undefined) {
      return t(`placeholders.${baseKey}Sek`)
    }
    return t(`placeholders.${baseKey}`)
  }

  const handleRadioChange = (newValue: string) => {
    onChange(newValue)
    
    // Handle custom input
    if (question.customInput?.showWhen === newValue) {
      setCustomInputValue('')
    } else if (question.customInput && newValue !== question.customInput.showWhen) {
      // Clear custom input if not showing
      setCustomInputValue('')
    }
  }

  const handleCustomInputChange = (customValue: string) => {
    setCustomInputValue(customValue)
    // Combine the main answer with custom input
    const mainValue = typeof value === 'object' ? value?.main : value
    onChange({
      main: mainValue || question.customInput?.showWhen,
      custom: customValue
    })
  }

  const handleCheckboxChange = (optionValue: string, checked: boolean) => {
    const currentValues = Array.isArray(value) ? value : []
    
    if (checked) {
      const newValues = [...currentValues, optionValue]
      onChange(newValues)
    } else {
      const newValues = currentValues.filter(v => v !== optionValue)
      onChange(newValues)
      
      // Clear custom input if unchecking the option that shows it
      if (question.customInput?.showWhen === optionValue) {
        setCustomInputValue('')
      }
    }
  }

  const handleCheckboxCustomInput = (customValue: string) => {
    setCustomInputValue(customValue)
    // For checkboxes, we need to maintain both the selected options and custom input
    const currentValues = Array.isArray(value) ? value : []
    onChange({
      options: currentValues,
      custom: customValue
    })
  }

  // Function to get appropriate options for a question
  const getQuestionOptions = () => {
    // Handle specific question types that need context-aware options
    if (question.id === 'companySize' || question.id === '2') {
      const sizeOptions = getContextualOptions('companySizes')
      return Object.entries(sizeOptions).map(([key, value]) => ({
        value: key,
        label: value as string
      }))
    } else if (question.id === 'pricingWillingness') {
      const pricingOptions = getContextualOptions('pricingOptions')
      return Object.entries(pricingOptions).map(([key, value]) => ({
        value: key,
        label: value as string
      }))
    } else if (question.id === 'role' || question.id === '1') {
      // Handle role question - use roles translations
      try {
        const rolesOptions = t.raw('options.roles')
        if (rolesOptions && typeof rolesOptions === 'object') {
          return Object.entries(rolesOptions).map(([key, value]) => ({
            value: key,
            label: value as string
          }))
        }
      } catch (error) {
        // Fall through to original options
      }
    } else if (question.id === 'credibilityImprovements') {
      // Handle credibility improvements question
      try {
        const credibilityOptions = t.raw('options.credibilityImprovements')
        if (credibilityOptions && typeof credibilityOptions === 'object') {
          return Object.entries(credibilityOptions).map(([key, value]) => ({
            value: key,
            label: value as string
          }))
        }
      } catch (error) {
        // Fall through to original options
      }
    } else if (question.id === 'futureParticipation' || question.id === 'future_participation') {
      // Handle future participation question
      try {
        const participationOptions = t.raw('options.futureParticipationOptions')
        if (participationOptions && typeof participationOptions === 'object') {
          return Object.entries(participationOptions).map(([key, value]) => ({
            value: key,
            label: value as string
          }))
        }
      } catch (error) {
        // Fall through to original options
      }
    }
    
    // For yes/no questions, try basic options
    if (question.options && question.options.length === 2) {
      const hasYesNo = question.options.some(opt => opt.value === 'yes' || opt.value === 'no')
      if (hasYesNo) {
        return question.options.map(option => ({
          value: option.value,
          label: option.value === 'yes' ? t('options.yes') : 
                 option.value === 'no' ? t('options.no') : option.label
        }))
      }
    }
    
    // Return original options if no translations found
    return question.options || []
  }

  const renderQuestionContent = () => {
    switch (question.type) {
      case 'radio':
        const radioOptions = getQuestionOptions()
        return (
          <div className="space-y-4">
            <RadioGroup
              value={typeof value === 'object' ? value?.main : value}
              onValueChange={handleRadioChange}
              className="space-y-3"
            >
              {radioOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-3">
                  <RadioGroupItem
                    value={option.value}
                    id={`${question.id}-${option.value}`}
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor={`${question.id}-${option.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1 text-gray-200"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            
            {/* Custom input for radio */}
            {question.customInput && 
             (typeof value === 'object' ? value?.main : value) === question.customInput.showWhen && (
              <div className="ml-6 mt-3">
                <Input
                  type={question.customInput.type || 'text'}
                  placeholder={question.customInput.placeholder}
                  value={customInputValue}
                  onChange={(e) => handleCustomInputChange(e.target.value)}
                  className="max-w-xs"
                />
              </div>
            )}
          </div>
        )

      case 'checkbox':
      case 'multiple_choice':
        // Handle both checkbox and multiple_choice types
        const isMultiple = question.multiple !== false && (question.type === 'checkbox' || question.type === 'multiple_choice')
        const checkboxValues = typeof value === 'object' && value?.options ? value.options : (Array.isArray(value) ? value : [])
        
        if (isMultiple) {
          const checkboxOptions = getQuestionOptions()
          return (
            <div className="space-y-4">
              <div className="space-y-3">
                {checkboxOptions.map((option) => {
                  const optionValue = typeof option === 'string' ? option : option.value
                  const optionLabel = typeof option === 'string' ? option : option.label
                  
                  return (
                    <div key={optionValue} className="flex items-center space-x-3">
                      <Checkbox
                        id={`${question.id}-${optionValue}`}
                        checked={checkboxValues.includes(optionValue)}
                        onCheckedChange={(checked) => handleCheckboxChange(optionValue, checked as boolean)}
                      />
                      <Label
                        htmlFor={`${question.id}-${optionValue}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1 text-gray-100"
                      >
                        {optionLabel}
                      </Label>
                    </div>
                  )
                })}
              </div>
              
              {/* Custom input for checkbox */}
              {question.customInput && 
               checkboxValues.includes(question.customInput.showWhen) && (
                <div className="ml-6 mt-3">
                  <Input
                    type={question.customInput.type || 'text'}
                    placeholder={question.customInput.placeholder}
                    value={customInputValue}
                    onChange={(e) => handleCheckboxCustomInput(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
              )}
            </div>
          )
        } else {
          // Single choice radio buttons
          const singleChoiceOptions = getQuestionOptions()
          const currentValue = typeof value === 'object' ? value?.main : value
          
          return (
            <div className="space-y-4">
              <RadioGroup
                value={currentValue}
                onValueChange={handleRadioChange}
                className="space-y-3"
              >
                {singleChoiceOptions.map((option) => {
                  const optionValue = typeof option === 'string' ? option : option.value
                  const optionLabel = typeof option === 'string' ? option : option.label
                  const isSelected = currentValue === optionValue
                  
                  return (
                    <div 
                      key={optionValue} 
                      className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                        isSelected 
                          ? 'bg-gold-primary/10 border-2 border-gold-primary/30' 
                          : 'border-2 border-transparent hover:bg-gray-800/30'
                      }`}
                    >
                      <RadioGroupItem
                        value={optionValue}
                        id={`${question.id}-${optionValue}`}
                        className="mt-0.5 flex-shrink-0"
                      />
                      <Label
                        htmlFor={`${question.id}-${optionValue}`}
                        className={`text-sm font-medium leading-none cursor-pointer flex-1 transition-colors ${
                          isSelected 
                            ? 'text-gold-primary font-semibold' 
                            : 'text-gray-100 hover:text-gold-primary/80'
                        } peer-disabled:cursor-not-allowed peer-disabled:opacity-70`}
                      >
                        {optionLabel}
                      </Label>
                    </div>
                  )
                })}
              </RadioGroup>
            </div>
          )
        }

      case 'scale':
      case 'rating':
        const scaleMin = question.scale?.min || 1
        const scaleMax = question.scale?.max || 5
        const scaleValue = parseInt(value) || null
        
        return (
          <div className="space-y-4">
            {/* Scale labels */}
            {(question.scale?.minLabel || question.scale?.maxLabel) && (
              <div className="flex justify-between text-sm text-gray-300">
                <span>{question.scale?.minLabel || (question.type === 'rating' ? 'Heikko' : 'Min')}</span>
                <span>{question.scale?.maxLabel || (question.type === 'rating' ? 'Erinomainen' : 'Max')}</span>
              </div>
            )}
            
            {/* Scale buttons */}
            <div className="flex justify-between gap-2">
              {Array.from({ length: scaleMax - scaleMin + 1 }, (_, i) => {
                const scalePoint = scaleMin + i
                const isSelected = scaleValue === scalePoint
                
                return (
                  <Button
                    key={scalePoint}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => onChange(scalePoint.toString())}
                    className={cn(
                      "min-w-[40px] h-10",
                      isSelected 
                        ? "bg-gold-primary hover:bg-gold-primary/90 text-black font-medium" 
                        : "border-gold-primary/40 text-gold-primary hover:bg-gold-primary/10"
                    )}
                  >
                    {scalePoint}
                  </Button>
                )
              })}
            </div>
            
            {/* Current selection display */}
            {scaleValue && (
              <div className="text-center text-sm text-gray-600 dark:text-gray-300">
                {locale === 'sv' ? 'Du valde:' : 'Valitsit:'} <span className="font-medium">{scaleValue}</span>
              </div>
            )}
          </div>
        )

      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder}
            rows={question.rows || 3}
            className="w-full resize-y"
          />
        )

      case 'text':
        if (question.multiline) {
          return (
            <Textarea
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={question.placeholder}
              rows={question.rows || 4}
              className="w-full resize-vertical"
            />
          )
        } else {
          return (
            <Input
              type="text"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={question.placeholder}
              className="w-full max-w-md"
            />
          )
        }

      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder}
            className="w-full max-w-xs"
          />
        )

      case 'email':
        return (
          <Input
            type="email"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder || 'esimerkki@yritys.fi'}
            className="w-full max-w-md"
          />
        )

      default:
        return (
          <div className="text-gray-400 italic">
            Tuntematon kysymystyyppi: {question.type}
          </div>
        )
    }
  }

  return (
    <div className="space-y-4">
      {/* Question text */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-gray-100">
          {question.text || question.question}
          {question.required && (
            <span className="text-gold-primary ml-1" aria-label={t('required')}>
              *
            </span>
          )}
        </h3>
      </div>

      {/* Question input */}
      <div className="space-y-3">
        {renderQuestionContent()}
        
        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  )
}
