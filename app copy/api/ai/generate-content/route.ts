import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenAI, Type } from '@google/genai'
import { marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'
import { buildContentGenerationPrompt, getOutputFormat, normalizeContentType } from '@/lib/content-generation-prompt'

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

// Configure marked with syntax highlighting
marked.use(markedHighlight({
  langPrefix: 'hljs language-',
  highlight(code: string, lang: string) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  }
}));

// Set marked options
marked.setOptions({
  gfm: true,
  breaks: true,
  pedantic: false
});

const API_KEY = process.env.GOOGLE_AI_STUDIO_KEY

if (!API_KEY) {
  throw new Error('GOOGLE_AI_STUDIO_KEY is not set')
}

const ai = new GoogleGenAI({ apiKey: API_KEY })

export async function POST(request: NextRequest) {
  try {
    // Check authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    // Verify the token using auth client
    const { data: { user }, error: authError } = await authClient.auth.getUser(authHeader.split(' ')[1])
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      prompt, 
      personaId, 
      contentTypeId, 
      language = 'en',
      keywords = [],
      targetAudience,
      contentType,
      temperature = 0.8,
      maxTokens = 8192
    } = body
    
    // Use consistent naming (locale for our prompt builder)
    const locale = language

    // 2. Admin verification
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      console.error('❌ User is not admin:', user.id)
      return NextResponse.json(
        { error: 'Forbidden - Admin access required', code: 'ADMIN_REQUIRED' },
        { status: 403 }
      )
    }

    if (!personaId || !prompt) {
      console.error('❌ Missing required parameters:', { personaId: !!personaId, prompt: !!prompt })
      return NextResponse.json(
        { error: 'Persona ID and prompt are required', code: 'PARAMS_MISSING' },
        { status: 400 }
      )
    }

    // 3. Fetch persona details
    const { data: persona, error: personaError } = await supabaseAdmin
      .from('ai_personas')
      .select('*')
      .eq('id', personaId)
      .eq('active', true)
      .single()

    if (personaError || !persona) {
      console.error('❌ Persona not found:', { personaId, error: personaError })
      return NextResponse.json(
        { error: 'Persona not found or inactive', code: 'PERSONA_NOT_FOUND' },
        { status: 404 }
      )
    }

    console.log('🎭 Using persona:', persona.name)

    // 4. Build the content generation prompt using unified prompt builder
    console.log('🔨 Building unified content generation prompt...')
    
    // Determine output format
    const outputFormat = getOutputFormat(contentTypeId, contentType)
    
    // Build comprehensive prompt configuration
    const promptConfig = {
      prompt,
      language: locale,
      keywords,
      targetAudience,
      contentType: normalizeContentType(contentType), 
      personas: [{
        id: persona.id,
        name: persona.name,
        description: persona.description,
        system_prompt: persona.system_prompt,
        personality_traits: persona.personality_traits,
        topics: persona.topics
      }],
      outputFormat,
      includeImagePrompt: true
    }
    
    // Generate the unified prompt
    const contentPrompt = buildContentGenerationPrompt(promptConfig)
    
    // Define response schema based on output format
    let responseSchema
    
    if (outputFormat === 'blog') {
                  responseSchema = {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "A compelling, SEO-friendly title under 60 characters" },
                content: { type: Type.STRING, description: "The main blog post content in markdown format" },
                excerpt: { type: Type.STRING, description: "A compelling 2-3 sentence summary" },
                meta_description: { type: Type.STRING, description: "SEO optimized description under 160 characters" },
                tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-5 relevant tags" },
                slug: { type: Type.STRING, description: "URL-friendly slug" },
                image_prompt: { type: Type.STRING, description: "A detailed prompt for generating the featured image" },
                cta_text: { type: Type.STRING, description: "Call-to-action text that appears at the end of the article, encouraging reader engagement" },
                cta_button_text: { type: Type.STRING, description: "Text for the CTA button (e.g., 'Get Free Analysis', 'Learn More')" },
                cta_button_link: { type: Type.STRING, description: "URL for the CTA button linking to relevant services or contact page" }
              },
              required: ["title", "content", "excerpt", "meta_description", "tags", "slug", "image_prompt", "cta_text", "cta_button_text", "cta_button_link"]
            }
    } else if (outputFormat === 'social') {
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          posts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                platform: { type: Type.STRING },
                content: { type: Type.STRING },
                hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          }
        },
        required: ["posts"]
      }
    } else if (outputFormat === 'email') {
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          subject: { type: Type.STRING },
          preheader: { type: Type.STRING }, 
          content: { type: Type.STRING },
          cta: { type: Type.STRING }
        },
        required: ["subject", "preheader", "content", "cta"]
      }
    }

    // 5. Generate content with Gemini with retry logic
    console.log('🤖 Generating content with Gemini...')
    
    let attempts = 0
    const maxAttempts = 3
    let lastError: Error | null = null

    while (attempts < maxAttempts) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: contentPrompt,
          config: {
            temperature,
            maxOutputTokens: maxTokens,
            responseMimeType: 'application/json',
            responseSchema: responseSchema
          }
        })

        const text = response.text
        if (!text) {
          throw new Error('Empty response from Gemini API')
        }

        const generatedContent = JSON.parse(text)

        // 6. Process content based on type
        let processedContent
        
        if (contentTypeId === 'blog') {
          // Convert markdown to HTML for blog posts
          const htmlContent = marked(generatedContent.content || '')
          
          // Generate slug from title
          const slug = generatedContent.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')

          processedContent = {
            ...generatedContent,
            content: htmlContent,
            slug,
            personaId,
            generationPrompt: prompt,
            autoGenerated: true,
            locale
          }
        } else {
          processedContent = {
            ...generatedContent,
            personaId,
            generationPrompt: prompt,
            contentType,
            locale
          }
        }
        
        console.log('✅ Content generated successfully with persona:', persona.name)
        
        return NextResponse.json({
          success: true,
          content: processedContent,
          persona: {
            id: persona.id,
            name: persona.name,
            description: persona.description
          }
        })
        
      } catch (error) {
        attempts++
        lastError = error as Error
        console.error(`❌ Generation attempt ${attempts} failed:`, error)
        
        if (attempts < maxAttempts) {
          console.log(`🔄 Retrying in ${attempts * 1000}ms...`)
          await new Promise(resolve => setTimeout(resolve, attempts * 1000))
        }
      }
    }

    // All attempts failed
    console.error('❌ All generation attempts failed:', lastError)
    return NextResponse.json(
      { 
        error: 'Content generation failed after multiple attempts', 
        code: 'GENERATION_FAILED',
        details: process.env.NODE_ENV === 'development' ? lastError?.message : undefined
      },
      { status: 500 }
    )

  } catch (error: Error | unknown) {
    console.error('❌ Content generation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate content'
    return NextResponse.json(
      { 
        error: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}