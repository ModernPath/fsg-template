import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { inngest } from '@/lib/inngest/inngest.client';
import { createClient as createAuthClient } from '@/utils/supabase/client'; // Use client for auth
import { createClient as createAdminClient } from '@/utils/supabase/server'; // Use server for admin

// Check environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const missingEnvVars = requiredEnvVars.filter(name => !process.env[name]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
}

export async function POST(request: Request) {
  try {
    console.log('📝 [POST /api/documents/analyze] Processing request');
    
    // Check for missing env vars
    if (missingEnvVars.length > 0) {
      return NextResponse.json(
        { error: 'Server configuration error', details: 'Missing required environment variables' },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { company_id, locale: bodyLocale } = body;

    if (!company_id) {
      console.error('❌ Missing company_id in request body');
      return NextResponse.json({ error: 'Missing company_id' }, { status: 400 });
    }
    
    // Get locale from request body, URL, or default to 'fi'
    let locale = bodyLocale || 'fi';
    if (!['en', 'fi', 'sv'].includes(locale)) {
      // Try to extract from URL path
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/');
      const pathLocale = pathParts[1]; // e.g., /fi/api/...
      if (['en', 'fi', 'sv'].includes(pathLocale)) {
        locale = pathLocale;
      } else {
        locale = 'fi'; // Default fallback
      }
    }

    // --- START: Add Authentication --- 
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid Authorization header');
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    // Use a standard Supabase client to verify the token
    const authClient = createAuthClient(); 
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error('❌ Authentication error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('👤 User authenticated:', user.id);
    // --- END: Add Authentication --- 

    // Use the Admin client (server client) for database operations
    const serviceClient = await createAdminClient(true);

    // Get all documents for this company
    const { data: documents, error: documentsError } = await serviceClient
      .from('documents')
      .select('*')
      .eq('company_id', company_id);

    if (documentsError) {
      console.error('Error fetching documents:', documentsError);
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }

    if (!documents || documents.length === 0) {
      return NextResponse.json({ error: 'No documents found for this company' }, { status: 404 });
    }

    // Update documents to mark them as processing
    const updatePromises = documents.map(doc => 
      serviceClient
        .from('documents')
        .update({ processing_status: 'processing' })
        .eq('id', doc.id)
    );

    await Promise.all(updatePromises);

    // Extract document IDs for the Inngest event
    const documentIds = documents.map(doc => doc.id);
    
    // Trigger Inngest event for financial analysis request
    console.log('🚀 Triggering Inngest event for financial analysis request...');
    try {
      // Send 'financial/analysis-requested' instead of 'document/uploaded'
      await inngest.send({
        name: 'financial/analysis-requested', // Use the correct event name
        data: {
          companyId: company_id,
          requestedBy: user.id, // Use the actual authenticated user ID
          locale: locale, // ✅ Fixed: Pass locale for correct language in AI analysis
          documentIds: documentIds // Pass all relevant document IDs (optional)
        }
      });
      console.log(`✅ Inngest financial/analysis-requested event sent successfully (locale: ${locale})`);
    } catch (inngestError) {
      console.error('❌ Error sending Inngest financial/analysis-requested event:', inngestError);
      // Log but don't fail the operation
    }

    // Attempt to insert a record in the analysis_jobs table to track this analysis task
    try {
      // Ensure the table name is correct (e.g., 'analysis_jobs')
      const { error: jobInsertError } = await serviceClient
        .from('analysis_jobs') // Verify this table name exists in your Supabase schema
        .insert({
          company_id,
          status: 'pending', // Start with 'pending' status
          requested_by: 'API Trigger', // Or get actual user ID if available
          document_count: documents.length,
          details: { documentIds } // Store related document IDs
        });

      if (jobInsertError) {
         // Log a more specific error if the insert fails
         console.error('❌ Failed to insert analysis job record:', jobInsertError.message, 'Details:', jobInsertError.details);
         // Depending on requirements, you might want to return an error here
         // or just log and continue if tracking isn't critical.
         // For now, we log and continue as per previous logic.
      } else {
        console.log('✅ Added record to analysis_jobs table');
      }
    } catch (jobError: any) {
      // Catch any other unexpected errors during the insert attempt
      console.error('❌ Unexpected error inserting analysis job record:', jobError.message);
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Document analysis started',
      document_count: documents.length
    });
  } catch (error) {
    console.error('Error in document analysis API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 