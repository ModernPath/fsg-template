import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;
  
  try {
    console.log(`🔍 [GET] /api/documents/${documentId}/preview`);

    // Create Supabase client
    const supabase = createClient();

    // First, fetch the document to check permissions and get the file path
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (documentError) {
      console.error('❌ Error fetching document:', documentError);
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    if (!document.file_path) {
      console.error('❌ Document has no file path');
      return NextResponse.json(
        { error: 'Document file not found' },
        { status: 404 }
      );
    }

    console.log(`📄 Document found: ${document.name}`);

    // Get the file from storage
    const { data: fileData, error: fileError } = await supabase.storage
      .from('financial-documents')
      .download(document.file_path);

    if (fileError) {
      console.error('❌ Error downloading file:', fileError);
      return NextResponse.json(
        { error: 'Failed to retrieve document file' },
        { status: 500 }
      );
    }

    console.log(`✅ File downloaded successfully`);

    // Convert the file to base64 for preview
    const buffer = await fileData.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    return NextResponse.json({
      document: {
        id: document.id,
        name: document.name,
        content_type: document.content_type,
        size: document.size,
        base64_content: base64
      }
    });
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 