import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { LenderInsert } from '@/lib/types/lenders';

/**
 * GET /api/lenders
 * Returns a list of all lenders
 */
export async function GET(request: Request) {
  try {
    // Log request details
    console.log('\n📝 [GET /api/lenders]');

    // Validate authorization
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid auth header');
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    // Verify token and get user
    const authClient = createClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser(
      authHeader.split(' ')[1]
    );
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create client for database operations
    const supabase = createClient();

    // Fetch lenders data
    const { data, error } = await supabase
      .from('lenders')
      .select('*')
      .order('name');

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch lenders' },
        { status: 500 }
      );
    }

    // Return the results
    return NextResponse.json({ data });
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/lenders
 * Creates a new lender (admin only)
 */
export async function POST(request: Request) {
  try {
    // Log request details
    console.log('\n📝 [POST /api/lenders]');

    // Validate authorization
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid auth header');
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    // Verify token and get user
    const authClient = createClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser(
      authHeader.split(' ')[1]
    );
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create client for database operations
    const supabase = createClient();

    // Verify that the user is an admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile fetch error:', profileError);
      return NextResponse.json(
        { error: 'Error fetching user profile' },
        { status: 500 }
      );
    }

    if (!profile?.is_admin) {
      console.error('❌ Non-admin user attempted to create lender');
      return NextResponse.json(
        { error: 'Only admins can create lenders' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    
    // Validate request data
    if (!body.name || !body.type || !body.funding_categories) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, funding_categories' },
        { status: 400 }
      );
    }

    // Check lender type is valid
    if (!['qred', 'capital_box', 'email'].includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid lender type. Must be one of: qred, capital_box, email' },
        { status: 400 }
      );
    }

    // Prepare lender data
    const lenderData: LenderInsert = {
      name: body.name,
      type: body.type,
      funding_categories: body.funding_categories,
      description: body.description || null,
      email: body.email || null
    };

    // Insert the new lender
    const { data: newLender, error: insertError } = await supabase
      .from('lenders')
      .insert(lenderData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error creating lender:', insertError);
      return NextResponse.json(
        { error: 'Failed to create lender' },
        { status: 500 }
      );
    }

    // Return success
    return NextResponse.json(
      { 
        data: newLender,
        message: 'Lender created successfully' 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 