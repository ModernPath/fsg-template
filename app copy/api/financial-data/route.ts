import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    // Log request
    console.log('📊 [GET /api/financial-data]');

    // Get auth token from headers
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid authorization header');
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    // Get company ID from query params
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    
    if (!companyId) {
      console.error('❌ Missing company ID parameter');
      return NextResponse.json(
        { error: 'Missing company ID parameter' },
        { status: 400 }
      );
    }

    // Authenticate user
    const authClient = await createClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser(
      authHeader.split(' ')[1]
    );
    
    if (authError || !user) {
      console.error('❌ Authentication error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create service role client for admin access (bypassing RLS)
    const supabase = await createClient(undefined, true);
    
    // Get the most recent financial metrics for the company
    console.log('📊 Fetching latest financial metrics for company:', companyId);
    const { data: latestMetrics, error: metricsError } = await supabase
      .from('financial_metrics')
      .select('*') // Select all columns from the consolidated table
      .eq('company_id', companyId)
      .order('fiscal_year', { ascending: false })
      .order('created_at', { ascending: false }) // Prioritize latest record for a given year
      .limit(1)
      .maybeSingle();
    
    if (metricsError) {
      console.error('❌ Error fetching financial metrics:', metricsError);
      return NextResponse.json(
        { error: 'Failed to fetch financial metrics' },
        { status: 500 }
      );
    }
    
    // If metrics are found, return them directly
    if (latestMetrics) {
      console.log('✅ Found financial metrics record, returning data');
      // Return the full record, frontend can decide what to display
      return NextResponse.json(latestMetrics);
    }
    
    // If no metrics record found, try the fallback to documents (unchanged for now)
    console.log('📊 No financial metrics found, attempting fallback to documents');
    const { data: documents, error: documentsError } = await supabase
      .from('documents')
      .select('extraction_data')
      .eq('company_id', companyId)
      .eq('processed', true)
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (documentsError) {
      console.error('❌ Error fetching documents:', documentsError);
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      );
    }
      
    // Extract financial data from processed documents (fallback)
    interface FinancialDataBase {
        revenue?: number | null;
        profit?: number | null;
        assets?: number | null;
        liabilities?: number | null;
        equity?: number | null;
        fiscal_year?: number | null;
        fiscal_period?: string | null;
    }
    
    const extractedData = documents?.reduce((acc: FinancialDataBase, doc: any) => {
        // Look inside extraction_data, potentially under a key like 'keyMetrics' or 'financial_data' depending on Gemini output structure
        const metrics = doc.extraction_data?.keyMetrics || doc.extraction_data?.financial_data || doc.extraction_data;
        if (metrics) {
            return {
                revenue: metrics.revenue ?? acc.revenue,
                profit: metrics.profit ?? acc.profit,
                assets: metrics.assets ?? acc.assets,
                liabilities: metrics.liabilities ?? acc.liabilities,
                equity: metrics.equity ?? acc.equity,
                fiscal_year: metrics.fiscal_year ?? acc.fiscal_year,
                fiscal_period: metrics.fiscal_period ?? acc.fiscal_period,
            };
        }
        return acc;
    }, {
        revenue: null,
        profit: null,
        assets: null,
        liabilities: null,
        equity: null,
        fiscal_year: null,
        fiscal_period: null
    });
      
    // Check if any data was actually extracted
    const hasExtractedData = Object.values(extractedData).some(v => v !== null);

    if (hasExtractedData) {
        console.log('📊 Returning extracted financial data from documents (fallback)');
        return NextResponse.json(extractedData);
    }
      
    console.log('🤷 No financial metrics record and no data found in documents');
    return NextResponse.json(
      { message: 'No financial data available' },
      { status: 404 }
    );

  } catch (error) {
    console.error('❌ Unexpected error in GET /api/financial-data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Log request
    console.log('📊 [POST /api/financial-data]');

    // Get auth token from headers
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid authorization header');
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const { company_id: companyId, ...incomingData } = body;
    
    if (!companyId) {
      console.error('❌ Missing company ID in request body');
      return NextResponse.json(
        { error: 'Missing company ID in request body' },
        { status: 400 }
      );
    }

    // Authenticate user
    const authClient = await createClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser(
      authHeader.split(' ')[1]
    );
    
    if (authError || !user) {
      console.error('❌ Authentication error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create service role client for admin access
    const supabase = await createClient(undefined, true);
    
    // Prepare data for financial_metrics table, mapping all known fields
    // Use the CORRECT incoming field names and map to the final schema columns
    const metricsData = {
      company_id: companyId,
      fiscal_year: incomingData.fiscal_year,
      fiscal_period: incomingData.fiscal_period,
      
      // Use correct mappings
      revenue: incomingData.revenue, // Use incoming 'revenue' 
      net_profit: incomingData.net_profit, // Use incoming 'net_profit'
      ebitda: incomingData.ebitda,
      operating_profit: incomingData.operating_profit,
      depreciation_amortization: incomingData.depreciation_amortization,
      total_assets: incomingData.total_assets,
      fixed_assets: incomingData.fixed_assets,
      current_assets: incomingData.current_assets,
      accounts_receivable: incomingData.accounts_receivable,
      inventory: incomingData.inventory,
      cash_and_equivalents: incomingData.cash_and_equivalents,
      total_equity: incomingData.total_equity,
      total_liabilities: incomingData.total_liabilities,
      non_current_liabilities: incomingData.non_current_liabilities,
      current_liabilities: incomingData.current_liabilities,
      accounts_payable: incomingData.accounts_payable,
      operational_cash_flow: incomingData.operational_cash_flow, // Keep if still relevant, otherwise remove
      investment_cash_flow: incomingData.investment_cash_flow,
      financing_cash_flow: incomingData.financing_cash_flow,
      
      // Ratios (if they are ever sent directly, unlikely from metadata)
      return_on_equity: incomingData.return_on_equity,
      debt_to_equity_ratio: incomingData.debt_to_equity_ratio,
      current_ratio: incomingData.current_ratio,
      quick_ratio: incomingData.quick_ratio,
      dso_days: incomingData.dso_days,
      fixed_asset_turnover_ratio: incomingData.fixed_asset_turnover_ratio,
      revenue_growth_rate_yoy: incomingData.revenue_growth_rate_yoy,
      previous_year_revenue: incomingData.previous_year_revenue,

      // Metadata fields
      source_document_ids: incomingData.source_document_ids,
      data_source: incomingData.data_source,
      created_by: user.id // Set created_by based on authenticated user
    };

    // Remove undefined fields to avoid inserting NULLs unintentionally
    const cleanedMetricsData: { [key: string]: any } = {};
    for (const key in metricsData) {
      if (Object.prototype.hasOwnProperty.call(metricsData, key)) {
        const value = (metricsData as any)[key]; // Use type assertion to access value
        if (value !== undefined) {
          cleanedMetricsData[key] = value;
        }
      }
    }

    console.log('💾 Checking for existing financial metrics for company:', companyId, 'Year:', cleanedMetricsData.fiscal_year);

    // Check if a record already exists for this company and year
    const { data: existingMetrics, error: checkError } = await supabase
      .from('financial_metrics')
      .select('id') // Only need the ID to check for existence
      .eq('company_id', companyId)
      .eq('fiscal_year', cleanedMetricsData.fiscal_year)
      .maybeSingle(); // Expect 0 or 1 record

    if (checkError) {
      console.error('❌ Error checking for existing financial metrics:', checkError);
      return NextResponse.json(
        { error: 'Failed to check for existing financial metrics', details: checkError.message },
        { status: 500 }
      );
    }

    let savedMetrics;
    let operationError;

    if (existingMetrics) {
      // Record exists, perform an update
      console.log('🔄 Found existing record, updating financial metrics...', existingMetrics.id);
      
      // Create a payload for the update, excluding null/undefined values and immutable keys
      const updatePayload: { [key: string]: any } = {};
      const keysToExclude = ['id', 'company_id', 'fiscal_year', 'created_by', 'created_at']; // Fields not to update
      for (const key in cleanedMetricsData) {
        if (Object.prototype.hasOwnProperty.call(cleanedMetricsData, key) && 
            cleanedMetricsData[key] !== null && 
            cleanedMetricsData[key] !== undefined &&
            !keysToExclude.includes(key)) { 
           updatePayload[key] = cleanedMetricsData[key];
        }
      }

      // Only proceed with update if there are actual fields to update
      if (Object.keys(updatePayload).length > 0) {
        console.log('📦 Update payload (non-null fields only):', updatePayload); 
        const { data, error } = await supabase
          .from('financial_metrics')
          .update(updatePayload) // Use the filtered payload
          .eq('id', existingMetrics.id) // Match the specific row ID
          .select()
          .single();
        savedMetrics = data;
        operationError = error;
      } else {
        // No actual fields to update, return the existing record as is
        console.log('⚠️ No new non-null fields provided for update. Skipping DB call.');
        // Fetch the full existing record to return it
        const { data: currentRecord, error: fetchError } = await supabase
          .from('financial_metrics')
          .select('*')
          .eq('id', existingMetrics.id)
          .single();
          
        if(fetchError){
           console.error('❌ Error fetching existing record after skipped update:', fetchError);
           operationError = fetchError; // Report the fetch error
        } else {
           savedMetrics = currentRecord; 
           operationError = null; // No update error occurred
        }
      }
    } else {
      // Record does not exist, perform an insert
      console.log('➕ No existing record found, inserting new financial metrics...');
      const { data, error } = await supabase
        .from('financial_metrics')
        .insert(cleanedMetricsData)
        .select()
        .single();
      savedMetrics = data;
      operationError = error;
    }

    // Check for errors during update or insert
    if (operationError) {
      console.error(`❌ Error ${existingMetrics ? 'updating' : 'inserting'} financial metrics:`, operationError);
      return NextResponse.json(
        { error: `Failed to ${existingMetrics ? 'update' : 'insert'} financial metrics`, details: operationError.message },
        { status: 500 }
      );
    }
    
    console.log(`✅ Successfully ${existingMetrics ? 'updated' : 'inserted'} financial metrics record:`, savedMetrics.id);
    return NextResponse.json(savedMetrics);
    
  } catch (error) {
    console.error('❌ Unexpected error in POST /api/financial-data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 