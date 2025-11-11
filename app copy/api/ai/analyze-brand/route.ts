import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenAI } from '@google/genai'

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

const API_KEY = process.env.GOOGLE_AI_STUDIO_KEY || process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error('Error: Neither GOOGLE_AI_STUDIO_KEY nor GEMINI_API_KEY environment variable is set');
}

const genAI = new GoogleGenAI({ apiKey: API_KEY! });

export async function POST(request: Request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    const supabase = supabaseAdmin;
    
    // Verify the user with the token
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Check if API key exists
    if (!API_KEY) {
      return NextResponse.json(
        { error: 'API key not configured. Please set GOOGLE_AI_STUDIO_KEY or GEMINI_API_KEY environment variable.' },
        { status: 500 }
      );
    }

    const prompt = `
    Analyze the website at ${url} and extract brand information. Return a JSON object with the following structure:

    {
      "description": "Brief description of the brand/company",
      "tone_formal": 5,
      "tone_friendly": 5,
      "tone_technical": 5,
      "tone_innovative": 5,
      "personality_primary": ["trait1", "trait2"],
      "personality_secondary": ["trait3", "trait4"],
      "personality_avoid": ["trait5", "trait6"],
      "writing_style": ["style1", "style2"],
      "common_phrases": ["phrase1", "phrase2"],
      "avoid_phrases": ["phrase3", "phrase4"],
      "services": ["service1", "service2"],
      "solutions": ["solution1", "solution2"]
    }

    Please analyze the tone (scale 1-10), personality traits, writing style, and services/solutions based on the website content.
    `;

    // Use Gemini to analyze the website
    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ text: prompt }]
    });

    const text = result.text || '';
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract brand information');
    }

    const brandData = JSON.parse(jsonMatch[0]);

    // Validate and sanitize the data
    const sanitizedData = {
      description: brandData.description || '',
      tone_formal: Math.min(10, Math.max(0, brandData.tone_formal || 5)),
      tone_friendly: Math.min(10, Math.max(0, brandData.tone_friendly || 5)),
      tone_technical: Math.min(10, Math.max(0, brandData.tone_technical || 5)),
      tone_innovative: Math.min(10, Math.max(0, brandData.tone_innovative || 5)),
      personality_primary: Array.isArray(brandData.personality_primary) ? brandData.personality_primary.slice(0, 5) : [],
      personality_secondary: Array.isArray(brandData.personality_secondary) ? brandData.personality_secondary.slice(0, 5) : [],
      personality_avoid: Array.isArray(brandData.personality_avoid) ? brandData.personality_avoid.slice(0, 5) : [],
      writing_style: Array.isArray(brandData.writing_style) ? brandData.writing_style.slice(0, 7) : [],
      common_phrases: Array.isArray(brandData.common_phrases) ? brandData.common_phrases.slice(0, 10) : [],
      avoid_phrases: Array.isArray(brandData.avoid_phrases) ? brandData.avoid_phrases.slice(0, 10) : [],
      services: Array.isArray(brandData.services) ? brandData.services.slice(0, 10) : [],
      solutions: Array.isArray(brandData.solutions) ? brandData.solutions.slice(0, 10) : [],
    };

    return NextResponse.json(sanitizedData);
  } catch (error) {
    console.error('Error analyzing brand:', error);
    return NextResponse.json(
      { error: 'Failed to analyze brand' },
      { status: 500 }
    );
  }
}