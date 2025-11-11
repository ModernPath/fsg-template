import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * Debug endpoint to check financial_metrics data for a company
 * GET /api/debug/financial-metrics?companyId=uuid
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    console.log('🔍 [DEBUG] Checking financial metrics for company:', companyId);

    // Use service role client to bypass RLS for debugging
    const supabase = await createClient(undefined, true);

    // Get company info
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, business_id, metadata')
      .eq('id', companyId)
      .single();

    if (companyError) {
      return NextResponse.json({
        error: 'Company not found',
        details: companyError.message
      }, { status: 404 });
    }

    // Get all financial_metrics for this company
    const { data: financialMetrics, error: metricsError } = await supabase
      .from('financial_metrics')
      .select('*')
      .eq('company_id', companyId)
      .order('fiscal_year', { ascending: false });

    if (metricsError) {
      console.error('❌ Error fetching financial metrics:', metricsError);
    }

    // Get user_companies relationships
    const { data: userCompanies, error: userCompaniesError } = await supabase
      .from('user_companies')
      .select('user_id, role')
      .eq('company_id', companyId);

    if (userCompaniesError) {
      console.error('❌ Error fetching user companies:', userCompaniesError);
    }

    // Get profiles linked to this company
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, company_id')
      .eq('company_id', companyId);

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
    }

    return NextResponse.json({
      success: true,
      debug_info: {
        company: {
          id: company.id,
          name: company.name,
          business_id: company.business_id,
          has_metadata: !!company.metadata,
          metadata_keys: company.metadata ? Object.keys(company.metadata) : [],
          financial_data_in_metadata: company.metadata?.financial_data ? {
            has_yearly: !!company.metadata.financial_data.yearly,
            yearly_count: company.metadata.financial_data.yearly?.length || 0,
            latest: !!company.metadata.financial_data.latest
          } : null
        },
        financial_metrics: {
          count: financialMetrics?.length || 0,
          records: financialMetrics || [],
          years: financialMetrics?.map(m => m.fiscal_year) || []
        },
        user_companies: {
          count: userCompanies?.length || 0,
          relationships: userCompanies || []
        },
        profiles: {
          count: profiles?.length || 0,
          linked_profiles: profiles || []
        }
      }
    });

  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
