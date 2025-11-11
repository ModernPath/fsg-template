import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Initialize Auth Client (using ANON key)
const authClient = createSupabaseClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Initialize Service Role Client (using SERVICE_ROLE key)
const supabaseAdmin = createSupabaseClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;
  try {
    console.log('📝 [DELETE /api/documents/[documentId]]', { documentId })

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      )
    }

    // 1. Extract Bearer Token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid auth header')
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]

    // 2. Verify Token using Auth Client
    console.log('🔑 Verifying user token...')
    const { data: { user }, error: authError } = await authClient.auth.getUser(token)
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('✅ User authenticated:', user.id)

    // 3. Get the document to check ownership and get file path using service role client
    console.log('📊 Fetching document...')
    const { data: document, error: fetchError } = await supabaseAdmin
      .from('financial_documents')
      .select(`
        id,
        file_path,
        companies!inner(
          user_id
        )
      `)
      .eq('id', documentId)
      .single()

    if (fetchError || !document) {
      console.error('❌ Document not found:', fetchError)
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // 4. Check if user owns this document through the company
    if ((document.companies as any).user_id !== user.id) {
      console.error('❌ User does not own this document')
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // 5. Delete the file from storage if it exists
    if (document.file_path) {
      console.log('🗑️ Deleting file from storage:', document.file_path)
      const { error: storageError } = await supabaseAdmin.storage
        .from('financial_documents')
        .remove([document.file_path])
      
      if (storageError) {
        console.error('❌ Error deleting file from storage:', storageError)
        // Continue with database deletion even if storage deletion fails
      } else {
        console.log('✅ File deleted from storage')
      }
    }

    // 6. Delete the document record from database
    console.log('🗑️ Deleting document from database...')
    const { error: deleteError } = await supabaseAdmin
      .from('financial_documents')
      .delete()
      .eq('id', documentId)

    if (deleteError) {
      console.error('❌ Error deleting document from database:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete document' },
        { status: 500 }
      )
    }

    console.log('✅ Document deleted successfully')
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('❌ Delete document error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;
  
  try {
    const supabase = await createClient()

    const { data: document, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (error || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(document)
  } catch (error) {
    console.error('Error fetching document:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 