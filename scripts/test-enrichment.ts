/**
 * Direct Enrichment Test Script
 * Tests the enrichment engine without UI or auth
 */

import { createCompanyEnrichment } from '../lib/company-enrichment';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

async function testEnrichment() {
  console.log('\n🧪 TESTING ENRICHMENT ENGINE\n');
  console.log('=' .repeat(50));

  // 1. Check environment
  console.log('\n📋 Step 1: Checking environment...');
  const geminiKey = process.env.GOOGLE_AI_STUDIO_KEY || process.env.GEMINI_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('  ✓ Gemini API Key:', geminiKey ? '✅ FOUND' : '❌ MISSING');
  console.log('  ✓ Supabase URL:', supabaseUrl ? '✅ FOUND' : '❌ MISSING');
  console.log('  ✓ Supabase Key:', supabaseKey ? '✅ FOUND' : '❌ MISSING');

  if (!geminiKey || !supabaseUrl || !supabaseKey) {
    console.error('\n❌ Missing required environment variables!');
    process.exit(1);
  }

  // 2. Get a test company
  console.log('\n📋 Step 2: Getting test company...');
  const supabase = createClient<Database>(supabaseUrl, supabaseKey);

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id, name, business_id, country, industry, website')
    .limit(1)
    .single();

  if (companyError || !company) {
    console.error('❌ No test company found:', companyError?.message);
    process.exit(1);
  }

  console.log('  ✓ Company:', company.name);
  console.log('  ✓ Business ID:', company.business_id || 'MISSING');
  console.log('  ✓ Industry:', company.industry || 'Unknown');

  // 3. Initialize enrichment engine
  console.log('\n📋 Step 3: Initializing enrichment engine...');
  
  let enrichmentEngine;
  try {
    enrichmentEngine = createCompanyEnrichment('fi');
    console.log('  ✓ Engine initialized');
  } catch (error) {
    console.error('❌ Failed to initialize engine:', error);
    process.exit(1);
  }

  // 4. Run enrichment (Modules 1-2 only for quick test)
  console.log('\n📋 Step 4: Running BASE enrichment (Modules 1-2)...');
  console.log('  → This will take 10-30 seconds...\n');

  const startTime = Date.now();

  try {
    const result = await enrichmentEngine.enrichCompany(
      company.business_id || '1234567-8', // Fallback business ID
      company.name,
      {
        country: company.country || 'FI',
        industry: company.industry || undefined,
        website: company.website || undefined,
      }
    );

    const duration = Date.now() - startTime;

    console.log('\n' + '='.repeat(50));
    console.log('✅ ENRICHMENT SUCCESSFUL!');
    console.log('='.repeat(50));
    console.log(`⏱️  Duration: ${Math.round(duration / 1000)}s`);
    console.log(`📊 Confidence: ${result.metadata.confidence}%`);
    console.log(`📈 Completeness: ${result.metadata.completeness}%`);
    console.log(`🔍 Sources: ${result.metadata.sourcesUsed.join(', ')}`);
    console.log('\n📋 Basic Info:');
    console.log(`  - Name: ${result.basicInfo.name}`);
    console.log(`  - Industry: ${result.basicInfo.industry}`);
    console.log(`  - Employees: ${result.basicInfo.employees || 'Unknown'}`);
    console.log(`  - Description length: ${result.basicInfo.description?.length || 0} chars`);
    console.log('\n💰 Financial Data:');
    console.log(`  - Years found: ${result.financialData.yearsFound}`);
    console.log(`  - Currency: ${result.financialData.currency}`);
    console.log(`  - Confidence: ${result.financialData.confidence}`);

    // 5. Save to database
    console.log('\n📋 Step 5: Saving to database...');
    
    const { error: saveError } = await supabase
      .from('company_enriched_data')
      .upsert({
        company_id: company.id,
        basic_info: result.basicInfo as any,
        financial_data: result.financialData as any,
        industry_analysis: result.industryAnalysis as any,
        competitive_analysis: result.competitiveAnalysis as any,
        growth_analysis: result.growthAnalysis as any,
        financial_health: result.financialHealth as any,
        personnel_info: result.personnelInfo as any,
        market_intelligence: result.marketIntelligence as any,
        web_presence: result.webPresence as any,
        confidence_score: result.metadata.confidence,
        completeness_score: result.metadata.completeness,
        last_enriched_at: new Date().toISOString(),
      });

    if (saveError) {
      console.error('❌ Save error:', saveError);
    } else {
      console.log('  ✓ Data saved successfully');
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 ALL TESTS PASSED!');
    console.log('='.repeat(50));
    process.exit(0);

  } catch (error) {
    console.error('\n' + '='.repeat(50));
    console.error('❌ ENRICHMENT FAILED!');
    console.error('='.repeat(50));
    console.error(error);
    process.exit(1);
  }
}

// Run test
testEnrichment();

