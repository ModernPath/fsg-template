import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server'; // Assuming this can create a service role client

/**
 * API endpoint to update user metadata with admin privileges
 * 
 * This approach is necessary because:
 * 1. Client-side auth.updateUser() doesn't always refresh the JWT session correctly
 * 2. Server-side updates with admin rights ensure the data is properly written to auth.users
 * 3. A page reload is required after this call to obtain a new JWT with the updated metadata
 */
export async function PUT(request: Request) {
  try {
    // Verify authentication via Bearer token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }
    const token = authHeader.split(' ')[1];

    // Validate the user's token
    const authClient = await createClient(); 
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error('[API /api/auth/update-metadata PUT] Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized - ' + (authError?.message || 'User not found') },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { user_metadata } = body;

    if (!user_metadata) {
      return NextResponse.json(
        { error: 'Missing user_metadata in request body' },
        { status: 400 }
      );
    }
    
    // Use admin client to update user metadata
    // This is more reliable than client-side updateUser() for session consistency
    console.log('[API /api/auth/update-metadata PUT] Attempting to update metadata for user ID:', user.id, 'with:', user_metadata);
    
    // Get current metadata for comparison
    console.log('[API /api/auth/update-metadata PUT] Current user metadata BEFORE update:', 
      JSON.stringify(user.user_metadata, null, 2)
    );

    // Create Supabase client with admin privileges
    const adminClient = await createClient(undefined, true);
    
    // Update user metadata in auth.users table
    const { data, error } = await adminClient.auth.admin.updateUserById(
      user.id,
      { user_metadata }
    );

    if (error) {
      console.error('[API /api/auth/update-metadata PUT] Supabase admin update error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Verify update by retrieving the user again
    const { data: verifyData, error: verifyError } = await adminClient.auth.admin.getUserById(user.id);
    
    if (verifyError) {
      console.error('[API /api/auth/update-metadata PUT] Error verifying user metadata update:', verifyError);
    } else if (verifyData?.user) {
      console.log('[API /api/auth/update-metadata PUT] User metadata AFTER update:', 
        JSON.stringify(verifyData.user.user_metadata, null, 2)
      );
      
      // Check if user_metadata.phone_number matches what was requested
      if (user_metadata.phone_number !== verifyData.user.user_metadata.phone_number) {
        console.warn('[API /api/auth/update-metadata PUT] Warning: Updated phone_number does not match requested value!',
          `Requested: ${user_metadata.phone_number}, Actual: ${verifyData.user.user_metadata.phone_number}`
        );
      } else {
        console.log('[API /api/auth/update-metadata PUT] Phone number updated successfully to:', verifyData.user.user_metadata.phone_number);
      }
    }

    console.log('[API /api/auth/update-metadata PUT] Supabase admin update successful. Returned data:', data);
    return NextResponse.json({ 
      message: 'User metadata updated successfully',
      user: data 
    });
  } catch (error: any) {
    console.error('[API /api/auth/update-metadata PUT] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
} 