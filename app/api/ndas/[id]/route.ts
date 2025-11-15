/**
 * Single NDA API
 * GET /api/ndas/[id] - Get NDA details
 * PUT /api/ndas/[id] - Update NDA
 * DELETE /api/ndas/[id] - Delete NDA
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { generateNDATemplate } from '@/lib/nda-template';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Authenticate user
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: nda, error } = await supabase
      .from('ndas')
      .select(`
        *,
        companies:company_id (
          id,
          name,
          legal_name,
          business_id,
          address,
          city,
          country
        ),
        buyer:buyer_id (
          id,
          full_name,
          email
        )
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error fetching NDA:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!nda) {
      return NextResponse.json({ error: 'NDA not found' }, { status: 404 });
    }

    return NextResponse.json({ nda });
  } catch (error: any) {
    console.error('Error in GET /api/ndas/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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
      recipient_name,
      recipient_email,
      recipient_company,
      recipient_address,
      purpose,
      term_years,
      status,
      content,
    } = body;

    // Fetch existing NDA
    const { data: existingNDA, error: fetchError } = await supabase
      .from('ndas')
      .select('*, companies:company_id(*)')
      .eq('id', params.id)
      .single();

    if (fetchError || !existingNDA) {
      return NextResponse.json({ error: 'NDA not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Update fields if provided
    if (recipient_name) updateData.recipient_name = recipient_name;
    if (recipient_email) updateData.recipient_email = recipient_email;
    if (recipient_company !== undefined)
      updateData.recipient_company = recipient_company;
    if (recipient_address !== undefined)
      updateData.recipient_address = recipient_address;
    if (status) updateData.status = status;

    // Regenerate content if key fields changed
    if (
      recipient_name ||
      recipient_email ||
      recipient_company ||
      purpose ||
      term_years
    ) {
      const company = existingNDA.companies;
      updateData.content = generateNDATemplate({
        company_name: company.legal_name || company.name,
        company_business_id: company.business_id,
        company_address: company.address
          ? `${company.address}, ${company.city}, ${company.country}`
          : undefined,
        recipient_name: recipient_name || existingNDA.recipient_name,
        recipient_email: recipient_email || existingNDA.recipient_email,
        recipient_company:
          recipient_company !== undefined
            ? recipient_company
            : existingNDA.recipient_company,
        recipient_address:
          recipient_address !== undefined
            ? recipient_address
            : existingNDA.recipient_address,
        purpose: purpose || existingNDA.purpose || 'M&A Due Diligence',
        term_years: term_years || 3,
        effective_date: existingNDA.effective_date || new Date().toISOString(),
      });
    } else if (content) {
      // Allow manual content override
      updateData.content = content;
    }

    // Update expiration if term changed
    if (term_years) {
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + term_years);
      updateData.expires_at = expiresAt.toISOString();
    }

    // Update NDA
    const { data: nda, error: updateError } = await supabase
      .from('ndas')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating NDA:', updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ nda });
  } catch (error: any) {
    console.error('Error in PUT /api/ndas/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Authenticate user
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if NDA exists and user has permission
    const { data: nda, error: fetchError } = await supabase
      .from('ndas')
      .select('id, status')
      .eq('id', params.id)
      .single();

    if (fetchError || !nda) {
      return NextResponse.json({ error: 'NDA not found' }, { status: 404 });
    }

    // Prevent deletion of signed NDAs
    if (nda.status === 'signed') {
      return NextResponse.json(
        { error: 'Cannot delete signed NDA' },
        { status: 400 }
      );
    }

    // Delete NDA
    const { error: deleteError } = await supabase
      .from('ndas')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      console.error('Error deleting NDA:', deleteError);
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/ndas/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

