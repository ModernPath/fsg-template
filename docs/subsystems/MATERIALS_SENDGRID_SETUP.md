# SendGrid Setup Guide for Materials Generation

## 📧 Email Notifications with SendGrid

Materials Generation System käyttää **SendGridiä** email-notifikaatioiden lähettämiseen.

---

## 🚀 Pikaopas (5 min)

### 1. Luo SendGrid Account (2 min)

1. Mene osoitteeseen: https://sendgrid.com/
2. Klikkaa "Start for Free"
3. Luo tili (ilmainen tier: 100 emailia/päivä)
4. Vahvista sähköpostiosoite

### 2. Verify Sender Email (2 min)

SendGrid vaatii että vahvistat lähettäjän sähköpostiosoitteen:

1. **Dashboard** → **Settings** → **Sender Authentication**
2. Klikkaa **"Verify a Single Sender"**
3. Täytä lomake:
   - **From Name**: TrustyFinance (tai yrityksesi nimi)
   - **From Email Address**: noreply@trustyfinance.fi (tai oma domainisi)
   - **Reply To**: support@trustyfinance.fi (tai oma sähköpostisi)
   - **Company Address**: Täytä yrityksen osoite
4. Klikkaa **"Create"**
5. **Tärkeää**: Mene sähköpostiisi ja klikkaa vahvistuslinkki!

### 3. Luo API Key (1 min)

1. **Dashboard** → **Settings** → **API Keys**
2. Klikkaa **"Create API Key"**
3. Anna nimi: `Materials Generation`
4. Valitse **"Restricted Access"**
5. Varmista että **"Mail Send"** on päällä:
   - Mail Send → **Full Access**
6. Klikkaa **"Create & View"**
7. **KOPIOI API KEY HETI** (näkyy vain kerran!)

### 4. Lisää Environment Variables

Lisää `.env.local`-tiedostoon:

```bash
# SendGrid Configuration
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@trustyfinance.fi  # SAMA kuin Sender Verification
EMAIL_FROM_NAME=TrustyFinance
```

**Tärkeää:**
- `EMAIL_FROM` täytyy olla **TÄSMÄLLEEN SAMA** kuin Sender Verificationissa
- Jos käytät `noreply@example.com`, se on vahvistettava SendGridissä ensin

---

## 📬 Email-tyyppit

Järjestelmä lähettää 4 erilaista notifikaatiota:

### 1. Documents Required
**Lähetetään kun**: Käyttäjän pitää ladata dokumentteja

```
Subject: Action Required: Upload Financial Documents - [Company Name]

Sisältö:
- Ilmoitus dokumenttien lataamisesta
- Lista tarvittavista dokumenteista
- Linkki upload-sivulle
```

### 2. Questionnaire Ready
**Lähetetään kun**: AI on luonut lomakkeen

```
Subject: Action Required: Complete Questionnaire - [Company Name]

Sisältö:
- Ilmoitus lomakkeen valmistumisesta
- Kysymysten määrä
- Linkki lomakkeeseen
- Arvioitu aika (10-15 min)
```

### 3. Generation Complete
**Lähetetään kun**: Materiaalit valmistuneet

```
Subject: Materials Ready: [Company Name]

Sisältö:
- Ilmoitus valmistumisesta
- Lista generoiduista materiaaleista
- Linkki materiaalien katseluun
```

### 4. Generation Failed
**Lähetetään kun**: Virhe generoinnissa

```
Subject: Generation Failed: [Company Name]

Sisältö:
- Virheilmoitus
- Virheen syy
- Linkki uudelleenyritystä varten
```

---

## 🧪 Testaus

### 1. Testaa SendGrid-yhteyttä

Luo testi-skripti `test-sendgrid.ts`:

```typescript
async function testSendGrid() {
  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: "your-test-email@example.com" }],
          subject: "Test Email from Materials Generation",
        },
      ],
      from: {
        email: process.env.EMAIL_FROM,
        name: process.env.EMAIL_FROM_NAME,
      },
      content: [
        {
          type: "text/html",
          value: "<h1>Test Successful!</h1><p>SendGrid is working.</p>",
        },
      ],
    }),
  });

  if (response.ok) {
    console.log("✅ Email sent successfully!");
  } else {
    const error = await response.text();
    console.error("❌ Failed to send:", error);
  }
}

testSendGrid();
```

Aja:
```bash
npx tsx test-sendgrid.ts
```

### 2. Testaa Materials Workflow

1. Käynnistä dev-serveri: `npm run dev`
2. Aloita materiaalien generointi
3. Tarkista Inngest logs: http://localhost:3000/api/inngest
4. Etsi "materials-notify-*" funktioita
5. Tarkista logeista onnistuiko email-lähetys

---

## 🔧 Troubleshooting

### Virhe: "403 Forbidden"

**Syy**: Sender email ei ole vahvistettu

**Ratkaisu**:
1. Tarkista SendGrid Dashboard → Sender Authentication
2. Varmista että email on "Verified"
3. Jos ei ole, lähetä vahvistus uudelleen
4. Klikkaa vahvistuslinkkiä sähköpostissa

### Virhe: "401 Unauthorized"

**Syy**: Virheellinen API-avain

**Ratkaisu**:
1. Tarkista että `SENDGRID_API_KEY` on oikein `.env.local`-tiedostossa
2. Varmista että avain alkaa `SG.`
3. Luo uusi avain jos tarpeen

### Virhe: "The from address does not match a verified Sender Identity"

**Syy**: `EMAIL_FROM` ei vastaa SendGridin Verified Sender -osoitetta

**Ratkaisu**:
1. Tarkista SendGrid Dashboard → Sender Authentication
2. Kopioi **TÄSMÄLLEEN** sama email kuin mitä siellä on
3. Päivitä `.env.local`: `EMAIL_FROM=exact-verified-email@domain.com`
4. Restart dev-serveriä

### Ei saapunut emailia

**Tarkista**:
1. Spam-kansio
2. SendGrid Dashboard → Activity
   - Näet kaikki lähetetyt emailit
   - Tarkista delivery status
3. Inngest logs virheitä varten

---

## 📊 SendGrid Dashboard

### Activity Feed

Näet kaikki lähetetyt emailit:
1. Dashboard → Activity
2. Rajaa päivämäärällä
3. Klikkaa emailia nähdäksesi:
   - Delivery status
   - Opens (jos tracking päällä)
   - Clicks (jos tracking päällä)
   - Bounce-syy (jos bounced)

### Statistics

Seuraa email-metriikoita:
- Delivered
- Opens
- Clicks
- Bounces
- Spam reports

---

## 💰 Pricing & Limits

### Free Tier
- **100 emailia/päivä**
- Sopii testaamiseen ja pieneen käyttöön
- Ei luottokorttia tarvita

### Essentials Plan ($19.95/kk)
- **50,000 emailia/kk**
- Email validation
- Dedicated IP (optional)

### Pro Plan ($89.95/kk)
- **100,000 emailia/kk**
- Advanced statistics
- Subuser management

---

## ✅ Best Practices

### 1. Sender Reputation

- **ÄLÄ lähetä spamia** - SendGrid sulkee tilin
- Pidä bounce rate < 5%
- Pidä spam complaint rate < 0.1%

### 2. Email Content

- **Selkeä subject line**: "Action Required" toimii hyvin
- **Call-to-action button**: HTML-linkki selkeästi esillä
- **Unsubscribe link**: Lisää jos lähetät markkinointia

### 3. Monitoring

- Tarkista SendGrid Activity päivittäin
- Seuraa bounce-ratea
- Korjaa invalid emails heti

---

## 🔐 Security

### API Key Management

- **Älä commitoi** API-avainta Gittiin
- Käytä `.env.local` (on jo `.gitignore`-listalla)
- Luo eri avaimet dev/staging/production

### Permissions

- Käytä **Restricted Access**
- Anna vain **Mail Send** -oikeus
- Älä anna **Full Access** ilman syytä

---

## 📚 Lisätietoa

- **SendGrid Docs**: https://docs.sendgrid.com/
- **API Reference**: https://docs.sendgrid.com/api-reference/mail-send/mail-send
- **Sender Authentication**: https://docs.sendgrid.com/ui/account-and-settings/how-to-set-up-domain-authentication

---

**Valmis!** 🎉

Nyt Materials Generation System voi lähettää email-notifikaatioita SendGridin kautta.

**Seuraavaksi**: Testaa workflow käynnistämällä materiaalien generointi!

---

**Luotu**: 14. tammikuuta 2025  
**Päivitetty**: SendGrid-integraatio

