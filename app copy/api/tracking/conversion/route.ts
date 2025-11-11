import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'
import { TrackConversionRequest, ConversionType } from '@/types/referral'

// Validation schema
const TrackConversionSchema = z.object({
  session_id: z.string().min(1, 'Session ID is required'),
  conversion_type: z.enum([
    'signup',
    'company_created', 
    'analysis_completed',
    'funding_applied',
    'funding_approved',
    'document_uploaded',
    'booking_created'
  ]),
  conversion_value: z.number().min(0).optional(),
  company_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  metadata: z.record(z.any()).optional()
})

// POST /api/tracking/conversion - Track conversion event
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Parse and validate request body
    const body = await request.json()
    const validationResult = TrackConversionSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validationResult.error.errors 
      }, { status: 400 })
    }

    const conversionData: TrackConversionRequest = validationResult.data

    // Track the conversion using database function
    console.log('🔍 [POST /api/tracking/conversion] Calling track_conversion with:', {
      session_id: conversionData.session_id,
      conversion_type: conversionData.conversion_type,
      conversion_value: conversionData.conversion_value || 0,
      company_id: conversionData.company_id || null,
      user_id: conversionData.user_id || null
    })

    const { data: conversionId, error: trackError } = await supabase
      .rpc('track_conversion', {
        p_session_id: conversionData.session_id,
        p_conversion_type: conversionData.conversion_type,
        p_conversion_value: conversionData.conversion_value || 0,
        p_company_id: conversionData.company_id || null,
        p_user_id: conversionData.user_id || null,
        p_metadata: conversionData.metadata || {}
      })

    if (trackError) {
      console.error('❌ [POST /api/tracking/conversion] Database error details:', {
        message: trackError.message,
        details: trackError.details,
        hint: trackError.hint,
        code: trackError.code
      })
      return NextResponse.json({ 
        error: 'Failed to track conversion',
        details: process.env.NODE_ENV === 'development' ? {
          message: trackError.message,
          code: trackError.code,
          hint: trackError.hint
        } : undefined
      }, { status: 500 })
    }

    console.log('✅ [POST /api/tracking/conversion] Conversion tracked successfully, ID:', conversionId)

    // Get the created conversion details to check if it was attributed to a partner
    const { data: conversion, error: conversionError } = await supabase
      .from('partner_conversions')
      .select(`
        id,
        partner_id,
        conversion_type,
        conversion_value,
        commission_amount,
        commission_eligible,
        first_touch,
        partners (
          name,
          commission_percent
        )
      `)
      .eq('id', conversionId)
      .single()

    if (conversionError) {
      console.error('Error fetching conversion details:', conversionError)
      // Return success even if we can't fetch details
      return NextResponse.json({
        conversion_id: conversionId,
        tracked: true,
        attributed: false,
        message: 'Conversion tracked successfully'
      }, { status: 201 })
    }

    const isAttributed = !!conversion.partner_id
    
    return NextResponse.json({
      conversion_id: conversionId,
      tracked: true,
      attributed: isAttributed,
      attribution: isAttributed ? {
        partner_id: conversion.partner_id,
        partner_name: (conversion.partners as any)?.name,
        commission_amount: conversion.commission_amount,
        commission_eligible: conversion.commission_eligible,
        first_touch: conversion.first_touch
      } : null,
      conversion: {
        type: conversion.conversion_type,
        value: conversion.conversion_value
      },
      message: isAttributed 
        ? 'Conversion tracked and attributed to partner'
        : 'Conversion tracked without partner attribution'
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/tracking/conversion:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/tracking/conversion - Get conversion history for session or user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const url = new URL(request.url)
    const sessionId = url.searchParams.get('session_id')
    const userId = url.searchParams.get('user_id')
    const companyId = url.searchParams.get('company_id')
    const conversionType = url.searchParams.get('conversion_type')
    
    if (!sessionId && !userId && !companyId) {
      return NextResponse.json({ 
        error: 'session_id, user_id, or company_id is required' 
      }, { status: 400 })
    }

    // Build query
    let query = supabase
      .from('partner_conversions')
      .select(`
        id,
        partner_id,
        conversion_type,
        conversion_value,
        commission_amount,
        commission_eligible,
        converted_at,
        first_touch,
        metadata,
        partners (
          name,
          commission_percent
        )
      `)
      .order('converted_at', { ascending: false })

    // Apply filters
    if (sessionId) {
      query = query.eq('session_id', sessionId)
    }
    if (userId) {
      query = query.eq('user_id', userId)
    }
    if (companyId) {
      query = query.eq('company_id', companyId)
    }
    if (conversionType) {
      query = query.eq('conversion_type', conversionType)
    }

    const { data: conversions, error } = await query

    if (error) {
      console.error('Error fetching conversions:', error)
      return NextResponse.json({ error: 'Failed to fetch conversions' }, { status: 500 })
    }

    // Calculate summary stats
    const summary = {
      total_conversions: conversions?.length || 0,
      total_value: conversions?.reduce((sum, conv) => sum + conv.conversion_value, 0) || 0,
      total_commission: conversions?.reduce((sum, conv) => sum + (conv.commission_amount || 0), 0) || 0,
      attributed_conversions: conversions?.filter(conv => conv.partner_id)?.length || 0,
      unique_partners: new Set(conversions?.filter(conv => conv.partner_id).map(conv => conv.partner_id)).size,
      conversion_types: [...new Set(conversions?.map(conv => conv.conversion_type))]
    }

    return NextResponse.json({
      conversions: conversions || [],
      summary
    })

  } catch (error) {
    console.error('Error in GET /api/tracking/conversion:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/tracking/conversion - Update conversion value (for delayed attribution)
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const url = new URL(request.url)
    const conversionId = url.searchParams.get('conversion_id')
    
    if (!conversionId) {
      return NextResponse.json({ error: 'conversion_id is required' }, { status: 400 })
    }

    const body = await request.json()
    const { conversion_value, metadata } = body

    if (typeof conversion_value !== 'number' || conversion_value < 0) {
      return NextResponse.json({ 
        error: 'Valid conversion_value is required' 
      }, { status: 400 })
    }

    // Get current conversion to check if partner is attributed
    const { data: existingConversion, error: fetchError } = await supabase
      .from('partner_conversions')
      .select('partner_id, commission_rate')
      .eq('id', conversionId)
      .single()

    if (fetchError) {
      console.error('Error fetching conversion:', fetchError)
      return NextResponse.json({ error: 'Conversion not found' }, { status: 404 })
    }

    // Calculate new commission if partner is attributed
    let newCommissionAmount = null
    if (existingConversion.partner_id && existingConversion.commission_rate) {
      newCommissionAmount = conversion_value * (existingConversion.commission_rate / 100)
    }

    // Update conversion
    const updateData: any = {
      conversion_value,
      metadata: metadata || {}
    }

    if (newCommissionAmount !== null) {
      updateData.commission_amount = newCommissionAmount
    }

    const { data: updatedConversion, error: updateError } = await supabase
      .from('partner_conversions')
      .update(updateData)
      .eq('id', conversionId)
      .select(`
        id,
        partner_id,
        conversion_type,
        conversion_value,
        commission_amount,
        partners (
          name
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating conversion:', updateError)
      return NextResponse.json({ error: 'Failed to update conversion' }, { status: 500 })
    }

    // Update cached totals in referral link if attributed
    if (updatedConversion.partner_id) {
      await supabase
        .rpc('refresh_referral_link_stats', {
          p_partner_id: updatedConversion.partner_id
        })
    }

    return NextResponse.json({
      conversion_id: updatedConversion.id,
      updated: true,
      new_value: updatedConversion.conversion_value,
      new_commission: updatedConversion.commission_amount,
      message: 'Conversion value updated successfully'
    })

  } catch (error) {
    console.error('Error in PUT /api/tracking/conversion:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 