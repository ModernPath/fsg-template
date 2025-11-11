import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'; // Corrected path
import { CapitalBoxLenderService } from '@/lib/services/lenders/CapitalBoxLenderService'; // Import CapitalBoxLenderService
// Import refactored DB helper functions
import {
  updateLenderApplicationStatusInDb,
  addOffersToDatabaseInDb
} from '@/lib/services/CapitalBoxProcessingService';
import crypto from 'crypto'; // Keep for now if used elsewhere, or remove if only for simulation

// Environment variable for the webhook secret
const CAPITAL_BOX_WEBHOOK_SECRET = process.env.CAPITAL_BOX_WEBHOOK_SECRET;

// --- Supabase Helper Functions ---

async function fetchCapitalBoxOffers(applicationUuid: string): Promise<any[]> {
  console.log(`📞 Fetching offers from Capital Box for application UUID: ${applicationUuid}`);
  // --- Placeholder for Capital Box API Client ---
  // 1. Initialize Capital Box API client (needs credentials from ENV)
  // 2. Call GET /offers/{application_uuid}/
  // 3. Handle response/errors
  // 4. Return parsed offers array
  // Example: const offers = await capitalBoxApiClient.getOffers(applicationUuid);
  // --- End Placeholder ---

  // Simulate fetching offers for now
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
  console.warn("⚠️ Simulated fetching offers. Implement actual Capital Box API call.");
  // Return dummy data matching roughly the OpenAPI spec structure
  return [
    { offer_uuid: crypto.randomUUID(), product: 'IL', term: 12, principalAmount: 10000, monthlyFee: 2.5, status: 'pending' },
    { offer_uuid: crypto.randomUUID(), product: 'CL', term: 24, principalAmount: 15000, monthlyFee: 1.8, status: 'pending' }
  ];
}

// --- End Supabase Helper Functions ---

/**
 * Capital Box Webhook Handler
 *
 * This endpoint receives webhook events from Capital Box.
 * It validates the incoming request using a bearer token and processes the event.
 */
export async function POST(request: NextRequest) {
  console.log('Received Capital Box Webhook request');
  const supabaseClient = createClient(true); // Create client once for the request

  const requestClone = request.clone();
  try {
    const body = await requestClone.json();
    console.log('📥 Capital Box Webhook Body:', JSON.stringify(body, null, 2));
  } catch (error) {
    try {
      const textBody = await requestClone.text();
      console.log('📥 Capital Box Webhook Body (non-JSON):', textBody);
    } catch (textError) {
      console.error('❌ Error reading Capital Box webhook body as JSON or text:', error, textError);
    }
  }

  const authHeader = request.headers.get('Authorization');
  const expectedToken = `Bearer ${CAPITAL_BOX_WEBHOOK_SECRET}`;

  if (!CAPITAL_BOX_WEBHOOK_SECRET) {
    console.error('❌ CAPITAL_BOX_WEBHOOK_SECRET environment variable is not set.');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  if (!authHeader || authHeader !== expectedToken) {
    console.error('❌ Invalid or missing Authorization header.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('✅ Authorization successful.');

  try {
    const payload = await request.json();
    console.log('🔔 Capital Box Webhook Payload:', JSON.stringify(payload, null, 2));

    const { event, uuid, timestamp } = payload;

    if (!event || !uuid) {
       console.error('❌ Invalid webhook payload: missing event or uuid.');
       return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const lenderApplicationReference = uuid;
    const capitalBoxLenderService = new CapitalBoxLenderService(supabaseClient);

    switch (event) {
      case 'applicationReceived':
        console.log(`Processing applicationReceived event for UUID: ${lenderApplicationReference}`);
        await updateLenderApplicationStatusInDb(supabaseClient, lenderApplicationReference, 'submitted');
        break;
      case 'applicationDeclined':
        console.log(`Processing applicationDeclined event for UUID: ${lenderApplicationReference}`);
        try {
          await updateLenderApplicationStatusInDb(supabaseClient, lenderApplicationReference, 'rejected');
          // Also set next_poll_at to null to stop polling
          const { error: updateError } = await supabaseClient
            .from('lender_applications')
            .update({ next_poll_at: null })
            .eq('lender_reference', lenderApplicationReference);
          
          if (updateError) {
            console.error(`Failed to update next_poll_at for declined application ${lenderApplicationReference}:`, updateError);
          } else {
            console.log(`Successfully marked application ${lenderApplicationReference} as rejected and stopped polling`);
          }
        } catch (error) {
          console.error(`Error processing applicationDeclined for ${lenderApplicationReference}:`, error);
          throw error;
        }
        break;
      case 'offersCreated':
        console.log(`Processing offersCreated event for UUID: ${lenderApplicationReference}`);
        try {
          // First check if offers already exist for this lender_reference
          const { data: lenderApp, error: lenderAppError } = await supabaseClient
            .from('lender_applications')
            .select('id')
            .eq('lender_reference', lenderApplicationReference)
            .single();

          if (lenderAppError) {
            console.error(`❌ Error fetching lender application for ${lenderApplicationReference}:`, lenderAppError);
            return NextResponse.json({ error: 'Failed to find lender application record' }, { status: 404 });
          }

          // Check if offers already exist
          const { data: existingOffers, error: existingOffersError } = await supabaseClient
            .from('financing_offers')
            .select('id, lender_offer_reference')
            .eq('lender_application_id', lenderApp.id);

          if (!existingOffersError && existingOffers && existingOffers.length > 0) {
            console.log(`ℹ️ ${existingOffers.length} offers already exist for Capital Box application ${lenderApplicationReference}, skipping offer creation.`);
            // Still update the application status
            await updateLenderApplicationStatusInDb(supabaseClient, lenderApplicationReference, 'offers_received');
            return NextResponse.json({ status: "OK" }, { status: 200 });
          }

          console.log(`📞 Calling CapitalBoxLenderService.getOffers for application UUID: ${lenderApplicationReference}`);
          const offerResponse = await capitalBoxLenderService.getOffers(lenderApplicationReference);

          if (offerResponse.success && offerResponse.data && Object.keys(offerResponse.data).length > 0) {
            console.log(`🎉 Successfully fetched ${Object.keys(offerResponse.data).length} offers from CapitalBox.`);
            await addOffersToDatabaseInDb(supabaseClient, lenderApplicationReference, offerResponse.data);
            await updateLenderApplicationStatusInDb(supabaseClient, lenderApplicationReference, 'offers_received');
          } else {
             console.warn(`⚠️ No offers found or fetched for application ${lenderApplicationReference}. Error: ${offerResponse.error?.message}`);
             await updateLenderApplicationStatusInDb(supabaseClient, lenderApplicationReference, 'no_offers');
          }
        } catch (offerError: any) {
           console.error(`❌ Error handling offersCreated for ${lenderApplicationReference}:`, offerError);
           await updateLenderApplicationStatusInDb(supabaseClient, lenderApplicationReference, 'offer_processing_failed');
        }
        break;
      case 'contractReady':
        console.log(`Processing contractReady event for UUID: ${lenderApplicationReference}`);
        await updateLenderApplicationStatusInDb(supabaseClient, lenderApplicationReference, 'contract_ready');
        break;
      case 'offersUpdated': 
         console.log(`Processing offersUpdated event for UUID: ${lenderApplicationReference}`);
         break;
      case 'contractSigned':
         console.log(`Processing contractSigned event for UUID: ${lenderApplicationReference}`);
         await updateLenderApplicationStatusInDb(supabaseClient, lenderApplicationReference, 'contract_signed');
         break;
      case 'loanDisbursed':
          console.log(`🎉 Processing loanDisbursed event for UUID: ${lenderApplicationReference}`);
          
          // 1. Update lender_application status
          await updateLenderApplicationStatusInDb(supabaseClient, lenderApplicationReference, 'disbursed');
          
          // 2. Get the linked funding_application to trigger commission generation
          try {
            const { data: lenderApp, error: fetchError } = await supabaseClient
              .from('lender_applications')
              .select('application_id, lender_id')
              .eq('lender_reference', lenderApplicationReference)
              .single();
            
            if (fetchError || !lenderApp) {
              console.error(`❌ Failed to fetch lender_application for ${lenderApplicationReference}:`, fetchError);
              break;
            }
            
            console.log(`📋 Found funding_application: ${lenderApp.application_id}`);
            
            // 3. Update funding_application status to 'disbursed'
            // This will automatically trigger the commission generation!
            const { error: updateError } = await supabaseClient
              .from('funding_applications')
              .update({ 
                status: 'disbursed',
                updated_at: new Date().toISOString()
              })
              .eq('id', lenderApp.application_id);
            
            if (updateError) {
              console.error(`❌ Failed to update funding_application ${lenderApp.application_id}:`, updateError);
            } else {
              console.log(`✅ Updated funding_application ${lenderApp.application_id} to disbursed`);
              console.log(`🤖 Commission generation trigger will fire automatically!`);
            }
          } catch (updateException) {
            console.error(`❌ Exception updating funding_application:`, updateException);
            // Don't fail the webhook - lender_application status was updated successfully
          }
          
          break;
      case 'applicationWithdrawn':
          console.log(`Processing applicationWithdrawn event for UUID: ${lenderApplicationReference}`);
          await updateLenderApplicationStatusInDb(supabaseClient, lenderApplicationReference, 'withdrawn');
          break;
      case 'batchCompleted': 
          console.log(`Processing batchCompleted event for UUID: ${lenderApplicationReference}`);
          break;
      case 'contractFailed':
          console.log(`Processing contractFailed event for UUID: ${lenderApplicationReference}`);
          await updateLenderApplicationStatusInDb(supabaseClient, lenderApplicationReference, 'contract_failed');
          break;
      default:
        console.warn(`⚠️ Received unknown Capital Box event type: ${event} for UUID: ${lenderApplicationReference}`);
    }

    console.log(`✅ Successfully processed event \'${event}\' for UUID: ${lenderApplicationReference}. Returning 200 OK.`);
    return NextResponse.json({ status: "OK" }, { status: 200 });

  } catch (error) {
    console.error('❌ Error processing Capital Box webhook:', error);
    let errorMessage = 'Failed to process webhook';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    const status = error instanceof SyntaxError ? 400 : 500;
    console.error(`❗ Returning ${status} due to error.`);
    return NextResponse.json({ error: errorMessage }, { status });
  }
} 