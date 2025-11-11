import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SecureDocumentService } from '@/lib/services/secureDocumentService';
import { createClient } from '@/utils/supabase/server';

const offerSchema = z.object({
  amount: z.number().positive(),
  interest_rate: z.number().min(0),
  term_months: z.number().positive().int(),
  monthly_payment: z.number().positive(),
  total_repayment: z.number().positive(),
  valid_until: z.string().datetime(),
  notes: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const body = await request.json();
    const offerPayload = offerSchema.parse(body);

    const secureService = await SecureDocumentService.create();
    const supabase = await createClient(undefined, true);

    const ipAddress = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    // 1. Verify access token
    const access = await secureService.verifyAccess(token, ipAddress, userAgent);

    if (access.access_level !== 'full') {
      return NextResponse.json(
        { error: 'You do not have permission to submit an offer.' },
        { status: 403 }
      );
    }

    // 2. Fetch the associated lender application
    const { data: lenderApp, error: lenderAppError } = await supabase
      .from('lender_applications')
      .select('id, application_id, lender_id')
      .eq('application_id', access.application_id)
      .eq('lender_id', access.lender_id)
      .single();

    if (lenderAppError || !lenderApp) {
      console.error('Lender application not found for this secure access token:', {
        application_id: access.application_id,
        lender_id: access.lender_id,
        error: lenderAppError,
      });
      return NextResponse.json(
        { error: 'Could not find the original lender application.' },
        { status: 404 }
      );
    }

    // 3. Insert the new offer
    const { data: newOffer, error: offerError } = await supabase
      .from('financing_offers')
      .insert({
        funding_application_id: access.application_id,
        lender_application_id: lenderApp.id,
        lender_id: access.lender_id,
        status: 'offered',
        amount_offered: offerPayload.amount,
        interest_rate: offerPayload.interest_rate,
        loan_term_months: offerPayload.term_months,
        monthly_payment: offerPayload.monthly_payment,
        total_repayment: offerPayload.total_repayment,
        offer_date: new Date().toISOString(),
        raw_offer_data: { 
          source: 'secure_link',
          ...offerPayload
        },
      })
      .select('id')
      .single();

    if (offerError) {
      console.error('Error creating financing offer:', offerError);
      return NextResponse.json(
        { error: 'Failed to save the financing offer.' },
        { status: 500 }
      );
    }

    // 4. Update the lender application status to 'OFFER_RECEIVED'
    await supabase
      .from('lender_applications')
      .update({ status: 'OFFER_RECEIVED', updated_at: new Date().toISOString() })
      .eq('id', lenderApp.id);

    // Log the successful offer submission
    await secureService.logAccess(
      token,
      'offer_submitted',
      access.recipient_email,
      ipAddress,
      `Offer ID: ${newOffer.id}`
    );

    return NextResponse.json({
      success: true,
      message: 'Offer submitted successfully.',
      offerId: newOffer.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid offer data.', details: error.issues }, { status: 400 });
    }
    console.error('Error processing offer submission:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
} 