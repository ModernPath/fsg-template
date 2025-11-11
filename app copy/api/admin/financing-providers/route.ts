import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
// import { Database } from '@/types/supabase' // Keep commented out until types are regenerated

// Correct path based on potential type structure - adjust if necessary
// Update types to reference 'lenders' table
// Use any for now until types are regenerated
type Lender = any
type LenderInsert = any

// Helper function for authentication only (no admin requirement)
async function verifyAuth(request: Request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Missing or invalid authorization header', status: 401, user: null }
  }
  const token = authHeader.split(' ')[1]
  const authClient = await createClient()
  const { data: { user }, error: authError } = await authClient.auth.getUser(token)
  if (authError || !user) {
    return { error: 'Unauthorized', status: 401, user: null }
  }

  // Get user profile (no admin requirement)
  const { data: profile, error: profileError } = await authClient
    .from('profiles')
    .select('id, is_admin')
    .eq('id', user.id)
    .single()

  if (profileError) {
    return { error: 'User profile not found', status: 403, user: null }
  }
  return { user, profile, error: null, status: 200 }
}

// GET List of Financing Providers
export async function GET(request: Request) {
  try {
    const authCheck = await verifyAuth(request);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
    }
    console.log(`API Route [financing-providers]: User ${authCheck.user?.id} authenticated for GET.`);

    const supabase = await createClient(undefined, true); // Service role client
    console.log('Fetching lenders with service role...');

    const { data, error } = await supabase
      .from('lenders')
      .select('*')
      .order('name', { ascending: true }); // Order by name

    if (error) {
      console.error('Supabase error fetching lenders:', error);
      throw error;
    }

    if (!data) {
       console.log('No lenders found.');
       return NextResponse.json({ data: [] });
    }

    console.log(`Successfully fetched ${data.length} lenders.`);
    return NextResponse.json({ data });

  } catch (err: any) {
    console.error('Error in GET /api/admin/financing-providers:', err);
    return NextResponse.json(
      { error: `Failed to fetch lenders: ${err.message || 'Internal server error'}` },
      { status: 500 }
    )
  }
}

// POST Create Financing Provider
export async function POST(request: Request) {
  try {
    const authCheck = await verifyAuth(request);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
    }
    console.log(`API Route [financing-providers]: User ${authCheck.user?.id} authenticated for POST.`);

    const providerData = await request.json();

    // Basic validation - added funding_categories check
    if (
      !providerData || 
      typeof providerData !== 'object' || 
      !providerData.name || 
      !providerData.type || 
      !Array.isArray(providerData.funding_categories) || 
      providerData.funding_categories.length === 0
    ) {
       return NextResponse.json({ 
         error: 'Invalid request body. Missing required fields: name, type, and at least one funding_category' 
       }, { status: 400 })
    }

    // Validate type
    const validTypes = ['qred', 'capital_box', 'email', 'api', 'hybrid'];
    if (!validTypes.includes(providerData.type)) {
      return NextResponse.json({
        error: `Invalid type. Must be one of: ${validTypes.join(', ')}`
      }, { status: 400 })
    }

    // Validate category if provided
    if (providerData.category) {
      const validCategories = ['bank', 'fintech', 'traditional', 'government', 'private', 'general'];
      if (!validCategories.includes(providerData.category)) {
        return NextResponse.json({
          error: `Invalid category. Must be one of: ${validCategories.join(', ')}`
        }, { status: 400 })
      }
    }

    // Validate priority if provided
    if (providerData.priority && (providerData.priority < 1 || providerData.priority > 10)) {
      return NextResponse.json({
        error: 'Priority must be between 1 and 10'
      }, { status: 400 })
    }

    // Parse tags from comma-separated string to array
    let tagsArray: string[] = [];
    if (providerData.tags) {
      if (typeof providerData.tags === 'string') {
        tagsArray = providerData.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean);
      } else if (Array.isArray(providerData.tags)) {
        tagsArray = providerData.tags;
      }
    }

    const supabase = await createClient(undefined, true); // Service role client
    console.log('Creating new lender...', providerData);

    const insertPayload: LenderInsert = {
      name: providerData.name,
      type: providerData.type,
      description: providerData.description ?? null,
      email: providerData.email ?? null,
      primary_email: providerData.primary_email ?? null,
      secondary_email: providerData.secondary_email ?? null,
      category: providerData.category ?? 'general',
      priority: providerData.priority ? Number(providerData.priority) : 1,
      is_active: providerData.is_active ?? true,
      tags: tagsArray,
      processing_time_estimate: providerData.processing_time_estimate ?? null,
      contact_person: providerData.contact_person ?? null,
      notes: providerData.notes ?? null,
      funding_categories: providerData.funding_categories, // Already validated as array
      min_funding_amount: providerData.min_funding_amount ? Number(providerData.min_funding_amount) : null,
      max_funding_amount: providerData.max_funding_amount ? Number(providerData.max_funding_amount) : null,
      max_term_months: providerData.max_term_months ? Number(providerData.max_term_months) : null,
      send_private_data: providerData.send_private_data ?? false,
      partnership_type: providerData.partnership_type ?? 'verified',
    };

    const { data, error } = await supabase
      .from('lenders')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating lender:', error);
      if (error.code === '23505') { // Unique constraint violation (e.g., name)
        return NextResponse.json({ error: 'A lender with this name already exists.' }, { status: 409 });
      }
      throw error;
    }

    console.log('Successfully created lender:', data);
    return NextResponse.json({ data }, { status: 201 }); // 201 Created

  } catch (err: any) {
    console.error('Error in POST /api/admin/financing-providers:', err);
    return NextResponse.json(
      { error: `Failed to create lender: ${err.message || 'Internal server error'}` },
      { status: 500 }
    )
  }
} 