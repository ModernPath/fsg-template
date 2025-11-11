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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  console.log('GET /api/funding-applications/[id] called with ID:', id);

  try {
    // 1. Verify authentication & get user via Token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid auth header');
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }
    const token = authHeader.split(' ')[1];
    
    console.log('🔑 Verifying token...');
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('✅ User authenticated:', user.id);

    // 2. Fetch the specific application
    console.log('📊 Fetching application:', params.id);
    const { data: application, error: queryError } = await supabaseAdmin
      .from('funding_applications')
      .select(`
        *,
        companies!funding_applications_company_id_fkey(
          name,
          business_id
        ),
        financing_needs!funding_applications_funding_recommendation_id_fkey(
          id,
          purpose,
          requirements
        )
      `)
      .eq('id', params.id)
      .eq('user_id', user.id) // Ensure user can only access their own applications
      .single();

    if (queryError) {
      console.error('❌ Database query error:', queryError);
      if (queryError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Application not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: `Database error: ${queryError.message}` },
        { status: 500 }
      );
    }

    // 3. Return the application
    console.log('✅ Application found:', application.id);
    return NextResponse.json(application);

  } catch (error: any) {
    console.error('❌ Unexpected error in GET /api/funding-applications/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'An internal server error occurred' },
      { status: 500 }
    );
  }
} 