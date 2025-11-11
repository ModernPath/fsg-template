import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * Create financial metrics
 * POST /api/financial-metrics/create
 */
export async function POST(request: Request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('Authorization');
    console.log('📊 Authorization header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid authorization header');
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    console.log('📊 Using token:', token.substring(0, 10) + '...');
    
    // Get request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.company_id || !body.fiscal_year || !body.fiscal_period) {
      return NextResponse.json(
        { error: 'Required fields missing (company_id, fiscal_year, fiscal_period)' },
        { status: 400 }
      );
    }

    console.log('📊 Creating financial metrics for company:', body.company_id, 'fiscal year:', body.fiscal_year);
    
    // Create Supabase client
    const supabase = await createClient(undefined, true);
    
    // Verify authentication with the provided token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('❌ Authentication error:', authError);
      return NextResponse.json(
        { error: 'Authentication failed', details: authError?.message },
        { status: 401 }
      );
    }
    
    console.log('✅ User authenticated:', user.id);
    
    // Check if metrics already exist for this fiscal year
    const { data: existingMetrics, error: checkError } = await supabase
      .from('financial_metrics')
      .select('id, data_source')
      .eq('company_id', body.company_id)
      .eq('fiscal_year', body.fiscal_year)
      .eq('fiscal_period', body.fiscal_period)
      .order('created_at', { ascending: false })
      .maybeSingle();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing metrics:', checkError);
      return NextResponse.json(
        { error: 'Failed to check existing metrics' },
        { status: 500 }
      );
    }
    
    let result;
    
    // If metrics exist with a different data source, we may want to keep both
    // Prefer to keep document-based metrics over enriched/public data
    if (existingMetrics?.id && existingMetrics.data_source) {
      // Decide whether to update or insert based on data source priority
      const existingDataSource = existingMetrics.data_source;
      const newDataSource = body.data_source || 'unknown';
      
      // Document data (from uploaded financial statements) has highest priority
      const shouldUpdate = 
        existingDataSource === 'unknown' || // Always update unknown sources
        (existingDataSource === newDataSource) || // Update same source
        // Lower priority sources can't overwrite higher priority sources
        (newDataSource === 'document' && existingDataSource !== 'document') ||
        (newDataSource === 'financial_data_yearly' && existingDataSource === 'enriched_data') ||
        (newDataSource === 'financial_data_yearly' && existingDataSource === 'public_financial_data') ||
        (newDataSource === 'enriched_data' && existingDataSource === 'public_financial_data');
      
      if (shouldUpdate) {
        console.log('📊 Updating existing metrics for fiscal year', body.fiscal_year, 'from source', body.data_source);
        
        // Update existing record
        const { data, error } = await supabase
          .from('financial_metrics')
          .update({
            ...body,
            updated_at: new Date().toISOString(),
            created_by: user.id // Ensure creator is set
          })
          .eq('id', existingMetrics.id)
          .select()
          .single();
        
        if (error) {
          console.error('❌ Error updating financial metrics:', error);
          return NextResponse.json(
            { error: 'Failed to update financial metrics', details: error.message },
            { status: 500 }
          );
        }
        
        result = data;
      } else {
        // Data source priority doesn't allow update, create a new record with this data source
        console.log('📊 Creating new metrics for fiscal year', body.fiscal_year, 'with new data source', body.data_source);
        
        // Insert new record
        const { data, error } = await supabase
          .from('financial_metrics')
          .insert({
            ...body,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: user.id
          })
          .select()
          .single();
        
        if (error) {
          console.error('❌ Error inserting financial metrics:', error);
          return NextResponse.json(
            { error: 'Failed to insert financial metrics', details: error.message },
            { status: 500 }
          );
        }
        
        result = data;
      }
    } else {
      console.log('📊 Creating new metrics for fiscal year', body.fiscal_year, 'with data source', body.data_source);
      
      // Insert new record
      const { data, error } = await supabase
        .from('financial_metrics')
        .insert({
          ...body,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: user.id
        })
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error inserting financial metrics:', error);
        return NextResponse.json(
          { error: 'Failed to insert financial metrics', details: error.message },
          { status: 500 }
        );
      }
      
      result = data;
    }
    
    console.log('✅ Successfully saved financial metrics:', result?.id);
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ Error creating financial metrics:', error);
    return NextResponse.json(
      { error: 'Failed to create financial metrics', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 