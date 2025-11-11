# 🚨 DATABASE MIGRATION RULES - PAKOLLINEN LUKEA!

**Version:** 1.0.0  
**Luotu:** 2025-01-22  
**Tärkeys:** ⚠️ **KRIITTINEN**

---

## ⛔ TÄRKEIN SÄÄNTÖ

# ❌ NEVER MODIFY EXISTING MIGRATIONS! ❌

**Toista kolme kertaa:**
1. ❌ EI SAA muokata olemassa olevia migraatiotiedostoja
2. ❌ EI SAA muokata olemassa olevia migraatiotiedostoja
3. ❌ EI SAA muokata olemassa olevia migraatiotiedostoja

---

## 🎯 MIKSI NÄIN?

### 1. Migration History Vioittuu

```
Migraatio ajettu tuotannossa:
20250115_add_column.sql (hash: abc123)

Jos muokkaat tiedostoa:
20250115_add_column.sql (hash: xyz789) ← ERI HASH!

Supabase:
❌ ERROR: Migration hash mismatch!
❌ Cannot apply migration
❌ Database state inconsistent
```

**Seuraus:**
- Tuotanto-tietokanta jää epäyhtenäiseen tilaan
- Migration history korruptoituu
- Rollback epäonnistuu

---

### 2. Tuotanto vs. Development Ero

```
SCENARIO:

Production (ajettu):
└── 20250115_add_column_A.sql ✅

Developer muokkaa:
└── 20250115_add_column_B.sql (sama tiedosto!)

Developer yrittää ajaa tuotantoon:
❌ ERROR: Migration already applied (but different content!)
```

**Seuraus:**
- Production ja development eri tilassa
- Team members eri tiloissa
- Impossible to sync

---

### 3. Rollback Epäonnistuu

```
Original migration:
CREATE TABLE users (id UUID);

Muokattu migration:
CREATE TABLE users (id UUID, email VARCHAR);

Rollback yrittää palauttaa:
DROP TABLE users; ← Mutta table on eri muodossa!
```

**Seuraus:**
- Rollback epäonnistuu
- Ei voida palata toimivaan tilaan
- Manual cleanup required

---

### 4. Team Collaboration Katkeaa

```
Developer A:
- Ajaa migraation X
- Commitaa
- Push

Developer B:
- Muokkaa migraatiota X
- Commitaa
- Push

Git conflict? Ei!
Database conflict? KYLLÄ! ❌
```

**Seuraus:**
- Silent conflicts
- Database state diverges
- Hard to debug

---

## ✅ OIKEA TAPA: AINA UUSI MIGRAATIO

### Esimerkki 1: Lisää Kolumni

**❌ VÄÄRIN:**
```bash
# Muokkaa olemassa olevaa
nano supabase/migrations/20250115_create_users.sql
# Lisää: ALTER TABLE users ADD COLUMN email VARCHAR(255);
```

**✅ OIKEIN:**
```bash
# Luo UUSI migraatio
supabase migration new add_email_to_users

# Tiedosto: supabase/migrations/20250122_add_email_to_users.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
```

---

### Esimerkki 2: Korjaa Virhe

**❌ VÄÄRIN:**
```bash
# Edellinen migraatio:
# 20250115_add_column.sql
ALTER TABLE users ADD COLUMN age INTEGER;

# Huomaat virheen: pitäisi olla DECIMAL
# Muokkaat samaa tiedostoa:
nano supabase/migrations/20250115_add_column.sql
# Muutat: INTEGER → DECIMAL
```

**✅ OIKEIN:**
```bash
# Luo UUSI migraatio korjaukselle
supabase migration new fix_age_column_type

# Tiedosto: supabase/migrations/20250122_fix_age_column_type.sql
ALTER TABLE users DROP COLUMN age;
ALTER TABLE users ADD COLUMN age DECIMAL(3,1);

# TAI jos data pitää säilyttää:
ALTER TABLE users ALTER COLUMN age TYPE DECIMAL(3,1) USING age::DECIMAL(3,1);
```

---

### Esimerkki 3: Poista Kolumni

**❌ VÄÄRIN:**
```bash
# Muokkaa vanhaa migraatiota:
# 20250115_add_temp_column.sql
# Poista lisäys: ALTER TABLE users ADD COLUMN temp VARCHAR;
```

**✅ OIKEIN:**
```bash
# Luo UUSI migraatio poistoa varten
supabase migration new remove_temp_column

# Tiedosto: supabase/migrations/20250122_remove_temp_column.sql
ALTER TABLE users DROP COLUMN IF EXISTS temp;
```

---

## 🚦 WORKFLOW: MITEN TOIMIA

### 1. ENNEN MIGRAATION LUOMISTA

```bash
# 1. Suunnittele huolellisesti
# Katso: MIGRATION_TRACKER.md

# 2. Tarkista olemassa olevat migraatiot
ls -la supabase/migrations/

# 3. Lue viimeisin migraatio
cat supabase/migrations/$(ls -t supabase/migrations/ | head -1)

# 4. Varmista ettei duplikaattia
grep -r "your_table_name" supabase/migrations/
```

---

### 2. MIGRAATION LUOMINEN

```bash
# 1. Luo uusi migraatio
supabase migration new descriptive_name

# 2. Kirjoita SQL (HUOLELLISESTI!)
nano supabase/migrations/20250122_descriptive_name.sql

# 3. Käytä turvallisia komentoja
# - IF NOT EXISTS
# - IF EXISTS
# - Transaction blocks (BEGIN...COMMIT)

# 4. Kirjoita ROLLBACK
# Lisää kommenttina mitä tehdään rollbackissa
```

---

### 3. TESTAUS

```bash
# 1. Testaa lokaalisti
supabase db reset

# 2. Tarkista tulos
# ... testaa applikaatio ...

# 3. Jos virhe, ÄLYMÄ muokkaa!
# → Luo UUSI migraatio korjaukselle

# 4. Testaa uudelleen
supabase db reset
```

---

### 4. DOKUMENTOINTI

```bash
# 1. Päivitä MIGRATION_TRACKER.md
nano docs/development/migrations/MIGRATION_TRACKER.md

# 2. Lisää:
# - Migraation kuvaus
# - Rollback-ohjeet
# - Testaussuunnitelma
# - Riippuvuudet

# 3. Päivitä ai_changelog.md
nano docs/ai_changelog.md
```

---

### 5. COMMIT

```bash
# 1. Tarkista branch (EI MAIN!)
git branch --show-current

# 2. Commit migraatio + dokumentaatio
git add supabase/migrations/
git add docs/development/migrations/MIGRATION_TRACKER.md
git add docs/ai_changelog.md
git commit -m "feat: add [descriptive name] migration"

# 3. Push feature branchiin
git push origin feature/migration-name
```

---

## 🛡️ TURVAMEKANISMIT

### 1. SQL-TURVALLISUUS

```sql
-- ✅ KÄYTÄ NÄITÄ:

-- Luo taulu vain jos ei ole
CREATE TABLE IF NOT EXISTS my_table (...);

-- Lisää kolumni vain jos ei ole
ALTER TABLE my_table ADD COLUMN IF NOT EXISTS my_column VARCHAR(255);

-- Poista kolumni vain jos on
ALTER TABLE my_table DROP COLUMN IF EXISTS my_column;

-- Transaction block
BEGIN;
  -- SQL commands
COMMIT;
-- Jos virhe, automaattinen ROLLBACK

-- ❌ VÄLTÄ NÄITÄ:

-- Luo taulu (kaatuu jos on)
CREATE TABLE my_table (...);

-- Lisää kolumni (kaatuu jos on)
ALTER TABLE my_table ADD COLUMN my_column VARCHAR(255);

-- Poista kolumni (kaatuu jos ei ole)
ALTER TABLE my_table DROP COLUMN my_column;
```

---

### 2. MIGRATION CHECKLIST

**ENNEN COMMITTIA:**

- [ ] ✅ Migraatio testattu lokaalisti
- [ ] ✅ Rollback-suunnitelma kirjoitettu
- [ ] ✅ `IF NOT EXISTS` / `IF EXISTS` käytetty
- [ ] ✅ Transaction block käytetty
- [ ] ✅ MIGRATION_TRACKER.md päivitetty
- [ ] ✅ ai_changelog.md päivitetty
- [ ] ✅ Dokumentaatio valmis
- [ ] ⛔ EI muokattu vanhaa migraatiota

---

### 3. PRE-COMMIT HOOK (SUOSITUS)

```bash
# .git/hooks/pre-commit

#!/bin/bash

# Tarkista onko muokattu vanhoja migraatioita
CHANGED_MIGRATIONS=$(git diff --cached --name-only | grep "supabase/migrations/")

if [ -n "$CHANGED_MIGRATIONS" ]; then
  echo "⚠️ WARNING: You are modifying migration files!"
  echo ""
  echo "Changed migrations:"
  echo "$CHANGED_MIGRATIONS"
  echo ""
  echo "❌ RULE: Never modify existing migrations!"
  echo "✅ SOLUTION: Create a new migration instead."
  echo ""
  echo "Do you want to continue anyway? (yes/no)"
  read -r REPLY
  
  if [ "$REPLY" != "yes" ]; then
    echo "❌ Commit aborted."
    exit 1
  fi
fi

exit 0
```

**Asennus:**
```bash
chmod +x .git/hooks/pre-commit
```

---

## 🆘 MITÄ JOS TEIN VIRHEEN?

### SKENAARIO 1: Muokkasin migraatiota, mutta en ole pushannut

```bash
# 1. Palauta alkuperäinen
git checkout supabase/migrations/20250115_my_migration.sql

# 2. Luo UUSI migraatio korjaukselle
supabase migration new fix_my_mistake

# 3. Kirjoita korjaus UUTEEN tiedostoon
nano supabase/migrations/20250122_fix_my_mistake.sql

# 4. Testaa
supabase db reset

# 5. Commit
git add supabase/migrations/20250122_fix_my_mistake.sql
git commit -m "fix: correction for my_migration"
```

---

### SKENAARIO 2: Muokkasin ja pushasin, mutta ei vielä tuotannossa

```bash
# 1. Palauta muutos gitissä
git revert <commit-hash>

# 2. Luo UUSI migraatio
supabase migration new fix_reverted_change

# 3. Kirjoita korjaus
# ...

# 4. Push
git push origin feature/fix
```

---

### SKENAARIO 3: Muutos on jo tuotannossa 😱

```bash
# 1. ÄLÄ PANIIKOI!

# 2. LUO HETI uusi migraatio korjaukselle
supabase migration new emergency_fix_production

# 3. Testaa lokaalisti HUOLELLISESTI
supabase db reset
# ... extensive testing ...

# 4. Dokumentoi ongelma ja ratkaisu
nano docs/development/migrations/MIGRATION_TRACKER.md
# → Lisää FAILED-merkintä
# → Lisää EMERGENCY FIX -merkintä

# 5. Deploy korjaus tuotantoon HETI
supabase db push --include-all

# 6. Monitoroi tuotantoa
# ... tarkkaile virhelokeja ...

# 7. Raportoi
# → ai_changelog.md
# → learnings.md
# → DEVELOPMENT_PROGRESS.md
```

---

## 📚 REFERENSSIT

### Lue nämä myös:

1. **MIGRATION_TRACKER.md** - Migraatioiden seuranta
2. **GIT_RULES.md** - Git-säännöt
3. **DOCUMENTATION_WORKFLOW.md** - Dokumentaatioprosessi
4. **AGENT_SYSTEM.md** - Agent-säännöt

### Supabase dokumentaatio:

- [Database Migrations](https://supabase.com/docs/guides/cli/managing-environments#migrations)
- [Schema Migrations Best Practices](https://supabase.com/docs/guides/cli/managing-environments#migration-best-practices)

---

## ❓ FAQ

**Q: Miksi ei voi muokata migraatiota?**  
A: Migration history vioittuu ja tietokanta menee epäsynkkaan.

**Q: Entä jos tein typon?**  
A: Luo UUSI migraatio korjaukselle. Älä muokkaa vanhaa.

**Q: Entä jos migraatio ei ole vielä tuotannossa?**  
A: Silti luo UUSI. Kehitystiimilläsi voi olla jo ajettu lokaalisti.

**Q: Miten poistetaan turha migraatio?**  
A: Luo UUSI migraatio joka tekee ROLLBACK:in. Älä poista tiedostoa.

**Q: Voiko migraation poistaa ennen committia?**  
A: Kyllä, JOS et ole ajanut sitä (`supabase db reset` ei ajettu). Muuten: LUO UUSI.

**Q: Mikä on migration hash?**  
A: Supabase laskee jokaiselle migraatiolle SHA-hashin. Jos muokkaat, hash muuttuu → virhe.

---

## ✅ YHTEENVETO

### KULTAISET SÄÄNNÖT:

1. ⛔ **NEVER** modify existing migrations
2. ✅ **ALWAYS** create new migration for changes
3. ✅ **ALWAYS** use `IF NOT EXISTS` / `IF EXISTS`
4. ✅ **ALWAYS** test locally before production
5. ✅ **ALWAYS** document in MIGRATION_TRACKER.md
6. ✅ **ALWAYS** write rollback plan
7. ⛔ **NEVER** merge migration to main without testing

### MUISTA:

```
Migraatio on kuin historia:
- Historiaa ei voi muuttaa
- Voit vain lisätä uusia tapahtumia
- Jokainen tapahtuma on pysyvä
```

---

**NOUDATATHAN NÄITÄ SÄÄNTÖJÄ!** 🙏

Jos epävarma, kysy ennen kuin teet. Migration-virheet ovat kalliita korjata.

---

**Päivitetty:** 2025-01-22  
**Versio:** 1.0.0  
**Ylläpito:** Tech Lead

**Seuraava tarkistus:** Kun ensimmäinen migration-virhe tapahtuu (toivottavasti ei koskaan!)

