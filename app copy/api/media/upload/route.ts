import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Initialize Auth Client (using ANON key)
const authClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Initialize Service Role Client (using SERVICE_ROLE key)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: Request) {
  try {
    // Get authorization token from request headers
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    // Verify the token using auth client
    const { data: { user }, error: authError } = await authClient.auth.getUser(authHeader.split(' ')[1])
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get file data from request
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'Missing file' },
        { status: 400 }
      )
    }

    // Generate a unique path for the file
    const fileExt = file.name.split('.').pop()
    const path = `uploads/${user.id}/${Date.now()}-${uuidv4()}.${fileExt}`

    // Upload file to Supabase Storage
    const { error: storageError } = await supabaseAdmin.storage
      .from('media')
      .upload(path, file, {
        upsert: true
      })

    if (storageError) {
      console.error('Storage error:', storageError)
      return NextResponse.json(
        { error: storageError.message },
        { status: 500 }
      )
    }

    // Get the public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('media')
      .getPublicUrl(path)

    // Get file metadata
    const fileSize = file.size
    const mimeType = file.type

    // Create database record
    const { data: dbData, error: dbError } = await supabaseAdmin
      .from('media_assets')
      .insert({
        id: uuidv4(),
        filename: file.name,
        file_size: fileSize,
        mime_type: mimeType,
        storage_path: path,
        original_url: publicUrl,
        user_id: user.id,
        source: 'upload',
        metadata: {
          originalName: file.name
        }
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: dbError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: dbData })
  } catch (err) {
    console.error('Error uploading file:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to upload file' },
      { status: 500 }
    )
  }
} 