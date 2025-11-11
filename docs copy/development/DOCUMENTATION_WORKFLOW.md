# 📚 DOKUMENTAATIO-WORKFLOW - PAKOLLINEN PROSESSI

**Version:** 2.0.0  
**Branch:** AiAgent_TF  
**Luotu:** 2025-01-15  
**Status:** AKTIIVINEN

---

## 🎯 MIKSI TÄMÄ ON TÄRKEÄÄ?

**Ongelma ilman dokumentaatiota:**
- ❌ Ei tiedetä mitä on tehty
- ❌ Samoja bugeja korjataan uudestaan
- ❌ Kehityssuunnitelma ei ole ajan tasalla
- ❌ Commit-historia on epäselvä

**Ratkaisu:**
- ✅ Systemaattinen dokumentointi
- ✅ Selkeä prosessi kehityksestä committiin
- ✅ Ajan tasalla oleva suunnitelma
- ✅ Oppimisten säilyttäminen

---

## 📋 PÄÄDOKUMENTIT - QUICK REFERENCE

| Dokumentti | Tarkoitus | Päivitä kun |
|------------|-----------|-------------|
| **IMPLEMENTATION_PLAN.md** | Toteutussuunnitelma | Uusi feature/task |
| **DEVELOPMENT_PROGRESS.md** | Päivittäinen seuranta | Joka päivä |
| **ai_changelog.md** | Changelog | Ennen committia |
| **learnings.md** | Oppimukset | Bug fix/ratkaisu |
| **MIGRATION_TRACKER.md** | DB-muutokset | Jokainen migraatio |

---

## 🔄 KOLME PÄÄTILANNETTA

### 1️⃣ SUUNNITTELU (Ennen koodausta)
### 2️⃣ KEHITYSTYÖ (Koodauksen aikana)
### 3️⃣ COMMIT (Ennen git committia)

---

## 1️⃣ SUUNNITTELU - ENNEN KOODAUSTA

### 📋 Mitä tehdään:

#### Step 1: Lue nykyinen tilanne
```bash
# 1. Tarkista pääsuunnitelma
cat docs/development/architecture/IMPLEMENTATION_PLAN.md

# 2. Tarkista edistyminen
cat docs/development/progress/DEVELOPMENT_PROGRESS.md

# 3. Tarkista git rules
cat docs/development/GIT_RULES.md
```

#### Step 2: Suunnittele Task
1. **Määrittele Task ID**: Esim. `Task 0.5` (seuraava vapaa numero)
2. **Kirjoita tavoite**: Mitä toteutetaan?
3. **Määrittele tiedostot**: Mitkä tiedostot muuttuvat?
4. **Arvioi aika**: Kuinka kauan kestää?
5. **Tunnista riippuvuudet**: Vaatiiko migraatioita?

#### Step 3: Päivitä IMPLEMENTATION_PLAN.md
```markdown
### TASK 0.5: [NIMI] ✅/🔄/📝
**Kesto:** 2-4h  
**Riippuvuudet:** Task 0.3 (jos tarvitaan)  
**Riski:** MATALA/MEDIUM/KORKEA  
**Priority:** HIGH/MEDIUM/LOW  
**Status:** 📝 **SUUNNITELTU** (2025-01-XX)

#### Tavoite:
Selkeä kuvaus mitä tehdään ja miksi.

#### Toteutus:
**Uudet tiedostot:**
- `path/to/new/file.ts`

**Muokatut tiedostot:**
- `path/to/existing/file.ts` (mitä muutetaan)

**Ominaisuudet:**
- ✅ Feature 1
- ✅ Feature 2
```

#### Step 4: Päivitä DEVELOPMENT_PROGRESS.md
```markdown
## 🔄 KÄYNNISSÄ OLEVAT TYÖT

### 🔄 Task 0.5: [NIMI]
**Priority:** HIGH  
**Status:** IN PROGRESS  
**Started:** 2025-01-XX

**Tavoite:**
Lyhyt kuvaus

**Tiedostot:**
- Lista tiedostoista
```

---

## 2️⃣ KEHITYSTYÖ - KOODAUKSEN AIKANA

### 📋 Mitä tehdään:

#### Jatkuva päivitys

**1. Kun aloitat päivän:**
```markdown
# DEVELOPMENT_PROGRESS.md → Päivittäinen loki

### 2025-01-XX
**Sprint:** X  
**Developer:** Agent/[Name]

**Aloitettu:**
- 🔄 Task 0.5: [NIMI]

**Tavoite tänään:**
- Toteuttaa X
- Testata Y
```

**2. Kun kohtaat bugin:**
```markdown
# DEVELOPMENT_PROGRESS.md → Active Issues

| # | Severity | Description | Status | Assigned | ETA |
|---|----------|-------------|--------|----------|-----|
| 1 | HIGH | [Kuvaus] | 🔄 IN PROGRESS | Agent | 2025-01-XX |
```

**3. Kun ratkaiset bugin:**
1. **Päivitä learnings.md**:
```markdown
# learnings.md

## 🔧 2025-01-XX: [ONGELMAN NIMI]

### Problem: [Lyhyt kuvaus]

**Symptom**: Mitä näkyi käyttäjälle/kehittäjälle

**Root Cause**: Mikä aiheutti ongelman

**Solution**: Miten korjattiin

**Prevention Checklist**:
- [ ] Tarkista X ennen Y
- [ ] Varmista Z
```

2. **Päivitä DEVELOPMENT_PROGRESS.md**:
```markdown
### Resolved Issues:
| # | Severity | Description | Resolution | Resolved Date |
|---|----------|-------------|------------|---------------|
| 1 | HIGH | [Kuvaus] | [Ratkaisu] | 2025-01-XX |
```

**4. Kun teet database migration:**
```markdown
# MIGRATION_TRACKER.md

### ✅ [YYYY-MM-DD HH:MM] - [Kuvaus]
**Migration File:** `YYYYMMDDHHMMSS_description.sql`  
**Status:** ✅ Applied  
**Environment:** Local + Production

**Changes:**
- ALTER TABLE X ADD COLUMN Y

**Rollback:**
```sql
-- Rollback SQL tähän
```

**Verified:** ✅ Schema matches code
```

---

## 3️⃣ COMMIT - ENNEN GIT COMMITTIA

### ⚠️ TÄMÄ ON KRIITTISIN VAIHE!

#### 🚨 PAKOLLINEN CHECKLIST - ÄLÄ OHITA!

**Ennen committia:**
```markdown
COMMIT CHECKLIST:
- [ ] ✅ Koodi toimii (testattu)
- [ ] ✅ Linter errors: 0
- [ ] ✅ TypeScript errors: 0
- [ ] ✅ ai_changelog.md päivitetty
- [ ] ✅ learnings.md päivitetty (jos bug fix)
- [ ] ✅ DEVELOPMENT_PROGRESS.md päivitetty
- [ ] ✅ IMPLEMENTATION_PLAN.md päivitetty (status)
- [ ] ✅ MIGRATION_TRACKER.md päivitetty (jos DB change)
- [ ] ✅ Git branch: feature/* tai dev (EI main!)
```

---

### 📝 DOKUMENTAATIOPÄIVITYS ENNEN COMMITTIA

#### Step 1: ai_changelog.md (PAKOLLINEN!)

```markdown
# ai_changelog.md

## 2025-01-XX - 🎯 [TYPE]: [Short Title]

### Problem Fixed / Feature Added
Selkeä kuvaus mitä tehtiin ja miksi.

**Changes**:
1. **[Component Name]**: `path/to/file.ts`
   - Mitä muutettiin
   - Miksi muutettiin

**Impact**:
- ✅ User benefit 1
- ✅ User benefit 2
- ✅ Technical improvement 3

**Files Changed**:
- `path/to/file1.ts` - Description
- `path/to/file2.tsx` - Description

**Dokumentoitu**: ✅ learnings.md (jos bug fix)

---
```

**Type-vaihtoehdot:**
- 🎯 **FEAT**: Uusi ominaisuus
- 🔧 **FIX**: Bug fix
- 📊 **DATA**: Database/data change
- 🌍 **i18n**: Localization
- 🎨 **UI**: UI/UX improvement
- ⚡ **PERF**: Performance improvement
- 📚 **DOCS**: Documentation only

#### Step 2: learnings.md (JOS BUG FIX)

```markdown
# learnings.md

## 🔧 2025-01-XX: [Problem Name]

### Problem: [One-liner]

**Symptom**: 
What user/developer saw

**Root Cause**:
Why it happened (technical reason)

**Why It's Wrong**:
- Explanation 1
- Explanation 2

### Solution: [How it was fixed]

```typescript
// ❌ BEFORE
// Old code here

// ✅ AFTER  
// New code here
```

**Key Insight**: Main learning

### Prevention Checklist
- [ ] Check X before Y
- [ ] Verify Z
- [ ] Test scenario A
```

#### Step 3: DEVELOPMENT_PROGRESS.md

```markdown
# DEVELOPMENT_PROGRESS.md

## 📊 VIIMEISIMMÄT TOTEUTUKSET

### ✅ 2025-01-XX: Task 0.5 - [NIMI]
**Priority:** HIGH  
**Status:** COMPLETED

**Muutokset:**
1. **Component X**: `path/to/file.ts`
   - Description
   
**Dokumentoitu:** ✅ ai_changelog.md, ✅ learnings.md

---

## 📈 METRICS

### Performance:
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| [Metric] | X | Y | Z% |
```

#### Step 4: IMPLEMENTATION_PLAN.md

```markdown
# IMPLEMENTATION_PLAN.md

### TASK 0.5: [NIMI] ✅ COMPLETED
**Status:** ✅ **VALMIS** (2025-01-XX)  
**Commit:** `<hash>` - feat: [description]

#### Toteutus:
**Tiedostot:**
- ✅ `path/to/file.ts` - Done
- ✅ `path/to/file2.tsx` - Done

**Dokumentoitu:** `docs/ai_changelog.md`, `docs/learnings.md`
```

---

### 🔍 TARKISTA ENNEN COMMITTIA

```bash
# 1. Run linter
npm run lint

# 2. Check TypeScript
npm run type-check  # tai tsc --noEmit

# 3. Run tests (jos on)
npm test

# 4. Check git branch
git branch --show-current
# Pitää olla: feature/* tai dev
# EI SAA OLLA: main tai master

# 5. Review changes
git status
git diff
```

---

### ✅ COMMIT-VIESTI

**Format:**
```
<type>: <short description>

<optional detailed description>

Files changed:
- path/to/file.ts
- path/to/file2.tsx

Documentation updated:
- ai_changelog.md
- learnings.md (if bug fix)
- DEVELOPMENT_PROGRESS.md
```

**Type:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `refactor:` - Code refactoring
- `test:` - Tests
- `chore:` - Maintenance
- `perf:` - Performance

**Examples:**
```bash
git commit -m "feat: Add admin dashboard real statistics

- Created /api/admin/dashboard/stats endpoint
- Updated admin page to fetch real data
- Added loading and error states

Files changed:
- app/api/admin/dashboard/stats/route.ts
- app/[locale]/admin/page.tsx
- app/components/Navigation.tsx

Documentation:
- ai_changelog.md updated
- DEVELOPMENT_PROGRESS.md updated"
```

---

### 🚀 PUSH & PR

**Push:**
```bash
# ✅ OK: Push to feature branch
git push origin feature/admin-dashboard

# ✅ OK: Push to dev branch
git push origin dev

# ❌ NEVER: Push to main automatically
# git push origin main  # ❌ EI KOSKAAN!
```

**Pull Request (jos haluat mainiin):**
1. Create PR in GitHub/GitLab UI
2. Fill PR description:
   ```markdown
   ## Task 0.5: [NIMI]
   
   ### Changes
   - Feature 1
   - Feature 2
   
   ### Documentation
   - [x] ai_changelog.md updated
   - [x] learnings.md updated (if needed)
   - [x] DEVELOPMENT_PROGRESS.md updated
   - [x] Tests passing
   - [x] No lint errors
   
   ### Related Issues
   Closes #123 (if any)
   ```
3. ⏸️ **WAIT** for manual approval
4. ✅ Merge manually (or on request)

---

## 🎯 TIIVISTETTY CHECKLIST

### SUUNNITTELU:
- [ ] Lue IMPLEMENTATION_PLAN.md
- [ ] Lue DEVELOPMENT_PROGRESS.md
- [ ] Määrittele Task ID ja tavoite
- [ ] Päivitä IMPLEMENTATION_PLAN.md
- [ ] Päivitä DEVELOPMENT_PROGRESS.md (IN PROGRESS)

### KEHITYSTYÖ:
- [ ] Päivitä progress päivittäin
- [ ] Jos bug → learnings.md
- [ ] Jos migration → MIGRATION_TRACKER.md
- [ ] Testaa jatkuvasti

### COMMIT (KRIITTISIN!):
- [ ] ✅ Koodi toimii
- [ ] ✅ Linter: 0 errors
- [ ] ✅ TypeScript: 0 errors
- [ ] ✅ Git branch: feature/* tai dev
- [ ] ✅ ai_changelog.md päivitetty
- [ ] ✅ learnings.md päivitetty (jos bug)
- [ ] ✅ DEVELOPMENT_PROGRESS.md päivitetty
- [ ] ✅ IMPLEMENTATION_PLAN.md status → COMPLETED
- [ ] ✅ MIGRATION_TRACKER.md (jos DB change)
- [ ] ✅ Commit message OK
- [ ] ✅ Push feature/dev branch
- [ ] ✅ (Optional) Create PR to main
- [ ] ⏸️ (If PR) Wait for approval

---

## 🚨 MUISTA!

### ❌ ÄLÖN TEE:
- Committaa ilman dokumentaatiota
- Pushaa mainiin automaattisesti
- Ohita linter-virheitä
- Jätä learnings.md päivittämättä (jos bug fix)

### ✅ TOTTA TEET:
- Päivitä dokumentaatio ENNEN committia
- Tarkista branch (feature/* tai dev)
- Testaa koodi
- Kirjoita selkeä commit message
- Create PR for main merges
- Wait for manual approval

---

## 📊 ESIMERKKIPROSESSI

### Esimerkki: Uusi Feature "CSV Export"

#### SUUNNITTELU:
```bash
# 1. Lue current state
cat docs/development/architecture/IMPLEMENTATION_PLAN.md
cat docs/development/progress/DEVELOPMENT_PROGRESS.md

# 2. Update IMPLEMENTATION_PLAN.md
# → Add Task 0.6: CSV Export

# 3. Update DEVELOPMENT_PROGRESS.md
# → Add to "KÄYNNISSÄ OLEVAT TYÖT"
```

#### KEHITYSTYÖ:
```bash
# 1. Create feature branch
git checkout -b feature/csv-export

# 2. Implement feature
# ... code ...

# 3. Test
npm run lint
npm run type-check
npm test

# 4. If bug found → update learnings.md
# 5. Daily update → DEVELOPMENT_PROGRESS.md
```

#### COMMIT:
```bash
# 1. Update documentation (MANDATORY!)
# → ai_changelog.md: Add new entry
# → DEVELOPMENT_PROGRESS.md: Move to "VIIMEISIMMÄT TOTEUTUKSET"
# → IMPLEMENTATION_PLAN.md: Status → ✅ COMPLETED

# 2. Final checks
npm run lint              # ✅ 0 errors
npm run type-check        # ✅ 0 errors
git branch --show-current # ✅ feature/csv-export (NOT main!)
git status                # ✅ Review changes
git diff                  # ✅ Review code

# 3. Commit
git add .
git commit -m "feat: Add CSV export for user data

- Added CSV export button
- Implemented CSV generation
- Added download functionality

Files changed:
- components/admin/UserTable.tsx
- utils/csv-export.ts

Documentation:
- ai_changelog.md updated
- DEVELOPMENT_PROGRESS.md updated
- IMPLEMENTATION_PLAN.md status → COMPLETED"

# 4. Push
git push origin feature/csv-export

# 5. (Optional) Create PR
# GitHub UI: feature/csv-export → main
# Wait for approval ⏸️
```

---

## 📚 QUICK LINKS

| Dokumentti | Polku | Päivitä |
|------------|-------|---------|
| **Main Plan** | `docs/development/architecture/IMPLEMENTATION_PLAN.md` | New feature |
| **Progress** | `docs/development/progress/DEVELOPMENT_PROGRESS.md` | Daily |
| **Changelog** | `docs/ai_changelog.md` | Every commit |
| **Learnings** | `docs/learnings.md` | Bug fix |
| **Migrations** | `docs/development/migrations/MIGRATION_TRACKER.md` | DB change |
| **Git Rules** | `docs/development/GIT_RULES.md` | Read before commit |

---

## 🆘 HELP!

**Q: Unohdin päivittää dokumentaation ennen committia?**  
A: 
```bash
# 1. Update documentation now
# 2. Amend commit
git add docs/
git commit --amend --no-edit
# 3. Force push (feature branch only!)
git push --force origin feature/branch-name
```

**Q: Commitasin mainiin vahingossa?**  
A: Katso `docs/development/GIT_RULES.md` → HÄTÄTILANNE

**Q: En tiedä mihin Task ID:hen lisätä?**  
A: Katso `IMPLEMENTATION_PLAN.md` → käytä seuraavaa vapaata numeroa (0.1, 0.2, ...)

**Q: Pitääkö learnings.md päivittää aina?**  
A: EI. Vain jos:
- Bug fix
- Uusi ratkaisu ongelmaan
- Tärkeä oppiminen

---

## ✅ SUMMARY

### 3 VAIHETTA:
1. **SUUNNITTELU**: Update IMPLEMENTATION_PLAN + DEVELOPMENT_PROGRESS
2. **KEHITYSTYÖ**: Daily updates, learnings (if bug)
3. **COMMIT**: Update ALL docs → lint → commit → push

### 5 PÄÄDOKUMENTTIA:
1. `IMPLEMENTATION_PLAN.md` - Features & tasks
2. `DEVELOPMENT_PROGRESS.md` - Daily tracking
3. `ai_changelog.md` - Every commit
4. `learnings.md` - Bug fixes
5. `MIGRATION_TRACKER.md` - DB changes

### 1 SÄÄNTÖ:
**❌ NEVER COMMIT WITHOUT DOCUMENTATION! ❌**

---

**Last Updated:** 2025-01-15 10:00 UTC+2  
**Version:** 2.0.0  
**Next Review:** When process changes


