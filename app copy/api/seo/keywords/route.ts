import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

export async function GET(request: NextRequest) {
  try {
    // Get authorization token from request headers
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    // Verify token using auth client
    const { data: { user }, error: authError } = await authClient.auth.getUser(authHeader.split(' ')[1])
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Use service role client for database operations
    const supabase = supabaseAdmin;

    // Fetch all keywords for the user's projects
    const { data: keywords, error } = await supabase
      .from('keyword_research')
      .select(`
        id,
        keyword,
        search_volume,
        cpc,
        competition,
        difficulty,
        search_intent,
        created_at,
        seo_projects!inner (
          id,
          name,
          domain,
          user_id
        )
      `)
      .eq('seo_projects.user_id', user.id)
      .order('search_volume', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching keywords:', error);
      return NextResponse.json(
        { error: 'Failed to fetch keywords' },
        { status: 500 }
      );
    }

    // Transform the data to include project info
    const transformedKeywords = (keywords || []).map(keyword => {
      const project = Array.isArray(keyword.seo_projects) ? keyword.seo_projects[0] : keyword.seo_projects;
      return {
        id: keyword.id,
        keyword: keyword.keyword,
        search_volume: keyword.search_volume,
        cpc: keyword.cpc,
        competition: keyword.competition,
        difficulty: keyword.difficulty,
        search_intent: keyword.search_intent,
        created_at: keyword.created_at,
        project: {
          id: project?.id,
          name: project?.name,
          domain: project?.domain
        }
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedKeywords,
    }, { status: 200 });

  } catch (error) {
    console.error('Error in GET /api/seo/keywords:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 