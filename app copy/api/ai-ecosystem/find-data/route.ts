/**
 * AI ECOSYSTEM - FIND DATA
 * 
 * Main endpoint for AI-powered company data discovery
 * Uses the AI Orchestrator to intelligently find financial data
 */

import { NextRequest, NextResponse } from 'next/server';
import { findCompanyFinancialData } from '@/lib/ai-ecosystem/ai-orchestrator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, companyName, countryCode } = body;

    if (!businessId) {
      return NextResponse.json({
        success: false,
        error: 'Business ID is required'
      }, { status: 400 });
    }

    console.log(`\n🧠 [AI ECOSYSTEM API] Request for ${companyName || businessId}`);

    // Call AI Orchestrator
    const result = await findCompanyFinancialData(
      businessId,
      companyName || null,
      countryCode || 'FI'
    );

    // Format response
    return NextResponse.json({
      success: result.success,
      data: result.data,
      metadata: {
        source: result.source,
        method: result.method,
        confidence: result.confidence,
        insights: result.insights,
        improvements: result.improvements
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [AI ECOSYSTEM API] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'AI Ecosystem error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

