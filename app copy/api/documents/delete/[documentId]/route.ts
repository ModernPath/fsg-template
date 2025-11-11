import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service role client that bypasses RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Auth client for token verification
const authClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;
    
    // 1. Extract and validate auth token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('Missing or invalid Authorization header');
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    console.log('Token received, verifying...');
    
    // 2. Verify token using auth client
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('User authenticated:', user.id);
    
    // 3. Get request body for file path
    const body = await request.json();
    const { filePath } = body;
    
    // 4. Get document details to verify ownership
    const { data: document, error: docError } = await supabaseAdmin
      .from('documents')
      .select('id, company_id, file_path, companies!inner(created_by)')
      .eq('id', documentId)
      .single();
      
    if (docError || !document) {
      console.error('Document not found or error:', docError);
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    
    // 5. Verify user owns the company or is admin
    const companyCreatedBy = (document.companies as any).created_by;
    if (companyCreatedBy !== user.id) {
      // Check if user is admin
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
        
      if (!profile?.is_admin) {
        console.error('User tried to delete document from company they do not own');
        return NextResponse.json({ error: 'You do not have permission to delete this document' }, { status: 403 });
      }
    }
    
    // 6. Delete from storage first (if file path is provided)
    const filePathToDelete = filePath || document.file_path;
    if (filePathToDelete) {
      const { error: storageError } = await supabaseAdmin.storage
        .from('financial_documents')
        .remove([filePathToDelete]);
        
      if (storageError) {
        console.error('Error deleting from storage:', storageError);
        // Continue with database deletion even if storage deletion fails
      } else {
        console.log('File deleted from storage:', filePathToDelete);
      }
    }
    
    // 7. Delete from database
    const { error: deleteError } = await supabaseAdmin
      .from('documents')
      .delete()
      .eq('id', documentId);
      
    if (deleteError) {
      console.error('Error deleting from database:', deleteError);
      return NextResponse.json({ error: `Error deleting document: ${deleteError.message}` }, { status: 500 });
    }
    
    console.log('Document deleted successfully:', documentId);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Document deleted successfully'
    }, { status: 200 });
    
  } catch (error) {
    console.error('Unhandled error in document delete API:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}

// Prevent CSRF attacks
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
} 