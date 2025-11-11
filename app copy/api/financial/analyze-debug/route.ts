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
 * POST handler for document analysis - DEBUG VERSION (bypasses permission checks)
 * Triggers financial analysis for a document or multiple documents
 */
export async function POST(request: Request) {
  try {
    // Log request details
    console.log('\n📝 [POST /api/financial/analyze-debug]', {
      url: request.url
    });

    // Verify authentication (minimal check)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid auth header');
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    // Create authenticated client and verify token
    console.log('🔑 DEBUG MODE: Verifying basic authentication...');
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
    
    console.log('🔍 DEBUG REQUEST BODY:', body);
    
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

    // DEBUG MODE: Skip company access verification and proceed with analysis
    console.log('🔓 DEBUG MODE: Bypassing company access verification');
    
    // Handle multiple documents analysis
    if (documentIds && Array.isArray(documentIds)) {
      // Fetch documents
      console.log('🔍 Fetching documents...');
      const { data: documents, error: docsError } = await supabase
        .from('documents')
        .select('id, extraction_data')
        .eq('company_id', companyId)
        .in('id', documentIds);
      
      if (docsError) {
        console.error('❌ Error fetching documents:', docsError);
        return NextResponse.json(
          { error: 'Error fetching documents', details: docsError },
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
      
      console.log(`📄 Found ${documents.length} documents:`, documents.map(d => d.id));
      
      // Filter documents with extraction data
      const validDocuments = documents.filter(doc => doc.extraction_data);
      
      if (validDocuments.length === 0) {
        console.error('❌ None of the documents have extraction data');
        return NextResponse.json(
          { error: 'None of the provided documents have extracted financial data to analyze' },
          { status: 400 }
        );
      }
      
      console.log(`📊 DEBUG: Processing ${validDocuments.length} documents...`);
      
      // Mock financial data for quick analysis
      const financialData = {
        revenue: 0,
        profit: 0,
        assets: 0,
        liabilities: 0,
        equity: 0,
        fiscal_year: new Date().getFullYear(),
        fiscal_period: 'annual'
      };
      
      // Aggregate financial data from documents
      for (const doc of validDocuments) {
        try {
          if (doc.extraction_data) {
            const extractedData = typeof doc.extraction_data === 'string' 
              ? JSON.parse(doc.extraction_data) 
              : doc.extraction_data;
            
            console.log(`📄 Document ${doc.id} extraction data:`, extractedData);
            
            // Get financial data from the nested structure if available
            const financialData_nested = extractedData.financial_data || extractedData;
            
            // Aggregate financial data, checking both the nested and top-level properties
            if (financialData_nested.revenue) financialData.revenue += parseFloat(financialData_nested.revenue) || 0;
            if (financialData_nested.profit) financialData.profit += parseFloat(financialData_nested.profit) || 0;
            if (financialData_nested.assets) financialData.assets += parseFloat(financialData_nested.assets) || 0;
            if (financialData_nested.liabilities) financialData.liabilities += parseFloat(financialData_nested.liabilities) || 0;
            
            // Update fiscal information if available, checking both levels
            if (extractedData.metadata?.fiscal_year) {
              financialData.fiscal_year = extractedData.metadata.fiscal_year;
            } else if (extractedData.fiscal_year) {
              financialData.fiscal_year = extractedData.fiscal_year;
            }
            
            if (extractedData.metadata?.fiscal_period) {
              financialData.fiscal_period = extractedData.metadata.fiscal_period;
            } else if (extractedData.fiscal_period) {
              financialData.fiscal_period = extractedData.fiscal_period;
            }
          }
        } catch (parseError) {
          console.error(`❌ Error parsing extraction data for document ${doc.id}:`, parseError);
        }
      }
      
      // Calculate equity
      financialData.equity = financialData.assets - financialData.liabilities;
      
      console.log('💰 DEBUG: Aggregated financial data:', financialData);
      
      // Return aggregated financial data
      return NextResponse.json({
        success: true,
        message: 'Successfully aggregated financial data from documents',
        financialData,
        processedDocuments: validDocuments.length
      });
    } else if (documentId) {
      // Handle single document case
      console.log('🔍 Fetching single document...');
      const { data: document, error: docError } = await supabase
        .from('documents')
        .select('id, extraction_data')
        .eq('id', documentId)
        .eq('company_id', companyId)
        .single();
      
      if (docError || !document) {
        console.error('❌ Document not found or error:', docError);
        return NextResponse.json(
          { error: 'Document not found', details: docError },
          { status: 404 }
        );
      }
      
      if (!document.extraction_data) {
        console.error('❌ Document has no extraction data');
        return NextResponse.json(
          { error: 'Document does not have any extracted financial data to analyze' },
          { status: 400 }
        );
      }
      
      // Parse extraction data
      const extractedData = typeof document.extraction_data === 'string'
        ? JSON.parse(document.extraction_data)
        : document.extraction_data;
      
      console.log('📄 Document extraction data:', extractedData);
      
      // Get financial data from the nested structure if available
      const financialData_nested = extractedData.financial_data || extractedData;
      
      // Create financial data from extracted data
      const financialData = {
        revenue: parseFloat(financialData_nested.revenue) || 0,
        profit: parseFloat(financialData_nested.profit) || 0,
        assets: parseFloat(financialData_nested.assets) || 0,
        liabilities: parseFloat(financialData_nested.liabilities) || 0,
        equity: (parseFloat(financialData_nested.assets) || 0) - (parseFloat(financialData_nested.liabilities) || 0),
        fiscal_year: extractedData.metadata?.fiscal_year || extractedData.fiscal_year || new Date().getFullYear(),
        fiscal_period: extractedData.metadata?.fiscal_period || extractedData.fiscal_period || 'annual'
      };
      
      console.log('💰 DEBUG: Financial data from document:', financialData);
      
      // Return financial data
      return NextResponse.json({
        success: true,
        message: 'Successfully extracted financial data from document',
        financialData,
        documentId
      });
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
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 