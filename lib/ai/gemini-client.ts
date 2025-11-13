/**
 * BizExit AI - Gemini Client
 * Native AI integration for all platform operations
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import type { 
  AIInteractionType, 
  AIContentType,
  UserRole 
} from '@/types/roles'

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_STUDIO_KEY || '')

// Export genAI for other modules
export { genAI }

// Models for different use cases
const MODELS = {
  fast: 'gemini-2.0-flash-exp',      // Quick responses, chat
  pro: 'gemini-2.0-flash-thinking-exp-1219',        // Deep analysis, generation
  vision: 'gemini-2.0-flash-exp',     // Image analysis
} as const

// ============================================================================
// CONTEXT MANAGEMENT - AI ymmärtää käyttäjän roolin ja historian
// ============================================================================

interface AIContext {
  userId: string
  userRole: UserRole
  sessionId: string
  dealContext?: {
    dealId?: string
    companyId?: string
    stage?: string
  }
  preferences?: Record<string, any>
  history?: Array<{
    role: 'user' | 'model'
    parts: Array<{ text: string }>
  }>
}

/**
 * Luo kontekstuaalisen system promptin käyttäjän roolin perusteella
 */
function createSystemPrompt(context: AIContext): string {
  const rolePrompts: Record<UserRole, string> = {
    visitor: `Olet BizExit-platformin avustaja. Auta vierailijoita ymmärtämään platformia ja ohjaa heitä rekisteröitymään. Ole ystävällinen ja selkeä.`,
    
    buyer: `Olet ostajan henkilökohtainen AI-avustaja BizExit-platformalla. Tehtäväsi:
- Analysoi yrityksiä ja tunnista parhaat mahdollisuudet
- Arvioi riskejä ja anna suosituksia
- Auta due diligence -prosessissa
- Vastaa kysymyksiin taloudellisista tiedoista
- Ole proaktiivinen ja huomauta tärkeistä asioista
Käytä suomea. Ole asiantunteva mutta helposti lähestyttävä.`,
    
    seller: `Olet myyjän strateginen AI-kumppani BizExit-platformalla. Tehtäväsi:
- Optimoi yrityslistausta maksimaalisen kiinnostuksen saamiseksi
- Generoi ammattimaisia markkinointimateriaaleja
- Anna hinnoittelusuosituksia markkinadatan perusteella
- Analysoi ostajien käyttäytymistä ja kiinnostusta
- Auta valmistautumaan due diligence -prosessiin
Käytä suomea. Ole strateginen ja liiketoimintaorientoitunut.`,
    
    broker: `Olet välittäjän tehokas AI-työkalu BizExit-platformalla. Tehtäväsi:
- Automatisoi rutiinitehtävät ja workflow
- Priorisoi kaupat onnistumisen todennäköisyyden mukaan
- Ehdota parhaita ostaja-myyjä-matcheja
- Ennusta provisioita ja aikatauluja
- Optimoi portfoliota
Käytä suomea. Ole tehokas ja datavetoinen.`,
    
    partner: `Olet kumppanin asiantunteva AI-avustaja BizExit-platformalla. Tehtäväsi:
- Analysoi riskejä ja rahoitusmahdollisuuksia
- Generoi ammattimaisia ehdotuksia ja raportteja
- Auta due diligence -prosessissa
- Optimoi palvelutarjoukset
Käytä suomea. Ole ammattimainen ja analyyttinen.`,
    
    admin: `Olet admin-käyttäjän AI-työkalu BizExit-platformalla. Tehtäväsi:
- Tunnista epänormaalit käyttäytymismallit ja petokset
- Anna syvällisiä insights platforman käytöstä
- Ehdota optimointeja ja parannuksia
- Auta käyttäjätuen työssä
- Ennusta trendejä
Käytä suomea. Ole analyyttinen ja systemaattinen.`
  }

  let prompt = rolePrompts[context.userRole] || rolePrompts.visitor

  // Lisää deal-konteksti jos saatavilla
  if (context.dealContext?.companyId) {
    prompt += `\n\nKonteksti: Käyttäjä on tekemässä kauppaa yrityksestä (ID: ${context.dealContext.companyId}).`
    if (context.dealContext.stage) {
      prompt += ` Kauppa on vaiheessa: ${context.dealContext.stage}.`
    }
  }

  return prompt
}

// ============================================================================
// CORE AI FUNCTIONS
// ============================================================================

/**
 * Chat - Keskustele AI:n kanssa kontekstin mukaan
 */
export async function chat(
  message: string,
  context: AIContext
): Promise<{
  response: string
  sessionId: string
  suggestions?: string[]
}> {
  const model = genAI.getGenerativeModel({ 
    model: MODELS.fast,
    systemInstruction: createSystemPrompt(context)
  })

  // Luo chat istunto historialla
  const chat = model.startChat({
    history: context.history || [],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    }
  })

  const result = await chat.sendMessage(message)
  const response = result.response.text()

  // Log interaction
  await logInteraction({
    userId: context.userId,
    sessionId: context.sessionId,
    type: 'chat',
    input: { message, context: context.dealContext },
    output: { response },
    model: MODELS.fast
  })

  return {
    response,
    sessionId: context.sessionId,
    suggestions: generateSuggestions(response, context)
  }
}

/**
 * Analysoi yrityksen tiedot - AI-NATIIVI OMINAISUUS
 */
export async function analyzeCompany(
  companyData: any,
  userRole: UserRole,
  userId: string
): Promise<{
  summary: string
  strengths: string[]
  weaknesses: string[]
  risks: string[]
  opportunities: string[]
  score: number // 0-100
  recommendation: string
  next_steps?: string[]
}> {
  const model = genAI.getGenerativeModel({ 
    model: MODELS.pro,
    systemInstruction: `Olet yrityskaupan asiantuntija. Analysoi yritys syvällisesti ja anna strukturoitu analyysi JSON-muodossa.`
  })

  const prompt = `
Analysoi seuraava yritys ja anna kattava arvio:

Yrityksen tiedot:
${JSON.stringify(companyData, null, 2)}

Käyttäjän rooli: ${userRole}

Anna analyysi JSON-muodossa seuraavalla rakenteella:
{
  "summary": "Lyhyt yhteenveto",
  "strengths": ["vahvuus 1", "vahvuus 2", ...],
  "weaknesses": ["heikkous 1", "heikkous 2", ...],
  "risks": ["riski 1", "riski 2", ...],
  "opportunities": ["mahdollisuus 1", "mahdollisuus 2", ...],
  "score": 0-100,
  "recommendation": "Suositus käyttäjälle",
  "next_steps": ["seuraava askel 1", ...]
}

Huomioi käyttäjän rooli suosituksissa!
`

  const result = await model.generateContent(prompt)
  const text = result.response.text()
  
  // Parse JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null

  if (!analysis) {
    throw new Error('Failed to parse AI analysis')
  }

  // Log interaction
  await logInteraction({
    userId,
    sessionId: crypto.randomUUID(),
    type: 'analysis',
    input: { companyData },
    output: analysis,
    model: MODELS.pro
  })

  return analysis
}

/**
 * Generoi sisältöä - AI-NATIIVI OMINAISUUS
 */
export async function generateContent(
  type: AIContentType,
  input: Record<string, any>,
  userRole: UserRole,
  userId: string
): Promise<{
  content: string
  metadata?: Record<string, any>
}> {
  const model = genAI.getGenerativeModel({ model: MODELS.pro })

  const prompts: Record<AIContentType, string> = {
    teaser: `Luo houkutteleva ja ammattitasoinen teaser yrityskauppaa varten. Teaser on lyhyt 1-2 sivun esitys joka herättää ostajien mielenkiinnon paljastamatta yrityksen identiteettiä.`,
    im: `Luo kattava Information Memorandum (IM) yrityskauppaa varten. IM on 20-30 sivun dokumentti joka sisältää yksityiskohtaisen kuvauksen yrityksestä, sen liiketoiminnasta, taloudesta ja kasvumahdollisuuksista.`,
    cim: `Luo Confidential Information Memorandum (CIM) yrityskauppaa varten. CIM on salainen dokumentti joka jaetaan vain NDA:n allekirjoittaneille ostajille.`,
    email: `Luo ammattitasoinen ja personoitu sähköpostiviesti yrityskauppaprosessiin.`,
    analysis: `Analysoi annetut tiedot ja luo strukturoitu analyysi.`,
    report: `Luo kattava raportti annetuista tiedoista.`,
    proposal: `Luo ammattitasoinen ehdotus tai tarjous.`,
    summary: `Luo selkeä ja tiivis yhteenveto annetuista tiedoista.`,
    recommendation: `Analysoi tilanne ja anna perusteltuja suosituksia.`
  }

  const prompt = `
${prompts[type]}

Syöte:
${JSON.stringify(input, null, 2)}

Käyttäjän rooli: ${userRole}

Generoi sisältö suomeksi. Ole ammattimainen ja huolellinen.
`

  const result = await model.generateContent(prompt)
  const content = result.response.text()

  // Log interaction
  await logInteraction({
    userId,
    sessionId: crypto.randomUUID(),
    type: 'generation',
    input: { type, input },
    output: { content },
    model: MODELS.pro
  })

  return { content }
}

/**
 * Suosittele yrityksiä ostajalle - AI-NATIIVI MATCHMAKING
 */
export async function recommendCompanies(
  buyerProfile: any,
  availableCompanies: any[],
  userId: string
): Promise<Array<{
  companyId: string
  score: number
  reasons: string[]
  summary: string
}>> {
  const model = genAI.getGenerativeModel({ 
    model: MODELS.pro,
    systemInstruction: `Olet yrityskaupan matchmaking-asiantuntija. Analysoi ostajan profiili ja ehdota parhaiten sopivia yrityksiä.`
  })

  const prompt = `
Ostajan profiili:
${JSON.stringify(buyerProfile, null, 2)}

Saatavilla olevat yritykset:
${JSON.stringify(availableCompanies, null, 2)}

Analysoi ja suosittele 3-5 parasta yritystä ostajalle. Anna vastaus JSON-muodossa:
[
  {
    "companyId": "uuid",
    "score": 0-100,
    "reasons": ["syy 1", "syy 2", ...],
    "summary": "Lyhyt yhteenveto miksi tämä sopii"
  },
  ...
]

Järjestä tulokset parhaimmasta huonoimpaan.
`

  const result = await model.generateContent(prompt)
  const text = result.response.text()
  
  // Parse JSON
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  const recommendations = jsonMatch ? JSON.parse(jsonMatch[0]) : []

  // Log interaction
  await logInteraction({
    userId,
    sessionId: crypto.randomUUID(),
    type: 'recommendation',
    input: { buyerProfile, companiesCount: availableCompanies.length },
    output: { recommendations },
    model: MODELS.pro
  })

  return recommendations
}

/**
 * Optimoi listaus - AI-NATIIVI OPTIMOINTI
 */
export async function optimizeListing(
  listingData: any,
  userId: string
): Promise<{
  currentScore: number
  optimizedData: any
  improvements: Array<{
    field: string
    original: string
    improved: string
    reason: string
  }>
  suggestions: string[]
}> {
  const model = genAI.getGenerativeModel({ 
    model: MODELS.pro,
    systemInstruction: `Olet yrityskaupan markkinoinnin asiantuntija. Optimoi listaus maksimaalisen kiinnostuksen saamiseksi.`
  })

  const prompt = `
Yrityksen listaus:
${JSON.stringify(listingData, null, 2)}

Analysoi listaus ja:
1. Anna nykyinen pistemäärä (0-100)
2. Optimoi kaikki kentät
3. Selitä parannukset
4. Anna lisäsuosituksia

Vastaa JSON-muodossa:
{
  "currentScore": 0-100,
  "optimizedData": { ... optimoitu versio ... },
  "improvements": [
    {
      "field": "kenttä",
      "original": "alkuperäinen",
      "improved": "parannettu",
      "reason": "syy"
    }
  ],
  "suggestions": ["ehdotus 1", "ehdotus 2", ...]
}
`

  const result = await model.generateContent(prompt)
  const text = result.response.text()
  
  // Parse JSON
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  const optimization = jsonMatch ? JSON.parse(jsonMatch[0]) : null

  if (!optimization) {
    throw new Error('Failed to parse optimization')
  }

  // Log interaction
  await logInteraction({
    userId,
    sessionId: crypto.randomUUID(),
    type: 'optimization',
    input: { listingData },
    output: optimization,
    model: MODELS.pro
  })

  return optimization
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generoi kontekstuaalisia ehdotuksia keskustelulle
 */
function generateSuggestions(
  response: string, 
  context: AIContext
): string[] {
  // Role-specific suggestions
  const suggestions: Record<UserRole, string[]> = {
    visitor: [
      'Miten rekisteröidyn?',
      'Mitä palvelu maksaa?',
      'Miten yrityskauppa toimii?'
    ],
    buyer: [
      'Analysoi tämä yritys',
      'Mikä on reilu hinta?',
      'Mitä riskejä tulee huomioida?',
      'Näytä suositellut yritykset'
    ],
    seller: [
      'Optimoi listaukseni',
      'Generoi teaser',
      'Mikä on hyvä hinta?',
      'Miten houkuttelen ostajia?'
    ],
    broker: [
      'Priorisoi kauppani',
      'Etsi sopiva ostaja',
      'Mikä on provision ennuste?',
      'Automatisoi workflow'
    ],
    partner: [
      'Analysoi riskit',
      'Generoi rahoitusehdotus',
      'Laadi due diligence -raportti'
    ],
    admin: [
      'Näytä platforman tilanne',
      'Tunnista epänormaalit käyttäytymismallit',
      'Anna suosituksia optimointiin'
    ]
  }

  return suggestions[context.userRole] || suggestions.visitor
}

/**
 * Logita AI-interaktio tietokantaan
 */
async function logInteraction(data: {
  userId: string
  sessionId: string
  type: AIInteractionType
  input: any
  output: any
  model: string
}) {
  // Tämä kutsutaan API:n kautta joka tallentaa tietokantaan
  // Ei toteuteta tässä vielä, mutta funktio on valmis
  console.log('[AI] Interaction logged:', {
    userId: data.userId,
    type: data.type,
    model: data.model
  })
}

// ============================================================================
// EXPORTS
// ============================================================================

export const BizExitAI = {
  chat,
  analyzeCompany,
  generateContent,
  recommendCompanies,
  optimizeListing,
  createSystemPrompt
}

export default BizExitAI

