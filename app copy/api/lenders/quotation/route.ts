import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { LenderService } from '@/lib/services/lenderService';

/**
 * POST /api/lenders/quotation
 * Submits a funding application to a specific lender for quotation
 * Body parameters:
 * - lenderId: ID of the lender to submit to
 * - companyId: ID of the company applying for funding
 * - applicationId: ID of the funding application
 * - userData: User/applicant data
 * - attachments: Array of file attachments
 */
export async function POST(request: Request) {
  try {
    // Log request details
    console.log('\n📝 [POST /api/lenders/quotation]');

    // Validate authorization
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid auth header');
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    // Verify token and get user
    const authClient = createClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser(
      authHeader.split(' ')[1]
    );
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create client for database operations
    const supabase = createClient();

    // Parse request body
    const body = await request.json();
    
    // Validate required parameters
    if (!body.lenderId || !body.companyId || !body.applicationId || !body.userData) {
      console.error('❌ Missing required fields in lender quotation request:', Object.keys(body).join(', '));
      return NextResponse.json(
        { error: 'Missing required fields', details: 'All of lenderId, companyId, applicationId, and userData are required.' },
        { status: 400 }
      );
    }

    if (!body.userData.amount || !body.userData.applicant_national_id) {
      console.error('❌ Missing required fields in userData:', Object.keys(body.userData).join(', '));
      return NextResponse.json(
        { error: 'Missing required userData fields', details: 'Amount and applicant_national_id are required in userData.' },
        { status: 400 }
      );
    }

    // Verify user has access to the company
    const { data: companyAccess, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('id', body.companyId)
      .eq('created_by', user.id)
      .maybeSingle();

    if (companyError) {
      console.error('❌ Company access error:', companyError);
      return NextResponse.json(
        { error: 'Error checking company access' },
        { status: 500 }
      );
    }

    if (!companyAccess) {
      console.error('❌ User does not have access to this company');
      return NextResponse.json(
        { error: 'You do not have access to this company' },
        { status: 403 }
      );
    }

    // Verify funding application exists and belongs to this company
    const { data: application, error: applicationError } = await supabase
      .from('funding_applications')
      .select('id, company_id, user_id')
      .eq('id', body.applicationId)
      .eq('company_id', body.companyId)
      .maybeSingle();

    if (applicationError) {
      console.error('❌ Application error:', applicationError);
      return NextResponse.json(
        { error: 'Error checking application' },
        { status: 500 }
      );
    }

    if (!application) {
      console.error('❌ Application not found or does not belong to this company');
      return NextResponse.json(
        { error: 'Application not found or does not belong to this company' },
        { status: 404 }
      );
    }

    if (application.user_id !== user.id) {
      console.error('❌ User does not own this application');
      return NextResponse.json(
        { error: 'You do not have access to this application' },
        { status: 403 }
      );
    }

    // Initialize lender service and submit quotation
    const lenderService = new LenderService(supabase);
    const result = await lenderService.submitQuotation(
      body.lenderId,
      body.companyId,
      body.applicationId,
      body.userData,
      body.attachments || [],
      body.finalEmail
    );

    if (!result.success) {
      // If the error is related to validation or configuration, return 400
      if (
        result.error?.code === 'LENDER_NOT_FOUND' || 
        result.error?.code === 'UNSUPPORTED_LENDER_TYPE' ||
        result.error?.code === 'MISSING_EMAIL'
      ) {
        return NextResponse.json({ error: result.message, details: result.error }, { status: 400 });
      }

      // If it's a processing or external API error, return 500
      return NextResponse.json({ error: result.message, details: result.error }, { status: 500 });
    }

    // Update application status to submitted
    await supabase
      .from('funding_applications')
      .update({ 
        status: 'submitted',
        submitted_at: new Date().toISOString()
      })
      .eq('id', body.applicationId);

    // Return success
    return NextResponse.json({
      data: result.data,
      message: result.message
    });
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 