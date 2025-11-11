import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
// import { Database } from '@/types/supabase' // Keep commented out until types regenerated

// Use any for now until types are regenerated
type Lender = any 

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

// GET Single Financing Provider
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> }
) {
  const { providerId } = await params;
  try {
    const authCheck = await verifyAuth(request);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
    }
    console.log(`API Route [financing-providers/${providerId}]: User ${authCheck.user?.id} authenticated.`);

    const supabase = await createClient(undefined, true); // Service role
    console.log(`Fetching lender ${providerId} with service role...`);

    const { data, error } = await supabase
      .from('lenders')
      .select('*')
      .eq('id', providerId)
      .single();

    if (error) {
      console.error(`Supabase error fetching lender ${providerId}:`, error);
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Lender not found' }, { status: 404 });
      }
      throw error;
    }

    if (!data) {
      return NextResponse.json({ error: 'Lender not found' }, { status: 404 });
    }

    console.log(`Successfully fetched lender ${providerId}.`);
    return NextResponse.json({ data });

  } catch (err: any) {
    console.error(`Error in GET /api/admin/financing-providers/${providerId}:`, err);
    return NextResponse.json(
      { error: `Failed to fetch lender: ${err.message || 'Internal server error'}` },
      { status: 500 }
    )
  }
}

// PUT/PATCH Update Financing Provider
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> }
) {
  const { providerId } = await params;
  try {
    const authCheck = await verifyAuth(request);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
    }
    console.log(`API Route [financing-providers/${providerId}]: User ${authCheck.user?.id} authenticated for PUT.`);

    const providerData = await request.json();

    // Basic validation
    if (!providerData || typeof providerData !== 'object') {
       return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    // Validate type if provided
    if (providerData.type) {
      const validTypes = ['qred', 'capital_box', 'email', 'api', 'hybrid'];
      if (!validTypes.includes(providerData.type)) {
        return NextResponse.json({
          error: `Invalid type. Must be one of: ${validTypes.join(', ')}`
        }, { status: 400 })
      }
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

    const supabase = await createClient(undefined, true); // Service role client
    console.log(`Updating lender ${providerId}...`);

    // Construct update object using only fields present in 'lenders' schema
    const updatePayload: { [key: string]: any } = {}; 
    
    // Basic fields
    if (providerData.name !== undefined) updatePayload.name = providerData.name;
    if (providerData.type !== undefined) updatePayload.type = providerData.type;
    if (providerData.description !== undefined) updatePayload.description = providerData.description;
    
    // Email fields (legacy and new)
    if (providerData.email !== undefined) updatePayload.email = providerData.email;
    if (providerData.primary_email !== undefined) updatePayload.primary_email = providerData.primary_email;
    if (providerData.secondary_email !== undefined) updatePayload.secondary_email = providerData.secondary_email;
    
    // New categorization and management fields
    if (providerData.category !== undefined) updatePayload.category = providerData.category;
    if (providerData.priority !== undefined) updatePayload.priority = Number(providerData.priority);
    if (providerData.is_active !== undefined) updatePayload.is_active = Boolean(providerData.is_active);
    if (providerData.processing_time_estimate !== undefined) updatePayload.processing_time_estimate = providerData.processing_time_estimate;
    if (providerData.contact_person !== undefined) updatePayload.contact_person = providerData.contact_person;
    if (providerData.notes !== undefined) updatePayload.notes = providerData.notes;
    
    // Tags handling
    if (providerData.tags !== undefined) {
      let tagsArray: string[] = [];
      if (typeof providerData.tags === 'string') {
        tagsArray = providerData.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean);
      } else if (Array.isArray(providerData.tags)) {
        tagsArray = providerData.tags;
      }
      updatePayload.tags = tagsArray;
    }
    
    // Funding categories
    if (providerData.funding_categories !== undefined && Array.isArray(providerData.funding_categories)) {
        updatePayload.funding_categories = providerData.funding_categories;
    }
    
    // Financial limit fields
    if (providerData.min_funding_amount !== undefined) {
        updatePayload.min_funding_amount = providerData.min_funding_amount === null ? null : Number(providerData.min_funding_amount);
    }
    if (providerData.max_funding_amount !== undefined) {
        updatePayload.max_funding_amount = providerData.max_funding_amount === null ? null : Number(providerData.max_funding_amount);
    }
    if (providerData.max_term_months !== undefined) {
        updatePayload.max_term_months = providerData.max_term_months === null ? null : Number(providerData.max_term_months);
    }
    if (providerData.send_private_data !== undefined) {
        updatePayload.send_private_data = Boolean(providerData.send_private_data);
    }
    if (providerData.partnership_type !== undefined) {
        updatePayload.partnership_type = providerData.partnership_type;
    }

    // Always update the updated_at timestamp
    updatePayload.updated_at = new Date().toISOString();

    // Check if there's anything to update besides timestamp
    if (Object.keys(updatePayload).length <= 1) {
      return NextResponse.json({ error: 'No valid fields provided for update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('lenders')
      .update(updatePayload)
      .eq('id', providerId)
      .select()
      .single();

    if (error) {
      console.error(`Supabase error updating lender ${providerId}:`, error);
       if (error.code === 'PGRST116') { // Not found
         return NextResponse.json({ error: 'Lender not found' }, { status: 404 });
       }
       if (error.code === '23505') { // Unique violation
         return NextResponse.json({ error: 'A lender with this name already exists.' }, { status: 409 });
       }
      throw error;
    }

    console.log(`Successfully updated lender ${providerId}`);
    return NextResponse.json({ data });

  } catch (err: any) {
    console.error(`Error in PUT /api/admin/financing-providers/${providerId}:`, err);
    return NextResponse.json(
      { error: `Failed to update lender: ${err.message || 'Internal server error'}` },
      { status: 500 }
    )
  }
}


// DELETE Financing Provider
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> }
) {
  const { providerId } = await params;
  try {
    const authCheck = await verifyAuth(request);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
    }
     console.log(`API Route [financing-providers/${providerId}]: User ${authCheck.user?.id} authenticated for DELETE.`);

    const supabase = await createClient(undefined, true); // Service role client
    console.log(`Deleting lender ${providerId}...`);

    // First check if there are any dependencies that would prevent deletion
    const { count: offersCount } = await supabase
      .from('financing_offers')
      .select('id', { count: 'exact', head: true })
      .eq('lender_id', providerId);

    const { count: profilesCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('lender_id', providerId);

    if ((offersCount ?? 0) > 0 || (profilesCount ?? 0) > 0) {
      return NextResponse.json({ 
        error: `Cannot delete lender as it has ${offersCount || 0} financing offers and ${profilesCount || 0} profile dependencies. Please remove these first or contact support.` 
      }, { status: 409 });
    }

    const { error } = await supabase
      .from('lenders')
      .delete()
      .eq('id', providerId);

    if (error) {
      console.error(`Supabase error deleting lender ${providerId}:`, error);
      // Handle potential foreign key constraints if providers are linked elsewhere
      if (error.code === '23503') { // Foreign key violation
         return NextResponse.json({ error: 'Cannot delete lender as it is referenced elsewhere in the system.' }, { status: 409 });
      }
      throw error;
    }

    // Check if any row was actually deleted (optional, delete doesn't return data by default)
    // You might query again or check the count if needed, but typically 204 is sent regardless.

    console.log(`Successfully deleted lender ${providerId}`);
    return new NextResponse(null, { status: 204 }); // 204 No Content

  } catch (err: any) {
    console.error(`Error in DELETE /api/admin/financing-providers/${providerId}:`, err);
    return NextResponse.json(
      { error: `Failed to delete lender: ${err.message || 'Internal server error'}` },
      { status: 500 }
    )
  }
} 