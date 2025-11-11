import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { LenderUpdate } from '@/lib/types/lenders';

/**
 * GET /api/lenders/[id]
 * Returns a specific lender
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log('🎯 GET /api/lenders/[id] - Fetching lender with ID:', id);

  try {
    const supabase = await createClient();

    // Get lender with partner info
    const { data: lender, error } = await supabase
      .from('lenders')
      .select(`
        *,
        partner:partners(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ Error fetching lender:', error);
      return NextResponse.json(
        { error: 'Lender not found' },
        { status: 404 }
      );
    }

    if (!lender) {
      return NextResponse.json(
        { error: 'Lender not found' },
        { status: 404 }
      );
    }

    console.log('✅ Lender found:', lender.name);
    return NextResponse.json(lender);
  } catch (error) {
    console.error('❌ Error in GET /api/lenders/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/lenders/[id]
 * Updates a specific lender (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log('🎯 PUT /api/lenders/[id] - Updating lender with ID:', id);

  try {
    const data = await request.json();
    console.log('📝 Update data:', data);

    const supabase = await createClient();

    // Check if lender exists
    const { data: existingLender, error: fetchError } = await supabase
      .from('lenders')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingLender) {
      console.error('❌ Lender not found:', fetchError);
      return NextResponse.json(
        { error: 'Lender not found' },
        { status: 404 }
      );
    }

    // Update lender
    const { data: updatedLender, error: updateError } = await supabase
      .from('lenders')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating lender:', updateError);
      return NextResponse.json(
        { error: 'Failed to update lender' },
        { status: 500 }
      );
    }

    console.log('✅ Lender updated successfully');
    return NextResponse.json(updatedLender);
  } catch (error) {
    console.error('❌ Error in PUT /api/lenders/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/lenders/[id]
 * Deletes a specific lender (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log('🎯 DELETE /api/lenders/[id] - Deleting lender with ID:', id);

  try {
    const supabase = await createClient();

    // Check if lender exists
    const { data: existingLender, error: fetchError } = await supabase
      .from('lenders')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingLender) {
      console.error('❌ Lender not found:', fetchError);
      return NextResponse.json(
        { error: 'Lender not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting active to false
    const { error: deleteError } = await supabase
      .from('lenders')
      .update({
        active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (deleteError) {
      console.error('❌ Error deleting lender:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete lender' },
        { status: 500 }
      );
    }

    console.log('✅ Lender deleted successfully');
    return NextResponse.json({ message: 'Lender deleted successfully' });
  } catch (error) {
    console.error('❌ Error in DELETE /api/lenders/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 