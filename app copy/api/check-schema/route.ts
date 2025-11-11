import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

export async function GET(request: Request) {
  try {
    // Check companies table schema
    const { data: companies, error: companiesError } = await supabaseAdmin
      .from('companies')
      .select('*')
      .limit(1);
      
    if (companiesError) {
      return NextResponse.json({
        error: 'Error fetching companies table',
        details: companiesError.message
      }, { status: 500 });
    }
    
    // Get companies columns
    const companiesColumns = companies && companies.length > 0 
      ? Object.keys(companies[0])
      : [];
    
    // Check financial_analyses table schema
    const { data: analyses, error: analysesError } = await supabaseAdmin
      .from('financial_analyses')
      .select('*')
      .limit(1);
      
    if (analysesError) {
      return NextResponse.json({
        error: 'Error fetching financial_analyses table',
        details: analysesError.message
      }, { status: 500 });
    }
    
    // Get financial_analyses columns
    const analysesColumns = analyses && analyses.length > 0 
      ? Object.keys(analyses[0])
      : [];
    
    return NextResponse.json({
      success: true,
      companies: {
        columns: companiesColumns,
        sample: companies
      },
      financial_analyses: {
        columns: analysesColumns,
        sample: analyses
      }
    });
  } catch (error) {
    console.error('Error checking schema:', error);
    return NextResponse.json({
      error: 'Failed to check schema',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 