/**
 * GET /api/enrichment-jobs/[id]
 * 
 * Retrieves enrichment job status for progress tracking
 * Used by frontend to poll job progress
 * 
 * Response:
 * - status: Job status (pending, processing, completed, failed, partial)
 * - progress: Progress metrics (total/completed/failed modules)
 * - timing: Start, completion, duration
 * - moduleStatus: Detailed status for each module
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`\n📊 [GET /api/enrichment-jobs/${params.id}] Starting...`);

    // 1. Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ Authentication failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobId = params.id;

    // 2. Fetch job details
    const { data: job, error: jobError } = await supabase
      .from('enrichment_jobs')
      .select(`
        *,
        company:companies!enrichment_jobs_company_id_fkey (
          id,
          name,
          business_id
        )
      `)
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      console.error('❌ Job not found or access denied');
      return NextResponse.json(
        { error: 'Job not found or access denied' },
        { status: 404 }
      );
    }

    console.log(`✅ Job found: ${job.id}`);

    // 3. Calculate progress percentage
    const progressPercentage = job.total_modules > 0
      ? Math.round((job.completed_modules / job.total_modules) * 100)
      : 0;

    // 4. Estimate completion time (if still processing)
    let estimatedCompletion = null;
    if (job.status === 'processing' && job.started_at) {
      const elapsedTime = Date.now() - new Date(job.started_at).getTime();
      const avgTimePerModule = job.completed_modules > 0
        ? elapsedTime / job.completed_modules
        : 30000; // 30 seconds default
      
      const remainingModules = job.total_modules - job.completed_modules;
      const estimatedRemainingTime = remainingModules * avgTimePerModule;
      
      estimatedCompletion = new Date(Date.now() + estimatedRemainingTime).toISOString();
    }

    // 5. Get current module (from module_status if available)
    let currentModule = null;
    if (job.status === 'processing' && job.module_status) {
      const moduleStatus = job.module_status as Record<string, any>;
      const processingModules = Object.entries(moduleStatus)
        .filter(([_, status]: [string, any]) => status.status === 'processing')
        .map(([name, _]: [string, any]) => name);
      
      currentModule = processingModules[0] || null;
    }

    // 6. Return response
    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        companyId: job.company_id,
        companyName: job.company?.name,
        status: job.status,
        progress: {
          totalModules: job.total_modules,
          completedModules: job.completed_modules,
          failedModules: job.failed_modules || [],
          currentModule,
          percentage: progressPercentage,
        },
        timing: {
          createdAt: job.created_at,
          startedAt: job.started_at,
          completedAt: job.completed_at,
          duration: job.total_duration_ms,
          estimatedCompletion,
        },
        moduleStatus: job.module_status || {},
        config: job.config || {},
        errorMessage: job.error_message,
      },
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
