import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * GET /api/applications/[applicationId]
 * Fetch single funding application details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await params
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch application with company details
    const { data: application, error } = await supabase
      .from('funding_applications')
      .select(`
        *,
        companies!inner(
          id,
          name,
          business_id,
          user_id
        )
      `)
      .eq('id', applicationId)
      .single()

    if (error) {
      console.error('Error fetching application:', error)
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Verify user owns the company
    if (application.companies.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ application })
  } catch (error) {
    console.error('Error in GET /api/applications/[applicationId]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/applications/[applicationId]
 * Update funding application (only drafts can be updated)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await params
    const body = await request.json()
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch application to verify ownership and status
    const { data: existingApp, error: fetchError } = await supabase
      .from('funding_applications')
      .select(`
        *,
        companies!inner(
          user_id
        )
      `)
      .eq('id', applicationId)
      .single()

    if (fetchError || !existingApp) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Verify user owns the company
    if (existingApp.companies.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Only allow updating draft applications
    if (existingApp.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft applications can be updated' },
        { status: 400 }
      )
    }

    // Update application
    const { data: updatedApp, error: updateError } = await supabase
      .from('funding_applications')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating application:', updateError)
      return NextResponse.json(
        { error: 'Failed to update application' },
        { status: 500 }
      )
    }

    return NextResponse.json({ application: updatedApp })
  } catch (error) {
    console.error('Error in PATCH /api/applications/[applicationId]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

