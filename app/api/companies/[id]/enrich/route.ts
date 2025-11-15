/**
 * POST /api/companies/[id]/enrich
 * 
 * Triggers company enrichment process
 * Creates enrichment job and dispatches to Inngest
 * 
 * Request Body:
 * - modules?: string[] - Specific modules to run (null = all 17)
 * - force?: boolean - Force refresh even if data exists
 * - priority?: 'high' | 'normal' | 'low'
 * 
 * Response:
 * - jobId: UUID - Enrichment job ID for tracking
 * - estimatedDuration: number - Estimated time in seconds
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createServerClient } from '@supabase/ssr';
import { inngest } from '@/lib/inngest-client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params first (Next.js 15 requirement)
    const { id: companyId } = await params;
    
    console.log(`\n🚀 [POST /api/companies/${companyId}/enrich] Starting...`);

    // 1. Authenticate user using request.cookies (NOT await cookies())
    console.log('🔐 Step 1: Getting cookies from request...');
    const allCookies = request.cookies.getAll();
    console.log('🍪 Step 2: Cookies in request:', {
      count: allCookies.length,
      names: allCookies.map(c => c.name),
      hasSbAccessToken: allCookies.some(c => c.name.includes('sb-') && c.name.includes('auth-token')),
      hasSbRefreshToken: allCookies.some(c => c.name.includes('sb-') && c.name.includes('refresh')),
    });
    
    console.log('🔐 Step 3: Creating Supabase client...');
    // Create Supabase client using request.cookies (same as middleware)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      },
    );
    
    console.log('🔐 Step 4: Client created, calling getUser...');
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log('🔐 Step 5: Auth result:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      authError: authError?.message,
      authErrorDetails: authError,
    });

    if (authError || !user) {
      console.error('❌ Authentication failed - No user or auth error');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`✅ User authenticated: ${user.id} (${user.email})`);

    // 2. Parse request body (with error handling for empty body)
    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      console.log('⚠️ No request body, using defaults');
    }
    
    const {
      modules = null,  // null = all modules
      force = false,
      priority = 'normal',
    } = body;

    console.log('📝 Enrichment config:', { modules, force, priority });

    // 3. Verify company exists and user has access
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, business_id, organization_id')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      console.error('❌ Company not found or access denied');
      return NextResponse.json(
        { error: 'Company not found or access denied' },
        { status: 404 }
      );
    }

    console.log(`🏢 Company: ${company.name} (${company.business_id})`);

    // 4. Check if enrichment already in progress
    if (!force) {
      const { data: activeJob } = await supabase
        .from('enrichment_jobs')
        .select('id, status')
        .eq('company_id', companyId)
        .in('status', ['pending', 'processing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeJob) {
        console.log(`⚠️ Enrichment already in progress: ${activeJob.id}`);
        return NextResponse.json({
          success: false,
          error: 'Enrichment already in progress',
          jobId: activeJob.id,
        });
      }
    }

    // 5. Create enrichment job using service role
    const serviceSupabase = await createClient(undefined, true);
    
    const { data: job, error: jobError } = await serviceSupabase
      .from('enrichment_jobs')
      .insert({
        company_id: companyId,
        triggered_by: user.id,
        status: 'pending',
        total_modules: modules ? modules.length : 17,
        config: {
          modules,
          force,
          priority,
        },
      })
      .select()
      .single();

    if (jobError || !job) {
      console.error('❌ Failed to create enrichment job:', jobError);
      return NextResponse.json(
        { error: 'Failed to create enrichment job' },
        { status: 500 }
      );
    }

    console.log(`✅ Enrichment job created: ${job.id}`);

    // 6. Dispatch to Inngest
    try {
      await inngest.send({
        name: 'company/enrichment.requested',
        data: {
          companyId: company.id,
          businessId: company.business_id,
          companyName: company.name,
          jobId: job.id,
          userId: user.id,
          config: {
            modules,
            force,
            priority,
          },
        },
      });

      console.log('✅ Inngest event dispatched');
    } catch (inngestError) {
      console.error('❌ Failed to dispatch Inngest event:', inngestError);
      
      // Mark job as failed
      await serviceSupabase
        .from('enrichment_jobs')
        .update({
          status: 'failed',
          error_message: 'Failed to dispatch background job',
        })
        .eq('id', job.id);

      return NextResponse.json(
        { error: 'Failed to start enrichment process' },
        { status: 500 }
      );
    }

    // 7. Calculate estimated duration (rough estimate)
    const estimatedDuration = modules 
      ? modules.length * 30  // 30 seconds per module
      : 17 * 30;              // ~8.5 minutes for all modules

    // 8. Return success response
    return NextResponse.json({
      success: true,
      jobId: job.id,
      estimatedDuration,
      message: 'Enrichment process started',
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
