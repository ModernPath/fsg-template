import { NextRequest, NextResponse } from 'next/server';

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

async function validateTurnstileToken(token: string): Promise<boolean> {
  try {
    console.log('🔐 Validating Turnstile token...');
    
    const formData = new URLSearchParams();
    formData.append('secret', process.env.TURNSTILE_SECRET_KEY!);
    formData.append('response', token);

    const result = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const outcome = await result.json();
    console.log('🔐 Turnstile validation result:', outcome);
    return outcome.success === true;
  } catch (error) {
    console.error('❌ Error validating Turnstile token:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  console.log('📝 POST /api/auth/validate-turnstile');
  
  try {
    const body = await request.json();
    const { token } = body;

    console.log('📝 Request body:', { token: token ? 'present' : 'missing' });

    if (!token) {
      console.log('❌ Missing token');
      return NextResponse.json(
        { error: 'Missing token' },
        { status: 400 }
      );
    }

    // In development, if Turnstile keys are not configured, skip validation
    if (process.env.NODE_ENV === 'development' && !process.env.TURNSTILE_SECRET_KEY) {
      console.warn('⚠️ Turnstile validation skipped in development (missing TURNSTILE_SECRET_KEY)');
      return NextResponse.json({ success: true });
    }

    console.log('🔐 TURNSTILE_SECRET_KEY present:', !!process.env.TURNSTILE_SECRET_KEY);

    const isValid = await validateTurnstileToken(token);

    if (!isValid) {
      console.log('❌ Invalid token');
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 400 }
      );
    }

    console.log('✅ Token valid');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error in validate-turnstile route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 