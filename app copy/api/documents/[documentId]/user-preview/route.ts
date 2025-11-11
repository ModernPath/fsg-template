import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;
    
    // 1. Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get document details and verify ownership
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select(`
        *,
        companies!inner(
          id,
          created_by
        )
      `)
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      console.error('Document not found:', docError);
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check if user owns this document through the company
    if (document.companies.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    if (!document.file_path) {
      return NextResponse.json(
        { error: 'Document file not available' },
        { status: 404 }
      );
    }

    // 3. Download file from Supabase Storage
    const { data: fileData, error: storageError } = await supabase.storage
      .from('financial_documents')
      .download(document.file_path);

    if (storageError || !fileData) {
      console.error('Error downloading file:', storageError);
      return NextResponse.json(
        { error: `Failed to download file: ${storageError?.message}` },
        { status: 500 }
      );
    }

    // 4. Return file with appropriate headers for preview
    const headers = new Headers();
    headers.set('Content-Type', document.mime_type || 'application/octet-stream');
    headers.set('Content-Disposition', `inline; filename="${document.name}"`);
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    return new NextResponse(fileData, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Error in user document preview route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
