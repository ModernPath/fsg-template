# PRH/YTJ API Investigation

## Executive Summary

**Date:** 2025-10-28
**Status:** ❌ No free/reliable API available for financial statements

## Background

After discovering that automatic financial data enrichment via web scraping produces 50-100% errors, we investigated official Finnish government APIs for accessing company financial statements.

## Findings

### 1. PRH (Patentti- ja rekisterihallitus)

**Website:** https://www.prh.fi / https://avoindata.prh.fi

**What they provide:**
- Basic company information (name, business ID, address, registration date)
- Company form, status, and representatives
- **Limited financial data** - NOT detailed financial statements

**API Access:**
- ✅ **Free basic company data** via YTJ API
- ❌ **No free financial statements API**
- ❌ **No tilinpäätös (income statement, balance sheet) data** in open API

### 2. YTJ (Yritys- ja yhteisötietojärjestelmä)

**What they provide:**
- Company registry data (käytetty koodissa: `/api/ytj/search`)
- Business ID lookup
- Basic company details

**Current Usage in Codebase:**
```typescript
// We already use YTJ for basic company lookup:
app/api/ytj/search/route.ts - Search companies by name/business ID
app/api/ytj/[businessId]/route.ts - Get company details by business ID
```

**Limitation:**
- ❌ YTJ API does **NOT include financial statements**
- ✅ Only provides company registry information

### 3. Commercial Providers

Financial statements in Finland are **public by law**, but **NOT freely accessible digitally**.

**Available through:**
1. **Kauppalehti.fi** (Alma Media)
   - ✅ Has financial data
   - ❌ Blocks scraping (403 Forbidden)
   - ❌ No public API
   - 💰 Requires paid subscription

2. **Finder.fi** (Suomen Asiakastieto)
   - ✅ Has financial data
   - ⚠️ Data often incorrect/outdated (observed 50-100% errors)
   - ❌ No public API
   - 💰 Requires paid subscription

3. **Asiakastieto.fi**
   - ✅ Has financial data
   - ❌ No public API for individuals
   - 💰 Requires expensive B2B contract

4. **PRH Document Service**
   - ✅ Can manually order tilinpäätös PDFs
   - ❌ Costs ~10€ per document
   - ❌ Manual process, not API
   - ⏱️ Slow (days for delivery)

## Technical Analysis

### Why Web Scraping Failed

1. **Kauppalehti.fi:**
   - Returns 403 Forbidden for automated requests
   - Uses anti-bot protection
   - Data requires JavaScript rendering
   - Gemini Grounding reads cached/incorrect data

2. **Finder.fi:**
   - Data is often wrong (50-100% errors observed)
   - Gemini extracted incorrect values consistently
   - Not trustworthy source

### Why Official API Would Be Ideal

✅ **Benefits:**
- Accurate, validated data
- Structured format
- Legal compliance
- No scraping issues
- Reliable updates

❌ **Reality:**
- Not available for free
- Requires commercial agreements
- High costs for startups

## Recommendations

### Current Approach (IMPLEMENTED)

✅ **1. Disable automatic enrichment**
- Too unreliable (50-100% errors)
- Users upload tilinpäätös PDFs instead

✅ **2. Document-based extraction**
- Gemini AI extracts data from uploaded PDFs
- Much more accurate than web scraping
- User validates the data

✅ **3. Priority system**
- Document data (priority 100) cannot be overwritten
- Manual entry (priority 50) protected from AI data
- AI-extracted (priority 10) lowest priority

### Future Options

💰 **Option 1: Commercial API Service**
- **Pros:** Reliable, automated, accurate
- **Cons:** Expensive (~1000-5000€/month)
- **Providers:** Asiakastieto API, Fonecta API
- **When:** If we have 1000+ users and revenue

🔧 **Option 2: Hybrid Approach**
- Keep document upload as primary method
- Add manual entry forms as backup
- Offer PRH document ordering service (charge 15€, buy for 10€)

📄 **Option 3: Document-Only (CURRENT)**
- ✅ Most accurate
- ✅ User-controlled
- ✅ Legally sound (user provides own documents)
- ⚠️ Requires user action
- ⚠️ Slower onboarding

## Conclusion

**There is NO free, reliable API for Finnish company financial statements.**

The only trustworthy approach is:
1. ✅ User uploads tilinpäätös PDF
2. ✅ AI extracts data from PDF
3. ✅ User validates extracted data

This is **exactly what we implemented** after disabling automatic enrichment.

## Code References

- `app/api/ytj/search/route.ts` - YTJ company search (basic data only)
- `lib/inngest/functions/documentProcessor.ts` - PDF extraction (accurate)
- `lib/inngest/functions/company-enrichment.ts` - Automatic enrichment (DISABLED)
- `lib/financial-search/unified-company-enrichment.ts` - Web scraping (UNRELIABLE)

## Resources

- **PRH Avoin data:** https://avoindata.prh.fi
- **YTJ API:** https://avoindata.prh.fi/ytj_en.html (no financial data)
- **PRH tilinpäätös tilaus:** https://www.prh.fi/fi/kaupparekisteri/asiakirjat.html
- **Asiakastieto API:** https://www.asiakastieto.fi/yritysasiakkaat/tuotteet/rajapinnat (expensive)

## Next Steps

1. ✅ Keep document-based approach
2. ⏭️ Add UI hints encouraging users to upload documents
3. ⏭️ Consider commercial API only after revenue justifies cost
4. ⏭️ Document PRH manual ordering as premium feature

---

**Status:** ✅ Investigation complete - No action needed, current approach is optimal

