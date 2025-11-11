# Sähköpostimallien käyttöohje

Tämä dokumentti selittää kuinka käyttää sähköpostimallijärjestelmää TrustyFinance-sovelluksessa.

## Sähköpostimallin tyypit

### Asiakkaat
- **customer_welcome** - Tervetuloa viesti uusille asiakkaille rekisteröitymisen jälkeen
- **document_upload** - Vahvistus dokumenttien latauksesta
- **funding_options** - Rahoitusvaihtoehtojen esittely
- **progress_update** - Prosessin etenemisen päivitykset
- **notification** - Järjestelmäilmoitukset asiakkaille

### Kumppanit
- **partner_welcome** - Tervetuloa viesti uusille kumppaneille ja kirjautumistiedot

### Yleiset
- **welcome** - Yleinen tervetuloa viesti (legacy, käytä customer_welcome tai partner_welcome)
- **booking** - Tapaamisen vahvistus
- **detailed** - Yksityiskohtaiset viestit
- **marketing** - Markkinointiviestit
- **custom** - Mukautetut mallit

## EmailTemplateService käyttö

### Asiakkaan tervetuloa viesti
```typescript
import { EmailTemplateService } from '@/lib/services/emailTemplateService'

const emailService = new EmailTemplateService()

// Lähetä tervetuloa viesti uudelle asiakkaalle
await emailService.sendWelcomeEmail(
  'Yrityksen Nimi Oy',      // companyName
  'asiakas@yritys.fi',      // recipientEmail
  'Matti Meikäläinen'       // recipientName (optional)
)
```

### Kumppanin tervetuloa viesti
```typescript
// Lähetä tervetuloa viesti ja kirjautumistiedot uudelle kumppanille
await emailService.sendPartnerWelcomeEmail(
  'Kumppaniyritys Oy',           // partnerName
  'partner@yritys.fi',           // partnerEmail
  'Liisa Liiketoiminta',         // recipientName
  'ABC123DEF456',                // signupCode
  'https://app.trusty.fi/signup/ABC123DEF456', // signupUrl
  15,                            // commissionPercent
  'premium',                     // partnerTier
  'admin@trustyfinance.fi',      // adminContactEmail
  'TrustyFinance Admin'          // adminContactName
)
```

## Sähköpostimallien kuvaukset

### 1. Tervetuloa (welcome)
- **Käyttötarkoitus**: Automaattinen tervetuloa viesti uusille asiakkaille rekisteröitymisen jälkeen
- **Lähetetään**: Asiakkaan rekisteröitymisen yhteydessä
- **Tärkeimmät muuttujat**: `company_name`, `recipient_name`, `sender_name`

### 2. Dokumentit vastaanotettu (document_upload)
- **Käyttötarkoitus**: Vahvistusviesti kun asiakas on ladannut dokumentteja
- **Lähetetään**: Dokumenttien latauksen jälkeen
- **Tärkeimmät muuttujat**: `company_id`, `company_name`, `recipient_name`

### 3. Rahoitusvaihtoehdot esittely (funding_options)
- **Käyttötarkoitus**: Viesti kun rahoitusvaihtoehdot on löydetty ja analyysi valmis
- **Lähetetään**: Analyysin valmistuttua
- **Tärkeimmät muuttujat**: `options_count`, `funding_options_summary`, `partner_portal_url`

### 4. Prosessin päivitys (progress_update)
- **Käyttötarkoitus**: Säännölliset tilannepäivitykset rahoitusprosessin etenemisestä
- **Lähetetään**: Prosessin eri vaiheissa
- **Tärkeimmät muuttujat**: `current_status_title`, `current_status_description`, `next_steps`

### 5. Järjestelmäilmoitus (notification)
- **Käyttötarkoitus**: Yleiset järjestelmäilmoitukset ja tärkeät tiedotteet
- **Lähetetään**: Tarpeen mukaan
- **Tärkeimmät muuttujat**: `notification_type`, `notification_title`, `notification_message`

### 6. Tapaamisen vahvistus (booking)
- **Käyttötarkoitus**: Automaattinen vahvistusviesti varatuista tapaamisista
- **Lähetetään**: Tapaamisen varauksen jälkeen
- **Tärkeimmät muuttujat**: `meeting_date`, `meeting_time`, `advisor_name`, `meeting_link`

### 7. 🆕 Kumppanin tervetuloa (partner_welcome)
- **Käyttötarkoitus**: Automaattinen tervetuloa viesti uusille kumppaneille signup koodin ja kirjautumislinkin kanssa
- **Lähetetään**: Kumppanin luomisen yhteydessä automaattisesti
- **Tärkeimmät muuttujat**: 
  - `partner_name` - Kumppanin nimi
  - `partner_email` - Kumppanin sähköposti
  - `signup_code` - Rekisteröitymiskoodi (⚠️ Luottamuksellinen)
  - `signup_url` - Rekisteröitymislinkki (⚠️ Luottamuksellinen)
  - `commission_percent` - Provisio-prosentti
  - `partner_tier` - Kumppanin taso (basic/premium/enterprise)
  - `admin_contact_email` - Yhteyshenkilön sähköposti
  - `admin_contact_name` - Yhteyshenkilön nimi

### 8. Yksityiskohtainen rahoitusanalyysi (detailed)
- **Käyttötarkoitus**: Syvällinen analyysi yrityksen rahoitustilanteesta
- **Lähetetään**: Manuaalisesti tai automaattisesti analyysin valmistuttua

### 9. Markkinoinnillinen teaser (marketing)
- **Käyttötarkoitus**: Markkinointiviestit ja kampanjat
- **Lähetetään**: Markkinointikampanjoiden yhteydessä

### 10. Mukautettu malli (custom)
- **Käyttötarkoitus**: Vapaamuotoiset viestit ja erikoistapaukset
- **Lähetetään**: Manuaalisesti tarpeen mukaan

## 🔒 Tietoturva ja kumppanin tervetuloa -malli

### Luottamuksellisten tietojen käsittely

Kumppanin tervetuloa -malli sisältää **erittäin luottamuksellisia tietoja**:

- **Rekisteröitymiskoodi** (`signup_code`) - Mahdollistaa kumppanin tilin luomisen
- **Rekisteröitymislinkki** (`signup_url`) - Suora linkki rekisteröintiin

### Turvallisuusvaatimukset

1. **Sähköpostin lähetys**:
   - KÄYTÄ suojattua sähköpostin lähetyskanavaa (TLS/SSL)
   - Varmista että sähköposti menee oikeaan osoitteeseen
   - Tallenna sähköpostin lähetyksen lokitiedot

2. **Koodin säilytys**:
   - Rekisteröitymiskoodi vanhenee automaattisesti 30 päivässä
   - Koodi poistetaan tietokannasta rekisteröitymisen jälkeen
   - Älä tallenna koodia logeihin tai väliaikaisiin tiedostoihin

3. **Linkin suojaus**:
   - Signup URL:ssa on uniikki koodi joka toimii vain kerran
   - URL vanhenee automaattisesti koodin mukana
   - Liikenne ohjataan HTTPS:n yli

### Automaattinen lähetys

Kumppanin tervetuloa -sähköposti lähetetään automaattisesti:

1. **Uuden kumppanin luomisen yhteydessä** (`POST /api/partners`)
2. **Signup koodin uudelleenluomisen yhteydessä** (`POST /api/partners/[id]/generate-code`)

Jos sähköpostin lähetys epäonnistuu, se ei keskeytä kumppanin luomisprosessia, vaan virhe vain logitetaan.

## Käyttö koodissa

### EmailTemplateService käyttö

```typescript
import { emailTemplateService } from '@/lib/services/emailTemplateService'

// Lähetä tervetuloa-viesti
await emailTemplateService.sendWelcomeEmail('Testi Oy', 'testi@example.com')

// Lähetä dokumentti vahvistus
await emailTemplateService.sendDocumentUploadConfirmation('Testi Oy', 'testi@example.com')

// Lähetä rahoitusvaihtoehdot
await emailTemplateService.sendFundingOptions(
  'Testi Oy',
  'testi@example.com', 
  3, 
  'Pankit, rahoitusyhtiöt ja julkinen rahoitus'
)

// Lähetä päivitys
await emailTemplateService.sendProgressUpdate(
  'Testi Oy',
  'testi@example.com',
  'Hakemus käsittelyssä',
  'Rahoitushakemus on tarkistuksessa ja päätös saadaan 2-3 työpäivän sisällä'
)
```

### Suora mallin haku ja renderöinti

```typescript
// Hae malli ja renderöi
const renderedEmail = await emailTemplateService.getRenderedEmail('welcome', {
  company_name: 'Testi Oy'
})

if (renderedEmail) {
  console.log('Subject:', renderedEmail.subject)
  console.log('Body:', renderedEmail.body)
  // Lähetä sähköposti käyttäen omaa email-servicea
}
```

## Mallien hallinta

### Admin-käyttöliittymä
- Siirry osoitteeseen: `/admin/email-templates`
- Näet kaikki olemassa olevat mallit
- Voit luoda uusia malleja klikkaamalla "Uusi malli"
- Voit muokata ja poistaa olemassa olevia malleja

### Uuden mallin luominen
1. Klikkaa "Uusi malli" -painiketta
2. Täytä pakolliset kentät:
   - **Nimi:** Kuvaava nimi mallille
   - **Tyyppi:** Valitse sopiva tyyppi listasta
   - **Aihe:** Sähköpostin aihe (voi sisältää muuttujia)
   - **Sisältö:** HTML-sisältö (voi sisältää muuttujia ja ehtoja)
3. Aseta halutessasi:
   - **Kuvaus:** Mallin käyttötarkoitus
   - **Aktiivinen:** Onko malli käytössä
   - **Oletusmalli:** Onko tämä oletusvalinta tälle tyypille

### Muuttujien käyttö
- Yksinkertainen muuttuja: `{{company_name}}`
- Ehdollinen lohko: `{{#if variable}}sisältö{{/if}}`
- Käytettävissä olevat muuttujat näkyvät mallin luomis-/muokkauslomakkeessa

## API-endpointit

### Testaa template servicea
```
GET /api/admin/email-templates/test-service
```
Palauttaa tietoja malleista ja testaa renderöintiä.

### Hae kaikki mallit
```
GET /api/admin/email-templates
```

### Luo uusi malli
```
POST /api/admin/email-templates
```

### Muokkaa mallia
```
PUT /api/admin/email-templates/[templateId]
```

### Poista malli
```
DELETE /api/admin/email-templates/[templateId]
```

### Esikatsele mallia
```
POST /api/admin/email-templates/[templateId]/preview
```

## Mallien luomisen script

Jos haluat luoda kaikki puuttuvat mallit kerralla:

```bash
# Hanki access token admin-käyttäjältä (developer tools -> Network -> Authorization header)
node tools/create-all-email-templates.js <access_token>
```

Tai aseta token ympäristömuuttujaan:
```bash
export ADMIN_ACCESS_TOKEN=<token>
node tools/create-all-email-templates.js
```

## Integrointi järjestelmään

### Document Upload Flow
```typescript
// Kun dokumentti ladataan onnistuneesti
import { emailTemplateService } from '@/lib/services/emailTemplateService'

async function handleDocumentUpload(companyName: string, userEmail: string) {
  // Prosessoi dokumentti...
  
  // Lähetä vahvistusviesti
  await emailTemplateService.sendDocumentUploadConfirmation(companyName, userEmail)
}
```

### Analysis Complete Flow
```typescript
// Kun analyysi valmistuu
async function handleAnalysisComplete(analysis: AnalysisResult) {
  await emailTemplateService.sendFundingOptions(
    analysis.companyName,
    analysis.contactEmail,
    analysis.fundingOptions.length,
    analysis.optionsSummary
  )
}
```

### Booking Flow
```typescript
// Kun tapaaminen varataan
async function handleBookingConfirmed(booking: BookingDetails) {
  await emailTemplateService.sendBookingConfirmation(
    booking.companyName,
    booking.email,
    booking.date,
    booking.time,
    booking.duration,
    booking.type,
    booking.advisorName,
    booking.meetingLink
  )
}
```

## Ylläpito

### Mallin päivitys
1. Siirry admin-käyttöliittymään
2. Klikkaa muokattavaa mallia
3. Tee muutokset
4. Tallenna
5. Järjestelmä luo automaattisesti version backup

### Mallin poistaminen
1. Varmista että malli ei ole käytössä missään
2. Poista malli admin-käyttöliittymässä
3. Tarkista että riippuvuudet on päivitetty

### Template-tyyppien lisääminen
1. Päivitä `EmailTemplateType` types/email.ts tiedostossa
2. Lisää uusi tyyppi admin-käyttöliittymään
3. Luo service-metodit tarvittaessa
4. Testaa toimivuus

---

**Huomio:** Tällä hetkellä järjestelmä ei vielä lähetä oikeita sähköposteja, vaan logittaa sisällön konsoliin. Email-palvelun (SendGrid, AWS SES, tms.) integrointi tulee tehdä myöhemmin. 

// 6. Tapaamisen vahvistus
emailService.sendBookingConfirmation(
  'customer@example.com',
  '15.7.2024',
  '14:00',
  60,
  'Matti Meikäläinen',
  'videokeskustelu',
  'https://meet.google.com/abc-defg-hij',
  'Timo Toimitusjohtaja'
)

// 7. 🆕 Kumppanin tervetuloa (automaattinen)
emailService.sendPartnerWelcomeEmail(
  'Kumppani Oy',                    // Kumppanin nimi
  'partner@example.com',            // Kumppanin sähköposti
  'Timo Toimitusjohtaja',          // Vastaanottajan nimi
  'ABCD1234',                      // Rekisteröitymiskoodi (luottamuksellinen)
  'https://app.trustyfinance.fi/partner-signup?code=ABCD1234', // Signup URL
  5.0,                             // Provisio-prosentti
  'premium',                       // Kumppanin taso
  'admin@trustyfinance.fi',        // Admin yhteystiedot
  'TrustyFinance Admin'
) 