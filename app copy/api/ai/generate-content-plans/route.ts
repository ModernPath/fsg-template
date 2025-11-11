import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenAI, Type } from '@google/genai'
import { eachDayOfInterval, isWeekend, format } from 'date-fns'
import { inngest } from '@/lib/inngest-client'
import { buildContentGenerationPrompt } from '@/lib/content-generation-prompt'

const API_KEY = process.env.GOOGLE_AI_STUDIO_KEY

if (!API_KEY) {
  throw new Error('GOOGLE_AI_STUDIO_KEY is not set')
}

const ai = new GoogleGenAI({ apiKey: API_KEY })

// Initialize Auth Client (using ANON key)
const authClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Initialize Service Role Client (using SERVICE_ROLE key)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: NextRequest) {
  try {
    // Check authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid authorization header')
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    // Extract token and verify authentication
    const token = authHeader.split(' ')[1]
    console.log('🔑 Verifying token...')
    
    const { data: { user }, error: authError } = await authClient.auth.getUser(token)
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ User authenticated:', user.id)

    const body = await request.json()
    const {
      contentTypeIds,
      personaIds,
      languages,
      keywords,
      customTopics,
      startDate,
      endDate,
      timeSlots,
      excludeWeekends,
      autoGenerate = false  // New parameter to control auto-generation
    } = body

    // Fetch content types
    const { data: contentTypes } = await supabaseAdmin
      .from('content_types')
      .select('*')
      .in('id', contentTypeIds)

    // Fetch personas
    const { data: personas } = await supabaseAdmin
      .from('ai_personas')
      .select('*')
      .in('id', personaIds)

    // Fetch brand info for context
    const { data: brands } = await supabaseAdmin
      .from('brands')
      .select('*')
      .single()

    // Calculate available dates
    const allDates = eachDayOfInterval({
      start: new Date(startDate),
      end: new Date(endDate)
    })

    const availableDates = excludeWeekends 
      ? allDates.filter(date => !isWeekend(date))
      : allDates

    // Calculate total content plans needed based on schedule
    const totalPlansNeeded = availableDates.length * timeSlots.length * languages.length

    // Use unified FSG Trusty Finance approach for content planning
    console.log('🔨 Building FSG Trusty Finance content planning prompt...')
    
    // Create base configuration for the planning prompt
    const planningPromptConfig = {
      prompt: `You are FSG Trusty Finance's senior content strategist, creating strategic content plans that reflect our role as an independent financial advisor for businesses.

CRITICAL CONTEXT - You are planning content for FSG Trusty Finance:
- Mission: Empower business decision-makers to understand financing market opportunities through clear, objective guidance
- Position: Independent financial partner (NOT a lender's representative)
- Role: External CFO that clients can access - analytical, trusted, empathetic
- Approach: Balanced, transparent, never criticizing any financing option

Company Information:
${brands ? `
Name: ${brands.name}
Description: ${brands.description}
Mission: ${brands.mission}
Values: ${brands.values?.join(', ')}
` : 'FSG Trusty Finance - Independent Financial Advisory'}

Task: Generate ${totalPlansNeeded} unique content plans for strategic financial advisory content.
Schedule: ${availableDates.length} days from ${startDate} to ${endDate}`,
      language: 'en',
      brand: brands ? {
        name: brands.name,
        description: brands.description,
        mission: brands.mission,
        values: brands.values,
        voice: 'Independent financial advisor'
      } : {
        name: 'FSG Trusty Finance',
        voice: 'Independent financial advisor, analytical, empathetic'
      },
      contentType: {
        name: 'Financial Advisory Content Planning',
        description: 'Strategic content planning for independent financial advisory services',
        tone_formal: 7,
        tone_friendly: 6,
        tone_technical: 8,
        tone_innovative: 5
      },
      outputFormat: 'custom' as const,
      includeImagePrompt: false
    }
    
    // Generate the base planning prompt using our unified system
    const basePlanningPrompt = buildContentGenerationPrompt(planningPromptConfig)
    
    // Extend with specific planning instructions
    const prompt = basePlanningPrompt + `

CONTENT PLANNING SPECIFIC REQUIREMENTS:

Content Types Available (IMPORTANT: Use these exact UUIDs in your response):
${contentTypes?.map(ct => `
- ID: ${ct.id} (USE THIS EXACT UUID)
  Name: ${ct.name}
  Description: ${ct.description}
  Typical length: ${ct.typical_length_min}-${ct.typical_length_max} words
  Keywords focus: ${ct.keywords?.join(', ')}
`).join('\n')}

Target Personas (IMPORTANT: Use these exact UUIDs in your response):
${personas?.map(p => `
- ID: ${p.id} (USE THIS EXACT UUID)
  Name: ${p.name}
  Description: ${p.description}
  Topics: ${p.topics?.join(', ')}
`).join('\n')}

Languages to support: ${languages.join(', ')}

SEO Keywords to incorporate: ${keywords}

${customTopics ? `Custom topics to cover:
${customTopics}` : ''}

For each content plan, provide:
1. A title that feels HUMAN and VARIED (50-70 chars). CRITICAL TITLE REQUIREMENTS:
   - NEVER use the "X: How to Y" format
   - AVOID patterns like "The Ultimate Guide to...", "X Tips for...", "Everything You Need to Know About..."
   - Mix these professional title styles:
     * Questions: "Why Are Finnish Startups Outperforming Silicon Valley Giants?"
     * Insights: "The Hidden Cost of Microservices Architecture"
     * Analysis: "Machine Learning Models That Actually Work in Production"
     * Case Studies: "How Netflix Reduced Deployment Time by 90%"
     * Trends: "The Shift from DevOps to Platform Engineering"
     * Perspectives: "Rethinking Data Privacy in the Age of LLMs"
     * Research: "What 500 CTOs Revealed About Tech Debt"
     * Guides: "Building Resilient Systems at Scale"
   - Use proper capitalization and punctuation
   - Include specific metrics: "37%" not "about 40%", "$2.8M" not "millions"
   - Be precise with quantities when relevant
   - Focus on value and outcomes
2. The main topic/theme
3. 3-5 relevant keywords (mix professional and casual terms)
4. Which content type it should use
5. Which persona(s) it targets
6. A detailed content generation prompt (150-250 words) written for FSG Trusty Finance's independent financial advisor approach

CRITICAL: Each generation prompt MUST align with FSG Trusty Finance methodology:
- Request FSG's empathetic opening addressing specific business financing challenges (cash flow concerns, growth capital needs)
- Ask for analytical progression from problem identification to impartial solution comparison  
- Specify inclusion of precise financial market data and regulatory context when relevant
- Request balanced presentation of ALL financing options (traditional banking, alternative finance, etc.) with honest pros/cons
- Emphasize actionable guidance for business decision-makers, not theoretical concepts
- Ask for external CFO voice - analytical yet approachable professional financial advisor
- Specify transparency about costs, terms, and realistic expectations
- Request specific examples from relevant markets (Nordic, European SME, etc.)
- Ask for practical tools and comparable information to support decision-making
- Include value-driven conclusion with non-intrusive next steps (analysis tools, unbiased consultation)

FSG Generation Prompt Template: "Write as FSG Trusty Finance's experienced external CFO analyzing [specific financing challenge]. Start by acknowledging the business pain point (e.g., sleepless nights over working capital). Provide impartial analysis of available financing solutions including traditional banking, alternative lenders, and innovative financing. Include specific market data from credible sources (central banks, financial authorities). Present honest pros/cons of each option. Conclude with practical next steps and value-driven call-to-action. Target: [specific business segment]. Length: ~1500 words. Tone: Trusted financial advisor."

TITLE VARIETY CHECK - Your titles MUST include:
- At least 3 different title formats (question, statement, insight, etc.)
- NO repeated patterns or formulas
- Professional yet engaging tone
- Clear value proposition
- Different lengths within the 50-70 char range
- Thought-provoking without being clickbait
- Focus on outcomes or insights
- ZERO titles with colons followed by generic explanations

Format your response as a JSON array with exactly ${totalPlansNeeded} objects:
[
  {
    "title": "Working Capital Crisis Solutions",
    "topic": "Cash flow management and short-term financing options for growing businesses",
    "keywords": ["working capital", "cash flow", "short-term financing", "business growth", "SME finance"],
    "contentTypeId": "ACTUAL_UUID_FROM_ABOVE (e.g., ${contentTypes?.[0]?.id || 'uuid-here'})",
    "targetPersonaIds": ["ACTUAL_UUID_FROM_ABOVE (e.g., ${personas?.[0]?.id || 'uuid-here'})"],
    "generationPrompt": "Write as FSG Trusty Finance's experienced external CFO analyzing working capital shortages that keep business owners awake at night. Start by empathetically describing the stress of delayed customer payments while fixed costs continue. Provide impartial analysis of available solutions: traditional bank overdrafts, invoice financing, supply chain finance, and alternative working capital providers. Include specific market data from European Central Bank SME lending surveys and Finnish/Nordic SME financing statistics. Present honest pros/cons of each option including typical costs (APR ranges), approval timeframes, and collateral requirements. Address common misconceptions about alternative finance costs vs. lost opportunity costs. Conclude with practical decision framework and value-driven next steps like working capital optimization analysis. Target: SME leadership and CFOs managing growth-stage businesses. Length: ~1500 words. Tone: Trusted, analytical financial advisor.",
    "suggestedLength": 1500
  }
]

CRITICAL: You MUST use the exact UUID values provided above for contentTypeId and targetPersonaIds. Do NOT use placeholder values like "how-to-tutorial-uuid".

Ensure ALL content aligns with FSG Trusty Finance's mission as independent financial advisor.
Focus on real business financing challenges and objective solution analysis.

FSG TRUSTY FINANCE CONTENT REQUIREMENTS: 
1. FINANCIAL ADVISORY TITLES - Examples of appropriate FSG titles:
   ✅ "Working Capital Shortage Reality Check"
   ✅ "Growth Capital Options Beyond Banks"  
   ✅ "Invoice Financing vs Bank Overdraft Analysis"
   ✅ "When Alternative Lending Makes Sense"
   ✅ "SME Loan Rejection Recovery Strategies"
   ❌ "Ultimate Guide to Business Finance"
   ❌ "5 Secret Funding Sources"
   ❌ "Revolutionary Finance Solutions"

2. FSG GENERATION PROMPTS must include:
   - Empathetic business challenge opening
   - External CFO analytical voice
   - Impartial comparison of financing options
   - Specific market data and credible sources
   - Honest pros/cons without bias toward any solution
   - Practical decision-making framework
   - Value-driven, non-intrusive conclusions
   - Target business segment specification
   
3. FINANCIAL KEYWORDS: Focus on professional finance terms:
   - "working capital", "cash flow management", "SME financing"
   - "growth capital", "bridge financing", "asset-based lending"  
   - "due diligence", "capital structure", "financing solutions"
   - Target audience: "business leaders", "CFOs", "SME owners", "decision-makers"
`

    // Define schema for the response
    const responseSchema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          topic: { type: Type.STRING },
          keywords: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          contentTypeId: { type: Type.STRING },
          targetPersonaIds: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          generationPrompt: { type: Type.STRING },
          suggestedLength: { type: Type.INTEGER }
        },
        required: ['title', 'topic', 'keywords', 'contentTypeId', 'targetPersonaIds', 'generationPrompt']
      }
    }

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 64000,
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        thinkingConfig: {
          thinkingBudget: 4096
        }
      }
    })
    
    // Access the text property directly (it's a getter)
    const responseText = result.text
    
    if (!responseText) {
      console.error('Empty response from AI. Full result:', JSON.stringify(result, null, 2))
      throw new Error('Empty response from AI')
    }
    
    // Parse the JSON response directly (should be valid JSON due to schema)
    const contentPlans = JSON.parse(responseText)
    
    // Helper function to validate UUID
    const isValidUUID = (uuid: string) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      return uuidRegex.test(uuid)
    }
    
    // Get valid content type and persona IDs
    const validContentTypeIds = contentTypes?.map(ct => ct.id) || []
    const validPersonaIds = personas?.map(p => p.id) || []
    
    // Validate and fix content plans
    const validatedPlans = contentPlans.map((plan: any) => {
      // Validate content type ID
      let contentTypeId = plan.contentTypeId
      if (!isValidUUID(contentTypeId) || !validContentTypeIds.includes(contentTypeId)) {
        console.warn(`Invalid content type ID: ${contentTypeId}, using first available`)
        contentTypeId = validContentTypeIds[0]
      }
      
      // Validate persona IDs
      let targetPersonaIds = plan.targetPersonaIds || []
      targetPersonaIds = targetPersonaIds.filter((id: string) => 
        isValidUUID(id) && validPersonaIds.includes(id)
      )
      if (targetPersonaIds.length === 0) {
        console.warn(`No valid persona IDs, using first available`)
        targetPersonaIds = [validPersonaIds[0]]
      }
      
      return {
        ...plan,
        contentTypeId,
        targetPersonaIds
      }
    })
    
    // Distribute plans across available dates and time slots
    let planIndex = 0
    const calendarEntries = []

    for (const date of availableDates) {
      for (const timeSlot of timeSlots) {
        for (const language of languages) {
          if (planIndex < validatedPlans.length) {
            const plan = validatedPlans[planIndex]
            
            calendarEntries.push({
              date: format(date, 'yyyy-MM-dd'),
              time_slot: `${timeSlot}:00`,
              topic: plan.topic,
              planned_title: plan.title,
              generation_prompt: plan.generationPrompt,
              keywords: plan.keywords,
              content_type: 'blog', // Always use 'blog' since the check constraint only allows specific values
              content_type_id: plan.contentTypeId,
              persona_id: plan.targetPersonaIds[0] || null, // Primary persona
              multiple_persona_ids: plan.targetPersonaIds.filter((id: string | null) => id !== null),
              languages: [language],
              locale: language,
              status: 'planned',
              created_by: user.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            
            planIndex++
          }
        }
      }
    }

    // Log the first entry to debug
    console.log('Sample calendar entry:', JSON.stringify(calendarEntries[0], null, 2))
    console.log('User ID:', user.id)
    console.log('Total entries to insert:', calendarEntries.length)
    
    // Insert all calendar entries using service role
    const { data: insertedEntries, error: insertError } = await supabaseAdmin
      .from('content_calendar')
      .insert(calendarEntries)
      .select()

    if (insertError) {
      console.error('Error inserting calendar entries:', insertError)
      throw insertError
    }

    console.log('✅ Successfully created content plans:', insertedEntries?.length || 0)

    // If autoGenerate is enabled, trigger Inngest workflows for immediate content generation
    if (autoGenerate && insertedEntries && insertedEntries.length > 0) {
      console.log('🚀 Triggering auto-generation for created plans...')
      
      try {
        // Trigger bulk content generation
        await inngest.send({
          name: 'ai/content.generate.bulk',
          data: {
            userId: user.id,
            plans: insertedEntries.map(entry => ({
              planId: entry.id,
              title: entry.planned_title || entry.topic,
              prompt: entry.generation_prompt,
              contentType: contentTypes?.find(ct => ct.id === entry.content_type_id) || { name: entry.content_type },
              personaIds: entry.multiple_persona_ids || [entry.persona_id],
              languages: entry.languages || [entry.locale],
              keywords: entry.keywords || [],
              topics: [entry.topic],
              scheduledDate: entry.date,
              scheduledTime: entry.time_slot,
              makeItMine: '',
              generateImage: false,
              imagePrompt: ''
            }))
          }
        })
        
        console.log('✅ Auto-generation triggered successfully')
      } catch (inngestError) {
        console.error('❌ Error triggering auto-generation:', inngestError)
        // Don't fail the entire request if Inngest fails
      }
    }

    return NextResponse.json({
      success: true,
      plansCreated: insertedEntries?.length || 0,
      autoGenerationTriggered: autoGenerate,
      message: `Successfully created ${insertedEntries?.length || 0} content plans${autoGenerate ? ' and triggered auto-generation' : ''}`
    })

  } catch (error) {
    console.error('Error generating content plans:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate content plans' },
      { status: 500 }
    )
  }
}