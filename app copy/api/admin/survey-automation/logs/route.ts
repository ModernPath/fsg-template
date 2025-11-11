import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('\n📊 [GET /api/admin/survey-automation/logs]')

    // Skip authentication in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ Authentication skipped in development mode')
    } else {
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
    }

    // Use service role for data queries
    const supabase = await createClient(undefined, true)

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const triggerId = searchParams.get('trigger_id')
    const userId = searchParams.get('user_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('survey_automation_log')
      .select(`
        *,
        survey_triggers (
          id,
          trigger_type,
          survey_templates (
            id,
            name
          )
        ),
        companies (
          id,
          name
        )
      `)

    // Apply filters
    if (status) {
      query = query.eq('execution_status', status)
    }
    if (triggerId) {
      query = query.eq('trigger_id', triggerId)
    }
    if (userId) {
      query = query.eq('user_id', userId)
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: logs, error, count } = await query

    if (error) {
      console.error('Error fetching automation logs:', error)
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
    }

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('survey_automation_log')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({ 
      logs,
      pagination: {
        total: totalCount || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (totalCount || 0)
      }
    })

  } catch (error) {
    console.error('Survey automation logs API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('\n📝 [POST /api/admin/survey-automation/logs]')

    // Verify authentication
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Puuttuva tai virheellinen valtuutus' },
        { status: 401 }
      )
    }

    // Verify token
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

    // Use service role for data operations
    const supabase = await createClient(undefined, true)

    const body = await request.json()
    const { 
      trigger_id, 
      user_id, 
      company_id, 
      trigger_event,
      execution_status = 'pending'
    } = body

    // Validate required fields
    if (!trigger_id || !user_id || !company_id) {
      return NextResponse.json({ 
        error: 'Missing required fields: trigger_id, user_id, company_id' 
      }, { status: 400 })
    }

    // Create log entry
    const { data: log, error } = await supabase
      .from('survey_automation_log')
      .insert({
        trigger_id,
        user_id,
        company_id,
        trigger_event,
        execution_status
      })
      .select(`
        *,
        survey_triggers (
          id,
          trigger_type,
          survey_templates (
            id,
            name
          )
        ),
        companies (
          id,
          name
        )
      `)
      .single()

    if (error) {
      console.error('Error creating automation log:', error)
      return NextResponse.json({ error: 'Failed to create log entry' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Automation log created successfully',
      log
    }, { status: 201 })

  } catch (error) {
    console.error('Survey automation logs API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('\n✏️ [PUT /api/admin/survey-automation/logs]')

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
    const { id, execution_status, error_message, executed_at } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing log ID' }, { status: 400 })
    }

    // Update log entry
    const updateData: any = {}
    if (execution_status) updateData.execution_status = execution_status
    if (error_message !== undefined) updateData.error_message = error_message
    if (executed_at !== undefined) updateData.executed_at = executed_at

    const { data: log, error } = await supabase
      .from('survey_automation_log')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        survey_triggers (
          id,
          trigger_type,
          survey_templates (
            id,
            name
          )
        ),
        companies (
          id,
          name
        )
      `)
      .single()

    if (error) {
      console.error('Error updating automation log:', error)
      return NextResponse.json({ error: 'Failed to update log entry' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Automation log updated successfully',
      log
    })

  } catch (error) {
    console.error('Survey automation logs API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
