import { NextResponse } from 'next/server';
// import { createClient } from '@/lib/supabase/server'; // Remove this if it uses cookies
import { createClient } from '@supabase/supabase-js'; // Use standard JS client
import { QredLenderService } from '@/lib/services/lenders/QredLenderService';
import { Database } from '@/types/supabase';
import { NextRequest } from 'next/server';

// --- FIX: Initialize separate clients --- 
// Auth client for token verification
const authClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Service role client for database operations
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
// --- END FIX ---

// Helper function for consistent error responses
function getErrorResponse(
  message: string,
  status: number = 500,
  details?: string
) {
  console.error(`❌ API Error (${status}): ${message}`, { details });
  return NextResponse.json(
    { error: message, details: process.env.NODE_ENV === 'development' ? details : undefined },
    { status }
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ offerId: string }> }
) {
  const { offerId } = await params;
  console.log(`\n📝 [POST /api/offers/${offerId}/accept] - Attempting to accept offer`);

  // --- FIX: Use authClient for user verification --- 
  // 1. --- Authentication & Authorization ---
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid auth header');
      return getErrorResponse('Missing or invalid authorization header', 401);
  }
  const token = authHeader.split(' ')[1];

  console.log('🔑 Verifying token...');
  const { data: { user }, error: authError } = await authClient.auth.getUser(token);
   // --- END FIX ---

   if (authError || !user) {
     console.error('❌ Authentication error:', authError);
     return getErrorResponse('Authentication required', 401);
   }
   console.log('✅ User authenticated:', user.id);

  try {
    // 2. --- Fetch Offer and Related Lender Application ---
    console.log(`🔍 Fetching financing offer and related lender application: ${offerId}`);
    const { data: offerData, error: offerError } = await supabaseAdmin
      .from('financing_offers')
      // FIX: Select offer and only the related lender_application record
      .select('*, lender_applications!inner(*)') 
      .eq('id', offerId)
      .maybeSingle();

    if (offerError) {
      console.error('❌ Error fetching financing offer:', offerError);
      return getErrorResponse('Failed to fetch financing offer', 500, offerError.message);
    }
    if (!offerData) {
      console.log('❌ Offer not found.');
      return getErrorResponse('Financing offer not found', 404);
    }

    // Nested data access requires careful handling 
    const offer = offerData;
    const lenderApplication = offer.lender_applications;
    if (!lenderApplication) {
        return getErrorResponse('Lender application data missing for this offer', 500, 'Missing related lender_applications record');
    }
    
    // --- FIX: Fetch Lender separately using lender_id --- 
    console.log(`🔍 Fetching lender details for lender_id: ${lenderApplication.lender_id}`);
    const { data: lender, error: lenderError } = await supabaseAdmin
      .from('lenders')
      .select('id, type')
      .eq('id', lenderApplication.lender_id) // Use lender_id from the fetched application
      .maybeSingle();

    if (lenderError) {
      console.error('❌ Error fetching lender details:', lenderError);
      return getErrorResponse('Failed to fetch lender details', 500, lenderError.message);
    }
    if (!lender) {
      console.log(`❌ Lender not found for ID: ${lenderApplication.lender_id}`);
      return getErrorResponse('Lender data missing for this offer', 500, 'Missing related lenders record');
    }
    // --- END FIX ---

    // Authorization Check (using offer.funding_application_id)
    const { data: appCheck, error: appCheckError } = await supabaseAdmin
      .from('funding_applications')
      .select('id')
      .eq('id', offer.funding_application_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (appCheckError || !appCheck) {
        console.error(`❌ Authorization failed. User ${user.id} does not own application associated with offer ${offerId}.`, appCheckError);
        return getErrorResponse('Forbidden', 403);
    }
    console.log('✅ Authorization successful. User owns the application.');

    // Check if offer is already accepted or in a non-acceptable state
    if (offer.status !== 'offered') {
      console.warn(`⚠️ Offer ${offerId} is not in 'offered' state (current: ${offer.status}). Cannot accept.`);
      return getErrorResponse(`Offer cannot be accepted in its current state: ${offer.status}`, 400);
    }

    const lenderType = lender.type; // Use the separately fetched lender type
    const lenderReference = lenderApplication.lender_reference;

    console.log(`ℹ️ Offer details: Lender Type = ${lenderType}, Lender Reference = ${lenderReference}`);

    // 3. --- Check if Lender is Qred ---
    if (lenderType !== 'qred') {
      console.warn(`⚠️ Offer ${offerId} is from lender '${lenderType}', not 'qred'. Acceptance via this endpoint is not supported.`);
      return getErrorResponse(`Acceptance for lender type '${lenderType}' is not supported via this endpoint.`, 400);
    }

    if (!lenderReference) {
       return getErrorResponse('Missing lender reference ID for Qred application.', 500, 'lender_applications.lender_reference is null');
    }

    // 4. --- Call Qred Service to Accept ---
    console.log(`🚀 Attempting to accept Qred pre-offer with reference: ${lenderReference}`);
    // Pass supabaseAdmin to the service if it needs to perform DB ops
    const qredService = new QredLenderService(supabaseAdmin);
    const acceptanceResponse = await qredService.acceptPreOfferBid(lenderReference);

    console.log('✅ Qred API Response:', acceptanceResponse);

    // 5. --- Handle Response and Update Database ---
    if (acceptanceResponse.success && acceptanceResponse.data?.reference) {
      console.log(`✅ Qred pre-offer ${lenderReference} accepted successfully. New application ID: ${acceptanceResponse.data.reference}`);

      // Update financing_offers status
      const { error: offerUpdateError } = await supabaseAdmin
        .from('financing_offers')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', offerId);

      if (offerUpdateError) {
        console.error('❌ Failed to update financing offer status after acceptance:', offerUpdateError);
        // Log error but proceed, as Qred acceptance was successful
      } else {
         console.log(`✅ Financing offer ${offerId} status updated to 'accepted'.`);
      }

      // Optionally update lender_applications status (Qred status might update via webhook/polling later)
      const { error: lenderAppUpdateError } = await supabaseAdmin
        .from('lender_applications')
        .update({ status: 'accepted', updated_at: new Date().toISOString() }) // Reflect our action
        .eq('id', lenderApplication.id);

       if (lenderAppUpdateError) {
         console.error('❌ Failed to update lender application status after acceptance:', lenderAppUpdateError);
       } else {
         console.log(`✅ Lender application ${lenderApplication.id} status updated to 'accepted'.`);
       }

      return NextResponse.json({
        success: true,
        message: 'Qred offer accepted successfully.',
        qredApplicationId: acceptanceResponse.data.reference // Return the new Qred ID
      });

    } else {
      console.error('❌ Failed to accept Qred pre-offer bid:', acceptanceResponse.error);
      // Attempt to update status to reflect failure? Or leave as 'offered'?
      // For now, return error without changing DB status.
      return getErrorResponse(
        `Failed to accept offer via Qred API: ${acceptanceResponse.message}`,
        502, // Bad Gateway - error communicating with upstream service
        JSON.stringify(acceptanceResponse.error)
      );
    }

  } catch (error: any) {
    console.error('❌ Unexpected error accepting offer:', error);
    return getErrorResponse('An unexpected error occurred while accepting the offer.', 500, error.message);
  }
} 