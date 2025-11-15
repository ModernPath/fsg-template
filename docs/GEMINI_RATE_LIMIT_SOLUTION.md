# Gemini API Rate Limit Solution

## Problem
```
[429 Too Many Requests]
quotaMetric: "GenerateRequestsPerMinutePerProjectPerModel"
quotaValue: "10"  // Only 10 requests per minute!
```

With **17 enrichment modules**, we hit the rate limit immediately.

## Solutions

### 1. ✅ BATCH PROCESSING (Current Implementation)
Run modules in sequential batches with delays between batches:

**Batch Structure:**
```typescript
// Base Modules (1-9) - Run in parallel
await Promise.all([
  module1(), module2(), ..., module9()
])

// Delay between batches
await sleep(60000) // 60 seconds

// M&A Modules (10-17) - Run in parallel
await Promise.all([
  module10(), module11(), ..., module17()
])
```

**Pros:**
- Free tier friendly
- Simple implementation
- No external dependencies

**Cons:**
- Slower (2-3 minutes total)
- Complex retry logic

### 2. 🚀 UPGRADE TO PAID TIER
Switch to Gemini API paid tier for higher limits:

| Tier | RPM | Cost |
|------|-----|------|
| Free | 10 | $0 |
| Paid | 1000 | ~$0.01/request |

**Implementation:**
```typescript
// No code changes needed!
// Just add payment method in Google AI Studio
```

**Pros:**
- 100x faster
- No artificial delays
- Better UX

**Cons:**
- Costs money (~$0.17 per enrichment)

### 3. 🔄 USE DIFFERENT MODEL
Switch to `gemini-1.5-flash` (has separate quota):

```typescript
const model = 'gemini-1.5-flash'; // Instead of gemini-2.0-flash-exp
```

**Pros:**
- Separate quota (another 10 RPM)
- Still free
- Can run 2x models in parallel

**Cons:**
- Still limited
- Older model (less capable)

### 4. 🎯 SMART CACHING
Cache common prompts and results:

```typescript
// Cache industry analysis, competitive data, etc.
const cached = await getCachedResult(cacheKey);
if (cached) return cached;
```

**Pros:**
- Reduces API calls
- Faster for repeat enrichments

**Cons:**
- Stale data
- Cache management complexity

## Recommended Approach

### Development (Current)
✅ **Batch processing + delays**
- Free
- Works for testing
- Accept slower enrichment

### Production (Future)
🚀 **Upgrade to paid tier**
- Fast enrichment (30 seconds)
- Better UX
- Scalable

## Implementation Status

### ✅ Completed
- [x] JSON parsing fix (markdown code fences)
- [x] Response MIME type forcing
- [x] UPSERT instead of INSERT
- [x] Error handling

### ⏳ Next Steps
1. Add batch processing with delays
2. Add retry logic with exponential backoff
3. Monitor API quota usage
4. Plan paid tier upgrade

## Rate Limit Error Handling

```typescript
try {
  const result = await model.generateContent(prompt);
  return parseGeminiJSON(result.response.text());
} catch (error) {
  if (error.status === 429) {
    // Rate limit hit
    const retryAfter = error.retryDelay || '60s';
    console.log(`⏳ Rate limit hit, retry after ${retryAfter}`);
    
    // Option 1: Throw and let Inngest retry
    throw error;
    
    // Option 2: Wait and retry here
    await sleep(parseRetryDelay(retryAfter));
    return await model.generateContent(prompt);
  }
  throw error;
}
```

## Cost Estimation (Paid Tier)

Assuming 17 modules x 1000 tokens avg = 17,000 tokens per enrichment:
- Input: ~10,000 tokens @ $0.075/1M = $0.00075
- Output: ~7,000 tokens @ $0.30/1M = $0.0021
- **Total: ~$0.003 per enrichment** (3 millistä senttiä!)

For 1000 enrichments/month: **~$3/month**

## References
- [Gemini API Rate Limits](https://ai.google.dev/gemini-api/docs/rate-limits)
- [Pricing](https://ai.google.dev/pricing)
- [Error Handling](https://ai.google.dev/gemini-api/docs/error-handling)

