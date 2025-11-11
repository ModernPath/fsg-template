import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processFinancialDocument } from '@/lib/services/financialAnalysisService';

// Initialize Supabase client with service role for admin access
const getSupabaseClient = (serviceRole = false) => {
  if (serviceRole) {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

/**
 * POST handler for document analysis
 * Triggers financial analysis for a document or multiple documents
 */
export async function POST(request: Request) {
  try {
    // Log request details
    console.log('\n📝 [POST /api/financial/analyze]', {
      url: request.url
    });

    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid auth header');
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    // Create authenticated client and verify token
    console.log('🔑 Verifying authentication...');
    const authClient = getSupabaseClient();
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

    // Get request body
    const body = await request.json();
    const { companyId, documentId, documentIds } = body;
    
    if (!companyId || (!documentId && !documentIds)) {
      console.error('❌ Missing required fields in request body');
      return NextResponse.json(
        { error: 'Missing required fields: companyId and either documentId or documentIds are required' },
        { status: 400 }
      );
    }

    // Create service role client for database operations
    console.log('🔑 Creating service role client...');
    const supabase = getSupabaseClient(true);

    // Check if user has access to this company
    console.log('🔒 Verifying company access...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', companyId)
      .maybeSingle();
    
    // Also check if user is admin
    const { data: adminCheck, error: adminError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();
    
    const isAdmin = adminCheck?.is_admin === true;
    
    // Only allow access if user is associated with company or is admin
    if ((!profile && !isAdmin) || profileError) {
      console.error('❌ Access denied to company data');
      return NextResponse.json(
        { error: 'You do not have access to analyze this company\'s documents' },
        { status: 403 }
      );
    }

    // Handle single document analysis
    if (documentId) {
      // Verify document exists and belongs to the company
      console.log('🔍 Verifying document access...');
      const { data: document, error: docError } = await supabase
        .from('documents')
        .select('id, extraction_data')
        .eq('id', documentId)
        .eq('company_id', companyId)
        .single();
      
      if (docError || !document) {
        console.error('❌ Document not found or access denied:', docError);
        return NextResponse.json(
          { error: 'Document not found or you do not have access to it' },
          { status: 404 }
        );
      }

      // Check if document has extraction data
      if (!document.extraction_data) {
        console.error('❌ Document has no extraction data');
        return NextResponse.json(
          { error: 'Document does not have any extracted financial data to analyze' },
          { status: 400 }
        );
      }

      // Process the document
      console.log('📊 Processing document...');
      try {
        await processFinancialDocument(
          document.extraction_data,
          companyId,
          documentId,
          user.id
        );
        
        // Return success
        console.log('✅ Successfully processed document');
        return NextResponse.json({
          success: true,
          message: 'Document analysis completed successfully',
          documentId
        });
      } catch (processError) {
        console.error('❌ Error processing document:', processError);
        return NextResponse.json(
          { 
            error: 'Failed to process document', 
            details: processError instanceof Error ? processError.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    }
    
    // Handle multiple documents analysis
    if (documentIds && Array.isArray(documentIds)) {
      // Verify documents exist and belong to the company
      console.log('🔍 Verifying documents access...');
      const { data: documents, error: docsError } = await supabase
        .from('documents')
        .select('id, extraction_data')
        .eq('company_id', companyId)
        .in('id', documentIds);
      
      if (docsError) {
        console.error('❌ Error fetching documents:', docsError);
        return NextResponse.json(
          { error: 'Error fetching documents' },
          { status: 500 }
        );
      }
      
      if (!documents || documents.length === 0) {
        console.error('❌ No valid documents found');
        return NextResponse.json(
          { error: 'No valid documents found for the provided IDs' },
          { status: 404 }
        );
      }
      
      // Filter documents with extraction data
      const validDocuments = documents.filter(doc => doc.extraction_data);
      
      if (validDocuments.length === 0) {
        console.error('❌ None of the documents have extraction data');
        return NextResponse.json(
          { error: 'None of the provided documents have extracted financial data to analyze' },
          { status: 400 }
        );
      }
      
      // Process all valid documents
      console.log(`📊 Processing ${validDocuments.length} documents...`);
      const results = [];
      const errors = [];
      
      for (const doc of validDocuments) {
        try {
          await processFinancialDocument(
            doc.extraction_data,
            companyId,
            doc.id,
            user.id
          );
          results.push(doc.id);
        } catch (processError) {
          console.error(`❌ Error processing document ${doc.id}:`, processError);
          errors.push({
            documentId: doc.id,
            error: processError instanceof Error ? processError.message : 'Unknown error'
          });
        }
      }
      
      // Return results
      if (results.length > 0) {
        console.log(`✅ Successfully processed ${results.length} documents`);
        return NextResponse.json({
          success: true,
          message: `Successfully processed ${results.length} documents`,
          processedDocuments: results,
          failedDocuments: errors
        });
      } else {
        console.error('❌ All document processing failed');
        return NextResponse.json(
          { 
            error: 'All document processing failed', 
            details: errors
          },
          { status: 500 }
        );
      }
    }
    
    // Should never reach here due to validation above
    return NextResponse.json(
      { error: 'Invalid request format' },
      { status: 400 }
    );
  } catch (error) {
    // Handle unexpected errors
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 