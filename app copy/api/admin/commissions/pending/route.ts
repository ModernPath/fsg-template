/**
 * GET /api/admin/commissions/pending
 * 
 * Get pending/calculated commissions ready for payment
 * Admin only
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    console.log('\n📝 [GET /api/admin/commissions/pending]');

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

    // 4. Create service role client for database operations
    console.log('🔑 Creating service role client...');
    const supabase = await createClient(undefined, true);

    // 5. Parse query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'calculated';
    const partnerId = url.searchParams.get('partner_id');
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    console.log('📊 Fetching commissions:', { status, partnerId, limit, offset });

    // 6. Build query
    let query = supabase
      .from('partner_commissions')
      .select(`
        *,
        partner:partners(
          id,
          name,
          email,
          bank_account_name,
          bank_iban,
          tax_id
        ),
        company:companies(
          id,
          name,
          business_id
        ),
        agreement:funding_applications(
          id,
          amount,
          status
        )
      `)
      .eq('status', status)
      .order('generated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (partnerId) {
      query = query.eq('partner_id', partnerId);
    }

    const { data: commissions, error: commissionsError } = await query;

    if (commissionsError) {
      console.error('❌ Error fetching commissions:', commissionsError);
      return NextResponse.json(
        { error: 'Failed to fetch commissions' },
        { status: 500 }
      );
    }

    console.log(`✅ Fetched ${commissions?.length || 0} commissions`);

    // 7. Calculate summary statistics
    const totalAmount = commissions?.reduce((sum, c) => sum + parseFloat(String(c.commission_amount)), 0) || 0;
    const totalCount = commissions?.length || 0;

    // Group by partner for summary
    const byPartner = commissions?.reduce((acc, commission) => {
      const partnerId = commission.partner_id;
      if (!acc[partnerId]) {
        acc[partnerId] = {
          partner: commission.partner,
          commissions: [],
          total: 0,
          count: 0
        };
      }
      acc[partnerId].commissions.push(commission);
      acc[partnerId].total += parseFloat(String(commission.commission_amount));
      acc[partnerId].count += 1;
      return acc;
    }, {} as Record<string, any>);

    // Get total count for pagination
    const { count: totalCountInDb } = await supabase
      .from('partner_commissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);

    console.log('✅ Successfully processed commission data');

    return NextResponse.json({
      commissions,
      summary: {
        total_amount: totalAmount,
        total_count: totalCount,
        currency: commissions?.[0]?.currency || 'EUR',
        by_partner: Object.values(byPartner || {})
      },
      pagination: {
        limit,
        offset,
        total: totalCountInDb || 0,
        has_more: (totalCountInDb || 0) > offset + limit
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

