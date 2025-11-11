import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { Database } from '@/lib/database.types'

type SurveyTrigger = Database['public']['Tables']['survey_triggers']['Row']
type SurveyTriggerInsert = Database['public']['Tables']['survey_triggers']['Insert']

export async function GET(request: NextRequest) {
  try {
    console.log('\n📊 [GET /api/admin/survey-automation/triggers]')

    // Verify authentication
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Puuttuva tai virheellinen valtuutus' },
        { status: 401 }
      )
    }

    // Verify token and admin status
    const authClient = await createClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser(
      authHeader.split(' ')[1]
    )

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Valtuutus epäonnistui' },
        { status: 401 }
      )
    }

    const { data: profile } = await authClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: 'Toiminto vaatii ylläpitäjän oikeudet' },
        { status: 403 }
      )
    }

    // Use service role for data queries
    const supabase = await createClient(undefined, true)

    // Get survey triggers with template info
    const { data: triggers, error } = await supabase
      .from('survey_triggers')
      .select(`
        *,
        survey_templates (
          id,
          name,
          description,
          is_active
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching survey triggers:', error)
      return NextResponse.json({ error: 'Failed to fetch triggers' }, { status: 500 })
    }

    return NextResponse.json({ triggers })

  } catch (error) {
    console.error('Survey triggers API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('\n📝 [POST /api/admin/survey-automation/triggers]')

    // Verify authentication
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Puuttuva tai virheellinen valtuutus' },
        { status: 401 }
      )
    }

    // Verify token and admin status
    const authClient = await createClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser(
      authHeader.split(' ')[1]
    )

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Valtuutus epäonnistui' },
        { status: 401 }
      )
    }

    const { data: profile } = await authClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: 'Toiminto vaatii ylläpitäjän oikeudet' },
        { status: 403 }
      )
    }

    // Use service role for data operations
    const supabase = await createClient(undefined, true)

    const body = await request.json()
    const { 
      template_id, 
      trigger_type, 
      trigger_conditions = {}, 
      delay_days = 0,
      is_active = true 
    } = body

    // Validate required fields
    if (!template_id || !trigger_type) {
      return NextResponse.json({ 
        error: 'Missing required fields: template_id, trigger_type' 
      }, { status: 400 })
    }

    // Validate trigger type
    const validTriggerTypes = [
      'onboarding_complete', 
      'application_submitted', 
      'decision_received',
      'contract_signed', 
      'funding_disbursed', 
      'payment_start',
      'contract_completed', 
      'first_referral', 
      'time_based'
    ]

    if (!validTriggerTypes.includes(trigger_type)) {
      return NextResponse.json({ 
        error: `Invalid trigger type. Must be one of: ${validTriggerTypes.join(', ')}` 
      }, { status: 400 })
    }

    // Check if template exists and is active
    const { data: template, error: templateError } = await supabase
      .from('survey_templates')
      .select('id, name, is_active')
      .eq('id', template_id)
      .single()

    if (templateError || !template) {
      return NextResponse.json({ error: 'Survey template not found' }, { status: 400 })
    }

    if (!template.is_active) {
      return NextResponse.json({ error: 'Survey template is not active' }, { status: 400 })
    }

    // Create trigger
    const triggerData: SurveyTriggerInsert = {
      template_id,
      trigger_type,
      trigger_conditions,
      delay_days,
      is_active
    }

    const { data: trigger, error } = await supabase
      .from('survey_triggers')
      .insert(triggerData)
      .select(`
        *,
        survey_templates (
          id,
          name,
          description,
          is_active
        )
      `)
      .single()

    if (error) {
      console.error('Error creating survey trigger:', error)
      return NextResponse.json({ error: 'Failed to create trigger' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Survey trigger created successfully',
      trigger
    }, { status: 201 })

  } catch (error) {
    console.error('Survey triggers API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('\n✏️ [PUT /api/admin/survey-automation/triggers]')

    // Verify authentication
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Puuttuva tai virheellinen valtuutus' },
        { status: 401 }
      )
    }

    // Verify token and admin status
    const authClient = await createClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser(
      authHeader.split(' ')[1]
    )

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Valtuutus epäonnistui' },
        { status: 401 }
      )
    }

    const { data: profile } = await authClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: 'Toiminto vaatii ylläpitäjän oikeudet' },
        { status: 403 }
      )
    }

    // Use service role for data operations
    const supabase = await createClient(undefined, true)

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing trigger ID' }, { status: 400 })
    }

    // Update trigger
    const { data: trigger, error } = await supabase
      .from('survey_triggers')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        survey_templates (
          id,
          name,
          description,
          is_active
        )
      `)
      .single()

    if (error) {
      console.error('Error updating survey trigger:', error)
      return NextResponse.json({ error: 'Failed to update trigger' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Survey trigger updated successfully',
      trigger
    })

  } catch (error) {
    console.error('Survey triggers API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('\n🗑️ [DELETE /api/admin/survey-automation/triggers]')

    // Verify authentication
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Puuttuva tai virheellinen valtuutus' },
        { status: 401 }
      )
    }

    // Verify token and admin status
    const authClient = await createClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser(
      authHeader.split(' ')[1]
    )

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Valtuutus epäonnistui' },
        { status: 401 }
      )
    }

    const { data: profile } = await authClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: 'Toiminto vaatii ylläpitäjän oikeudet' },
        { status: 403 }
      )
    }

    // Use service role for data operations
    const supabase = await createClient(undefined, true)

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing trigger ID' }, { status: 400 })
    }

    // Delete trigger
    const { error } = await supabase
      .from('survey_triggers')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting survey trigger:', error)
      return NextResponse.json({ error: 'Failed to delete trigger' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Survey trigger deleted successfully'
    })

  } catch (error) {
    console.error('Survey triggers API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
