/**
 * Inngest Background Job: Company Enrichment
 * 
 * Processes company enrichment in the background
 * Handles all 17 modules (9 base + 8 M&A extensions)
 * 
 * Event: company/enrichment.requested
 * 
 * Flow:
 * 1. Initialize job
 * 2. Fetch company details
 * 3. Run base modules (1-9) from Trusty Finance
 * 4. Run M&A extension modules (10-17)
 * 5. Save to database
 * 6. Update job status
 * 7. Update company status
 */

import { inngest } from '@/lib/inngest-client';
import { createClient } from '@supabase/supabase-js';
import { createCompanyEnrichment } from '@/lib/company-enrichment';
// Base modules (3-9)
import { enrichIndustryAnalysis } from '@/lib/enrichment-modules/industry-analysis';
import { enrichCompetitiveAnalysis } from '@/lib/enrichment-modules/competitive-analysis';
import { enrichGrowthAnalysis } from '@/lib/enrichment-modules/growth-analysis';
import { enrichFinancialHealth } from '@/lib/enrichment-modules/financial-health';
import { enrichPersonnelInfo } from '@/lib/enrichment-modules/personnel-info';
import { enrichMarketIntelligence } from '@/lib/enrichment-modules/market-intelligence';
import { enrichWebPresence } from '@/lib/enrichment-modules/web-presence';

// M&A extension modules (10-17)
import { enrichMAHistory } from '@/lib/enrichment-modules/ma-history';
import { enrichValuation } from '@/lib/enrichment-modules/valuation';
import { enrichCustomerIntelligence } from '@/lib/enrichment-modules/customer-intelligence';
import { enrichOperationalEfficiency } from '@/lib/enrichment-modules/operational-efficiency';
import { enrichCompetitiveAdvantages } from '@/lib/enrichment-modules/competitive-advantages';
import { enrichRiskAssessment } from '@/lib/enrichment-modules/risk-assessment';
import { enrichIntegrationPotential } from '@/lib/enrichment-modules/integration-potential';
import { enrichExitAttractiveness } from '@/lib/enrichment-modules/exit-attractiveness';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Database } from '@/types/database';

// Initialize Supabase client with service role
const getServiceClient = () => {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};

/**
 * Main enrichment function
 */
export const companyEnrichmentJob = inngest.createFunction(
  {
    id: 'company-enrichment',
    name: 'Company Data Enrichment',
    retries: 2,
    concurrency: {
      limit: 5,  // Max 5 concurrent enrichments
      key: 'event.data.companyId',  // One enrichment per company at a time
    },
  },
  { event: 'company/enrichment.requested' },
  async ({ event, step }) => {
    const { companyId, jobId, businessId, companyName, userId, config } = event.data;
    
    console.log(`\n🚀 [Inngest] Starting enrichment for ${companyName} (${businessId})`);
    
    const supabase = getServiceClient();
    const startTime = Date.now();

    // ==========================================================================
    // STEP 1: Initialize job
    // ==========================================================================
    await step.run('initialize-job', async () => {
      console.log('📝 [Step 1] Initializing job...');
      
      await supabase
        .from('enrichment_jobs')
        .update({
          status: 'processing',
          started_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      return { success: true };
    });

    // ==========================================================================
    // STEP 2: Fetch company details
    // ==========================================================================
    const company = await step.run('fetch-company', async () => {
      console.log('🏢 [Step 2] Fetching company details...');
      
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (error || !data) {
        throw new Error(`Company not found: ${companyId}`);
      }

      return data;
    });

    if (!company) {
      throw new Error('Company data missing');
    }

    console.log(`✅ Company: ${company.name}`);

    // ==========================================================================
    // STEP 3-11: BASE MODULES (Trusty Finance - Modules 1-9)
    // ==========================================================================
    
    const enrichment = createCompanyEnrichment('fi');
    
    let baseEnrichedData;
    
    try {
      baseEnrichedData = await step.run('enrich-base-modules', async () => {
        console.log('📊 [Step 3-11] Running Trusty Finance base modules (1-9)...');
        
        // Update module status
        await supabase
          .from('enrichment_jobs')
          .update({
            module_status: {
              basic_info: { status: 'processing', startedAt: new Date().toISOString() },
            },
          })
          .eq('id', jobId);

        // Run enrichment
        const result = await enrichment.enrichCompany(
          company.business_id || businessId,
          company.name || companyName,
          {
            country: company.country || 'FI',
            industry: company.industry,
            website: company.website,
          }
        );

        console.log(`✅ Base modules completed. Confidence: ${result.metadata.confidence}%`);
        
        // Update job progress
        await supabase
          .from('enrichment_jobs')
          .update({
            completed_modules: 9,
            module_status: {
              basic_info: { status: 'completed', completedAt: new Date().toISOString() },
              financial_data: { status: 'completed', completedAt: new Date().toISOString() },
              industry_analysis: { status: 'completed', completedAt: new Date().toISOString() },
              competitive_analysis: { status: 'completed', completedAt: new Date().toISOString() },
              growth_analysis: { status: 'completed', completedAt: new Date().toISOString() },
              financial_health: { status: 'completed', completedAt: new Date().toISOString() },
              personnel_info: { status: 'completed', completedAt: new Date().toISOString() },
              market_intelligence: { status: 'completed', completedAt: new Date().toISOString() },
              web_presence: { status: 'completed', completedAt: new Date().toISOString() },
            },
          })
          .eq('id', jobId);

        return result;
      });
    } catch (error) {
      console.error('❌ [Base Modules] Error:', error);
      
      // Update job with error
      await supabase
        .from('enrichment_jobs')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error in base modules',
          completed_at: new Date().toISOString(),
          total_duration_ms: Date.now() - startTime,
        })
        .eq('id', jobId);

      throw error;
    }

    // ==========================================================================
    // STEP 12-18: ADDITIONAL BASE MODULES (Modules 3-9)
    // ==========================================================================
    
    // Initialize Gemini AI client
    const genAI = new GoogleGenerativeAI(
      process.env.GOOGLE_AI_STUDIO_KEY || process.env.GEMINI_API_KEY!
    );

    // Module 3: Industry Analysis
    const industryAnalysis = await step.run('enrich-industry-analysis', async () => {
      console.log('🏭 [Module 3] Enriching Industry Analysis...');
      return await enrichIndustryAnalysis({
        companyName: company.name,
        industry: company.industry || baseEnrichedData.basicInfo.industry || 'Unknown',
        country: company.country || 'FI',
      }, genAI);
    });

    // Module 4: Competitive Analysis
    const competitiveAnalysis = await step.run('enrich-competitive-analysis', async () => {
      console.log('⚔️ [Module 4] Enriching Competitive Analysis...');
      return await enrichCompetitiveAnalysis({
        companyName: company.name,
        industry: company.industry || baseEnrichedData.basicInfo.industry || 'Unknown',
        country: company.country || 'FI',
      }, genAI);
    });

    // Module 5: Growth Analysis
    const growthAnalysis = await step.run('enrich-growth-analysis', async () => {
      console.log('📈 [Module 5] Enriching Growth Analysis...');
      return await enrichGrowthAnalysis({
        companyName: company.name,
        industry: company.industry || baseEnrichedData.basicInfo.industry || 'Unknown',
        basicInfo: baseEnrichedData.basicInfo,
      }, genAI);
    });

    // Module 6: Financial Health
    const financialHealth = await step.run('enrich-financial-health', async () => {
      console.log('💚 [Module 6] Enriching Financial Health...');
      return await enrichFinancialHealth({
        companyName: company.name,
        businessId: company.business_id || businessId,
        financialData: baseEnrichedData.financialData,
        country: company.country || 'FI',
      }, genAI);
    });

    // Module 7: Personnel Info
    const personnelInfo = await step.run('enrich-personnel-info', async () => {
      console.log('👥 [Module 7] Enriching Personnel Info...');
      return await enrichPersonnelInfo({
        companyName: company.name,
        businessId: company.business_id || businessId,
        basicInfo: baseEnrichedData.basicInfo,
      }, genAI);
    });

    // Module 8: Market Intelligence
    const marketIntelligence = await step.run('enrich-market-intelligence', async () => {
      console.log('📰 [Module 8] Enriching Market Intelligence...');
      return await enrichMarketIntelligence({
        companyName: company.name,
        website: company.website || baseEnrichedData.basicInfo.website,
      }, genAI);
    });

    // Module 9: Web Presence
    const webPresence = await step.run('enrich-web-presence', async () => {
      console.log('🌐 [Module 9] Enriching Web Presence...');
      return await enrichWebPresence({
        companyName: company.name,
        website: company.website || baseEnrichedData.basicInfo.website,
      }, genAI);
    });

    console.log('✅ [BATCH 1/2] Base modules completed!');
    
    // ==========================================================================
    // ⏳ RATE LIMIT DELAY: 60 seconds between batches
    // ==========================================================================
    // Gemini API Free Tier: 10 requests per minute
    // Batch 1 (Modules 1-9): ~9 requests
    // Batch 2 (Modules 10-17): ~8 requests
    // Total: ~17 requests → Split into 2 batches with 60s delay
    
    // Rate limit delay - Configurable (60-90s recommended)
    const RATE_LIMIT_DELAY_MS = 70000; // 70 seconds for safety margin
    
    console.log(`⏳ [RATE LIMIT] Waiting ${RATE_LIMIT_DELAY_MS / 1000} seconds to avoid rate limit...`);
    console.log('💡 [TIP] Upgrade to Gemini API paid tier for instant processing!');
    console.log('   Free tier: 10 req/min | Paid tier: 1000 req/min (~$3/month)');
    
    await step.sleep('rate-limit-delay', RATE_LIMIT_DELAY_MS);
    
    console.log('✅ [RATE LIMIT] Delay complete, continuing with M&A modules...');

    // ==========================================================================
    // STEP 19-26: M&A EXTENSION MODULES (Modules 10-17) - BATCH 2
    // ==========================================================================
    console.log('⚡ [BATCH 2/2] Processing M&A enrichment modules...');
    
    // Module 10: M&A History
    const maHistory = await step.run('enrich-ma-history', async () => {
      console.log('🔄 [Module 10] Enriching M&A History...');
      return await enrichMAHistory({
        businessId: company.business_id || businessId,
        companyName: company.name,
        country: company.country || 'FI',
        industry: company.industry || baseEnrichedData.basicInfo.industry,
        website: company.website || baseEnrichedData.basicInfo.website,
      }, genAI);
    });

    // Module 11: Valuation Data
    const valuationData = await step.run('enrich-valuation', async () => {
      console.log('💎 [Module 11] Enriching Valuation...');
      return await enrichValuation({
        companyName: company.name,
        industry: company.industry || baseEnrichedData.basicInfo.industry || 'Unknown',
        financialData: baseEnrichedData.financialData,
        country: company.country || 'FI',
      }, genAI);
    });

    // Module 12: Customer Intelligence
    const customerIntelligence = await step.run('enrich-customer-intel', async () => {
      console.log('🎯 [Module 12] Enriching Customer Intelligence...');
      return await enrichCustomerIntelligence({
        companyName: company.name,
        industry: company.industry || baseEnrichedData.basicInfo.industry || 'Unknown',
        businessModel: growthAnalysis.businessModel,
        basicInfo: baseEnrichedData.basicInfo,
        financialData: baseEnrichedData.financialData,
      }, genAI);
    });

    // Module 13: Operational Efficiency
    const operationalEfficiency = await step.run('enrich-operational', async () => {
      console.log('⚙️ [Module 13] Enriching Operational Efficiency...');
      return await enrichOperationalEfficiency({
        companyName: company.name,
        industry: company.industry || baseEnrichedData.basicInfo.industry || 'Unknown',
        financialData: baseEnrichedData.financialData,
        personnelInfo: personnelInfo,
      }, genAI);
    });

    // Module 14: Competitive Advantages
    const competitiveAdvantages = await step.run('enrich-competitive-advantages', async () => {
      console.log('🛡️ [Module 14] Enriching Competitive Advantages...');
      return await enrichCompetitiveAdvantages({
        companyName: company.name,
        industry: company.industry || baseEnrichedData.basicInfo.industry || 'Unknown',
        basicInfo: baseEnrichedData.basicInfo,
      }, genAI);
    });

    // Module 15: Risk Assessment
    const riskAssessment = await step.run('enrich-risk-assessment', async () => {
      console.log('⚠️ [Module 15] Enriching Risk Assessment...');
      return await enrichRiskAssessment({
        companyName: company.name,
        businessId: company.business_id || businessId,
        industry: company.industry || baseEnrichedData.basicInfo.industry || 'Unknown',
        basicInfo: baseEnrichedData.basicInfo,
        financialData: baseEnrichedData.financialData,
      }, genAI);
    });

    // Module 16: Integration Potential
    const integrationPotential = await step.run('enrich-integration', async () => {
      console.log('🔗 [Module 16] Enriching Integration Potential...');
      return await enrichIntegrationPotential({
        companyName: company.name,
        industry: company.industry || baseEnrichedData.basicInfo.industry || 'Unknown',
        basicInfo: baseEnrichedData.basicInfo,
        financialData: baseEnrichedData.financialData,
      }, genAI);
    });

    // Module 17: Exit Attractiveness
    const exitAttractiveness = await step.run('enrich-exit', async () => {
      console.log('🚪 [Module 17] Enriching Exit Attractiveness...');
      return await enrichExitAttractiveness({
        companyName: company.name,
        industry: company.industry || baseEnrichedData.basicInfo.industry || 'Unknown',
        basicInfo: baseEnrichedData.basicInfo,
        financialData: baseEnrichedData.financialData,
        valuationData: valuationData,
      }, genAI);
    });

    console.log('✅ [BATCH 2/2] M&A modules completed!');

    // ==========================================================================
    // STEP 20: Save enriched data
    // ==========================================================================
    
    await step.run('save-enriched-data', async () => {
      console.log('💾 [Step 20] Saving enriched data...');
      
      const { error } = await supabase
        .from('company_enriched_data')
        .upsert({
          company_id: companyId,
          
          // Base modules (1-9)
          basic_info: baseEnrichedData.basicInfo,
          financial_data: baseEnrichedData.financialData,
          industry_analysis: industryAnalysis,
          competitive_analysis: competitiveAnalysis,
          growth_analysis: growthAnalysis,
          financial_health: financialHealth,
          personnel_info: personnelInfo,
          market_intelligence: marketIntelligence,
          web_presence: webPresence,
          
          // M&A extensions
          ma_history: maHistory,
          valuation_data: valuationData,
          customer_intelligence: customerIntelligence,
          operational_efficiency: operationalEfficiency,
          competitive_advantages: competitiveAdvantages,
          risk_assessment: riskAssessment,
          integration_potential: integrationPotential,
          exit_attractiveness: exitAttractiveness,
          
          // Metadata
          confidence_score: baseEnrichedData.metadata.confidence,
          completeness_score: baseEnrichedData.metadata.completeness,
          data_quality_score: baseEnrichedData.metadata.confidence,
          last_enriched_at: new Date().toISOString(),
          enriched_by: userId,
          sources_used: baseEnrichedData.metadata.sourcesUsed,
          total_api_calls: 2, // base modules used 2 API calls
          processing_time_ms: Date.now() - startTime,
        }, {
          onConflict: 'company_id', // Update if company_id already exists
        });

      if (error) {
        console.error('❌ Save error:', error);
        throw new Error(`Failed to save enriched data: ${error.message}`);
      }

      console.log('✅ Data saved successfully');
    });

    // ==========================================================================
    // STEP 21: Update job status
    // ==========================================================================
    
    await step.run('complete-job', async () => {
      console.log('✅ [Step 21] Completing job...');
      
      await supabase
        .from('enrichment_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completed_modules: 17,
          total_duration_ms: Date.now() - startTime,
        })
        .eq('id', jobId);
    });

    // ==========================================================================
    // STEP 22: Update company status
    // ==========================================================================
    
    await step.run('update-company-status', async () => {
      console.log('🏢 [Step 22] Updating company status...');
      
      await supabase
        .from('companies')
        .update({
          enrichment_status: 'enriched',
          last_enriched_at: new Date().toISOString(),
          enrichment_completeness: baseEnrichedData.metadata.completeness,
        })
        .eq('id', companyId);
    });

    // ==========================================================================
    // COMPLETE
    // ==========================================================================
    
    const totalDuration = Date.now() - startTime;
    console.log(`\n✅ [Inngest] Enrichment completed in ${totalDuration}ms`);
    console.log(`📊 Final stats:
      - Modules: 17/17
      - Confidence: ${baseEnrichedData.metadata.confidence}%
      - Completeness: ${baseEnrichedData.metadata.completeness}%
      - Duration: ${Math.round(totalDuration / 1000)}s
    `);

    return {
      success: true,
      companyId,
      jobId,
      duration: totalDuration,
      modulesCompleted: 17,
      confidence: baseEnrichedData.metadata.confidence,
      completeness: baseEnrichedData.metadata.completeness,
    };
  }
);

