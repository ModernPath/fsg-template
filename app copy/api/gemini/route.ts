import { NextResponse } from 'next/server'
import { GoogleGenAI, Type } from '@google/genai'
import { createClient } from '@/utils/supabase/server'
import { brandInfo, getGeminiPrompt } from '@/lib/brand-info'
import { marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'
import { buildContentGenerationPrompt } from '@/lib/content-generation-prompt'

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
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // Convert line breaks to <br>
  pedantic: false // Don't be too strict
});

const API_KEY = process.env.GOOGLE_AI_STUDIO_KEY

if (!API_KEY) {
  throw new Error('GOOGLE_AI_STUDIO_KEY is not set')
}

const ai = new GoogleGenAI({ apiKey: API_KEY })

export async function POST(request: Request) {
  try {
    console.log('\n📝 [POST /api/gemini] Admin AI content generation request')

    // 1. Token Verification Layer
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid auth header')
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    console.log('🔑 Creating auth client...')
    // Create regular client to verify the token
    const authClient = await createClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser(authHeader.split(' ')[1])
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('✅ User authenticated:', user.id)

    // 2. Admin Role Verification Layer
    const { data: profile } = await authClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      console.error('❌ User is not admin:', user.id)
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    console.log('✅ Admin access verified for user:', user.id)

    const { 
      prompt, 
      modelName = 'gemini-2.5-flash', 
      temperature = 0.7, 
      maxTokens = 8192,
      json,
      schema 
    } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    console.log('🤖 Generating content with Gemini using structured output...')

    // Handle custom schema for different content types
    let responseSchema
    let structuredPrompt

    if (json === 'custom' && schema) {
      // Use custom schema (e.g., for product content)
      console.log('📋 Using custom schema for content generation')
      responseSchema = {
        type: Type.OBJECT,
        properties: {} as Record<string, any>,
        required: schema.required || []
      }

      // Convert the custom schema properties to Gemini Type format
      if (schema.properties) {
        for (const [key, value] of Object.entries(schema.properties)) {
          const prop = value as any
          if (prop.type === 'string') {
            responseSchema.properties[key] = { type: Type.STRING }
          } else if (prop.type === 'array' && prop.items?.type === 'string') {
            responseSchema.properties[key] = {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }

      structuredPrompt = prompt
    } else {
      // Default blog content schema
      console.log('📝 Using default blog content schema')
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: "A compelling, SEO-friendly title under 60 characters"
          },
          content: {
            type: Type.STRING,
            description: "The main blog post content in markdown format with proper headings, bullet points, and structure"
          },
          excerpt: {
            type: Type.STRING,
            description: "A compelling 2-3 sentence summary of the post"
          },
          meta_description: {
            type: Type.STRING,
            description: "SEO optimized description under 160 characters"
          },
          tags: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING
            },
            description: "3-5 relevant tags for the blog post"
          },
          image_prompt: {
            type: Type.STRING,
            description: "A detailed prompt for generating the featured image"
          },
          cta_text: {
            type: Type.STRING,
            description: "Call-to-action text that appears at the end of the article, encouraging reader engagement"
          },
          cta_button_text: {
            type: Type.STRING,
            description: "Text for the CTA button (e.g., 'Get Free Analysis', 'Learn More')"
          },
          cta_button_link: {
            type: Type.STRING,
            description: "URL for the CTA button linking to relevant services or contact page"
          },
          detectedLanguage: {
            type: Type.STRING,
            description: "The detected language code (en, fi, sv, etc.) based on the prompt"
          }
        },
        required: ["title", "content", "excerpt", "meta_description", "tags", "image_prompt", "cta_text", "cta_button_text", "cta_button_link", "detectedLanguage"]
      }

      // Use unified FSG Trusty Finance content generation prompt
      console.log('🔨 Building unified FSG Trusty Finance prompt for blog content...')
      
      // Auto-detect language from prompt
      const detectedLanguage = prompt.includes('ä') || prompt.includes('ö') || prompt.includes('å') ? 
        (prompt.includes('ø') ? 'sv' : 'fi') : 'en'
      
      // Build comprehensive prompt configuration
      const promptConfig = {
        prompt: `Generate a comprehensive blog post based on this topic: "${prompt}"`,
        language: detectedLanguage,
        keywords: [], // Could be extracted from prompt in future
        brand: {
          name: brandInfo.name,
          description: brandInfo.description,
          voice: 'Professional financial advisor - analytical, empathetic, independent',
          personality_primary: brandInfo.personality?.primary || [],
          writing_style: brandInfo.writingStyle || [],
          common_phrases: brandInfo.commonPhrases || [],
          avoid_phrases: brandInfo.avoidPhrases || []
        },
        contentType: {
          name: 'Blog Article',
          description: 'Comprehensive blog post with FSG Trusty Finance analytical approach',
          typical_length_min: 800,
          typical_length_max: 1500,
          tone_formal: 7,
          tone_friendly: 6,
          tone_technical: 8,
          tone_innovative: 5
        },
        outputFormat: 'blog' as const,
        includeImagePrompt: true
      }
      
      // Generate unified prompt with FSG Trusty Finance guidelines
      const unifiedPrompt = buildContentGenerationPrompt(promptConfig)
      
      // Add language detection requirement to the end
      const finalPrompt = unifiedPrompt + `\n\nADDITIONAL REQUIREMENT: Include a "detectedLanguage" field with the language code (en, fi, sv, etc.) based on the original prompt language.`
      
      structuredPrompt = finalPrompt
    }

    // Generate content with structured JSON output using the new API
    const response = await ai.models.generateContent({
      model: modelName,
      contents: structuredPrompt,
      config: {
        temperature,
        maxOutputTokens: maxTokens,
        responseMimeType: 'application/json',
        responseSchema: responseSchema
      }
    })

    console.log('📄 Raw response received')

    try {
      // Parse the structured JSON response
      const text = response.text
      if (!text) {
        throw new Error('Empty response from Gemini API')
      }
      
      const parsedContent = JSON.parse(text)
      
      if (json === 'custom') {
        // Return custom content as-is for product generation
        console.log('✅ Custom content generated successfully')
        return NextResponse.json(parsedContent)
      } else {
        // Process blog content (existing logic)
        // Convert markdown content to HTML
        const htmlContent = marked(parsedContent.content || '')
        
        // Generate slug from title
        const slug = parsedContent.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
        
        // Validate and clean the response
        const cleanedContent = {
          title: typeof parsedContent.title === 'string' ? parsedContent.title.trim() : '',
          content: typeof htmlContent === 'string' ? htmlContent.trim() : '',
          excerpt: typeof parsedContent.excerpt === 'string' ? parsedContent.excerpt.trim() : '',
          meta_description: typeof parsedContent.meta_description === 'string' ? 
            parsedContent.meta_description.substring(0, 160).trim() : '',
          tags: Array.isArray(parsedContent.tags) ? 
            parsedContent.tags.filter((tag: unknown) => typeof tag === 'string').slice(0, 5) : [],
          image_prompt: typeof parsedContent.image_prompt === 'string' ? 
            parsedContent.image_prompt.trim() : '',
          detectedLanguage: typeof parsedContent.detectedLanguage === 'string' ? 
            parsedContent.detectedLanguage.trim() : 'en',
          slug
        }

        console.log('✅ Content generated successfully with structured output')
        return NextResponse.json(cleanedContent)
      }
    } catch (error) {
      console.error('Failed to parse structured JSON response:', error)
      console.error('Raw text:', response.text || 'No response text')
      // Fallback response if parsing fails
      return NextResponse.json({ 
        title: 'Generated Content',
        content: response.text || 'No content generated',
        excerpt: '',
        meta_description: '',
        tags: [],
        image_prompt: '',
        detectedLanguage: 'en',
        slug: 'generated-content'
      })
    }
  } catch (error: Error | unknown) {
    console.error('❌ Gemini API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate content'
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error' },
      { status: 500 }
    )
  }
} 