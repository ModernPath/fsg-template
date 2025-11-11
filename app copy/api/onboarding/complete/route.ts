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
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    // Track analysis_completed conversion
    try {
      // Try to get session ID from request headers or create one
      let sessionId = request.headers.get('x-session-id')
      
      if (!sessionId) {
        // Generate a session ID for server-side tracking if not provided
        sessionId = `server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }

      console.log('🎯 [Onboarding Complete] Tracking analysis_completed conversion for user:', user.id)
      
      const { data: conversionId, error: trackError } = await supabase
        .rpc('track_conversion', {
          p_session_id: sessionId,
          p_conversion_type: 'analysis_completed',
          p_conversion_value: 0,
          p_user_id: user.id,
          p_metadata: {
            completion_method: 'onboarding_complete_api',
            user_email: user.email,
            completed_at: new Date().toISOString()
          }
        })

      if (trackError) {
        console.warn('⚠️ [Onboarding Complete] Failed to track analysis_completed conversion:', trackError)
      } else {
        console.log('✅ [Onboarding Complete] Analysis completion conversion tracked:', conversionId)
      }
    } catch (conversionError) {
      console.warn('⚠️ [Onboarding Complete] Error tracking analysis_completed conversion:', conversionError)
      // Don't fail the completion if conversion tracking fails
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Onboarding marked as complete'
    });
    
  } catch (error) {
    console.error('Error marking onboarding as complete:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 