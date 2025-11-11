# 📊 Onboarding Financial Data Flow - Kattava Analyysi

**Päivämäärä:** 2025-10-28  
**Tehtävä:** Tarkista koko onboarding flow ja varmista että taloustietojen kerääminen toimii oikein

---

## 🎯 KÄYTTÄJÄN VAATIMUKSET

1. ✅ **Pre_analysis vaiheen pitää käyttää VAIN julkisia yrityksen perustietoja**
   - Gemini haku ja rikastus (enriched_data)
   - Julkiset taloustiedot (financial_data.yearly)
   - EI tilinpäätöksestä purettuja financial_metrics taulun tietoja

2. ✅ **Taloustietoja pitää AINA pyytää liittämään tilinpäätöksenä**
   - ENSISIJAISESTI: Lataa tilinpäätös (PDF, Excel)
   - TOISSIJAISESTI: CFO-avustaja kysyy ne keskustelussa

3. ✅ **Taloustiedot vaativat AINA liitetyn dokumentin TAI CFO kysyy ne**
   - Ei oleteta että julkiset lähteet riittävät
   - Dokumentti-upload on ensisijainen tapa
   - CFO-keskustelu on vaihtoehtoinen tapa

---

## 🔍 NYKYINEN TOTEUTUS

### 1. ONBOARDING FLOW RAKENNE

```typescript
// File: components/auth/OnboardingFlow.tsx
export enum StepName {
  SIGNUP = 'signup',                    // Step 1
  COMPANY_INFO = 'company-info',        // Step 2
  PRE_ANALYSIS = 'pre-analysis',        // Step 3 (käytetään AI_CONVERSATION)
  // ... muut stepit poistettu flowsta
}
```

**Nykyinen flow:**
1. **Step 1**: Käyttäjätiedot (Step1Signup)
2. **Step 2**: Yrityksen valinta YTJ:stä (Step2CompanyInfo)
3. **Step 3**: AI Conversation (Step3AIConversation) - **PÄÄFLOW**

**Vanha Step3PreAnalysis** on VIELÄ KOODISSA mutta ei käytössä flowssa.

---

### 2. STEP3PREANALYSIS - JULKISET TIEDOT (EI KÄYTÖSSÄ)

```typescript
// File: components/auth/onboarding/Step3PreAnalysis.tsx
```

**Käyttää VAIN julkisia tietoja:**

```typescript
// Extract enriched data from metadata if available
const enrichedData = companyData.metadata?.enriched_data || {};
const financialData = companyData.metadata?.financial_data || {};
const latestFinancials = financialData.latest || {};
const yearlyFinancials = financialData.yearly || [];
```

**Datan lähteet:**
- ✅ `companyData.metadata.enriched_data` - Yrityksen kuvaus, toimiala, tuotteet
- ✅ `companyData.metadata.financial_data.yearly` - Julkiset vuosikohtaiset taloustiedot
- ✅ `companyData.metadata.financial_data.latest` - Viimeisimmät julkiset taloustiedot

**EI käytä:**
- ❌ `financial_metrics` taulu (tulee tilinpäätöksistä)
- ❌ `documents` prop (tilinpäätös-dokumentit)
- ❌ Ladattuja tilinpäätöksiä

**ARVIO:** ✅ **TOIMII OIKEIN** - käyttää vain julkisia tietoja

---

### 3. STEP3AICONVERSATION - PÄÄFLOW (KÄYTÖSSÄ)

```typescript
// File: components/auth/onboarding/Step3AIConversation.tsx
export interface Step3AIConversationProps {
  companyId: string | null;
  companyData: CompanyRow | null;
  documents: UploadedDocument[];              // ← Dokumentit
  financialDataArray: FinancialMetric[];      // ← financial_metrics taulu
  isFetchingFinancials: boolean;
  uploading: boolean;
  session: any | null;
  currentLocale: string;
  handleFileUpload: (files: File[], documentType?: string) => Promise<void>;
  fetchDocuments: () => Promise<void>;
  onDone?: () => void;
  onApplyRecommendation?: (recommendationData: any) => void;
}
```

---

### 4. TALOUSTIETOJEN PYYTÄMISEN LOGIIKKA

#### A) ENSISIJAINEN TAPA: Document Upload UI

**Näytetään kun:**
```typescript
// Line 1790-1856
(localEnrichmentStatus === 'pending_documents' || companyData?.enrichment_status === 'pending_documents') 
&& availableIndicators.length === 0
```

**UI-elementit:**

**1. VIHREÄ LAATIKKO: Taustatiedot haettu onnistuneesti**
```typescript
<div className="bg-green-500/10 border-green-500/30">
  ✅ Yrityksen taustatiedot haettu onnistuneesti
  Yrityksen taustatiedot (toimiala, tuotteet, markkinat) on haettu onnistuneesti. 
  Taloustietoja ei haeta automaattisesti, koska julkiset lähteet eivät ole riittävän luotettavia.
</div>
```

**2. ORANSSI LAATIKKO: Ensisijainen tapa - Lataa tilinpäätös**
```typescript
<div className="bg-orange-500/10 border-orange-500/30">
  <div className="font-bold">ENSISIJAINEN TAPA: Lataa tilinpäätös</div>
  
  Miksi liittää tilinpäätös?
  ✅ Tarkat luvut virallisesta dokumentista
  ✅ Kattava rahoitusanalyysi ja tunnusluvut
  ✅ Luotettavat rahoitussuositukset
  ✅ Paras mahdollinen hakukelpoisuusarvio
  
  <Button>Lataa tilinpäätös</Button>
</div>
```

**3. ORANSSI LAATIKKO (ALAPUOLI): Vaihtoehtoinen tapa - CFO-avustaja**
```typescript
<div className="border-t border-orange-500/20">
  <div className="font-semibold">VAIHTOEHTOINEN TAPA: Anna tiedot CFO:lle</div>
  
  Voit myös kertoa talousluvut (liikevaihto, tulos, varat, velat) suoraan CFO-avustajalle 
  alapuolella olevassa chatissa. Tämä on nopeampi tapa, mutta analyysi ei ole yhtä kattava 
  kuin tilinpäätöksestä.
  
  💡 Huom: Manuaalisesti annetut luvut ovat vähemmän luotettavia kuin tilinpäätöksestä poimitut luvut.
</div>
```

**ARVIO:** ✅ **ERITTÄIN HYVÄ** - Selkeä prioriteetti ja vaihtoehtoinen tapa

---

#### B) VAIHTOEHTOINEN TAPA: CFO-avustaja kysyy keskustelussa

**API:** `/api/onboarding/conversation/route.ts`

**Logiikka:**
```typescript
// Line 629-683: INITIAL_QUESTION_LOGIC
const INITIAL_QUESTION_LOGIC = (history: any[], locale: string, company: any) => {
  if (history.length > 2) return ''
  
  // Check if financial data is missing or has low confidence
  const hasFinancialData = company?.metadata?.financial_data?.confidence 
    && company.metadata.financial_data.confidence >= 50
  
  const financialDataGuidance = !hasFinancialData ? `
🔴 CRITICAL: MISSING FINANCIAL DATA DETECTED
The company's financial data is missing or unreliable (confidence < 50%).

MANDATORY FIRST STEP - Request Financial Information:
Before asking about financing needs, you MUST first request basic financial information from the user.

Required approach (use ${locale} language):
1. Acknowledge that you couldn't find reliable financial data from public sources
2. Explain why you need it: "To provide accurate financing recommendations, I need to understand your company's financial situation"
3. Ask for basic financial information in natural language
4. Make it conversational and easy: "Could you tell me about your latest financial statement? For example, your revenue, operating profit, and equity?"
5. Mention fiscal year: "What fiscal year are these numbers from?"

Example opening (translate to Finnish):
"Hei! En valitettavasti löytänyt ${company?.name} talouslukuja julkisista lähteistä. 
Voisitteko kertoa minulle muutaman luvun viimeisimmästä tilinpäätöksestänne? Tarvitsen ainakin:
- Liikevaihdon
- Liikevoiton (jos saatavilla)
- Oman pääoman (jos saatavilla)
- Miltä tilikaudelta nämä luvut ovat?

Voitte kertoa ne ihan luonnollisella kielellä, esim: 'Liikevaihto oli 500 000 euroa, liikevoitto 50 000 euroa. Tilikausi 2024.'"

When user provides financial data:
- Thank them: "Kiitos! Jatketaan analyysiä näiden tietojen pohjalta."
- Proceed with normal financing needs analysis
- DO NOT ask them to re-enter the data
- The user will see their provided data in the UI automatically
` : ''
  
  return `
INITIAL QUESTION GENERATION:
${financialDataGuidance}
Generate your FIRST personalized question for SHORT analysis:
- Use ${locale} language
- ${!hasFinancialData ? 
    '🔴 FIRST request financial information as described above, THEN proceed with financing needs after user provides the data' : 
    'Focus on immediate financing needs, be direct and specific (max 3-4 questions total)'}
- Reference their industry: ${company?.industry || 'business'}
- Consider company size: ${company?.number_of_employees || 'unknown'} employees
- Make options relevant to their business context, not generic categories

💡 USER CAN PROVIDE FINANCIAL DATA AT ANY TIME:
- If user mentions financial numbers (revenue, profit, assets, etc.) during ANY part of the conversation
- Thank them and acknowledge: "Kiitos tiedoista! Jatketaan analyysiä."
- Continue with financing needs analysis
- User doesn't need to repeat information
`
}
```

**ARVIO:** ✅ **TOIMII OIKEIN** - CFO kysyy taloustiedot jos `confidence < 50`

---

## 📋 YHTEENVETO JA ONGELMAT

### ✅ TOIMII HYVIN:

1. **Step3PreAnalysis käyttää vain julkisia tietoja** ✅
   - Enriched_data ja financial_data.yearly
   - Ei financial_metrics taulua

2. **Step3AIConversation näyttää selkeän UI:n dokumentin lataamiselle** ✅
   - "ENSISIJAINEN TAPA: Lataa tilinpäätös"
   - "VAIHTOEHTOINEN TAPA: Anna tiedot CFO:lle"
   - Selkeät perustelut miksi dokumentti on parempi

3. **CFO-avustaja kysyy taloustiedot jos puuttuvat** ✅
   - Tarkistaa `confidence >= 50`
   - Jos puuttuu, kysyy ENSIMMÄISENÄ ennen rahoitustarpeita
   - Ohjeistaa käyttäjää antamaan luvut luonnollisella kielellä

---

### ⚠️ POTENTIAALISET ONGELMAT JA PARANNUSEHDOTUKSET:

#### 1. **Document Upload UI näkyy vain kun `enrichment_status === 'pending_documents'`**

**Ongelma:**
```typescript
// Line 1790: Näkyy VAIN jos
(localEnrichmentStatus === 'pending_documents' || companyData?.enrichment_status === 'pending_documents')
```

**Kysymys:** Mitä tapahtuu jos:
- Enrichment status on `'completed'` mutta taloustietoja ei ole?
- Käyttäjä ohittaa dokumentin lataamisen ja aloittaa keskustelun?

**Suositus:**
```typescript
// Näytä document upload kehotus AINA jos:
// 1. Ei ole ladattuja dokumentteja JA
// 2. financial_metrics taulu on tyhjä JA
// 3. confidence < 50

const shouldShowUploadPrompt = 
  documents.length === 0 && 
  financialDataArray.length === 0 && 
  (!companyData?.metadata?.financial_data?.confidence || 
   companyData.metadata.financial_data.confidence < 50);
```

---

#### 2. **CFO kysyy taloustiedot HETI alussa jos confidence < 50**

**Nykyinen käyttäytyminen:**
```typescript
// API kysyy taloustietoja ENSIMMÄISENÄ kysymyksenä jos confidence < 50
if (history.length > 2) return '' // Kysytään vain alussa
```

**Mahdollinen ongelma:**
- Käyttäjä näkee UI:ssa kehotuksen ladata dokumentti
- SAMAAN AIKAAN CFO kysyy taloustietoja chatissa
- Voi aiheuttaa hämmennystä: Kumpi tapa valitaan?

**Suositus:**
```typescript
// Parannettu logiikka:
// 1. Jos dokumentteja ei ole ladattu EIKÄ financial_metrics dataa
//    → CFO kysyy: "Voisitko ladata tilinpäätöksen TAI kertoa talousluvut?"
// 2. Jos käyttäjä aloittaa lataamaan → Odota prosessoinnin valmistumista
// 3. Jos käyttäjä alkaa kertoa lukuja → Tallenna saveFinancialData funktiolla

const shouldAskForFinancials = 
  history.length <= 2 && 
  !hasFinancialData && 
  documents.length === 0 &&
  financialDataArray.length === 0;

const financialDataGuidance = shouldAskForFinancials ? `
🔴 MISSING FINANCIAL DATA

FIRST MESSAGE - Dual approach:
"Hei! En valitettavasti löytänyt ${company?.name} talouslukuja julkisista lähteistä.

PARAS TAPA: Lataa tilinpäätös
Voit ladata tilinpäätöksen yläpuolella olevasta 'Lataa tilinpäätös' -napista. 
Tämä antaa tarkat luvut ja kattavimman analyysin.

VAIHTOEHTOINEN TAPA: Kerro luvut minulle
Jos et voi ladata tilinpäätöstä nyt, voit kertoa muutaman lukua:
- Liikevaihto (esim. 500 000 euroa)
- Liikevoitto (jos saatavilla)
- Oma pääoma (jos saatavilla)
- Tilikausi (esim. 2024)

Kumpi tapa sopii sinulle paremmin?"
` : ''
```

---

#### 3. **Intro Screen ei välttämättä korosta dokumentin lataamista tarpeeksi**

**Nykyinen intro screen:**
```typescript
// Line 2384-2461: Welcome/Intro Screen
<Card>
  <Image cfo-avatar />
  <h3>CFO-avustaja</h3>
  <p>Hei! Olen CFO-avustajasi. Autan sinua löytämään parhaat rahoitusvaihtoehdot yrityksellesi.</p>
  <Button onClick={startConversation}>Aloita analyysi</Button>
</Card>
```

**Ongelma:**
- Käyttäjä voi aloittaa analyysin ENNEN kuin on ladannut dokumentin
- Document upload kehotus näkyy VAIN ylhäällä company summary cardissa

**Suositus:**
Lisää intro screeniin maininta dokumentista:

```typescript
<Card>
  <Image cfo-avatar />
  <h3>CFO-avustaja</h3>
  <div className="space-y-3">
    <p>Hei! Olen CFO-avustajasi. Autan sinua löytämään parhaat rahoitusvaihtoehdot yrityksellesi.</p>
    
    {documents.length === 0 && financialDataArray.length === 0 && (
      <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
        <div className="text-sm font-semibold text-orange-200 mb-1">
          💡 Vinkki ennen aloitusta
        </div>
        <div className="text-xs text-orange-300">
          Lataa tilinpäätös yläpuolelta saadaksesi tarkat suositukset. 
          Voit myös aloittaa analyysin ja kertoa luvut minulle keskustelussa.
        </div>
      </div>
    )}
  </div>
  
  <Button onClick={startConversation}>
    {documents.length > 0 ? 'Aloita analyysi' : 'Aloita ilman dokumenttia'}
  </Button>
</Card>
```

---

## 🎯 SUOSITUKSET KORJAUKSIIN

### PRIORITEETTI 1: KRIITTISET KORJAUKSET

#### A) Yhtenäistä document upload kehotus

**Tiedosto:** `components/auth/onboarding/Step3AIConversation.tsx`

**Muutos:** Näytä document upload kehotus AINA kun dokumentteja ei ole, riippumatta enrichment_status:sta

```typescript
// VANHA (Line 1790):
{(localEnrichmentStatus === 'pending_documents' || companyData?.enrichment_status === 'pending_documents') 
  && availableIndicators.length === 0 && (
  <div>...</div>
)}

// UUSI:
{shouldShowDocumentUploadPrompt && (
  <div>...</div>
)}

// Missä:
const shouldShowDocumentUploadPrompt = useMemo(() => {
  const hasDocuments = documents.length > 0;
  const hasFinancialMetrics = financialDataArray.length > 0;
  const hasReliablePublicData = 
    companyData?.metadata?.financial_data?.confidence && 
    companyData.metadata.financial_data.confidence >= 70; // Korkeampi kynnys
  
  return !hasDocuments && !hasFinancialMetrics && !hasReliablePublicData;
}, [documents, financialDataArray, companyData]);
```

---

#### B) Paranna CFO:n ensimmäinen viesti

**Tiedosto:** `app/api/onboarding/conversation/route.ts`

**Muutos:** CFO:n ensimmäinen viesti kertoo SELKEÄSTI molemmat vaihtoehdot

```typescript
// Line 649-657: Parannettu opening message
Example opening (translate to ${locale === 'fi' ? 'Finnish' : locale === 'sv' ? 'Swedish' : 'English'}):
"Hei! En valitettavasti löytänyt ${company?.name || 'yrityksenne'} talouslukuja julkisista lähteistä. 

📄 PARAS TAPA: Lataa tilinpäätös
Voit ladata viimeisimmän tilinpäätöksen yläpuolella olevasta oranssista 'Lataa tilinpäätös' -napista. 
Tämä antaa tarkat luvut ja kattavimman mahdollisen analyysin.

💬 VAIHTOEHTOINEN TAPA: Kerro luvut minulle
Jos et voi ladata tilinpäätöstä nyt, voit kertoa minulle muutaman lukua:
- Liikevaihto (esim. 500 000 euroa)
- Liikevoitto tai nettotulos (jos saatavilla)
- Oma pääoma (jos saatavilla)
- Tilikausi (esim. 2024)

Kumpi tapa sopii sinulle paremmin? Voit myös aloittaa analyysin ja lisätä dokumentin myöhemmin."
```

---

#### C) Lisää vinkki intro screeniin

**Tiedosto:** `components/auth/onboarding/Step3AIConversation.tsx`

**Muutos:** Intro screen mainitsee dokumentin lataamisen

```typescript
// Line 2384: Lisää ennen "Aloita analyysi" -nappia
{!hasLatestStatement && availableIndicators.length === 0 && (
  <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-left">
    <div className="flex items-start gap-2">
      <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
      <div className="text-xs text-blue-200 space-y-1">
        <p className="font-semibold">💡 Ennen aloitusta</p>
        <p>
          Suosittelen lataamaan tilinpäätöksen yläpuolelta. 
          Saat silloin tarkat suositukset ja kattavimman analyysin.
        </p>
        <p className="text-blue-300/80">
          Voit myös aloittaa ilman ja kertoa luvut minulle keskustelussa.
        </p>
      </div>
    </div>
  </div>
)}
```

---

### PRIORITEETTI 2: KÄYTTÖKOKEMUKSEN PARANNUS

#### D) Lisää "Skip document upload" -nappi

**Tiedosto:** `components/auth/onboarding/Step3AIConversation.tsx`

**Muutos:** Anna käyttäjälle mahdollisuus ohittaa dokumentin lataaminen tietoisesti

```typescript
// Line 1834: Lisää "Skip" -nappi dokumentin lataamisen viereen
<div className="flex items-center gap-2">
  <Button
    type="button"
    size="sm"
    className="text-xs bg-orange-500/20 border border-orange-500/40 text-orange-200 hover:bg-orange-500/30 font-semibold"
    onClick={() => fileInputRef.current?.click()}
  >
    <Upload className="h-3 w-3 mr-1.5" />
    {t('company.uploadLatest', { default: 'Lataa tilinpäätös' })}
  </Button>
  
  <Button
    type="button"
    size="sm"
    variant="ghost"
    className="text-xs text-orange-300 hover:text-orange-200"
    onClick={() => {
      // Hide upload prompt and proceed with manual input
      setHasLatestStatement(true); // Piilota upload kehotus
      if (!conversationStarted) {
        startConversation(); // Aloita keskustelu automaattisesti
      }
    }}
  >
    Ohita ja kerro luvut CFO:lle →
  </Button>
</div>
```

---

#### E) Näytä dokumentin lataamisen edistyminen

**Tiedosto:** `components/auth/onboarding/Step3AIConversation.tsx`

**Muutos:** Kun käyttäjä lataa dokumentin, näytä edistyminen

```typescript
// Lisää uploading state handling
{isUploadingLocal && (
  <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
    <div className="flex items-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
      <div className="text-sm text-blue-200">
        {t('company.uploading', { default: 'Ladataan tilinpäätöstä...' })}
      </div>
    </div>
    <div className="text-xs text-blue-300/80 mt-1">
      Dokumentti prosessoidaan ja taloustiedot poimitaan automaattisesti. 
      Tämä kestää noin 10-30 sekuntia.
    </div>
  </div>
)}
```

---

## 📊 LOPULLINEN SUOSITELTU FLOW

### KÄYTTÄJÄN POLKU 1: Lataa dokumentti (Ensisijainen)

1. Käyttäjä saapuu Step3AIConversation-sivulle
2. Näkee SELKEÄN oranssin laatikon:
   ```
   ✅ Yrityksen taustatiedot haettu
   
   📄 ENSISIJAINEN TAPA: Lataa tilinpäätös
   - Tarkat luvut virallisesta dokumentista
   - Kattava rahoitusanalyysi ja tunnusluvut
   - Luotettavat rahoitussuositukset
   
   [Lataa tilinpäätös] [Ohita ja kerro CFO:lle →]
   ```
3. Käyttäjä lataa dokumentin
4. Näkee lataamisen edistymisen (10-30s)
5. Dokumentti prosessoitu → financial_metrics tauluun
6. CFO aloittaa keskustelun ILMAN pyyntöä taloustiedoista
7. Keskittää rahoitustarpeisiin ja suosituksiin

---

### KÄYTTÄJÄN POLKU 2: Kerro luvut CFO:lle (Vaihtoehtoinen)

1. Käyttäjä saapuu Step3AIConversation-sivulle
2. Näkee oranssin laatikon JA intro screenin vinkin
3. Päättää olla lataamatta dokumenttia → klikkaa "Ohita ja kerro CFO:lle"
4. CFO:n ensimmäinen viesti:
   ```
   Hei! En löytänyt [yritys] talouslukuja julkisista lähteistä.
   
   📄 PARAS TAPA: Lataa tilinpäätös yläpuolelta (oranssi nappi)
   
   💬 TAI kerro minulle muutama luku:
   - Liikevaihto (esim. 500 000 €)
   - Liikevoitto (jos saatavilla)
   - Oma pääoma (jos saatavilla)
   - Tilikausi (esim. 2024)
   
   Voit kertoa ne ihan luonnollisella kielellä!
   ```
5. Käyttäjä kertoo luvut: "Liikevaihto oli 750 000 euroa, liikevoitto 85 000 euroa, oma pääoma 120 000 euroa. Tilikausi 2024."
6. CFO tallentaa luvut `saveFinancialData` funktiolla
7. CFO kiittää ja jatkaa rahoitustarpeisiin

---

### KÄYTTÄJÄN POLKU 3: Aloita suoraan (Harvempi)

1. Käyttäjä näkee oranssin laatikon mutta jättää huomiotta
2. Klikkaa suoraan "Aloita analyysi" intro screenistä
3. CFO:n ensimmäinen viesti (sama kuin Polku 2, step 4)
4. Käyttäjä voi:
   - a) Palata lataamaan dokumentin
   - b) Kertoa luvut CFO:lle
   - c) Jatkaa ilman taloustietoja (huonompi analyysi)

---

## ✅ YHTEENVETO

### NYT TOIMII HYVIN:

1. ✅ Step3PreAnalysis käyttää vain julkisia tietoja
2. ✅ Step3AIConversation näyttää selkeän UI:n dokumentin lataamiselle
3. ✅ CFO-avustaja kysyy taloustiedot jos puuttuvat

### PARANNETTAVAA:

1. ⚠️ Document upload kehotus näkyy vain `enrichment_status === 'pending_documents'`
2. ⚠️ CFO kysyy taloustiedot HETI alussa (voi olla liian aikaista)
3. ⚠️ Intro screen ei korosta dokumentin lataamista tarpeeksi

### SUOSITELLUT KORJAUKSET:

1. 🔧 Yhtenäistä document upload kehotus (näkyy AINA kun tarvitaan)
2. 🔧 Paranna CFO:n ensimmäinen viesti (mainitsee molemmat tavat)
3. 🔧 Lisää vinkki intro screeniin
4. 🔧 Lisää "Skip document upload" -nappi
5. 🔧 Näytä dokumentin lataamisen edistyminen

---

## 📝 SEURAAVAT ASKELEET

1. **Toteuta kriittiset korjaukset (A-C)**
   - Yhtenäistä document upload logiikka
   - Paranna CFO:n viesti
   - Lisää vinkki intro screeniin

2. **Testaa flow kattavasti**
   - Polku 1: Lataa dokumentti ensin
   - Polku 2: Kerro luvut CFO:lle
   - Polku 3: Aloita suoraan ilman

3. **Kerää käyttäjäpalautetta**
   - Kumpi tapa on suosituin?
   - Aiheuttaako dual-approach hämmennystä?
   - Pitäisikö yksi tapa priorisoida vahvemmin?

4. **Optimoi käyttökokemus datan perusteella**
   - Jos 90% käyttäjistä lataa dokumentin → Piilota CFO:n pyyntö
   - Jos 50%+ kertoo luvut → Korosta sitä enemmän
   - Jos käyttäjät hämmentyvät → Yksinkertaista flow

---

**Päivitetty:** 2025-10-28  
**Seuraava tarkistus:** Kun korjaukset on toteutettu ja testattu

