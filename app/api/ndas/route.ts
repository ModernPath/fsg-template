/**
 * NDAs API - List and Create
 * GET /api/ndas - List NDAs for user
 * POST /api/ndas - Create new NDA
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { generateNDATemplate } from '@/lib/nda-template';

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Authenticate user
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');
    const status = searchParams.get('status');

    // Build query
    let query = supabase
      .from('ndas')
      .select(`
        *,
        companies:company_id (
          id,
          name,
          legal_name,
          business_id
        ),
        buyer:buyer_id (
          id,
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    // Filter by company if specified
    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    // Filter by status if specified
    if (status) {
      query = query.eq('status', status);
    }

    const { data: ndas, error } = await query;

    if (error) {
      console.error('Error fetching NDAs:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ndas });
  } catch (error: any) {
    console.error('Error in GET /api/ndas:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Authenticate user
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      company_id,
      buyer_id,
      recipient_name,
      recipient_email,
      recipient_company,
      recipient_address,
      purpose,
      term_years,
      effective_date,
    } = body;

    // Validate required fields
    if (!company_id || !recipient_name || !recipient_email || !purpose) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Fetch company details
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('name, legal_name, business_id, address, city, country')
      .eq('id', company_id)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Generate NDA document
    const ndaContent = generateNDATemplate({
      company_name: company.legal_name || company.name,
      company_business_id: company.business_id,
      company_address: company.address
        ? `${company.address}, ${company.city}, ${company.country}`
        : undefined,
      recipient_name,
      recipient_email,
      recipient_company,
      recipient_address,
      purpose,
      term_years: term_years || 3,
      effective_date: effective_date || new Date().toISOString(),
    });

    // Create NDA record
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + (term_years || 3));

    const { data: nda, error: createError } = await supabase
      .from('ndas')
      .insert({
        company_id,
        buyer_id: buyer_id || null,
        recipient_name,
        recipient_email,
        recipient_company,
        status: 'draft',
        content: ndaContent,
        expires_at: expiresAt.toISOString(),
        created_by: session.user.id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating NDA:', createError);
      return NextResponse.json(
        { error: createError.message },
        { status: 500 }
      );
    }

    // TODO: Send email notification to recipient

    return NextResponse.json({ nda }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/ndas:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

