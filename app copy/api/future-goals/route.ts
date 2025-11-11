import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Define schema for validating request data
const futureGoalsSchema = z.object({
  company_id: z.string().uuid(),
  required_working_capital_increase: z.number().optional().nullable(),
  inventory_personnel_resource_needs: z.string().optional().nullable(),
  investment_priorities: z.string().optional().nullable(),
  estimated_investment_amounts: z.number().optional().nullable(),
  cost_structure_adaptation: z.string().optional().nullable()
});

/**
 * POST /api/future-goals
 * Creates a new future goals entry for a company
 */
export async function POST(request: Request) {
  try {
    // Log request
    console.log('\n📝 [POST /api/future-goals]');

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
    console.log('🔑 Creating auth client...');
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

    console.log('✅ User authenticated:', user.id);

    // Validate request data
    try {
      const body = await request.json();
      const validatedData = futureGoalsSchema.parse(body);
      
      // Create service role client
      console.log('🔑 Creating service role client...');
      const supabase = createClient(true);
      
      // Verify that user has access to the company
      const { data: companyAccess, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .eq('id', validatedData.company_id)
        .eq('created_by', user.id)
        .maybeSingle();

      if (companyError) {
        console.error('❌ Company access error:', companyError);
        return NextResponse.json(
          { error: 'Error checking company access' },
          { status: 500 }
        );
      }

      if (!companyAccess) {
        console.error('❌ User does not have access to this company');
        return NextResponse.json(
          { error: 'You do not have access to this company' },
          { status: 403 }
        );
      }
      
      // Insert the future goals entry
      console.log('📊 Creating future goals entry...');
      const { data, error } = await supabase
        .from('future_goals')
        .insert({
          ...validatedData,
          created_by: user.id
        })
        .select()
        .single();
        
      if (error) {
        console.error('❌ Database error:', error);
        return NextResponse.json(
          { error: 'Failed to create future goals entry' },
          { status: 500 }
        );
      }
      
      // Return success
      console.log('✅ Successfully created future goals entry');
      return NextResponse.json({
        data,
        message: 'Future goals created successfully'
      }, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('❌ Validation error:', error.errors);
        return NextResponse.json(
          { error: 'Invalid request data', details: error.errors },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/future-goals
 * Retrieves future goals for a company
 * Required query parameter:
 * - company_id: The ID of the company
 */
export async function GET(request: Request) {
  try {
    // Log request
    console.log('\n📝 [GET /api/future-goals]');

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');
    
    if (!companyId) {
      console.error('❌ Missing company_id parameter');
      return NextResponse.json(
        { error: 'company_id is required' },
        { status: 400 }
      );
    }

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
    console.log('🔑 Creating auth client...');
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

    console.log('✅ User authenticated:', user.id);

    // Create service role client
    console.log('🔑 Creating service role client...');
    const supabase = createClient(true);
    
    // Verify that user has access to the company
    const { data: companyAccess, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('id', companyId)
      .eq('created_by', user.id)
      .maybeSingle();

    if (companyError) {
      console.error('❌ Company access error:', companyError);
      return NextResponse.json(
        { error: 'Error checking company access' },
        { status: 500 }
      );
    }

    if (!companyAccess) {
      console.error('❌ User does not have access to this company');
      return NextResponse.json(
        { error: 'You do not have access to this company' },
        { status: 403 }
      );
    }
    
    // Fetch future goals for the company
    console.log('📊 Fetching future goals...');
    const { data, error } = await supabase
      .from('future_goals')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch future goals' },
        { status: 500 }
      );
    }
    
    // Return results
    console.log('✅ Successfully fetched future goals');
    return NextResponse.json({
      data,
      metadata: {
        count: data?.length || 0,
        company_id: companyId
      }
    });
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 