# 🗺️ DOKUMENTAATIOKARTTA - VISUAALINEN OHJE

**Version:** 1.0.0  
**Luotu:** 2025-01-15  
**Päivitetty:** 2025-01-15

---

## 📚 DOKUMENTAATIOHIERARKIA

```
📂 docs/development/
│
├── 📖 README.md ⭐⭐⭐
│   └── ALOITA TÄSTÄ - Yleiskatsaus kaikkiin dokumentteihin
│
├── 🔄 DOCUMENTATION_WORKFLOW.md ⭐⭐⭐⭐⭐
│   └── TÄRKEIN! Prosessi: Suunnittelu → Kehitys → Commit
│
├── 📋 architecture/
│   ├── IMPLEMENTATION_PLAN.md ⭐⭐⭐⭐
│   │   └── Yksityiskohtainen toteutussuunnitelma (Task-pohjainen)
│   └── CONSOLIDATED_ROADMAP.md ⭐⭐
│       └── Strateginen roadmap 2025-2028
│
├── 📊 progress/
│   └── DEVELOPMENT_PROGRESS.md ⭐⭐⭐
│       └── Päivittäinen seuranta ja metrics
│
├── 🗄️ migrations/
│   └── MIGRATION_TRACKER.md ⭐⭐
│       └── Database-muutokset ja rollback-ohjeet
│
├── 🎯 features/
│   ├── DASHBOARD_IMPROVEMENT_PLAN.md
│   └── ONBOARDING_RECOMMENDATIONS_PERSISTENCE.md
│
├── 🤖 agent/
│   └── AGENT_SYSTEM.md
│
├── 🚨 GIT_RULES.md ⭐⭐⭐⭐
│   └── KRIITTINEN! Never merge to main automatically
│
└── 🎨 UI_CONTRAST_GUIDELINES.md
```

---

## 🔄 PROSESSIKAAVIO

```
┌─────────────────────────────────────────────────────────┐
│                    UUSI FEATURE/FIX                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  1️⃣ SUUNNITTELU (Ennen koodausta)                       │
├─────────────────────────────────────────────────────────┤
│  ✅ Lue: IMPLEMENTATION_PLAN.md                         │
│  ✅ Lue: DEVELOPMENT_PROGRESS.md                        │
│  ✅ Määrittele Task ID (0.1, 0.2, ...)                 │
│  ✅ Päivitä: IMPLEMENTATION_PLAN.md (uusi Task)         │
│  ✅ Päivitä: DEVELOPMENT_PROGRESS.md (IN PROGRESS)      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  2️⃣ KEHITYSTYÖ (Koodauksen aikana)                      │
├─────────────────────────────────────────────────────────┤
│  🔄 Päivitä DEVELOPMENT_PROGRESS.md päivittäin          │
│  🐛 Jos bug → Päivitä learnings.md                      │
│  🗄️ Jos DB change → Päivitä MIGRATION_TRACKER.md        │
│  ✅ Testaa jatkuvasti                                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  3️⃣ COMMIT (KRIITTISIN VAIHE!)                          │
├─────────────────────────────────────────────────────────┤
│  ⚠️ PAKOLLINEN CHECKLIST:                               │
│  ✅ Koodi toimii (testattu)                             │
│  ✅ npm run lint (0 errors)                             │
│  ✅ TypeScript check (0 errors)                         │
│  ✅ Git branch: feature/* tai dev (EI main!)            │
│  📝 DOKUMENTAATIOPÄIVITYS:                              │
│     ✅ ai_changelog.md (PAKOLLINEN!)                    │
│     ✅ learnings.md (jos bug fix)                       │
│     ✅ DEVELOPMENT_PROGRESS.md                          │
│     ✅ IMPLEMENTATION_PLAN.md (status → COMPLETED)      │
│     ✅ MIGRATION_TRACKER.md (jos DB change)             │
│  ✅ Commit message (feat/fix/docs)                      │
│  ✅ Push feature/dev branch                             │
│  ✅ (Optional) Create PR to main                        │
│  ⏸️ (If PR) Wait for manual approval                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    ✅ VALMIS!                            │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 DOKUMENTTIMATRIISI

| Tilanne | Lue tämä | Päivitä tämä | Pakollinen? |
|---------|----------|--------------|-------------|
| **Aloitat projektin** | README.md, DOCUMENTATION_WORKFLOW.md | - | ✅ |
| **Suunnittelet uuden featuren** | IMPLEMENTATION_PLAN.md, DEVELOPMENT_PROGRESS.md | IMPLEMENTATION_PLAN.md (uusi Task), DEVELOPMENT_PROGRESS.md (IN PROGRESS) | ✅ |
| **Koodaat päivittäin** | DOCUMENTATION_WORKFLOW.md | DEVELOPMENT_PROGRESS.md (päivittäinen loki) | ✅ |
| **Kohtaat bugin** | learnings.md (aiemmat ratkaisut) | learnings.md (uusi ratkaisu), DEVELOPMENT_PROGRESS.md (Active Issues) | ✅ |
| **Teet database migration** | MIGRATION_TRACKER.md | MIGRATION_TRACKER.md (uusi migraatio) | ✅ |
| **Ennen committia** | DOCUMENTATION_WORKFLOW.md (checklist) | ai_changelog.md, learnings.md (jos bug), DEVELOPMENT_PROGRESS.md, IMPLEMENTATION_PLAN.md (status) | ✅ PAKOLLINEN! |
| **Ennen git pushia** | GIT_RULES.md | - | ✅ |
| **Laadit quarterly plania** | CONSOLIDATED_ROADMAP.md | CONSOLIDATED_ROADMAP.md (Q1-Q4) | ⏳ Optional |

---

## 🎯 DOKUMENTTIEN ROOLIT

### 1. PROSESSI & WORKFLOW

```
🔄 DOCUMENTATION_WORKFLOW.md ⭐⭐⭐⭐⭐
└── TÄRKEIN DOKUMENTTI!
    ├── Suunnittelu-vaihe: Mitä tehdä?
    ├── Kehitys-vaihe: Miten seurata?
    └── Commit-vaihe: Mitä dokumentoida?

🚨 GIT_RULES.md ⭐⭐⭐⭐
└── Git-säännöt ja turvallisuus
    ├── ❌ Never merge to main automatically
    ├── ✅ Feature/dev branches OK
    └── ⏸️ PR requires manual approval
```

### 2. SUUNNITTELU

```
📋 IMPLEMENTATION_PLAN.md ⭐⭐⭐⭐
└── Yksityiskohtainen toteutussuunnitelma
    ├── Task 0.1, 0.2, 0.3... (numerointi)
    ├── Tekniset ohjeet
    ├── Koodiesimerkit
    └── Status: ✅ VALMIS / 🔄 KESKEN / 📝 SUUNNITELTU

🗺️ CONSOLIDATED_ROADMAP.md ⭐⭐
└── Strateginen roadmap
    ├── Q1, Q2, Q3, Q4 2025-2028
    ├── ROI-arviot (⭐⭐⭐⭐⭐)
    └── Priorisointikriteerit (P0-P3)
```

### 3. SEURANTA

```
📊 DEVELOPMENT_PROGRESS.md ⭐⭐⭐
└── Päivittäinen seuranta
    ├── Viimeisimmät toteutukset
    ├── Käynnissä olevat työt
    ├── Aktiiviset bugit
    ├── Metrics & Performance
    └── Checkpoint-historia

📝 ai_changelog.md ⭐⭐⭐⭐⭐
└── PAKOLLINEN joka commitissa!
    ├── Mitä tehtiin?
    ├── Miksi tehtiin?
    ├── Vaikutukset
    └── Muutetut tiedostot

🎓 learnings.md ⭐⭐⭐
└── Bugit ja ratkaisut
    ├── Problem description
    ├── Root cause
    ├── Solution
    └── Prevention checklist
```

### 4. ERIKOISALUEET

```
🗄️ MIGRATION_TRACKER.md ⭐⭐
└── Database-muutokset
    ├── Suoritetut migraatiot
    ├── Rollback-ohjeet
    └── Tuotantomigraatiot

🎯 features/ ⭐
└── Ominaisuuskohtaiset suunnitelmat
    ├── DASHBOARD_IMPROVEMENT_PLAN.md
    └── ONBOARDING_RECOMMENDATIONS_PERSISTENCE.md

🤖 agent/
└── Agent-järjestelmä
    ├── AGENT_SYSTEM.md
    ├── checkpoints/
    └── logs/
```

---

## 🚦 KÄYTTÖTAPAUKSET

### Käyttötapaus 1: Aloitan uuden featuren

```bash
# 1. LUE
cat docs/development/README.md
cat docs/development/DOCUMENTATION_WORKFLOW.md
cat docs/development/architecture/IMPLEMENTATION_PLAN.md

# 2. PÄIVITÄ (Suunnittelu)
nano docs/development/architecture/IMPLEMENTATION_PLAN.md
# → Lisää Task 0.X

nano docs/development/progress/DEVELOPMENT_PROGRESS.md
# → Lisää "KÄYNNISSÄ OLEVAT TYÖT"

# 3. KEHITÄ
git checkout -b feature/new-feature
# ... koodaa ...

# 4. PÄIVITÄ (Päivittäin)
nano docs/development/progress/DEVELOPMENT_PROGRESS.md
# → Päivittäinen loki

# 5. PÄIVITÄ (Ennen committia)
nano docs/ai_changelog.md
nano docs/development/progress/DEVELOPMENT_PROGRESS.md
nano docs/development/architecture/IMPLEMENTATION_PLAN.md

# 6. COMMIT
npm run lint && npm run type-check
git add .
git commit -m "feat: new feature"
git push origin feature/new-feature
```

### Käyttötapaus 2: Korjaan bugin

```bash
# 1. LUE
cat docs/learnings.md  # Onko vastaavaa bugia korjattu?

# 2. KEHITÄ
git checkout -b fix/bug-name
# ... korjaa ...

# 3. PÄIVITÄ (Ennen committia)
nano docs/learnings.md
# → Lisää uusi ratkaisu

nano docs/ai_changelog.md
# → Lisää bug fix entry

nano docs/development/progress/DEVELOPMENT_PROGRESS.md
# → Siirrä Active Issues → Resolved Issues

# 4. COMMIT
npm run lint && npm run type-check
git add .
git commit -m "fix: bug description"
git push origin fix/bug-name
```

### Käyttötapaus 3: Teen database migration

```bash
# 1. LUE
cat docs/development/migrations/MIGRATION_TRACKER.md

# 2. LUO MIGRATION
supabase migration new add_column_name

# 3. PÄIVITÄ
nano docs/development/migrations/MIGRATION_TRACKER.md
# → Lisää uusi migraatio

# 4. TESTAA
supabase db reset

# 5. PÄIVITÄ (Ennen committia)
nano docs/ai_changelog.md
nano docs/development/progress/DEVELOPMENT_PROGRESS.md

# 6. COMMIT
git add .
git commit -m "feat: add database column X"
git push origin feature/db-migration
```

---

## ⚠️ YLEISIMMÄT VIRHEET

### ❌ VÄÄRÄ TAPA:

```bash
# 1. Koodaa ilman suunnitelmaa
# ... koodaa ...

# 2. Commitaa ilman dokumentaatiota
git add .
git commit -m "fixes"
git push origin main  # ❌ VÄÄRIN!
```

**Ongelmat:**
- ❌ Ei tiedetä mitä tehtiin
- ❌ Pushattiin mainiin suoraan
- ❌ Ei oppimisia dokumentoitu
- ❌ Ei seurantaa

### ✅ OIKEA TAPA:

```bash
# 1. SUUNNITTELE
# Päivitä IMPLEMENTATION_PLAN.md ja DEVELOPMENT_PROGRESS.md

# 2. KEHITÄ
git checkout -b feature/new-feature
# ... koodaa ...

# 3. PÄIVITÄ DOKUMENTAATIO (ENNEN COMMITTIA!)
nano docs/ai_changelog.md
nano docs/learnings.md  # jos bug fix
nano docs/development/progress/DEVELOPMENT_PROGRESS.md
nano docs/development/architecture/IMPLEMENTATION_PLAN.md

# 4. TARKISTA
npm run lint
npm run type-check
git branch --show-current  # ✅ feature/* tai dev

# 5. COMMIT
git add .
git commit -m "feat: clear description"
git push origin feature/new-feature  # ✅ OIKEIN!

# 6. (Optional) CREATE PR
# GitHub UI: feature/new-feature → main
# ⏸️ Wait for approval
```

---

## 📊 YHTEENVETO

### 5 PÄÄDOKUMENTTIA (Päivitä joka commitissa):

1. **ai_changelog.md** - Mitä tehtiin? (PAKOLLINEN!)
2. **DEVELOPMENT_PROGRESS.md** - Edistys ja status
3. **IMPLEMENTATION_PLAN.md** - Task status update
4. **learnings.md** - Bugit ja ratkaisut (jos bug fix)
5. **MIGRATION_TRACKER.md** - Database-muutokset (jos migraatio)

### 3 VAIHETTA:

1. **SUUNNITTELU** → Lue + Päivitä IMPLEMENTATION_PLAN & DEVELOPMENT_PROGRESS
2. **KEHITYSTYÖ** → Päivitä DEVELOPMENT_PROGRESS päivittäin
3. **COMMIT** → Päivitä KAIKKI relevantit dokumentit (PAKOLLINEN!)

### 1 KULTAINEN SÄÄNTÖ:

```
❌ NEVER COMMIT WITHOUT DOCUMENTATION! ❌
```

---

## 🆘 APUA!

**Q: Mistä aloitan?**  
A: `docs/development/README.md` → `DOCUMENTATION_WORKFLOW.md`

**Q: Miten teen uuden featuren?**  
A: `DOCUMENTATION_WORKFLOW.md` → Seuraa 3-vaiheista prosessia

**Q: Mitä dokumentaatiota ennen committia?**  
A: `DOCUMENTATION_WORKFLOW.md` → "3️⃣ COMMIT - CHECKLIST"

**Q: Voiko pushata mainiin?**  
A: ❌ EI KOSKAAN automaattisesti! Katso `GIT_RULES.md`

**Q: Miten seuraan edistystä?**  
A: `DEVELOPMENT_PROGRESS.md` → Päivittäinen päivitys

---

## 🎯 QUICK NAVIGATION

```
START HERE:
  └── docs/development/README.md ⭐⭐⭐

BEFORE CODING:
  └── docs/development/DOCUMENTATION_WORKFLOW.md ⭐⭐⭐⭐⭐
  └── docs/development/architecture/IMPLEMENTATION_PLAN.md ⭐⭐⭐⭐

WHILE CODING:
  └── docs/development/progress/DEVELOPMENT_PROGRESS.md ⭐⭐⭐

BEFORE COMMIT (MANDATORY!):
  └── docs/ai_changelog.md ⭐⭐⭐⭐⭐
  └── docs/learnings.md ⭐⭐⭐ (if bug fix)
  └── docs/development/progress/DEVELOPMENT_PROGRESS.md ⭐⭐⭐
  └── docs/development/architecture/IMPLEMENTATION_PLAN.md ⭐⭐⭐⭐

BEFORE PUSH:
  └── docs/development/GIT_RULES.md ⭐⭐⭐⭐
```

---

**Last Updated:** 2025-01-15 10:15 UTC+2  
**Version:** 1.0.0  
**Maintainer:** AI Agent


