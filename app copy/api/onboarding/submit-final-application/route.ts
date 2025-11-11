import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { LenderService, LenderDataPayload } from '@/lib/services/lenderService';
import { DocumentService } from '@/lib/services/documentService';
import { getErrorResponse, LenderSubmissionError } from '@/lib/utils/apiUtils';
import { Database } from '@/types/supabase';
import { inngest } from '@/lib/inngest/inngest.client';
import { LenderType } from '@/lib/types/lenders';

type UboListItem = {
  nationalId: string;
  firstName: string;
  lastName: string;
};

type RequestPayload = {
  applicationId: string;
  company_id: string;
  user_id: string;
  financing_needs_details: any;
  amount: number;
  term_months?: number | null;
  funding_type: string;
  funding_recommendation_id?: string | null;
  applicant_national_id: string;
  ubo_list: UboListItem[];
  finalEmail?: string;
};

export async function POST(request: Request) {
  // Always use an admin client for the LenderService in this route
  const lenderService = await LenderService.create(true);

  try {
    const payload: RequestPayload = await request.json();
    const { applicationId, company_id, amount, funding_type, applicant_national_id, ubo_list, user_id, term_months } = payload;
    console.log('Received final application payload:', { ...payload, applicant_national_id: '[REDACTED]', ubo_list: '[REDACTED]' });

    if (!payload.applicationId || !payload.company_id || !payload.user_id || !payload.amount || !payload.funding_type || !payload.applicant_national_id) {
      return getErrorResponse('Missing required fields in submission payload.', 400);
    }
    if (isNaN(payload.amount) || payload.amount <= 0) {
        return getErrorResponse('Invalid funding amount provided.', 400);
    }
    if (payload.term_months !== undefined && payload.term_months !== null && (isNaN(payload.term_months) || payload.term_months <= 0)) {
        return getErrorResponse('Invalid loan term provided.', 400);
    }

    // Update the funding application status to 'submitted'
    const { error: updateError } = await lenderService.updateApplicationStatus(
      applicationId,
      'submitted',
      user_id,
      company_id
    );

    if (updateError) {
      console.error(`Failed to update application status for ${applicationId}:`, updateError);
      // Decide if this should be a fatal error or just a warning
    } else {
      console.log(`Funding application ${applicationId} status updated to submitted.`);
    }

    // Fetch all necessary documents for the application once
    const documentService = new DocumentService(lenderService.getSupabaseClient());
    const documents = await documentService.fetchDocumentsForSubmission(company_id, 20);
    console.log(`Retrieved ${documents.length} documents for lender submission`);

    // Get all lenders
    const allLenders = await lenderService.getAllLenders();

    if (!allLenders || allLenders.length === 0) {
      console.warn('No active lenders found.');
       return NextResponse.json({
         success: true,
         message: 'Application submitted, but no active lenders found for submission.',
         applicationId: applicationId,
       });
    }

    console.log(`Submitting application ${applicationId} to ${allLenders.length} lenders...`);
    const submissionPromises: Promise<void>[] = [];
    const lenderSubmissionErrors: LenderSubmissionError[] = [];
    const skippedLenders: string[] = [];
    const results: any[] = []; // Initialize results array
    let attemptedSubmissionsCount = 0; // Track actual submission attempts
    const createdLenderApplications: string[] = []; // Track successfully created applications for polling

    const lenderPayload: LenderDataPayload = {
      amount: payload.amount,
      term_months: payload.term_months,
      purpose: payload.financing_needs_details?.purpose || 'Not Specified',
      applicant_national_id: payload.applicant_national_id,
      ubo_list: payload.ubo_list,
      ...(payload.financing_needs_details || {}),
      applicant_first_name: payload.ubo_list?.[0]?.firstName,
      applicant_last_name: payload.ubo_list?.[0]?.lastName,
    };

    for (const lender of allLenders) {
       // Check if this lender supports the funding type from the application
       const fundingType = payload.funding_type;
       if (!lender.funding_categories || !Array.isArray(lender.funding_categories) || 
           !lender.funding_categories.includes(fundingType)) {
         console.log(`Skipping lender ${lender.name}: does not support funding type "${fundingType}". Supported types: [${lender.funding_categories?.join(', ') || 'none'}]`);
         skippedLenders.push(lender.name);
         continue;
       }

       console.log(`Checking if application already exists for lender: ${lender.name} (ID: ${lender.id})`);
       
       // Logic to check if an application for this lender already exists
       const existingApplication = await lenderService.findExistingLenderApplication(applicationId, lender.id);

       if (existingApplication && existingApplication.status !== 'pending') {
           console.log(`Application already exists for lender ${lender.name}, skipping submission. Status: ${existingApplication.status}, Reference: ${existingApplication.lender_reference}`);
           results.push({
               lender: lender.name,
               status: 'skipped',
               message: `Application already submitted (Status: ${existingApplication.status})`
           });
           continue; // Skip to the next lender
       }
       
       // Increment the counter for attempted submissions
       attemptedSubmissionsCount++;

       console.log(`Submitting to lender: ${lender.name} (ID: ${lender.id}, Type: ${lender.type})`);
       submissionPromises.push(
         (async () => {
            try {
                const result = await lenderService.submitQuotation(
                    lender.id,
                    company_id,
                    applicationId,
                    lenderPayload,
                    documents,
                    payload.finalEmail
                );

                if (!result.success) {
                    console.warn(`Submission failed for lender ${lender.name}:`, result);
                    lenderSubmissionErrors.push({
                       lenderId: lender.id,
                       lenderName: lender.name,
                       message: result.message || 'Unknown submission error',
                       details: result.error?.details || result.error?.code
                    });
                } else {
                    console.log(`Submission successful for lender ${lender.name}. Reference: ${result.data?.reference}`);
                    if (result.data?.reference) {
                       const { data: lenderApp, error: laError } = await lenderService.createLenderApplication(
                           applicationId,
                           lender.id,
                           result.data.reference,
                           result.data.status || 'submitted',
                           null, // errorDetails
                           result.additionalData // Pass additional data including shouldStopPolling flag
                       );
                           
                       if (laError) {
                           console.error(`Failed to create lender_application record for ${lender.name}:`, laError);
                       } else if (lenderApp) {
                           createdLenderApplications.push(lenderApp.id); // Track DB ID
                           // --- MODIFIED: Conditionally trigger document upload ---
                           // For CapitalBox, documents are already uploaded during submitApplication.
                           // This explicit loop is no longer needed for CapitalBox here.
                           // We might keep it for other lenders if they have a different flow.
                           if (lender.type !== 'capital_box' && documents.length > 0 && result.data?.reference) {
                               const lenderSpecificAppId = result.data.reference;
                               console.log(`Initiating document uploads for ${lender.name} application ${lenderSpecificAppId} (DB ID: ${lenderApp.id})`);
                               documents.forEach(async (doc) => {
                                   try {
                                       const uploadResult = await lenderService.uploadDocumentToLender(lenderApp.id, lenderSpecificAppId, doc, lender.type as LenderType);
                                       if (!uploadResult.success) {
                                           console.error(`Failed to upload document "${doc.name}" to ${lender.name} app ${lenderSpecificAppId}:`, uploadResult.error);
                                       }
                                   } catch (uploadErr) {
                                       console.error(`Unexpected error uploading document "${doc.name}" to ${lender.name} app ${lenderSpecificAppId}:`, uploadErr);
                                   }
                               });
                           }
                           // --- END: Document upload trigger modification ---
                       }
                    }
                }
            } catch (error) {
                console.error(`Unexpected error during submission to lender ${lender.name}:`, error);
                lenderSubmissionErrors.push({
                   lenderId: lender.id,
                   lenderName: lender.name,
                   message: 'Unexpected error during submission',
                   details: error instanceof Error ? error.message : String(error)
                });
            }
         })()
       );
    }

    await Promise.all(submissionPromises);
    
    // Trigger initial polling for each created lender application
    if (createdLenderApplications.length > 0) {
        console.log(`Triggering initial polling for ${createdLenderApplications.length} lender applications...`);
        
        // Send manual poll events for each application
        const pollPromises = createdLenderApplications.map(lenderApplicationId => 
            inngest.send({
                name: 'lender/manual-poll',
                data: { lenderApplicationId }
            })
        );
        
        try {
            await Promise.all(pollPromises);
            console.log('Initial lender application polling triggered successfully');
        } catch (pollError) {
            console.error('Error triggering lender application polling:', pollError);
            // Continue execution, as this is not critical for the API response
        }
    }

    if (lenderSubmissionErrors.length > 0) {
      const successCount = attemptedSubmissionsCount - lenderSubmissionErrors.length;
      const message = successCount > 0
         ? `Application submitted. Submitted to ${successCount}/${attemptedSubmissionsCount} lenders with some errors.`
         : 'Application submitted, but failed to submit to any lenders.';

       console.warn(`Submission completed with ${lenderSubmissionErrors.length} errors.`);
       return NextResponse.json({
           success: false,
           message: message,
           applicationId: applicationId,
           lenderErrors: lenderSubmissionErrors,
           skippedLenders: skippedLenders.length > 0 ? skippedLenders : undefined
       }, { status: 207 });
    }

    // Updated success message to mention skipped lenders
    const finalMessage = skippedLenders.length > 0
        ? `Application submitted successfully to ${attemptedSubmissionsCount} lenders. Skipped ${skippedLenders.length} lenders with existing applications.`
        : `Application submitted successfully to ${attemptedSubmissionsCount} lenders.`;
        
    console.log('All lender submissions completed successfully.');
    return NextResponse.json({
      success: true,
      message: finalMessage,
      applicationId: applicationId,
      skippedLenders: skippedLenders.length > 0 ? skippedLenders : undefined
    });

  } catch (error: any) {
    console.error('Error in final application submission process:', error);
    if (typeof getErrorResponse === 'function') {
        return getErrorResponse('An unexpected error occurred during final submission.', 500, error.message);
    } else {
        console.error("getErrorResponse helper function not found or not a function!");
        return new NextResponse(JSON.stringify({
            error: 'An unexpected error occurred during final submission.',
            details: error.message
        }), { status: 500 });
    }
  }
} 