'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  ChevronDown, 
  ChevronUp, 
  Upload, 
  Send, 
  RefreshCw,
  AlertCircle,
  Lightbulb,
  Building2,
  TrendingUp,
  DollarSign
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { 
  useOnboardingCompany,
  useOnboardingFinancialMetrics,
  useEnhancedAnalysis,
  useConversationMessage,
  useUploadDocument,
  useProcessedFinancialData
} from '@/hooks/useOnboardingQueries'
import { FinancialChartsDisplay } from '@/components/financial/FinancialChartsDisplay'

// Types
interface ConversationTurn {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  options?: string[]
}

interface OptionItem {
  value: string
  label: string
}

interface Step3AIConversationOptimizedProps {
  companyId: string
  session: any
  currentLocale: string
  onDone: (data?: any) => void
  onApplyRecommendation?: (recommendationData: any) => void
}

export default function Step3AIConversationOptimized({
  companyId,
  session,
  currentLocale,
  onDone,
  onApplyRecommendation,
}: Step3AIConversationOptimizedProps) {
  const t = useTranslations("Onboarding")
  const { toast } = useToast()
  
  // UI State
  const [expanded, setExpanded] = useState(false)
  const [hasLatestStatement, setHasLatestStatement] = useState(false)
  
  // Conversation state
  const [turns, setTurns] = useState<ConversationTurn[]>([])
  const [question, setQuestion] = useState<string>("")
  const [options, setOptions] = useState<OptionItem[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [input, setInput] = useState<string>("")
  const [cfoGuidance, setCfoGuidance] = useState<string>("")
  const [isConversationDone, setIsConversationDone] = useState(false)
  const [recommendation, setRecommendation] = useState<any>(null)
  
  // Refs
  const conversationEndRef = useRef<HTMLDivElement>(null)
  
  // React Query hooks
  const { 
    data: companyData, 
    isLoading: companyLoading, 
    error: companyError,
    refetch: refetchCompany 
  } = useOnboardingCompany(companyId, session?.access_token)
  
  const { 
    data: financialMetrics, 
    isLoading: financialLoading, 
    error: financialError 
  } = useOnboardingFinancialMetrics(companyId, session?.access_token)
  
  const enhancedAnalysisMutation = useEnhancedAnalysis()
  const conversationMutation = useConversationMessage()
  const uploadDocumentMutation = useUploadDocument()
  
  // Process financial data for charts
  const { yearlyFinancialData, latestFinancialRatios } = useProcessedFinancialData(financialMetrics)
  
  // Initialize conversation with first question
  useEffect(() => {
    if (turns.length === 0 && !question) {
      setQuestion(t('chat.firstQuestion'))
      setOptions([
        { value: 'cashflow', label: t('chat.primaryNeeds.cashflow') },
        { value: 'investments', label: t('chat.primaryNeeds.investments') },
        { value: 'new_project', label: t('chat.primaryNeeds.newProject') },
        { value: 'optimize_existing', label: t('chat.primaryNeeds.optimizeExisting') }
      ])
      setCfoGuidance(t('chat.cfo.intro'))
    }
  }, [turns.length, question, t])
  
  // Scroll to bottom when new turns are added
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [turns])
  
  // Handle enhanced analysis
  const handleEnhancedAnalysis = useCallback(async () => {
    try {
      await enhancedAnalysisMutation.mutateAsync({
        companyId,
        locale: currentLocale,
        accessToken: session.access_token
      })
      
      toast({
        title: t('ui.success'),
        description: t('ui.companyDataRefreshed'),
      })
    } catch (error) {
      console.error('Enhanced analysis failed:', error)
      toast({
        title: t('ui.error'),
        description: error instanceof Error ? error.message : t('ui.companyDataFetchFailed'),
        variant: 'destructive'
      })
    }
  }, [companyId, currentLocale, session.access_token, enhancedAnalysisMutation, toast, t])
  
  // Handle conversation message submission
  const handleSubmitMessage = useCallback(async () => {
    if ((!selected.length && !input.trim()) || conversationMutation.isPending) return
    
    const userMessage = input.trim()
    const selectedOptions = selected
    
    // Add user turn to conversation
    const userTurn: ConversationTurn = {
      id: Date.now().toString(),
      type: 'user',
      content: userMessage || selectedOptions.join(', '),
      timestamp: new Date(),
      options: selectedOptions
    }
    
    setTurns(prev => [...prev, userTurn])
    setInput('')
    setSelected([])
    
    try {
      const response = await conversationMutation.mutateAsync({
        companyId,
        message: userMessage,
        options: selectedOptions,
        locale: currentLocale,
        accessToken: session.access_token
      })
      
      // Add assistant response
      const assistantTurn: ConversationTurn = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.response || response.nextQuestion || 'Thank you for your response.',
        timestamp: new Date()
      }
      
      setTurns(prev => [...prev, assistantTurn])
      
      // Update conversation state
      if (response.nextQuestion) {
        setQuestion(response.nextQuestion)
        setOptions(response.options?.map((opt: any) => ({
          value: opt.value || opt,
          label: opt.label || opt
        })) || [])
      } else {
        setIsConversationDone(true)
        setQuestion('')
        setOptions([])
      }
      
      if (response.cfoGuidance) {
        setCfoGuidance(response.cfoGuidance)
      }
      
      if (response.recommendation) {
        setRecommendation(response.recommendation)
      }
      
      // If conversation is done, call onDone
      if (response.isDone || response.isComplete) {
        setIsConversationDone(true)
        onDone?.(response)
      }
      
    } catch (error) {
      console.error('Conversation message failed:', error)
      toast({
        title: t('ui.error'),
        description: error instanceof Error ? error.message : t('chat.error.generic'),
        variant: 'destructive'
      })
    }
  }, [selected, input, conversationMutation, companyId, currentLocale, session.access_token, onDone, toast, t])
  
  // Handle file upload
  const handleFileUpload = useCallback(async (files: FileList) => {
    if (!files.length) return
    
    const file = files[0]
    
    try {
      await uploadDocumentMutation.mutateAsync({
        file,
        companyId,
        documentType: 'financial_statement',
        accessToken: session.access_token
      })
      
      setHasLatestStatement(true)
      toast({
        title: t('ui.success'),
        description: t('company.uploadHint'),
      })
    } catch (error) {
      console.error('File upload failed:', error)
      toast({
        title: t('ui.error'),
        description: error instanceof Error ? error.message : t('ui.uploadFailed'),
        variant: 'destructive'
      })
    }
  }, [companyId, session.access_token, uploadDocumentMutation, toast, t])
  
  // Handle option selection
  const handleOptionToggle = useCallback((value: string) => {
    setSelected(prev => 
      prev.includes(value) 
        ? prev.filter(v => v !== value)
        : [...prev, value]
    )
  }, [])
  
  // Loading state
  if (companyLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>{t('ui.loading')}</span>
        </div>
      </div>
    )
  }
  
  // Error state
  if (companyError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {companyError.message || t('ui.companyDataFetchFailed')}
        </AlertDescription>
      </Alert>
    )
  }
  
  const enrichedData = companyData?.metadata?.enriched_data
  const yearlyData = companyData?.metadata?.financial_data?.yearly || []
  
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Company Summary Card */}
      <Card className="w-full">
        <CardHeader className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-blue-600" />
              <div>
                <CardTitle className="text-lg">{companyData?.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {companyData?.business_id}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!hasLatestStatement && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = '.pdf,.xlsx,.xls'
                    input.onchange = (e) => {
                      const files = (e.target as HTMLInputElement).files
                      if (files) handleFileUpload(files)
                    }
                    input.click()
                  }}
                  disabled={uploadDocumentMutation.isPending}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadDocumentMutation.isPending ? t('company.uploading') : t('company.uploadLatest')}
                </Button>
              )}
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </div>
        </CardHeader>
        
        {expanded && (
          <CardContent className="space-y-4">
            {/* Company Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {enrichedData?.industry && (
                <div>
                  <p className="text-sm font-medium">{t('company.industry')}</p>
                  <p className="text-sm text-muted-foreground">{enrichedData.industry}</p>
                </div>
              )}
              {enrichedData?.employees && (
                <div>
                  <p className="text-sm font-medium">{t('company.employees')}</p>
                  <p className="text-sm text-muted-foreground">{enrichedData.employees}</p>
                </div>
              )}
              {companyData?.created_at && (
                <div>
                  <p className="text-sm font-medium">Perustettu</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(companyData.created_at).getFullYear()}
                  </p>
                </div>
              )}
            </div>
            
            {/* Financial Indicators */}
            {(financialMetrics?.length || yearlyData.length) && (
              <div className="space-y-3">
                <h4 className="font-medium">{t('financial.title')}</h4>
                <div className="flex flex-wrap gap-2">
                  {financialMetrics?.[0]?.revenue && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {t('financial.revenue')}: {financialMetrics[0].revenue.toLocaleString()} €
                    </Badge>
                  )}
                  {financialMetrics?.[0]?.net_profit && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {t('financial.netProfit')}: {financialMetrics[0].net_profit.toLocaleString()} €
                    </Badge>
                  )}
                </div>
                
                {/* Financial Charts */}
                {yearlyFinancialData.length > 0 && (
                  <div className="mt-4">
                    <FinancialChartsDisplay
                      yearlyData={yearlyFinancialData}
                      latestRatios={latestFinancialRatios}
                      isLoading={financialLoading}
                      error={financialError?.message}
                      height={200}
                    />
                  </div>
                )}
              </div>
            )}
            
            {/* Enhanced Analysis Button */}
            <Button
              variant="outline"
              onClick={handleEnhancedAnalysis}
              disabled={enhancedAnalysisMutation.isPending}
              className="w-full"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${enhancedAnalysisMutation.isPending ? 'animate-spin' : ''}`} />
              {enhancedAnalysisMutation.isPending ? t('ui.loading') : 'Päivitä yritystiedot'}
            </Button>
          </CardContent>
        )}
      </Card>
      
      {/* Conversation Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Conversation */}
        <div className="lg:col-span-3 space-y-4">
          {/* Chat History */}
          <Card className="min-h-[400px]">
            <CardContent className="p-4 space-y-4">
              {turns.map((turn) => (
                <div
                  key={turn.id}
                  className={`flex ${turn.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      turn.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{turn.content}</p>
                    {turn.options && turn.options.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {turn.options.map((option, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {option}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {conversationMutation.isPending && (
                <div className="flex justify-start">
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span className="text-sm">{t('chat.thinking')}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={conversationEndRef} />
            </CardContent>
          </Card>
          
          {/* Input Area */}
          {!isConversationDone && question && (
            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-medium">{question}</h3>
                
                {/* Options */}
                {options.length > 0 && (
                  <div className="space-y-2">
                    {options.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={option.value}
                          checked={selected.includes(option.value)}
                          onCheckedChange={() => handleOptionToggle(option.value)}
                        />
                        <label
                          htmlFor={option.value}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Text Input */}
                <div className="space-y-2">
                  <Textarea
                    placeholder={t('chat.placeholder')}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmitMessage()
                      }
                    }}
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSubmitMessage}
                      disabled={(!selected.length && !input.trim()) || conversationMutation.isPending}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {t('chat.send')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Conversation Done */}
          {isConversationDone && (
            <Card>
              <CardContent className="p-4 text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <Lightbulb className="h-5 w-5" />
                  <span className="font-medium">Keskustelu valmis!</span>
                </div>
                
                {recommendation && (
                  <div className="text-left space-y-2">
                    <h4 className="font-medium">Suositus:</h4>
                    <p className="text-sm text-muted-foreground">{recommendation.summary}</p>
                  </div>
                )}
                
                <Button onClick={() => onDone?.(recommendation)} className="w-full">
                  Jatka hakemukseen
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* CFO Assistant Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                {t('chat.cfo.helper')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {cfoGuidance || t('chat.cfo.intro')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
