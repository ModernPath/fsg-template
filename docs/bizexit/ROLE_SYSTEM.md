# BizExit - Roolipohjainen Käyttäjäjärjestelmä

## 📋 Yleiskatsaus

BizExit-platforma tukee kuutta eri käyttäjäroolia, joilla kullakin on omat oikeutensa, näkymänsä ja toimintonsa.

## 👥 Käyttäjäroolit

### 1. **Vierailija** (visitor)
**Kuvaus:** Ei-rekisteröitynyt käyttäjä joka selaa platformia

**Oikeudet:**
- ✅ Näkee julkiset yrityslistaukset (perustiedot)
- ✅ Voi hakea yrityksiä toimialan, koon, sijainnin mukaan
- ✅ Näkee anonyymit tilastotiedot
- ❌ Ei näe tarkkoja taloudellisia tietoja
- ❌ Ei voi ottaa yhteyttä myyjiin
- ❌ Ei näe yhteystietoja

**Dashboard:**
- Julkinen etusivu
- Haku ja suodatus
- CTA rekisteröitymiseen

---

### 2. **Ostaja** (buyer)
**Kuvaus:** Rekisteröitynyt käyttäjä joka hakee yrityksiä ostettavaksi

**Oikeudet:**
- ✅ Näkee kaikki julkiset listaukset
- ✅ Voi tallentaa yrityksiä suosikkeihin
- ✅ Voi jättää ostotarjouksia
- ✅ Näkee tarkat taloudelliset tiedot NDA:n jälkeen
- ✅ Voi ladata dokumentteja NDA:n jälkeen
- ✅ Voi keskustella myyjän/välittäjän kanssa
- ✅ Näkee omat kauppansa ja niiden tilan
- ❌ Ei voi luoda listauksia
- ❌ Ei näe muiden ostajien tarjouksia

**Dashboard:**
- Tallennetut yritykset
- Aktiiviset kaupat
- Tarjoukset
- NDA-tilanteet
- Suositellut yritykset (AI)

---

### 3. **Myyjä** (seller)
**Kuvaus:** Yrityksen omistaja joka myy yritystään

**Oikeudet:**
- ✅ Voi luoda yrityslistauksia
- ✅ Voi hallita omia listauksiaan
- ✅ Näkee ostajien kiinnostuksen (ei henkilötietoja ennen NDA:ta)
- ✅ Voi hyväksyä/hylätä NDA-pyyntöjä
- ✅ Voi ladata dokumentteja kauppaan
- ✅ Näkee kaupan etenemisen
- ✅ Voi kommunikoida ostajien kanssa
- ✅ Näkee analytiikkaa listauksistaan
- ❌ Ei näe muiden myyjien listauksia
- ❌ Ei voi ostaa yrityksiä

**Dashboard:**
- Omat yritykset
- Kaupat (myyjänä)
- Kiinnostuneet ostajat
- NDA-pyynnöt
- Analytiikka (katselut, kiinnostus)
- Dokumentit

---

### 4. **Välittäjä** (broker)
**Kuvaus:** Ammattilainen joka auttaa yrityskaupassa molempien osapuolien puolesta

**Oikeudet:**
- ✅ Näkee kaikki listaukset
- ✅ Voi luoda listauksia asiakkaidensa puolesta
- ✅ Voi hallita useita yrityksiä
- ✅ Näkee kaikkien kaupojen tilanteet (missä on mukana)
- ✅ Voi kommunikoida kaikkien osapuolten kanssa
- ✅ Voi luoda ja lähettää tarjouksia
- ✅ Näkee laajan analytiikan
- ✅ Voi hallita NDA-prosesseja
- ✅ Voi kutsua muita osapuolia kauppoihin (pankit, lakimiehet)
- ✅ Provisiolaskutus

**Dashboard:**
- Kaikki kaupat (portfolio)
- Asiakkaat (myyjät + ostajat)
- Pipeline-näkymä
- Provisiot ja laskutus
- Tehtävälistat
- Analytiikka
- Muistutukset ja deadlinet

---

### 5. **Kumppani** (partner)
**Kuvaus:** Palveluntarjoaja (pankki, rahoituslaitos, vakuutusyhtiö, lakitoimisto)

**Oikeudet:**
- ✅ Näkee kaupat joihin on kutsuttu
- ✅ Voi tarjota palveluitaan
- ✅ Voi ladata dokumentteja (esim. rahoituspäätökset)
- ✅ Voi kommunikoida kaupan osapuolten kanssa
- ✅ Näkee vain ne taloudelliset tiedot jotka ovat relevantteja
- ✅ Voi luoda tarjouksia palveluistaan
- ❌ Ei näe kaikkia kauppoja
- ❌ Ei voi luoda listauksia

**Dashboard:**
- Aktiiviset projektit
- Tarjoukset
- Laskutus
- Asiakkaat
- Tilastot

---

### 6. **Admin** (admin)
**Kuvaus:** Platformin ylläpitäjä

**Oikeudet:**
- ✅ Täysi pääsy kaikkeen
- ✅ Käyttäjien hallinta
- ✅ Kaikkien kauppojen valvonta
- ✅ Sisällönhallinta
- ✅ Raportointi
- ✅ Järjestelmäasetukset
- ✅ Analytics
- ✅ Tuki

**Dashboard:**
- Kaikki kaupat
- Käyttäjät
- Listaukset
- Analytiikka
- Järjestelmätila
- Tukipyynnöt

---

## 🗄️ Tietomalli

### profiles-taulu
```sql
profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'buyer', -- visitor, buyer, seller, broker, partner, admin
  is_admin BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

### role_permissions-taulu (uusi)
```sql
role_permissions (
  id UUID PRIMARY KEY,
  role TEXT NOT NULL,
  resource TEXT NOT NULL, -- companies, deals, documents, etc.
  action TEXT NOT NULL, -- create, read, update, delete
  conditions JSONB, -- extra conditions
  created_at TIMESTAMPTZ
)
```

### user_roles_history-taulu (uusi)
```sql
user_roles_history (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  old_role TEXT,
  new_role TEXT,
  changed_by UUID REFERENCES profiles(id),
  reason TEXT,
  created_at TIMESTAMPTZ
)
```

---

## 🎨 UX - Roolikohtaiset näkymät

### Vierailija
```
┌─────────────────────────────────────────┐
│  🏠 BizExit - Yrityskaupan Alusta       │
│  [Kirjaudu] [Rekisteröidy]             │
└─────────────────────────────────────────┘
│                                         │
│  🔍 Etsi yrityksiä...                  │
│                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │Yritys A │ │Yritys B │ │Yritys C │  │
│  │Toimiala │ │Toimiala │ │Toimiala │  │
│  │≈10M€    │ │≈5M€     │ │≈15M€    │  │
│  │🔒Lisää  │ │🔒Lisää  │ │🔒Lisää  │  │
│  └─────────┘ └─────────┘ └─────────┘  │
│                                         │
│  💡 Rekisteröidy nähdäksesi lisää      │
└─────────────────────────────────────────┘
```

### Ostaja Dashboard
```
┌─────────────────────────────────────────┐
│  👤 Terho Ostaja | Ostaja              │
│  [Dashboard] [Haku] [Suosikit] [Kaupat]│
└─────────────────────────────────────────┘
│  📊 Tilastot                            │
│  ┌──────────┬──────────┬──────────┐    │
│  │Suosikit  │Aktiiviset│NDA:t     │    │
│  │    5     │    2     │    1     │    │
│  └──────────┴──────────┴──────────┘    │
│                                         │
│  ⭐ Tallennetut yritykset               │
│  ┌─────────────────────────────────┐   │
│  │ Yritys A - Toimiala - 10M€      │   │
│  │ NDA: ✅ | Tarjous: Odottaa      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  🤝 Aktiiviset kaupat                   │
│  ┌─────────────────────────────────┐   │
│  │ Yritys B - Due Diligence        │   │
│  │ [Dokumentit] [Chat]             │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Myyjä Dashboard
```
┌─────────────────────────────────────────┐
│  👤 Maija Myyjä | Myyjä                 │
│  [Dashboard] [Yritykset] [Kaupat]      │
└─────────────────────────────────────────┘
│  📊 Tilastot                            │
│  ┌──────────┬──────────┬──────────┐    │
│  │Yritykset │Katselut  │Kiinnostus│    │
│  │    2     │   156    │    12    │    │
│  └──────────┴──────────┴──────────┘    │
│                                         │
│  🏢 Myytävät yritykset                  │
│  ┌─────────────────────────────────┐   │
│  │ Oma Oy - Aktiivinen             │   │
│  │ 23 katselua | 3 NDA-pyyntöä     │   │
│  │ [Muokkaa] [Analytiikka]         │   │
│  └─────────────────────────────────┘   │
│  [+ Lisää yritys]                       │
│                                         │
│  📋 NDA-pyynnöt (3)                     │
│  ┌─────────────────────────────────┐   │
│  │ Ostaja X - Oma Oy               │   │
│  │ [Hyväksy] [Hylkää]              │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Välittäjä Dashboard
```
┌─────────────────────────────────────────┐
│  👤 Ville Välittäjä | Välittäjä         │
│  [Dashboard] [Portfolio] [Asiakkaat]   │
└─────────────────────────────────────────┘
│  📊 Pipeline                            │
│  ┌────────┬────────┬────────┬────────┐ │
│  │Lead    │NDA     │DD      │Neuvot. │ │
│  │  5     │  3     │  2     │  1     │ │
│  └────────┴────────┴────────┴────────┘ │
│                                         │
│  💰 Provisiot (YTD): 125,000€           │
│                                         │
│  🎯 Aktiiviset kaupat (6)               │
│  ┌─────────────────────────────────┐   │
│  │ Kauppa A - Due Diligence        │   │
│  │ Myyjä: X | Ostaja: Y | 5M€      │   │
│  │ Deadline: 5 pv                  │   │
│  │ [Näytä] [Muistutus]             │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ✅ Tehtävät tänään (4)                 │
│  □ Lähetä rahoitusehdotus (Kauppa A)   │
│  □ Sovi due diligence (Kauppa B)       │
│  □ Tarkista dokumentit (Kauppa C)      │
└─────────────────────────────────────────┘
```

---

## 🔐 Oikeuksien tarkistus

### Backend (API)
```typescript
// Middleware
export async function checkPermission(
  userId: string,
  resource: string,
  action: string,
  resourceId?: string
): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_admin')
    .eq('id', userId)
    .single()

  // Admin has all permissions
  if (profile.is_admin) return true

  // Check role-based permissions
  const { data: permission } = await supabase
    .from('role_permissions')
    .select('*')
    .eq('role', profile.role)
    .eq('resource', resource)
    .eq('action', action)
    .single()

  if (!permission) return false

  // Check resource ownership if needed
  if (resourceId && permission.conditions?.requiresOwnership) {
    return await checkOwnership(userId, resource, resourceId)
  }

  return true
}
```

### Frontend (Components)
```typescript
// Hook
export function usePermissions() {
  const { session } = useAuth()
  const [permissions, setPermissions] = useState<UserPermissions>()

  useEffect(() => {
    // Fetch user permissions based on role
  }, [session])

  const can = (action: string, resource: string) => {
    return permissions?.[resource]?.[action] ?? false
  }

  return { can, permissions }
}

// Usage
const { can } = usePermissions()

{can('create', 'companies') && (
  <Button onClick={handleCreateCompany}>
    Lisää yritys
  </Button>
)}
```

---

## 🎯 Navigaatio roolien mukaan

### Ostaja
- Dashboard
- Haku
- Suosikit
- Kauppani
- Viestit
- Asetukset

### Myyjä
- Dashboard
- Yritykset
- Kauppani
- Analytiikka
- Viestit
- Asetukset

### Välittäjä
- Dashboard
- Portfolio
- Asiakkaat
- Kaupat
- Provisiot
- Tehtävät
- Analytiikka
- Asetukset

### Kumppani
- Dashboard
- Projektit
- Tarjoukset
- Laskutus
- Asetukset

### Admin
- Dashboard
- Käyttäjät
- Yritykset
- Kaupat
- Sisältö
- Analytiikka
- Järjestelmä
- Asetukset

---

## 🚀 Implementointijärjestys

1. ✅ **Suunnittelu** (tämä dokumentti)
2. 📝 **Tietomalli**
   - Päivitä profiles-taulu
   - Luo role_permissions-taulu
   - Luo user_roles_history-taulu
   - Migraatiot

3. 🔧 **Backend**
   - Permission-logiikka
   - API-suojaus
   - RLS-säännöt
   - Role-based queries

4. 🎨 **Frontend**
   - Roolikohtaiset dashboardit
   - Navigaation suodatus
   - Permission hooks
   - Component-level access control

5. ✨ **UX**
   - Roolivalinta onboardingissa
   - Selkeät indikaattorit (badge, colors)
   - Contextual help
   - Smooth transitions

6. 🧪 **Testaus**
   - Unit testit
   - Integration testit
   - E2E testit kullekin roolille

7. 📊 **Seed data**
   - Demo-käyttäjät jokaiselle roolille
   - Realistinen data

---

## 📈 Tulevat ominaisuudet

- [ ] Roolien dynaaminen muuttaminen
- [ ] Custom permissions per user
- [ ] Team management
- [ ] Delegation (proxy rights)
- [ ] Audit logging
- [ ] 2FA eri rooleille
- [ ] API keys kumppaneille
- [ ] Webhook integration

