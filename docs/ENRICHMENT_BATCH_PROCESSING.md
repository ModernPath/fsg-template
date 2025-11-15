# Enrichment Batch Processing System

## Overview

The company enrichment system processes **17 modules** using Gemini AI. To handle rate limits on the free tier (10 requests per minute), we split the processing into **2 batches** with a **60-second delay** between them.

## Batch Structure

```
┌─────────────────────────────────────────────────┐
│ BATCH 1: Base Modules (1-9)                   │
│ ⏱️ Duration: ~30-45 seconds                    │
│ 📊 API Calls: ~9 requests                      │
├─────────────────────────────────────────────────┤
│ ✅ Module 1: Basic Info                        │
│ ✅ Module 2: Financial Data                    │
│ ✅ Module 3: Industry Analysis                 │
│ ✅ Module 4: Competitive Analysis              │
│ ✅ Module 5: Growth Analysis                   │
│ ✅ Module 6: Financial Health                  │
│ ✅ Module 7: Personnel Info                    │
│ ✅ Module 8: Market Intelligence               │
│ ✅ Module 9: Web Presence                      │
└─────────────────────────────────────────────────┘
                      ⬇️
┌─────────────────────────────────────────────────┐
│ ⏳ RATE LIMIT DELAY: 60 seconds                │
│ 💡 TIP: Upgrade to paid tier for instant!      │
└─────────────────────────────────────────────────┘
                      ⬇️
┌─────────────────────────────────────────────────┐
│ BATCH 2: M&A Modules (10-17)                  │
│ ⏱️ Duration: ~30-45 seconds                    │
│ 📊 API Calls: ~8 requests                      │
├─────────────────────────────────────────────────┤
│ ✅ Module 10: M&A History                      │
│ ✅ Module 11: Valuation Data                   │
│ ✅ Module 12: Customer Intelligence            │
│ ✅ Module 13: Operational Efficiency           │
│ ✅ Module 14: Competitive Advantages           │
│ ✅ Module 15: Risk Assessment                  │
│ ✅ Module 16: Integration Potential            │
│ ✅ Module 17: Exit Attractiveness              │
└─────────────────────────────────────────────────┘
                      ⬇️
┌─────────────────────────────────────────────────┐
│ ✅ SAVE & COMPLETE                             │
│ ⏱️ Total Duration: ~2-3 minutes                │
└─────────────────────────────────────────────────┘
```

## Implementation

### Inngest Workflow

```typescript
// Batch 1: Process base modules (1-9)
console.log('⚡ [BATCH 1/2] Processing base enrichment modules...');
const [module1, module2, ..., module9] = await Promise.all([
  // All base modules execute in parallel
]);
console.log('✅ [BATCH 1/2] Base modules completed!');

// Rate limit delay
console.log('⏳ [RATE LIMIT] Waiting 60 seconds...');
await step.sleep('rate-limit-delay', 60000); // 60 seconds
console.log('✅ [RATE LIMIT] Delay complete!');

// Batch 2: Process M&A modules (10-17)
console.log('⚡ [BATCH 2/2] Processing M&A enrichment modules...');
const [module10, module11, ..., module17] = await Promise.all([
  // All M&A modules execute in parallel
]);
console.log('✅ [BATCH 2/2] M&A modules completed!');
```

### Why `step.sleep()`?

Inngest's `step.sleep()` is superior to JavaScript's `setTimeout()` because:

1. **Reliable**: Works across process restarts and server crashes
2. **Efficient**: Doesn't hold server resources during sleep
3. **Visible**: Shows up in Inngest dashboard with progress
4. **Resumable**: Workflow resumes exactly where it left off

## Rate Limit Behavior

### Free Tier (Current)
- **Limit:** 10 requests per minute
- **Strategy:** 2 batches with 60s delay
- **Duration:** ~2-3 minutes total
- **Cost:** $0
- **User Experience:** Acceptable for development

### Paid Tier (Production)
- **Limit:** 1000 requests per minute
- **Strategy:** Single batch, all 17 modules at once
- **Duration:** ~30-45 seconds total
- **Cost:** ~$3/month (1000 enrichments)
- **User Experience:** Excellent

## Error Handling

### Rate Limit Errors (429)
If a rate limit error still occurs:

```typescript
try {
  const result = await model.generateContent(prompt);
} catch (error) {
  if (error.status === 429) {
    // Inngest will automatically retry after the retryDelay
    console.log('⏳ Rate limit hit, Inngest will retry...');
    throw error; // Let Inngest handle the retry
  }
  throw error;
}
```

### Inngest Retry Policy
```typescript
{
  retries: 3,
  backoff: {
    type: 'exponential',
    base: 30000, // 30 seconds
    max: 300000  // 5 minutes
  }
}
```

## Monitoring

### Expected Logs

**Batch 1 Start:**
```
📊 [Step 3-11] Running Trusty Finance base modules (1-9)...
⚡ [BATCH 1/2] Processing base enrichment modules...
🏭 [Module 3] Enriching Industry Analysis...
⚔️ [Module 4] Enriching Competitive Analysis...
...
✅ [BATCH 1/2] Base modules completed!
```

**Rate Limit Delay:**
```
⏳ [RATE LIMIT] Waiting 60 seconds to avoid rate limit...
💡 [TIP] Upgrade to Gemini API paid tier for instant processing!
   Free tier: 10 req/min | Paid tier: 1000 req/min (~$3/month)
✅ [RATE LIMIT] Delay complete, continuing with M&A modules...
```

**Batch 2 Start:**
```
⚡ [BATCH 2/2] Processing M&A enrichment modules...
🔄 [Module 10] Enriching M&A History...
💎 [Module 11] Enriching Valuation...
...
✅ [BATCH 2/2] M&A modules completed!
```

**Final Save:**
```
💾 [Step 20] Saving enriched data...
✅ Data saved successfully
```

## Performance Metrics

| Metric | Free Tier | Paid Tier |
|--------|-----------|-----------|
| Total Duration | 2-3 minutes | 30-45 seconds |
| Batch 1 Duration | 30-45s | 30-45s |
| Delay Duration | 60s | 0s |
| Batch 2 Duration | 30-45s | - (all in one batch) |
| Success Rate | 95%+ | 99%+ |
| Cost per Enrichment | $0 | ~$0.003 |

## Upgrade Path

### When to Upgrade to Paid Tier?

**Upgrade if:**
- ✅ Moving to production
- ✅ User-facing enrichment
- ✅ >100 enrichments per month
- ✅ Need <1 minute processing time

**Stay on Free Tier if:**
- ✅ Development/testing only
- ✅ Background processing acceptable
- ✅ <100 enrichments per month
- ✅ Budget constraints

### Cost Analysis

**Free Tier:**
- Cost: $0
- Time per enrichment: 2-3 minutes
- Monthly capacity: Unlimited (with delays)

**Paid Tier:**
- Cost: ~$0.003 per enrichment
- Time per enrichment: 30-45 seconds
- Monthly cost examples:
  - 100 enrichments: ~$0.30
  - 1000 enrichments: ~$3.00
  - 10000 enrichments: ~$30.00

## Future Optimizations

### 1. Smart Batching
```typescript
// Analyze which modules can be cached or skipped
if (hasRecentEnrichment && !force) {
  console.log('🔄 Using cached enrichment data');
  return cachedData;
}
```

### 2. Priority Queueing
```typescript
// High-priority enrichments get instant processing
if (priority === 'high' && isPaidTier) {
  // Process all modules at once
} else {
  // Use batch processing
}
```

### 3. Partial Updates
```typescript
// Only re-enrich specified modules
if (modulesToUpdate) {
  await enrichSpecificModules(modulesToUpdate);
} else {
  await enrichAllModules();
}
```

### 4. Parallel Model Usage
```typescript
// Use both gemini-2.0-flash-exp and gemini-1.5-flash
// Each has separate rate limits
const batch1 = processWithModel('gemini-2.0-flash-exp', modules1_9);
const batch2 = processWithModel('gemini-1.5-flash', modules10_17);
await Promise.all([batch1, batch2]); // No delay needed!
```

## Troubleshooting

### Problem: Still getting 429 errors

**Possible causes:**
1. Multiple enrichments running simultaneously
2. Other API usage eating into quota
3. Quota reset timing

**Solution:**
- Increase delay to 90 seconds
- Use Inngest's built-in retry with exponential backoff
- Monitor API quota in Google AI Studio

### Problem: Enrichment takes too long

**Current:** 2-3 minutes (acceptable for free tier)

**Solutions:**
1. Upgrade to paid tier: **Best option**
2. Reduce number of modules
3. Cache common results
4. Use parallel models (gemini-2.0 + gemini-1.5)

### Problem: Workflow fails mid-batch

**Inngest handles this automatically:**
- Workflow resumes from last completed step
- Already processed modules are not re-run
- Delay timer continues correctly

## References

- [Inngest step.sleep() docs](https://www.inngest.com/docs/reference/functions/step-sleep)
- [Gemini API rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)
- [docs/GEMINI_RATE_LIMIT_SOLUTION.md](./GEMINI_RATE_LIMIT_SOLUTION.md)
- [docs/ENRICHMENT_FIXES_SUMMARY.md](./ENRICHMENT_FIXES_SUMMARY.md)

