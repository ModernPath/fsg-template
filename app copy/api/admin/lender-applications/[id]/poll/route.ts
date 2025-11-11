import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { inngest } from '@/lib/inngest/inngest.client';
import { LenderApplicationService } from '@/lib/services/LenderApplicationService';
import { NextRequest } from 'next/server';

/**
 * POST /api/admin/lender-applications/:id/poll
 * Triggers a manual poll for a specific lender application
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    // Log request details
    console.log(`\n📝 [POST /api/admin/lender-applications/${id}/poll]`);
    
    if (!id) {
      console.error('❌ Missing lender application ID');
      return NextResponse.json(
        { error: 'Missing lender application ID' },
        { status: 400 }
      );
    }
    
    // Create Supabase client
    const supabase = await createClient(true);
    
    // Check if the lender application exists
    // We're in a server component, so we can create the LenderApplicationService
    // without the cookies parameter, since we don't need it for this operation
    const lenderApplicationService = new LenderApplicationService(supabase);
    const lenderApplication = await lenderApplicationService.getLenderApplication(id);
    
    if (!lenderApplication) {
      console.error(`❌ Lender application not found: ${id}`);
      return NextResponse.json(
        { error: 'Lender application not found' },
        { status: 404 }
      );
    }
    
    // Send the manual poll event to Inngest
    await inngest.send({
      name: 'lender/manual-poll',
      data: { lenderApplicationId: id }
    });
    
    console.log(`✅ Manual poll triggered for lender application: ${id}`);
    
    // Return success
    return NextResponse.json({
      success: true,
      message: 'Manual poll triggered successfully',
      lenderApplicationId: id
    });
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 