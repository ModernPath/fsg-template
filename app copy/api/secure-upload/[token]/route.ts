import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { inngest } from '@/lib/inngest/inngest.client'; // Import Inngest client
// TODO: Import SendGrid client if adding notification logic here

// Max file size (e.g., 10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

export async function POST(
  request: Request,
  { params: routeParams }: { params: { token: string } }
) {
  const params = await routeParams; // Await the params object
  const token = params.token;

  if (!token || typeof token !== 'string' || token.length !== 64) {
    return NextResponse.json({ error: 'Invalid token format.' }, { status: 400 });
  }

  try {
    const supabase = await createClient(undefined, true); // Use service role

    // 1. Re-validate the token and get associated company and user IDs
    const { data: requestData, error: requestError } = await supabase
      .from('document_requests')
      .select('id, status, expires_at, company_id, requesting_user_id')
      .eq('token', token)
      .single();

    if (requestError || !requestData) {
      return NextResponse.json({ error: 'Invalid or expired upload link.' }, { status: 404 });
    }
    const now = new Date();
    const expiresAt = new Date(requestData.expires_at);
    if (requestData.status !== 'pending' || now > expiresAt) {
      return NextResponse.json({ error: 'Upload link is expired or has already been used.' }, { status: 410 });
    }

    const companyId = requestData.company_id;
    const requestingUserId = requestData.requesting_user_id;
    const docRequestId = requestData.id;

    // 2. Process file upload from FormData
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided.' }, { status: 400 });
    }

    const uploadResults = [];
    const successfulDocumentIds: string[] = []; // Store IDs of successfully processed docs
    const bucketName = 'financial_documents';

    for (const file of files) {
      // Validate file type and size
      if (file.size > MAX_FILE_SIZE) {
        uploadResults.push({ name: file.name, success: false, error: `File exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit.` });
        continue;
      }
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        uploadResults.push({ name: file.name, success: false, error: 'Invalid file type.' });
        continue;
      }

      // 3. Construct file path FIRST
      const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const documentIdBase = crypto.randomUUID(); // Generate a UUID for the path/record
      const filePath = `${companyId}/${documentIdBase}/${sanitizedFilename}`;
      const currentDate = new Date().toISOString();

      // 4. Create a document record in the DB, mimicking authenticated upload fields
      const { data: documentRecord, error: dbInsertError } = await supabase
        .from('documents')
        .insert({
          // Use the generated UUID for the primary key
          id: documentIdBase, 
          company_id: companyId,
          // uploaded_by: Use the ID of the user who sent the request link
          uploaded_by: requestingUserId, 
          created_by: requestingUserId, // Mirror authenticated upload logic
          name: sanitizedFilename, // Use sanitized name
          description: `Uploaded securely on ${new Date().toLocaleDateString()}`, // Add description
          file_path: filePath, // Insert path directly
          mime_type: file.type,
          file_size: file.size,
          // Fiscal year/period are not available in this context, let them be null/default
          processed: false, // Mirror authenticated upload
          processing_status: 'pending', // Starts as pending analysis
          uploaded_at: currentDate, // Add timestamp
          created_at: currentDate, // Add timestamp
          document_request_id: docRequestId, // Link back to the request (specific to secure upload)
          metadata: JSON.stringify({ // Add metadata
             upload_method: 'secure_link',
             original_filename: file.name,
             content_type: file.type,
          })
        })
        .select('id') // Select the ID we inserted
        .single();

      if (dbInsertError || !documentRecord) {
        console.error(`[Secure Upload] DB Insert Error for ${file.name}:`, dbInsertError);
        uploadResults.push({ name: file.name, success: false, error: 'Failed to create document record.' });
        continue; // Skip storage upload if DB insert failed
      }

      // const documentId = documentRecord.id; // Already have documentIdBase

      // 5. Upload to Supabase Storage using the structured path (already defined)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file); // Use the same file object as before

      if (uploadError) {
        console.error(`[Secure Upload] Storage Error for ${file.name}:`, uploadError);
        uploadResults.push({ name: file.name, success: false, error: 'Failed to upload to storage.' });
        // Optionally: Delete the DB record we just created if storage fails?
        // await supabase.from('documents').delete().eq('id', documentIdBase);
      } else {
        console.log(`[Secure Upload] Successfully uploaded ${file.name} to ${filePath}`);
        // REMOVED: Update the document record with the final path (already inserted)
        // const { error: updatePathError } = await supabase
        //     .from('documents')
        //     .update({ file_path: filePath })
        //     .eq('id', documentIdBase);
        // if (updatePathError) {
        //      console.error(`[Secure Upload] Failed to update path for doc ${documentIdBase}:`, updatePathError);
        // }
        uploadResults.push({ name: file.name, success: true, path: filePath });
        successfulDocumentIds.push(documentIdBase); // Add ID to list for Inngest event
      }
    }

    // 6. Update document_requests status to 'completed'
    // Only update if at least one file was successfully uploaded and recorded
    const successfulUploads = uploadResults.filter(r => r.success).length;
    if (successfulUploads > 0) {
      const { error: updateError } = await supabase
        .from('document_requests')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('token', token);

      if (updateError) {
        console.error('[Secure Upload] Failed to update request status:', updateError);
      }
      
      // --- Send Event to Inngest to Trigger Analysis --- 
      try {
          console.log(`[Secure Upload] Sending 'financial/analysis-requested' event for company ${companyId} with docs:`, successfulDocumentIds);
          await inngest.send({
              name: 'financial/analysis-requested',
              data: {
                  companyId: companyId,
                  requestedBy: requestingUserId, // User who owns the data
                  documentIds: successfulDocumentIds,
              },
              user: { id: requestingUserId } // Associate event with the user
          });
          console.log('[Secure Upload] Inngest event sent successfully.');
      } catch (inngestError) {
          console.error('[Secure Upload] Failed to send Inngest event:', inngestError);
          // Decide how to handle this: maybe log, maybe try again later, maybe return error to client?
          // For now, just log it, as the files are uploaded.
      }
      // --- End Inngest Event --- 
      
      // --- Send Document Upload Confirmation Email ---
      try {
        // Get requesting user's profile for name and email
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', requestingUserId)
          .single();
          
        // Get company name
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('name')
          .eq('id', companyId)
          .single();

        if (!profileError && !companyError && profile && companyData) {
          const { EmailTemplateService } = await import('@/lib/services/emailTemplateService');
          const emailService = new EmailTemplateService();
          
          await emailService.sendDocumentUploadConfirmation(
            companyId,
            companyData.name,
            profile.email,
            profile.full_name || 'Asiakas'
          );
          
          console.log(`✅ Secure upload confirmation email sent to ${profile.email}`);
        }
      } catch (emailError) {
        console.error('⚠️ Failed to send secure upload confirmation email:', emailError);
        // Don't fail the upload if email fails
      }
      // --- End Email Notification ---
      
      // --- TODO: Add Notification Logic --- 
      // Send email to `requestingUserId` that documents were uploaded.
      // Fetch profile email based on `requestingUserId`
      // Construct and send email (similar to send-document-request)
      console.log(`TODO: Notify user ${requestingUserId} about successful upload via secure link.`);
      // ----------------------------------
    }

    // 7. Return results
    if (successfulUploads === files.length) {
      return NextResponse.json({ message: 'All files uploaded successfully.', results: uploadResults }, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Some files could not be uploaded.', results: uploadResults }, { status: 207 }); 
    }

  } catch (error: any) {
    console.error('[Secure Upload] Unexpected error:', error);
    return NextResponse.json({ error: 'An internal error occurred during upload.' }, { status: 500 });
  }
} 