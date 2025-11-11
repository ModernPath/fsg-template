import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service role client for admin access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Auth client for user verification
const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Download document (Admin only)
 * GET /api/admin/documents/[documentId]/download
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    // 0. Await params (Next.js 15)
    const { documentId } = await params;
    
    // 1. Verify admin access
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // 2. Get document details
    const { data: document, error: docError } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      console.error('Document not found:', docError);
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    if (!document.file_path) {
      return NextResponse.json(
        { error: 'Document file path not available' },
        { status: 404 }
      );
    }

    // 3. Download file from Supabase Storage
    const { data: fileData, error: storageError } = await supabaseAdmin.storage
      .from('financial_documents')
      .download(document.file_path);

    if (storageError || !fileData) {
      console.error('Error downloading file:', storageError);
      return NextResponse.json(
        { error: `Failed to download file: ${storageError?.message}` },
        { status: 500 }
      );
    }

    // 4. Convert Blob to ArrayBuffer
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 5. Set appropriate headers for file download
    const headers = new Headers();
    headers.set('Content-Type', document.mime_type || 'application/octet-stream');
    
    // Encode filename properly for Unicode characters (ääkköset)
    // Use RFC 5987 encoding: filename (ASCII fallback) + filename* (UTF-8 encoded)
    const encodedFilename = encodeURIComponent(document.name);
    const asciiFilename = document.name.replace(/[^\x00-\x7F]/g, '_'); // Replace non-ASCII with underscore
    headers.set('Content-Disposition', `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`);
    
    headers.set('Content-Length', buffer.length.toString());
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    // 6. Return file as response
    return new NextResponse(buffer, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Error in download route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

