import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: Request, 
  { params: routeParams }: { params: { token: string } }
) {
  const params = await routeParams;
  const token = params.token;

  if (!token || typeof token !== 'string' || token.length !== 64) {
    return NextResponse.json({ valid: false, reason: 'invalid', message: 'Invalid token format.' }, { status: 400 });
  }

  try {
    const supabase = await createClient(undefined, true); // Use service role to check the token

    // Find the request matching the token
    const { data: requestData, error: requestError } = await supabase
      .from('document_requests')
      .select(`
        id,
        status,
        expires_at,
        requesting_user_id,
        company:companies ( name )
      `)
      .eq('token', token)
      .single(); // Use single as token should be unique

    if (requestError || !requestData) {
      if (requestError && requestError.code === 'PGRST116') { // PGRST116 = 0 rows
        console.log(`[Validate Token] Token not found: ${token}`);
        return NextResponse.json({ valid: false, reason: 'invalid', message: 'Upload link not found.' }, { status: 404 });
      } 
      console.error('[Validate Token] Error fetching request:', requestError);
      return NextResponse.json({ valid: false, reason: 'error', message: 'Could not validate link.' }, { status: 500 });
    }

    // Check status and expiry
    const now = new Date();
    const expiresAt = new Date(requestData.expires_at);

    if (requestData.status !== 'pending') {
      return NextResponse.json({ valid: false, reason: 'used', message: 'This upload link has already been used.' }, { status: 410 }); // Gone
    }

    if (now > expiresAt) {
      // Optionally update status to 'expired' in the background
      // await supabase.from('document_requests').update({ status: 'expired' }).eq('token', token);
      return NextResponse.json({ valid: false, reason: 'expired', message: 'This upload link has expired.' }, { status: 410 }); // Gone
    }

    // Fetch requesting user's profile separately
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', requestData.requesting_user_id)
      .single();

    if (profileError) {
      console.warn('[Validate Token] Could not fetch profile for user:', requestData.requesting_user_id, profileError);
      // Proceed without user details if profile not found, but log it.
    }

    // If valid, return necessary info for the frontend
    const company = Array.isArray(requestData.company) ? requestData.company[0] : requestData.company;
    const companyName = company?.name || 'the company';
    // Use fetched profile data, or default if profile fetch failed
    const requestingUserName = profileData?.full_name || profileData?.email || 'the user';
    
    return NextResponse.json({ 
      valid: true, 
      companyName: companyName,
      userName: requestingUserName 
    }, { status: 200 });

  } catch (error: any) {
    console.error('[Validate Token] Unexpected error:', error);
    return NextResponse.json({ valid: false, reason: 'error', message: 'An internal error occurred.' }, { status: 500 });
  }
} 