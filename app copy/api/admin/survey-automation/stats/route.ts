import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('\n📊 [GET /api/admin/survey-automation/stats]')

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

    console.log('🔍 Fetching automation statistics...')

    // Get trigger statistics
    const { data: triggerStats, error: triggerError } = await supabase
      .from('survey_triggers')
      .select('id, is_active')

    if (triggerError) {
      console.error('❌ Error fetching trigger stats:', triggerError)
      throw new Error('Trigger-tilastojen haku epäonnistui')
    }

    const totalTriggers = triggerStats?.length || 0
    const activeTriggers = triggerStats?.filter(t => t.is_active).length || 0

    console.log(`📈 Triggers: ${totalTriggers} total, ${activeTriggers} active`)

    // Get automation log statistics
    const { data: logStats, error: logError } = await supabase
      .from('survey_automation_log')
      .select('execution_status, created_at')

    if (logError) {
      console.error('❌ Error fetching log stats:', logError)
      throw new Error('Log-tilastojen haku epäonnistui')
    }

    const totalExecutions = logStats?.length || 0
    const completedExecutions = logStats?.filter(l => l.execution_status === 'completed').length || 0
    const failedExecutions = logStats?.filter(l => l.execution_status === 'failed').length || 0
    const pendingExecutions = logStats?.filter(l => l.execution_status === 'pending').length || 0

    // Calculate success rate
    const successRate = totalExecutions > 0 ? (completedExecutions / totalExecutions) * 100 : 0

    console.log(`📊 Executions: ${totalExecutions} total, ${completedExecutions} completed, ${failedExecutions} failed, ${pendingExecutions} pending`)
    console.log(`✅ Success rate: ${successRate.toFixed(1)}%`)

    // Get email statistics from survey_invitations
    const { data: emailStats, error: emailError } = await supabase
      .from('survey_invitations')
      .select('id, email_sent_at')
      .not('email_sent_at', 'is', null)

    if (emailError) {
      console.error('❌ Error fetching email stats:', emailError)
      // Don't throw error, just log and continue with 0
    }

    const totalEmailsSent = emailStats?.length || 0

    console.log(`📧 Emails sent: ${totalEmailsSent}`)

    // Compile statistics
    const stats = {
      total_triggers: totalTriggers,
      active_triggers: activeTriggers,
      total_emails_sent: totalEmailsSent,
      success_rate: Math.round(successRate * 10) / 10, // Round to 1 decimal
      pending_actions: pendingExecutions,
      failed_actions: failedExecutions,
      total_executions: totalExecutions,
      completed_executions: completedExecutions
    }

    console.log('✅ Statistics compiled successfully:', stats)

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('❌ Survey automation stats API error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Sisäinen palvelinvirhe',
        stats: {
          total_triggers: 0,
          active_triggers: 0,
          total_emails_sent: 0,
          success_rate: 0,
          pending_actions: 0,
          failed_actions: 0,
          total_executions: 0,
          completed_executions: 0
        }
      },
      { status: 500 }
    )
  }
}
