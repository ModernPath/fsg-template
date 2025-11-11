# 🧠 Smart Gemini - Intelligent Model Selection

## Overview

**Smart Gemini** is an intelligent wrapper around Google's Gemini API that:
1. **Always uses the BEST available model**
2. **Automatically falls back** when quota is exceeded
3. **Never fails** - customer experience first!
4. **Learns** which models work best
5. **Adapts** to quota limitations in real-time

## The Problem It Solves

Without Smart Gemini:
```typescript
// ❌ Fails when quota is exceeded
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
const result = await model.generateContent(prompt);
// Error: 429 Too Many Requests - Quota exceeded
```

With Smart Gemini:
```typescript
// ✅ Automatically tries fallback models
const result = await smartGeminiGenerate(prompt);
// Uses gemini-2.5-flash, but falls back to gemini-2.5-flash-lite if quota exceeded
console.log(`Used: ${result.modelUsed}`); // gemini-2.5-flash-lite (fallback)
```

## Model Priority Tiers

Smart Gemini tries models in this order:

### 1. **gemini-2.5-flash** (Premium Latest) ⭐
- Latest and most capable (2025)
- Best quality results
- ✅ Generous quota (primary choice)
- **Most commonly used in practice**

### 2. **gemini-2.5-flash-lite** (Lightweight Fast)
- Ultra-fast and efficient
- Optimized for speed and volume
- ✅ Very generous quota (almost always available)
- **Perfect fallback and high-volume tasks**

## Usage

### Basic Usage

```typescript
import { smartGeminiGenerate } from '@/lib/ai-ecosystem/smart-gemini';

const result = await smartGeminiGenerate('Explain quantum physics', {
  temperature: 0.7
});

console.log(result.text);              // AI response
console.log(result.modelUsed);         // "gemini-2.5-flash"
console.log(result.fallbackUsed);      // true if not first model
console.log(result.attemptedModels);   // ["gemini-2.5-flash"]
```

### With JSON Output

```typescript
const result = await smartGeminiGenerate(
  'Extract financial data from this text: ...',
  {
    temperature: 0.1,  // Low for extraction
    responseMimeType: 'application/json'
  }
);

const data = JSON.parse(result.text);
console.log(`Extracted with ${result.modelUsed}`);
```

### Creative vs Precise Tasks

```typescript
// Creative task (strategy, brainstorming)
const strategy = await smartGeminiGenerate(prompt, {
  temperature: 0.7  // Higher = more creative
});

// Precise task (extraction, classification)
const extraction = await smartGeminiGenerate(prompt, {
  temperature: 0.1  // Lower = more conservative
});
```

## How It Works

```
User calls smartGeminiGenerate()
        ↓
Try gemini-2.0-flash-exp (best)
        ↓
    Success? → Return result
        ↓ No
    Quota error?
        ↓ Yes
Try gemini-exp-1206 (next best)
        ↓
    Success? → Return result
        ↓ No
Try gemini-1.5-flash (reliable)
        ↓
    Success? → Return result
        ↓ No
Try gemini-1.5-flash-8b (lightweight)
        ↓
    Success? → Return result
        ↓ No
Try gemini-1.5-pro (last resort)
        ↓
    Success? → Return result
        ↓ No
All models exhausted → Throw error
```

## Model Statistics

Smart Gemini tracks usage statistics for each model:

```typescript
import { getModelStats } from '@/lib/ai-ecosystem/smart-gemini';

const stats = getModelStats();
console.log(stats);
/*
[
  {
    modelName: 'gemini-1.5-flash',
    attempts: 150,
    successes: 145,
    quotaExceeded: 5,
    successRate: 96.7,
    lastUsed: Date,
    lastSuccess: Date,
    lastQuotaError: Date
  },
  ...
]
*/
```

## Recommendations

Get AI recommendation for best model to use:

```typescript
import { getRecommendedModel } from '@/lib/ai-ecosystem/smart-gemini';

const model = getRecommendedModel();
console.log(model); // "gemini-1.5-flash"
// Analyzes recent quota errors and success rates
```

## Integration Examples

### In AI Orchestrator

```typescript
// Strategy decision (creative)
const strategy = await smartGeminiGenerate(strategyPrompt, {
  temperature: 0.7,  // Creative
  responseMimeType: 'application/json'
});
console.log(`Strategy from ${strategy.modelUsed}`);

// Data extraction (precise)
const extraction = await smartGeminiGenerate(extractionPrompt, {
  temperature: 0.1,  // Precise
  responseMimeType: 'application/json'
});
console.log(`Extracted with ${extraction.modelUsed}`);
```

### In API Endpoints

```typescript
// /app/api/ai-ecosystem/insights/route.ts
const analysis = await smartGeminiGenerate(analysisPrompt, {
  temperature: 0.7,
  responseMimeType: 'application/json'
});

return NextResponse.json({
  insights: JSON.parse(analysis.text),
  modelUsed: analysis.modelUsed,
  fallbackUsed: analysis.fallbackUsed
});
```

## Error Handling

Smart Gemini distinguishes between:

### Quota Errors (Automatic Fallback)
- HTTP 429
- "quota exceeded"
- "rate limit"
- "resource exhausted"

→ **Automatically tries next model**

### Other Errors (Stop Trying)
- Invalid prompt
- Content policy violation
- Network errors

→ **Throws error immediately** (no point trying other models)

## Benefits

### 1. **Always Available**
Never fails due to quota - automatically finds working model

### 2. **Best Quality When Possible**
Uses latest models when quota available

### 3. **Cost Efficient**
Falls back to lighter models when premium quota exhausted

### 4. **Customer Experience First**
System never says "quota exceeded" to users

### 5. **Transparent**
Always tells you which model was used

### 6. **Self-Learning**
Tracks which models work best

## Configuration

Models are defined in `/lib/ai-ecosystem/smart-gemini.ts`:

```typescript
const MODEL_TIERS = [
  {
    name: 'gemini-2.0-flash-exp',
    description: 'Latest and most capable',
    tier: 'premium',
    quotaLevel: 'limited'
  },
  // Add new models here as they become available
];
```

## Monitoring

```typescript
import { getModelStats, resetModelStats } from '@/lib/ai-ecosystem/smart-gemini';

// View stats
const stats = getModelStats();
console.log('Success rates:', stats.map(s => ({
  model: s.modelName,
  rate: s.successRate
})));

// Reset after quota renewal
resetModelStats();
```

## Best Practices

### 1. Let Smart Gemini Choose
```typescript
// ✅ Good - auto-fallback
await smartGeminiGenerate(prompt);

// ❌ Bad - hardcoded model
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
await model.generateContent(prompt); // Fails when quota exceeded
```

### 2. Set Appropriate Temperature
```typescript
// Creative tasks
temperature: 0.7-0.9

// Extraction/Classification  
temperature: 0.1-0.3
```

### 3. Request JSON When Needed
```typescript
responseMimeType: 'application/json'
// Ensures consistent JSON output
```

### 4. Check Which Model Was Used
```typescript
const result = await smartGeminiGenerate(prompt);
console.log(`Used: ${result.modelUsed}`);
if (result.fallbackUsed) {
  console.log('Premium quota exhausted, using fallback');
}
```

## Future Enhancements

Potential improvements:
1. **Database persistence** - Store stats in database
2. **Quota prediction** - Predict when quotas will reset
3. **Model routing** - Route different task types to optimal models
4. **Cost tracking** - Track API costs per model
5. **A/B testing** - Test quality differences between models

## Comparison

### Without Smart Gemini
```typescript
try {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  const result = await model.generateContent(prompt);
  return result.response.text();
} catch (error) {
  if (error.includes('quota')) {
    // Manual fallback
    try {
      const fallback = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result2 = await fallback.generateContent(prompt);
      return result2.response.text();
    } catch (error2) {
      // And so on...
    }
  }
  throw error;
}
```

### With Smart Gemini
```typescript
const result = await smartGeminiGenerate(prompt);
return result.text;
// That's it! Auto-fallback handled.
```

---

**Smart Gemini: Because your users shouldn't care about quota limits.** 🧠✨

