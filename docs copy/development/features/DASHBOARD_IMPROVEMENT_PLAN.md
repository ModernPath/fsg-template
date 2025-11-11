# Dashboard Improvement Plan
**Created:** 2025-10-13  
**Status:** Planning  
**Priority:** HIGH

## Current Problems

### 1. **Data Issues**
- ✅ EBITDA missing for 2024 (NULL in database)
- ✅ Years 2022-2023 have completely empty rows (all metrics NULL)
- ✅ Funding type shows as "business_loan_unsecured" instead of translated name
- ✅ Amount shows "€NaNk" when amount is NULL
- ✅ Status shows "submitted" instead of "Lähetetty"

### 2. **UI/UX Issues**
- Dashboard looks "empty" and unprofessional
- No clear indication when data is missing vs. loading
- No guidance on what actions user should take
- Financial metrics display NULL values instead of hiding them
- No visual hierarchy or data prioritization

### 3. **Localization Issues**
- ✅ Translation keys missing for application status
- ✅ Funding type IDs not translated
- Inconsistent translation usage across components

## Implemented Fixes (Session 2025-10-13)

### ✅ Database Field Mapping
- **Problem:** Code used `funding_type` and `amount_requested` but DB has `type` and `amount`
- **Fix:** Updated all references to use correct field names
  - `app.funding_type` → `app.type`
  - `app.amount_requested` → `app.amount`

### ✅ Funding Type Translation
- **Problem:** Showed "business_loan_unsecured" instead of translated name
- **Fix:** Added comprehensive `fundingTypes` translations:
  ```json
  "fundingTypes": {
    "businessLoan": "Yritysluotto",
    "businessLoanUnsecured": "Vakuudeton yrityslaina",
    "businessLoanSecured": "Vakuudellinen yrityslaina",
    "creditLine": "Luottolimiitti",
    "factoring": "Laskurahoitus",
    "factoringAr": "Laskurahoitus (myyntisaamiset)",
    "leasing": "Leasing-rahoitus",
    "bankGuarantee": "Pankkitakaus",
    "refinancing": "Jälleenrahoitus"
  }
  ```

### ✅ Application Status Translation
- **Problem:** Showed "submitted" instead of "Lähetetty"
- **Fix:** Added `applications.status` translations for all statuses:
  - draft, submitted, processing, approved, rejected, withdrawn

### ✅ Amount Display
- **Problem:** Showed "€NaNk requested" when amount was NULL
- **Fix:** Added NULL check and fallback:
  ```typescript
  {app.amount && app.amount > 0 
    ? `€${(Number(app.amount) / 1000).toFixed(0)}k haettu`
    : 'Summa ei saatavilla'
  }
  ```

### ✅ Funding Recommendation Filtering
- **Problem:** Showed already applied funding types in recommendations
- **Fix:** 
  - Calculate `appliedFundingTypes` from existing applications
  - Filter out recommendations that match applied types
  - Show "Olet jo hakenut kaikkia..." when all are applied

### ✅ FundingRecommendations Component
- Updated `getFundingTypeName()` to handle all funding type variations
- Added icon support for all funding types
- Improved type definitions

## Improvement Plan

### Phase 1: Data Display Enhancement (IMMEDIATE)

#### 1.1 Null-Safe Rendering
**Files:** 
- `app/[locale]/dashboard/DashboardPageOptimized.tsx`
- `components/dashboard/CompanyOverview.tsx`
- `components/dashboard/FundabilityAnalysis.tsx`

**Actions:**
```typescript
// Instead of showing NULL or 0, show:
// 1. Loading state while fetching
// 2. "No data" message with call-to-action
// 3. Partial data indicator

// Example:
const MetricCard = ({ value, label, unit = '€' }) => {
  if (isLoading) return <Skeleton />
  if (value === null || value === undefined) {
    return (
      <Card className="opacity-60">
        <CardHeader>
          <CardTitle>{label}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Ei dataa
            <Button size="sm" onClick={handleUploadDocument}>
              Lataa tilinpäätös
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }
  return <MetricDisplay value={value} label={label} unit={unit} />
}
```

#### 1.2 Empty State Components
**New Files:**
- `components/dashboard/EmptyStates/NoFinancialData.tsx`
- `components/dashboard/EmptyStates/NoApplications.tsx`
- `components/dashboard/EmptyStates/NoRecommendations.tsx`

**Features:**
- Clear icon/illustration
- Explanation of what's missing
- Primary CTA button (e.g., "Upload Financial Statement")
- Secondary information (e.g., "Why is this important?")

#### 1.3 Data Quality Indicator
**New Component:** `components/dashboard/DataQualityBadge.tsx`

```typescript
interface DataQuality {
  completeness: number // 0-100
  lastUpdated: Date
  missingFields: string[]
}

// Show badge on dashboard:
// 🟢 Complete (90-100%)
// 🟡 Partial (50-89%)
// 🔴 Incomplete (0-49%)
```

### Phase 2: Improve Dashboard Layout (HIGH PRIORITY)

#### 2.1 Hero Section
**Location:** Top of dashboard

**Content:**
```
┌─────────────────────────────────────────────────────┐
│  👋 Tervetuloa, [Company Name]                      │
│                                                      │
│  [Data Quality Badge: 🟡 60% Complete]              │
│                                                      │
│  Quick Actions:                                     │
│  [Upload Documents] [New Application] [View Guide]  │
└─────────────────────────────────────────────────────┘
```

#### 2.2 Key Metrics Section (Top)
**Layout:** 3-4 key metrics in cards

**Metrics to show:**
1. Latest Revenue (with YoY change)
2. Profitability (EBITDA or Net Profit)
3. Financial Health Score
4. Available Funding Capacity

**Improvement:**
- Show trend indicators (↑ ↓ →)
- Add context tooltips
- Link to detailed view

#### 2.3 Sections Order
**Recommended hierarchy:**

1. **Overview** (Hero + Key Metrics)
2. **Action Items** (What user should do next)
3. **Funding Recommendations** (If available)
4. **Active Applications** (If any)
5. **Financial Analysis** (Detailed charts)
6. **Recent Documents**

### Phase 3: Data Fetching Optimization (MEDIUM PRIORITY)

#### 3.1 API Response Structure
**File:** `app/api/dashboard/route.ts`

**Current issues:**
- Fetches all metrics even when only need latest
- No data validation before sending to frontend
- Missing error context

**Improvements:**
```typescript
interface DashboardResponse {
  company: CompanyInfo
  metrics: {
    latest: FinancialMetrics | null
    historical: FinancialMetrics[]
    completeness: number
    missingFields: string[]
  }
  applications: {
    active: FundingApplication[]
    total: number
    byStatus: Record<string, number>
  }
  recommendations: {
    available: Recommendation[]
    applied: string[]
  }
  documents: {
    recent: Document[]
    total: number
    byYear: Record<number, number>
  }
  actionItems: ActionItem[]
}
```

#### 3.2 Data Validation
**New file:** `lib/validators/dashboardData.ts`

```typescript
export function validateFinancialMetrics(metrics: any): {
  isValid: boolean
  completeness: number
  errors: string[]
  warnings: string[]
}

export function enrichMetricsWithDefaults(metrics: any): FinancialMetrics
```

#### 3.3 Caching Strategy
- Use React Query's staleTime and cacheTime effectively
- Implement optimistic updates for user actions
- Add invalidation on document upload/application submit

### Phase 4: Localization Completeness (HIGH PRIORITY)

#### 4.1 Translation Audit
**Script:** `scripts/audit-dashboard-translations.ts`

Check:
- All Dashboard.json keys used in components
- All status/type enums have translations
- Consistent terminology across languages

#### 4.2 Missing Translations
**Add to Dashboard.json:**

```json
{
  "emptyStates": {
    "noData": {
      "title": "Ei taloustietoja",
      "description": "Lataa tilinpäätös saadaksesi rahoitussuosituksia",
      "action": "Lataa tilinpäätös"
    },
    "noApplications": {
      "title": "Ei hakemuksia",
      "description": "Aloita rahoitushakemus saadaksesi tarjouksia",
      "action": "Aloita hakemus"
    }
  },
  "dataQuality": {
    "complete": "Tiedot täydelliset",
    "partial": "Tiedot osittaiset",
    "incomplete": "Tiedot puutteelliset",
    "lastUpdated": "Päivitetty",
    "missingFields": "Puuttuvat kentät"
  },
  "metrics": {
    "trend": {
      "up": "Kasvanut",
      "down": "Laskenut",
      "stable": "Pysynyt samana"
    },
    "notAvailable": "Ei saatavilla",
    "partial": "Osittainen tieto"
  },
  "actions": {
    "uploadDocument": "Lataa dokumentti",
    "startApplication": "Aloita hakemus",
    "viewRecommendations": "Näytä suositukset",
    "completeProfile": "Täydennä profiili"
  }
}
```

#### 4.3 Funding Type Mappings
**Ensure all DB enum values have translations:**

```typescript
// Current DB enum: funding_application_type
export const FUNDING_TYPE_TRANSLATIONS: Record<string, TranslationKey> = {
  'business_loan_unsecured': 'fundingTypes.businessLoanUnsecured',
  'business_loan_secured': 'fundingTypes.businessLoanSecured',
  'credit_line': 'fundingTypes.creditLine',
  'factoring_ar': 'fundingTypes.factoringAr',
  'leasing': 'fundingTypes.leasing',
  'bank_guarantee': 'fundingTypes.bankGuarantee',
  'refinancing': 'fundingTypes.refinancing',
  'unknown': 'fundingTypes.unknown'
}
```

### Phase 5: Action Items & Onboarding (MEDIUM PRIORITY)

#### 5.1 Smart Action Items
**Component:** `components/dashboard/ActionItems.tsx`

**Logic:**
```typescript
function getActionItems(dashboardData: DashboardData): ActionItem[] {
  const items: ActionItem[] = []
  
  // No financial data
  if (!dashboardData.metrics.latest) {
    items.push({
      id: 'upload_financials',
      priority: 'high',
      title: t('actions.uploadFinancials'),
      description: t('actions.uploadFinancialsDesc'),
      action: () => router.push('/dashboard/documents'),
      icon: FileUp
    })
  }
  
  // Financial data incomplete
  if (dashboardData.metrics.completeness < 70) {
    items.push({
      id: 'complete_data',
      priority: 'medium',
      title: t('actions.completeData'),
      description: t('actions.completeDataDesc'),
      missingFields: dashboardData.metrics.missingFields,
      icon: AlertCircle
    })
  }
  
  // No applications but has recommendations
  if (dashboardData.applications.total === 0 && 
      dashboardData.recommendations.available.length > 0) {
    items.push({
      id: 'start_application',
      priority: 'high',
      title: t('actions.startApplication'),
      description: t('actions.startApplicationDesc'),
      action: () => router.push('/finance-application'),
      icon: Rocket
    })
  }
  
  // Pending applications
  const pendingApps = dashboardData.applications.byStatus['submitted'] || 0
  if (pendingApps > 0) {
    items.push({
      id: 'check_applications',
      priority: 'medium',
      title: t('actions.checkApplications', { count: pendingApps }),
      description: t('actions.checkApplicationsDesc'),
      icon: Clock
    })
  }
  
  return items.sort((a, b) => 
    PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
  )
}
```

#### 5.2 Progressive Disclosure
- Show simple view by default
- "Show more details" to expand sections
- Remember user's preferences (localStorage)

### Phase 6: Visual Improvements (LOW PRIORITY)

#### 6.1 Charts Enhancement
- Add loading skeletons
- Show "No data" state with illustration
- Add data labels for better readability
- Consistent color scheme

#### 6.2 Icons & Illustrations
**Use lucide-react icons:**
- Financial data: TrendingUp, BarChart, PieChart
- Documents: FileText, Upload, Check
- Applications: Send, Clock, CheckCircle
- Recommendations: Lightbulb, Target, Award

#### 6.3 Responsive Design
- Mobile: Stack cards vertically
- Tablet: 2-column layout
- Desktop: 3-4 column layout
- Test with actual devices

### Phase 7: Performance (LOW PRIORITY)

#### 7.1 Code Splitting
```typescript
// Lazy load heavy components
const AdvancedFinancialCharts = dynamic(
  () => import('@/components/dashboard/AdvancedFinancialCharts'),
  { loading: () => <Skeleton />, ssr: false }
)
```

#### 7.2 Reduce Bundle Size
- Remove unused Recharts components
- Optimize images
- Tree-shake unused utilities

## Implementation Priority

### Sprint 1 (Week 1) - CRITICAL FIXES
- ✅ Fix database field mapping (amount, type)
- ✅ Fix translation issues (status, funding types)
- ✅ Fix null-safe rendering for amounts
- ✅ Filter already-applied funding types
- [ ] Add empty state components
- [ ] Improve data quality indicators

### Sprint 2 (Week 2) - UX IMPROVEMENTS
- [ ] Redesign dashboard layout (hero section)
- [ ] Add action items component
- [ ] Improve key metrics display
- [ ] Add data completeness indicators

### Sprint 3 (Week 3) - DATA & API
- [ ] Optimize API response structure
- [ ] Add data validation layer
- [ ] Implement better caching
- [ ] Add data enrichment logic

### Sprint 4 (Week 4) - POLISH
- [ ] Complete all translations
- [ ] Add charts improvements
- [ ] Mobile responsive fixes
- [ ] Performance optimization

## Testing Checklist

### Unit Tests
- [ ] Null-safe rendering for all metric cards
- [ ] Translation key resolution
- [ ] Data validation functions
- [ ] Action items logic

### Integration Tests
- [ ] Dashboard loads with empty data
- [ ] Dashboard loads with partial data
- [ ] Dashboard loads with complete data
- [ ] Application filtering works correctly

### E2E Tests (Cypress)
- [ ] User can upload document from dashboard
- [ ] User can start application from dashboard
- [ ] User can view all sections
- [ ] Mobile navigation works

## Success Metrics

1. **User Satisfaction**
   - Dashboard looks professional ✅
   - Clear next actions visible
   - No confusing NULL/NaN values

2. **Data Quality**
   - All financial metrics display correctly
   - Missing data clearly indicated
   - Trends visible when data available

3. **Performance**
   - Dashboard loads in < 2s
   - Smooth animations
   - No layout shifts

4. **Localization**
   - 100% translation coverage
   - Consistent terminology
   - Natural language flow

## Files to Modify

### Critical Path
1. ✅ `app/[locale]/dashboard/DashboardPageOptimized.tsx`
2. ✅ `app/api/dashboard/route.ts`
3. ✅ `components/dashboard/FundingRecommendations.tsx`
4. ✅ `components/dashboard/CompanyOverview.tsx`
5. ✅ `messages/fi/Dashboard.json`
6. ✅ `messages/en/Dashboard.json`
7. ✅ `messages/sv/Dashboard.json`
8. ✅ `hooks/useDashboardQueries.ts`

### New Files Needed
1. [ ] `components/dashboard/EmptyStates/NoFinancialData.tsx`
2. [ ] `components/dashboard/EmptyStates/NoApplications.tsx`
3. [ ] `components/dashboard/ActionItems.tsx`
4. [ ] `components/dashboard/DataQualityBadge.tsx`
5. [ ] `lib/validators/dashboardData.ts`
6. [ ] `scripts/audit-dashboard-translations.ts`

## Notes

- All fixes marked with ✅ have been implemented in session 2025-10-13
- Remaining items need to be prioritized based on user feedback
- Consider adding feature flags for gradual rollout
- Document all new translation keys in translation guidelines

## Next Steps

1. **Immediate (Today):**
   - ✅ Restart dev server to see translation fixes
   - ✅ Test on http://localhost:3001/fi/dashboard
   - [ ] User acceptance testing

2. **This Week:**
   - [ ] Implement empty state components
   - [ ] Add data quality indicators
   - [ ] Improve hero section

3. **This Month:**
   - [ ] Complete all 4 sprints
   - [ ] User testing session
   - [ ] Performance audit

