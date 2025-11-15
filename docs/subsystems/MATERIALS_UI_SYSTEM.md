# Materials Generation UI System

## Overview

Complete UI system for BizExit platform's materials generation with Gamma.app integration. Provides comprehensive controls for:

1. **Gamma Presentation Configuration** - Theme, colors, branding, layout
2. **Material Preview & Editing** - View, edit, export, share presentations
3. **Template Selection** - Industry and style-specific templates
4. **Enrichment Module Configuration** - Select which of 17 data modules to include

## Architecture

```
Materials Generation Workflow UI
         │
         ├── MaterialGenerationWizard (existing)
         │   ├── Step 1: Material Selection
         │   ├── Step 2: Data Collection Progress
         │   ├── Step 3: Document Upload
         │   ├── Step 4: AI Questionnaire
         │   └── Step 5: Completion & Review
         │
         ├── Configuration Panels (NEW)
         │   ├── GammaConfigurationPanel
         │   ├── EnrichmentConfigurationPanel
         │   └── MaterialTemplateSelector
         │
         └── Preview & Management (NEW)
             └── MaterialPreviewEdit
```

## Components

### 1. GammaConfigurationPanel

**Location:** `components/materials/GammaConfigurationPanel.tsx`

**Purpose:** Configure Gamma presentation design settings for company materials

**Features:**
- 5 theme options (Professional, Modern, Minimal, Creative, Corporate)
- Brand color picker with 8 presets
- Font style selection (Sans, Serif, Modern, Classic)
- Slide layout (Widescreen 16:9, Standard 4:3, Compact)
- Toggle options: Company logo, footer, slide transitions

**Usage:**
```tsx
import { GammaConfigurationPanel } from '@/components/materials/GammaConfigurationPanel';

<GammaConfigurationPanel
  companyId={companyId}
  initialConfig={existingConfig}
  onSave={(config) => console.log('Saved:', config)}
  onCancel={() => router.back()}
/>
```

**API Endpoint:**
- `GET /api/companies/[id]/gamma-config` - Fetch current configuration
- `PUT /api/companies/[id]/gamma-config` - Update configuration

**Data Structure:**
```typescript
interface GammaConfig {
  theme: "professional" | "modern" | "minimal" | "creative" | "corporate";
  brandColor: string; // Hex color
  secondaryColor?: string;
  fontStyle: "sans" | "serif" | "modern" | "classic";
  slideLayout: "standard" | "widescreen" | "compact";
  includeCompanyLogo: boolean;
  includeFooter: boolean;
  slideTransitions: boolean;
}
```

### 2. MaterialPreviewEdit

**Location:** `components/materials/MaterialPreviewEdit.tsx`

**Purpose:** Preview and manage generated materials with Gamma integration

**Features:**
- **Preview Tab:** Embedded Gamma presentation iframe
- **Content Tab:** View raw JSON content used for generation
- **Embed Tab:** Get embed code for websites
- **Actions:**
  - View presentation (opens Gamma view URL)
  - Edit in Gamma (opens Gamma edit URL)
  - Share link (copy to clipboard)
  - Export as PDF
  - Export as PPTX
  - Regenerate material
  - Delete material

**Usage:**
```tsx
import { MaterialPreviewEdit } from '@/components/materials/MaterialPreviewEdit';

<MaterialPreviewEdit
  material={materialAsset}
  onRegenerate={() => startRegenerationFlow()}
  onDelete={() => handleDelete()}
/>
```

**API Endpoints:**
- `POST /api/materials/[id]/export` - Export to PDF/PPTX
  ```json
  { "format": "pdf" | "pptx" }
  ```

**Material Asset Structure:**
```typescript
interface MaterialAsset {
  id: string;
  name: string;
  type: "teaser" | "im" | "pitch_deck";
  content: any; // Generated teaser content
  gamma_presentation_id?: string;
  gamma_presentation_url?: string;
  gamma_edit_url?: string;
  gamma_embed_url?: string;
  storage_path?: string;
  created_at: string;
  updated_at?: string;
  company: {
    id: string;
    name: string;
  };
}
```

### 3. EnrichmentConfigurationPanel

**Location:** `components/materials/EnrichmentConfigurationPanel.tsx`

**Purpose:** Select which of the 17 enrichment modules to include in generation

**Features:**
- **Base Modules (1-9):**
  - Basic Info ✓ (Required)
  - Financial Data ✓ (Required)
  - Industry Analysis
  - Competitive Analysis
  - Growth Analysis
  - Financial Health
  - Personnel Info
  - Market Intelligence
  - Web Presence

- **M&A Specific Modules (10-17):**
  - M&A History
  - Valuation Data
  - Customer Intelligence
  - Operational Efficiency
  - Competitive Advantages
  - Risk Assessment
  - Integration Potential
  - Exit Attractiveness

- **UI Features:**
  - Module cards with descriptions
  - Time estimates per module
  - "Select All" and "Defaults" shortcuts
  - Total estimated time calculation
  - Required badges for mandatory modules

**Usage:**
```tsx
import { EnrichmentConfigurationPanel } from '@/components/materials/EnrichmentConfigurationPanel';

<EnrichmentConfigurationPanel
  companyId={companyId}
  initialSelection={['basic_info', 'financial_data', 'industry_analysis']}
  onSave={(modules) => console.log('Selected modules:', modules)}
  onCancel={() => router.back()}
/>
```

**API Endpoint:**
- `GET /api/companies/[id]/enrichment-config` - Fetch current selection
- `PUT /api/companies/[id]/enrichment-config` - Update selection

**Data Structure:**
```typescript
{
  modules: string[]; // Array of module IDs
}
```

### 4. MaterialTemplateSelector

**Location:** `components/materials/MaterialTemplateSelector.tsx`

**Purpose:** Choose from predefined presentation templates

**Features:**
- **6 Templates:**
  1. Professional M&A Teaser (11 slides) - Recommended
  2. Tech Startup Pitch (15 slides)
  3. Manufacturing Company Overview (20 slides)
  4. Retail Business Presentation (12 slides)
  5. Service Company Profile (14 slides)
  6. Minimal Executive Summary (8 slides)

- **Template Attributes:**
  - Category: General, Tech, Retail, Manufacturing, Services
  - Style: Formal, Modern, Creative, Minimal
  - Slide count
  - Feature list
  - Preview dialog

**Usage:**
```tsx
import { MaterialTemplateSelector } from '@/components/materials/MaterialTemplateSelector';

<MaterialTemplateSelector
  selectedTemplate={selectedId}
  onSelect={(templateId) => setSelectedTemplate(templateId)}
  materialType="teaser" // Filters templates by type
/>
```

**Template Structure:**
```typescript
interface MaterialTemplate {
  id: string;
  name: string;
  description: string;
  category: "general" | "tech" | "retail" | "manufacturing" | "services";
  style: "formal" | "modern" | "creative" | "minimal";
  slides: number;
  features: string[]; // List of included sections
  preview?: string; // Preview image URL
  recommended: boolean;
}
```

## Integration with Existing Wizard

### Enhanced MaterialGenerationWizard

Add these panels as optional steps or settings modals:

**Option 1: Add Configuration Step**
```tsx
// In MaterialGenerationWizard.tsx
const [step, setStep] = useState<
  "select" | "config" | "progress" | "upload" | "questionnaire" | "complete"
>("select");

// After material selection, before starting generation:
if (step === "config") {
  return (
    <div className="space-y-6">
      <GammaConfigurationPanel
        companyId={companyId}
        onSave={(config) => {
          // Store config, proceed to generation
          setStep("progress");
          handleStartGeneration();
        }}
        onCancel={() => setStep("select")}
      />
      
      <EnrichmentConfigurationPanel
        companyId={companyId}
        onSave={(modules) => {
          // Store module selection
        }}
      />
      
      <MaterialTemplateSelector
        materialType="teaser"
        onSelect={(templateId) => {
          // Store template selection
        }}
      />
    </div>
  );
}
```

**Option 2: Settings Modal**
```tsx
// Add configuration button in selection step
<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">
      <Settings className="w-4 h-4 mr-2" />
      Configure Settings
    </Button>
  </DialogTrigger>
  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
    <Tabs defaultValue="gamma">
      <TabsList>
        <TabsTrigger value="gamma">Design</TabsTrigger>
        <TabsTrigger value="enrichment">Data Modules</TabsTrigger>
        <TabsTrigger value="template">Template</TabsTrigger>
      </TabsList>
      <TabsContent value="gamma">
        <GammaConfigurationPanel companyId={companyId} />
      </TabsContent>
      <TabsContent value="enrichment">
        <EnrichmentConfigurationPanel companyId={companyId} />
      </TabsContent>
      <TabsContent value="template">
        <MaterialTemplateSelector materialType="teaser" onSelect={...} />
      </TabsContent>
    </Tabs>
  </DialogContent>
</Dialog>
```

## Page Integration

### Materials Dashboard Page

**Existing:** `/app/[locale]/dashboard/materials/page.tsx`

**Enhancement:** Add quick access to preview/edit

```tsx
// In materials list
{materials.map((material) => (
  <Card key={material.id}>
    {/* Existing content */}
    <CardFooter>
      <Button asChild>
        <Link href={`/dashboard/materials/${material.id}/preview`}>
          <Eye className="w-4 h-4 mr-2" />
          Preview & Edit
        </Link>
      </Button>
    </CardFooter>
  </Card>
))}
```

### New Preview Page

**Create:** `/app/[locale]/dashboard/materials/[id]/preview/page.tsx`

```tsx
import { MaterialPreviewEdit } from '@/components/materials/MaterialPreviewEdit';

export default async function MaterialPreviewPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  
  // Fetch material
  const { data: material } = await supabase
    .from('company_assets')
    .select('*, companies!inner(*)')
    .eq('id', id)
    .single();

  return (
    <div className="container mx-auto py-10">
      <MaterialPreviewEdit
        material={material}
        onRegenerate={() => redirect(`/dashboard/materials/regenerate/${id}`)}
        onDelete={async () => {
          'use server';
          await supabase.from('company_assets').delete().eq('id', id);
          redirect('/dashboard/materials');
        }}
      />
    </div>
  );
}
```

### Company Settings Page

**Enhancement:** Add Gamma configuration tab

**Location:** `/app/[locale]/dashboard/companies/[id]/settings/page.tsx`

```tsx
<Tabs defaultValue="general">
  <TabsList>
    <TabsTrigger value="general">General</TabsTrigger>
    <TabsTrigger value="gamma">Gamma Design</TabsTrigger>
    <TabsTrigger value="enrichment">Data Modules</TabsTrigger>
  </TabsList>
  
  <TabsContent value="gamma">
    <GammaConfigurationPanel companyId={companyId} />
  </TabsContent>
  
  <TabsContent value="enrichment">
    <EnrichmentConfigurationPanel companyId={companyId} />
  </TabsContent>
</Tabs>
```

## Translations

All components are fully localized with translations in:

- **English:** `messages/en/materials.json`
- **Finnish:** `messages/fi/materials.json`
- **Swedish:** `messages/sv/materials.json`

### Translation Keys Structure

```json
{
  "gamma_config": {
    "title": "...",
    "theme": { /* ... */ },
    "brand_color": { /* ... */ },
    "font_style": { /* ... */ },
    "slide_layout": { /* ... */ },
    "options": { /* ... */ },
    "actions": { /* ... */ },
    "note": { /* ... */ }
  },
  "preview": {
    "title": "...",
    "tabs": { /* ... */ },
    "actions": { /* ... */ },
    "stats": { /* ... */ },
    "management": { /* ... */ }
  },
  "templates": {
    "title": "...",
    "category": { /* ... */ },
    "style": { /* ... */ }
  },
  "enrichment": {
    "title": "...",
    "summary": { /* ... */ },
    "categories": { /* ... */ },
    "modules": { /* 17 modules */ },
    "actions": { /* ... */ }
  }
}
```

### Usage Example

```tsx
'use client';
import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('materials.gamma_config');
  
  return (
    <h1>{t('title')}</h1>
  );
}
```

## Database Schema Updates

### Companies Table

Add new JSONB columns:

```sql
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS gamma_config JSONB,
  ADD COLUMN IF NOT EXISTS enrichment_config JSONB;

COMMENT ON COLUMN companies.gamma_config IS 'Gamma presentation design configuration';
COMMENT ON COLUMN companies.enrichment_config IS 'Selected enrichment modules';
```

### Company Assets Table

Already has required fields (from previous migration):

```sql
-- Existing fields
gamma_presentation_id TEXT,
gamma_presentation_url TEXT,
gamma_edit_url TEXT,  -- Added in migration 20251115132354
gamma_embed_url TEXT,
```

## Testing

### Component Testing

```bash
# Run component tests
npm test components/materials
```

### E2E Testing

```bash
# Create Cypress test
npx cypress open

# Test file: cypress/e2e/materials-configuration.cy.ts
describe('Materials Configuration', () => {
  it('should configure Gamma settings', () => {
    cy.visit('/dashboard/companies/test-company/settings');
    cy.get('[data-testid="gamma-config"]').click();
    cy.get('[data-testid="theme-modern"]').click();
    cy.get('[data-testid="brand-color"]').type('#2563EB');
    cy.get('[data-testid="save-config"]').click();
    cy.contains('Configuration saved');
  });
});
```

## Security

### API Route Protection

All API endpoints include:

1. **Authentication Check**
   ```typescript
   const { data: { user }, error } = await supabase.auth.getUser();
   if (error || !user) {
     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   }
   ```

2. **Organization Access Verification**
   ```typescript
   const { data: profile } = await supabase
     .from("profiles")
     .select(`user_organizations!inner(organization_id)`)
     .eq("id", user.id)
     .eq("user_organizations.organization_id", company.organization_id)
     .single();
   
   if (!profile) {
     return NextResponse.json({ error: "Forbidden" }, { status: 403 });
   }
   ```

3. **Role-Based Access**
   ```typescript
   if (!["seller", "broker", "admin", "partner"].includes(profile.role)) {
     return NextResponse.json({ error: "Forbidden" }, { status: 403 });
   }
   ```

## Performance Optimization

### Lazy Loading

```tsx
// Dynamic import for heavy components
const MaterialPreviewEdit = dynamic(
  () => import('@/components/materials/MaterialPreviewEdit').then(mod => mod.MaterialPreviewEdit),
  { loading: () => <LoadingSpinner /> }
);
```

### Caching

```typescript
// Cache configuration in memory
const configCache = new Map<string, GammaConfig>();

export async function getGammaConfig(companyId: string) {
  if (configCache.has(companyId)) {
    return configCache.get(companyId);
  }
  // Fetch from API
  const config = await fetchConfig(companyId);
  configCache.set(companyId, config);
  return config;
}
```

## Future Enhancements

1. **Real-time Preview**
   - Live preview of theme/color changes
   - Instant template preview generation

2. **Template Customization**
   - Create custom templates
   - Save favorite templates
   - Template marketplace

3. **Advanced Gamma Features**
   - Animation controls
   - Custom slide layouts
   - Brand kit integration

4. **Analytics**
   - Track which templates perform best
   - Monitor material view/download metrics
   - A/B testing for templates

## Troubleshooting

### Common Issues

**Issue:** Configuration not saving
```typescript
// Check browser console for errors
// Verify API endpoint returns 200
// Check network tab for request payload
```

**Issue:** Gamma presentation not loading
```typescript
// Verify GAMMA_API_KEY is set in .env.local
// Check Gamma API status: https://developers.gamma.app/status
// Ensure gamma_presentation_url is valid
```

**Issue:** Export fails
```typescript
// Gamma export requires Pro/Ultra subscription
// Check Gamma API key permissions
// Fallback: Download from Gamma manually
```

## Support

- **Documentation:** `docs/subsystems/GAMMA_INTEGRATION.md`
- **API Reference:** `docs/subsystems/GAMMA_AUDIT_2025-11-15.md`
- **Component Docs:** Inline JSDoc comments in each component

---

**Last Updated:** 2025-11-15  
**Status:** ✅ Production Ready  
**Version:** 1.0.0

