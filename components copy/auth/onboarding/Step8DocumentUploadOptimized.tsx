'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  AlertCircle,
  Mail,
  Trash2,
  Download
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { 
  useFundingApplication,
  useOnboardingDocuments,
  useUploadDocument,
  useDeleteDocument
} from '@/hooks/useOnboardingQueries'

// Types
interface Document {
  id: string
  name: string
  type: string
  size: number
  status: 'processing' | 'completed' | 'failed'
  created_at: string
  url?: string
}

interface Step8DocumentUploadOptimizedProps {
  applicationId: string
  companyId: string
  session: any
  currentLocale: string
  onContinue: () => void
  onBack: () => void
}

type RequiredDocStatus = 'loading' | 'missing' | 'found' | 'error'
type EmailSendStatus = 'idle' | 'sending' | 'sent' | 'error'

export default function Step8DocumentUploadOptimized({
  applicationId,
  companyId,
  session,
  currentLocale,
  onContinue,
  onBack,
}: Step8DocumentUploadOptimizedProps) {
  const t = useTranslations('Onboarding')
  const { toast } = useToast()
  
  // UI State
  const [isDragging, setIsDragging] = useState(false)
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('')
  
  // Required documents status
  const [requiredDocsStatus, setRequiredDocsStatus] = useState<{
    lastYearFinancials: RequiredDocStatus
    currentYearDraft: RequiredDocStatus
    collateralDoc: RequiredDocStatus
  }>({
    lastYearFinancials: 'loading',
    currentYearDraft: 'loading',
    collateralDoc: 'loading',
  })
  const [collateralRequired, setCollateralRequired] = useState<boolean>(false)
  
  // Bookkeeper email modal state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [bookkeeperEmail, setBookkeeperEmail] = useState('')
  const [personalMessage, setPersonalMessage] = useState('')
  const [emailSendStatus, setEmailSendStatus] = useState<EmailSendStatus>('idle')
  const [emailSendError, setEmailSendError] = useState<string | null>(null)
  
  // React Query hooks
  const { 
    data: applicationData, 
    isLoading: applicationLoading, 
    error: applicationError 
  } = useFundingApplication(applicationId, session?.access_token)
  
  const { 
    data: documents = [], 
    isLoading: documentsLoading, 
    error: documentsError,
    refetch: refetchDocuments 
  } = useOnboardingDocuments(companyId, session?.access_token)
  
  const uploadDocumentMutation = useUploadDocument()
  const deleteDocumentMutation = useDeleteDocument()
  
  // Document types
  const documentTypes = [
    { value: 'financial_statement', label: 'Tilinpäätös' },
    { value: 'income_statement', label: 'Tuloslaskelma' },
    { value: 'balance_sheet', label: 'Tase' },
    { value: 'cash_flow', label: 'Kassavirtalaskelma' },
    { value: 'tax_return', label: 'Veroilmoitus' },
    { value: 'bank_statement', label: 'Tiliote' },
    { value: 'collateral_document', label: 'Vakuusasiakirja' },
    { value: 'other', label: 'Muu asiakirja' }
  ]
  
  // Check required documents status
  useEffect(() => {
    if (!documents.length) return
    
    const checkDocumentStatus = (docType: string): RequiredDocStatus => {
      const found = documents.some(doc => 
        doc.type === docType && doc.status === 'completed'
      )
      return found ? 'found' : 'missing'
    }
    
    setRequiredDocsStatus({
      lastYearFinancials: checkDocumentStatus('financial_statement'),
      currentYearDraft: checkDocumentStatus('income_statement'),
      collateralDoc: checkDocumentStatus('collateral_document'),
    })
    
    // Check if collateral is required based on application amount
    if (applicationData?.amount && applicationData.amount > 50000) {
      setCollateralRequired(true)
    }
  }, [documents, applicationData])
  
  // Handle file upload
  const handleFileUpload = useCallback(async (files: FileList, docType?: string) => {
    if (!files.length) return
    
    const file = files[0]
    const documentType = docType || selectedDocumentType || 'other'
    
    try {
      await uploadDocumentMutation.mutateAsync({
        file,
        companyId,
        documentType,
        accessToken: session.access_token
      })
      
      toast({
        title: t('ui.success'),
        description: `${file.name} uploaded successfully`,
      })
      
      setSelectedDocumentType('')
    } catch (error) {
      console.error('File upload failed:', error)
      toast({
        title: t('ui.error'),
        description: error instanceof Error ? error.message : t('ui.uploadFailed'),
        variant: 'destructive'
      })
    }
  }, [companyId, session.access_token, selectedDocumentType, uploadDocumentMutation, toast, t])
  
  // Handle file delete
  const handleDeleteDocument = useCallback(async (documentId: string) => {
    try {
      await deleteDocumentMutation.mutateAsync({
        documentId,
        accessToken: session.access_token
      })
      
      toast({
        title: t('ui.success'),
        description: 'Document deleted successfully',
      })
    } catch (error) {
      console.error('Delete failed:', error)
      toast({
        title: t('ui.error'),
        description: error instanceof Error ? error.message : 'Failed to delete document',
        variant: 'destructive'
      })
    }
  }, [session.access_token, deleteDocumentMutation, toast, t])
  
  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length) {
      handleFileUpload(files)
    }
  }, [handleFileUpload])
  
  // Handle bookkeeper email request
  const handleSendBookkeeperEmail = useCallback(async () => {
    if (!bookkeeperEmail.trim()) return
    
    setEmailSendStatus('sending')
    setEmailSendError(null)
    
    try {
      const response = await fetch('/api/onboarding/request-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          companyId,
          applicationId,
          bookkeeperEmail: bookkeeperEmail.trim(),
          personalMessage: personalMessage.trim(),
          locale: currentLocale
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to send email')
      }
      
      setEmailSendStatus('sent')
      toast({
        title: t('ui.success'),
        description: 'Email sent to bookkeeper successfully',
      })
      
      // Close modal after a delay
      setTimeout(() => {
        setIsRequestModalOpen(false)
        setBookkeeperEmail('')
        setPersonalMessage('')
        setEmailSendStatus('idle')
      }, 2000)
      
    } catch (error) {
      console.error('Email send failed:', error)
      setEmailSendStatus('error')
      setEmailSendError(error instanceof Error ? error.message : 'Failed to send email')
    }
  }, [bookkeeperEmail, personalMessage, companyId, applicationId, session.access_token, currentLocale, toast, t])
  
  // Check if can continue
  const canContinue = 
    requiredDocsStatus.lastYearFinancials === 'found' &&
    requiredDocsStatus.currentYearDraft === 'found' &&
    (!collateralRequired || requiredDocsStatus.collateralDoc === 'found')
  
  // Loading state
  if (applicationLoading || documentsLoading) {
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
  if (applicationError || documentsError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {applicationError?.message || documentsError?.message || t('step8.error.fetchSummaryFailed')}
        </AlertDescription>
      </Alert>
    )
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Application Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Hakemuksen yhteenveto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium">Yritys</p>
              <p className="text-sm text-muted-foreground">
                {applicationData?.companies?.name}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Summa</p>
              <p className="text-sm text-muted-foreground">
                {applicationData?.amount?.toLocaleString()} €
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Laina-aika</p>
              <p className="text-sm text-muted-foreground">
                {applicationData?.term_months} kk
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Tyyppi</p>
              <p className="text-sm text-muted-foreground">
                {applicationData?.type}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Required Documents Status */}
      <Card>
        <CardHeader>
          <CardTitle>Vaaditut asiakirjat</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Viime vuoden tilinpäätös</span>
              <div className="flex items-center gap-2">
                {requiredDocsStatus.lastYearFinancials === 'found' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <Badge variant={requiredDocsStatus.lastYearFinancials === 'found' ? 'default' : 'destructive'}>
                  {requiredDocsStatus.lastYearFinancials === 'found' ? 'Löydetty' : 'Puuttuu'}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Kuluvan vuoden tuloslaskelma</span>
              <div className="flex items-center gap-2">
                {requiredDocsStatus.currentYearDraft === 'found' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <Badge variant={requiredDocsStatus.currentYearDraft === 'found' ? 'default' : 'destructive'}>
                  {requiredDocsStatus.currentYearDraft === 'found' ? 'Löydetty' : 'Puuttuu'}
                </Badge>
              </div>
            </div>
            
            {collateralRequired && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Vakuusasiakirja</span>
                <div className="flex items-center gap-2">
                  {requiredDocsStatus.collateralDoc === 'found' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <Badge variant={requiredDocsStatus.collateralDoc === 'found' ? 'default' : 'destructive'}>
                    {requiredDocsStatus.collateralDoc === 'found' ? 'Löydetty' : 'Puuttuu'}
                  </Badge>
                </div>
              </div>
            )}
          </div>
          
          {!canContinue && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Lataa kaikki vaaditut asiakirjat jatkaaksesi hakemusta.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {/* Document Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Lataa asiakirjoja</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Document Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="documentType">Asiakirjan tyyppi</Label>
            <select
              id="documentType"
              value={selectedDocumentType}
              onChange={(e) => setSelectedDocumentType(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Valitse tyyppi...</option>
              {documentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">
              Vedä tiedostoja tähän tai klikkaa valitaksesi
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Tuetut tiedostotyypit: PDF, Excel (.xlsx, .xls)
            </p>
            <Button
              variant="outline"
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = '.pdf,.xlsx,.xls'
                input.multiple = true
                input.onchange = (e) => {
                  const files = (e.target as HTMLInputElement).files
                  if (files) handleFileUpload(files)
                }
                input.click()
              }}
              disabled={uploadDocumentMutation.isPending || !selectedDocumentType}
            >
              {uploadDocumentMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Ladataan...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Valitse tiedostot
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Uploaded Documents */}
      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ladatut asiakirjat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {doc.type} • {(doc.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      doc.status === 'completed' ? 'default' :
                      doc.status === 'processing' ? 'secondary' : 'destructive'
                    }>
                      {doc.status === 'completed' ? 'Valmis' :
                       doc.status === 'processing' ? 'Käsitellään' : 'Virhe'}
                    </Badge>
                    {doc.url && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={doc.url} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDocument(doc.id)}
                      disabled={deleteDocumentMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Bookkeeper Email Request */}
      <Card>
        <CardHeader>
          <CardTitle>Pyydä asiakirjoja kirjanpitäjältä</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Jos sinulla ei ole kaikkia tarvittavia asiakirjoja, voit pyytää niitä kirjanpitäjältäsi.
          </p>
          <Button
            variant="outline"
            onClick={() => setIsRequestModalOpen(true)}
          >
            <Mail className="h-4 w-4 mr-2" />
            Lähetä pyyntö kirjanpitäjälle
          </Button>
        </CardContent>
      </Card>
      
      {/* Bookkeeper Email Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Pyydä asiakirjoja</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bookkeeperEmail">Kirjanpitäjän sähköposti</Label>
                <Input
                  id="bookkeeperEmail"
                  type="email"
                  value={bookkeeperEmail}
                  onChange={(e) => setBookkeeperEmail(e.target.value)}
                  placeholder="kirjanpitaja@yritys.fi"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="personalMessage">Henkilökohtainen viesti (valinnainen)</Label>
                <Textarea
                  id="personalMessage"
                  value={personalMessage}
                  onChange={(e) => setPersonalMessage(e.target.value)}
                  placeholder="Lisätietoja pyyntöön..."
                  rows={3}
                />
              </div>
              
              {emailSendError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{emailSendError}</AlertDescription>
                </Alert>
              )}
              
              {emailSendStatus === 'sent' && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>Sähköposti lähetetty onnistuneesti!</AlertDescription>
                </Alert>
              )}
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsRequestModalOpen(false)}
                  disabled={emailSendStatus === 'sending'}
                >
                  Peruuta
                </Button>
                <Button
                  onClick={handleSendBookkeeperEmail}
                  disabled={!bookkeeperEmail.trim() || emailSendStatus === 'sending'}
                >
                  {emailSendStatus === 'sending' ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Lähetetään...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Lähetä
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Takaisin
        </Button>
        <Button 
          onClick={onContinue} 
          disabled={!canContinue}
        >
          Jatka
        </Button>
      </div>
    </div>
  )
}
