# Onboarding Recommendations Persistence

## 📋 Yleiskuvaus

**Ominaisuus**: Suositusten pysyvyys onboarding-keskustelussa  
**Toteutettu**: 2025-01-10  
**Tiedosto**: `components/auth/onboarding/Step3AIConversation.tsx`  
**Status**: ✅ Valmis ja testattu

---

## 🎯 Tavoite

Varmistaa että CFO-avustajan antamat rahoitussuositukset **SÄILYVÄT AINA NÄKYVISSÄ** kun ne on kerran annettu, mutta **VOIVAT PÄIVITTYÄ** jos AI antaa uusia tai päivitettyjä suosituksia keskustelun aikana.

### Ongelma (ennen)
- Suositukset saattoivat kadota näkyvistä pitkän keskustelun aikana
- Jos API-vastaus ei sisältänyt `recommendation`-kenttää, suositukset katosivat
- Käyttäjäkokemus kärsi kun tärkeä tieto hävisi

### Ratkaisu (nyt)
- Suositukset talletetaan pysyvään tilaan kun ne ensimmäisen kerran saadaan
- Suositukset päivittyvät automaattisesti jos AI antaa uudet suositukset
- Suositukset säilyvät näkyvissä vaikka API-vastaus ei sisältäisi niitä

---

## 🏗️ Tekninen Toteutus

### 1. State Management

```typescript
// Alkuperäinen state (API:sta tuleva data)
const [recommendation, setRecommendation] = useState<any>(null);

// Uudet persistent state:t
const [hasReceivedRecommendations, setHasReceivedRecommendations] = useState(false);
const [persistedRecommendations, setPersistedRecommendations] = useState<any>(null);
```

**Selitykset**:
- `recommendation`: Suora API-vastaus, voi olla null
- `hasReceivedRecommendations`: Boolean-lippu, merkitsee onko suosituksia koskaan saatu
- `persistedRecommendations`: Tallennettu kopio viimeisimmistä suosituksista

### 2. Persistence Logic (useEffect)

```typescript
useEffect(() => {
  // If recommendation contains items, update persisted state
  if (recommendation && recommendation.items && recommendation.items.length > 0) {
    console.log('🔄 [Recommendations Persistence] Updating persisted recommendations', {
      itemCount: recommendation.items.length,
      previouslyHadRecommendations: hasReceivedRecommendations
    });
    
    // Mark that recommendations have been received
    setHasReceivedRecommendations(true);
    
    // Update persisted recommendations to latest version
    // This allows recommendations to be updated during conversation
    setPersistedRecommendations(recommendation);
  }
  // NOTE: If recommendation is null or empty, we DO NOT clear persistedRecommendations
  // This ensures recommendations stay visible even when not in current API response
}, [recommendation, hasReceivedRecommendations]);
```

**Kriittiset ominaisuudet**:
1. ✅ **Päivittää** persistedRecommendations kun uusia suosituksia tulee
2. ❌ **EI NOLLAA** persistedRecommendations kun recommendation on null
3. 📊 **Loggaa** kaikki päivitykset debuggausta varten

### 3. Display Logic

```typescript
// Display logic for recommendations - use persisted version if available
const displayRecommendations = persistedRecommendations;
const shouldShowRecommendations = hasReceivedRecommendations;
```

**Käyttö komponentissa**:
```typescript
// Ennen:
{recommendation && recommendation.items && recommendation.items.length > 0 && (
  <RecommendationsPanel />
)}

// Nyt:
{shouldShowRecommendations && displayRecommendations && displayRecommendations.items && displayRecommendations.items.length > 0 && (
  <RecommendationsPanel />
)}
```

---

## 📊 Käyttöskenaariot

### Skenaario 1: Ensimmäiset suositukset
```
1. API vastaus: { recommendation: { items: [A, B, C] } }
2. useEffect triggeröityy
3. hasReceivedRecommendations = true ✅
4. persistedRecommendations = { items: [A, B, C] } ✅
5. Suositukset näkyvät käyttäjälle ✅
```

### Skenaario 2: Keskustelu jatkuu (ei uusia suosituksia)
```
1. API vastaus: { recommendation: null }
2. useEffect EI triggeröidy (koska recommendation on null)
3. hasReceivedRecommendations = true (säilyy) ✅
4. persistedRecommendations = { items: [A, B, C] } (säilyy) ✅
5. Suositukset EDELLEEN näkyvät ✅
```

### Skenaario 3: AI päivittää suositukset
```
1. API vastaus: { recommendation: { items: [D, E, F] } }
2. useEffect triggeröityy
3. hasReceivedRecommendations = true (säilyy)
4. persistedRecommendations = { items: [D, E, F] } (PÄIVITTYY!) ✅
5. UUDET suositukset näkyvät ✅
```

### Skenaario 4: Pitkä keskustelu, useita päivityksiä
```
1. Ensimmäiset: [A, B, C] → Näkyy
2. Keskustelu jatkuu → [A, B, C] SÄILYY
3. AI päivittää: [A, D, E] → Näkyy (päivitetty)
4. Keskustelu jatkuu → [A, D, E] SÄILYY
5. AI päivittää: [F, G] → Näkyy (päivitetty)
6. Keskustelu jatkuu → [F, G] SÄILYY
```

---

## 🔧 Muutetut Komponentit

### Päivitetyt kohdat tiedostossa `Step3AIConversation.tsx`:

| Rivi | Muutos | Selitys |
|------|--------|---------|
| 163-166 | Uudet state-muuttujat | `hasReceivedRecommendations`, `persistedRecommendations` |
| 305-325 | useEffect hook | Persistence logiikka |
| 1332-1335 | Display logic | `displayRecommendations`, `shouldShowRecommendations` |
| 1650 | Grid layout | Käyttää `shouldShowRecommendations` |
| 1658 | Chat width | Käyttää `shouldShowRecommendations` |
| 1666 | Welcome screen | Käyttää `shouldShowRecommendations` |
| 1929 | Input placeholder | Käyttää `shouldShowRecommendations` |
| 1999 | Sidebar visibility | Käyttää `shouldShowRecommendations` |
| 2027, 2032 | Comparison & items | Käyttää `displayRecommendations` |
| 2036 | Items mapping | Käyttää `displayRecommendations.items` |
| 2113 | Collapsed view | Käyttää `displayRecommendations.items` |
| 2130 | "More" indicator | Käyttää `displayRecommendations.items` |
| 2159 | isRecommended check | Käyttää `displayRecommendations?.items` |
| 1070 | submitMessage | Käyttää `shouldShowRecommendations` |

---

## 🧪 Testaus

### Manuaalinen Testaus

1. **Perustoiminnallisuus**
   ```
   ✅ Aloita onboarding-keskustelu
   ✅ Vastaa kysymyksiin kunnes suositukset ilmestyvät
   ✅ Varmista että suositukset näkyvät oikein
   ```

2. **Pysyvyys**
   ```
   ✅ Jatka keskustelua suositusten jälkeen
   ✅ Kysy lisäkysymyksiä (5-10 kpl)
   ✅ Varmista että suositukset SÄILYVÄT näkyvissä
   ```

3. **Päivittyminen**
   ```
   ✅ Pyydä AI:ta tarkentamaan suosituksia
   ✅ Varmista että suositukset PÄIVITTYVÄT
   ✅ Varmista että vanhat suositukset korvataan uusilla
   ```

4. **Pitkä keskustelu**
   ```
   ✅ Keskustele 20-30 viestiä suositusten jälkeen
   ✅ Varmista että suositukset EDELLEEN näkyvät
   ✅ Testaa eri skenaarioita (kysymykset, kommentit, tarkennukset)
   ```

### Console Logging

Ominaisuus loggaa seuraavat tapahtumat:

```typescript
// Kun suositukset päivittyvät:
🔄 [Recommendations Persistence] Updating persisted recommendations
{
  itemCount: 3,
  previouslyHadRecommendations: true
}
```

### Tarkistuslista

- [x] State-muuttujat lisätty oikein
- [x] useEffect-logiikka toimii (ei nollaa kun ei pitäisi)
- [x] Display logic käyttää oikeita muuttujia
- [x] Kaikki viittaukset `recommendation.items`:iin päivitetty
- [x] Ei linter-virheitä
- [x] Console logging lisätty
- [x] Dokumentaatio luotu

---

## 🚨 Huomiot Kehittäjille

### ⚠️ TÄRKEÄÄ

1. **ÄLÄ KOSKAAN nollaa persistedRecommendations keskustelun aikana**
   ```typescript
   // ❌ VÄÄRIN:
   if (!recommendation) {
     setPersistedRecommendations(null); // HUONO!
   }
   
   // ✅ OIKEIN:
   // Älä tee mitään jos recommendation on null
   // persistedRecommendations säilyy ennallaan
   ```

2. **Käytä AINA displayRecommendations renderöinnissä**
   ```typescript
   // ❌ VÄÄRIN:
   {recommendation?.items?.map(...)}
   
   // ✅ OIKEIN:
   {displayRecommendations?.items?.map(...)}
   ```

3. **Tarkista shouldShowRecommendations näkyvyydelle**
   ```typescript
   // ❌ VÄÄRIN:
   {recommendation && <Panel />}
   
   // ✅ OIKEIN:
   {shouldShowRecommendations && displayRecommendations && <Panel />}
   ```

### 🐛 Debugging

Jos suositukset katoavat:
1. Tarkista console: `🔄 [Recommendations Persistence] Updating...`
2. Tarkista state: `hasReceivedRecommendations` pitäisi olla `true`
3. Tarkista state: `persistedRecommendations` ei saa olla `null`
4. Etsi virheelliset viittaukset: `grep "recommendation\.items" -r components/`

---

## 📚 Liittyvät Tiedostot

- **Pääkomponentti**: `components/auth/onboarding/Step3AIConversation.tsx`
- **API Endpoint**: `app/api/onboarding/cfo-chat-advanced/route.ts`
- **Dokumentaatio**: `docs/development/features/ONBOARDING_RECOMMENDATIONS_PERSISTENCE.md`

---

## 🔄 Versiohistoria

| Versio | Päivä | Muutos |
|--------|-------|--------|
| 1.0.0 | 2025-01-10 | Ensimmäinen toteutus - persistence logic |

---

## 📞 Yhteystiedot

**Vastuuhenkilö**: AI Development Agent  
**Prioriteetti**: High (Core User Experience)  
**Status**: Production Ready ✅

