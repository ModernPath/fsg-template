import { NextResponse, NextRequest } from 'next/server';
import { triggerCompanyAnalysis, requestFinancialAnalysis } from '@/lib/company/companyService';
import { inngest } from '@/lib/inngest/inngest.client';
import { createClient } from '@supabase/supabase-js';
import { processFinancialDocument } from '@/lib/services/financialAnalysisService';
import { serve } from 'inngest/next';

// Service role client for database operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Generate a valid UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Create a test function
export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s");
    return { message: `Hello ${event.data.name}!` };
  }
);

// Create a combined handler that handles both Inngest events and API requests
const inngestHandler = serve({
  client: inngest,
  functions: [helloWorld],
});

// Export the combined handlers
export const POST = inngestHandler.POST;
export const PUT = inngestHandler.PUT;

// Export a combined GET handler that handles both Inngest and API requests
export async function GET(request: NextRequest, context: { params: {} }) {
  // First try to handle as an Inngest request
  const inngestResponse = await inngestHandler.GET(request, context);
  if (inngestResponse) return inngestResponse;

  // If not an Inngest request, handle as a regular API request
  const { searchParams } = new URL(request.url);
  const testType = searchParams.get('type');
  
  if (testType === 'lastbot-analysis') {
    try {
      // Create or get a test company record for Trusty Finance
      const { data: existingCompany, error: checkError } = await supabaseAdmin
        .from('companies')
        .select('id')
        .eq('business_id', '3361305-7')
        .maybeSingle();
      
      let companyId = existingCompany?.id;
      const testUserId = generateUUID();
      
      // If company doesn't exist, create it
      if (!companyId) {
        // First check if we have any existing user we can use
        const { data: existingUser } = await supabaseAdmin
          .from('users')
          .select('id')
          .limit(1)
          .single();
          
        const createdBy = existingUser?.id;
        
        // Now create the company
        const companyData: any = {
          name: 'Trusty Finance Europe Oy',
          business_id: '3361305-7',
          type: 'Osakeyhtiö',
          industry: 'IT-konsultointi, IT-palvelut',
          created_by: createdBy || generateUUID() // Use a mock UUID if no user found
        };
        
        const { data: newCompany, error: createError } = await supabaseAdmin
          .from('companies')
          .insert(companyData)
          .select('id')
          .single();
          
        if (createError) {
          return NextResponse.json({ 
            error: createError.message,
            message: 'You may need to disable foreign key constraints for testing or create a test user first'
          }, { status: 500 });
        }
        
        companyId = newCompany.id;
      }
      
      // Test company analysis for Trusty Finance
      const result = await triggerCompanyAnalysis(
        companyId,
        '3361305-7',
        testUserId
      );
      
      return NextResponse.json({
        ...result,
        companyId,
        testUserId,
        message: 'Analysis triggered for Trusty Finance Europe Oy (Y-tunnus: 3361305-7)'
      });
    } catch (error) {
      console.error('Error triggering Trusty Finance analysis:', error);
      return NextResponse.json({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        hint: 'If there\'s a foreign key error, check if users exist in your database'
      }, { status: 500 });
    }
  }
  
  if (testType === 'company-analysis') {
    // Test company analysis with Trusty Finance business ID instead of test ID
    const testUserId = generateUUID();
    const result = await triggerCompanyAnalysis(
      generateUUID(), // Generate a valid UUID for company ID
      '3361305-7', // Use Trusty Finance's real business ID instead of test one
      testUserId
    );
    return NextResponse.json({ 
      ...result, 
      testUserId,
      businessId: '3361305-7',
      note: 'Using Trusty Finance business ID for better test results'
    });
  }
  
  if (testType === 'document-analysis') {
    // Test document analysis by directly sending event
    const testDocumentId = generateUUID();
    const testCompanyId = generateUUID();
    
    await inngest.send({
      name: 'document/processed',
      data: {
        documentId: testDocumentId,
        companyId: testCompanyId,
        extractedData: {
          revenue: 1000000,
          expenses: 700000,
          profit: 300000
        },
        status: 'success'
      }
    });
    return NextResponse.json({ 
      success: true,
      testDocumentId,
      testCompanyId
    });
  }
  
  if (testType === 'financial-metrics-analysis') {
    try {
      // Create a sample financial document data
      const testFinancialData = {
        // Cash Flow Metrics
        operational_cash_flow: 250000,
        investment_cash_flow: -150000,
        
        // Balance Sheet Indicators
        return_on_equity: 15.2, // ROE (%)
        debt_to_equity_ratio: 1.4, // D/E
        quick_ratio: 1.2,
        current_ratio: 1.8,
        asset_structure_percent: 65.3, // % Fixed Assets
        
        // Revenue and Growth
        revenue_current: 1500000,
        revenue_previous: 1200000,
        revenue_growth_rate: 25.0, // (%)
        
        // Accounts Receivable Management
        accounts_receivable_turnover_days: 42,
        bad_debt_ratio: 2.5, // (%)
        
        // Investments and Fixed Assets
        fixed_asset_turnover: 2.1,
        total_fixed_assets: 850000,
        investment_allocation: {
          short_term_percentage: 35,
          long_term_percentage: 65
        },
        
        // Sample future needs
        future_needs: {
          required_working_capital_increase: 120000,
          investment_priorities: "Production capacity expansion, digital transformation",
          estimated_investment_amounts: 350000
        },
        
        // Summary
        summary: "The company shows healthy growth with good liquidity and moderate leverage. Recommended funding options include a mix of medium-term debt and selective leasing for equipment."
      };
      
      // Check if we have a valid company to test with
      const { data: existingCompany, error: checkError } = await supabaseAdmin
        .from('companies')
        .select('id')
        .eq('business_id', '3361305-7')
        .maybeSingle();
      
      // Use existing company ID or generate a mock one
      const companyId = existingCompany?.id || generateUUID();
      const mockUserId = generateUUID();
      
      if (!existingCompany) {
        console.log('No existing company found, using mock company ID:', companyId);
      }
      
      // Generate a document ID
      const testDocumentId = generateUUID();
      
      // Process the financial document with our mock data
      try {
        await processFinancialDocument(
          testFinancialData,
          companyId,
          testDocumentId,
          mockUserId
        );
        
        return NextResponse.json({
          success: true,
          message: 'Financial metrics analysis processed successfully with mock document',
          companyId,
          documentId: testDocumentId,
          testData: testFinancialData
        });
      } catch (processError) {
        return NextResponse.json({ 
          error: processError instanceof Error ? processError.message : 'Unknown error processing data',
          companyId
        }, { status: 500 });
      }
    } catch (error) {
      console.error('Error running financial metrics analysis test:', error);
      return NextResponse.json({ 
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  }
  
  return NextResponse.json({ 
    error: 'Invalid test type', 
    validOptions: ['lastbot-analysis', 'company-analysis', 'document-analysis', 'financial-metrics-analysis']
  }, { status: 400 });
} 