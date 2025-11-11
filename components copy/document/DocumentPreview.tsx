'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/components/auth/AuthProvider'
import { Eye, Loader2, AlertCircle } from 'lucide-react'
import { Document, Page, pdfjs } from 'react-pdf'
import { toast } from '@/components/ui/use-toast'

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

interface DocumentPreviewProps {
  documentId: string
  documentName: string
  mimeType: string
  children: React.ReactNode
  onFullPreview?: () => void
}

interface DocumentData {
  id: string
  name: string
  mimeType: string
  fileSize: number
  base64Data: string
}

export default function DocumentPreview({ 
  documentId, 
  documentName, 
  mimeType, 
  children,
  onFullPreview 
}: DocumentPreviewProps) {
  const { session } = useAuth()
  const [showPreview, setShowPreview] = useState(false)
  const [documentData, setDocumentData] = useState<DocumentData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const timeoutRef = useRef<NodeJS.Timeout>()
  const hoverRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  const isPDF = mimeType === 'application/pdf'

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
        throw new Error('Failed to fetch document preview')
      }

      const data = await response.json()
      if (data.success) {
        setDocumentData(data.document)
      } else {
        throw new Error(data.error || 'Unknown error')
      }
    } catch (err) {
      console.error('Error fetching document preview:', err)
      setError(err instanceof Error ? err.message : 'Failed to load preview')
      toast({
        title: 'Preview Error',
        description: 'Could not load document preview',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (!isPDF) return

    const rect = e.currentTarget.getBoundingClientRect()
    setPosition({
      x: rect.right + 10,
      y: rect.top
    })

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Show preview after delay
    timeoutRef.current = setTimeout(() => {
      setShowPreview(true)
      fetchDocumentData()
    }, 500)
  }

  const handleMouseLeave = () => {
    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Hide preview after short delay (to allow moving to preview)
    setTimeout(() => {
      if (!previewRef.current?.matches(':hover')) {
        setShowPreview(false)
      }
    }, 100)
  }

  const handlePreviewMouseLeave = () => {
    setShowPreview(false)
  }

  const handleClick = () => {
    if (onFullPreview) {
      onFullPreview()
    }
  }

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <>
      <div 
        ref={hoverRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className="relative cursor-pointer inline-block"
      >
        {children}
        {isPDF && (
          <Eye className="inline-block w-4 h-4 ml-1 text-gray-400 hover:text-gold-primary transition-colors" />
        )}
      </div>

      {/* Preview Popup */}
      {showPreview && isPDF && (
        <div
          ref={previewRef}
          onMouseLeave={handlePreviewMouseLeave}
          className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4 max-w-sm"
          style={{
            left: Math.min(position.x, window.innerWidth - 400),
            top: Math.min(position.y, window.innerHeight - 500),
            maxHeight: '400px',
            width: '350px'
          }}
        >
          <div className="mb-2">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {documentName}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              PDF Document Preview
            </p>
          </div>

          <div className="border border-gray-200 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-900 h-64 flex items-center justify-center">
            {loading && (
              <div className="flex items-center space-x-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading preview...</span>
              </div>
            )}

            {error && (
              <div className="flex items-center space-x-2 text-red-500">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Preview failed</span>
              </div>
            )}

            {documentData && !loading && !error && (
              <Document
                file={`data:application/pdf;base64,${documentData.base64Data}`}
                onLoadError={(error) => {
                  console.error('PDF load error:', error)
                  setError('Failed to load PDF')
                }}
                loading={
                  <div className="flex items-center space-x-2 text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Loading PDF...</span>
                  </div>
                }
                className="max-w-full"
              >
                <Page 
                  pageNumber={1} 
                  width={300}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  loading={
                    <div className="w-full h-48 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  }
                />
              </Document>
            )}
          </div>

          <div className="mt-2 text-center">
            <button
              onClick={handleClick}
              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Click to view full document
            </button>
          </div>
        </div>
      )}
    </>
  )
} 