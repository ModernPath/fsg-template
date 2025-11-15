/**
 * Test Gamma.app Integration
 * 
 * Quick test script to verify Gamma API connectivity and presentation generation
 * 
 * Usage:
 *   npx tsx tools/test-gamma.ts
 */

import * as dotenv from 'dotenv';
import { createGammaPresentation, createGammaPresentationFromPrompt } from '../lib/gamma-generator';
import type { TeaserContent } from '../lib/teaser-generator';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testGammaIntegration() {
  console.log('🧪 Testing Gamma.app Integration...\n');

  const apiKey = process.env.GAMMA_API_KEY;

  if (!apiKey) {
    console.error('❌ GAMMA_API_KEY not found in .env.local');
    console.log('\nPlease add your Gamma API key to .env.local:');
    console.log('GAMMA_API_KEY=sk-gamma-xxxxxxxx\n');
    process.exit(1);
  }

  if (!apiKey.startsWith('sk-gamma-')) {
    console.error('⚠️  API key format warning: Should start with "sk-gamma-"');
  }

  console.log('✅ API Key found:', apiKey.substring(0, 15) + '...');
  console.log();

  // Create test teaser content
  const testTeaser: TeaserContent = {
    title: 'Test M&A Opportunity: Nordic SaaS Company',
    tagline: 'Leading B2B SaaS platform in the Nordics',
    summary: 'A profitable and rapidly growing B2B SaaS company serving the Nordic market with innovative cloud-based solutions. Strong recurring revenue model, high customer retention, and significant growth potential through geographic expansion.',
    investmentHighlights: [
      '€5M ARR with 45% YoY growth',
      '95% customer retention rate',
      'Market leader in Finland with 30% market share',
      'Strong EBITDA margins of 25%',
      'Proven scalability across Nordic markets',
    ],
    businessOverview: {
      description: 'The company provides cloud-based workflow automation solutions for SMEs in the Nordic region. The platform integrates with major business tools and has a proven track record of improving operational efficiency by 30-40%.',
      industry: 'B2B SaaS / Enterprise Software',
      products: [
        'Workflow Automation Platform',
        'Integration Marketplace',
        'Analytics Dashboard',
      ],
      marketPosition: 'Market leader in Finland with growing presence in Sweden and Norway. Competing against international players with superior local market knowledge and customer support.',
    },
    financialSnapshot: {
      revenue: '€5.0M (2023), +45% YoY growth',
      profitMargin: '25% EBITDA margin',
      growthRate: '45% annual growth (3-year CAGR)',
      ebitda: '€1.25M EBITDA',
    },
    competitiveAdvantages: [
      'Deep Nordic market knowledge and local language support',
      'Superior customer success organization',
      'Proprietary integration technology',
    ],
    growthOpportunities: [
      'Geographic expansion to Denmark and Baltics',
      'Enterprise segment penetration',
      'Strategic partnerships with major software vendors',
    ],
    idealBuyer: [
      'Strategic: International SaaS companies seeking Nordic entry',
      'Strategic: Larger Nordic software companies seeking consolidation',
      'Financial: Growth equity funds focused on B2B SaaS',
    ],
    transactionRationale: 'Optimal market conditions with strong SaaS valuations, mature product offering ready for scaling, and founder readiness for succession planning.',
    nextSteps: 'Interested parties should contact the M&A advisor for a confidential information memorandum and management presentations.',
  };

  console.log('📝 Test Teaser Content:');
  console.log('   Title:', testTeaser.title);
  console.log('   Slides:', 11);
  console.log();

  // Test 1: Structured API approach
  console.log('🧪 Test 1: Structured API (preferred method)...');
  try {
    const presentation = await createGammaPresentation(testTeaser, apiKey);
    console.log('✅ Success!');
    console.log('   Presentation ID:', presentation.id);
    console.log('   URL:', presentation.url);
    console.log('   Edit URL:', presentation.editUrl || 'N/A');
    console.log('   Status:', presentation.status);
    console.log();
    return; // Success, no need to try prompt-based approach
  } catch (error) {
    console.error('❌ Structured API failed:', error instanceof Error ? error.message : String(error));
    console.log('   Trying alternative prompt-based approach...\n');
  }

  // Test 2: Prompt-based approach (fallback)
  console.log('🧪 Test 2: Prompt-based API (fallback method)...');
  try {
    const prompt = `Create a professional M&A teaser presentation for "${testTeaser.title}".

Executive Summary: ${testTeaser.summary}

Investment Highlights:
${testTeaser.investmentHighlights.join('\n')}

Include slides for: business overview, financial snapshot, competitive advantages, growth opportunities, ideal buyer profile, and next steps.

Make it visually appealing with a professional business theme.`;

    const presentation = await createGammaPresentationFromPrompt(prompt, apiKey);
    console.log('✅ Success!');
    console.log('   Presentation ID:', presentation.id);
    console.log('   URL:', presentation.url);
    console.log('   Edit URL:', presentation.editUrl || 'N/A');
    console.log('   Status:', presentation.status);
    console.log();
  } catch (error) {
    console.error('❌ Prompt-based API also failed:', error instanceof Error ? error.message : String(error));
    console.log('\n⚠️  Both approaches failed. Please verify:');
    console.log('   1. API key is valid and active');
    console.log('   2. You have a Pro or Ultra subscription');
    console.log('   3. API endpoint URLs are correct');
    console.log('   4. Check Gamma API documentation for any changes\n');
    process.exit(1);
  }
}

// Run test
testGammaIntegration().catch((error) => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});

