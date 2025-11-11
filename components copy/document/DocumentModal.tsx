'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/components/auth/AuthProvider'
import { X, Loader2, AlertCircle, ZoomIn, ZoomOut, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { Document, Page, pdfjs } from 'react-pdf'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

interface DocumentModalProps {
  documentId: string
  documentName: string
  isOpen: boolean
  onClose: () => void
}

interface DocumentData {
  id: string
  name: string
  mimeType: string
  fileSize: number
  base64Data: string
}

export default function DocumentModal({ 
  documentId, 
  documentName, 
  isOpen, 
  onClose 
}: DocumentModalProps) {
  const { session } = useAuth()
  const [documentData, setDocumentData] = useState<DocumentData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.0)
  const [pageWidth, setPageWidth] = useState<number>(800)

  const fetchDocumentData = async () => {
    if (!session?.access_token || documentData || loading) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/documents/${documentId}/preview`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch document')
      }

      const data = await response.json()
      if (data.success) {
        setDocumentData(data.document)
      } else {
        throw new Error(data.error || 'Unknown error')
      }
    } catch (err) {
      console.error('Error fetching document:', err)
      setError(err instanceof Error ? err.message : 'Failed to load document')
      toast({
        title: 'Error',
        description: 'Could not load document',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!documentData) return

    try {
      // Create blob from base64 data
      const byteCharacters = atob(documentData.base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'application/pdf' })

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = documentName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: 'Download Started',
        description: `Downloading ${documentName}`,
      })
    } catch (err) {
      console.error('Download error:', err)
      toast({
        title: 'Download Failed',
        description: 'Could not download document',
        variant: 'destructive'
      })
    }
  }

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3.0))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5))
  }

  const handlePrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1))
  }

  const handleNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages))
  }

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setPageNumber(1)
  }

  // Load document when modal opens
  useEffect(() => {
    if (isOpen && !documentData) {
      fetchDocumentData()
    }
  }, [isOpen, documentData])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setDocumentData(null)
      setError(null)
      setPageNumber(1)
      setScale(1.0)
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        handlePrevPage()
      } else if (e.key === 'ArrowRight') {
        handleNextPage()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, pageNumber, numPages])

  // Calculate page width based on screen size
  useEffect(() => {
    const updatePageWidth = () => {
      const screenWidth = window.innerWidth
      const maxWidth = Math.min(screenWidth * 0.8, 900)
      setPageWidth(maxWidth)
    }

    updatePageWidth()
    window.addEventListener('resize', updatePageWidth)
    return () => window.removeEventListener('resize', updatePageWidth)
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-75"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full h-full flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
              {documentName}
            </h2>
            {numPages > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Page {pageNumber} of {numPages}
              </p>
            )}
          </div>
          
          {/* Controls */}
          <div className="flex items-center space-x-2">
            {documentData && (
              <>
                <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={scale <= 0.5}>
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-500 dark:text-gray-400 min-w-12 text-center">
                  {Math.round(scale * 100)}%
                </span>
                <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={scale >= 3.0}>
                  <ZoomIn className="w-4 h-4" />
                </Button>
                
                {numPages > 1 && (
                  <>
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />
                    <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={pageNumber <= 1}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleNextPage} disabled={pageNumber >= numPages}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </>
                )}
                
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="w-4 h-4" />
                </Button>
              </>
            )}
            
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 p-4">
          <div className="flex justify-center">
            {loading && (
              <div className="flex items-center space-x-2 text-gray-500 mt-20">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Loading document...</span>
              </div>
            )}

            {error && (
              <div className="flex items-center space-x-2 text-red-500 mt-20">
                <AlertCircle className="w-6 h-6" />
                <span>Failed to load document: {error}</span>
              </div>
            )}

            {documentData && !loading && !error && (
              <Document
                file={`data:application/pdf;base64,${documentData.base64Data}`}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={(error) => {
                  console.error('PDF load error:', error)
                  setError('Failed to load PDF')
                }}
                loading={
                  <div className="flex items-center space-x-2 text-gray-500 mt-20">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Loading PDF...</span>
                  </div>
                }
                className="max-w-full"
              >
                <Page 
                  pageNumber={pageNumber} 
                  width={pageWidth * scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  loading={
                    <div 
                      className="bg-white border border-gray-200 shadow-lg flex items-center justify-center"
                      style={{ 
                        width: pageWidth * scale, 
                        height: (pageWidth * scale) * 1.414 // A4 aspect ratio
                      }}
                    >
                      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                    </div>
                  }
                />
              </Document>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 