/**
 * AI ECOSYSTEM INSIGHTS API
 * 
 * Shows what the AI has learned, how it's improving,
 * and what it suggests for better data collection
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { smartGeminiGenerate } from '@/lib/ai-ecosystem/smart-gemini';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const countryCode = searchParams.get('country') || 'FI';
    const period = searchParams.get('period') || '7d'; // 7d, 30d, 90d

    // Get period date
    const daysAgo = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - daysAgo);

    // 1. Get source performance
    const { data: sources } = await supabase
      .from('scraping_sources')
      .select('*')
      .eq('country_code', countryCode)
      .order('success_rate', { ascending: false });

    // 2. Get recent attempts
    const { data: recentAttempts } = await supabase
      .from('scraping_attempts')
      .select('*')
      .eq('country_code', countryCode)
      .gte('attempted_at', sinceDate.toISOString())
      .order('attempted_at', { ascending: false });

    // 3. Calculate statistics
    const totalAttempts = recentAttempts?.length || 0;
    const successfulAttempts = recentAttempts?.filter(a => a.success).length || 0;
    const successRate = totalAttempts > 0 ? (successfulAttempts / totalAttempts * 100).toFixed(1) : '0';

    // 4. Get AI to analyze trends and suggest improvements
    console.log('🧠 [AI ECOSYSTEM] Asking AI to analyze trends...');
    
    const analysisPrompt = `You are the AI Brain analyzing the performance of the financial data extraction ecosystem.

PERIOD: Last ${daysAgo} days
COUNTRY: ${countryCode}

SOURCE PERFORMANCE:
${JSON.stringify(sources, null, 2)}

RECENT ATTEMPTS (last 50):
${JSON.stringify(recentAttempts?.slice(0, 50), null, 2)}

OVERALL STATS:
- Total attempts: ${totalAttempts}
- Successful: ${successfulAttempts}
- Success rate: ${successRate}%

YOUR TASK:
Analyze this data and provide strategic insights.

Return JSON:
{
  "overallHealth": "excellent|good|fair|poor",
  "healthScore": 0-100,
  "keyFindings": [
    "finding 1",
    "finding 2",
    "finding 3"
  ],
  "trends": {
    "improving": ["trend1", "trend2"],
    "declining": ["trend1", "trend2"]
  },
  "sourceRecommendations": [
    {
      "source": "source name",
      "action": "prioritize|deprioritize|investigate|replace",
      "reasoning": "why"
    }
  ],
  "strategicImprovements": [
    {
      "area": "strategy|sources|extraction|performance",
      "improvement": "specific suggestion",
      "expectedImpact": "high|medium|low",
      "priority": 1-10
    }
  ],
  "newSourcesToExplore": [
    {
      "name": "source name",
      "url": "base URL",
      "reasoning": "why this source could help",
      "estimatedValue": "high|medium|low"
    }
  ],
  "aiLearnings": "What the AI has learned from these attempts"
}`;

    const aiAnalysisResult = await smartGeminiGenerate(analysisPrompt, {
      temperature: 0.7,
      responseMimeType: 'application/json'
    });
    
    console.log(`🤖 [AI ECOSYSTEM] Analysis with ${aiAnalysisResult.modelUsed}`);
    
    const insights = JSON.parse(aiAnalysisResult.text.replace(/```json\n?/g, '').replace(/```/g, '').trim());

    // 5. Return comprehensive insights
    return NextResponse.json({
      success: true,
      period: `${daysAgo} days`,
      countryCode,
      statistics: {
        totalAttempts,
        successfulAttempts,
        failedAttempts: totalAttempts - successfulAttempts,
        successRate: parseFloat(successRate),
        averageResponseTime: recentAttempts?.reduce((sum, a) => sum + (a.response_time || 0), 0) / (recentAttempts?.length || 1)
      },
      sources: sources?.map(s => ({
        name: s.source_name,
        successRate: s.success_rate,
        totalAttempts: s.total_attempts,
        priority: s.priority,
        isActive: s.is_active,
        botDetectionLevel: s.bot_detection_level,
        averageResponseTime: s.average_response_time
      })),
      aiInsights: insights,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [AI ECOSYSTEM] Error getting insights:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get AI insights',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * POST - Ask AI specific questions about the ecosystem
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, context } = body;

    if (!question) {
      return NextResponse.json({
        success: false,
        error: 'Question is required'
      }, { status: 400 });
    }

    console.log('🧠 [AI ECOSYSTEM] User asking:', question);

    // Get some context from database
    const { data: recentData } = await supabase
      .from('scraping_attempts')
      .select('*')
      .order('attempted_at', { ascending: false })
      .limit(100);

    const { data: sources } = await supabase
      .from('scraping_sources')
      .select('*')
      .eq('is_active', true);

    const prompt = `You are the AI Brain of a financial data extraction ecosystem. Answer this question based on your knowledge and the system data.

USER QUESTION: ${question}

SYSTEM CONTEXT:
Recent attempts: ${recentData?.length || 0}
Active sources: ${sources?.length || 0}

${context ? `Additional context: ${JSON.stringify(context)}` : ''}

RECENT DATA:
${JSON.stringify(recentData?.slice(0, 20), null, 2)}

SOURCES:
${JSON.stringify(sources, null, 2)}

Provide a helpful, insightful answer. Be specific and actionable.`;

    const questionResult = await smartGeminiGenerate(prompt, {
      temperature: 0.7
    });
    
    console.log(`🤖 [AI ECOSYSTEM] Question answered with ${questionResult.modelUsed}`);
    
    const answer = questionResult.text;

    return NextResponse.json({
      success: true,
      question,
      answer,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [AI ECOSYSTEM] Error answering question:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to answer question',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

