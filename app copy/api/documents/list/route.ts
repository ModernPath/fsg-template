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
      console.error('Missing or invalid Authorization header');
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    
    // 2. Verify token using auth client
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. Get query parameters
    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId');
    
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    // 4. Verify the user has access to this company
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({ error: 'Error fetching profile' }, { status: 500 });
    }

    if (profileData.company_id !== companyId) {
      console.error('User does not have access to this company');
      return NextResponse.json({ error: 'Not authorized to access this company' }, { status: 403 });
    }

    // 5. Fetch documents for the company using service role client (bypasses RLS)
    console.log(`Fetching documents for company: ${companyId}`);
    const { data: documentsData, error: documentsError } = await supabaseAdmin
      .from('documents')
      .select(`
        *,
        document_types:document_type_id (
          id,
          name,
          description,
          is_system_generated,
          required_for_analysis
        )
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (documentsError) {
      console.error('Error fetching documents:', documentsError);
      return NextResponse.json({ error: 'Error fetching documents' }, { status: 500 });
    }

    console.log(`Found ${documentsData.length} documents`);

    // 6. Return the documents
    return NextResponse.json({ 
      status: 'success',
      data: documentsData,
      message: `Retrieved ${documentsData.length} documents`
    });
    
  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 