import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get current user from the session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated or email not available' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: session.user.email,
      options: {
        // Custom URL to redirect to after verification
        emailRedirectTo: `${request.nextUrl.origin}/api/auth/callback`
      }
    });

    if (error) {
      console.error('Error sending verification email:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to send verification email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    console.error('Error sending verification email:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send verification email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 