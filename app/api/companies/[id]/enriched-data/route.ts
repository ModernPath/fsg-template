/**
 * GET /api/companies/[id]/enriched-data
 * 
 * Retrieves enriched company data from database
 * Returns all 17 modules + metadata
 * 
 * Response:
 * - success: boolean
 * - data: EnrichedCompanyData with all modules
 * - metadata: Quality scores, sources, timestamps
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import type { EnrichedCompanyData } from '@/types/company-enrichment';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`\n📊 [GET /api/companies/${params.id}/enriched-data] Starting...`);

    // 1. Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ Authentication failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`✅ User authenticated: ${user.id}`);

    const companyId = params.id;

    // 2. Verify company access
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, business_id, organization_id')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      console.error('❌ Company not found or access denied');
      return NextResponse.json(
        { error: 'Company not found or access denied' },
        { status: 404 }
      );
    }

    console.log(`🏢 Company: ${company.name}`);

    // 3. Fetch enriched data
    const { data: enrichedData, error: enrichedError } = await supabase
      .from('company_enriched_data')
      .select('*')
      .eq('company_id', companyId)
      .maybeSingle();

    if (enrichedError) {
      console.error('❌ Failed to fetch enriched data:', enrichedError);
      return NextResponse.json(
        { error: 'Failed to fetch enriched data' },
        { status: 500 }
      );
    }

    if (!enrichedData) {
      console.log('⚠️ No enriched data found for this company');
      return NextResponse.json({
        success: false,
        error: 'No enriched data available',
        message: 'Please run enrichment first',
      }, { status: 404 });
    }

    console.log('✅ Enriched data found');

    // 4. Transform database format to API format
    const responseData: EnrichedCompanyData = {
      // Modules 1-9: Trusty Finance Base
      basicInfo: enrichedData.basic_info || {},
      financialData: enrichedData.financial_data || { yearly: [], currency: 'EUR', lastUpdated: new Date(), sourcesUsed: [], yearsFound: 0, confidence: 'LOW' },
      industryAnalysis: enrichedData.industry_analysis || {},
      competitiveAnalysis: enrichedData.competitive_analysis || {},
      growthAnalysis: enrichedData.growth_analysis || {},
      financialHealth: enrichedData.financial_health || {},
      personnelInfo: enrichedData.personnel_info || {},
      marketIntelligence: enrichedData.market_intelligence || {},
      webPresence: enrichedData.web_presence || {},
      
      // Modules 10-17: BizExit M&A Extensions
      maHistory: enrichedData.ma_history || undefined,
      valuationData: enrichedData.valuation_data || undefined,
      customerIntelligence: enrichedData.customer_intelligence || undefined,
      operationalEfficiency: enrichedData.operational_efficiency || undefined,
      competitiveAdvantages: enrichedData.competitive_advantages || undefined,
      riskAssessment: enrichedData.risk_assessment || undefined,
      integrationPotential: enrichedData.integration_potential || undefined,
      exitAttractiveness: enrichedData.exit_attractiveness || undefined,
      
      // Metadata
      metadata: {
        confidence: enrichedData.confidence_score || 0,
        completeness: enrichedData.completeness_score || 0,
        lastEnriched: new Date(enrichedData.last_enriched_at || enrichedData.updated_at),
        sourcesUsed: enrichedData.sources_used || [],
        processingTime: enrichedData.processing_time_ms || 0,
      },
    };

    // 5. Return success response
    return NextResponse.json({
      success: true,
      data: responseData,
      metadata: {
        confidenceScore: enrichedData.confidence_score,
        completenessScore: enrichedData.completeness_score,
        dataQualityScore: enrichedData.data_quality_score,
        lastEnriched: enrichedData.last_enriched_at,
        sourcesUsed: enrichedData.sources_used,
        enrichmentVersion: enrichedData.enrichment_version,
      },
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
