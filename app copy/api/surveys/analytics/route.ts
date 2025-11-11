import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'
import { validateAdminToken } from '@/lib/auth/jwt-validation'
import { withRateLimit, analyticsRateLimiter } from '@/lib/rate-limit'
import { AnalyticsQueryOptimizer } from '@/lib/analytics/query-optimizer'

// Validation schemas
const analyticsQuerySchema = z.object({
  template_id: z.string().uuid(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  refresh: z.boolean().optional().default(false)
})

/**
 * GET /api/surveys/analytics
 * Retrieve survey analytics (Admin only)
 */
export async function GET(request: NextRequest) {
  try {
    console.log('\n📝 [GET /api/surveys/analytics]', {
      url: request.url
    })

    // Rate limiting
    const rateLimitResult = await withRateLimit(request, analyticsRateLimiter)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { 
          status: 429,
          headers: rateLimitResult.headers
        }
      )
    }

    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('template_id')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const refresh = searchParams.get('refresh') === 'true'
    const useCache = searchParams.get('no_cache') !== 'true'

    if (!templateId) {
      return NextResponse.json(
        { error: 'Kyselypohjan ID vaaditaan' },
        { status: 400 }
      )
    }

    // Authentication and authorization
    const authResult = await validateAdminToken(request)
    if (!authResult.success) {
      console.error('❌ Authentication failed:', authResult.error)
      return NextResponse.json(
        { error: authResult.error },
        { 
          status: authResult.error?.includes('Admin') ? 403 : 401,
          headers: rateLimitResult.headers
        }
      )
    }

    console.log('✅ Admin user authenticated:', authResult.user?.id)

    // Use optimized analytics query
    const optimizer = new AnalyticsQueryOptimizer()
    
    // Clear cache if refresh is requested
    if (refresh) {
      console.log('🔄 Clearing cache and refreshing analytics for template:', templateId)
      optimizer.clearCache(templateId)
    }

    // Get optimized analytics
    const result = await optimizer.getOptimizedAnalytics({
      templateId,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      useCache,
      cacheTimeout: 300000 // 5 minutes
    })

    console.log(`✅ Analytics calculated for template ${templateId}`)

    return NextResponse.json(result, {
      headers: {
        ...rateLimitResult.headers,
        'Cache-Control': useCache ? 'private, max-age=300' : 'no-cache'
      }
    })

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json(
      { error: 'Sisäinen palvelinvirhe' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/surveys/analytics
 * Generate detailed analytics report (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('\n📝 [POST /api/surveys/analytics] - Generate detailed report')

    // Verify authentication and admin status
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Puuttuva tai virheellinen valtuutus' },
        { status: 401 }
      )
    }

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

    // Parse and validate request body
    const body = await request.json()
    const validatedData = analyticsQuerySchema.parse(body)

    console.log('📊 Generating detailed analytics report:', validatedData)

    const supabase = await createClient(undefined, true)

    // Get all response data for detailed analysis
    const { data: responses, error: responsesError } = await supabase
      .from('survey_responses')
      .select(`
        *,
        survey_invitations(email, sent_at, opened_at),
        profiles(first_name, last_name, company_id),
        companies(name, business_id, industry)
      `)
      .eq('template_id', validatedData.template_id)

    if (responsesError) {
      console.error('❌ Error fetching detailed responses:', responsesError)
      return NextResponse.json(
        { error: 'Yksityiskohtaisten vastausten haku epäonnistui' },
        { status: 500 }
      )
    }

    // Get template structure for question analysis
    const { data: template, error: templateError } = await supabase
      .from('survey_templates')
      .select('questions, name, description')
      .eq('id', validatedData.template_id)
      .single()

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Kyselypohjaa ei löytynyt' },
        { status: 404 }
      )
    }

    // Generate detailed analytics
    const detailedAnalytics = generateDetailedAnalytics(
      responses || [],
      template.questions,
      validatedData
    )

    console.log('✅ Detailed analytics report generated')

    return NextResponse.json({
      template: {
        id: validatedData.template_id,
        name: template.name,
        description: template.description
      },
      report: detailedAnalytics,
      meta: {
        generated_at: new Date().toISOString(),
        total_responses: responses?.length || 0,
        query_params: validatedData
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Virheelliset tiedot',
          details: error.errors
        },
        { status: 400 }
      )
    }

    console.error('❌ Unexpected error:', error)
    return NextResponse.json(
      { error: 'Sisäinen palvelinvirhe' },
      { status: 500 }
    )
  }
}

// Removed calculateSurveyAnalytics - now using AnalyticsQueryOptimizer

/**
 * Generate detailed analytics with question-level analysis
 */
function generateDetailedAnalytics(responses: any[], questionsStructure: any, params: any) {
  const completedResponses = responses.filter(r => r.completion_status === 'completed')
  
  // Extract questions from the template structure
  const questions = extractQuestionsFromStructure(questionsStructure)
  
  // Analyze each question
  const questionAnalysis = questions.map(question => {
    const questionId = question.id
    const questionType = question.type
    const questionText = question.text

    // Get all answers for this question
    const answers = completedResponses
      .map(r => r.answers?.[questionId])
      .filter(answer => answer !== undefined && answer !== null && answer !== '')

    let analysis: any = {
      question_id: questionId,
      question_text: questionText,
      question_type: questionType,
      response_count: answers.length,
      response_rate: completedResponses.length > 0 
        ? (answers.length / completedResponses.length) * 100 
        : 0
    }

    // Type-specific analysis
    switch (questionType) {
      case 'radio':
      case 'checkbox':
        analysis.value_distribution = analyzeMultipleChoiceAnswers(answers, question.options)
        break
        
      case 'scale':
        analysis.scale_analysis = analyzeScaleAnswers(answers, question.scale)
        break
        
      case 'textarea':
      case 'text':
        analysis.text_analysis = analyzeTextAnswers(answers)
        break
    }

    return analysis
  })

  // Cross-tabulation analysis
  const crossTabs = generateCrossTabs(completedResponses, questions)

  return {
    summary: {
      total_completed_responses: completedResponses.length,
      questions_analyzed: questions.length,
      analysis_date: new Date().toISOString()
    },
    question_analysis: questionAnalysis,
    cross_tabulation: crossTabs,
    segmentation: generateSegmentationAnalysis(completedResponses)
  }
}

/**
 * Extract questions from template structure
 */
function extractQuestionsFromStructure(questionsStructure: any): any[] {
  const questions: any[] = []
  
  if (questionsStructure?.sections) {
    for (const section of questionsStructure.sections) {
      if (section.questions) {
        questions.push(...section.questions)
      }
    }
  }
  
  return questions
}

/**
 * Analyze multiple choice answers
 */
function analyzeMultipleChoiceAnswers(answers: any[], options: any[]) {
  const distribution: Record<string, number> = {}
  const optionLabels: Record<string, string> = {}
  
  // Initialize with options
  options?.forEach(option => {
    distribution[option.value] = 0
    optionLabels[option.value] = option.label
  })
  
  // Count answers
  answers.forEach(answer => {
    if (Array.isArray(answer)) {
      // Checkbox - multiple values
      answer.forEach(value => {
        distribution[value] = (distribution[value] || 0) + 1
      })
    } else {
      // Radio - single value
      distribution[answer] = (distribution[answer] || 0) + 1
    }
  })
  
  return {
    distribution,
    labels: optionLabels,
    total_responses: answers.length
  }
}

/**
 * Analyze scale answers
 */
function analyzeScaleAnswers(answers: any[], scale: any) {
  const numericAnswers = answers.map(a => parseInt(a)).filter(a => !isNaN(a))
  
  if (numericAnswers.length === 0) {
    return {
      average: null,
      median: null,
      distribution: {},
      total_responses: 0
    }
  }
  
  const sum = numericAnswers.reduce((a, b) => a + b, 0)
  const average = sum / numericAnswers.length
  
  const sorted = [...numericAnswers].sort((a, b) => a - b)
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)]
  
  // Distribution by scale value
  const distribution: Record<number, number> = {}
  for (let i = scale?.min || 1; i <= (scale?.max || 5); i++) {
    distribution[i] = 0
  }
  
  numericAnswers.forEach(answer => {
    distribution[answer] = (distribution[answer] || 0) + 1
  })
  
  return {
    average: Math.round(average * 100) / 100,
    median,
    distribution,
    total_responses: numericAnswers.length,
    scale_info: scale
  }
}

/**
 * Analyze text answers
 */
function analyzeTextAnswers(answers: any[]) {
  const textAnswers = answers.filter(a => typeof a === 'string' && a.trim().length > 0)
  
  // Basic text statistics
  const wordCounts = textAnswers.map(answer => answer.trim().split(/\s+/).length)
  const averageWordCount = wordCounts.length > 0 
    ? wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length 
    : 0
  
  // Common themes (very basic - could be enhanced with NLP)
  const commonWords = extractCommonWords(textAnswers)
  
  return {
    total_responses: textAnswers.length,
    average_word_count: Math.round(averageWordCount * 100) / 100,
    common_themes: commonWords.slice(0, 10), // Top 10 words
    sample_responses: textAnswers.slice(0, 5) // First 5 responses as samples
  }
}

/**
 * Extract common words from text answers
 */
function extractCommonWords(textAnswers: string[]) {
  const stopWords = new Set(['ja', 'tai', 'on', 'ei', 'se', 'että', 'kun', 'niin', 'kuin', 'vaan', 'jos', 'oli', 'olla', 'ole', 'olen', 'olet', 'hän', 'me', 'te', 'he', 'tämä', 'tuo', 'se', 'nämä', 'nuo', 'ne'])
  
  const wordCounts: Record<string, number> = {}
  
  textAnswers.forEach(answer => {
    const words = answer.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
    
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1
    })
  })
  
  return Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([word, count]) => ({ word, count }))
}

/**
 * Generate cross-tabulation analysis
 */
function generateCrossTabs(responses: any[], questions: any[]) {
  // Simple cross-tabs between key questions
  const keyQuestions = questions.filter(q => 
    ['did_analysis', 'role', 'company_size', 'overall_satisfaction', 'nps_score'].includes(q.id)
  )
  
  const crossTabs: any[] = []
  
  for (let i = 0; i < keyQuestions.length; i++) {
    for (let j = i + 1; j < keyQuestions.length; j++) {
      const q1 = keyQuestions[i]
      const q2 = keyQuestions[j]
      
      const crossTab = generateCrossTab(responses, q1, q2)
      if (crossTab) {
        crossTabs.push(crossTab)
      }
    }
  }
  
  return crossTabs
}

/**
 * Generate cross-tabulation between two questions
 */
function generateCrossTab(responses: any[], q1: any, q2: any) {
  const validResponses = responses.filter(r => 
    r.answers?.[q1.id] !== undefined && r.answers?.[q2.id] !== undefined
  )
  
  if (validResponses.length < 5) return null // Skip if too few responses
  
  const crosstab: Record<string, Record<string, number>> = {}
  
  validResponses.forEach(response => {
    const val1 = response.answers[q1.id]
    const val2 = response.answers[q2.id]
    
    if (!crosstab[val1]) crosstab[val1] = {}
    crosstab[val1][val2] = (crosstab[val1][val2] || 0) + 1
  })
  
  return {
    question_1: { id: q1.id, text: q1.text },
    question_2: { id: q2.id, text: q2.text },
    crosstab,
    total_responses: validResponses.length
  }
}

/**
 * Generate segmentation analysis
 */
function generateSegmentationAnalysis(responses: any[]) {
  // Segment by key characteristics
  const segments = {
    by_analysis_completion: segmentByAnalysisCompletion(responses),
    by_company_size: segmentByCompanySize(responses),
    by_satisfaction: segmentBySatisfaction(responses)
  }
  
  return segments
}

function segmentByAnalysisCompletion(responses: any[]) {
  return {
    did_analysis: responses.filter(r => r.answers?.did_analysis === 'yes').length,
    did_not_analysis: responses.filter(r => r.answers?.did_analysis === 'no').length
  }
}

function segmentByCompanySize(responses: any[]) {
  const segments: Record<string, number> = {}
  
  responses.forEach(r => {
    const size = r.answers?.company_size
    if (size) {
      segments[size] = (segments[size] || 0) + 1
    }
  })
  
  return segments
}

function segmentBySatisfaction(responses: any[]) {
  const satisfactionScores = responses
    .map(r => parseInt(r.answers?.overall_satisfaction))
    .filter(score => !isNaN(score))
  
  return {
    very_satisfied: satisfactionScores.filter(s => s >= 4).length,
    neutral: satisfactionScores.filter(s => s === 3).length,
    dissatisfied: satisfactionScores.filter(s => s <= 2).length,
    average_satisfaction: satisfactionScores.length > 0 
      ? satisfactionScores.reduce((a, b) => a + b, 0) / satisfactionScores.length 
      : null
  }
}
