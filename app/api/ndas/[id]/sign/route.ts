/**
 * NDA Signature API
 * POST /api/ndas/[id]/sign - Sign an NDA
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(
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
    const { signature_data, ip_address } = body;

    // Fetch NDA
    const { data: nda, error: fetchError } = await supabase
      .from('ndas')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError || !nda) {
      return NextResponse.json({ error: 'NDA not found' }, { status: 404 });
    }

    // Check if already signed
    if (nda.status === 'signed') {
      return NextResponse.json(
        { error: 'NDA already signed' },
        { status: 400 }
      );
    }

    // Update NDA as signed
    const { data: signedNDA, error: updateError } = await supabase
      .from('ndas')
      .update({
        status: 'signed',
        signed_at: new Date().toISOString(),
        signed_by: session.user.id,
        signature_data: signature_data || null,
        signature_ip: ip_address || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error signing NDA:', updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // TODO: Send confirmation email to both parties
    // TODO: Generate PDF with signature

    return NextResponse.json({ nda: signedNDA });
  } catch (error: any) {
    console.error('Error in POST /api/ndas/[id]/sign:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

