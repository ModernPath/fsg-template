import { NextResponse } from 'next/server';
// Käytetään standardia Supabase-klienttiä token-varmennukseen (ANON-avain)
import { createClient as createStandardClient } from '@supabase/supabase-js';
import { inngest } from '@/lib/inngest/inngest.client';

// Ympäristömuuttujat
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('FATAL: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY for API route');
}

export async function POST(request: Request) {
  // 1. Luo erillinen auth-klientti ANON-avaimella tokenin validointia varten
  const authClient = createStandardClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      storage: undefined,
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  // 2. Extract token and check user authentication
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.split(' ')[1]; // Extract Bearer token

  if (!token) {
    console.error('Trigger Analysis Auth Error: Missing Authorization header or token');
    return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
  }

  const { data: { user }, error: authError } = await authClient.auth.getUser(token);

  if (authError || !user) {
    console.error('Trigger Analysis Auth Error (getUser with token):', authError);
    // Provide more specific feedback if possible
    const errorMessage = authError?.message === 'invalid JWT' ? 'Invalid token' : 'Unauthorized';
    return NextResponse.json({ error: errorMessage }, { status: 401 });
  }

  // 3. Parse request body (user is authenticated at this point)
  let companyId: string | null = null;
  let locale: string | null = null; // Add locale variable
  try {
    const body = await request.json();
    companyId = body.companyId;
    locale = body.locale; // Extract locale from body

    if (!companyId || typeof companyId !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid companyId in request body' }, { status: 400 });
    }
    // Optional: Validate locale if needed (e.g., check against allowed locales)
    if (!locale || typeof locale !== 'string') {
      console.warn('Trigger Analysis: Missing or invalid locale in request body. Defaulting to \'en\'.');
      locale = 'en'; // Default to 'en' if missing or invalid
    }

  } catch (error) {
    console.error('Trigger Analysis Body Parse Error:', error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // 4. Send event to Inngest using the SDK
  try {
    console.log(`API Route: Triggering financial/analysis-requested for company ${companyId} by user ${user.id} with locale ${locale}`);
    await inngest.send({
      name: 'financial/analysis-requested',
      data: {
        companyId: companyId,
        requestedBy: user.id,
        locale: locale // Include locale in the data payload
      },
      user: { // Pass validated user info
        id: user.id,
        email: user.email, 
      }
    });

    console.log(`API Route: Successfully sent financial/analysis-requested event for company ${companyId}`);
    return NextResponse.json({ success: true, message: 'Analysis triggered successfully.' }, { status: 202 }); // 202 Accepted is appropriate

  } catch (error: any) {
    console.error('API Route: Error sending Inngest event:', error);
    const errorMessage = error?.message || 'Failed to trigger analysis event via Inngest';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 