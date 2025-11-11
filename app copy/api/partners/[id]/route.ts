import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

// Validation schemas
const PartnerUpdateSchema = z.object({
  name: z.string().min(1, 'Partner name is required').optional(),
  email: z.string().email('Valid email is required').optional(),
  phone: z.string().optional(),
  commission_percent: z.number().min(0).max(100).optional(),
  tier: z.enum(['basic', 'premium', 'enterprise']).optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  contact_info: z.record(z.any()).optional(),
  settings: z.record(z.any()).optional()
})

// GET /api/partners/[id] - Get single partner with stats (Admin only)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('GET /api/partners/[id] - Missing or invalid auth header')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const token = authHeader.split(' ')[1]
    const supabase = await createClient()
    
    // Check authentication with token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      console.log('GET /api/partners/[id] - Authentication failed:', authError?.message)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin status using service role client
    const adminClient = await createClient(true)
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('is_admin, is_partner, partner_id')
      .eq('id', user.id)
      .single()

    const { id } = await params
    console.log('GET /api/partners/[id] - Permission check:', { 
      userId: user.id, 
      profileError: profileError?.message, 
      isAdmin: profile?.is_admin,
      isPartner: profile?.is_partner,
      userPartnerId: profile?.partner_id,
      requestedPartnerId: id,
      userEmail: user.email 
    })

    // Allow access if user is admin OR if user is partner accessing their own data
    const isAdmin = profile?.is_admin
    const isOwnPartnerData = profile?.is_partner && profile?.partner_id === id

    if (profileError || (!isAdmin && !isOwnPartnerData)) {
      console.log('GET /api/partners/[id] - Access denied:', { 
        userId: user.id, 
        profileError, 
        isAdmin, 
        isOwnPartnerData 
      })
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get partner with stats using service role client
    const serviceClient = await createClient(true)
    const { data: partner, error } = await serviceClient
      .from('partners')
      .select(`
        *,
        _count_companies:companies(count),
        _count_commissions:partner_commissions(count)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching partner:', error)
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    // Calculate additional stats
    const { data: commissionStats } = await serviceClient
      .from('partner_commissions')
      .select('amount, status')
      .eq('partner_id', id)

    const stats = {
      total_companies: partner._count_companies?.[0]?.count || 0,
      total_commissions: commissionStats?.reduce((sum, c) => sum + parseFloat(c.amount || '0'), 0) || 0,
      total_applications: 0 // TODO: Count applications when table exists
    }

    return NextResponse.json({
      partner: {
        ...partner,
        stats
      }
    })

  } catch (error) {
    console.error('Error in GET /api/partners/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/partners/[id] - Update partner (Admin only)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('PUT /api/partners/[id] - Missing or invalid auth header')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const token = authHeader.split(' ')[1]
    const supabase = await createClient()
    
    // Check authentication with token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      console.log('PUT /api/partners/[id] - Authentication failed:', authError?.message)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin status using service role client
    const adminClient = await createClient(true)
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    console.log('PUT /api/partners/[id] - Admin check:', { 
      userId: user.id, 
      profileError: profileError?.message, 
      isAdmin: profile?.is_admin,
      userEmail: user.email 
    })

    if (profileError || !profile?.is_admin) {
      console.log('PUT /api/partners/[id] - Admin check failed:', { userId: user.id, profileError, isAdmin: profile?.is_admin })
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    
    // Parse and validate request body
    const body = await request.json()
    const validatedData = PartnerUpdateSchema.parse(body)

    // Use service role client for database operations
    const serviceClient = await createClient(true)
    
    // Update partner
    const { data: partner, error } = await serviceClient
      .from('partners')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating partner:', error)
      return NextResponse.json({ error: 'Failed to update partner' }, { status: 500 })
    }

    // Log audit trail
    await serviceClient.rpc('log_partner_audit', {
      p_partner_id: partner.id,
      p_action: 'UPDATE',
      p_resource_type: 'partner',
      p_resource_id: partner.id,
      p_old_values: {}, // TODO: Store old values if needed
      p_new_values: validatedData
    })

    return NextResponse.json({ partner }, { status: 200 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error in PUT /api/partners/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/partners/[id] - Delete partner (Admin only)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('DELETE /api/partners/[id] - Missing or invalid auth header')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const token = authHeader.split(' ')[1]
    const supabase = await createClient()
    
    // Check authentication with token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      console.log('DELETE /api/partners/[id] - Authentication failed:', authError?.message)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin status using service role client
    const adminClient = await createClient(true)
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    console.log('DELETE /api/partners/[id] - Admin check:', { 
      userId: user.id, 
      profileError: profileError?.message, 
      isAdmin: profile?.is_admin,
      userEmail: user.email 
    })

    if (profileError || !profile?.is_admin) {
      console.log('DELETE /api/partners/[id] - Admin check failed:', { userId: user.id, profileError, isAdmin: profile?.is_admin })
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    
    // Use service role client for database operations
    const serviceClient = await createClient(true)
    
    // Check if partner exists and get data for audit log
    const { data: existingPartner, error: fetchError } = await serviceClient
      .from('partners')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingPartner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    // Delete partner (cascade should handle related records)
    const { error } = await serviceClient
      .from('partners')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting partner:', error)
      return NextResponse.json({ error: 'Failed to delete partner' }, { status: 500 })
    }

    // Log audit trail
    await serviceClient.rpc('log_partner_audit', {
      p_partner_id: id,
      p_action: 'DELETE',
      p_resource_type: 'partner',
      p_resource_id: id,
      p_old_values: existingPartner
    })

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error) {
    console.error('Error in DELETE /api/partners/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 