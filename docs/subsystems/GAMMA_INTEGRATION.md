# Gamma.app Integration

## Overview

BizExit integrates with **Gamma.app** to automatically generate professional, visually appealing presentation materials for M&A teasers, Information Memorandums, and pitch decks.

## Features

- 🎨 **Automated Presentation Generation**: Convert teaser content to professional slides
- 📊 **Structured Slide Creation**: 11-slide teaser template optimized for M&A
- 🔄 **Dual Generation Methods**: 
  - Structured API (preferred)
  - Prompt-based fallback
- ✅ **Full Integration**: Seamlessly integrated into materials generation workflow

## Architecture

```
Materials Generation Flow
         ↓
   Enriched Data (17 modules)
         ↓
   Gemini AI (Text Generation)
         ↓
   Teaser Content (JSON)
         ↓
   Gamma.app (Visual Generation) ← YOU ARE HERE
         ↓
   Professional Presentation
```

## Configuration

### 1. API Key Setup

Add your Gamma API key to `.env.local`:

```bash
# Gamma.app API Key (Pro or Ultra subscription required)
GAMMA_API_KEY=sk-gamma-xxxxxxxxxxxxxxxxxxxxxxxx
```

**Important Notes:**
- API key format: `sk-gamma-xxxxxxxx`
- Requires **Pro or Ultra** Gamma subscription
- Get your API key from: [Gamma Account Settings → API Key](https://gamma.app/settings)

### 2. Verify Configuration

Test your Gamma integration:

```bash
npm run test-gamma
```

Expected output:
```
🧪 Testing Gamma.app Integration...
✅ API Key found: sk-gamma-xxxxx...
📝 Test Teaser Content:
   Title: Test M&A Opportunity: Nordic SaaS Company
   Slides: 11

🧪 Test 1: Structured API (preferred method)...
✅ Success!
   Presentation ID: abc123
   URL: https://gamma.app/docs/abc123
   Edit URL: https://gamma.app/edit/abc123
   Status: completed
```

## Usage

### Programmatic Usage

```typescript
import { createGammaPresentation } from '@/lib/gamma-generator';
import type { TeaserContent } from '@/lib/teaser-generator';

// Generate presentation from teaser content
const presentation = await createGammaPresentation(
  teaserContent,
  process.env.GAMMA_API_KEY!
);

console.log('Presentation URL:', presentation.url);
console.log('Edit URL:', presentation.editUrl);
```

### In Materials Generation Workflow

Gamma generation is automatically triggered when:
1. User initiates materials generation
2. Company enrichment data is gathered (17 modules)
3. Gemini AI generates teaser text content
4. **Gamma creates visual presentation** ← Automatic
5. Assets saved to `company_assets` table

## Slide Structure

The teaser presentation includes **11 slides**:

1. **Title Slide**: Company name and tagline
2. **Executive Summary**: Investment opportunity overview
3. **Investment Highlights**: 5 key selling points
4. **Business Overview**: Description, industry, market position
5. **Products & Services**: Key offerings
6. **Financial Snapshot**: Revenue, margins, growth, EBITDA
7. **Competitive Advantages**: Unique moats and differentiators
8. **Growth Opportunities**: Expansion potential
9. **Ideal Buyer Profile**: Target acquirer types
10. **Transaction Rationale**: Why now is the right time
11. **Next Steps**: Call to action

## API Methods

### Method 1: Structured API (Preferred)

```typescript
const presentation = await createGammaPresentation(
  teaserContent,
  apiKey
);
```

**Pros:**
- Full control over slide structure
- Consistent formatting
- Predictable output

**Cons:**
- May need API endpoint adjustments based on Gamma's beta API changes

### Method 2: Prompt-Based (Fallback)

```typescript
const prompt = `Create a professional M&A teaser for ${title}...`;
const presentation = await createGammaPresentationFromPrompt(
  prompt,
  apiKey
);
```

**Pros:**
- More flexible
- Leverages Gamma's AI capabilities
- Less dependent on specific API structure

**Cons:**
- Less control over exact slide structure
- Output may vary

## Data Flow

```typescript
// 1. Enrichment data collected (17 modules)
const enrichedData = {
  basicInfo: { ... },
  financialData: { ... },
  industryAnalysis: { ... },
  // ... 14 more modules
};

// 2. Gemini generates teaser text
const teaserContent = await generateTeaser(
  { companyOverview, enrichedData, ... },
  GEMINI_API_KEY
);

// 3. Gamma creates presentation
const presentation = await createGammaPresentation(
  teaserContent,
  GAMMA_API_KEY
);

// 4. Save to database (with all Gamma fields)
await supabase.from('company_assets').insert({
  company_id: companyId,
  organization_id: organizationId,
  type: 'teaser',
  content: teaserContent,
  gamma_presentation_id: presentation.id,
  gamma_presentation_url: presentation.url,
  gamma_edit_url: presentation.editUrl,
  generation_status: presentation.status,
});
```

## Database Schema

Generated presentations are stored in `company_assets`:

```sql
CREATE TABLE company_assets (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  type TEXT, -- 'teaser', 'im', 'pitch_deck'
  content JSONB, -- Teaser content from Gemini
  
  -- Gamma integration fields
  gamma_presentation_id TEXT, -- Gamma card/presentation ID
  gamma_presentation_url TEXT, -- View/share URL
  gamma_edit_url TEXT, -- Edit URL for modifications
  gamma_embed_url TEXT, -- Embed URL (if needed)
  generation_status TEXT DEFAULT 'manual', -- 'processing', 'completed', 'failed'
  
  -- Storage and metadata
  storage_path TEXT, -- If exported to PDF/PPTX
  mime_type TEXT,
  file_size BIGINT,
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_company_assets_company_id ON company_assets(company_id);
CREATE INDEX idx_company_assets_gamma_id ON company_assets(gamma_presentation_id);
```

## API Endpoints Reference

### POST /v1/cards
Generate a new presentation/card

**Request (Structured):**
```json
{
  "title": "Presentation Title",
  "description": "Executive summary",
  "slides": [
    {
      "title": "Slide 1",
      "content": "Content here"
    }
  ],
  "theme": "professional",
  "brandColor": "#D4AF37"
}
```

**Request (Text-based):**
```json
{
  "text": "Full presentation text with markdown",
  "card_type": "presentation",
  "theme": "professional"
}
```

**Response:**
```json
{
  "id": "card_abc123",
  "url": "https://gamma.app/docs/...",
  "edit_url": "https://gamma.app/edit/...",
  "status": "completed"
}
```

### GET /v1/cards/{id}
Check presentation status

**Response:**
```json
{
  "id": "card_abc123",
  "url": "https://gamma.app/docs/...",
  "edit_url": "https://gamma.app/edit/...",
  "status": "processing" | "completed" | "failed"
}
```

**Headers:**
- `X-API-KEY`: Your Gamma API key (format: `sk-gamma-xxxxx`)
- `Content-Type`: `application/json`

## Troubleshooting

### Issue: "Gamma API key not configured"

**Solution:**
1. Check `.env.local` has `GAMMA_API_KEY`
2. Verify key format starts with `sk-gamma-`
3. Restart dev server after adding key

### Issue: API returns 401 Unauthorized

**Solution:**
1. Verify you have an active Pro or Ultra subscription
2. Regenerate API key in Gamma settings
3. Check key hasn't been revoked

### Issue: API returns 400 Bad Request

**Solution:**
1. Run `npm run test-gamma` to test with known-good data
2. Check if Gamma API structure has changed
3. Review [Gamma API Documentation](https://developers.gamma.app/)

### Issue: Presentation generation is slow

**Solution:**
- This is expected during beta
- Gamma typically takes 10-30 seconds to generate
- Progress tracked in `enrichment_jobs` table
- User can navigate away and return later

## Limitations

1. **Beta API**: Gamma API is in beta, endpoints may change
2. **Subscription Required**: Requires paid Gamma subscription
3. **Rate Limits**: Check Gamma docs for current rate limits
4. **Generation Time**: 10-30 seconds per presentation

## Future Enhancements

- [ ] Support for custom themes and branding
- [ ] IM and pitch deck templates
- [ ] Batch generation for multiple companies
- [ ] Direct PDF export
- [ ] Webhook notifications for completion
- [ ] Presentation versioning

## Related Files

- `lib/gamma-generator.ts` - Core Gamma integration
- `lib/teaser-generator.ts` - Gemini text generation
- `lib/inngest/materials-generation.ts` - Workflow orchestration
- `tools/test-gamma.ts` - Testing utility
- `types/company-enrichment.ts` - Type definitions

## Support

For Gamma-specific issues:
- [Gamma Help Center](https://help.gamma.app/)
- [Gamma API Documentation](https://developers.gamma.app/)
- [Gamma API Troubleshooting](https://help.gamma.app/en/articles/12805003-gamma-api-troubleshooting)

For BizExit integration issues:
- Check `docs/learnings.md` for known solutions
- Review Inngest logs for background job failures
- Test with `npm run test-gamma`

