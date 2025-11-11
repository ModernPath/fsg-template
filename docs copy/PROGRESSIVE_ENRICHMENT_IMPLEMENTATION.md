# 🚀 Progressive Company Financial Data Enrichment

## 📋 YHTEENVETO

**Ongelma:** Käyttäjä odottaa 30-60s kun rahoitusdataa haetaan (Puppeteer/Gemini).

**Ratkaisu:** 
1. Tallenna yritys heti perustiedoilla (2-5s)
2. Hae rahoitusdata taustalla (Inngest background job)
3. Päivitä frontend automaattisesti (Supabase Realtime)

---

## 🏗️ ARKKITEHTUURI

```
┌─────────────────────────────────────────────────────────────┐
│ PROGRESSIVE ENRICHMENT FLOW                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 1. POST /api/companies/create-fast                          │
│    ├─> Hae YTJ perustiedot (2-5s)                          │
│    ├─> Tallenna company (enrichment_status: 'pending')     │
│    ├─> Käynnistä Inngest job                               │
│    └─> Palauta company_id HETI ✅                          │
│                                                              │
│ 2. Inngest Background Job                                   │
│    ├─> Layer 0: Direct HTTP (5s)                           │
│    │   └─> Jos löytyy 3+ vuotta → Tallenna & STOP          │
│    ├─> Layer 1: Gemini Grounding (15s)                     │
│    │   └─> Jos löytyy 3+ vuotta → Tallenna & STOP          │
│    └─> Layer 3-4: Puppeteer (60s)                          │
│        └─> Tallenna mitä löytyy                             │
│                                                              │
│ 3. Frontend Realtime Updates                                │
│    ├─> Supabase Realtime subscription                       │
│    ├─> enrichment_status: 'enriching' → Show spinner       │
│    ├─> enrichment_status: 'enriched' → Update UI           │
│    └─> Progressive: Päivitä heti kun Layer 0/1 valmis      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 TARVITTAVAT TIEDOSTOT

### ✅ JO TEHTY:
1. `lib/inngest/functions/company-enrichment.ts` - Background job ✅
2. `supabase/migrations/20251015000000_add_company_enrichment_fields.sql` - DB fields ✅
3. `supabase/migrations/20251015000001_create_company_metrics.sql` - Metrics table ✅
4. `lib/inngest-functions.ts` - Rekisteröinti ✅

### 🔧 TARVITAAN VIELÄ:
1. **API Refactoring** - `app/api/companies/create-fast/route.ts` (uusi endpoint)
2. **Frontend Realtime** - Supabase Realtime subscription
3. **UI Updates** - Progressive loading spinner

---

## 💻 TOTEUTUS

### 1. API Endpoint (Nopea Vastaus)

```typescript
// app/api/companies/create-fast/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { inngest } from '@/lib/inngest-client';
import { fetchYTJData } from '@/lib/ytj-api'; // Oletetaan että tämä on olemassa

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [Create Fast] Starting...');
    
    // 1. Autentikointi
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient(undefined, true);
    const { data: { user } } = await supabase.auth.getUser(authHeader.split(' ')[1]);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request
    const { name, business_id, country_code } = await request.json();
    if (!name || !business_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log(`✅ [Create Fast] Creating company: ${name} (${business_id})`);

    // 3. Hae YTJ perustiedot (2-5s)
    const ytjData = await fetchYTJData(business_id);
    
    // 4. Tallenna yritys HETI (enrichment_status: 'pending')
    const { data: company, error } = await supabase
      .from('companies')
      .insert({
        name,
        business_id,
        country_code: country_code || 'FI',
        industry: ytjData?.mainBusinessLine,
        type: ytjData?.companyForm,
        website: ytjData?.website,
        address: ytjData?.address,
        created_by: user.id,
        enrichment_status: 'pending', // 🔑 KEY: Pending enrichment
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ [Create Fast] Company saved: ${company.id}`);

    // 5. Käynnistä background enrichment job
    await inngest.send({
      name: 'company/enrich.financial-data',
      data: {
        companyId: company.id,
        businessId: business_id,
        companyName: name,
        countryCode: country_code || 'FI',
      },
    });

    console.log(`✅ [Create Fast] Enrichment job started`);

    // 6. Palauta company HETI (ei odoteta rahoitusdataa!)
    return NextResponse.json({
      success: true,
      company: {
        id: company.id,
        name: company.name,
        business_id: company.business_id,
        enrichment_status: 'pending', // Frontend tietää että data tulossa
      },
      message: 'Company created. Financial data loading in background...',
    });

  } catch (error) {
    console.error('❌ [Create Fast] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

---

### 2. Frontend Realtime Updates

```typescript
// app/[locale]/dashboard/companies/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function CompanyPage({ params }: { params: { id: string } }) {
  const [company, setCompany] = useState<any>(null);
  const [enrichmentStatus, setEnrichmentStatus] = useState('pending');
  const [metrics, setMetrics] = useState<any[]>([]);

  useEffect(() => {
    const supabase = createClient();

    // 1. Lataa alkuperäinen data
    async function loadCompany() {
      const { data } = await supabase
        .from('companies')
        .select('*, company_metrics(*)')
        .eq('id', params.id)
        .single();
      
      setCompany(data);
      setEnrichmentStatus(data?.enrichment_status || 'pending');
      setMetrics(data?.company_metrics || []);
    }

    loadCompany();

    // 2. Tilaa Realtime päivitykset
    const companiesChannel = supabase
      .channel(`company-${params.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'companies',
          filter: `id=eq.${params.id}`,
        },
        (payload) => {
          console.log('🔄 Company updated:', payload.new);
          setCompany((prev: any) => ({ ...prev, ...payload.new }));
          setEnrichmentStatus(payload.new.enrichment_status);
        }
      )
      .subscribe();

    const metricsChannel = supabase
      .channel(`metrics-${params.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT tai UPDATE
          schema: 'public',
          table: 'company_metrics',
          filter: `company_id=eq.${params.id}`,
        },
        (payload) => {
          console.log('📊 Metrics updated:', payload.new);
          setMetrics((prev) => {
            const existing = prev.find((m) => m.year === payload.new.year);
            if (existing) {
              return prev.map((m) =>
                m.year === payload.new.year ? payload.new : m
              );
            }
            return [...prev, payload.new];
          });
        }
      )
      .subscribe();

    return () => {
      companiesChannel.unsubscribe();
      metricsChannel.unsubscribe();
    };
  }, [params.id]);

  return (
    <div>
      <h1>{company?.name}</h1>

      {/* Enrichment Status */}
      {enrichmentStatus === 'pending' && (
        <div className="bg-blue-50 p-4 rounded">
          ⏳ Queued for financial data enrichment...
        </div>
      )}
      {enrichmentStatus === 'enriching' && (
        <div className="bg-yellow-50 p-4 rounded animate-pulse">
          🔄 Loading financial data from multiple sources...
          <div className="text-sm mt-2">
            Method: {company?.enrichment_method || 'Trying multiple layers'}
          </div>
        </div>
      )}
      {enrichmentStatus === 'enriched' && (
        <div className="bg-green-50 p-4 rounded">
          ✅ Financial data loaded successfully!
          <div className="text-sm">
            Method: {company?.enrichment_method} • Confidence: {company?.enrichment_confidence}%
          </div>
        </div>
      )}
      {enrichmentStatus === 'failed' && (
        <div className="bg-red-50 p-4 rounded">
          ❌ Could not load financial data. Please try again later.
        </div>
      )}

      {/* Financial Metrics */}
      {metrics.length > 0 && (
        <div className="mt-6">
          <h2>Financial Data ({metrics.length} years)</h2>
          <table>
            <thead>
              <tr>
                <th>Year</th>
                <th>Revenue</th>
                <th>Profit</th>
                <th>Employees</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={m.year}>
                  <td>{m.year}</td>
                  <td>{m.revenue?.toLocaleString()} {m.currency}</td>
                  <td>{m.profit?.toLocaleString()} {m.currency}</td>
                  <td>{m.employees}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

---

## ⚙️ CONFIGURATION

### 1. Inngest Serve (API Route)

```typescript
// app/api/inngest/route.ts
import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest-client';
import { 
  helloWorld,
  publishScheduledPosts,
  enrichCompanyFinancialData, // 🔑 NEW
  // ... muut funktiot
} from '@/lib/inngest-functions';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    helloWorld,
    publishScheduledPosts,
    enrichCompanyFinancialData, // 🔑 LISÄÄ TÄMÄ
    // ... muut funktiot
  ],
});
```

### 2. Environment Variables

```bash
# .env.local
GOOGLE_AI_STUDIO_KEY=your_gemini_api_key
INNGEST_EVENT_KEY=your_inngest_event_key (optional for local dev)
```

---

## 🚀 KÄYTTÖÖNOTTO

### 1. Aja migrationit

```bash
supabase migration up --local
# tai production:
supabase db push
```

### 2. Testaa locally

```bash
# Terminal 1: Dev server
npm run dev

# Terminal 2: Inngest dev server
npx inngest-cli@latest dev

# Terminal 3: Testaa API
curl -X POST http://localhost:3000/api/companies/create-fast \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Oy", "business_id": "1234567-8", "country_code": "FI"}'
```

### 3. Seuraa lokeja

```bash
# Inngest dashboard: http://localhost:8288
# Näet background jobin etenemisen reaaliajassa
```

---

## 📊 HYÖDYT

| Ennen | Jälkeen |
|-------|---------|
| ⏳ 30-60s vastausaika | ✅ 2-5s vastausaika |
| ❌ Timeout jos Puppeteer kestää liian kauan | ✅ Ei timeouteja (background) |
| ❌ Käyttäjä odottaa tyhjää ruutua | ✅ Progressiivinen lataus |
| ❌ Yksi yritys kerrallaan | ✅ Voi luoda monta yritystä nopeasti |
| ❌ Jos epäonnistuu, ei tietoa miksi | ✅ Näkyy mikä layer epäonnistui |

---

## 🔄 MIGRATION PATH (Vanha → Uusi)

### Vaihe 1: Duaalitoteutus
- Säilytä vanha `/api/companies/create` (deprecated)
- Luo uusi `/api/companies/create-fast`
- Frontend voi valita kumman käyttää

### Vaihe 2: Frontend Migration
- Päivitä frontend käyttämään `create-fast`
- Lisää Realtime subscriptions

### Vaihe 3: Poista vanha
- Kun kaikki toimii, poista vanha endpoint

---

## 🐛 DEBUGGING

### Tarkista enrichment status

```sql
SELECT 
  id,
  name,
  enrichment_status,
  enrichment_method,
  enrichment_layers_attempted,
  enrichment_started_at,
  enrichment_completed_at
FROM companies
WHERE enrichment_status != 'enriched'
ORDER BY created_at DESC;
```

### Tarkista metrics

```sql
SELECT 
  c.name,
  cm.year,
  cm.revenue,
  cm.data_source,
  cm.confidence_score,
  cm.scraped_at
FROM companies c
LEFT JOIN company_metrics cm ON c.id = cm.company_id
ORDER BY c.created_at DESC, cm.year DESC;
```

---

## ✅ NEXT STEPS

1. **Aja migrationit** (`supabase db push`)
2. **Luo API endpoint** (`app/api/companies/create-fast/route.ts`)
3. **Lisää Inngest serve** (lisää `enrichCompanyFinancialData` listaan)
4. **Päivitä frontend** (Realtime subscriptions)
5. **Testaa lokaalisti** (Inngest dev server)
6. **Deploy** (Vercel + Inngest Cloud)

**Haluatko että autan jonkin näistä vaiheen kanssa?** 🚀

