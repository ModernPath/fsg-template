import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { SecureDocumentService } from '@/lib/services/secureDocumentService'
import { createClient } from '@/utils/supabase/server'

const actionSchema = z.object({
  action: z.enum(['accept', 'reject'])
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string; offerId: string }> }
) {
  const { token, offerId } = await params

  try {
    console.log('🔄 [PATCH] /api/secure-access/[token]/offer/[offerId] - Updating offer:', offerId)

    const body = await request.json()
    const { action } = actionSchema.parse(body)

    const secureService = await SecureDocumentService.create()
    const supabase = await createClient(undefined, true)

    const ipAddress = request.headers.get('x-forwarded-for') || '127.0.0.1'
    const userAgent = request.headers.get('user-agent') || 'Unknown'

    // 1. Verify access token
    const access = await secureService.verifyAccess(token, ipAddress, userAgent)

    if (access.access_level !== 'full') {
      return NextResponse.json(
        { error: 'You do not have permission to update offers.' },
        { status: 403 }
      )
    }

    // 2. Verify the offer belongs to this application
    const { data: offer, error: offerError } = await supabase
      .from('financing_offers')
      .select('id, status, funding_application_id, lender_id')
      .eq('id', offerId)
      .eq('funding_application_id', access.application_id)
      .single()

    if (offerError || !offer) {
      console.error('Offer not found or access denied:', offerError)
      return NextResponse.json(
        { error: 'Offer not found or access denied' },
        { status: 404 }
      )
    }

    // 3. Check if offer can be updated
    if (offer.status !== 'offered') {
      return NextResponse.json(
        { error: 'This offer has already been processed' },
        { status: 400 }
      )
    }

    // 4. Update offer status
    const newStatus = action === 'accept' ? 'accepted' : 'rejected'
    const { error: updateError } = await supabase
      .from('financing_offers')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', offerId)

    if (updateError) {
      console.error('Error updating offer status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update offer status' },
        { status: 500 }
      )
    }

    // 5. Update lender application status if offer was accepted
    if (action === 'accept') {
      await supabase
        .from('lender_applications')
        .update({ 
          status: 'OFFER_ACCEPTED',
          updated_at: new Date().toISOString()
        })
        .eq('application_id', access.application_id)
        .eq('lender_id', offer.lender_id)
    }

    // 6. Log the action
    await secureService.logAccess(
      token,
      `offer_${action}ed`,
      access.recipient_email,
      ipAddress,
      `Offer ID: ${offerId}`
    )

    console.log(`✅ Offer ${action}ed successfully:`, offerId)
    return NextResponse.json({
      success: true,
      message: `Offer ${action}ed successfully`,
      status: newStatus
    })

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid action', details: error.issues },
        { status: 400 }
      )
    }

    console.error('❌ Error updating offer:', error)
    
    if (error.message.includes('Invalid or expired')) {
      return NextResponse.json(
        { error: 'Invalid or expired access token' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update offer' },
      { status: 500 }
    )
  }
} 