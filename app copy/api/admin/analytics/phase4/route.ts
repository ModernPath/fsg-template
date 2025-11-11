import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    // Verify authentication
    const authClient = await createClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser(
      authHeader.split(' ')[1]
    );

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin status
    const { data: profile } = await authClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    
    switch (range) {
      case '1d':
        startDate.setDate(now.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Use service role client for admin queries
    const supabase = await createClient(undefined, true);

    // Get Phase 4 analytics from analytics_events table
    const { data: events, error: eventsError } = await supabase
      .from('analytics_events')
      .select('*')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', now.toISOString())
      .or('event_type.eq.phase4_displayed,event_type.eq.phase4_action,event_type.eq.phase4_custom_message,event_type.eq.phase4_exit');

    if (eventsError) {
      console.error('Error fetching Phase 4 events:', eventsError);
      return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 });
    }

    // Get A/B test data
    const { data: abEvents, error: abError } = await supabase
      .from('ab_events')
      .select(`
        *,
        ab_variants(name, config),
        ab_experiments(name)
      `)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', now.toISOString())
      .eq('ab_experiments.name', 'phase4-ui-design');

    if (abError) {
      console.error('Error fetching A/B test data:', abError);
      // Continue without A/B data if it fails
    }

    // Process the data
    const analytics = processPhase4Analytics(events || [], abEvents || []);

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Phase 4 analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function processPhase4Analytics(events: any[], abEvents: any[]) {
  // Initialize analytics object
  const analytics = {
    totalDisplays: 0,
    actionBreakdown: {
      refine: 0,
      justify: 0,
      proceed: 0
    },
    customMessageUsage: 0,
    averageTimeToDecision: 0,
    conversionRate: 0,
    abandonmentRate: 0,
    variantPerformance: {
      control: {
        name: 'Control (Cards)',
        displays: 0,
        proceeds: 0,
        conversionRate: 0
      },
      variant: {
        name: 'Variant B (Horizontal)',
        displays: 0,
        proceeds: 0,
        conversionRate: 0
      }
    }
  };

  // Group events by session for better analysis
  const sessionData = new Map();

  // Process regular analytics events
  events.forEach(event => {
    const sessionId = event.session_id;
    
    if (!sessionData.has(sessionId)) {
      sessionData.set(sessionId, {
        displayed: false,
        actions: [],
        customMessage: false,
        proceeded: false,
        abandoned: false,
        displayTime: null,
        actionTime: null
      });
    }

    const session = sessionData.get(sessionId);

    switch (event.event_type) {
      case 'phase4_displayed':
        analytics.totalDisplays++;
        session.displayed = true;
        session.displayTime = new Date(event.timestamp);
        break;

      case 'phase4_action':
        const action = event.custom_dimensions?.action;
        if (action && analytics.actionBreakdown[action as keyof typeof analytics.actionBreakdown] !== undefined) {
          analytics.actionBreakdown[action as keyof typeof analytics.actionBreakdown]++;
          session.actions.push(action);
          session.actionTime = new Date(event.timestamp);
          
          if (action === 'proceed') {
            session.proceeded = true;
          }
        }
        break;

      case 'phase4_custom_message':
        analytics.customMessageUsage++;
        session.customMessage = true;
        break;

      case 'phase4_exit':
        if (event.custom_dimensions?.exit_point === 'abandon') {
          session.abandoned = true;
        }
        break;
    }
  });

  // Process A/B test events for variant performance
  abEvents.forEach(event => {
    const variantConfig = event.ab_variants?.config?.layout;
    const isControl = variantConfig === 'cards';
    const variant = isControl ? analytics.variantPerformance.control : analytics.variantPerformance.variant;

    switch (event.event_type) {
      case 'exposure':
        variant.displays++;
        break;
      case 'conversion':
        if (event.event_name === 'phase4_proceed') {
          variant.proceeds++;
        }
        break;
    }
  });

  // Calculate metrics from session data
  let totalDecisionTime = 0;
  let decisionsWithTime = 0;
  let totalProceeds = 0;
  let totalAbandoned = 0;

  sessionData.forEach(session => {
    if (session.displayed) {
      if (session.proceeded) {
        totalProceeds++;
      }
      
      if (session.abandoned) {
        totalAbandoned++;
      }

      // Calculate decision time if both timestamps exist
      if (session.displayTime && session.actionTime) {
        const decisionTime = (session.actionTime.getTime() - session.displayTime.getTime()) / 1000;
        totalDecisionTime += decisionTime;
        decisionsWithTime++;
      }
    }
  });

  // Calculate final metrics
  analytics.conversionRate = analytics.totalDisplays > 0 ? totalProceeds / analytics.totalDisplays : 0;
  analytics.abandonmentRate = analytics.totalDisplays > 0 ? totalAbandoned / analytics.totalDisplays : 0;
  analytics.averageTimeToDecision = decisionsWithTime > 0 ? Math.round(totalDecisionTime / decisionsWithTime) : 0;

  // Calculate variant conversion rates
  analytics.variantPerformance.control.conversionRate = 
    analytics.variantPerformance.control.displays > 0 ? 
    analytics.variantPerformance.control.proceeds / analytics.variantPerformance.control.displays : 0;

  analytics.variantPerformance.variant.conversionRate = 
    analytics.variantPerformance.variant.displays > 0 ? 
    analytics.variantPerformance.variant.proceeds / analytics.variantPerformance.variant.displays : 0;

  return analytics;
}
