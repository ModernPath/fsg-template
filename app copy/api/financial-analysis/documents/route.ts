import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processFinancialDocument } from '@/lib/services/financialAnalysisService';
import { z } from 'zod';

// Define schema for validating request data
const analysisRequestSchema = z.object({
  document_id: z.string().uuid(),
  company_id: z.string().uuid(),
  manual_data: z.record(z.any()).optional()
});

/**
 * POST /api/financial-analysis/documents
 * Triggers a financial analysis for a document
 * Required parameters in the request body:
 * - document_id: ID of the document to analyze
 * - company_id: ID of the company the document belongs to
 * Optional parameters:
 * - manual_data: Manual financial data if document data is insufficient
 */
export async function POST(request: Request) {
  try {
    // Log request
    console.log('\n📝 [POST /api/financial-analysis/documents]');

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
    console.log('🔑 Creating auth client...');
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

    console.log('✅ User authenticated:', user.id);

    // Validate request data
    try {
      const body = await request.json();
      const validatedData = analysisRequestSchema.parse(body);
      
      // Create service role client
      console.log('🔑 Creating service role client...');
      const supabase = createClient(true);
      
      // Verify that user has access to the company
      const { data: companyAccess, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .eq('id', validatedData.company_id)
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
      
      // Verify that the document exists and belongs to the company
      const { data: document, error: documentError } = await supabase
        .from('documents')
        .select('id, name, extraction_data, processed, processing_status')
        .eq('id', validatedData.document_id)
        .eq('company_id', validatedData.company_id)
        .single();
        
      if (documentError) {
        console.error('❌ Document error:', documentError);
        return NextResponse.json(
          { error: 'Document not found or does not belong to this company' },
          { status: 404 }
        );
      }
      
      // Check if document is already being processed
      if (document.processing_status === 'processing') {
        console.log('Document is already being processed');
        return NextResponse.json(
          { error: 'Document is already being processed', status: document.processing_status },
          { status: 409 }
        );
      }
      
      // Update document status to processing
      const { error: updateError } = await supabase
        .from('documents')
        .update({ processing_status: 'processing' })
        .eq('id', validatedData.document_id);
        
      if (updateError) {
        console.error('❌ Error updating document status:', updateError);
        return NextResponse.json(
          { error: 'Failed to update document status' },
          { status: 500 }
        );
      }
      
      // Get extraction data from document or use manual data
      const extractionData = document.extraction_data && Object.keys(document.extraction_data).length > 0
        ? document.extraction_data
        : validatedData.manual_data || {};
        
      if (!extractionData || Object.keys(extractionData).length === 0) {
        console.error('❌ No extraction data available');
        
        // Update document to indicate failed processing
        await supabase
          .from('documents')
          .update({ 
            processing_status: 'failed',
            processed: false
          })
          .eq('id', validatedData.document_id);
          
        return NextResponse.json(
          { error: 'No financial data available for analysis. Please provide manual data.' },
          { status: 400 }
        );
      }
      
      // Process the document asynchronously
      // For API response speed, we'll return a success status immediately and continue processing
      Promise.resolve().then(async () => {
        try {
          await processFinancialDocument(
            extractionData,
            validatedData.company_id,
            validatedData.document_id,
            user.id
          );
        } catch (error) {
          console.error('❌ Async processing error:', error);
          
          // Update document to indicate failed processing
          try {
            await supabase
              .from('documents')
              .update({ 
                processing_status: 'failed',
                processed: false
              })
              .eq('id', validatedData.document_id);
            
            console.log('Document status updated to failed');
          } catch (updateError: unknown) {
            console.error('Failed to update document status to failed:', updateError);
          }
        }
      });
      
      // Return success immediately
      return NextResponse.json({
        success: true,
        message: 'Financial analysis started',
        document_id: validatedData.document_id,
        status: 'processing'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('❌ Validation error:', error.errors);
        return NextResponse.json(
          { error: 'Invalid request data', details: error.errors },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/financial-analysis/documents
 * Checks the status of document analysis processes
 * Required query parameters:
 * - company_id: ID of the company
 * Optional query parameters:
 * - document_id: ID of a specific document to check status
 */
export async function GET(request: Request) {
  try {
    // Log request
    console.log('\n📝 [GET /api/financial-analysis/documents]');

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');
    const documentId = searchParams.get('document_id');
    
    if (!companyId) {
      console.error('❌ Missing company_id parameter');
      return NextResponse.json(
        { error: 'company_id is required' },
        { status: 400 }
      );
    }

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
    console.log('🔑 Creating auth client...');
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

    console.log('✅ User authenticated:', user.id);

    // Create service role client
    console.log('🔑 Creating service role client...');
    const supabase = createClient(true);
    
    // Verify that user has access to the company
    const { data: companyAccess, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('id', companyId)
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
    
    // Fetch documents for the company
    let query = supabase
      .from('documents')
      .select('id, name, processing_status, processed, fiscal_year, fiscal_period, created_at')
      .eq('company_id', companyId);
      
    // If specific document ID is provided, filter by it
    if (documentId) {
      query = query.eq('id', documentId);
    }
    
    // Execute the query
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      );
    }
    
    // Get financial metrics for context
    const { data: financialMetrics, error: metricsError } = await supabase
      .from('financial_metrics')
      .select('id, created_at, fiscal_year, fiscal_period, source_document_ids')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
      
    if (metricsError) {
      console.log('⚠️ Could not fetch financial metrics:', metricsError);
    }
    
    // Match documents with financial metrics where possible
    const documentsWithMetrics = data?.map(doc => {
      const relatedMetrics = financialMetrics?.filter(metric => 
        metric.source_document_ids?.includes(doc.id)
      ) || [];
      
      return {
        ...doc,
        has_metrics: relatedMetrics.length > 0,
        metrics_count: relatedMetrics.length,
        latest_metrics_id: relatedMetrics.length > 0 ? relatedMetrics[0].id : null
      };
    });
    
    // Return results
    console.log('✅ Successfully fetched document statuses');
    return NextResponse.json({
      data: documentsWithMetrics,
      metadata: {
        count: documentsWithMetrics?.length || 0,
        company_id: companyId,
        document_id: documentId || undefined
      }
    });
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 