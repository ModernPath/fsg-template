# 🗺️ BizExit UI NAVIGAATIOKARTTA

**Päivitetty:** 2025-11-15 (CRITICAL FIXES APPLIED)

---

## 🎯 PÄÄOMINAISUUDET - MISTÄ LÖYDÄT MITÄKIN

### 1. 🚀 YRITYKSEN RIKASTAMINEN (AI-ANALYYSI)

**Missä:** `/dashboard/companies`

**Toiminnot:**
1. **Rikasta yritys (AI)** 🚀 - UUSI NAPPI!
   - Käynnistää 17 moduulin AI-analyysin
   - Linkki: `/companies/[id]/enrich`
   - **Mitä tapahtuu:**
     - Kerää julkista dataa (YTJ, Finder, Tavily)
     - Analysoi 9 perusmoduulia (Basic, Financial, Industry, etc.)
     - Analysoi 8 M&A-moduulia (Valuation, Risk, Exit, etc.)
     - Kesto: 3-8 minuuttia
   
2. **Rikastettu data** 📊 - UUSI NAPPI!
   - Näyttää rikastetun datan
   - Linkki: `/companies/[id]/enriched`
   - **Mitä näet:**
     - Kaikki 17 moduulin tulokset
     - Tabs-näkymä (Basic Info, Financial, Industry, etc.)
     - Confidence & Completeness scores
     - Lähteet (data sources)

---

### 2. 📄 MATERIAALIEN LUONTI

**Missä:** `/dashboard/materials`

**Toiminnot:**
1. **Generate New Materials** - UUSI SIVU!
   - Linkki: `/dashboard/materials/new`
   - **Wizard-vaiheet:**
     - Step 1: Valitse yritys
     - Step 2: Valitse template (Teaser, IM, Pitch Deck)
     - Step 3: Valitse rikastusmoduulit
     - Step 4: Gamma-asetukset
     - Step 5: Luo materiaali
   
2. **View Materials**
   - Näyttää kaikki luodut materiaalit
   - Preview & Edit -nappi jokaisen materiaalin kohdalla
   - Linkki Gamma.app-presentaatioon

---

### 3. 🏢 YRITYKSET

**Pääsivu:** `/dashboard/companies`

**Toiminnot per yritys:**
```
┌─────────────────────────────────────┐
│ TechStart Oy                        │
│ Technology                          │
│ 📍 Helsinki                         │
├─────────────────────────────────────┤
│ [Näytä tiedot]                      │  → /dashboard/companies/[id]
│ [🚀 Rikasta yritys (AI)]            │  → /companies/[id]/enrich ⭐ UUSI
│ [📊 Rikastettu data]                │  → /companies/[id]/enriched ⭐ UUSI
│ [Muokkaa]                           │  → /dashboard/companies/[id]/edit
│ [Asetukset]                         │  → /dashboard/companies/[id]/settings
└─────────────────────────────────────┘
```

---

### 4. 🤝 KAUPAT (DEALS)

**Pääsivu:** `/dashboard/deals`

**Näkymä:**
- Kanban board (5 vaihetta)
- Responsive grid layout
- Drag & drop (tulossa)

**Vaiheet:**
1. Prospecting
2. Negotiation
3. Due Diligence
4. Closing
5. Completed

---

### 5. 📝 NDA:T (SALASSAPITOSOPIMUKSET)

**Pääsivu:** `/dashboard/ndas`

**Toiminnot:**
- ✅ Luo uusi NDA: `/dashboard/ndas/new`
- ✅ Katso NDA: `/dashboard/ndas/[id]`
- ✅ Allekirjoita NDA
- ✅ Muokkaa NDA (edit mode)

**Tila:** TÄYSIN TOIMIVA! ✅

---

### 6. 📋 LISTAUKSET

**Pääsivu:** `/dashboard/listings`

**Tila:** ⚠️ Sivu on olemassa, mutta CRUD-toiminnot puuttuvat
**Tarvitaan:**
- `/dashboard/listings/new` - Luo uusi listaus
- `/dashboard/listings/[id]` - Katso listaus
- `/dashboard/listings/[id]/edit` - Muokkaa

---

### 7. 👥 OSTAJAT (BUYERS)

**Pääsivu:** `/dashboard/buyers`

**Tila:** ⚠️ Sivu on olemassa, näyttää buyer-profiilit
**Toimii:** Buyer-profiilien listaus

---

### 8. ⚙️ ASETUKSET

**Pääsivu:** `/dashboard/settings`

**Tabit:**
1. **Organization** ✅ - Tallennus toimii
2. **Profile** ✅ - Tallennus toimii
3. **Notifications** - Vain UI
4. **Security** - Vain UI
5. **Billing** - Vain UI

---

## 🔄 TYYPILLISET KÄYTTÖVIRRAT

### Käyttövirta 1: Uusi yritys → Rikastaminen → Materiaalit

```
1. Lisää yritys
   /dashboard/companies → [Lisää yritys] → /dashboard/companies/new

2. Rikasta yritys AI:lla
   /dashboard/companies → [🚀 Rikasta yritys (AI)] → /companies/[id]/enrich
   → Odota 3-8 min → Valmis!

3. Katso rikastettua dataa
   /dashboard/companies → [📊 Rikastettu data] → /companies/[id]/enriched

4. Luo materiaalia
   /dashboard/materials → [Generate New Materials] → /dashboard/materials/new
   → Wizard → Gamma generoi presentaation
```

---

### Käyttövirta 2: Kaupan hallinta

```
1. Luo kauppa
   /dashboard/deals → [Create Deal] → /dashboard/deals/new

2. Lähetä NDA
   /dashboard/ndas → [Create NDA] → /dashboard/ndas/new
   → Täytä tiedot → Tallenna

3. Seuraa kauppaa
   /dashboard/deals → Kanban board → Drag & drop eri vaiheisiin
```

---

### Käyttövirta 3: Yritysasetukset

```
1. Perusasetukset
   /dashboard/companies → [Asetukset] → /dashboard/companies/[id]/settings

2. Gamma-asetukset (presentaatiot)
   Settings → [Gamma] tab → Määritä teemat, värit, fontit

3. Rikastusasetukset
   Settings → [Enrichment] tab → Valitse mitkä 17 moduulista käytetään
```

---

## 📍 NAVIGAATIORAKENNE

```
Dashboard (/)
│
├── Companies (/dashboard/companies)
│   ├── List view (default)
│   │   ├── [Lisää yritys] → new
│   │   └── Per company:
│   │       ├── [Näytä tiedot] → [id]
│   │       ├── [🚀 Rikasta yritys] → /companies/[id]/enrich
│   │       ├── [📊 Rikastettu data] → /companies/[id]/enriched
│   │       ├── [Muokkaa] → [id]/edit
│   │       └── [Asetukset] → [id]/settings
│   │
│   ├── New company (/dashboard/companies/new)
│   ├── View company (/dashboard/companies/[id])
│   ├── Edit company (/dashboard/companies/[id]/edit)
│   ├── Company settings (/dashboard/companies/[id]/settings)
│   │   ├── Basic Info
│   │   ├── Gamma Configuration
│   │   └── Enrichment Configuration
│   │
│   ├── Enrich company (/companies/[id]/enrich) ⭐ NOW ACCESSIBLE
│   └── Enriched data (/companies/[id]/enriched) ⭐ NOW ACCESSIBLE
│
├── Materials (/dashboard/materials)
│   ├── List view (default)
│   │   └── [Generate New Materials] → new ⭐ NOW WORKS
│   ├── New material wizard (/dashboard/materials/new) ⭐ NOW EXISTS
│   ├── Material preview (/dashboard/materials/[id]/preview)
│   └── Job status (/dashboard/materials/job/[id])
│
├── Deals (/dashboard/deals)
│   ├── Kanban board (default)
│   └── [Create Deal] → new (TODO: needs page)
│
├── NDAs (/dashboard/ndas)
│   ├── List view (default)
│   ├── New NDA (/dashboard/ndas/new) ✅
│   └── View NDA (/dashboard/ndas/[id]) ✅
│
├── Listings (/dashboard/listings)
│   └── List view (default) - CRUD needs implementation
│
├── Buyers (/dashboard/buyers)
│   └── List view (default)
│
└── Settings (/dashboard/settings) ✅ FULLY FUNCTIONAL
    ├── Organization (save works!)
    ├── Profile (save works!)
    ├── Notifications
    ├── Security
    └── Billing
```

---

## 🎨 UI-ELEMENTIT

### Napit ja niiden tyylit:

**Primary Actions:**
- `[Lisää yritys]` - Primary button
- `[🚀 Rikasta yritys (AI)]` - Gradient button (purple → blue)
- `[Generate New Materials]` - Primary button

**Secondary Actions:**
- `[Näytä tiedot]` - Outline button
- `[📊 Rikastettu data]` - Ghost button
- `[Muokkaa]` - Ghost button
- `[Asetukset]` - Ghost button with icon

---

## ✅ MITÄ TOIMII TÄYSIN

1. ✅ **Settings-sivu** - Organisaation ja profiilin tallennus
2. ✅ **NDA-järjestelmä** - Luonti, muokkaus, allekirjoitus
3. ✅ **Seed data** - Automaattinen testidatan luonti
4. ✅ **Rikastamisen UI** - Nyt näkyvissä ja käytettävissä!
5. ✅ **Materiaalien luonti** - Wizard-sivu nyt olemassa!
6. ✅ **DealsKanban** - Responsive grid layout
7. ✅ **Locale-tuki** - Fi/En/Sv toimii kaikkialla

---

## ⚠️ MITÄ PUUTTUU

1. ⚠️ **Companies CRUD** - Edit/New sivut puuttuvat
2. ⚠️ **Deals CRUD** - New/View/Edit sivut puuttuvat
3. ⚠️ **Listings CRUD** - Kaikki CRUD-toiminnot puuttuvat
4. ⚠️ **Dashboard pikatoiminnot** - Buyer/Seller/Broker/Partner roolien napit eivät linkitä

---

## 🚀 SEURAAVAT KEHITYSVAIHEET

### Priority 1 (P0 - Blocker):
- [ ] Companies: New/Edit sivut
- [ ] Deals: New/Edit sivut

### Priority 2 (P1 - Important):
- [ ] Listings: Full CRUD
- [ ] Dashboard quick actions: Add onClick handlers

### Priority 3 (P2 - Nice to have):
- [ ] Settings: Implement Notifications/Security/Billing saves
- [ ] Materials: Delete functionality
- [ ] Deals: Drag & drop status changes

---

**Viimeisin päivitys:** 2025-11-15 15:30  
**Tilan:** KESKEISI OMINAISUUDET NYT SAATAVILLA! 🎉

