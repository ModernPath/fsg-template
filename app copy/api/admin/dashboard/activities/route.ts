import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

interface Activity {
  id: string
  type: 'company_created' | 'analysis_completed' | 'application_submitted' | 'blog_published'
  title: string
  description: string
  timestamp: string
  color: 'green' | 'blue' | 'orange' | 'purple'
  icon?: string
}

export async function GET(request: NextRequest) {
  try {
    // Get authorization header for client-side authentication
    const authHeader = request.headers.get('Authorization')
    let session = null
    
    if (authHeader?.startsWith('Bearer ')) {
      // Client-side call with explicit token
      const token = authHeader.split(' ')[1]
      const supabase = await createClient()
      const { data } = await supabase.auth.getUser(token)
      if (data.user) {
        session = { user: data.user }
      }
    } else {
      // Server-side call with cookies
      const supabase = await createClient()
      const { data: { session: cookieSession }, error: authError } = await supabase.auth.getSession()
      
      if (!authError && cookieSession) {
        session = cookieSession
      }
    }
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const supabase = await createClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // Fetch recent activities from different sources
    const activities: Activity[] = []

    // 1. Recent companies (last 10)
    const { data: recentCompanies } = await supabase
      .from('companies')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (recentCompanies) {
      recentCompanies.forEach((company) => {
        activities.push({
          id: `company-${company.id}`,
          type: 'company_created',
          title: 'Uusi yritys rekisteröitynyt',
          description: company.name,
          timestamp: company.created_at,
          color: 'green'
        })
      })
    }

    // 2. Recent funding recommendations/analyses (last 10)
    const { data: recentAnalyses } = await supabase
      .from('funding_recommendations')
      .select(`
        id,
        created_at,
        companies!inner(name)
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (recentAnalyses) {
      recentAnalyses.forEach((analysis: any) => {
        activities.push({
          id: `analysis-${analysis.id}`,
          type: 'analysis_completed',
          title: 'Analyysi valmistunut',
          description: analysis.companies?.name || 'Tuntematon yritys',
          timestamp: analysis.created_at,
          color: 'blue'
        })
      })
    }

    // 3. Recent funding applications (last 10)
    const { data: recentApplications } = await supabase
      .from('funding_applications')
      .select(`
        id,
        type,
        status,
        created_at,
        companies!inner(name)
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (recentApplications) {
      recentApplications.forEach((app: any) => {
        const typeLabel = app.type 
          ? app.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
          : 'Rahoitushakemus'
        
        activities.push({
          id: `application-${app.id}`,
          type: 'application_submitted',
          title: `${typeLabel} lähetetty`,
          description: app.companies?.name || 'Tuntematon yritys',
          timestamp: app.created_at,
          color: 'orange'
        })
      })
    }

    // 4. Recent blog posts (if blog table exists)
    try {
      const { data: recentBlogs } = await supabase
        .from('blog_posts')
        .select('id, title, created_at, published')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(5)

      if (recentBlogs) {
        recentBlogs.forEach((blog) => {
          activities.push({
            id: `blog-${blog.id}`,
            type: 'blog_published',
            title: 'Uusi blogiposti julkaistu',
            description: blog.title,
            timestamp: blog.created_at,
            color: 'purple'
          })
        })
      }
    } catch (error) {
      // Blog table might not exist, skip
      console.log('Blog posts not available')
    }

    // Sort all activities by timestamp (newest first)
    activities.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })

    // Take only the 10 most recent activities
    const recentActivities = activities.slice(0, 10)

    // Format timestamps to relative time
    const formattedActivities = recentActivities.map(activity => {
      const timeAgo = getTimeAgo(activity.timestamp)
      return {
        ...activity,
        timeAgo
      }
    })

    return NextResponse.json({
      activities: formattedActivities
    })

  } catch (error) {
    console.error('Error fetching admin dashboard activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard activities' },
      { status: 500 }
    )
  }
}

/**
 * Convert timestamp to relative time string (e.g., "2 hours ago")
 */
function getTimeAgo(timestamp: string): string {
  const now = new Date()
  const past = new Date(timestamp)
  const diffMs = now.getTime() - past.getTime()
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffWeeks = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7))
  const diffMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30))

  if (diffMinutes < 1) return 'juuri nyt'
  if (diffMinutes < 60) return `${diffMinutes} ${diffMinutes === 1 ? 'minuutti' : 'minuuttia'} sitten`
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'tunti' : 'tuntia'} sitten`
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'päivä' : 'päivää'} sitten`
  if (diffWeeks < 4) return `${diffWeeks} ${diffWeeks === 1 ? 'viikko' : 'viikkoa'} sitten`
  if (diffMonths < 12) return `${diffMonths} ${diffMonths === 1 ? 'kuukausi' : 'kuukautta'} sitten`
  
  const diffYears = Math.floor(diffMonths / 12)
  return `${diffYears} ${diffYears === 1 ? 'vuosi' : 'vuotta'} sitten`
}

