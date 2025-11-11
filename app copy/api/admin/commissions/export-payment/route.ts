/**
 * POST /api/admin/commissions/export-payment
 * 
 * Export commission payment data (CSV or SEPA XML format)
 * Admin only
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';

// Request validation schema
const ExportSchema = z.object({
  commission_ids: z.array(z.string().uuid()).min(1, 'At least one commission ID required'),
  format: z.enum(['csv', 'sepa_xml']).default('csv')
});

export async function POST(request: NextRequest) {
  try {
    console.log('\n📝 [POST /api/admin/commissions/export-payment]');

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
      validatedData = ExportSchema.parse(body);
    } catch (validationError) {
      console.error('❌ Validation error:', validationError);
      return NextResponse.json(
        { error: 'Invalid request data', details: validationError },
        { status: 400 }
      );
    }

    console.log('✅ Request validated:', {
      commissionCount: validatedData.commission_ids.length,
      format: validatedData.format
    });

    // 5. Create service role client for database operations
    console.log('🔑 Creating service role client...');
    const supabase = await createClient(undefined, true);

    // 6. Fetch commission details with partner payment info
    const { data: commissions, error: fetchError } = await supabase
      .from('partner_commissions')
      .select(`
        *,
        partner:partners(
          name,
          email,
          bank_account_name,
          bank_iban,
          bank_bic,
          tax_id
        ),
        company:companies(
          name,
          business_id
        )
      `)
      .in('id', validatedData.commission_ids);

    if (fetchError || !commissions || commissions.length === 0) {
      console.error('❌ Error fetching commissions:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch commissions' },
        { status: 500 }
      );
    }

    console.log(`📊 Fetched ${commissions.length} commissions for export`);

    // 7. Generate export based on format
    if (validatedData.format === 'csv') {
      // CSV Export
      const csvRows = [
        // Header
        [
          'Commission ID',
          'Partner Name',
          'Partner Email',
          'Bank Account Name',
          'IBAN',
          'BIC',
          'Tax ID',
          'Amount',
          'Currency',
          'Reference',
          'Company Name',
          'Company Business ID',
          'Generated Date',
          'Status'
        ].join(',')
      ];

      // Data rows
      for (const commission of commissions) {
        const partner = commission.partner as any;
        const company = commission.company as any;
        
        csvRows.push([
          commission.id,
          `"${partner?.name || ''}"`,
          partner?.email || '',
          `"${partner?.bank_account_name || ''}"`,
          partner?.bank_iban || '',
          partner?.bank_bic || '',
          partner?.tax_id || '',
          commission.commission_amount,
          commission.currency,
          `"COMMISSION-${commission.id.substring(0, 8)}"`,
          `"${company?.name || ''}"`,
          company?.business_id || '',
          new Date(commission.generated_at).toISOString().split('T')[0],
          commission.status
        ].join(','));
      }

      const csvContent = '\uFEFF' + csvRows.join('\n'); // UTF-8 BOM for Excel
      const timestamp = new Date().toISOString().split('T')[0];

      console.log('✅ CSV export generated successfully');

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="commissions_export_${timestamp}.csv"`
        }
      });
    } 
    else if (validatedData.format === 'sepa_xml') {
      // SEPA XML Export (simplified version)
      // TODO: Implement full SEPA XML pain.001 format
      
      const totalAmount = commissions.reduce((sum, c) => sum + parseFloat(String(c.commission_amount)), 0);
      const timestamp = new Date().toISOString();
      
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>COMMISSIONS-${new Date().getTime()}</MsgId>
      <CreDtTm>${timestamp}</CreDtTm>
      <NbOfTxs>${commissions.length}</NbOfTxs>
      <CtrlSum>${totalAmount.toFixed(2)}</CtrlSum>
      <InitgPty>
        <Nm>Trusty Finance</Nm>
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>BATCH-${new Date().getTime()}</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <ReqdExctnDt>${new Date().toISOString().split('T')[0]}</ReqdExctnDt>
      <Dbtr>
        <Nm>Trusty Finance Oy</Nm>
      </Dbtr>
      ${commissions.map((commission, index) => {
        const partner = commission.partner as any;
        return `
      <CdtTrfTxInf>
        <PmtId>
          <EndToEndId>COMMISSION-${commission.id.substring(0, 8)}</EndToEndId>
        </PmtId>
        <Amt>
          <InstdAmt Ccy="${commission.currency}">${commission.commission_amount}</InstdAmt>
        </Amt>
        <Cdtr>
          <Nm>${partner?.bank_account_name || partner?.name || 'Unknown'}</Nm>
        </Cdtr>
        <CdtrAcct>
          <Id>
            <IBAN>${partner?.bank_iban || ''}</IBAN>
          </Id>
        </CdtrAcct>
        <RmtInf>
          <Ustrd>Commission payment for ${new Date(commission.generated_at).toISOString().split('T')[0]}</Ustrd>
        </RmtInf>
      </CdtTrfTxInf>`;
      }).join('')}
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`;

      console.log('✅ SEPA XML export generated successfully');

      const xmlTimestamp = new Date().toISOString().split('T')[0];
      
      return new NextResponse(xml, {
        status: 200,
        headers: {
          'Content-Type': 'application/xml',
          'Content-Disposition': `attachment; filename="commissions_sepa_${xmlTimestamp}.xml"`
        }
      });
    }

    // Should never reach here due to validation
    return NextResponse.json(
      { error: 'Invalid format' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

