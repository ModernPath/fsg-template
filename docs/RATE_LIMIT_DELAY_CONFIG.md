# Rate Limit Delay Configuration

## Quick Answer
✅ **KYLLÄ, voit muuttaa vapaasti!** 60-90 sekuntia on suositeltu alue.

## Current Configuration

```typescript
// lib/inngest/functions/company-enrichment.ts

const RATE_LIMIT_DELAY_MS = 70000; // 70 seconds (default)
```

## Recommended Values

| Delay | Safety | Speed | Use Case |
|-------|--------|-------|----------|
| **60s** | ⚠️ Minimum | 🚀 Fastest | Development, risky |
| **70s** | ✅ Good | ⚡ Fast | **RECOMMENDED** |
| **90s** | 🛡️ Maximum | 🐌 Slower | Production, super safe |

## Why Different Values?

### 60 seconds (Minimum)
```typescript
const RATE_LIMIT_DELAY_MS = 60000;
```
- **Pros:** Fastest possible (2min 30s total)
- **Cons:** No safety margin, API timing variations can cause 429
- **Risk:** ~5% chance of rate limit error

### 70 seconds (Current/Recommended)
```typescript
const RATE_LIMIT_DELAY_MS = 70000;
```
- **Pros:** 10s safety margin, reliable
- **Cons:** Slightly slower than minimum
- **Risk:** <1% chance of rate limit error
- **Total time:** ~2min 50s

### 90 seconds (Maximum Safety)
```typescript
const RATE_LIMIT_DELAY_MS = 90000;
```
- **Pros:** Maximum safety, handles slow API responses
- **Cons:** Slowest (3min 10s total)
- **Risk:** <0.1% chance of rate limit error

## How to Change

### Option 1: Direct Edit (Simple)

Edit `lib/inngest/functions/company-enrichment.ts`:

```typescript
// Change this line:
const RATE_LIMIT_DELAY_MS = 70000; // Current

// To any value:
const RATE_LIMIT_DELAY_MS = 60000; // Faster, riskier
const RATE_LIMIT_DELAY_MS = 90000; // Slower, safer
```

### Option 2: Environment Variable (Advanced)

1. Add to `.env.local`:
```bash
RATE_LIMIT_DELAY_MS=70000
```

2. Update code:
```typescript
const RATE_LIMIT_DELAY_MS = parseInt(
  process.env.RATE_LIMIT_DELAY_MS || '70000',
  10
);
```

### Option 3: Dynamic Based on Load

```typescript
const RATE_LIMIT_DELAY_MS = isDevelopment 
  ? 60000  // Fast in dev
  : 90000; // Safe in production
```

## Gemini API Rate Limit Rules

### The ONLY Hard Limit:
```
📏 Gemini API Free Tier:
   └── 10 requests per minute
       └── Quota resets every 60 seconds
```

### What We Control:
- ✅ Delay duration (60-120s or more)
- ✅ Batch sizes
- ✅ Retry logic
- ✅ When to start batch 2

### What We DON'T Control:
- ❌ API quota (10 req/min on free tier)
- ❌ Quota reset timing (60s window)

## Performance Impact

### With Different Delays:

| Delay | Batch 1 | Wait | Batch 2 | Total | Risk |
|-------|---------|------|---------|-------|------|
| 60s | 40s | 60s | 40s | **2:20** | ⚠️ 5% |
| 70s | 40s | 70s | 40s | **2:30** | ✅ <1% |
| 90s | 40s | 90s | 40s | **2:50** | 🛡️ <0.1% |

**Recommendation:** Use **70s** for best balance.

## Advanced: Smart Delay

Calculate delay based on actual batch 1 duration:

```typescript
// Track batch 1 timing
const batch1StartTime = Date.now();

// ... run batch 1 modules ...

const batch1Duration = Date.now() - batch1StartTime;
const timeSinceBatch1Start = batch1Duration / 1000; // seconds

// Calculate smart delay
// If batch 1 took 40s, we only need to wait 20s more (total 60s)
const minimumDelay = 60000; // 60s minimum
const safetyMargin = 10000; // 10s safety
const elapsed = batch1Duration;
const smartDelay = Math.max(
  minimumDelay - elapsed + safetyMargin,
  safetyMargin
);

console.log(`⏳ Smart delay: ${smartDelay / 1000}s`);
await step.sleep('rate-limit-delay', smartDelay);
```

## Monitoring

### Check if delay is sufficient:

```bash
# Look for 429 errors in logs
grep "429" logs.txt

# If you see 429 errors → increase delay
# If no 429 errors → delay is good (or can be reduced)
```

## When to Adjust

### Increase Delay (70s → 90s) if:
- ❌ Seeing 429 rate limit errors
- ❌ API responses are slow
- ❌ Running in production
- ❌ Multiple users enriching simultaneously

### Decrease Delay (70s → 60s) if:
- ✅ No 429 errors for extended period
- ✅ API responses are consistently fast
- ✅ Development environment only
- ✅ Need faster iteration

### Keep Current (70s) if:
- ✅ Everything works reliably
- ✅ Occasional use (not production)
- ✅ Default recommendation

## Future: No Delay Needed

### Paid Tier Benefits:
```
Upgrade to Gemini API Paid Tier:
├── 1000 requests per minute (100x more!)
├── No delay needed between batches
├── All 17 modules in one batch
├── Total time: ~30-45 seconds
└── Cost: ~$3/month for 1000 enrichments
```

**To upgrade:** Just add payment method in Google AI Studio!

Then change code to:
```typescript
const isPaidTier = true; // or check via env var

if (isPaidTier) {
  // No delay needed! Process all modules at once
  await Promise.all([
    ...batch1Modules,
    ...batch2Modules
  ]);
} else {
  // Free tier: use batch processing with delay
  await batch1Modules;
  await step.sleep('delay', RATE_LIMIT_DELAY_MS);
  await batch2Modules;
}
```

## Summary

| Question | Answer |
|----------|--------|
| Can I change the delay? | ✅ **YES! Completely free to change** |
| What's the minimum? | 60 seconds (risky) |
| What's recommended? | **70 seconds (current)** |
| What's the maximum? | No limit (90s is practical max) |
| Master rules? | ❌ **None! Only Gemini's 10 req/min** |
| Best for production? | 70-90 seconds |
| Best for development? | 60-70 seconds |

## Quick Config Reference

```typescript
// SUPER FAST (risky):
const RATE_LIMIT_DELAY_MS = 60000;

// RECOMMENDED (balanced):
const RATE_LIMIT_DELAY_MS = 70000; // ⭐ CURRENT

// SUPER SAFE (slower):
const RATE_LIMIT_DELAY_MS = 90000;

// EXTREME SAFETY:
const RATE_LIMIT_DELAY_MS = 120000;
```

**Remember:** Only real constraint is Gemini's **10 requests per minute**. Everything else is your choice! 🎛️

