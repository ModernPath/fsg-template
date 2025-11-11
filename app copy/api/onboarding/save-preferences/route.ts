import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get preferences data
    const data = await request.json();
    const { fundingNeeds, purpose, amount, timeline } = data;
    
    // Get the user's company
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id')
      .eq('created_by', user.id)
      .limit(1);
      
    if (companiesError || !companies || companies.length === 0) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    
    const companyId = companies[0].id;
    
    // Store funding preferences in the database
    // You'll need to create a table for this, or use an existing one
    const { data: preferences, error: preferencesError } = await supabase
      .from('company_preferences')
      .upsert({
        company_id: companyId,
        funding_type: fundingNeeds,
        funding_purpose: purpose,
        funding_amount: amount,
        funding_timeline: timeline,
        created_by: user.id,
        updated_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (preferencesError) {
      console.error('Error saving preferences:', preferencesError);
      return NextResponse.json({ error: 'Error saving preferences' }, { status: 500 });
    }
    
    // Mark onboarding as complete
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString()
      })
      .eq('id', user.id);
      
    if (profileError) {
      console.error('Error updating profile:', profileError);
      // Don't fail the request if this update fails
    }

    // Track analysis_completed conversion
    try {
      // Try to get session ID from request headers or create one
      let sessionId = request.headers.get('x-session-id')
      
      if (!sessionId) {
        // Generate a session ID for server-side tracking if not provided
        sessionId = `server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }

      console.log('🎯 [Save Preferences] Tracking analysis_completed conversion for user:', user.id)
      
      const { data: conversionId, error: trackError } = await supabase
        .rpc('track_conversion', {
          p_session_id: sessionId,
          p_conversion_type: 'analysis_completed',
          p_conversion_value: 0,
          p_user_id: user.id,
          p_metadata: {
            completion_method: 'save_preferences_api',
            user_email: user.email,
            preferences: preferences,
            completed_at: new Date().toISOString()
          }
        })

      if (trackError) {
        console.warn('⚠️ [Save Preferences] Failed to track analysis_completed conversion:', trackError)
      } else {
        console.log('✅ [Save Preferences] Analysis completion conversion tracked:', conversionId)
      }
    } catch (conversionError) {
      console.warn('⚠️ [Save Preferences] Error tracking analysis_completed conversion:', conversionError)
      // Don't fail the request if conversion tracking fails
    }
    
    return NextResponse.json({ 
      success: true, 
      preferences
    });
    
  } catch (error) {
    console.error('Error saving preferences:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 