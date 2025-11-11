import { NextResponse } from 'next/server'
import { GoogleGenAI, Type } from '@google/genai'

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_STUDIO_KEY! })
const MODEL = 'gemini-2.5-flash'

// Define the schema for translation response
const translationSchema = {
  type: Type.OBJECT,
  properties: {
    translations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          key: {
            type: Type.STRING,
            description: "The translation key",
          },
          value: {
            type: Type.STRING,
            description: "The translated text value",
          }
        },
        required: ["key", "value"]
      }
    }
  },
  required: ["translations"]
}

export async function POST(request: Request) {
  try {
    const { texts, targetLocale } = await request.json()
    
    if (!texts || !targetLocale) {
      return NextResponse.json(
        { error: 'Texts and target locale are required' },
        { status: 400 }
      )
    }

    console.log(`Starting translation of ${texts.length} texts to ${targetLocale} using ${MODEL}`)
    console.time('Translation completed in')

    // Generate translations
    const prompt = `Translate the following texts to ${targetLocale}. Each text is identified by a key.
Maintain any HTML tags, markdown formatting, or special characters exactly as they are.
Return a JSON array of objects with 'key' and 'value' properties, where 'value' contains the translation.

Input texts:
${JSON.stringify(texts, null, 2)}

Example response format:
{
  "translations": [
    { "key": "example.key1", "value": "translated text 1" },
    { "key": "example.key2", "value": "translated text 2" }
  ]
}

Return only the translations in the specified JSON format.`

    const result = await genAI.models.generateContent({
      model: MODEL,
      contents: [{ text: prompt }],
      config: {
        temperature: 0.3, // Lower temperature for more accurate translations
        maxOutputTokens: 32000,
        responseMimeType: "application/json",
        responseSchema: translationSchema,
      }
    })
    const responseText = result.text || ''
    const response = JSON.parse(responseText)

    console.log(`Successfully translated ${response.translations.length} texts`)
    console.timeEnd('Translation completed in')

    return NextResponse.json({ translations: response.translations })
  } catch (error) {
    console.error('Translation generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate translations' },
      { status: 500 }
    )
  }
} 