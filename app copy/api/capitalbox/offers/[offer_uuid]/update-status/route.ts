import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { CapitalBoxLenderService } from '@/lib/services/lenders/CapitalBoxLenderService';
import { z } from 'zod';
import { Database } from '@/types/supabase';
import { NextRequest } from 'next/server';

// Schema for request validation
const updateOfferStatusSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED']),
});

// Initialize auth client for token verification
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
  { params }: { params: Promise<{ offer_uuid: string }> }
) {
  const { offer_uuid } = await params;
  console.log(`[API] Received request to update CapitalBox offer status for UUID: ${offer_uuid}`);

  // 1. Authentication
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    console.error('[API] Missing or invalid auth header');
    return getErrorResponse('Missing or invalid authorization header', 401);
  }
  const token = authHeader.split(' ')[1];

  console.log('[API] Verifying token...');
  const { data: { user }, error: authError } = await authClient.auth.getUser(token);

  if (authError || !user) {
    console.error('[API] Authentication error:', authError);
    return getErrorResponse('Authentication required', 401);
  }
  console.log(`[API] User ${user.id} authenticated.`);

  // 2. Validate request body
  let validatedBody;
  try {
    const body = await request.json();
    validatedBody = updateOfferStatusSchema.parse(body);
    console.log(`[API] Validated request body:`, validatedBody);
  } catch (error) {
    console.error('[API] Invalid request body:', error);
    return getErrorResponse('Invalid request body', 400, JSON.stringify(error));
  }

  const newOfferStatus = validatedBody.status;

  // 3. Initialize Lender Service with admin client
  const capitalBoxLenderService = new CapitalBoxLenderService(supabaseAdmin);

  try {
    // 4. Call CapitalBox API to update offer status
    console.log(`[API] Calling CapitalBoxLenderService.updateOfferStatus for ${offer_uuid} with status ${newOfferStatus}`);
    const cbResponse = await capitalBoxLenderService.updateOfferStatus(offer_uuid, newOfferStatus);

    if (!cbResponse.success || !cbResponse.data) {
      console.error('[API] CapitalBox API updateOfferStatus failed:', cbResponse.error);
      return getErrorResponse(
        'Failed to update offer status with CapitalBox', 
        502, // Bad Gateway - error communicating with upstream service
        JSON.stringify(cbResponse.error)
      );
    }
    console.log('[API] CapitalBox API updateOfferStatus successful:', cbResponse.data);

    // 5. Update our local financing_offers table
    console.log(`[DB] Updating financing_offers for lender_offer_reference ${offer_uuid} to status ${newOfferStatus.toLowerCase()}`);
    const { data: updatedOffer, error: updateOfferError } = await supabaseAdmin
      .from('financing_offers')
      .update({ 
        status: newOfferStatus.toLowerCase(), // e.g., 'accepted' or 'rejected'
        updated_at: new Date().toISOString(),
      })
      .eq('lender_offer_reference', offer_uuid)
      .select('id, lender_application_id')
      .single();
    
    if (updateOfferError) {
      console.error('[API] Failed to update financing_offer status:', updateOfferError);
      // Continue execution - don't return error since the CapitalBox API call succeeded
    } else {
      console.log('[API] Updated financing_offer status:', updatedOffer);
      
      // 6. Also update lender_application status if the offer was accepted
      if (newOfferStatus === 'ACCEPTED' && updatedOffer?.lender_application_id) {
        console.log(`[DB] Updating lender_application ${updatedOffer.lender_application_id} status to 'accepted'`);
        const { error: updateLenderAppError } = await supabaseAdmin
          .from('lender_applications')
          .update({
            status: 'accepted',
            updated_at: new Date().toISOString(),
          })
          .eq('id', updatedOffer.lender_application_id);
          
        if (updateLenderAppError) {
          console.error('[API] Failed to update lender_application status:', updateLenderAppError);
        } else {
          console.log('[API] Updated lender_application status');
        }
      }
    }
    
    // 7. Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'Offer status updated successfully with CapitalBox',
      data: { ...cbResponse.data } 
    });

  } catch (error: any) {
    console.error('[API] Error updating offer status:', error);
    return getErrorResponse('Failed to update offer status', 500, error.message);
  }
} 