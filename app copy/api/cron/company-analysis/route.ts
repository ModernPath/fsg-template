import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Cron job handler for company financial analysis
 * This runs every 4 hours and processes any pending company analyses
 */
export async function GET(request: Request) {
  try {
    // Authenticate the request (only Vercel should be able to call this)
    const authHeader = request.headers.get('Authorization');
    
    // In production, you would verify this is actually from Vercel
    // For now, we allow the request to proceed for development purposes
    
    // Get the Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Fetch companies that need analysis
    const { data: pendingAnalyses, error } = await supabase
      .from('financial_analysis')
      .select('id, company_id, status')
      .eq('status', 'pending')
      .limit(10);
    
    if (error) {
      console.error('Error fetching pending analyses:', error);
      return NextResponse.json(
        { error: 'Failed to fetch pending analyses' },
        { status: 500 }
      );
    }
    
    // Process each pending analysis
    const results = [];
    
    for (const analysis of pendingAnalyses || []) {
      // Here you would implement the actual financial analysis logic
      // For now, we'll just update the status to 'completed'
      
      const { data, error: updateError } = await supabase
        .from('financing_analysis')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString(),
          analysis_data: {
            // Placeholder for actual analysis results
            health_score: Math.floor(Math.random() * 100),
            risk_level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
            recommendations: [
              'Consider improving cash flow',
              'Explore new financing options',
              'Review operational expenses'
            ]
          }
        })
        .eq('id', analysis.id)
        .select();
      
      if (updateError) {
        console.error(`Error updating analysis ${analysis.id}:`, updateError);
        results.push({ id: analysis.id, status: 'error', error: updateError.message });
      } else {
        results.push({ id: analysis.id, status: 'success' });
      }
    }
    
    return NextResponse.json({ 
      processed: results.length,
      results
    });
  } catch (error) {
    console.error('Error in company analysis cron job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 