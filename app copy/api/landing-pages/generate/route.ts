import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { buildContentGenerationPrompt } from '@/lib/content-generation-prompt'

export async function POST(request: Request) {
  try {
    // Get authorization token from request headers
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    // Create regular client to verify the token
    const authClient = await createClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser(authHeader.split(' ')[1])
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile } = await authClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const { prompt } = await request.json()

    // Initialize Gemini API client
    const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_STUDIO_KEY! })

    // Use unified FSG Trusty Finance landing page generation
    console.log('🔨 Building FSG Trusty Finance landing page prompt...')
    
    const landingPageConfig = {
      prompt: `Create a professional landing page for FSG Trusty Finance based on this request: ${prompt}`,
      language: 'en',
      brand: {
        name: 'FSG Trusty Finance',
        description: 'Independent financial partner for businesses',
        mission: 'Empower business decision-makers to understand financing market opportunities through clear, objective guidance',
        voice: 'Professional financial advisor - analytical, empathetic, independent',
        values: ['Independence', 'Transparency', 'Expertise', 'Client-first approach']
      },
      contentType: {
        name: 'Landing Page',
        description: 'Professional landing page for financial advisory services',
        tone_formal: 7,
        tone_friendly: 6,
        tone_technical: 6,
        tone_innovative: 4
      },
      outputFormat: 'landing-page' as const,
      includeImagePrompt: true
    }
    
    const unifiedPrompt = buildContentGenerationPrompt(landingPageConfig)
    
    // Generate content
    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: [{
        text: unifiedPrompt
      }]
    })

    const text = result.text || ''
    
    // Clean up the response text by removing any potential formatting
    const cleanText = text.replace(/```json\n|\n```|```/g, '').trim()
    
    try {
      const data = JSON.parse(cleanText)
      return NextResponse.json(data)
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError, 'Raw text:', cleanText)
      return NextResponse.json(
        { error: 'Failed to parse generated content. Please try again.' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error generating landing page content:', error)
    return NextResponse.json(
      { error: 'Failed to generate content. Please try again.' },
      { status: 500 }
    )
  }
} 