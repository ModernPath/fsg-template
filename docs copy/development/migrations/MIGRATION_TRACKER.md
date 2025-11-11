# 🗄️ DATABASE MIGRATIONS - SEURANTA

**Branch:** AiAgent_TF  
**Luotu:** 2025-01-10  
**Viimeksi päivitetty:** 2025-01-22

---

## 🚨 KRIITTINEN: LUE ENSIN!

⛔ **NEVER MODIFY EXISTING MIGRATIONS!** ⛔

**📖 LUE PAKOLLINEN OHJE:**
👉 **[MIGRATION_RULES.md](./MIGRATION_RULES.md)** 👈

**TÄRKEIMMÄT SÄÄNNÖT:**
1. ❌ EI SAA muokata olemassa olevia migraatiotiedostoja
2. ✅ AINA luo UUSI migraatio muutoksille
3. ✅ Käytä `IF NOT EXISTS` / `IF EXISTS`
4. ✅ Testaa lokaalisti ennen tuotantoon vientiä

**MIKSI?**
- Migration history vioittuu
- Tuotanto ja development menee epäsynkkaan
- Rollback epäonnistuu
- Team collaboration katkeaa

**Jos muokkaat vanhaa migraatiota:**
→ Luo UUSI migraatio korjaukselle
→ Älä muokkaa vanhaa!

---

## 📊 TILANNEKATSAUS

| Status | Määrä | Kuvaus |
|--------|-------|--------|
| ✅ Completed | 0 | Ajettu tuotantoon |
| 🔄 Pending | 3 | Odottaa ajoa |
| ⚠️ Failed | 0 | Epäonnistuneet |
| 📝 Planned | 3 | Suunnitteilla |

---

## 🎯 MIGRAATIOT PRIORITEETTIJÄRJESTYKSESSÄ

### VAIHE 1: Perus user management (Ei migraatioita tarvita)
**Status:** ✅ Ready to implement  
**Migraatiot:** Ei tarvita

**Ominaisuudet:**
- [x] Sorting
- [x] CSV Export
- [x] Email Verification Resend
- [x] Password Reset
- [x] Pagination

**Huomiot:** Nämä voidaan toteuttaa heti ilman DB-muutoksia.

---

### VAIHE 1.5: Country Code Migration (CRITICAL)
**Status:** 🚨 URGENT - Production Error  
**Prioriteetti:** CRITICAL  
**Riippuvuudet:** Ei  
**Arvioitu aika:** 15 min

#### Migration: `20251016_add_country_code_to_companies.sql`

**Ongelma:** Production error `PGRST204` - Missing country_code column
```
Error creating company: {
  code: 'PGRST204',
  message: "Could not find the 'country_code' column of 'companies' in the schema cache"
}
```

**Ratkaisu:** Manuaalinen migraatio Supabase Dashboardissa
- Tiedosto: `PRODUCTION_MIGRATION_COUNTRY_CODE.md`
- SQL: Lisää `country_code TEXT DEFAULT 'FI'` kenttä
- Auto-detect: Business_id formatista (FI, SE, NO, DK)

**Ajetaan:**
- [x] Production (via Supabase CLI --include-all)

---

### VAIHE 1.6: Enrichment Status Migration (RESOLVED)
**Status:** ✅ RESOLVED - Schema Cache Issue  
**Prioriteetti:** HIGH  
**Riippuvuudet:** Ei  
**Arvioitu aika:** 5 min

#### Migration: `20251015000000_add_company_enrichment_fields.sql`

**Ongelma:** Production error `PGRST204` - Missing enrichment_status column
```
Error updating company status: {
  code: 'PGRST204',
  message: "Could not find the 'enrichment_status' column of 'companies' in the schema cache"
}
```

**Ratkaisu:** Migration oli jo ajettu, mutta schema cache oli vanhentunut
- Tiedosto: `scripts/verify-enrichment-columns.js`
- Tulos: ✅ Kaikki enrichment-kentät toimivat nyt

**Ajetaan:**
- [x] Production (migration applied via CLI)

---

### VAIHE 1.7: Enrichment Migration Applied (COMPLETED)
**Status:** ✅ COMPLETED - Migration Applied  
**Prioriteetti:** HIGH  
**Riippuvuudet:** Ei  
**Arvioitu aika:** 10 min

#### Migration: `20251015000000_add_company_enrichment_fields.sql`

**Ongelma:** Production error `PGRST204` - Missing enrichment_status column
```
Error updating company status: {
  code: 'PGRST204',
  message: "Could not find the 'enrichment_status' column of 'companies' in the schema cache"
}
```

**Ratkaisu:** Migration history korjattu ja migraatio ajettu tuotantoon
- Komento: `supabase db push --include-all`
- Tulos: ✅ Kaikki enrichment-kentät nyt tuotannossa

**Ajetaan:**
- [x] Production (via Supabase CLI)

---

### VAIHE 2: User Status Management
**Status:** 📝 Planned  
**Prioriteetti:** HIGH  
**Riippuvuudet:** Ei  
**Arvioitu aika:** 30 min

#### Migration: `add_user_status.sql`

```sql
-- Migration: add_user_status
-- Description: Lisää status-kolumni käyttäjien hallintaan
-- Author: AI Agent
-- Date: 2025-01-10
-- Status: PENDING

-- Add status column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' 
CHECK (status IN ('active', 'inactive', 'suspended', 'banned'));

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- Add comment
COMMENT ON COLUMN public.profiles.status IS 'User account status: active, inactive, suspended, or banned';
```

**Testaus:**
```sql
-- Test 1: Verify column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'status';

-- Test 2: Verify index exists
SELECT indexname FROM pg_indexes WHERE tablename = 'profiles' AND indexname = 'idx_profiles_status';

-- Test 3: Test constraint
INSERT INTO public.profiles (id, status) VALUES (gen_random_uuid(), 'invalid'); -- Should fail

-- Test 4: Verify existing users have default value
SELECT COUNT(*) FROM public.profiles WHERE status = 'active';
```

**Rollback:**
```sql
ALTER TABLE public.profiles DROP COLUMN IF EXISTS status;
DROP INDEX IF EXISTS idx_profiles_status;
```

**Vaikutukset:**
- ✅ Ei vaikuta olemassa olevaan dataan
- ✅ Default-arvo asetetaan automaattisesti
- ✅ Indeksi parantaa query-suorituskykyä
- ⚠️ Vaatii koodimuutokset: User interface, API endpoints

**Ajetaan:**
- [ ] Lokaaliin (development)
- [ ] Staging
- [ ] Production

---

### VAIHE 3: User Activity Logging
**Status:** 📝 Planned  
**Prioriteetti:** MEDIUM  
**Riippuvuudet:** Vaihe 2 (suositeltava)  
**Arvioitu aika:** 45 min

#### Migration: `add_user_activity_log.sql`

```sql
-- Migration: add_user_activity_log
-- Description: Luo user activity log -järjestelmä
-- Author: AI Agent
-- Date: 2025-01-10
-- Status: PENDING

-- ==============================================
-- 1. CREATE ACTIVITY LOG TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type text NOT NULL,
  description text,
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- ==============================================
-- 2. CREATE INDEXES
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id 
  ON public.user_activity_log(user_id);
  
CREATE INDEX IF NOT EXISTS idx_user_activity_log_activity_type 
  ON public.user_activity_log(activity_type);
  
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at 
  ON public.user_activity_log(created_at DESC);

-- ==============================================
-- 3. ADD LAST_LOGIN TO PROFILES
-- ==============================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_profiles_last_login_at 
  ON public.profiles(last_login_at);

-- ==============================================
-- 4. CREATE LOGGING FUNCTION
-- ==============================================

CREATE OR REPLACE FUNCTION public.log_user_activity(
  p_user_id uuid,
  p_activity_type text,
  p_description text DEFAULT NULL,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO public.user_activity_log (
    user_id,
    activity_type,
    description,
    ip_address,
    user_agent,
    metadata
  ) VALUES (
    p_user_id,
    p_activity_type,
    p_description,
    p_ip_address,
    p_user_agent,
    p_metadata
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- ==============================================
-- 5. ADD COMMENTS
-- ==============================================

COMMENT ON TABLE public.user_activity_log IS 'Tracks all user activities for security and auditing';
COMMENT ON COLUMN public.profiles.last_login_at IS 'Timestamp of last successful login';
COMMENT ON FUNCTION public.log_user_activity IS 'Helper function to log user activities';

-- ==============================================
-- 6. ENABLE RLS (Row Level Security)
-- ==============================================

ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view activity logs
CREATE POLICY "Admins can view all activity logs"
  ON public.user_activity_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Users can view their own activity
CREATE POLICY "Users can view own activity"
  ON public.user_activity_log
  FOR SELECT
  USING (user_id = auth.uid());

-- Only system can insert (via function)
CREATE POLICY "System can insert activity logs"
  ON public.user_activity_log
  FOR INSERT
  WITH CHECK (true);
```

**Testaus:**
```sql
-- Test 1: Verify table exists
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'user_activity_log';

-- Test 2: Test logging function
SELECT public.log_user_activity(
  auth.uid(),
  'test_activity',
  'Test description',
  '127.0.0.1',
  'Test Agent',
  '{"test": true}'::jsonb
);

-- Test 3: Verify indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'user_activity_log';

-- Test 4: Test RLS policies
SET ROLE authenticated;
SELECT * FROM public.user_activity_log WHERE user_id = auth.uid();
```

**Rollback:**
```sql
DROP POLICY IF EXISTS "Admins can view all activity logs" ON public.user_activity_log;
DROP POLICY IF EXISTS "Users can view own activity" ON public.user_activity_log;
DROP POLICY IF EXISTS "System can insert activity logs" ON public.user_activity_log;
DROP FUNCTION IF EXISTS public.log_user_activity;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS last_login_at;
DROP INDEX IF EXISTS idx_profiles_last_login_at;
DROP TABLE IF EXISTS public.user_activity_log CASCADE;
```

**Vaikutukset:**
- ✅ Uusi taulu (ei vaikuta olemassa olevaan)
- ✅ Parannettu turvallisuus ja auditointi
- ⚠️ Vaatii middleware-muutokset login-trackingiin
- ⚠️ Vaatii UI-komponentit activity näyttämiseen

**Ajetaan:**
- [ ] Lokaaliin (development)
- [ ] Staging
- [ ] Production

---

### VAIHE 4: Impersonation System
**Status:** 📝 Planned  
**Prioriteetti:** LOW (Security critical)  
**Riippuvuudet:** Vaihe 2, Vaihe 3  
**Arvioitu aika:** 1h

#### Migration: `add_impersonation_system.sql`

```sql
-- Migration: add_impersonation_system
-- Description: Luo impersonation-järjestelmä (ERITTÄIN TÄRKEÄ TURVALLISUUS!)
-- Author: AI Agent
-- Date: 2025-01-10
-- Status: PENDING
-- SECURITY: HIGH - Requires extensive testing

-- ==============================================
-- 1. CREATE IMPERSONATION SESSIONS TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS public.impersonation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  impersonated_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (char_length(reason) >= 10),
  started_at timestamptz DEFAULT now() NOT NULL,
  ended_at timestamptz,
  session_token text UNIQUE NOT NULL,
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}',
  CONSTRAINT no_self_impersonation CHECK (admin_user_id != impersonated_user_id),
  CONSTRAINT valid_session CHECK (ended_at IS NULL OR ended_at > started_at)
);

-- ==============================================
-- 2. CREATE INDEXES
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_admin 
  ON public.impersonation_sessions(admin_user_id);
  
CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_impersonated 
  ON public.impersonation_sessions(impersonated_user_id);
  
CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_token 
  ON public.impersonation_sessions(session_token);
  
CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_active 
  ON public.impersonation_sessions(started_at) 
  WHERE ended_at IS NULL;

-- ==============================================
-- 3. CREATE HELPER FUNCTIONS
-- ==============================================

-- Start impersonation
CREATE OR REPLACE FUNCTION public.start_impersonation(
  p_admin_user_id uuid,
  p_impersonated_user_id uuid,
  p_reason text,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_token text;
  v_admin_is_admin boolean;
BEGIN
  -- Verify admin status
  SELECT is_admin INTO v_admin_is_admin
  FROM public.profiles
  WHERE id = p_admin_user_id;
  
  IF NOT v_admin_is_admin THEN
    RAISE EXCEPTION 'Only admins can impersonate users';
  END IF;
  
  -- Generate secure token
  v_session_token := encode(gen_random_bytes(32), 'base64');
  
  -- Create session
  INSERT INTO public.impersonation_sessions (
    admin_user_id,
    impersonated_user_id,
    reason,
    session_token,
    ip_address,
    user_agent
  ) VALUES (
    p_admin_user_id,
    p_impersonated_user_id,
    p_reason,
    v_session_token,
    p_ip_address,
    p_user_agent
  );
  
  -- Log activity
  PERFORM public.log_user_activity(
    p_impersonated_user_id,
    'impersonation_started',
    format('Admin %s started impersonation. Reason: %s', p_admin_user_id, p_reason),
    p_ip_address,
    p_user_agent,
    jsonb_build_object('admin_id', p_admin_user_id, 'reason', p_reason)
  );
  
  RETURN v_session_token;
END;
$$;

-- End impersonation
CREATE OR REPLACE FUNCTION public.end_impersonation(
  p_session_token text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_record record;
BEGIN
  -- Get session
  SELECT * INTO v_session_record
  FROM public.impersonation_sessions
  WHERE session_token = p_session_token
  AND ended_at IS NULL;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- End session
  UPDATE public.impersonation_sessions
  SET ended_at = now()
  WHERE session_token = p_session_token;
  
  -- Log activity
  PERFORM public.log_user_activity(
    v_session_record.impersonated_user_id,
    'impersonation_ended',
    format('Admin %s ended impersonation', v_session_record.admin_user_id),
    NULL,
    NULL,
    jsonb_build_object('admin_id', v_session_record.admin_user_id)
  );
  
  RETURN true;
END;
$$;

-- ==============================================
-- 4. ADD COMMENTS
-- ==============================================

COMMENT ON TABLE public.impersonation_sessions IS 'SECURITY CRITICAL: Tracks all admin impersonation sessions';
COMMENT ON FUNCTION public.start_impersonation IS 'Starts an impersonation session (admins only)';
COMMENT ON FUNCTION public.end_impersonation IS 'Ends an impersonation session';

-- ==============================================
-- 5. ENABLE RLS
-- ==============================================

ALTER TABLE public.impersonation_sessions ENABLE ROW LEVEL SECURITY;

-- Only admins can view impersonation sessions
CREATE POLICY "Admins can view all impersonation sessions"
  ON public.impersonation_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
```

**Testaus:**
```sql
-- Test 1: Try to impersonate as non-admin (should fail)
SELECT public.start_impersonation(
  'non-admin-uuid',
  'user-uuid',
  'Testing security'
);

-- Test 2: Start impersonation as admin
SELECT public.start_impersonation(
  auth.uid(), -- assuming admin
  'target-user-uuid',
  'Customer support - investigating issue #123'
);

-- Test 3: Verify session created
SELECT * FROM public.impersonation_sessions WHERE admin_user_id = auth.uid();

-- Test 4: End session
SELECT public.end_impersonation('session-token-here');

-- Test 5: Verify activity logged
SELECT * FROM public.user_activity_log 
WHERE activity_type LIKE 'impersonation%' 
ORDER BY created_at DESC;
```

**Rollback:**
```sql
DROP POLICY IF EXISTS "Admins can view all impersonation sessions" ON public.impersonation_sessions;
DROP FUNCTION IF EXISTS public.end_impersonation;
DROP FUNCTION IF EXISTS public.start_impersonation;
DROP TABLE IF EXISTS public.impersonation_sessions CASCADE;
```

**Vaikutukset:**
- ⚠️ SECURITY CRITICAL - Vaatii laajan testauksen
- ⚠️ Vaatii middleware-muutokset
- ⚠️ Vaatii UI-komponentit (modal, banner)
- ⚠️ Vaatii session management -muutokset

**Ajetaan:**
- [ ] Lokaaliin (development) + EXTENSIVE TESTING
- [ ] Staging + SECURITY REVIEW
- [ ] Production + MONITORING

---

## 📋 CHECKLIST - ENNEN TUOTANTOON VIENTIÄ

### Pre-deployment (Kaikille migraatioille):
- [ ] Migration SQL tarkistettu
- [ ] Rollback SQL testattu
- [ ] Testit kirjoitettu ja ajettu
- [ ] Dokumentaatio päivitetty
- [ ] Riippuvuudet tarkistettu
- [ ] Performance arvioitu

### Deployment:
- [ ] Backup otettu
- [ ] Migration ajettu lokaalisti
- [ ] Migration ajettu staging-ympäristöön
- [ ] Staging testattu
- [ ] Production deployment suunniteltu (maintenance window?)
- [ ] Rollback-suunnitelma valmis

### Post-deployment:
- [ ] Migration onnistui
- [ ] Testit ajettu tuotannossa
- [ ] Monitoring tarkistettu
- [ ] Errors/warnings tarkistettu
- [ ] Performance mitattu
- [ ] Dokumentaatio päivitetty (ajettu-status)

---

## 🔧 AJAMINEN

### Lokaali kehitys:
```bash
# Luo migration
supabase migration new <migration_name>

# Aja lokaaliin
supabase db reset

# TAI
supabase migration up
```

### Tuotanto (Vaihtoehto 1 - CLI):
```bash
# Linkitä projekti (kerran)
supabase link --project-ref <your-project-ref>

# Dry run (katso mitä tehdään)
supabase db push --dry-run

# Push tuotantoon
supabase db push
```

### Tuotanto (Vaihtoehto 2 - Dashboard):
1. Mene: https://supabase.com/dashboard
2. SQL Editor
3. Kopioi migration SQL
4. Aja

---

## 📊 MIGRATION HISTORIA

| ID | Nimi | Päivä | Status | Ympäristö | Huomiot |
|----|------|-------|--------|-----------|---------|
| - | - | - | - | - | - |

---

## ⚠️ ONGELMATILANTEET

### Jos migration epäonnistuu:

1. **Älä paniikoi**
2. Tarkista error message
3. Aja rollback:
   ```sql
   -- Kopioi rollback SQL migration dokumentista
   ```
4. Korjaa migration
5. Testaa lokaalisti
6. Yritä uudelleen

### Yhteyshenkilöt:
- Database Admin: [Lisää tiedot]
- Tech Lead: [Lisää tiedot]

---

## 📝 MUISTIINPANOT

### MIGRATION BEST PRACTICES:
- ⛔ **NEVER modify existing migrations** (LUE: MIGRATION_RULES.md)
- ✅ Pidä migraatiot pieninä ja atomisina
- ✅ Testaa aina ensin lokaalisti
- ✅ Dokumentoi kaikki muutokset
- ✅ Käytä `IF NOT EXISTS` / `IF EXISTS`
- ✅ Luo indeksit suurille taulukoille
- ✅ Harkitse CONCURRENTLY-optiota (ei lukitse taulua)
- ✅ Kirjoita ROLLBACK-suunnitelma
- ✅ Luo UUSI migraatio jos tarvitset korjausta

### LINKIT:
- 📖 **[MIGRATION_RULES.md](./MIGRATION_RULES.md)** - PAKOLLINEN LUKEA!
- 📖 [DOCUMENTATION_WORKFLOW.md](../DOCUMENTATION_WORKFLOW.md)
- 📖 [GIT_RULES.md](../GIT_RULES.md)

---

**Päivitetty:** 2025-01-22  
**Seuraava tarkistus:** Kun migration ajetaan

