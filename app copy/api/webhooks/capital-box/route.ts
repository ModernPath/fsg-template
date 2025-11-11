import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { LenderApplicationService } from '@/lib/services/LenderApplicationService';
import { inngest } from '@/lib/inngest/inngest.client';

/**
 * Capital Box webhook handler
 * 
 * Handles the following webhook events from Capital Box:
 * - Application status updates
 * - Offer creation
 * - Contract readiness
 * - Loan disbursement
 */
export async function POST(request: Request) {
  try {
    console.log('Received Capital Box webhook');
    
    // Verify the webhook signature (implement based on Capital Box's security requirements)
    // const signature = request.headers.get('cb-signature');
    // if (!verifySignature(signature, await request.text())) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }
    
    // Parse the webhook payload
    const payload = await request.json();
    console.log('Capital Box webhook payload:', payload);
    
    // Initialize services
    const supabase = await createClient(undefined, true);
    const lenderService = new LenderApplicationService(supabase);
    
    // Extract reference ID to identify the lender application
    const reference = payload.referenceId || payload.applicationId;
    if (!reference) {
      console.error('Missing reference ID in Capital Box webhook');
      return NextResponse.json({ error: 'Missing reference ID' }, { status: 400 });
    }
    
    // Find the corresponding lender application
    const { data: lenderApp, error: lenderAppError } = await supabase
      .from('lender_applications')
      .select('*') // Select all fields, including raw_response_data
      .eq('lender_reference', reference)
      .single();
      
    if (lenderAppError || !lenderApp) {
      console.error(`No lender application found for reference: ${reference}`);
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    
    // Process different webhook event types
    const eventType = payload.event || payload.type;
    
    switch (eventType) {
      case 'status_update':
      case 'statusUpdate':
        // Handle status update event
        // Trigger manual polling to update the application
        await inngest.send({
          name: 'lender/manual-poll',
          data: { lenderApplicationId: lenderApp.id }
        });
        break;
        
      case 'offer_created':
      case 'offersCreated':
        // Handle offer creation event
        // Store the raw webhook data and trigger polling
        await supabase
          .from('lender_applications')
          .update({
            raw_response_data: {
              ...lenderApp.raw_response_data,
              webhookData: payload
            },
            webhook_data: payload
          })
          .eq('id', lenderApp.id);
          
        // Trigger manual polling to process the offer
        await inngest.send({
          name: 'lender/manual-poll',
          data: { lenderApplicationId: lenderApp.id }
        });
        break;
        
      case 'contract_ready':
      case 'contractReady':
        // Handle contract ready event
        await supabase
          .from('lender_applications')
          .update({
            status: 'contract_ready',
            raw_response_data: {
              ...lenderApp.raw_response_data,
              webhookData: payload
            },
            webhook_data: payload,
            updated_at: new Date().toISOString()
          })
          .eq('id', lenderApp.id);
          
        // Emit event for contract ready
        await inngest.send({
          name: 'lender/contract-ready',
          data: {
            lenderApplicationId: lenderApp.id,
            applicationId: lenderApp.application_id,
            lenderId: lenderApp.lender_id,
            contractData: payload
          }
        });
        break;
        
      case 'loan_disbursed':
      case 'loanDisbursed':
        // Handle loan disbursement event
        console.log(`🎉 Processing loan_disbursed event for lender_application: ${lenderApp.id}`);
        
        // 1. Update lender_application status
        await supabase
          .from('lender_applications')
          .update({
            status: 'disbursed',
            raw_response_data: {
              ...lenderApp.raw_response_data,
              webhookData: payload
            },
            webhook_data: payload,
            updated_at: new Date().toISOString()
          })
          .eq('id', lenderApp.id);
        
        // 2. Update funding_application status to trigger commission generation
        console.log(`📋 Updating funding_application: ${lenderApp.application_id} to disbursed`);
        const { error: fundingUpdateError } = await supabase
          .from('funding_applications')
          .update({ 
            status: 'disbursed',
            updated_at: new Date().toISOString()
          })
          .eq('id', lenderApp.application_id);
        
        if (fundingUpdateError) {
          console.error(`❌ Failed to update funding_application ${lenderApp.application_id}:`, fundingUpdateError);
        } else {
          console.log(`✅ Updated funding_application ${lenderApp.application_id} to disbursed`);
          console.log(`🤖 Commission generation trigger will fire automatically!`);
        }
          
        // 3. Emit Inngest event for further processing
        await inngest.send({
          name: 'lender/loan-disbursed',
          data: {
            lenderApplicationId: lenderApp.id,
            applicationId: lenderApp.application_id,
            lenderId: lenderApp.lender_id,
            disbursementData: payload
          }
        });
        break;
        
      default:
        console.warn(`Unknown Capital Box webhook event type: ${eventType}`);
        // For unknown events, store the data and trigger a manual poll
        await supabase
          .from('lender_applications')
          .update({
            raw_response_data: {
              ...lenderApp.raw_response_data,
              webhookData: payload
            },
            webhook_data: payload
          })
          .eq('id', lenderApp.id);
          
        await inngest.send({
          name: 'lender/manual-poll',
          data: { lenderApplicationId: lenderApp.id }
        });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing Capital Box webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 