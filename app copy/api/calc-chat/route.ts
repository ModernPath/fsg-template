import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { brandInfo } from '@/lib/brand-info'

const API_KEY = process.env.GOOGLE_AI_STUDIO_KEY || process.env.GEMINI_API_KEY

export async function POST(request: Request) {
  try {
    const { message, context, history } = await request.json()

    // Basic validation
    if (typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Trusty Finance brand-guided system prompt (Finnish)
    const toneGuide = `formal ${brandInfo.tone.formal}/10, friendly ${brandInfo.tone.friendly}/10, technical ${brandInfo.tone.technical}/10, innovative ${brandInfo.tone.innovative}/10`
    const avoid = brandInfo.avoidPhrases.join(', ')
    const style = brandInfo.writingStyle.join('\n- ')
    const sys = `Roolisi: ${brandInfo.name}n rahoitusasiantuntija (suomi).\n`+
      `Sävy: ${toneGuide}. Vältä fraaseja: ${avoid}.\n`+
      `Kirjoitustyyli:\n- ${style}\n`+
      `Tehtävä: selitä laskurin tulokset (käytä kontekstin numeroita), mitä ne tarkoittavat ja seuraavat askeleet. `+
      `Jos tieto puuttuu, kysy tarkentava jatkokysymys. Vastaa napakasti ja konkreettisesti.`

    // Build filtered context: include only user-adjusted keys when provided
    const rawCtx: any = context || {}
    const inputs = (rawCtx.inputs || {}) as Record<string, any>
    const adjustedKeys = Array.isArray(rawCtx.adjustedKeys) ? rawCtx.adjustedKeys as string[] : []
    const filteredInputs = adjustedKeys.length
      ? Object.fromEntries(Object.entries(inputs).filter(([k]) => adjustedKeys.includes(k)))
      : {}
    const ctxObj = { ...rawCtx, inputs: filteredInputs }
    const ctx = JSON.stringify(ctxObj)
    const turns = Array.isArray(history) ? history.slice(-10) : []
    const turnsText = turns
      .map((t: any) => `${t.role === 'user' ? 'User' : 'Assistant'}: ${String(t.content || '').trim()}`)
      .join('\n')

    const finalPrompt = `${sys}\n\nKonteksti (vain asiakkaan säätämät rajat): ${ctx}\n\nKeskustelu tähän asti:\n${turnsText}\n\nAsiakas: ${message}\nAsiantuntija:`

    if (!API_KEY) {
      // Fallback without external API
      const local = buildLocalAnswer(message, context)
      return NextResponse.json({ text: local })
    }

    const genAI = new GoogleGenAI({ apiKey: API_KEY! })
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: finalPrompt,
      config: {
        temperature: 0.5,
        maxOutputTokens: 1024,
      },
    })

    const text = response.text || 'En saanut vastausta juuri nyt.'
    return NextResponse.json({ text })
  } catch (error) {
    console.error('calc-chat error:', error)
    const fallback = 'Tekninen virhe. Voit säätää liukuja ja kysyä uudelleen tarkentavan kysymyksen.'
    return NextResponse.json({ text: fallback })
  }
}

function buildLocalAnswer(message: string, context?: any): string {
  const c = context || {}
  const r = c.result || {}
  const type = (c.calculatorType as string) || 'general_financing'
  let base = ''
  if (type === 'business_loan' && (r.annuity || r.monthlyInterest)) {
    base = `Lainan arvio: kuukausierä ~ ${fmt(r.annuity)} €, kuukausikorko ~ ${fmt(r.monthlyInterest)} €.`
  } else if (type === 'leasing' && (r.monthly || r.downPayment)) {
    base = `Leasing: käsiraha ~ ${fmt(r.downPayment)} €, rahoitettava ~ ${fmt(r.financed)} €, kuukausierä ~ ${fmt(r.monthly)} €.`
  } else if (type === 'credit_line' && (r.used || r.monthlyInterest)) {
    base = `Limiitti: käytössä ~ ${fmt(r.used)} €, kuukausikorko ~ ${fmt(r.monthlyInterest)} €.`
  } else if (type === 'factoring' && (r.advance || r.fees)) {
    base = `Factoring: ennakko ~ ${fmt(r.advance)} €, kulut ~ ${fmt(r.fees)} € / kk.`
  } else if (r.estimate) {
    base = `Arvioitu rahoitustarve ~ ${fmt(r.estimate)} €.`
  }
  return `${base} Kysy halutessasi vaikutuksesta, esim. korkoon tai kestoon.`
}

function fmt(n: any) {
  if (n == null) return '-'
  try { return Number(n).toLocaleString('fi-FI') } catch { return String(n) }
}


