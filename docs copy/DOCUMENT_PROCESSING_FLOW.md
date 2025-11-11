# 📄 Dokumenttien käsittely - Kokonaisanalyysi

> **Päivitetty:** 2025-10-15  
> **Status:** ✅ Duplikaatti event listener poistettu

---

## 🔄 Processing Flow (End-to-End)

### 1️⃣ **Document Upload** (Frontend → API)

#### **API Endpoints:**
- `POST /api/documents/upload` (authenticated document upload)
- `POST /api/onboarding/upload-document` (onboarding flow upload)

#### **Steps:**
1. **File Validation**
   - Allowed types: PDF, Excel, Word, Images
   - Max size: 10MB (configurable)
   - MIME type verification

2. **Storage Upload**
   ```typescript
   const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
     .from('financial_documents')
     .upload(filePath, file, {
       contentType: file.type,
       upsert: false
     })
   ```

3. **Database Record Creation**
   ```typescript
   const { data: document } = await supabaseAdmin
     .from('documents')
     .insert({
       company_id: companyId,
       document_type_id: finalDocumentTypeId,
       name: file.name,
       file_path: filePath,
       mime_type: file.type,
       file_size: file.size,
       fiscal_year: fiscalYear ?? new Date().getFullYear() - 1,
       fiscal_period: fiscalPeriod || 'annual',
       uploaded_by: user.id,
       processing_status: 'pending', // ← Initial status
       uploaded_at: currentDate
     })
     .select('*')
     .single()
   ```

4. **Inngest Event Dispatch**
   ```typescript
   await inngest.send({
     name: 'document/uploaded', // ← Trigger processing
     data: {
       documentId: document.id,
       companyId: companyId,
       userId: user.id,
       locale: locale, // ✅ Added in Part A fix
       isManualSelection: isManualSelection,
       manualDocumentType: manualDocumentType || null
     }
   })
   ```

---

### 2️⃣ **Background Processing** (Inngest)

#### **Function:** `processDocument`
- **Event:** `document/uploaded`
- **File:** `lib/inngest/functions/documentProcessor.ts`
- **ID:** `process-uploaded-document`

#### **Processing Steps:**

##### **Step 1: Fetch Document**
```typescript
const { data: docData } = await supabaseAdmin
  .from('documents')
  .select('*')
  .eq('id', documentId)
  .single()
```

##### **Step 2: AI Extraction with Gemini**
```typescript
const extractionResult = await step.run('extract-document-data', async () => {
  // 1. Cache check
  const cacheKey = `document-analysis:${documentId}:${mimeType}`
  let responseText = await cache.ai.get<string>(cacheKey)
  
  if (!responseText) {
    // 2. AI Model Routing (select optimal model)
    const modelRouting = await routeToOptimalModel(
      enhancedPrompt,
      'Dokumentin analyysi ja tietojen poiminta',
      { preferSpeed: true }
    )

    // 3. Gemini API Call with Retry
    const result = await withGeminiRetry(async () => {
      return await ai.models.generateContent({ 
        model: modelRouting.selectedModel, 
        contents: [
          { text: enhancedPrompt },
          { inlineData: { mimeType, data: base64Data } }
        ]
      })
    }, `Document Analysis ${documentId}`)
    
    responseText = result.text

    // 4. Cache result (24h)
    await cache.ai.set(cacheKey, responseText, 60 * 60 * 24)
  }

  // 5. Parse JSON response
  return parseAIResponse(responseText)
})
```

**Extraction Tasks:**
1. **Document Type Identification** (financial statement, bank statement, invoice, contract, other)
2. **Company Match Verification** (match business ID and company name)
3. **Multi-Year Financial Data Extraction**:
   - Income Statement (revenue, EBITDA, operating profit, net profit)
   - Balance Sheet (assets, equity, liabilities)
   - Cash Flow Statement (operational, investment, financing)

##### **Step 3: Financial Metrics Calculation**
```typescript
const financialMetricsCreation = await step.run('create-financial-metrics', async () => {
  for (const yearData of yearsData) {
    await calculateFinancialMetrics(
      yearData.keyMetrics,
      companyId,
      yearData.fiscal_year,
      yearData.fiscal_period || 'annual',
      userId,
      [documentId]
    )
  }
})
```

##### **Step 4: Update Document Status**
```typescript
await step.run('update-document-status', async () => {
  const { error } = await supabaseAdmin
    .from('documents')
    .update({
      processing_status: 'completed', // ✅ Success
      processed: true,
      extraction_data: extractionDataForStorage,
      document_type_id: resolvedDocumentTypeId
    })
    .eq('id', documentId)
})
```

**Or on failure:**
```typescript
await supabaseAdmin
  .from('documents')
  .update({
    processing_status: 'failed', // ❌ Failed
    processed: false,
    extraction_data: { error: failureReason }
  })
  .eq('id', documentId)
```

##### **Step 5: Trigger Recommendations**
```typescript
await step.sendEvent('send-recommendation-request', {
  name: 'recommendations/generation-requested',
  data: {
    companyId: companyId,
    financingNeedsId: financingNeeds.id,
    locale: locale // ✅ Locale passed from upload
  },
  user: { id: userId }
})
```

---

### 3️⃣ **AI Recommendations** (Inngest)

#### **Function:** `generateFundingRecommendations`
- **Event:** `recommendations/generation-requested`
- **File:** `lib/inngest/functions/recommendationGenerator.ts`

#### **Steps:**
1. Fetch company financial data
2. Fetch financing needs
3. Generate AI recommendations using Gemini
4. Save recommendations to database
5. Update financing_needs status

---

## 🐛 Issues & Fixes

### ❌ **Issue 1: Duplicate Event Listener** (Fixed 2025-10-15)

**Problem:**
Two functions listening to the same `document/uploaded` event:
1. `processDocument` (documentProcessor.ts) ← **Primary**
2. `analyzeFinancialDocument` (documentAnalyzer.ts) ← **Duplicate**

**Consequences:**
- Race condition in status updates
- Duplicate Gemini API calls (2x cost!)
- Documents stuck in "pending" if one succeeds, one fails
- Inngest logs full of duplicate runs

**Fix:**
```typescript
// app/api/inngest/documents/route.ts
export const { GET, POST, PUT } = serve({
  client: inngestDocuments,
  functions: [
    processDocument,              // ✅ Handles document/uploaded
    generateFinancialAnalysis,    // ✅ Handles internal analysis
    processDocumentAnalysisRequest, // ✅ Handles financial/analysis-requested
    // ❌ REMOVED: analyzeFinancialDocument (duplicate)
  ],
})
```

---

### ✅ **Issue 2: Missing Locale in Events** (Fixed 2025-10-15, Part A)

**Problem:**
Initial `document/uploaded` event didn't pass `locale`, causing AI analysis to default to English.

**Fix:**
- `app/api/onboarding/upload-document/route.ts` ✅ Extracts locale from formData/URL
- `app/api/documents/upload/route.ts` ✅ Extracts locale from formData/URL
- `app/api/documents/analyze/route.ts` ✅ Extracts locale from body/URL
- All default to `'fi'` if locale is missing or invalid

---

## 📊 Database Schema

### **documents** table
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  document_type_id UUID REFERENCES document_types(id),
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  mime_type TEXT,
  file_size BIGINT,
  fiscal_year INTEGER,
  fiscal_period TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  processing_status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  processed BOOLEAN DEFAULT FALSE,
  extraction_data JSONB,
  financial_metrics_id UUID REFERENCES financial_metrics(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
)
```

### **Processing Status Flow:**
```
pending → (Inngest starts) → completed ✅
                            ↘ failed ❌
```

---

## 🔧 Configuration

### **Environment Variables:**
```bash
GOOGLE_AI_STUDIO_KEY=<Gemini API key>
SUPABASE_URL=<Supabase project URL>
SUPABASE_SERVICE_ROLE_KEY=<Service role key for admin operations>
```

### **AI Model Routing:**
- **Speed Priority:** `gemini-2.5-flash` (document analysis)
- **Quality Priority:** `gemini-2.5-pro` (complex extraction)
- **Fallback:** Retry logic with exponential backoff

### **Caching:**
- **Key:** `document-analysis:{documentId}:{mimeType}`
- **TTL:** 24 hours
- **Provider:** Redis (via cache.ai.get/set)

---

## 🧪 Testing

### **Manual Test Flow:**
1. Upload document via `/api/onboarding/upload-document`
2. Check Inngest logs for `processDocument` execution
3. Verify document status: `pending` → `completed`
4. Check `extraction_data` JSONB field
5. Verify `financial_metrics` creation
6. Check `recommendations/generation-requested` event fired

### **Debug Logs:**
```bash
# Check Inngest function logs
🚀 [documentId] Starting document processing for company {companyId}
📋 [documentId] Manual document type selected: {manualDocumentType}
📊 [documentId] Fetching data...
✅ [documentId] Document fetched successfully
🤖 [documentId] Extracting data with Gemini...
✅ [documentId] Extraction complete
✅ [documentId] Document processing completed successfully
```

---

## 📝 Best Practices

### ✅ **DO:**
- Always pass `locale` in upload events
- Use AI model routing for optimal performance
- Cache Gemini responses (24h)
- Handle multi-year extraction (2024 + 2023)
- Validate company match (business ID + name)
- Use retry logic for Gemini API calls
- Update status on failure: `processing_status: 'failed'`

### ❌ **DON'T:**
- Register duplicate event listeners
- Skip locale parameter
- Hardcode AI models (use routing)
- Ignore cache for repeat documents
- Assume single-year data only
- Skip error handling in Inngest steps
- Leave documents in "pending" forever

---

## 🚀 Future Improvements

1. **Progress Tracking:**
   - Add `processing_progress` field (0-100%)
   - Emit Supabase Realtime updates

2. **Multi-Document Analysis:**
   - Combine data from multiple fiscal years
   - Trend analysis across documents

3. **OCR Enhancement:**
   - Pre-process scanned PDFs with OCR
   - Improve handwritten document support

4. **Parallel Processing:**
   - Process multiple documents concurrently (per company)
   - Add concurrency limits to Inngest functions

5. **Webhook Notifications:**
   - Notify users when processing completes
   - Send email with extraction summary

---

## 📚 Related Files

### **API Routes:**
- `app/api/documents/upload/route.ts` (authenticated upload)
- `app/api/onboarding/upload-document/route.ts` (onboarding upload)
- `app/api/documents/analyze/route.ts` (trigger analysis)

### **Inngest Functions:**
- `lib/inngest/functions/documentProcessor.ts` (main processor)
- `lib/inngest/functions/recommendationGenerator.ts` (AI recommendations)
- `app/api/inngest/documents/route.ts` (Inngest serve endpoint)

### **Frontend Components:**
- `components/auth/onboarding/Step8DocumentUpload.tsx` (onboarding UI)
- `components/dashboard/Documents.tsx` (dashboard UI)

### **Database:**
- `supabase/migrations/*_add_documents_table.sql`
- `supabase/migrations/*_add_financial_metrics.sql`

---

## 🆘 Troubleshooting

### **Issue: Documents stuck in "pending"**
**Diagnosis:**
```sql
SELECT id, name, processing_status, created_at 
FROM documents 
WHERE processing_status = 'pending' 
  AND created_at < NOW() - INTERVAL '1 hour'
```

**Solutions:**
1. Check Inngest Dev Server running: `npx inngest-cli dev`
2. Check `document/uploaded` event was sent (Inngest logs)
3. Check Gemini API key is valid
4. Re-trigger processing manually:
   ```typescript
   await inngest.send({
     name: 'document/uploaded',
     data: { documentId, companyId, userId, locale }
   })
   ```

### **Issue: AI extraction returns empty data**
**Diagnosis:**
- Check Gemini response in Inngest logs
- Verify file is valid PDF/image
- Check base64 encoding is correct
- Test with simpler document

**Solutions:**
1. Clear AI cache: `cache.ai.del('document-analysis:...')`
2. Try different AI model (gemini-2.5-pro)
3. Check document type is supported
4. Verify file isn't corrupted

### **Issue: Locale is English despite Finnish page**
**Diagnosis:**
```typescript
// Check upload API logs
console.log('Locale extracted:', locale) // Should be 'fi'
```

**Solutions:**
1. Verify locale is in formData: `formData.append('locale', 'fi')`
2. Check API extracts locale correctly
3. Verify Inngest event includes locale: `event.data.locale`
4. Check defaults to 'fi' in recommendationGenerator.ts

---

## ✅ Checklist: Adding New Document Type

- [ ] Add type to `document_types` table
- [ ] Update Gemini extraction prompt (TASK 1 list)
- [ ] Add specific extraction fields if needed
- [ ] Test upload → processing → completion flow
- [ ] Update UI document type selector
- [ ] Add localization keys (fi, en, sv)
- [ ] Test with real document samples
- [ ] Update this documentation

---

**Maintained by:** AI Agent  
**Last Updated:** 2025-10-15  
**Status:** ✅ Production-ready  

