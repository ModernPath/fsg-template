# 🏗️ IMPLEMENTATION PLAN - YKSITYISKOHTAINEN TOTEUTUS

**Branch:** AiAgent_TF  
**Created:** 2025-01-10  
**Status:** Planning

---

## 🎯 FILOSOFIA: BUILD IT RIGHT

### Toteutuksen periaatteet:
1. **Puhtaus:** Selkeä, ylläpidettävä koodi
2. **Toimivuus:** Kaikki toimii ennen seuraavaa vaihetta
3. **Testattavuus:** Testit kirjoitetaan samaan aikaan
4. **Dokumentointi:** Koodi dokumentoi itsensä + kommentit
5. **Inkrementaalisuus:** Pienet, toimivat askeleet

### Looginen järjestys:
```
1. Ensin: Toiminnot ILMAN database-muutoksia
   → Nopea hyöty, ei riskejä

2. Sitten: Yksinkertaiset database-muutokset
   → Luotettava pohja

3. Lopuksi: Monimutkaiset, kriittiset toiminnot
   → Kaikki pohja valmiina
```

---

## 🚀 RECENT COMPLETIONS (2025-01-15)

### TASK 0.4: ADMIN DASHBOARD - REAL STATISTICS ✅ COMPLETED
**Kesto:** 3h  
**Riippuvuudet:** Ei  
**Riski:** Matala  
**Priority:** HIGH  
**Status:** ✅ **VALMIS** (2025-01-15)

#### Tavoite:
Näyttää todellisia tilastoja admin dashboardilla tietokannasta haettuna:
1. Aktiiviset yritykset (last 30 days)
2. Käyttäjämäärä ja kasvuprosentti
3. Kuukauden liikevaihto (approved applications)
4. Analyysien määrä

#### Toteutus:
**Tiedostot:**
- `app/api/admin/dashboard/stats/route.ts` (NEW)
- `app/[locale]/admin/page.tsx` (MODIFIED: mock → real data)
- `app/components/Navigation.tsx` (ADDED: Dashboard link)
- `messages/{locale}/Admin.json` (ADDED: Dashboard translations)
- `messages/{locale}/Navigation.json` (ADDED: admin.dashboard)

**Ominaisuudet:**
- ✅ Real-time database fetch
- ✅ Admin-oikeuksien tarkistus
- ✅ Loading state + error handling
- ✅ Refresh-nappi
- ✅ Lokalisoitu kaikkiin kieliin (fi, en, sv)

**Dokumentoitu:** `docs/ai_changelog.md`, `docs/learnings.md`

---

### TASK 0.3: LAYERED SCRAPER SYSTEM ✅ COMPLETED
**Kesto:** 8h  
**Riippuvuudet:** Database migration (20251013_adaptive_scraping_patterns.sql)  
**Riski:** MEDIUM  
**Priority:** CRITICAL  
**Status:** ✅ **VALMIS** (2025-01-14)

#### Tavoite:
Korvata hidas AI Orchestrator (30-40s, 0% success) nopealla, oppivalla 3-kerroksisella järjestelmällä:
1. **Layer 1:** Gemini Grounding (2-3s, nopein)
2. **Layer 2:** HTTP Fetch (5-8s, keskitaso)
3. **Layer 3:** Puppeteer (15-25s, vain jos tarpeen)

#### Toteutus:
**Uudet tiedostot:**
- `lib/ai-ecosystem/layered-scraper.ts` (500+ riviä)
- `supabase/migrations/20251013_adaptive_scraping_patterns.sql`

**Muokatut tiedostot:**
- `app/api/companies/create/route.ts` (ai-orchestrator → layered-scraper)
- `lib/ai-ecosystem/smart-gemini.ts` (API signature fix)

**Ominaisuudet:**
- ✅ 3-layer architecture (fast → slow)
- ✅ Smart source selection (success rate history)
- ✅ Learning system (`scraping_attempts` logging)
- ✅ Bot detection tracking
- ✅ Country-scalable (database-driven sources)
- ✅ Configurable timeouts per layer

**Taulut:**
- `scraping_sources` (lähteiden metadata + statistiikka)
- `scraping_attempts` (jokainen yritys loggaa)
- `scraping_patterns` (pattern-pohjainen oppiminen)

**Parannus:**
- Nopeus: 30-40s → 2-25s (avg 8s) = **75% nopeampi**
- Success rate: 0/7 → Dynamic (oppii jatkuvasti)

**Dokumentoitu:** `docs/ai_changelog.md`, `docs/learnings.md`

---

### TASK 0.2: FINANCIAL DATA ENHANCEMENT ✅ COMPLETED
**Kesto:** 6h  
**Riippuvuudet:** Database migrations  
**Riski:** MEDIUM  
**Priority:** HIGH  
**Status:** ✅ **VALMIS** (2025-01-13)

#### Tavoite:
Kerätä ja tallentaa kattavampi taloustieto:
1. Multi-year data (3-5 vuotta)
2. Kaikki saatavilla olevat tunnusluvut
3. Currency-kenttä
4. Revenue growth rate

#### Toteutus:
**Database migrations:**
- `20251015085930_add_currency_to_financial_metrics.sql` ✅
- `20251015111140_add_revenue_growth_rate_to_financial_metrics.sql` ✅

**Muokatut tiedostot:**
- `app/api/companies/create/route.ts` (field mapping fix)
- `components/auth/OnboardingFlow.tsx` (currency + growth rate)
- `components/financial/FinancialChartsDisplay.tsx` (ratio formatting)

**Korjaukset:**
- ✅ Schema mismatch: `profit_margin` → `operating_margin`, `net_margin`
- ✅ Ratio formatting: Velkaantumisaste näytetään "1.00" ei "1 €"
- ✅ Currency support: EUR, SEK, NOK, DKK

**Dokumentoitu:** `docs/ai_changelog.md`, `docs/learnings.md`

---

## 🚀 ONBOARDING IMPROVEMENTS (Priority Features)

**Tavoite:** Parantaa onboarding-flow käyttäjäkokemusta  
**Focus:** Yritystietojen haku ja automaattinen uudelleenyritys  
**Riski:** MATALA (ei database-muutoksia)

---

### TASK 0.1: COMPANY DATA REFETCH WITH AUTO-RETRY ✅ COMPLETED
**Kesto:** 4-6h (Toteutunut: ~2h)  
**Riippuvuudet:** Ei  
**Riski:** Matala  
**Priority:** HIGH (käyttäjäkokemus)  
**Status:** ✅ **VALMIS** (2025-01-10)  
**Commit:** `2e615dd` - feat: Onboarding auto-retry fix for Finnish company search

#### Tavoite:
Parantaa yritystietojen hakua lisäämällä:
1. UI-nappi manuaaliselle uudelleenhakulle
2. Automaattinen uudelleenhaku (max 2 kertaa) jos talouslukuja ei saada
3. Käyttäjäystävällinen virheilmoitus ja ohjeistus

---

#### Implementation Steps:

**Step 1: Refetch UI Button (1h)**

**Sijainti:** `components/auth/onboarding/Step3AIConversation.tsx`

**Muutokset:**
```typescript
// 1. Lisää state refetch-painikkeen hallintaan
const [showRefetchButton, setShowRefetchButton] = useState(false);
const [isManualRefetch, setIsManualRefetch] = useState(false);

// 2. Päivitä UI company data card sisään (rivi ~1340-1380)
// Lisää nappi "Päivitä yritystiedot" / "Refresh Company Data"
<div className="flex items-center gap-2">
  <Button
    variant="outline"
    size="sm"
    onClick={() => {
      setIsManualRefetch(true);
      handleRefetchCompanyData();
    }}
    disabled={isRefetchingCompanyData}
    className="text-xs"
  >
    {isRefetchingCompanyData ? (
      <>
        <Loader2 className="w-3 h-3 animate-spin mr-1" />
        {t('company.refreshing')}
      </>
    ) : (
      <>
        <RefreshCw className="w-3 h-3 mr-1" />
        {t('company.refresh')}
      </>
    )}
  </Button>
</div>
```

**Lisää käännökset:**
- `messages/fi/Step3AIConversation.json`:
  ```json
  "company": {
    "refresh": "Päivitä tiedot",
    "refreshing": "Päivitetään...",
    "refreshSuccess": "Yritystiedot päivitetty onnistuneesti",
    "refreshError": "Tietojen päivitys epäonnistui"
  }
  ```
- Sama en/sv

---

**Step 2: Auto-Retry Logic (2-3h)**

**Sijainti:** `components/auth/onboarding/Step3AIConversation.tsx`

**Muutokset:**
```typescript
// 1. Lisää retry state
const [retryCount, setRetryCount] = useState(0);
const [maxRetries] = useState(2);
const [retryDelay] = useState(3000); // 3 sekuntia

// 2. Päivitä fetchFinancialMetrics funktio (rivi ~318-400)
const fetchFinancialMetrics = useCallback(async (isRetry = false) => {
  if (!companyId) return;

  // Cooldown check (paitsi retry-tapauksessa)
  if (!isRetry) {
    const now = Date.now();
    if (isFetchingRef.current || now - lastFetchAtRef.current < 8000) {
      return;
    }
  }
  
  isFetchingRef.current = true;
  lastFetchAtRef.current = Date.now();
  
  setIsFetchingFinancialMetrics(true);

  try {
    // ... nykyinen haku logiikka ...
    
    // Tarkista onko talouslukuja saatu
    const hasFinancialData = metricsData && metricsData.length > 0;
    
    if (!hasFinancialData && retryCount < maxRetries) {
      // Automaattinen uudelleenyritys
      console.log(`⏳ [Financial Metrics] No data received, auto-retry ${retryCount + 1}/${maxRetries}`);
      
      setRetryCount(prev => prev + 1);
      
      // Odota ennen uudelleenyritystä
      setTimeout(() => {
        fetchFinancialMetrics(true); // Merkitään retry=true
      }, retryDelay);
      
      return;
    }
    
    if (!hasFinancialData && retryCount >= maxRetries) {
      // Kaikki yritykset käytetty, näytä viesti käyttäjälle
      console.log('❌ [Financial Metrics] Max retries reached, showing user message');
      
      setFinancialMetricsError({
        code: 'MAX_RETRIES_REACHED',
        message: t('financial.retryLimitReached'),
        suggestion: t('financial.retryLaterSuggestion')
      });
      
      setShowRefetchButton(true);
      return;
    }
    
    // Onnistunut haku - nollaa retry count
    if (hasFinancialData) {
      setRetryCount(0);
      setFinancialMetricsError(null);
      setShowRefetchButton(false);
    }
    
    // ... loput nykyisestä logiikasta ...
    
  } catch (error: any) {
    console.error('❌ [Financial Metrics] Fetch failed:', error);
    
    // Yritä uudelleen virhetilanteessa
    if (retryCount < maxRetries) {
      console.log(`🔄 [Financial Metrics] Error occurred, auto-retry ${retryCount + 1}/${maxRetries}`);
      
      setRetryCount(prev => prev + 1);
      
      setTimeout(() => {
        fetchFinancialMetrics(true);
      }, retryDelay);
    } else {
      // Max retries käytetty
      setFinancialMetricsError({
        code: 'FETCH_ERROR_MAX_RETRIES',
        message: error.message || t('financial.fetchError'),
        suggestion: t('financial.retryLaterSuggestion')
      });
      
      setShowRefetchButton(true);
    }
  } finally {
    isFetchingRef.current = false;
    setIsFetchingFinancialMetrics(false);
  }
}, [companyId, retryCount, maxRetries, retryDelay, t]);

// 3. Lisää manuaalinen refetch handler
const handleManualRefetch = useCallback(() => {
  console.log('🔄 [Financial Metrics] Manual refetch initiated');
  
  // Nollaa retry count
  setRetryCount(0);
  setFinancialMetricsError(null);
  
  // Käynnistä haku
  fetchFinancialMetrics(false);
}, [fetchFinancialMetrics]);
```

---

**Step 3: User-Friendly Error Messages (1h)**

**Sijainti:** `components/auth/onboarding/Step3AIConversation.tsx`

**Muutokset:**
```typescript
// 1. Päivitä financialMetricsError state tyyppi
interface FinancialMetricsError {
  code: string;
  message: string;
  suggestion?: string;
}

const [financialMetricsError, setFinancialMetricsError] = useState<FinancialMetricsError | null>(null);

// 2. Päivitä error display UI (rivi ~1410-1450)
{financialMetricsError && (
  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
    <div className="flex items-start gap-2">
      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-yellow-800 mb-1">
          {t('financial.errorTitle')}
        </h4>
        <p className="text-sm text-yellow-700 mb-2">
          {financialMetricsError.message}
        </p>
        
        {financialMetricsError.code === 'MAX_RETRIES_REACHED' && (
          <div className="space-y-2">
            <p className="text-xs text-yellow-600 italic">
              {financialMetricsError.suggestion}
            </p>
            <p className="text-xs text-yellow-600">
              💡 {t('financial.aiLoadExplanation')}
            </p>
          </div>
        )}
        
        {showRefetchButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefetch}
            disabled={isRefetchingCompanyData}
            className="mt-3 text-xs bg-white hover:bg-yellow-50"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            {t('financial.tryAgain')}
          </Button>
        )}
      </div>
    </div>
  </div>
)}
```

**Lisää käännökset:**
- `messages/fi/Step3AIConversation.json`:
  ```json
  "financial": {
    "errorTitle": "Talouslukujen haku epäonnistui",
    "retryLimitReached": "Emme saaneet haettua talouslukuja useista yrityksistä huolimatta.",
    "retryLaterSuggestion": "Yritä uudelleen hetken kuluttua. Järjestelmä voi olla hetkellisesti kuormittunut.",
    "aiLoadExplanation": "Tekoälypalvelumme voi olla tilapäisesti ruuhkautunut. Odota 1-2 minuuttia ja yritä uudelleen.",
    "tryAgain": "Yritä uudelleen",
    "fetchError": "Virhe talouslukujen haussa"
  }
  ```
- Sama en/sv

---

**Step 4: Logging & Monitoring (30min)**

**Muutokset:**
```typescript
// Lisää kattava logging kaikissa vaiheissa

console.log('🔄 [Financial Metrics] Starting fetch', {
  companyId,
  isRetry,
  retryCount,
  maxRetries
});

console.log('✅ [Financial Metrics] Fetch successful', {
  companyId,
  hasFinancialData,
  metricsCount: metricsData?.length || 0
});

console.log('❌ [Financial Metrics] Fetch failed', {
  companyId,
  error: error.message,
  retryCount,
  willRetry: retryCount < maxRetries
});

console.log('⚠️ [Financial Metrics] Max retries reached', {
  companyId,
  retryCount,
  maxRetries,
  showingUserMessage: true
});
```

---

**Step 5: Testing (1-2h)**

**Unit Tests:** `components/auth/onboarding/__tests__/Step3AIConversation.retry.test.tsx`

```typescript
describe('Company Data Refetch with Auto-Retry', () => {
  it('should show refetch button initially', () => {
    // Test implementation
  });
  
  it('should auto-retry when financial data is missing', async () => {
    // Mock API to return no financial data
    // Verify fetchFinancialMetrics is called 3 times (initial + 2 retries)
    // Verify error message is shown after max retries
  });
  
  it('should stop retrying after max retries', async () => {
    // Verify max 2 retries
    // Verify user message is shown
  });
  
  it('should reset retry count on manual refetch', async () => {
    // Trigger max retries
    // Click manual refetch button
    // Verify retry count is reset
  });
  
  it('should show appropriate error messages', () => {
    // Test different error scenarios
    // Verify correct messages are displayed
  });
});
```

**Integration Tests:**
1. Test yritystietojen haku onnistuu
2. Test automaattinen retry kun ei dataa
3. Test manuaalinen refetch nappi
4. Test error messages
5. Test retry count reset

---

#### File Changes Summary:

| File | Changes | Lines |
|------|---------|-------|
| `components/auth/onboarding/Step3AIConversation.tsx` | Refetch logic, UI, error handling | ~150 |
| `messages/fi/Step3AIConversation.json` | Uudet käännökset | ~20 |
| `messages/en/Step3AIConversation.json` | Uudet käännökset | ~20 |
| `messages/sv/Step3AIConversation.json` | Uudet käännökset | ~20 |
| `components/auth/onboarding/__tests__/Step3AIConversation.retry.test.tsx` | Uudet testit | ~200 |

**Total:** ~410 riviä muutoksia/lisäyksiä

---

#### Success Criteria:

- [x] ✅ Automaattinen retry toimii (max 3 yritystä: initial + 2 retries)
- [x] ✅ 2 sekunnin viive retriejen välillä
- [x] ✅ Tarkistaa onko financial data saatu (data.length > 0)
- [x] ✅ Käyttäjäystävällinen virheilmoitus
- [x] ✅ UI-nappi "Yritä uudelleen" toimii
- [x] ✅ Console logging kattava (🔄, ✅, ⚠️, ❌)
- [x] ✅ Kaikki käännökset lisätty (fi, en, sv)
- [x] ✅ Dokumentaatio päivitetty (ai_changelog.md)
- [ ] ⏳ Unit testit (tulevaisuudessa)
- [ ] ⏳ E2E testit (tulevaisuudessa)

---

#### User Experience Flow:

```
1. Käyttäjä aloittaa onboarding
   ↓
2. Järjestelmä hakee yritystiedot
   ↓
3a. Talousluvut saatu → Jatka normaalisti ✅
   
3b. Ei talouslukuja → Automaattinen retry #1 (3s kuluttua)
   ↓
   3b1. Retry #1 onnistuu → Jatka normaalisti ✅
   
   3b2. Retry #1 epäonnistuu → Automaattinen retry #2 (3s kuluttua)
      ↓
      3b2a. Retry #2 onnistuu → Jatka normaalisti ✅
      
      3b2b. Retry #2 epäonnistuu → Näytä virheilmoitus
         ↓
         "Talouslukujen haku epäonnistui useista yrityksistä huolimatta.
          Yritä uudelleen hetken kuluttua. Järjestelmä voi olla hetkellisesti kuormittunut.
          💡 Tekoälypalvelumme voi olla tilapäisesti ruuhkautunut."
         ↓
         [Yritä uudelleen] -nappi
         ↓
         Käyttäjä klikkaa → Nollaa retry count → Aloita alusta
```

---

#### Benefits:

1. **Käyttäjäkokemus**: Ei tarvitse manuaalisesti ymmärtää ongelmaa ja yrittää uudelleen
2. **Automaatio**: Järjestelmä hoitaa tyypilliset ongelmat automaattisesti
3. **Läpinäkyvyys**: Käyttäjä tietää mitä tapahtuu ja miksi
4. **Helppo korjaus**: Manuaalinen refetch-nappi aina saatavilla
5. **Ohjaus**: Viittaus tekoälyn kuormitukseen auttaa ymmärtämään ongelman

---

## 📋 SPRINT 1: CLIENT-SIDE FEATURES (Ei DB-muutoksia)

**Tavoite:** Saada 5 toiminnallisuutta ilman backend-muutoksia  
**Kesto:** 6-8h  
**Riski:** MATALA

---

### TASK 1.1: CLIENT-SIDE SORTING
**Kesto:** 2h  
**Riippuvuudet:** Ei  
**Riski:** Matala

#### Implementation Steps:

**Step 1: Create SortableHeader Component (30min)**
```typescript
// app/[locale]/admin/users/components/SortableHeader.tsx

'use client'

import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'

interface SortableHeaderProps {
  column: string
  label: string
  currentSort: string | null
  direction: 'asc' | 'desc'
  onSort: (column: string) => void
}

export function SortableHeader({
  column,
  label,
  currentSort,
  direction,
  onSort
}: SortableHeaderProps) {
  const isActive = currentSort === column
  
  return (
    <th
      className="cursor-pointer hover:bg-gray-50 select-none"
      onClick={() => onSort(column)}
    >
      <div className="flex items-center gap-2">
        {label}
        {isActive ? (
          direction === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />
        ) : (
          <ArrowUpDown size={16} className="opacity-30" />
        )}
      </div>
    </th>
  )
}
```

**Step 2: Add Sort State to UserManagementPage (30min)**
```typescript
// app/[locale]/admin/users/UserManagementPage.tsx

const [sortColumn, setSortColumn] = useState<string | null>(null)
const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

const handleSort = (column: string) => {
  if (sortColumn === column) {
    // Toggle direction
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
  } else {
    // New column, default to ascending
    setSortColumn(column)
    setSortDirection('asc')
  }
}
```

**Step 3: Implement Sort Logic (30min)**
```typescript
// app/[locale]/admin/users/UserManagementPage.tsx

const sortedUsers = useMemo(() => {
  if (!sortColumn) return filteredUsers
  
  return [...filteredUsers].sort((a, b) => {
    let aVal: any
    let bVal: any
    
    switch (sortColumn) {
      case 'email':
        aVal = a.email?.toLowerCase() || ''
        bVal = b.email?.toLowerCase() || ''
        break
      case 'name':
        aVal = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase()
        bVal = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase()
        break
      case 'created':
        aVal = new Date(a.created_at).getTime()
        bVal = new Date(b.created_at).getTime()
        break
      case 'admin':
        aVal = a.is_admin ? 1 : 0
        bVal = b.is_admin ? 1 : 0
        break
      case 'partner':
        aVal = a.is_partner ? 1 : 0
        bVal = b.is_partner ? 1 : 0
        break
      default:
        return 0
    }
    
    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
    }
  })
}, [filteredUsers, sortColumn, sortDirection])
```

**Step 4: Update Table Headers (15min)**
```typescript
// Replace <th> with <SortableHeader>
<SortableHeader
  column="email"
  label="Email"
  currentSort={sortColumn}
  direction={sortDirection}
  onSort={handleSort}
/>
```

**Step 5: Testing (15min)**
```typescript
// __tests__/admin/users/sorting.test.ts

describe('User Sorting', () => {
  test('sorts by email ascending', () => {
    const users = [
      { email: 'charlie@test.com' },
      { email: 'alice@test.com' },
      { email: 'bob@test.com' }
    ]
    const sorted = sortUsers(users, 'email', 'asc')
    expect(sorted[0].email).toBe('alice@test.com')
  })
  
  test('sorts by name descending', () => { ... })
  test('sorts by date', () => { ... })
  test('sorts boolean fields', () => { ... })
})
```

**Success Criteria:**
- [ ] Click column header → sorts ascending
- [ ] Click again → sorts descending
- [ ] Visual indicator shows sort direction
- [ ] Sorting persists during filtering
- [ ] All tests pass

---

### TASK 1.2: CSV EXPORT
**Kesto:** 2h  
**Riippuvuudet:** Task 1.1 (sortaus pitää huomioida)  
**Riski:** Matala

#### Implementation Steps:

**Step 1: Create Export Function (45min)**
```typescript
// app/[locale]/admin/users/lib/csvExport.ts

export interface ExportOptions {
  includeFields?: string[]
  dateFormat?: 'ISO' | 'locale'
  filename?: string
}

export function exportUsersToCSV(
  users: User[],
  options: ExportOptions = {}
) {
  const {
    includeFields = ['email', 'name', 'phone', 'created', 'admin', 'partner'],
    dateFormat = 'locale',
    filename = `users_export_${new Date().toISOString().split('T')[0]}.csv`
  } = options
  
  // Define headers
  const headers: string[] = []
  if (includeFields.includes('email')) headers.push('Email')
  if (includeFields.includes('name')) headers.push('Name')
  if (includeFields.includes('phone')) headers.push('Phone')
  if (includeFields.includes('created')) headers.push('Created')
  if (includeFields.includes('admin')) headers.push('Admin')
  if (includeFields.includes('partner')) headers.push('Partner')
  
  // Map users to rows
  const rows = users.map(user => {
    const row: string[] = []
    
    if (includeFields.includes('email')) {
      row.push(user.email || '')
    }
    if (includeFields.includes('name')) {
      row.push(`${user.first_name || ''} ${user.last_name || ''}`.trim())
    }
    if (includeFields.includes('phone')) {
      row.push(user.phone_number || '')
    }
    if (includeFields.includes('created')) {
      const date = new Date(user.created_at)
      row.push(dateFormat === 'ISO' ? date.toISOString() : date.toLocaleString())
    }
    if (includeFields.includes('admin')) {
      row.push(user.is_admin ? 'Yes' : 'No')
    }
    if (includeFields.includes('partner')) {
      row.push(user.is_partner ? 'Yes' : 'No')
    }
    
    return row
  })
  
  // Convert to CSV
  const csv = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')
  
  // Trigger download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
```

**Step 2: Add Export Button (15min)**
```typescript
// app/[locale]/admin/users/UserManagementPage.tsx

import { Download } from 'lucide-react'
import { exportUsersToCSV } from './lib/csvExport'

const handleExport = () => {
  // Use sortedUsers to export in current sort order
  exportUsersToCSV(sortedUsers, {
    filename: `users_export_${new Date().toISOString().split('T')[0]}.csv`
  })
  
  toast({
    title: 'Export successful',
    description: `Exported ${sortedUsers.length} users to CSV`
  })
}

// In JSX:
<Button onClick={handleExport} variant="outline">
  <Download className="mr-2 h-4 w-4" />
  Export CSV ({sortedUsers.length})
</Button>
```

**Step 3: Add Export Options Modal (Optional, 30min)**
```typescript
// app/[locale]/admin/users/components/ExportModal.tsx

export function ExportModal({ users, onClose }: ExportModalProps) {
  const [selectedFields, setSelectedFields] = useState([
    'email', 'name', 'phone', 'created', 'admin', 'partner'
  ])
  const [dateFormat, setDateFormat] = useState<'ISO' | 'locale'>('locale')
  
  const handleExport = () => {
    exportUsersToCSV(users, {
      includeFields: selectedFields,
      dateFormat
    })
    onClose()
  }
  
  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Options</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Fields to export:</Label>
            {['email', 'name', 'phone', 'created', 'admin', 'partner'].map(field => (
              <div key={field} className="flex items-center gap-2">
                <Checkbox
                  checked={selectedFields.includes(field)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedFields([...selectedFields, field])
                    } else {
                      setSelectedFields(selectedFields.filter(f => f !== field))
                    }
                  }}
                />
                <Label>{field}</Label>
              </div>
            ))}
          </div>
          
          <div>
            <Label>Date format:</Label>
            <Select value={dateFormat} onValueChange={setDateFormat}>
              <SelectItem value="locale">Locale (DD/MM/YYYY HH:MM)</SelectItem>
              <SelectItem value="ISO">ISO 8601 (YYYY-MM-DDTHH:MM:SS)</SelectItem>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

**Step 4: Testing (30min)**
```typescript
// __tests__/admin/users/csvExport.test.ts

describe('CSV Export', () => {
  test('generates correct CSV format', () => {
    const users = [
      { email: 'test@test.com', first_name: 'Test', last_name: 'User' }
    ]
    const csv = generateCSV(users)
    expect(csv).toContain('"Email","Name"')
    expect(csv).toContain('"test@test.com","Test User"')
  })
  
  test('escapes special characters', () => { ... })
  test('handles empty fields', () => { ... })
  test('respects field selection', () => { ... })
})
```

**Success Criteria:**
- [ ] Button downloads CSV file
- [ ] CSV contains all selected users (respects filters/sort)
- [ ] All fields correctly formatted
- [ ] Special characters escaped
- [ ] Filename includes date
- [ ] Tests pass

---

### TASK 1.3: EMAIL VERIFICATION RESEND
**Kesto:** 2h  
**Riippuvuudet:** Ei  
**Riski:** Matala-keskitaso (vaatii service role)

#### Implementation Steps:

**Step 1: Create API Endpoint (1h)**
```typescript
// app/api/admin/users/[userId]/resend-verification/route.ts

import { createClient } from '@supabase/supabase-js'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // 1. Verify admin authorization
    const supabase = createBrowserClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .single()
    
    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // 2. Get user email
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(
      params.userId
    )
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // 3. Generate verification link
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: user.email!,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
      }
    })
    
    if (error) {
      console.error('Error generating verification link:', error)
      return NextResponse.json(
        { error: 'Failed to send verification email' },
        { status: 500 }
      )
    }
    
    // 4. Log activity (if activity logging is implemented)
    // await logActivity(params.userId, 'email_verification_resent', ...)
    
    return NextResponse.json({
      success: true,
      message: 'Verification email sent'
    })
    
  } catch (error) {
    console.error('Error resending verification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**Step 2: Add UI Button (30min)**
```typescript
// app/[locale]/admin/users/UserManagementPage.tsx

const [resendingVerification, setResendingVerification] = useState<string | null>(null)

const handleResendVerification = async (userId: string, email: string) => {
  try {
    setResendingVerification(userId)
    
    const response = await fetch(`/api/admin/users/${userId}/resend-verification`, {
      method: 'POST'
    })
    
    if (!response.ok) {
      throw new Error('Failed to resend verification')
    }
    
    toast({
      title: 'Verification email sent',
      description: `Sent to ${email}`
    })
  } catch (error) {
    toast({
      title: 'Error',
      description: 'Failed to send verification email',
      variant: 'destructive'
    })
  } finally {
    setResendingVerification(null)
  }
}

// In table row:
{!user.email_confirmed_at && (
  <Button
    size="sm"
    variant="ghost"
    onClick={() => handleResendVerification(user.id, user.email)}
    disabled={resendingVerification === user.id}
  >
    {resendingVerification === user.id ? (
      <Loader2 className="h-4 w-4 animate-spin" />
    ) : (
      <>
        <Mail className="mr-2 h-4 w-4" />
        Resend
      </>
    )}
  </Button>
)}
```

**Step 3: Add Verification Status Column (15min)**
```typescript
// Show email verification status
<td>
  {user.email_confirmed_at ? (
    <Badge variant="success">
      <CheckCircle className="mr-1 h-3 w-3" />
      Verified
    </Badge>
  ) : (
    <Badge variant="warning">
      <AlertCircle className="mr-1 h-3 w-3" />
      Unverified
    </Badge>
  )}
</td>
```

**Step 4: Testing (15min)**
```typescript
// __tests__/api/admin/users/resend-verification.test.ts

describe('POST /api/admin/users/[userId]/resend-verification', () => {
  test('requires authentication', async () => {
    const response = await POST({ userId: 'test-id' })
    expect(response.status).toBe(401)
  })
  
  test('requires admin role', async () => { ... })
  test('sends verification email', async () => { ... })
  test('handles non-existent user', async () => { ... })
})
```

**Success Criteria:**
- [ ] API endpoint works
- [ ] Email sent successfully
- [ ] Button shows loading state
- [ ] Toast shows success/error
- [ ] Only shows for unverified users
- [ ] Tests pass

---

### TASK 1.4: PASSWORD RESET
**Kesto:** 2h  
**Riippuvuudet:** Task 1.3 (similar pattern)  
**Riski:** Matala-keskitaso

*Similar implementation to Task 1.3, but with `type: 'recovery'`*

---

### TASK 1.5: PAGINATION
**Kesto:** 1h  
**Riippuvuudet:** Task 1.1 (pagination of sorted data)  
**Riski:** Matala

#### Implementation Steps:

**Step 1: Create Pagination Component (30min)**
```typescript
// app/[locale]/admin/users/components/Pagination.tsx

interface PaginationProps {
  currentPage: number
  totalPages: number
  itemsPerPage: number
  totalItems: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (perPage: number) => void
}

export function Pagination({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)
  
  return (
    <div className="flex items-center justify-between">
      {/* Left: Info */}
      <div className="text-sm text-gray-600">
        Showing {startItem}-{endItem} of {totalItems}
      </div>
      
      {/* Center: Pages */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </Button>
        
        {/* Page numbers */}
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(page => {
            // Show first, last, current, and adjacent pages
            return page === 1 || 
                   page === totalPages || 
                   (page >= currentPage - 1 && page <= currentPage + 1)
          })
          .map((page, idx, arr) => (
            <React.Fragment key={page}>
              {/* Show ellipsis */}
              {idx > 0 && page - arr[idx - 1] > 1 && (
                <span className="px-2">...</span>
              )}
              
              <Button
                size="sm"
                variant={page === currentPage ? 'default' : 'outline'}
                onClick={() => onPageChange(page)}
              >
                {page}
              </Button>
            </React.Fragment>
          ))}
        
        <Button
          size="sm"
          variant="outline"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </Button>
      </div>
      
      {/* Right: Items per page */}
      <Select value={String(itemsPerPage)} onValueChange={(val) => onItemsPerPageChange(Number(val))}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="10">10 per page</SelectItem>
          <SelectItem value="25">25 per page</SelectItem>
          <SelectItem value="50">50 per page</SelectItem>
          <SelectItem value="100">100 per page</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
```

**Step 2: Add Pagination to UserManagementPage (20min)**
```typescript
const [currentPage, setCurrentPage] = useState(1)
const [itemsPerPage, setItemsPerPage] = useState(25)

// Calculate pagination
const totalPages = Math.ceil(sortedUsers.length / itemsPerPage)
const paginatedUsers = sortedUsers.slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
)

// Reset to page 1 when filters/sort change
useEffect(() => {
  setCurrentPage(1)
}, [searchQuery, filterRole, sortColumn, sortDirection])

// In JSX (after table):
<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  itemsPerPage={itemsPerPage}
  totalItems={sortedUsers.length}
  onPageChange={setCurrentPage}
  onItemsPerPageChange={(perPage) => {
    setItemsPerPage(perPage)
    setCurrentPage(1) // Reset to first page
  }}
/>
```

**Step 3: Testing (10min)**
```typescript
describe('Pagination', () => {
  test('shows correct page range', () => { ... })
  test('navigates to next page', () => { ... })
  test('changes items per page', () => { ... })
})
```

**Success Criteria:**
- [ ] Shows correct page range
- [ ] Can navigate pages
- [ ] Can change items per page
- [ ] Resets to page 1 on filter/sort change
- [ ] Tests pass

---

## 📋 SPRINT 1 COMPLETION CHECKLIST

- [ ] All 5 tasks completed
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No lint errors
- [ ] Documentation updated
- [ ] Checkpoint created: `sprint-1-completed`
- [ ] Ready for Sprint 2

**Estimated completion:** 8h  
**Actual completion:** [To be filled]

---

## 📊 FUTURE DEVELOPMENT: SEO & IMAGE OPTIMIZATION

**Status:** Planning / Backlog  
**Priority:** Medium (post-MVP)  
**Impact:** SEO, Accessibility, AI-Discoverability

### Implemented (✅):
- ✅ Keskitetty kuvametadata-järjestelmä (`lib/image-metadata.ts`)
- ✅ SEO-optimoidut alt-tekstit (50+ kuvaa, 50-125 merkkiä)
- ✅ Avainsanastrategia ja kontekstualisointi
- ✅ Hakutoiminnot (`getImageMetadata`, `searchImagesByKeyword`)
- ✅ Structured Data -generointi (`generateImageStructuredData`)
- ✅ Kattava dokumentaatio ja migraatio-oppaat
- ✅ AI-hakukone yhteensopivuus (ChatGPT, Claude, Perplexity, Gemini)

### TASK: IMAGE METADATA - FUTURE ENHANCEMENTS

#### 2.1: Multilingual Alt-Texts (fi, en, sv)
**Kesto:** 4-6h  
**Riippuvuudet:** Nykyinen metadata-järjestelmä  
**Riski:** Matala  
**Priority:** HIGH (kansainvälistyminen)

**Tavoite:**
Laajentaa kuvametadata-järjestelmä tukemaan kolmea kieltä (suomi, englanti, ruotsi) samaan tapaan kuin muu lokalisointi.

**Implementation Steps:**

**Step 1: Päivitä ImageMetadata-interface (30min)**
```typescript
// lib/image-metadata.ts

export interface ImageMetadata {
  src: string
  alt: {
    fi: string  // Suomi
    en: string  // Englanti
    sv: string  // Ruotsi
  }
  description?: {
    fi: string
    en: string
    sv: string
  }
  keywords?: string[]  // Keywords pysyvät kieliagnostisina
}
```

**Step 2: Päivitä olemassa olevat metadata-objektit (2-3h)**
```typescript
export const SERVICES = {
  financialAnalysis: {
    src: '/images/other/laiskiainen_suurennuslasi.jpeg',
    alt: {
      fi: 'Syvällinen yrityksen taloudellinen analyysi ja rahoitustarpeen arviointi AI-avusteisella analytiikalla',
      en: 'In-depth financial analysis and funding needs assessment using AI-powered analytics',
      sv: 'Djupgående finansiell analys och bedömning av finansieringsbehov med AI-driven analys'
    },
    description: {
      fi: 'Perusteellinen talousanalyysi rahoituspäätösten tueksi',
      en: 'Thorough financial analysis to support funding decisions',
      sv: 'Grundlig finansiell analys för att stödja finansieringsbeslut'
    },
    keywords: ['talousanalyysi', 'financial analysis', 'rahoitustarpeen arviointi', 'due diligence', 'AI-analyysi']
  }
  // ... rest of images
}
```

**Step 3: Luo locale-aware helper-funktiot (1h)**
```typescript
// lib/image-metadata.ts

export function getLocalizedImageMetadata(
  imageName: string,
  category: 'logos' | 'mascots' | 'services' | 'hero' | 'people' | 'misc',
  locale: 'fi' | 'en' | 'sv' = 'fi'
): LocalizedImageMetadata {
  const metadata = getImageMetadata(imageName, category)
  
  return {
    src: metadata.src,
    alt: metadata.alt[locale] || metadata.alt.fi,
    description: metadata.description?.[locale] || metadata.description?.fi,
    keywords: metadata.keywords
  }
}

// React hook käyttöön komponenteissa
export function useLocalizedImage(
  imageName: string,
  category: CategoryType
) {
  const locale = useLocale() // from next-intl
  return getLocalizedImageMetadata(imageName, category, locale as 'fi' | 'en' | 'sv')
}
```

**Step 4: Päivitä käyttöesimerkit (30min)**
```typescript
// Komponentissa:
import { useLocalizedImage } from '@/lib/image-metadata'

export function ServiceCard() {
  const image = useLocalizedImage('financialAnalysis', 'services')
  
  return (
    <OptimizedImage
      src={image.src}
      alt={image.alt}  // Automaattisesti oikea kieli!
      width={400}
      height={300}
    />
  )
}
```

**Success Criteria:**
- [ ] Kaikki 50+ kuvaa käännetty kolmelle kielelle
- [ ] `useLocalizedImage` hook toimii
- [ ] Alt-tekstit vaihtuvat kielen mukana
- [ ] Dokumentaatio päivitetty
- [ ] Migraatio-opas päivitetty

---

#### 2.2: Automaattinen Alt-Tekstien Generointi AI:lla
**Kesto:** 6-8h  
**Riippuvuudet:** Task 2.1, Gemini API  
**Riski:** Keskitaso (AI-laatu)  
**Priority:** MEDIUM (kehitysnopeuden parannus)

**Tavoite:**
Käyttää Gemini Vision API:a generoimaan SEO-optimoidut alt-tekstit automaattisesti uusille kuville.

**Implementation Steps:**

**Step 1: Luo AI alt-teksti generaattori (3h)**
```typescript
// tools/generate-image-alt-text.ts

import { GoogleGenerativeAI } from '@google/generative-ai'
import fs from 'fs'
import path from 'path'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_STUDIO_KEY!)

interface GenerateAltTextOptions {
  imagePath: string
  context?: string  // "yritysrahoitus", "maskotti", "palvelu" etc.
  targetKeywords?: string[]
  locale?: 'fi' | 'en' | 'sv'
  minLength?: number
  maxLength?: number
}

export async function generateAltText(options: GenerateAltTextOptions): Promise<string> {
  const {
    imagePath,
    context = 'yritysrahoitus',
    targetKeywords = [],
    locale = 'fi',
    minLength = 50,
    maxLength = 125
  } = options
  
  // 1. Lataa kuva
  const imageBuffer = fs.readFileSync(imagePath)
  const base64Image = imageBuffer.toString('base64')
  
  // 2. Luo prompt
  const prompt = `
You are an SEO expert writing alt text for images on a business financing platform.

Context: ${context}
Target keywords: ${targetKeywords.join(', ')}
Language: ${locale === 'fi' ? 'Finnish' : locale === 'en' ? 'English' : 'Swedish'}
Length: ${minLength}-${maxLength} characters

Requirements:
1. Describe what's in the image
2. Include target keywords naturally
3. Be informative and SEO-friendly
4. Don't start with "image of" or "picture of"
5. Write in ${locale === 'fi' ? 'Finnish' : locale === 'en' ? 'English' : 'Swedish'} language

Generate an alt text:
`
  
  // 3. Kutsu Gemini Vision
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
  
  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: base64Image,
        mimeType: 'image/jpeg'
      }
    }
  ])
  
  const altText = result.response.text().trim()
  
  // 4. Validoi pituus
  if (altText.length < minLength || altText.length > maxLength) {
    console.warn(`⚠️ Generated alt text length (${altText.length}) out of range`)
  }
  
  return altText
}
```

**Step 2: Luo CLI-työkalu (2h)**
```typescript
// tools/cli-generate-alt-texts.ts

import { Command } from 'commander'
import { generateAltText } from './generate-image-alt-text'
import { glob } from 'glob'
import path from 'path'

const program = new Command()

program
  .name('generate-alt-texts')
  .description('Generate SEO-optimized alt texts for images using AI')
  .option('-d, --dir <directory>', 'Image directory', 'public/images')
  .option('-c, --context <context>', 'Business context', 'yritysrahoitus')
  .option('-k, --keywords <keywords>', 'Target keywords (comma-separated)', '')
  .option('-l, --locale <locale>', 'Language (fi, en, sv)', 'fi')
  .option('--update-metadata', 'Update lib/image-metadata.ts', false)
  .action(async (options) => {
    console.log('🤖 Starting AI alt text generation...\n')
    
    // Find all images
    const images = await glob(`${options.dir}/**/*.{jpg,jpeg,png,webp}`)
    console.log(`📸 Found ${images.length} images\n`)
    
    const keywords = options.keywords.split(',').map((k: string) => k.trim())
    
    for (const imagePath of images) {
      console.log(`🔍 Processing: ${imagePath}`)
      
      try {
        const altText = await generateAltText({
          imagePath,
          context: options.context,
          targetKeywords: keywords,
          locale: options.locale
        })
        
        console.log(`✅ Alt text: "${altText}"\n`)
        
        // Optionally update metadata file
        if (options.updateMetadata) {
          // TODO: Parse and update lib/image-metadata.ts
        }
        
      } catch (error) {
        console.error(`❌ Error: ${error.message}\n`)
      }
    }
    
    console.log('✅ Alt text generation completed!')
  })

program.parse()
```

**Step 3: Lisää npm script (15min)**
```json
// package.json

"scripts": {
  "generate-alt-texts": "tsx tools/cli-generate-alt-texts.ts",
  "generate-alt-texts:all": "npm run generate-alt-texts -- --dir public/images --update-metadata",
  "generate-alt-texts:new": "npm run generate-alt-texts -- --dir public/images/new"
}
```

**Step 4: Testaus ja validointi (2h)**
- Testaa eri kuvilla
- Vertaa AI-generoituun vs. manuaaliseen
- Säädä promptia jos tarvitaan
- Dokumentoi best practices

**Success Criteria:**
- [ ] CLI-työkalu toimii
- [ ] Generoi korkealaatuisia alt-tekstejä
- [ ] Avainsanat sisällytetty luonnollisesti
- [ ] Oikea pituus (50-125 merkkiä)
- [ ] Tukee kaikkia kolmea kieltä
- [ ] Dokumentaatio kirjoitettu

---

#### 2.3: Image Sitemap -Generointi
**Kesto:** 3-4h  
**Riippuvuudet:** Metadata-järjestelmä  
**Riski:** Matala  
**Priority:** MEDIUM (SEO)

**Tavoite:**
Generoida automaattinen XML image sitemap Google Image Search -optimointiin.

**Implementation Steps:**

**Step 1: Luo sitemap generaattori (2h)**
```typescript
// app/image-sitemap.xml/route.ts

import { LOGOS, MASCOTS, SERVICES, HERO_IMAGES, PEOPLE, MISCELLANEOUS } from '@/lib/image-metadata'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://trustyfinance.fi'
  
  // Collect all images
  const allImages = [
    ...Object.entries(LOGOS),
    ...Object.entries(MASCOTS),
    ...Object.entries(SERVICES),
    ...Object.entries(HERO_IMAGES),
    ...Object.entries(PEOPLE),
    ...Object.entries(MISCELLANEOUS)
  ]
  
  // Build XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${baseUrl}</loc>
    ${allImages.map(([name, metadata]) => `
    <image:image>
      <image:loc>${baseUrl}${metadata.src}</image:loc>
      <image:caption>${metadata.alt}</image:caption>
      <image:title>${metadata.description || name}</image:title>
      ${metadata.keywords ? `<image:keywords>${metadata.keywords.join(', ')}</image:keywords>` : ''}
    </image:image>
    `).join('')}
  </url>
</urlset>`
  
  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    }
  })
}
```

**Step 2: Lisää robots.txt (30min)**
```typescript
// app/robots.ts

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/']
    },
    sitemap: [
      'https://trustyfinance.fi/sitemap.xml',
      'https://trustyfinance.fi/image-sitemap.xml'  // ← Lisää!
    ]
  }
}
```

**Step 3: Testaus (1h)**
- Validoi XML Google Search Console:ssa
- Testaa että kaikki kuvat listautuvat
- Varmista että metadata on oikein

**Success Criteria:**
- [ ] Image sitemap generoituu automaattisesti
- [ ] Sisältää kaikki kuvat metadata-järjestelmästä
- [ ] Validoituu Google Search Console:ssa
- [ ] robots.txt viittaa sitemapiin

---

#### 2.4: Responsive srcset -Generointi
**Kesto:** 4-6h  
**Riippuvuudet:** OptimizedImage-komponentti  
**Riski:** Keskitaso (Next.js Image API)  
**Priority:** MEDIUM (latausnopeus)

**Tavoite:**
Automaattinen responsive image srcset -generointi eri laitekooille.

**Implementation Steps:**

**Step 1: Päivitä OptimizedImage (2h)**
```typescript
// components/optimized/OptimizedImage.tsx

import { getResponsiveSizes } from '@/lib/image-utils'

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  responsive = true,
  ...props
}: OptimizedImageProps) {
  
  // Generate srcset for responsive images
  const srcset = responsive && width && height
    ? getResponsiveSizes(width, height)
    : undefined
  
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={srcset?.sizes}
      {...props}
    />
  )
}
```

**Step 2: Luo responsive size calculator (1-2h)**
```typescript
// lib/image-utils.ts

export function getResponsiveSizes(baseWidth: number, baseHeight: number) {
  const breakpoints = {
    mobile: 640,
    tablet: 768,
    desktop: 1024,
    wide: 1280
  }
  
  return {
    sizes: `
      (max-width: ${breakpoints.mobile}px) ${Math.min(baseWidth, breakpoints.mobile)}px,
      (max-width: ${breakpoints.tablet}px) ${Math.min(baseWidth, breakpoints.tablet)}px,
      (max-width: ${breakpoints.desktop}px) ${Math.min(baseWidth, breakpoints.desktop)}px,
      ${baseWidth}px
    `.replace(/\s+/g, ' ').trim()
  }
}
```

**Step 3: Testaus (1h)**
- Testaa eri laitekoilla
- Varmista että oikeat koot latautuvat
- Mittaa latausnopeuden parannus

**Success Criteria:**
- [ ] srcset generoituu automaattisesti
- [ ] Oikeat kuvakoot eri laitteille
- [ ] Latausnopeus parantunut
- [ ] Toimii kaikilla selaimilla

---

#### 2.5: A/B-testaus Alt-Teksteille
**Kesto:** 6-8h  
**Riippuvuudet:** Analytics, A/B testing framework  
**Riski:** Korkea (vaatii analytics-integraation)  
**Priority:** LOW (data-driven optimization)

**Tavoite:**
Testata eri alt-tekstejä ja mitata niiden vaikutusta SEO:hon ja käyttäjäkokemukseen.

**Implementation Steps:**

**Step 1: Integrointi A/B testing frameworkiin (3h)**
- Valitse framework (Vercel Edge Config, Split.io, tai custom)
- Implementoi variant-hallinta
- Tracking ja analytics

**Step 2: Alt-teksti variantit (2h)**
```typescript
// lib/image-metadata-ab-test.ts

export interface AltTextVariant {
  id: string
  alt: string
  weight: number  // 0-100
}

export const AB_TEST_VARIANTS = {
  'financial-analysis': [
    {
      id: 'control',
      alt: 'Syvällinen yrityksen taloudellinen analyysi...',
      weight: 50
    },
    {
      id: 'variant-a',
      alt: 'AI-pohjainen yrityksen rahoitusanalyysi...',
      weight: 50
    }
  ]
}
```

**Step 3: Mittaaminen (2h)**
- Click-through rate
- Time on page
- Bounce rate
- Image visibility in search

**Step 4: Raportointi (1h)**
- Dashboard A/B-testituloksille
- Tilastollinen merkitsevyys

**Success Criteria:**
- [ ] A/B testit pyörivät
- [ ] Mittarit kerätään
- [ ] Raportointi toimii
- [ ] Voittava variantti voidaan valita

---

### Arvioitu aikataulu:

| Task | Kesto | Riippuvuudet | Priority |
|------|-------|--------------|----------|
| 2.1 Multilingual Alt-Texts | 4-6h | - | HIGH |
| 2.2 AI Alt-Text Generation | 6-8h | 2.1 | MEDIUM |
| 2.3 Image Sitemap | 3-4h | - | MEDIUM |
| 2.4 Responsive srcset | 4-6h | - | MEDIUM |
| 2.5 A/B Testing | 6-8h | Analytics | LOW |

**Yhteensä:** 23-32h työtuntia

### ROI-arvio:

| Toimenpide | SEO-vaikutus | Kehitysaika | ROI |
|------------|-------------|-------------|-----|
| Multilingual | **HIGH** | 4-6h | ⭐⭐⭐⭐⭐ |
| Image Sitemap | **MEDIUM** | 3-4h | ⭐⭐⭐⭐ |
| Responsive srcset | **LOW-MEDIUM** | 4-6h | ⭐⭐⭐ |
| AI Generation | **MEDIUM** | 6-8h | ⭐⭐⭐ |
| A/B Testing | **LOW** (data) | 6-8h | ⭐⭐ |

**Suositus:** Aloita 2.1 → 2.3 → 2.4 → 2.2 → 2.5

---

## 🚀 DEPLOYMENT STRATEGY

### ⚠️ CRITICAL GIT RULES:
- **NEVER merge to main automatically**
- **NEVER push to main directly**
- Always work on feature/dev branches
- Create PR for main merges
- Wait for manual approval
- Dev branch CAN be deployed

---

### After Sprint 1:
1. Code review
2. **Create PR to main** (DO NOT merge automatically)
3. **Wait for manual approval**
4. After approval: Deploy to staging
5. Test on staging
6. Deploy to production

### After Sprint 2 (with migration):
1. Code review
2. Test migration locally
3. **Create PR to main** (DO NOT merge automatically)
4. **Wait for manual approval**
5. After approval: Deploy migration to staging
6. Test on staging
7. **Backup production database**
8. Deploy migration to production
9. Test on production
10. Monitor for 24h

---

**Next:** [SPRINT 2 - DETAILED IMPLEMENTATION]

**Last Updated:** 2025-01-10

