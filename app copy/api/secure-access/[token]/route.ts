import { NextRequest, NextResponse } from 'next/server'
import { SecureDocumentService } from '@/lib/services/secureDocumentService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  
  try {
    console.log('🔒 [GET] /api/secure-access/[token] - Verifying access for token:', token?.substring(0, 8) + '...')

    // Get client IP address
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    '127.0.0.1'
    
    const userAgent = request.headers.get('user-agent') || 'Unknown'

    // Initialize service
    const secureService = await SecureDocumentService.create()

    // Verify access
    const access = await secureService.verifyAccess(token, clientIP, userAgent)

    // Get application data based on access level
    const applicationData = await secureService.getApplicationData(
      access.application_id,
      access.access_level
    )

    console.log('📊 Application data structure:', {
      hasDocuments: !!applicationData.documents,
      documentsCount: applicationData.documents?.length || 0,
      documentsData: applicationData.documents
    })

    // Return access info and data
    return NextResponse.json({
      access: {
        id: access.id,
        access_level: access.access_level,
        expires_at: access.expires_at,
        downloads_remaining: access.max_downloads - access.download_count,
        recipient_email: access.recipient_email,
        lender_id: access.lender_id
      },
      data: applicationData
    })

  } catch (error: any) {
    console.error('❌ Error verifying secure access:', error)
    
    // Return specific error messages for different scenarios
    if (error.message.includes('Invalid or expired')) {
      return NextResponse.json(
        { error: 'Invalid or expired access token' },
        { status: 403 }
      )
    }
    
    if (error.message.includes('expired')) {
      return NextResponse.json(
        { error: 'Access token has expired' },
        { status: 410 } // Gone
      )
    }
    
    if (error.message.includes('limit exceeded')) {
      return NextResponse.json(
        { error: 'Download limit exceeded' },
        { status: 429 } // Too Many Requests
      )
    }
    
    if (error.message.includes('IP not allowed')) {
      return NextResponse.json(
        { error: 'Access denied from this location' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Access verification failed' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  
  try {
    console.log('📥 [POST] /api/secure-access/[token] - Tracking download for token:', token?.substring(0, 8) + '...')

    const { action } = await request.json()

    if (action !== 'download') {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    // Get client IP address
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    '127.0.0.1'

    // Initialize service and track download
    const secureService = await SecureDocumentService.create()
    await secureService.trackDownload(token, clientIP)

    console.log('✅ Download tracked successfully')
    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('❌ Error tracking download:', error)
    return NextResponse.json(
      { error: 'Failed to track download' },
      { status: 500 }
    )
  }
} 