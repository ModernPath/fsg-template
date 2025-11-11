import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { AnalyticsEvent } from '@/lib/analytics'

// Batch size for inserting events
const BATCH_SIZE = 100

export async function POST(request: Request) {
  try {
    console.log('\n📊 [POST /api/analytics/events]')
    
    // Parse event data with error handling
    let event: AnalyticsEvent
    try {
      event = await request.json() as AnalyticsEvent
      if (!event || !event.event_type) {
        console.error('❌ Invalid event data:', event)
        return NextResponse.json(
          { error: 'Invalid event data' },
          { status: 400 }
        )
      }
    } catch (parseError) {
      console.error('❌ Error parsing event data:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON data' },
        { status: 400 }
      )
    }
    
    // Create Supabase client with error handling
    let supabase
    try {
      supabase = await createClient(undefined, true)
    } catch (clientError) {
      console.error('❌ Error creating Supabase client:', clientError)
      return NextResponse.json(
        { error: 'Database connection error' },
        { status: 500 }
      )
    }

    // Generate UUID manually to ensure it's not null
    const eventId = crypto.randomUUID();
    
    // Insert event with enhanced properties including explicit ID
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        id: eventId,
        event_type: event.event_type,
        event_category: event.event_category,
        event_action: event.event_action,
        event_label: event.event_label,
        page_url: event.page_url,
        page_title: event.page_title,
        session_id: event.session_id,
        locale: event.locale,
        user_id: event.user_id,
        referrer: event.referrer,
        user_agent: event.user_agent,
        device_type: event.device_type,
        browser: event.browser,
        os: event.os,
        screen_resolution: event.screen_resolution,
        country: event.country,
        region: event.region,
        city: event.city,
        timezone: event.timezone,
        scroll_depth: event.scroll_depth,
        time_on_page: event.time_on_page,
        is_bounce: event.is_bounce,
        page_load_time: event.page_load_time,
        connection_type: event.connection_type,
        custom_dimensions: event.custom_dimensions || {},
        custom_metrics: event.custom_metrics || {},
        transaction_id: event.transaction_id,
        revenue: event.revenue,
        currency: event.currency,
        items: event.items || []
      })

    if (error) {
      console.error('❌ Error inserting event:', error)
      return NextResponse.json(
        { error: 'Failed to insert event' },
        { status: 500 }
      )
    }

    console.log('✅ Enhanced event tracked successfully:', {
      type: event.event_type,
      category: event.event_category,
      action: event.event_action,
      page: event.page_url,
      session: event.session_id
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Error in analytics events API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 