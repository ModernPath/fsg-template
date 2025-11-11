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

export async function GET(request: NextRequest) {
  try {
    // 1. Extract and validate auth token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('[documents/types] Missing or invalid Authorization header');
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    
    // 2. Verify token using auth client
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error('[documents/types] Authentication error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. Fetch all document types (these are system-wide, not company-specific)
    console.log('[documents/types] Fetching document types...');
    const { data: documentTypesData, error: typesError } = await supabaseAdmin
      .from('document_types')
      .select('id, name, description, required_for_analysis')
      .order('name', { ascending: true });

    if (typesError) {
      console.error('[documents/types] Error fetching document types:', typesError);
      return NextResponse.json({ error: 'Error fetching document types' }, { status: 500 });
    }

    console.log(`[documents/types] Found ${documentTypesData.length} document types`);

    // 4. Return the document types
    return NextResponse.json({ 
      status: 'success',
      document_types: documentTypesData,
      message: `Retrieved ${documentTypesData.length} document types`
    });
    
  } catch (error: any) {
    console.error('[documents/types] Server error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 