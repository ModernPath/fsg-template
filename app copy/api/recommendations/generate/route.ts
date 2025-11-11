import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

// Mock financial recommendations based on analysis
function generateFinancialRecommendations(metrics: any, goals: any) {
  const recommendations = [];
  
  // Check cash flow
  if (metrics.cash_flow_ratio < 1.0) {
    recommendations.push({
      title: 'Improve Cash Flow Management',
      description: 'Your cash flow ratio is below the recommended level. Consider implementing stricter collection policies, negotiating better payment terms with suppliers, or exploring invoice factoring options.',
      category: 'finance',
      impact_level: 'high',
      implementation_difficulty: 'moderate',
      implementation_timeline: 'short',
      saved: false
    });
  }
  
  // Check profitability
  if (metrics.profit_margin < 0.15) {
    recommendations.push({
      title: 'Increase Profitability',
      description: 'Your profit margin is below industry average. Consider reviewing your pricing strategy, reducing operational costs, or focusing on higher-margin products and services.',
      category: 'finance',
      impact_level: 'high',
      implementation_difficulty: 'difficult',
      implementation_timeline: 'medium',
      saved: false
    });
  }
  
  // Check debt
  if (metrics.debt_to_equity_ratio > 2.0) {
    recommendations.push({
      title: 'Reduce Debt Levels',
      description: 'Your debt-to-equity ratio is higher than recommended. Consider restructuring debt, paying down high-interest loans, or evaluating alternatives to debt financing for growth.',
      category: 'finance',
      impact_level: 'high',
      implementation_difficulty: 'difficult',
      implementation_timeline: 'long',
      saved: false
    });
  }
  
  return recommendations;
}

// Generate operations recommendations
function generateOperationsRecommendations(metrics: any, goals: any) {
  const recommendations = [];
  
  // Efficiency recommendation
  if (metrics.operating_expense_ratio > 0.5) {
    recommendations.push({
      title: 'Streamline Operations',
      description: 'Your operating expenses are relatively high compared to revenue. Consider implementing process automation, evaluating supplier contracts, or adopting lean management practices.',
      category: 'operations',
      impact_level: 'medium',
      implementation_difficulty: 'moderate',
      implementation_timeline: 'medium',
      saved: false
    });
  }
  
  // Digital transformation
  recommendations.push({
    title: 'Embrace Digital Transformation',
    description: 'Implement digital tools to streamline operations, improve customer experience, and gather valuable data for decision-making.',
    category: 'operations',
    impact_level: 'high',
    implementation_difficulty: 'moderate',
    implementation_timeline: 'medium',
    saved: false
  });
  
  return recommendations;
}

// Generate marketing recommendations
function generateMarketingRecommendations(metrics: any, goals: any) {
  const recommendations = [];
  
  // Customer acquisition recommendation
  const hasCustomerAcquisitionGoal = goals.some((goal: any) => 
    goal.goal_type === 'customer_acquisition' || goal.goal_type === 'market_share'
  );
  
  if (hasCustomerAcquisitionGoal) {
    recommendations.push({
      title: 'Implement Customer Acquisition Strategy',
      description: 'Develop a comprehensive customer acquisition strategy focusing on targeted digital marketing, referral programs, and strategic partnerships to reach your growth targets.',
      category: 'marketing',
      impact_level: 'high',
      implementation_difficulty: 'moderate',
      implementation_timeline: 'medium',
      saved: false
    });
  }
  
  // Content marketing
  recommendations.push({
    title: 'Develop Content Marketing Strategy',
    description: 'Create valuable, industry-relevant content that positions your company as a thought leader and attracts potential customers through organic search and social sharing.',
    category: 'marketing',
    impact_level: 'medium',
    implementation_difficulty: 'easy',
    implementation_timeline: 'medium',
    saved: false
  });
  
  return recommendations;
}

// Generate strategy recommendations
function generateStrategyRecommendations(metrics: any, goals: any) {
  const recommendations = [];
  
  // Expansion goal
  const hasExpansionGoal = goals.some((goal: any) => 
    goal.goal_type === 'international_expansion' || goal.goal_type === 'market_share'
  );
  
  if (hasExpansionGoal) {
    recommendations.push({
      title: 'Develop Market Expansion Plan',
      description: 'Create a structured plan for entering new markets, including market research, regulatory considerations, localization requirements, and partnership opportunities.',
      category: 'strategy',
      impact_level: 'high',
      implementation_difficulty: 'difficult',
      implementation_timeline: 'long',
      saved: false
    });
  }
  
  // Innovation
  recommendations.push({
    title: 'Foster Innovation Culture',
    description: 'Implement structured innovation processes such as regular ideation sessions, innovation challenges, and allocating resources for testing and developing new ideas.',
    category: 'strategy',
    impact_level: 'medium',
    implementation_difficulty: 'moderate',
    implementation_timeline: 'long',
    saved: false
  });
  
  return recommendations;
}

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    const { companyId } = body;
    
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }
    
    // Initialize Supabase client
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Verify user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify user has access to this company
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', session.user.id)
      .single();
      
    if (profileError || profileData.company_id !== companyId) {
      return NextResponse.json({ error: 'Unauthorized access to company data' }, { status: 403 });
    }
    
    // Fetch required data
    const { data: metricsData, error: metricsError } = await supabase
      .from('financial_metrics')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (metricsError) {
      return NextResponse.json(
        { error: 'Error fetching financial metrics' }, 
        { status: 500 }
      );
    }
    
    const { data: goalsData, error: goalsError } = await supabase
      .from('growth_goals')
      .select('*')
      .eq('company_id', companyId);
      
    if (goalsError) {
      return NextResponse.json(
        { error: 'Error fetching growth goals' }, 
        { status: 500 }
      );
    }
    
    // Generate recommendations based on the data
    const financialRecommendations = generateFinancialRecommendations(metricsData, goalsData);
    const operationsRecommendations = generateOperationsRecommendations(metricsData, goalsData);
    const marketingRecommendations = generateMarketingRecommendations(metricsData, goalsData);
    const strategyRecommendations = generateStrategyRecommendations(metricsData, goalsData);
    
    // Combine all recommendations
    const allRecommendations = [
      ...financialRecommendations,
      ...operationsRecommendations,
      ...marketingRecommendations,
      ...strategyRecommendations
    ];
    
    // Add company_id to each recommendation
    const recommendationsWithCompanyId = allRecommendations.map(rec => ({
      ...rec,
      company_id: companyId
    }));
    
    // Save recommendations to database
    // First delete existing recommendations for this company
    await supabase
      .from('recommendations')
      .delete()
      .eq('company_id', companyId);
    
    // Then insert the new ones
    const { data: savedRecommendations, error: insertError } = await supabase
      .from('recommendations')
      .insert(recommendationsWithCompanyId)
      .select();
      
    if (insertError) {
      return NextResponse.json(
        { error: 'Error saving recommendations' }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      recommendations: savedRecommendations,
      message: 'Recommendations generated successfully' 
    });
    
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' }, 
      { status: 500 }
    );
  }
} 