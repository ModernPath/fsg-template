/**
 * GET /api/companies/:id/enrichment-status
 * 
 * Get the status of the company's enrichment job
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the latest enrichment job for this company
    const { data: job, error: jobError } = await supabase
      .from('enrichment_jobs')
      .select('*')
      .eq('company_id', params.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (jobError) {
      // No job found is not an error
      if (jobError.code === 'PGRST116') {
        return NextResponse.json({ job: null });
      }
      throw jobError;
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error('[enrichment-status] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enrichment status' },
      { status: 500 }
    );
  }
}

