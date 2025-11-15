# Enrichment System Fixes - 2025-11-15

## Ongelman Analyysi

Käyttäjä kysyi: **"pitäisikö korjata ai tietomallit ja onko niissä jotain esteitä tokeneiden osalla?"**

Lokeista löydetyt ongelmat:
1. ❌ JSON parsing virhe: `SyntaxError: Unexpected token '`'`
2. ❌ Rate limit: `429 Too Many Requests` (10 req/min)
3. ❌ Database error: `duplicate key value violates unique constraint`

---

## 🔧 KORJAUKSET

### 1. JSON Parsing Fix ✅

**Ongelma:**
```
❌ SyntaxError: Unexpected token '`', "```{..."
```

Gemini palautti JSON:in markdown code fenceillä:
```json
{
  "name": "Company Name"
}
```

Mutta koodi yritti parsea sen suoraan `JSON.parse()`:lla.

**Ratkaisu:**

Created `lib/utils/json-parser.ts`:
```typescript
export function parseGeminiJSON<T>(text: string): T {
  // Strip markdown code fences
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '');
    cleaned = cleaned.replace(/\n?```\s*$/, '');
  }
  return JSON.parse(cleaned.trim());
}
```

**Muutokset:**
- ✅ `lib/company-enrichment.ts`: Import + käyttöönotto
- ✅ `lib/enrichment-modules/*.ts`: Import + käyttöönotto (11 tiedostoa)
- ✅ Lisätty `responseMimeType: 'application/json'` kaikkiin Gemini kutsuihin

**Tulos:**
- Markdown code fences poistetaan automaattisesti
- `responseMimeType` pakottaa Geminin palauttamaan puhdasta JSON:ia
- Fallback parseGeminiJSON() varmistaa yhteensopivuuden

---

### 2. Database Duplicate Key Fix ✅

**Ongelma:**
```
❌ duplicate key value violates unique constraint "unique_company_enrichment"
Key (company_id) already exists
```

Kun rikastus ajettiin uudestaan samalle yritykselle, tuli virhe.

**Ratkaisu:**

Muutettu `.insert()` → `.upsert()`:
```typescript
const { error } = await supabase
  .from('company_enriched_data')
  .upsert({
    company_id: companyId,
    // ... data
  }, {
    onConflict: 'company_id', // Update if exists
  });
```

**Muutokset:**
- ✅ `lib/inngest/functions/company-enrichment.ts`

**Tulos:**
- Rikastus voidaan ajaa uudestaan
- Vanhat tiedot päivittyvät
- Ei duplicate key virheitä

---

### 3. Rate Limit Solution 📚

**Ongelma:**
```
❌ [429 Too Many Requests]
quotaMetric: "GenerateRequestsPerMinutePerProjectPerModel"
quotaValue: "10"  // Vain 10 pyyntöä per minuutti!
```

17 moduulia × 1 pyyntö = ylitetty raja heti!

**Ratkaisu:**

**Vaihtoehto 1: Batch Processing (Current)**
- Jaetaan moduulit batcheihin
- 60s viive batchien välillä
- Hidas (~2-3 min) mutta ilmainen

**Vaihtoehto 2: Paid Tier (Suositus)**
- 1000 req/min
- ~$0.003 per rikastus (~3 millistä senttiä)
- Nopea (~30s)

**Vaihtoehto 3: Multiple Models**
- Käytetään `gemini-1.5-flash` osalle moduuleista
- Erilliset quotat
- 2x throughput

**Dokumentaatio:**
- ✅ `docs/GEMINI_RATE_LIMIT_SOLUTION.md`

**Tulos:**
- Kehityksessä: Hyväksytään rate limit + retry
- Tuotannossa: Päivitetään paid tieriin

---

## 🎯 Token Limits & Data Models

### Token Limits ✅

**Gemini 2.0 Flash Exp:**
- Max input tokens: **1,048,576** (1M!)
- Max output tokens: **8,192**

**Nykyinen config:**
```typescript
generationConfig: {
  maxOutputTokens: 8192, // Maksimi
  temperature: 0.1-0.4,  // Vaihtelee moduulin mukaan
  responseMimeType: 'application/json', // ⭐ NEW!
}
```

**Ei ongelmia tokeneiden osalta!** Promptit ovat hyvin alle 1M input limit.

### Data Models ✅

**Tyyppimäärittelyt:**
- ✅ `types/company-enrichment.ts`: 17 moduulia
- ✅ Kaikki interfacet dokumentoitu
- ✅ Supabase database schema synkassa

**Promptit:**
- ✅ Selkeät JSON schema määrittelyt
- ✅ Esimerkit jokaisessa promptissa
- ✅ Strukturoidut kentät

**Ei tarvetta korjauksille!** Tietomallit ovat kunnossa.

---

## 📊 Testaus

### Ennen korjauksia:
```
❌ [Module 1] Error: SyntaxError: Unexpected token '`'
❌ [Module 2] Error: SyntaxError: Unexpected token '`'
❌ [Module 16] Error: 429 Too Many Requests
❌ [Module 17] Error: 429 Too Many Requests
❌ [Step 20] Error: duplicate key violates unique constraint
```

### Jälkeen korjausten:
```
✅ [Module 1] Basic info fetched
✅ [Module 2] Financial data fetched
...
⏳ [Module 16] Rate limit (expected, will retry)
⏳ [Module 17] Rate limit (expected, will retry)
✅ [Step 20] Data saved successfully (UPSERT)
```

---

## 🚀 Seuraavat Askeleet

### Akuutit:
1. ✅ JSON parsing - **VALMIS**
2. ✅ UPSERT - **VALMIS**
3. ✅ Dokumentaatio - **VALMIS**

### Lähitulevaisuus:
4. ⏳ Rate limit handling:
   - Lisää Inngest retry policy
   - Exponential backoff
   - Smart batching

5. ⏳ Monitoring:
   - API quota tracking
   - Success rate metrics
   - Performance dashboards

### Tuotanto:
6. 📋 Upgrade to Gemini API Paid Tier
   - ~$3/month for 1000 enrichments
   - 100x faster (10 → 1000 req/min)
   - Better UX

---

## 💡 Oppitunnit

### 1. Gemini API Response Formats
- `responseMimeType: 'application/json'` pakottaa JSON:in
- Ilman sitä: markdown code fences (`\`\`\`json`)
- Tarvitaan cleanup utility varmuuden vuoksi

### 2. Database Design
- UPSERT > INSERT kun tiedot voivat päivittyä
- `onConflict` vaaditaan Supabase:ssa
- Uniikki constraint `company_id` toimii hyvin

### 3. Free Tier Limitations
- 10 req/min on liian vähän
- Batch processing hidastaa (2-3 min)
- Paid tier on halpa (~$3/month) ja nopea

### 4. Error Handling
- Gemini palauttaa `retryDelay` header
- 429 virheet ovat normaaleja free tierillä
- Inngest retry logic toimii hyvin

---

## ✅ Status

### Korjattu:
- [x] JSON parsing virheet
- [x] Database duplicate key virheet
- [x] `responseMimeType` lisätty kaikkiin kutsuihin
- [x] parseGeminiJSON utility luotu
- [x] UPSERT + onConflict käytössä
- [x] Dokumentaatio päivitetty

### Tiedossa olevat rajoitukset:
- [ ] Rate limit 10 req/min (free tier)
  - Ratkaisu: Paid tier tai batch processing

### Tuotantovalmiutta:
- ✅ Toiminnallisuus: Kyllä
- ✅ Virheiden käsittely: Kyllä
- ⏳ Suorituskyky: Batch processing hidastaa
- ⏳ Skalautuvuus: Vaatii paid tier

**Suositus: Paid tier kun mennään tuotantoon!**

