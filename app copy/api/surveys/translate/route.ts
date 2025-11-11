import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { GoogleGenAI } from '@google/genai'

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_STUDIO_KEY! })

/**
 * POST /api/surveys/translate
 * Translate survey content using AI
 */
export async function POST(request: NextRequest) {
  try {
    console.log('\n🌐 [POST /api/surveys/translate]')

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

    // Parse request body
    const {
      templateId,
      sourceLanguage,
      targetLanguages,
      questions,
      name,
      description
    } = await request.json()

    console.log('🔄 Translating survey:', {
      templateId,
      sourceLanguage,
      targetLanguages,
      hasQuestions: !!questions,
      hasName: !!name
    })

    // Language mapping
    const languageNames = {
      'fi': 'Finnish',
      'en': 'English',
      'sv': 'Swedish'
    }

    const translations: Record<string, any> = {}

    // Translate to each target language
    for (const targetLang of targetLanguages) {
      console.log(`🌐 Translating from ${sourceLanguage} to ${targetLang}`)

      const prompt = `You are a professional translator specializing in survey and questionnaire translation for a Finnish fintech company called TrustyFinance.

TRANSLATION TASK:
- Source language: ${languageNames[sourceLanguage] || sourceLanguage}
- Target language: ${languageNames[targetLang] || targetLang}
- Content type: Customer satisfaction survey

CONTEXT:
TrustyFinance is a Finnish fintech platform that:
- Provides AI-powered financial analysis for businesses
- Connects businesses with suitable lenders
- Offers funding recommendations and application services
- Serves primarily Finnish, Swedish, and English speaking markets

TRANSLATION REQUIREMENTS:
1. Maintain professional, business-appropriate tone
2. Adapt content to target market cultural norms
3. Keep brand name "TrustyFinance" unchanged
4. Ensure technical financial terms are accurately translated
5. Preserve the structure and meaning of questions
6. Use natural, conversational language appropriate for surveys
7. Maintain consistency in terminology throughout

CONTENT TO TRANSLATE:

Survey Name: "${name}"
Survey Description: "${description}"

Questions Structure:
${JSON.stringify(questions, null, 2)}

Please translate the survey name, description, and all question content (including question text, options, labels, placeholders, etc.) while preserving the JSON structure exactly.

Return the translation in this exact JSON format:
{
  "name": "translated survey name",
  "description": "translated survey description", 
  "questions": {translated questions structure with same format but translated text}
}

Ensure all text content is translated while keeping the structure identical.`

      try {
        const result = await genAI.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            temperature: 0.3,
            maxOutputTokens: 8192,
          }
        })
        const translatedText = result.text
        
        // Parse the JSON response
        const jsonMatch = translatedText.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          throw new Error('AI did not return valid JSON')
        }

        const translatedContent = JSON.parse(jsonMatch[0])
        translations[targetLang] = translatedContent

        console.log(`✅ Translation completed for ${targetLang}`)

      } catch (error) {
        console.error(`❌ Translation failed for ${targetLang}:`, error)
        translations[targetLang] = {
          error: `Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }
    }

    // Save translations to database
    const supabase = await createClient(undefined, true)
    
    // Update the survey template with translations
    const { error: updateError } = await supabase
      .from('survey_templates')
      .update({
        translations: translations,
        updated_at: new Date().toISOString()
      })
      .eq('id', templateId)

    if (updateError) {
      console.error('❌ Error saving translations:', updateError)
      return NextResponse.json(
        { error: 'Käännösten tallennus epäonnistui' },
        { status: 500 }
      )
    }

    console.log('✅ Translations saved successfully')

    return NextResponse.json({
      success: true,
      translations,
      message: `Kysely käännetty ${targetLanguages.length} kielelle`
    })

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json(
      { error: 'Sisäinen palvelinvirhe' },
      { status: 500 }
    )
  }
}
