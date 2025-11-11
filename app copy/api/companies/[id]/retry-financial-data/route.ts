import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { inngest } from '@/lib/inngest-client';

/**
 * POST /api/companies/[id]/retry-financial-data
 * 
 * Retry financial data fetching for a company
 * Triggers background enrichment job
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Next.js 15: params is async, must await
    const { id } = await params;
    
    console.log('\n📝 [POST /api/companies/[id]/retry-financial-data]');
    console.log('   Company ID:', id);

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

    // 3. Get company data
    console.log('🔑 Creating service role client...');
    const supabase = await createClient(undefined, true);

    const { data: company, error: fetchError } = await supabase
      .from('companies')
      .select('id, business_id, name, country_code')
      .eq('id', id)
      .single();

    if (fetchError || !company) {
      console.error('❌ Company not found:', fetchError);
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // 4. User verification: Skip for now (companies table doesn't have user_id yet)
    // TODO: Implement proper user ownership check when companies-users relationship is added
    console.log('⚠️ Skipping user ownership check (not implemented yet)');

    console.log('✅ Company found:', company.name);

    // 5. Reset enrichment status
    const { error: updateError } = await supabase
      .from('companies')
      .update({
        enrichment_status: 'pending',
      })
      .eq('id', id);

    if (updateError) {
      console.error('❌ Failed to update company status:', updateError);
    }

    // 6. Trigger background enrichment
    console.log('🚀 Triggering background enrichment...');
    
    await inngest.send({
      name: 'company/enrich.financial-data',
      data: {
        companyId: company.id,
        businessId: company.business_id,
        companyName: company.name,
        countryCode: company.country_code || 'FI',
        userId: user.id,
        retryAttempt: true, // Mark as retry
      },
    });

    console.log('✅ Background enrichment triggered');

    return NextResponse.json({
      success: true,
      message: 'Financial data fetch restarted',
      companyId: company.id,
    });

  } catch (error: any) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

