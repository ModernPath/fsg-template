/**
 * POST /api/admin/commissions/mark-paid
 * 
 * Mark multiple commissions as paid
 * Admin only
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';

// Request validation schema
const MarkPaidSchema = z.object({
  commission_ids: z.array(z.string().uuid()).min(1, 'At least one commission ID required'),
  payment_reference: z.string().optional(),
  payment_date: z.string().optional(),
  notes: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    console.log('\n📝 [POST /api/admin/commissions/mark-paid]');

    // 1. Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid auth header');
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    // 2. Verify token
    console.log('🔑 Creating auth client...');
    const authClient = await createClient();
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

    // 3. Verify admin status
    const { data: profile } = await authClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      console.error('❌ User is not admin');
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    console.log('✅ Admin verified');

    // 4. Parse and validate request body
    const body = await request.json();
    
    let validatedData;
    try {
      validatedData = MarkPaidSchema.parse(body);
    } catch (validationError) {
      console.error('❌ Validation error:', validationError);
      return NextResponse.json(
        { error: 'Invalid request data', details: validationError },
        { status: 400 }
      );
    }

    console.log('✅ Request validated:', {
      commissionCount: validatedData.commission_ids.length,
      hasReference: !!validatedData.payment_reference
    });

    // 5. Create service role client for database operations
    console.log('🔑 Creating service role client...');
    const supabase = await createClient(undefined, true);

    // 6. Get commission details before update (for audit)
    const { data: commissionsBeforeUpdate, error: fetchError } = await supabase
      .from('partner_commissions')
      .select(`
        id,
        partner_id,
        commission_amount,
        status,
        partner:partners(name, email)
      `)
      .in('id', validatedData.commission_ids);

    if (fetchError) {
      console.error('❌ Error fetching commissions:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch commissions' },
        { status: 500 }
      );
    }

    console.log(`📊 Found ${commissionsBeforeUpdate?.length || 0} commissions to mark as paid`);

    // 7. Update commissions to paid status
    const paymentDate = validatedData.payment_date 
      ? new Date(validatedData.payment_date).toISOString()
      : new Date().toISOString();

    const { data: updatedCommissions, error: updateError } = await supabase
      .from('partner_commissions')
      .update({
        status: 'paid',
        paid_at: paymentDate,
        payment_date: paymentDate,
        payment_reference: validatedData.payment_reference || null,
        notes: validatedData.notes 
          ? `${validatedData.notes || ''}\n\nMarked as paid by admin ${user.id} on ${new Date().toISOString()}`
          : `Marked as paid by admin ${user.id} on ${new Date().toISOString()}`
      })
      .in('id', validatedData.commission_ids)
      .select();

    if (updateError) {
      console.error('❌ Error updating commissions:', updateError);
      return NextResponse.json(
        { error: 'Failed to mark commissions as paid' },
        { status: 500 }
      );
    }

    console.log(`✅ Successfully marked ${updatedCommissions?.length || 0} commissions as paid`);

    // 8. Calculate total amount paid
    const totalPaid = commissionsBeforeUpdate?.reduce((sum, c) => sum + parseFloat(String(c.commission_amount)), 0) || 0;

    // 9. Create audit log entry
    try {
      await supabase.from('partner_audit_log').insert({
        action: 'commissions_marked_paid',
        performed_by: user.id,
        details: {
          commission_ids: validatedData.commission_ids,
          commission_count: validatedData.commission_ids.length,
          total_amount: totalPaid,
          payment_reference: validatedData.payment_reference,
          payment_date: paymentDate,
          partners: commissionsBeforeUpdate?.map(c => ({
            partner_id: c.partner_id,
            partner_name: (c.partner as any)?.name
          }))
        },
        created_at: new Date().toISOString()
      });

      console.log('✅ Audit log entry created');
    } catch (auditError) {
      console.error('⚠️ Failed to create audit log (non-critical):', auditError);
      // Continue even if audit log fails
    }

    // 10. TODO: Send email notifications to partners
    // for (const commission of commissionsBeforeUpdate || []) {
    //   await sendCommissionPaidNotification({
    //     partnerEmail: (commission.partner as any)?.email,
    //     commissionAmount: commission.commission_amount,
    //     paymentReference: validatedData.payment_reference
    //   });
    // }

    console.log('✅ Commission payment process completed successfully');

    return NextResponse.json({
      success: true,
      updated_count: updatedCommissions?.length || 0,
      total_amount_paid: totalPaid,
      payment_reference: validatedData.payment_reference,
      payment_date: paymentDate,
      commissions: updatedCommissions
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

