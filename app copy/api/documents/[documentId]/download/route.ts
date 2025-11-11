import { NextRequest, NextResponse } from 'next/server'
import { SecureDocumentService } from '@/lib/services/secureDocumentService'
import { createClient } from '@/utils/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  
  if (!token) {
    return NextResponse.json(
      { error: 'Access token required' },
      { status: 401 }
    )
  }

  try {
    console.log('📥 [GET] /api/documents/[documentId]/download - Downloading document:', documentId)

    // Get client IP address
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    '127.0.0.1'
    
    const userAgent = request.headers.get('user-agent') || 'Unknown'

    // Initialize secure service and verify access
    const secureService = await SecureDocumentService.create()
    const access = await secureService.verifyAccess(token, clientIP, userAgent)

    // Check if access level allows document downloads
    if (access.access_level !== 'full') {
      return NextResponse.json(
        { error: 'Insufficient access level for document download' },
        { status: 403 }
      )
    }

    // Get document from database
    const supabase = await createClient(undefined, true)
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('funding_application_id', access.application_id)
      .single()

    if (docError || !document) {
      console.error('Document not found or access denied:', docError)
      return NextResponse.json(
        { error: 'Document not found or access denied' },
        { status: 404 }
      )
    }

    // Get file from storage
    const { data: fileData, error: storageError } = await supabase.storage
      .from('financial-documents')
      .download(document.file_path)

    if (storageError || !fileData) {
      console.error('Error downloading file from storage:', storageError)
      return NextResponse.json(
        { error: 'File not found in storage' },
        { status: 404 }
      )
    }

    // Track the download
    await secureService.trackDownload(token, clientIP)

    // Return file with appropriate headers
    const response = new NextResponse(fileData, {
      status: 200,
      headers: {
        'Content-Type': document.mime_type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${document.name}"`,
        'Content-Length': fileData.size.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

    console.log('✅ Document downloaded successfully:', document.name)
    return response

  } catch (error: any) {
    console.error('❌ Error downloading document:', error)
    
    if (error.message.includes('Invalid or expired')) {
      return NextResponse.json(
        { error: 'Invalid or expired access token' },
        { status: 403 }
      )
    }
    
    if (error.message.includes('expired')) {
      return NextResponse.json(
        { error: 'Access token has expired' },
        { status: 410 }
      )
    }
    
    if (error.message.includes('limit exceeded')) {
      return NextResponse.json(
        { error: 'Download limit exceeded' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to download document' },
      { status: 500 }
    )
  }
} 