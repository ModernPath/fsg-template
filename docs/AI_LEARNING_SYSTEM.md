
# AI Learning System - BizExit

## Yleiskatsaus

BizExit AI oppii jokaisesta käyttäjä-interaktiosta ja parantaa vastauksiaan ajan myötä. Järjestelmä perustuu neljään pääkomponenttiin:

1. **Conversations** - Kaikkien AI-keskustelujen historia
2. **Learnings** - Opitut näkemykset käyttäjistä ja yrityksistä
3. **Context Memory** - Pitkäaikainen muisti
4. **Feedback** - Käyttäjäpalaute AI:n parantamiseksi

---

## 1. AI Conversations

### Tarkoitus
Tallentaa kaikki keskustelut AI-agenttien kanssa kontekstin rakentamiseksi ja oppimiseen.

### Tietorakenne
```typescript
interface AIConversation {
  id: UUID;
  user_id: UUID;
  agent_type: 'seller_ai' | 'broker_ai' | 'buyer_ai' | 'cfo_assistant';
  
  // Konteksti
  company_id?: UUID;
  deal_id?: UUID;
  organization_id?: UUID;
  
  // Viestit
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
  }>;
  
  // Metatiedot
  started_at: Date;
  last_message_at: Date;
  status: 'active' | 'completed' | 'archived';
  
  // Yhteenveto (päivitetään keskustelun jälkeen)
  summary?: string;
  key_insights?: {
    insights: string[];
    decisions: string[];
    action_items: string[];
  };
  
  // Suorituskyky
  message_count: number;
  avg_response_time_ms?: number;
  user_satisfaction_score?: number; // 1-5
}
```

### Käyttötapaukset

#### 1. Keskustelun aloitus
```typescript
const conversation = await createConversation({
  user_id: userId,
  agent_type: 'seller_ai',
  company_id: companyId,
});
```

#### 2. Viestin lisääminen
```typescript
await addAIMessage(
  conversationId,
  'user',
  'Mikä on yritykseni arvio?'
);

await addAIMessage(
  conversationId,
  'assistant',
  'Perustuen taloustietoihisi, arvio on...'
);
```

#### 3. Keskustelun yhteenveto
```typescript
// AI luo yhteenvedon keskustelun päätyttyä
await updateConversationSummary(conversationId, {
  summary: 'Käyttäjä tiedusteli arvostusta...',
  key_insights: {
    insights: ['Yritys on kannattava', 'Kasvutrendi positiivinen'],
    decisions: ['Lähdetään myyntiin'],
    action_items: ['Lataa tilinpäätös', 'Täytä yritysprofiili']
  }
});
```

---

## 2. AI Learnings

### Tarkoitus
Tallentaa opittuja näkemyksiä käyttäjistä, yrityksistä ja kuvioista personointiin ja parempiin suosituksiin.

### Oppimistyypit

#### A. User Preferences (Käyttäjän mieltymykset)
```typescript
{
  learning_type: 'user_preference',
  category: 'communication',
  user_id: userId,
  insight: 'Käyttäjä suosii yksityiskohtaisia talousanalyyseja',
  data: {
    detail_level: 'high',
    prefers_charts: true,
    communication_style: 'formal'
  },
  confidence: 0.85
}
```

#### B. Company Patterns (Yrityksen kuviot)
```typescript
{
  learning_type: 'company_pattern',
  category: 'financial',
  company_id: companyId,
  insight: 'Yrityksen liikevaihto kasvaa 15% vuosittain',
  data: {
    growth_rate: 0.15,
    consistency: 'high',
    seasonality: 'Q4 peak'
  },
  confidence: 0.92,
  source_type: 'document_analysis'
}
```

#### C. Deal Insights (Kaupan näkemykset)
```typescript
{
  learning_type: 'deal_insight',
  category: 'behavioral',
  deal_id: dealId,
  user_id: userId,
  insight: 'Ostaja keskittyy teknologiayritksiin',
  data: {
    preferred_industries: ['technology', 'saas'],
    size_range: { min: 500000, max: 2000000 },
    location_preference: ['Helsinki', 'Tampere']
  },
  confidence: 0.78
}
```

#### D. Market Trends (Markkinatrendit)
```typescript
{
  learning_type: 'market_trend',
  category: 'industry',
  insight: 'SaaS-yritysten arvostuskertoimet nousevat',
  data: {
    industry: 'saas',
    metric: 'valuation_multiple',
    trend: 'increasing',
    period: '2024-Q4'
  },
  confidence: 0.70,
  source_type: 'external_data'
}
```

### Oppimisen elinkaari

```typescript
// 1. AI tekee havainnon keskustelusta
const learning = await recordAILearning({
  learning_type: 'user_preference',
  category: 'communication',
  user_id: userId,
  insight: 'Käyttäjä kysyy usein veroista',
  data: { topic_interest: 'taxation' },
  confidence: 0.60,
  source_conversation_id: conversationId
});

// 2. Oppiminen vahvistuu useamman havainnon myötä
await updateLearningConfidence(learningId, 0.85);

// 3. Käyttäjä voi vahvistaa oppimisen
await verifyLearning(learningId, userId);

// 4. Oppimista käytetään seuraavissa keskusteluissa
await incrementLearningUsage(learningId);

// 5. Vanhentuneet oppimisettekevät arkistoidaan
await archiveLearning(learningId);
```

---

## 3. Context Memory

### Tarkoitus
Pitkäaikainen muisti AI-agenteille - tietoa joka säilyy keskustelujen välillä.

### Muistityypit

#### Critical (Kriittinen)
```typescript
{
  scope_type: 'company',
  scope_id: companyId,
  memory_type: 'constraint',
  key: 'min_sale_price',
  value: { amount: 1000000, currency: 'EUR' },
  importance: 'critical',
  confidence: 1.0,
  created_by: 'user_input'
}
```

#### High (Korkea)
```typescript
{
  scope_type: 'user',
  scope_id: userId,
  memory_type: 'goal',
  key: 'target_timeline',
  value: { deadline: '2025-06-30', urgency: 'high' },
  importance: 'high',
  confidence: 0.95,
  created_by: 'conversation'
}
```

#### Medium (Keskitaso)
```typescript
{
  scope_type: 'company',
  scope_id: companyId,
  memory_type: 'preference',
  key: 'disclosure_level',
  value: { level: 'selective', requires_nda: true },
  importance: 'medium',
  confidence: 0.80
}
```

#### Low (Matala)
```typescript
{
  scope_type: 'user',
  scope_id: userId,
  memory_type: 'fact',
  key: 'ui_language',
  value: { language: 'fi' },
  importance: 'low',
  confidence: 1.0
}
```

### Kontekstin haku

```typescript
// Hae käyttäjän konteksti AI:lle
const context = await getAIContext(userId, companyId);

// Tuloksena:
{
  user_memories: [
    { key: 'target_timeline', value: {...}, importance: 'high' },
    { key: 'communication_preference', value: {...}, importance: 'medium' }
  ],
  company_memories: [
    { key: 'min_sale_price', value: {...}, importance: 'critical' },
    { key: 'growth_strategy', value: {...}, importance: 'high' }
  ],
  recent_learnings: [
    { insight: 'Käyttäjä suosii nopeaa prosessia', confidence: 0.85 },
    { insight: 'Yritys on kannattava', confidence: 0.95 }
  ]
}
```

---

## 4. AI Feedback

### Tarkoitus
Kerää käyttäjäpalautetta AI:n vastauksista jatkuvaan parantamiseen.

### Palautetyypit

#### 1. Hyödyllinen
```typescript
await submitFeedback({
  conversation_id: conversationId,
  message_index: 5,
  user_id: userId,
  rating: 5,
  feedback_type: 'helpful',
  comment: 'Erinomainen analyysi! Juuri mitä tarvitsin.'
});
```

#### 2. Ei hyödyllinen
```typescript
await submitFeedback({
  conversation_id: conversationId,
  message_index: 3,
  rating: 2,
  feedback_type: 'not_helpful',
  comment: 'Liian yleinen vastaus',
  specific_issues: {
    issues: ['too_generic', 'missed_context']
  }
});
```

#### 3. Virheellinen
```typescript
await submitFeedback({
  conversation_id: conversationId,
  message_index: 7,
  rating: 1,
  feedback_type: 'inaccurate',
  comment: 'Numerot eivät täsmää tilinpäätökseen',
  specific_issues: {
    issues: ['wrong_numbers', 'incorrect_calculation'],
    details: 'Revenue should be 1.5M, not 1.2M'
  }
});
```

### Palautteen hyödyntäminen

```typescript
// 1. Ylläpitäjä tarkistaa negatiivisen palautteen
const negativeFeedback = await getNegativeFeedback(limit: 10);

// 2. Korjataan ongelma
await updateAIResponse(conversationId, messageIndex, newResponse);

// 3. Merkitään toimenpide
await markFeedbackReviewed(feedbackId, {
  action_taken: 'improved_response',
  reviewed_by: adminId
});

// 4. Päivitetään AI-mallin prompts
await updatePromptBasedOnFeedback(feedbackPattern);
```

---

## Integraatio AI-agentteihin

### 1. Kontekstin lataaminen

```typescript
async function getAugmentedContext(
  userId: UUID,
  companyId?: UUID,
  dealId?: UUID
) {
  // Hae kaikki relevanti konteksti
  const [context, recentConversations, learnings] = await Promise.all([
    getAIContext(userId, companyId),
    getRecentConversations(userId, limit: 5),
    getRelevantLearnings(userId, companyId)
  ]);
  
  return {
    ...context,
    conversation_history: recentConversations,
    active_learnings: learnings
  };
}
```

### 2. AI-vastauksen generointi

```typescript
async function generateAIResponse(
  conversationId: UUID,
  userMessage: string
) {
  // 1. Lataa konteksti
  const context = await getAugmentedContext(userId, companyId);
  
  // 2. Rakenna prompt kontekstin kanssa
  const systemPrompt = buildSystemPrompt(context);
  
  // 3. Generoi vastaus
  const response = await callGemini({
    system: systemPrompt,
    messages: [
      ...context.conversation_history,
      { role: 'user', content: userMessage }
    ]
  });
  
  // 4. Tallenna viesti
  await addAIMessage(conversationId, 'assistant', response);
  
  // 5. Etsi oppimisia
  const newLearnings = await extractLearnings(userMessage, response, context);
  for (const learning of newLearnings) {
    await recordAILearning(learning);
  }
  
  return response;
}
```

### 3. Oppimisen päivitys

```typescript
async function updateLearningsFromConversation(conversationId: UUID) {
  const conversation = await getConversation(conversationId);
  
  // Analysoi keskustelu AI:lla
  const insights = await analyzeConversationForLearnings(conversation);
  
  // Tallenna oppimisia
  for (const insight of insights) {
    await recordAILearning({
      ...insight,
      source_conversation_id: conversationId,
      source_type: 'conversation'
    });
  }
}
```

---

## RLS Policies

Kaikki taulut käyttävät Row Level Security:

```sql
-- Käyttäjä näkee vain omat keskustelunsa
CREATE POLICY "Users can view their own conversations"
  ON ai_conversations FOR SELECT
  USING (auth.uid() = user_id);

-- Käyttäjä näkee oppimisia itsestään ja yrityksistään
CREATE POLICY "Users can view learnings about themselves"
  ON ai_learnings FOR SELECT
  USING (
    auth.uid() = user_id 
    OR company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

-- Käyttäjä näkee oman konteksti-muistinsa
CREATE POLICY "Users can view their context memory"
  ON ai_context_memory FOR SELECT
  USING (
    (scope_type = 'user' AND scope_id = auth.uid())
    OR (scope_type = 'company' AND scope_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    ))
  );
```

---

## API Esimerkit

### Keskustelun luonti
```typescript
POST /api/ai/conversations
{
  "agent_type": "seller_ai",
  "company_id": "uuid",
  "initial_message": "Miten aloitan yrityskaupan?"
}
```

### Viestin lisääminen
```typescript
POST /api/ai/conversations/:id/messages
{
  "message": "Mikä on yritykseni arvo?"
}
```

### Palautteen antaminen
```typescript
POST /api/ai/feedback
{
  "conversation_id": "uuid",
  "message_index": 3,
  "rating": 5,
  "feedback_type": "helpful"
}
```

### Kontekstin haku
```typescript
GET /api/ai/context?user_id=uuid&company_id=uuid
```

---

## Hyödyt

### Käyttäjälle
- **Personoitu kokemus** - AI muistaa mieltymykset
- **Kontekstitietoinen** - Ei tarvitse toistaa tietoja
- **Paranee ajan myötä** - Vastaukset yhä parempia
- **Johdonmukainen** - Sama "muisti" kaikissa kanavissa

### Järjestelmälle
- **Oppiva AI** - Paranee jatkuvasti ilman uudelleenkoulutusta
- **Laadunvalvonta** - Palaute ohjaa kehitystä
- **Analytiikka** - Näkyvyys AI:n toimintaan
- **Skaalautuva** - Toimii tuhansille käyttäjille

---

## Tietoturva & Yksityisyys

### Tietosuoja
- Kaikki data salattu tietokannassa
- RLS-policies rajoittavat pääsyä
- Käyttäjä voi pyytää datan poiston (GDPR)
- Arkaluonteiset tiedot eivät näy logeissa

### Läpinäkyvyys
- Käyttäjä näkee mitä AI on oppinut
- Käyttäjä voi korjata virheellisiä oppimisia
- Selkeä merkintä AI-generoidulle sisällölle
- Oppimisten lähteet aina näkyvissä

---

## Tulevaisuuden kehitys

### Phase 2
- [ ] Cross-user pattern recognition (anonyymi)
- [ ] Industry benchmarking from learnings
- [ ] Predictive analytics (deal success probability)
- [ ] Automated prompt optimization

### Phase 3
- [ ] Multi-agent collaboration
- [ ] Transfer learning between agent types
- [ ] Real-time learning updates
- [ ] Advanced NLP for sentiment analysis

