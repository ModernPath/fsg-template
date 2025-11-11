'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import DocumentPreview from '@/components/document/DocumentPreview'
import DocumentModal from '@/components/document/DocumentModal'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { Label } from '@/components/ui/label'
import {
  Search,
  Upload,
  Download,
  Trash2,
  Filter,
  Eye,
  Calendar,
  FileText,
  File,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Plus,
  FileUp,
  Building2
} from 'lucide-react'
import { format } from 'date-fns'
import { fi } from 'date-fns/locale'
import { toast } from '@/components/ui/use-toast'

interface DocumentType {
  id: string
  name: string
  description: string
  required_for_analysis?: boolean
}

interface Document {
  id: string
  name: string
  file_path: string
  file_size: number
  processing_status: 'pending' | 'processing' | 'completed' | 'failed'
  document_type_id?: string
  fiscal_year?: number
  fiscal_period?: string
  uploaded_at: string
  created_at: string
}

interface Company {
  id: string
  name: string
  business_id: string
}

export default function DocumentsPage() {
  const t = useTranslations('Dashboard.Documents')
  const { session } = useAuth()
  const supabase = createClient()

  // State
  const [documents, setDocuments] = useState<Document[]>([])
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [yearFilter, setYearFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'uploaded_at' | 'file_size'>('uploaded_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('')
  const [fiscalYear, setFiscalYear] = useState<string>('')
  const [isDragging, setIsDragging] = useState(false)
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)
  const [selectedDocumentName, setSelectedDocumentName] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Helper function to get localized document type name
  const getDocumentTypeName = useCallback((typeId: string) => {
    // Find the document type by ID
    const type = documentTypes.find(dt => dt.id === typeId)
    if (!type?.name) return typeId
    
    // Try to get localized name from translations using the 'name' field
    const translationKey = `documentTypes.${type.name}`
    try {
      return t(translationKey as any)
    } catch {
      // Fallback to database name if translation doesn't exist
      return type.name
    }
  }, [t, documentTypes])

  // Load data
  const fetchDocuments = useCallback(async () => {
    if (!session?.user || !selectedCompany) return

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('documents')
        .select(`
          id,
          name,
          file_path,
          file_size,
          processing_status,
          document_type_id,
          fiscal_year,
          fiscal_period,
          uploaded_at,
          created_at
        `)
        .eq('company_id', selectedCompany)
        .order('uploaded_at', { ascending: false })

      if (error) throw error

      setDocuments(data || [])
    } catch (err) {
      console.error('Error fetching documents:', err)
      setError(err instanceof Error ? err.message : t('errorLoadingDocuments'))
    } finally {
      setLoading(false)
    }
  }, [session?.user, selectedCompany, supabase, t])

  const fetchDocumentTypes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('document_types')
        .select('*')
        .order('name')

      if (error) throw error

      setDocumentTypes(data || [])
    } catch (err) {
      console.error('Error fetching document types:', err)
    }
  }, [supabase])

  const fetchCompanies = useCallback(async () => {
    if (!session?.user) return

    try {
      // Use user_companies junction table to get user's companies
      const { data, error } = await supabase
        .from('user_companies')
        .select(`
          company_id,
          companies (
            id,
            name,
            business_id
          )
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Extract companies from the junction table result
      const companiesData = data?.map((uc: any) => uc.companies).filter(Boolean) || []
      setCompanies(companiesData as Company[])
      
      // Auto-select first company if none selected
      if (companiesData.length > 0 && !selectedCompany) {
        setSelectedCompany(companiesData[0].id)
      }
    } catch (err) {
      console.error('Error fetching companies:', err)
    }
  }, [session?.user, selectedCompany, supabase])

  useEffect(() => {
    if (session?.user) {
      fetchCompanies()
      fetchDocumentTypes()
    }
  }, [session?.user, fetchCompanies, fetchDocumentTypes])

  useEffect(() => {
    if (selectedCompany) {
      fetchDocuments()
    }
  }, [selectedCompany, fetchDocuments])

  // File upload handling
  const handleFileUpload = async () => {
    if (!uploadFiles.length || !selectedCompany || !selectedDocumentType) {
      toast({
        title: t('error'),
        description: t('selectFileAndType'),
        variant: 'destructive'
      })
      return
    }

    try {
      setUploading(true)

      for (const file of uploadFiles) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('companyId', selectedCompany)
        formData.append('documentTypeId', selectedDocumentType)
        if (fiscalYear) {
          formData.append('fiscalYear', fiscalYear)
        }

        // Get session token for authorization
        const token = session?.access_token
        if (!token) {
          throw new Error('No authentication token available')
        }

        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Upload failed')
        }
      }

      toast({
        title: t('success'),
        description: t('filesUploadedSuccess', { count: uploadFiles.length })
      })

      // Reset upload state
      setUploadFiles([])
      setSelectedDocumentType('')
      setFiscalYear('')
      setShowUploadForm(false)

      // Refresh documents list
      fetchDocuments()
    } catch (err) {
      console.error('Upload error:', err)
      toast({
        title: t('error'),
        description: err instanceof Error ? err.message : t('uploadFailed'),
        variant: 'destructive'
      })
    } finally {
      setUploading(false)
    }
  }


  const handleDownloadDocument = async (documentId: string, fileName: string) => {
    try {
      // Get document details first
      const { data: doc, error: docError } = await supabase
        .from('documents')
        .select('file_path')
        .eq('id', documentId)
        .single() as { data: { file_path: string } | null, error: any }

      if (docError || !doc?.file_path) {
        throw new Error('Document not found')
      }

      // Download file from storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('financial_documents')
        .download(doc.file_path)

      if (downloadError || !fileData) {
        throw new Error('Failed to download file')
      }

      // Create blob and download
      const url = window.URL.createObjectURL(fileData)
      const anchor = window.document.createElement('a')
      anchor.href = url
      anchor.download = fileName
      window.document.body.appendChild(anchor)
      anchor.click()
      window.URL.revokeObjectURL(url)
      window.document.body.removeChild(anchor)

      toast({
        title: t('success'),
        description: t('download')
      })
    } catch (err) {
      console.error('Download error:', err)
      toast({
        title: t('error'),
        description: err instanceof Error ? err.message : t('deleteFailed'),
        variant: 'destructive'
      })
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const token = session?.access_token
      if (!token) {
        throw new Error('No authentication token available')
      }

      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Delete failed')
      }

      toast({
        title: t('success'),
        description: t('documentDeleted')
      })

      fetchDocuments()
    } catch (err) {
      console.error('Delete error:', err)
      toast({
        title: t('error'),
        description: err instanceof Error ? err.message : t('deleteFailed'),
        variant: 'destructive'
      })
    }
  }

  // Drag and drop handling
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.currentTarget === e.target) {
      setIsDragging(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      setUploadFiles(files)
      setShowUploadForm(true)
    }
  }

  // Filter and sort documents
  const filteredAndSortedDocuments = useMemo(() => {
    let filtered = documents.filter(doc => {
      // Search in document name and document type name
      const docTypeName = doc.document_type_id ? getDocumentTypeName(doc.document_type_id).toLowerCase() : ''
      const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           docTypeName.includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || doc.processing_status === statusFilter
      const matchesType = typeFilter === 'all' || doc.document_type_id === typeFilter
      const matchesYear = yearFilter === 'all' || doc.fiscal_year?.toString() === yearFilter

      return matchesSearch && matchesStatus && matchesType && matchesYear
    })

    // Sort documents
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'file_size':
          comparison = (a.file_size || 0) - (b.file_size || 0)
          break
        case 'uploaded_at':
        default:
          comparison = new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime()
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [documents, searchTerm, statusFilter, typeFilter, yearFilter, sortBy, sortOrder, getDocumentTypeName])

  // Get unique years for filter
  const availableYears = useMemo(() => {
    const years = documents
      .map(doc => doc.fiscal_year)
      .filter(year => year !== null && year !== undefined)
      .filter((year, index, self) => self.indexOf(year) === index)
      .sort((a, b) => b - a)
    
    return years
  }, [documents])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Odottaa', variant: 'secondary' as const, icon: Clock, className: 'bg-gray-100 text-gray-800' },
      processing: { label: 'Käsittelyssä', variant: 'secondary' as const, icon: RefreshCw, className: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Valmis', variant: 'secondary' as const, icon: CheckCircle, className: 'bg-green-100 text-green-800' },
      failed: { label: 'Epäonnistui', variant: 'secondary' as const, icon: XCircle, className: 'bg-red-100 text-red-800' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className={`flex items-center gap-1 ${config.className}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleOpenModal = (documentId: string, documentName: string) => {
    setSelectedDocumentId(documentId)
    setSelectedDocumentName(documentName)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedDocumentId(null)
    setSelectedDocumentName('')
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchDocuments} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('refresh')}
          </Button>
          <Button onClick={() => setShowUploadForm(!showUploadForm)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('uploadDocument')}
          </Button>
        </div>
      </div>

      {/* Company Selection */}
      {companies.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {t('selectCompany')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder={t('selectCompany')} />
              </SelectTrigger>
              <SelectContent>
                {companies.map(company => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name} ({company.business_id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Upload Form */}
      {showUploadForm && (
        <Card>
          <CardHeader>
            <CardTitle>{t('uploadNewDocument')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {uploadFiles.length > 0 ? (
                <div className="space-y-2">
                  <FileUp className="h-8 w-8 mx-auto text-green-600" />
                  <div className="text-sm font-medium">
                    {t('filesSelected', { count: uploadFiles.length })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {uploadFiles.map(file => file.name).join(', ')}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <div className="text-sm">
                    {t('dragDropFiles')}{' '}
                    <Button
                      variant="link"
                      className="p-0 h-auto text-white"
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      {t('orClickToSelect')}
                    </Button>
                  </div>
                </div>
              )}
              <input
                id="file-upload"
                type="file"
                multiple
                accept=".pdf,.xlsx,.xls,.doc,.docx"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    setUploadFiles(Array.from(e.target.files))
                  }
                }}
              />
            </div>

            {/* Document Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="document-type">{t('documentType')} *</Label>
              <Select value={selectedDocumentType} onValueChange={setSelectedDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectDocumentType')} />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      {getDocumentTypeName(type.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fiscal Year */}
            <div className="space-y-2">
              <Label htmlFor="fiscal-year">{t('fiscalYear')}</Label>
              <Input
                id="fiscal-year"
                type="number"
                placeholder="2024"
                value={fiscalYear}
                onChange={(e) => setFiscalYear(e.target.value)}
                min={2000}
                max={new Date().getFullYear() + 1}
              />
            </div>

            {/* Upload Button */}
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUploadForm(false)
                  setUploadFiles([])
                  setSelectedDocumentType('')
                  setFiscalYear('')
                }}
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={handleFileUpload}
                disabled={uploading || !uploadFiles.length || !selectedDocumentType}
              >
                {uploading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {uploading ? t('uploading') : t('upload')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t('filtersAndSearch')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="search">{t('search')}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder={t('search')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="status-filter">{t('status')}</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allStatuses')}</SelectItem>
                  <SelectItem value="pending">{t('pending')}</SelectItem>
                  <SelectItem value="processing">{t('processing')}</SelectItem>
                  <SelectItem value="completed">{t('completed')}</SelectItem>
                  <SelectItem value="failed">{t('failed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="type-filter">{t('type')}</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allTypes')}</SelectItem>
                  {documentTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      {getDocumentTypeName(type.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="year-filter">{t('fiscalYear')}</Label>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allYears')}</SelectItem>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="sort">{t('sortBy')}</Label>
              <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                const [field, order] = value.split('-')
                setSortBy(field as 'name' | 'uploaded_at' | 'file_size')
                setSortOrder(order as 'asc' | 'desc')
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uploaded_at-desc">{t('dateNewest')}</SelectItem>
                  <SelectItem value="uploaded_at-asc">{t('dateOldest')}</SelectItem>
                  <SelectItem value="name-asc">{t('nameAZ')}</SelectItem>
                  <SelectItem value="name-desc">{t('nameZA')}</SelectItem>
                  <SelectItem value="file_size-desc">{t('sizeLargest')}</SelectItem>
                  <SelectItem value="file_size-asc">{t('sizeSmallest')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t('documentsCount', { count: filteredAndSortedDocuments.length })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              {t('loading')}
            </div>
          ) : filteredAndSortedDocuments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <div className="text-lg font-medium mb-2">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || yearFilter !== 'all'
                  ? t('noDocumentsFound')
                  : t('noDocumentsYet')
                }
              </div>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || yearFilter !== 'all'
                  ? t('noDocumentsFound')
                  : t('uploadDocumentsPrompt')
                }
              </p>
              {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && yearFilter === 'all' && (
                <Button onClick={() => setShowUploadForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('uploadNewDocument')}
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('name')}</TableHead>
                  <TableHead>{t('type')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead>{t('fiscalYear')}</TableHead>
                  <TableHead>{t('size')}</TableHead>
                  <TableHead>{t('created')}</TableHead>
                  <TableHead>{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <File className="h-4 w-4 text-muted-foreground" />
                        <DocumentPreview
                          documentId={doc.id}
                          documentName={doc.name}
                          mimeType="application/pdf"
                          onFullPreview={() => handleOpenModal(doc.id, doc.name)}
                        >
                          <span className="font-medium">{doc.name}</span>
                        </DocumentPreview>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {doc.document_type_id ? getDocumentTypeName(doc.document_type_id) : t('unknown')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(doc.processing_status)}
                    </TableCell>
                    <TableCell>
                      {doc.fiscal_year ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {doc.fiscal_year}
                          {doc.fiscal_period && ` (${doc.fiscal_period})`}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatFileSize(doc.file_size)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(doc.uploaded_at), 'dd.MM.yyyy HH:mm', { locale: fi })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleOpenModal(doc.id, doc.name)}
                          title={t('view')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDownloadDocument(doc.id, doc.name)}
                          title={t('download')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="text-red-600 hover:text-red-700"
                          title={t('delete')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Document Modal */}
      {selectedDocumentId && (
        <DocumentModal
          documentId={selectedDocumentId}
          documentName={selectedDocumentName}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}