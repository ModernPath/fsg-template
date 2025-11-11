# AI Role and Data Authenticity in BizExit

## Core Principle: NO FAKE DATA

**CRITICAL RULE**: AI NEVER generates factual or financial data. All numerical data MUST come from verified sources.

---

## What AI CAN Do ✅

### 1. Data Extraction (from verified sources)
- Extract numbers from PDF documents (with user verification)
- Parse financial statements from Finder.fi, Asiakastieto.fi
- Read company information from YTJ registry
- **IMPORTANT**: Extracted data is always marked as "needs verification"

### 2. Text Generation
- Generate business descriptions based on public information
- Create executive summaries from existing data
- Write recommendations based on verified financial data
- Produce market analysis reports

### 3. Data Analysis
- Analyze financial trends from verified data
- Calculate financial ratios (ROI, profit margins, etc.)
- Identify patterns in historical data
- Compare companies based on real metrics

### 4. Smart Assistance
- Guide users through onboarding
- Suggest missing information to collect
- Recommend actions based on real company data
- Provide contextual help

---

## What AI CANNOT Do ❌

### 1. Generate Financial Numbers
- **NEVER** create revenue figures
- **NEVER** estimate profit/loss
- **NEVER** fabricate employee counts
- **NEVER** invent asset values
- **NEVER** guess financial metrics

### 2. Invent Factual Data
- **NEVER** create company addresses
- **NEVER** fabricate registration dates
- **NEVER** invent business IDs
- **NEVER** make up ownership information

### 3. Estimate Missing Data
- If data not found → mark as **missing** (null)
- **NEVER** fill gaps with estimates
- **NEVER** use "typical values" for industry
- Always show what's missing clearly

---

## Data Source Hierarchy

### Tier 1: Official Sources (Highest Trust)
1. **YTJ (Finnish Business Information System)**
   - Business ID, company form, registration date
   - Official address, company status
   - **Confidence**: VERIFIED

2. **Official Financial Statements** (user-uploaded PDFs)
   - Audited financial reports
   - Tax returns
   - **Confidence**: VERIFIED (after user confirmation)

### Tier 2: Public Financial Databases
1. **Finder.fi**
   - Public company financials
   - Historical revenue/profit data
   - **Confidence**: HIGH (extracted by AI, needs verification)

2. **Asiakastieto.fi**
   - Credit ratings
   - Financial summaries
   - **Confidence**: HIGH (extracted by AI, needs verification)

3. **Kauppalehti.fi**
   - Public financial information
   - Company news and updates
   - **Confidence**: MEDIUM (needs verification)

### Tier 3: User-Provided Data
1. **Direct User Input**
   - Company information entered by seller/broker
   - **Confidence**: VERIFIED (user responsible)

### Tier 4: AI-Generated Content (Lowest Trust for Facts)
1. **AI-Generated Text**
   - Business descriptions
   - Market analysis
   - Recommendations
   - **Confidence**: LOW (informational only)

---

## Implementation Rules

### Rule 1: Source Tracking
Every piece of data MUST have:
```typescript
interface DataSource {
  url: string;           // Exact URL where data was found
  name: string;          // Source name (e.g., "Finder.fi")
  verified: boolean;     // Is this an official source?
  accessedAt: Date;      // When was data retrieved
  dataType: 'OFFICIAL' | 'PUBLIC' | 'AI_EXTRACTED' | 'USER_PROVIDED';
}
```

### Rule 2: Missing Data Handling
```typescript
// ✅ CORRECT: Mark as missing
const revenue = null;
const dataQuality = {
  missingFields: ['revenue'],
  needsVerification: true
};

// ❌ WRONG: Never estimate
const revenue = averageIndustryRevenue; // FORBIDDEN!
```

### Rule 3: AI Extraction Validation
```typescript
// When AI extracts data from document:
const financialData = {
  revenue: 1000000,
  source: {
    url: "https://finder.fi/company/1234567-8",
    name: "Finder.fi",
    verified: false,  // Not official until user confirms
    dataType: 'AI_EXTRACTED'
  },
  dataQuality: {
    verified: false,
    extractedByAI: true,
    needsVerification: true  // User must verify!
  }
};
```

### Rule 4: User Verification Required
All AI-extracted numerical data MUST:
1. Show clear warning: "AI extracted - verify before use"
2. Display source URL for user to check
3. Require explicit user confirmation
4. Allow user to edit/correct values

---

## Warning Types

### Critical Warnings (Block Save)
```typescript
{
  type: 'MISSING_CRITICAL_DATA',
  message: 'Talousdata puuttuu - lisää tiedot manuaalisesti tai lataa tilinpäätös',
  fields: ['revenue', 'netProfit'],
  severity: 'CRITICAL'
}
```

### Verification Warnings (Allow Save with Confirmation)
```typescript
{
  type: 'NEEDS_VERIFICATION',
  message: 'AI poimi tiedot Finder.fi:stä - tarkista että numerot ovat oikein',
  fields: ['revenue', 'operatingProfit'],
  severity: 'WARNING'
}
```

### Info Warnings
```typescript
{
  type: 'AI_GENERATED_TEXT',
  message: 'Yrityksen kuvaus luotu AI:lla - muokkaa tarpeen mukaan',
  fields: ['description'],
  severity: 'INFO'
}
```

---

## UI Guidelines

### Show Data Quality Clearly

#### Verified Data (Green)
```
✅ YTJ-VAHVISTETTU
Yrityksen perustiedot haettu virallisesta YTJ-rekisteristä
```

#### Extracted Data (Yellow)
```
⚠️ TARKISTA TIEDOT
AI poimi talousluvut Finder.fi:stä. Varmista että ne ovat oikein.
Lähde: https://finder.fi/company/1234567-8
[Vahvista tiedot] [Muokkaa]
```

#### Missing Data (Red)
```
❌ TIEDOT PUUTTUVAT
Talousdata ei saatavilla julkisista lähteistä.
[Lisää manuaalisesti] [Lataa tilinpäätös]
```

#### AI-Generated Text (Blue)
```
ℹ️ AI-GENEROITU TEKSTI
Yrityksen kuvaus luotu automaattisesti. Muokkaa halutessasi.
```

---

## Code Examples

### Correct: Data Extraction with Validation
```typescript
async function extractFinancialData(url: string): Promise<YearlyFinancialData | null> {
  try {
    // Use AI to extract data
    const extracted = await aiExtractor.extract(url);
    
    // CRITICAL: Always mark as unverified
    return {
      year: extracted.year,
      revenue: extracted.revenue,
      operatingProfit: extracted.operatingProfit,
      source: {
        url: url,
        name: 'Finder.fi',
        verified: false,  // Not verified until user confirms
        accessedAt: new Date(),
        dataType: 'AI_EXTRACTED'
      },
      confidence: 'MEDIUM',
      dataQuality: {
        verified: false,
        extractedByAI: true,
        needsVerification: true
      }
    };
  } catch (error) {
    // If extraction fails, return null (don't fabricate)
    console.warn('Failed to extract data from', url);
    return null;
  }
}
```

### Wrong: AI Generating Data
```typescript
// ❌ FORBIDDEN: Never do this!
async function getCompanyFinancials(businessId: string) {
  const industry = await getIndustry(businessId);
  
  // WRONG: Using industry averages
  return {
    revenue: industryAverages[industry].revenue,  // FAKE DATA!
    employees: estimateEmployees(industry),        // FAKE DATA!
  };
}
```

### Correct: Marking Missing Data
```typescript
// ✅ CORRECT: Explicitly mark as missing
async function getCompanyFinancials(businessId: string) {
  const data = await tryFetchFromPublicSources(businessId);
  
  if (!data) {
    return {
      yearly: [],
      warnings: [{
        type: 'NO_FINANCIAL_DATA',
        message: 'Talousdata ei saatavilla - lisää tiedot manuaalisesti',
        severity: 'CRITICAL'
      }]
    };
  }
  
  return data;
}
```

---

## Testing Data Authenticity

### Unit Tests Must Verify
1. All financial data has source tracking
2. No data is generated without source
3. Missing data is marked as null
4. AI-extracted data requires verification
5. Critical fields have verified sources

```typescript
describe('Data Authenticity', () => {
  it('should never generate financial data', async () => {
    const result = await enrichCompany({ businessId: '1234567-8' });
    
    // Check that financial data either has source or is null
    result.financialData.yearly.forEach(year => {
      if (year.revenue !== null) {
        expect(year.source).toBeDefined();
        expect(year.source.url).toBeTruthy();
      }
    });
  });
  
  it('should mark AI-extracted data as unverified', async () => {
    const result = await enrichCompany({ businessId: '1234567-8' });
    
    result.financialData.yearly.forEach(year => {
      if (year.source.dataType === 'AI_EXTRACTED') {
        expect(year.dataQuality.needsVerification).toBe(true);
        expect(year.dataQuality.verified).toBe(false);
      }
    });
  });
});
```

---

## Summary

### Golden Rules
1. **AI analyzes, doesn't create** - Use AI for insights, not data generation
2. **Source everything** - Every number must have a traceable source
3. **Mark missing as missing** - Never fill gaps with estimates
4. **Verify extractions** - AI-extracted data needs user confirmation
5. **Show quality clearly** - Users must know what's verified vs. extracted

### AI is a Tool, Not a Creator
- AI helps extract and analyze real data
- AI generates helpful text and recommendations
- AI **never** fabricates financial information
- AI always shows its confidence and sources

### User Trust is Paramount
- Show exactly where data came from
- Be transparent about AI's role
- Give users control to verify and edit
- Never hide data quality issues

