# 🔍 Dokumenttiprosessointi - Vertailuanalyysi

## ✅ **VOITTAJA: `processDocument` (documentProcessor.ts)**

---

## 📊 Feature Comparison

| Ominaisuus | processDocument ✅ | analyzeFinancialDocument ❌ |
|------------|-------------------|----------------------------|
| **AI Model Routing** | ✅ Optimaalinen mallin valinta | ❌ Kiinteä malli |
| **Cache Support** | ✅ Redis 24h | ❌ Ei cachea |
| **Retry Logic** | ✅ withGeminiRetry | ❌ Ei retryä |
| **Manual Selection** | ✅ Skippaa AI jos tarpeen | ❌ Ei tukea |
| **Multi-Year Extraction** | ✅ 2024 + 2023 | ❌ Vain 1 vuosi |
| **Company Match Validation** | ✅ Business ID + Name | ❌ Puutteellinen |
| **Financial Metrics** | ✅ 30+ metric | ❌ Perus metriikka |
| **Recommendations Trigger** | ✅ Automaattinen | ❌ Ei triggeröi |
| **Locale Support** | ✅ fi/en/sv | ❌ Ei locale-tukea |
| **Error Handling** | ✅ Kattava + logging | ❌ Perus error handling |
| **Status Updates** | ✅ pending → completed/failed | ⚠️ processing → completed |
| **Code Quality** | ✅ Modern, maintainable | ❌ Legacy code |
| **Last Updated** | 2025-10-15 | 2024 (vanha) |

---

## 🔬 Detailed Analysis

### ✅ **processDocument** (SUOSITUS)

**File:** `lib/inngest/functions/documentProcessor.ts`

#### **Vahvuudet:**

1. **AI Model Routing (Intelligent)**
```typescript
const modelRouting = await routeToOptimalModel(
  enhancedPrompt,
  'Dokumentin analyysi ja tietojen poiminta',
  { preferSpeed: true }
)
// → gemini-2.5-flash (nopea) tai gemini-2.5-pro (tarkka)
```

2. **Cache Layer (Performance)**
```typescript
const cacheKey = `document-analysis:${documentId}:${mimeType}`
let responseText = await cache.ai.get<string>(cacheKey)

if (!responseText) {
  // AI call only if not cached
  responseText = await aiGenerate()
  await cache.ai.set(cacheKey, responseText, 60 * 60 * 24) // 24h
}
```

3. **Retry Logic (Reliability)**
```typescript
const result = await withGeminiRetry(async () => {
  return await ai.models.generateContent({ 
    model: modelRouting.selectedModel, 
    contents 
  })
}, `Document Analysis ${documentId}`)
// → Retry 3x with exponential backoff
```

4. **Manual Selection Support (UX)**
```typescript
const noAutoDetectTypes = ['leasing_document', 'collateral_document', 'other']
if (isManualSelection && noAutoDetectTypes.includes(manualDocumentType)) {
  console.log(`✅ Skipping AI analysis for manually selected type`)
  // Skip AI, save immediately
}
```

5. **Multi-Year Extraction**
```typescript
{
  "yearsData": [
    { "fiscal_year": 2024, "keyMetrics": { revenue: 374500000, ... } },
    { "fiscal_year": 2023, "keyMetrics": { revenue: 437000000, ... } }
  ]
}
```

6. **30+ Financial Metrics**
- Revenue, EBITDA, Operating Profit, Net Profit
- Total Assets, Fixed Assets, Current Assets
- Total Equity, Total Liabilities
- Operational Cash Flow, Investment CF, Financing CF
- Accounts Receivable, Inventory, Cash
- **+ Extended Metrics:**
  - Interest-bearing debt
  - Average employees
  - Collateral given

7. **Recommendations Trigger**
```typescript
await step.sendEvent('send-recommendation-request', {
  name: 'recommendations/generation-requested',
  data: {
    companyId,
    financingNeedsId,
    locale // ✅ Locale-tuki
  }
})
```

8. **Comprehensive Logging**
```typescript
logger.info('ai', 'Aloitetaan dokumentin analyysi', 'DocumentProcessor', {
  documentId,
  mimeType,
  selectedModel: modelRouting.selectedModel,
  complexity: modelRouting.complexity
})
```

---

### ❌ **analyzeFinancialDocument** (DEPRECATED)

**File:** `lib/inngest/functions/documentAnalyzer.ts`

#### **Puutteet:**

1. **No Cache** → Every run hits AI API (expensive!)
2. **No Retry** → Single API failure = document processing failure
3. **No Manual Selection** → Always runs AI (even for non-financial docs)
4. **Single Year Only** → Misses comparison year (e.g., 2023)
5. **Basic Metrics** → Only core financial metrics
6. **No Recommendations** → Doesn't trigger AI recommendations
7. **No Locale** → Can't pass language for AI analysis
8. **Legacy Code** → Written in 2024, not updated
9. **Fixed Model** → Always uses same Gemini model (not optimal)
10. **Weak Error Handling** → Doesn't handle all edge cases

---

## ⚠️ **KRIITTINEN ONGELMA: Duplikaatti Eventit**

### Ongelma:
Molemmat funktiot kuuntelivat **samaa eventtiä**:

```typescript
// ❌ processDocument
{ event: 'document/uploaded' }

// ❌ analyzeFinancialDocument
{ event: 'document/uploaded' }
```

### Seuraukset:
- 🔄 **Race condition**: Molemmat päivittävät statusta samanaikaisesti
- 💰 **2x kustannus**: Gemini API kutsutaan kahdesti
- 🐛 **Dokumentit jäävät pending-tilaan**: Jos toinen onnistuu, toinen failaa
- 📊 **Inngest logi täynnä**: Duplikaatti ajot

### ✅ Korjaus (2025-10-15):
```typescript
// app/api/inngest/documents/route.ts
export const { GET, POST, PUT } = serve({
  client: inngestDocuments,
  functions: [
    processDocument,              // ✅ AINOA document/uploaded listener
    generateFinancialAnalysis,    // ✅ Internal analysis
    processDocumentAnalysisRequest, // ✅ financial/analysis-requested
    // ❌ REMOVED: analyzeFinancialDocument
  ],
})
```

---

## 🎯 **Suositus**

### ✅ **Käytä: `processDocument`**

**Syyt:**
1. ✅ **Uudempi** (2025 vs 2024)
2. ✅ **Kattavampi** (30+ metriikkaa vs perus metriikka)
3. ✅ **Tehokkaampi** (cache + retry + model routing)
4. ✅ **Älykkäämpi** (manual selection + multi-year)
5. ✅ **Parempi UX** (recommendations trigger + locale)
6. ✅ **Production-ready** (logging + error handling)

### ❌ **Poista: `analyzeFinancialDocument`**

**Already done!** ✅ Poistettu `app/api/inngest/documents/route.ts`:stä

---

## 🔧 Jatkotoimenpiteet

### ✅ **Tehty:**
- [x] Poistettu duplikaatti event listener
- [x] Dokumentoitu vertailu
- [x] Luotu DOCUMENT_PROCESSING_FLOW.md

### ⏳ **Vielä tehtävä:**
1. [ ] Poista `lib/inngest/functions/documentAnalyzer.ts` kokonaan (ei enää käytössä)
2. [ ] Päivitä dokumentaatio poistamaan viittaukset `analyzeFinancialDocument`-funktioon
3. [ ] Varmista että kaikki testit käyttävät `processDocument`-funktiota

---

## 📚 Related Files

- **Primary (KÄYTÄ):** `lib/inngest/functions/documentProcessor.ts`
- **Deprecated (POISTA):** `lib/inngest/functions/documentAnalyzer.ts`
- **Inngest Config:** `app/api/inngest/documents/route.ts`
- **Documentation:** `docs/DOCUMENT_PROCESSING_FLOW.md`

---

**Päivitetty:** 2025-10-15  
**Status:** ✅ Duplikaatti poistettu, processDocument käytössä  
**Maintainer:** AI Agent

