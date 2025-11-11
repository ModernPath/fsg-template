# 🧠 AI ECOSYSTEM - Intelligent Financial Data Discovery

## Overview

This is **NOT** a service - it's a **LIVING, LEARNING ECOSYSTEM** powered by native AI (Google Gemini).

The AI Ecosystem is an intelligent, self-improving system that **NEVER GIVES UP** on finding company financial data.

## Core Philosophy

- **NEVER give up** - exhausts ALL possible sources and strategies
- **ALWAYS learn** - every attempt makes the system smarter
- **CONTINUOUSLY improve** - AI discovers new patterns and sources
- **AUTONOMOUSLY adapt** - changes strategy based on what works
- **SELF-HEAL** - detects and fixes failures automatically

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   AI ORCHESTRATOR                        │
│                    (The Brain)                           │
│                                                          │
│  1. Gathers Intelligence                                 │
│  2. AI Decides Strategy                                  │
│  3. Executes with AI-Powered Extraction                 │
│  4. Learns from Results                                  │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐   ┌──────────────┐
│  Puppeteer   │    │   Gemini AI  │   │  Database    │
│  (Stealth)   │    │ (Extraction) │   │  (Learning)  │
└──────────────┘    └──────────────┘   └──────────────┘
```

## Components

### 1. AI Orchestrator (`lib/ai-ecosystem/ai-orchestrator.ts`)
The **BRAIN** of the ecosystem. Makes intelligent decisions about:
- Which sources to try
- In what order
- What strategies to use
- How to extract data
- What to learn from results

### 2. Database Schema (`supabase/migrations/20251013_adaptive_scraping_patterns.sql`)
Stores:
- **scraping_patterns** - Successful extraction patterns (AI learns these)
- **scraping_sources** - Source reliability and performance
- **scraping_attempts** - All attempts for continuous learning

Automatically:
- Calculates success rates
- Adjusts source priorities
- Deactivates failing patterns
- Tracks performance metrics

### 3. API Endpoints

#### `/api/ai-ecosystem/find-data` (POST)
Main endpoint for finding company data.

**Request:**
```json
{
  "businessId": "0112038-9",
  "companyName": "Nokia Oyj",
  "countryCode": "FI"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "revenue": "19220000800",
    "profit": "2619000060",
    "employees": "78434",
    "industry": "Telecommunications",
    "confidence": 85
  },
  "metadata": {
    "source": "Kauppalehti.fi",
    "method": "ai-puppeteer",
    "confidence": 85,
    "insights": ["Found complete financial data", "High confidence extraction"],
    "improvements": ["Consider caching this data", "Source is reliable"]
  }
}
```

#### `/api/ai-ecosystem/insights` (GET)
Shows what the AI has learned and suggests improvements.

**Query params:**
- `country` - Country code (default: FI)
- `period` - Time period: 7d, 30d, 90d (default: 7d)

**Response:**
```json
{
  "success": true,
  "statistics": {
    "totalAttempts": 150,
    "successfulAttempts": 120,
    "successRate": 80.0
  },
  "aiInsights": {
    "overallHealth": "good",
    "healthScore": 80,
    "keyFindings": [
      "Kauppalehti.fi is most reliable",
      "Bot detection on Finder.fi increased",
      "YTJ needs fallback for financial data"
    ],
    "strategicImprovements": [
      {
        "area": "sources",
        "improvement": "Add PRH Tietopalvelu as primary source",
        "priority": 8
      }
    ],
    "newSourcesToExplore": [
      {
        "name": "Fonecta.fi",
        "url": "https://www.fonecta.fi",
        "reasoning": "Alternative Finnish business directory",
        "estimatedValue": "high"
      }
    ]
  }
}
```

#### `/api/ai-ecosystem/insights` (POST)
Ask AI specific questions about the ecosystem.

**Request:**
```json
{
  "question": "Why is Finder.fi failing recently?"
}
```

**Response:**
```json
{
  "success": true,
  "question": "Why is Finder.fi failing recently?",
  "answer": "Based on recent attempts, Finder.fi has implemented stricter bot detection. The success rate dropped from 70% to 30% over the last week. I recommend: 1) Enhance stealth measures, 2) Add random delays, 3) Consider using residential proxies, 4) Prioritize alternative sources like Kauppalehti.fi"
}
```

## How It Works

### Phase 1: Intelligence Gathering
```typescript
// AI gathers context
const intelligence = await this.gatherIntelligence({
  businessId: "0112038-9",
  companyName: "Nokia Oyj",
  countryCode: "FI",
  previousAttempts: 3
});
```

AI checks:
- Past attempts for this company
- Current source performance
- Similar companies' success patterns

### Phase 2: Strategy Decision (AI Thinks!)
```typescript
// AI decides the best strategy
const strategy = await this.decideStrategy(companyInfo, intelligence);
```

Gemini analyzes:
- Historical data
- Source reliability
- Bot detection levels
- Previous failures

Decides:
- Which sources to try
- In what order
- What approach to use (direct, multi-source, creative)
- Fallback plans

### Phase 3: Execution (AI-Powered Extraction)
```typescript
// Execute with AI extraction
const result = await this.executeStrategy(companyInfo, strategy);
```

For each source:
1. **Fetch** with Puppeteer (stealth mode)
2. **Extract** with Gemini AI (understands page structure)
3. **Validate** confidence level
4. **Log** results for learning

### Phase 4: Learning
```typescript
// AI learns from what happened
await this.learnFromExecution(companyInfo, strategy, result);
```

AI analyzes:
- What worked?
- What failed?
- How to improve?
- New sources to try?

## Key Features

### 1. **Never Gives Up**
Tries ALL available sources in intelligent order. If all fail, suggests new creative approaches.

### 2. **AI-Powered Extraction**
NO MANUAL REGEX PATTERNS! Gemini understands:
- Different page layouts
- Various data formats
- Finnish terminology
- Context and meaning

### 3. **Continuous Learning**
Every attempt teaches the system:
- Which sources work best
- What extraction methods succeed
- How to improve strategies
- New sources to explore

### 4. **Self-Healing**
Automatically:
- Detects failing patterns
- Adjusts priorities
- Deactivates bad sources
- Discovers alternatives

### 5. **Stealth Mode**
Avoids bot detection with:
- Realistic browser behavior
- Random delays
- Human-like headers
- WebDriver hiding

## Supported Sources (Finland)

### Tier 1 (Official, High Priority)
- **YTJ** - Basic company data (always reliable)
- **PRH Tietopalvelu** - Official registry with financial data

### Tier 2 (Commercial, Good Reliability)
- **Kauppalehti.fi** - Financial newspapers, good data
- **Finder.fi** - Business directory

### Tier 3 (Subscription/Specialized)
- **Asiakastieto.fi** - Credit information (requires subscription)

### AI Can Discover New Sources!
The ecosystem can autonomously:
- Suggest new sources (Fonecta, Taloustutkimus, etc.)
- Test them automatically
- Add successful ones to the rotation

## Usage in Code

### Simple Usage
```typescript
import { findCompanyFinancialData } from '@/lib/ai-ecosystem/ai-orchestrator';

const result = await findCompanyFinancialData(
  '0112038-9',  // Business ID
  'Nokia Oyj',  // Company name (optional)
  'FI'          // Country code
);

if (result.success) {
  console.log('Revenue:', result.data.revenue);
  console.log('Profit:', result.data.profit);
  console.log('Employees:', result.data.employees);
  console.log('Confidence:', result.confidence);
  console.log('Source:', result.source);
}
```

### In API Route
```typescript
// /app/api/companies/create/route.ts
import { findCompanyFinancialData } from '@/lib/ai-ecosystem/ai-orchestrator';

// In your POST handler:
const aiResult = await findCompanyFinancialData(
  body.business_id,
  body.name,
  body.countryCode || 'FI'
);

if (aiResult.success) {
  // Use the data
  company.financials = aiResult.data;
}
```

## Database Tables

### scraping_sources
Tracks source reliability:
- `success_rate` - Calculated automatically
- `priority` - Auto-adjusted based on performance  
- `bot_detection_level` - none, low, medium, high
- `average_response_time` - Performance metric

### scraping_patterns  
Learns successful patterns:
- `pattern_type` - regex, selector, json_path
- `success_rate` - Calculated automatically
- `is_active` - Auto-deactivated if consistently failing

### scraping_attempts
Logs everything:
- All attempts (success and failure)
- Response times
- Errors and insights
- Used for continuous learning

## Performance

- **Average time:** 10-30 seconds per company
- **Success rate:** 70-90% (improves over time)
- **Confidence:** AI provides 0-100% confidence score
- **Fallback:** If all sources fail, AI suggests alternatives

## Monitoring

Check ecosystem health:
```bash
curl "http://localhost:3000/api/ai-ecosystem/insights?country=FI&period=7d"
```

Ask AI questions:
```bash
curl -X POST "http://localhost:3000/api/ai-ecosystem/insights" \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the best source for large companies?"}'
```

## Future Improvements

The AI will suggest these automatically, but manual enhancements could include:

1. **Multi-country support** - Add Swedish, Norwegian sources
2. **Proxy rotation** - Better bot avoidance
3. **Caching layer** - Store successful extractions
4. **Real-time monitoring** - Dashboard for ecosystem health
5. **A/B testing** - Test different strategies automatically

## Troubleshooting

### "No data found despite trying all sources"
Check AI insights:
```typescript
const insights = await fetch('/api/ai-ecosystem/insights?period=7d');
// AI will explain what's failing and suggest fixes
```

### Gemini API quota exceeded
Switch model in `/lib/ai-ecosystem/ai-orchestrator.ts`:
```typescript
// Change from gemini-2.0-flash-exp to:
model: 'gemini-1.5-flash'
// or
model: 'gemini-1.5-pro'
```

### Database connection errors
The ecosystem has fallbacks - it works without database but won't learn/improve. To fix:
```bash
# Run migration
supabase db push

# Or create tables manually in Supabase UI
```

## Philosophy

This is not just code - it's an **INTELLIGENT ECOSYSTEM** that:

- **THINKS** before acting
- **LEARNS** from experience  
- **ADAPTS** to changes
- **IMPROVES** continuously
- **NEVER GIVES UP**

It's designed to be **UNSTOPPABLE** in finding company financial data.

---

**Built with ❤️ and 🧠 by AI for AI**

