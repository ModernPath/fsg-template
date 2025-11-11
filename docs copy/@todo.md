# TODO - Tasks

> **⚠️ HUOMIO:** Tämä on historiallinen TODO-lista. **Jatkossa käytä pääasiallisena toteutussuunnitelmana:**
> - **`docs/development/architecture/IMPLEMENTATION_PLAN.md`** - Yksityiskohtainen sprint-pohjainen toteutus
> - **`docs/development/architecture/CONSOLIDATED_ROADMAP.md`** - Konsolidoitu pitkän aikavälin roadmap 2025-2028
> 
> Tämä tiedosto säilytetään referenssinä, mutta uudet tehtävät priorisoidaan ja suunnitellaan IMPLEMENTATION_PLAN.md:ssä.

---

## ❌ **BACKLOG - Ei aloitettu**

### 🔧 **Tekninen velka**
- Optimoi tietokantaläyskyt raskaissa näkymissä
- Lisää cache-mekanismit API-vastauksiin
- Paranna error boundary -käsittelyä
- Lisää unit-testit komponenteille
- Implementoi end-to-end testit

### 📊 **Analytiikka ja raportointi**
- Luo kattavat dashboard-mittarit
- Implementoi CSV/Excel-vienti toiminnallisuudet
- Lisää reaaliaikaiset notifikaatiot
- Luo automaattiset raportit
- Implementoi data visualization -komponentit

### 🚀 **Uudet ominaisuudet**
- Lisää webhook-integraatiot
- Implementoi API rate limiting
- Luo mobile-sovellus (React Native)
- Lisää AI-pohjaiset suositukset
- Implementoi real-time chat

## ⏳ **KÄYNNISSÄ - In progress**

### 🎯 **Aktiiviset projektit**
- Partner UI/UX parantaminen ja lisäominaisuudet (komissiraportit, referral linkit)

## ✅ **VALMIS - Completed**

### 🎯 **Syväanalyysi & Rahoitusmekanismit**
- ✅ Toteutettu monimutkainen talousanalyysi uusilla mittareilla
- ✅ Lisätty automaattinen rahoitustarvelaskelma
- ✅ Implementoitu timeout-optimoinnit API-kutsuille
- ✅ Paranneltu virheenkäsittely ja user experience
- ✅ Luotu kattavat suorituskykymittarit

### 🤝 **Yhteistyökumppanit (Partners) -kokonaisuus**
- ✅ **Admin-hallinta:** Täydellinen CRUD-toiminnallisuus partnereille
- ✅ **Partner-profiili:** Kattava detail-sivu tilastoineen
- ✅ **Partner-muokkaus:** Käyttäjäystävällinen edit-lomake
- ✅ **Käännökset:** Kaikki kielet (FI/EN/SV) täydelliset
- ✅ **API-endpointit:** Turvalliset ja validoidut
- ✅ **Partner Signup:** Kokonainen rekisteröitymisprosessi
- ✅ **Signup-koodit:** Generaattori ja validointi
- ✅ **Dashboard-tilastot:** Reaaliaikaiset mittarit
- ✅ **Navigaatio:** Korjattu ja käännetty
- ✅ **Select-komponentit:** React-virheet korjattu
- ✅ **Debug-loggaus:** API-autentikointi parannettu
- ✅ **Partner Authentication:** Kokonaisvaltainen kirjautumisprosessi
  - ✅ Auth callback tunnistaa partnerin ja redirectaa dashboard:iin
  - ✅ AuthProvider laajennettu partner-tiedoilla (isPartner, partnerId)
  - ✅ Partner layout suojaa partner-sivut
  - ✅ Partner dashboard käyttää uutta AuthProvider:ia
  - ✅ API oikeudet päivitetty partnereille
  - ✅ AuthProvider laajennettu partner-tiedoilla (isPartner, partnerId)
  - ✅ Partner layout suojaus toteutettu  
  - ✅ Partner signup success sivu korjattu
  - ✅ API oikeudet sallii partnerin lukea omia tietojaan
  - ✅ **Extranet linkki korjaus:** Footer extranet käyttää AuthProvider:ia ja ohjaa älykkäästi
  - ✅ **Auth callback korjaus:** Poistettu päällekkäinen logiikka, parannettu logging
  - ✅ **Partner signup profile creation:** UPSERT korjaa trigger vs manual insert ongelman

### 🏗️ **Perusrakenne**
- ✅ NextJS 15 ja React 19 -pohja
- ✅ Supabase-integraatio
- ✅ Tailwind CSS -tyylit
- ✅ TypeScript-konfiguraatio
- ✅ i18n monikielisyys (FI/EN/SV)
- ✅ Jest ja Cypress -testikehykset
- ✅ Admin-authentication & oikeuksien hallinta

### 👥 **Käyttäjähallinta**
- ✅ Supabase Auth -integraatio
- ✅ Kattava admin-paneeli
- ✅ Email-pohjainen autentikointi
- ✅ Profiilienhallinta
- ✅ Oikeuksien tarkistus

### 🏢 **Yritys- ja asiakashallinta**
- ✅ Yritysprofiilien luonti ja hallinta
- ✅ YTJ-integraatio yritysdatan hakuun
- ✅ Asiakassuhteiden seuranta
- ✅ Dokumenttien hallinta

### 📑 **Blog & Sisällönhallinta**
- ✅ Täydellinen blog-järjestelmä AI-tuella
- ✅ Markdown-editori reaaliaikaisella esikatselulla
- ✅ Mediakirjasto kuville ja tiedostoille
- ✅ SEO-optimointi ja metadata
- ✅ Kommenttijärjestelmä

### 💰 **Rahoitushallinta**
- ✅ Rahoitushankkeiden seuranta
- ✅ Hakemusprosessin automatisointi
- ✅ Lender-integraatiot
- ✅ Financial dashboard
- ✅ Raportointityökalut

### 📧 **Viestintä & Notifikaatiot**
- ✅ Email-template hallinta
- ✅ Automaattiset notifikaatiot
- ✅ Contact-lomakkeet
- ✅ GDPR-yhteensopiva tiedonkäsittely

### 🔗 **Integraatiot**
- ✅ OpenAI/Gemini AI-palvelut
- ✅ Tavily search -integraatio
- ✅ Recraft-kuvagenerointi
- ✅ Supabase-tietokanta
- ✅ Email-service provider

### 📱 **Käyttöliittymä**
- ✅ Responsiivinen design
- ✅ Dark/Light mode -tuki
- ✅ Component library (shadcn/ui)
- ✅ Loading states ja error boundaries
- ✅ Accessibility-optimoinnit

### 🧪 **Testaus & Laatu**
- ✅ Unit-testit komponenteille
- ✅ Integration-testit API:lle
- ✅ E2E-testit kriittisille poluille
- ✅ ESLint ja TypeScript -tarkistukset
- ✅ Code quality -metriikat

### 🚀 **DevOps & Tuotanto**
- ✅ Vercel-deployment pipeline
- ✅ Environment-konfiguraatiot
- ✅ CI/CD -prosessit
- ✅ Error tracking ja monitoring
- ✅ Performance optimization

### Financial Data & Analysis
-   ✅ Fix `upsertFinancialMetrics` to merge `source_document_ids` (Verified logic is correct, logging was misleading).
-   ✅ Fix `process-document-analysis-request` Inngest function to handle multiple job records (`maybeSingle()` error).
-   ✅ Modify `OnboardingFlow.tsx` to implement polling for updated financial data after analysis is triggered.

### Data Model & Extraction
-   ✅ Add missing fields to the `financial_metrics` table schema.
-   ✅ Update the Gemini extraction prompt to include the new fields.
-   ✅ Update relevant code (Inngest functions, API routes, types) to handle the new fields. 

### UI & Localization
-   ✅ Fix missing localization keys in Step4DocumentUpload.tsx causing IntlError messages

### API & Authentication
-   ✅ Fix document request API authentication (401 Unauthorized error in /api/send-document-request)
-   ✅ Fix document request API database query (500 Internal Server Error due to incorrect column name)
-   ✅ Fix SendGrid sender identity (500 Internal Server Error) 

### Features & Enhancements
-   ⏳ Implement user profile management page.
-   ⏳ Add user roles and permissions system.
-   ⏳ Integrate notifications system (e.g., Bell icon).
-   ❌ Create admin dashboard for managing users and content.
-   ❌ Add multi-language support for blog posts.
-   ✅ Implement secure document upload via email link.
    -   ✅ Create `document_requests` table.
    -   ✅ Update request API to generate/store token & link.
    -   ✅ Create token validation API.
    -   ✅ Create secure file upload API & align with standard upload process.
    -   ✅ Add analysis trigger (Inngest event) to secure upload API.
    -   ✅ Create secure upload frontend page & component.
    -   ✅ Fix file appending in secure upload component.
    -   ✅ Add translations for secure upload UI.
    -   ✅ Implement email notification for analysis completion (financialAnalysisService.ts)
    -   ✅ Implement secure document upload flow via email link
        -   ✅ Create `document_requests` table
        -   ✅ Update `/api/send-document-request` API
    -   ❌ Implement email notification to requester upon secure upload completion.

### Bugs & Fixes
-   ✅ Fix login form error handling.
-   ✅ Resolve dashboard data loading issues.
-   ✅ Optimize image loading performance on blog page.
-   ✅ Fix financial metrics display errors.
    -   ✅ Handle multiple `analysis_jobs` records.
    -   ✅ Implement frontend polling for results.
-   ✅ Fix missing localization keys in Step4DocumentUpload.tsx.
-   ✅ Fix document request API authentication (401 & 403 errors).
-   ✅ Fix document request API database query (500 Internal Server Error).
-   ✅ Fix SendGrid sender identity (500 Internal Server Error).
-   ✅ Fix "Failed to update draft application" error in loan application form.
    -   ✅ Fixed syntax error in save-draft-application API (missing else clause).
    -   ✅ Fixed term_months database constraint (removed NOT NULL for funding types that don't require loan terms).
    -   ✅ Updated API to properly handle null values for term_months field.

### Technical Debt & Refactoring
-   ❌ Refactor authentication logic into reusable hooks/utils.
-   ❌ Improve CSS structure and remove unused styles.
-   ❌ Add more comprehensive unit and integration tests.

### Documentation
-   ✅ Update project setup instructions in README.
-   ⏳ Document API endpoints and data models.
-   ❌ Create comprehensive testing strategy document.
-   ✅ Fix `401 Unauthorized` in `/api/send-document-request` (cookie auth)
-   ✅ Update `/api/send-document-request` to use token auth
-   ✅ Fix `500 Internal Server Error` (wrong column `user_id` vs `created_by`)
-   ✅ Fix `403 Forbidden` (RLS + service role issue)
-   ✅ Fix `500 Internal Server Error` (SendGrid sender)
-   ✅ Fix missing localization keys in `Step4DocumentUpload.tsx` 

## ❌ **FACTORING-LASKURI (UUSI SIVU) - MVP**
- **Reititys ja sivu**: Luo `app/[locale]/calculator/factoring/page.tsx` (ei muutoksia päälaskuriin)
- **UI/UX periaatteet**: Dark mode default, glassmorphism-kortit, gradientit, Framer Motion -animaatiot, progress (1–4), smooth scroll, skeleton loaders, mobile-first
- **i18n**: Luo `messages/{fi,en,sv}/FactoringCalculator.json` perusavaimille (otsikot, kentät, virheet, CTA:t)
- **Yrityshaku**: Käytä `GET /api/companies/search` (YTJ v3) debounce 500ms; min 3 merkkiä; businessId tai nimi; tuloslistasta valinta tai manuaalinen täyttö
- **Manuaalinen yrityslomake**: Nimi, toimiala, liikevaihto, perustamisvuosi, henkilöstömäärä; validoinnit (Zod)
- **Laskenta (client)**: Syötteet `monthlyInvoices`, `avgDays`; oletukset `advancePct=80`, `feePctRange=1.5–4.5% + korko`; laske `advance`, `feesRange`, kassavirran aikaistus; ROI-kortit (vapautuva käyttöpääoma, lisämyynti-%, kiertonopeus)
- **Tulokset (ei tarjouksia)**: Näytä kustannusesimerkkien haarukka (edullinen–premium) + kassavirta-visualisaatio
- **Yhteystiedot & tilin luonti**: Jos ei tokenia → automaattinen käyttäjän luonti/invite emaililla tallennuksen yhteydessä; jos tokeni → tallenna käyttäjän kontekstissa
- **Liidin tallennus**: `POST /api/calculator/save` (sis. invite) tai `POST /api/calculator/lead` kun kirjautunut; kentät: `locale`, `sourcePage='calculator/factoring'`, `businessId`, `companyName`, `email`, `phone`, `calculatorType='factoring'`, `inputs`, `result`
- **Yrityksen tallennus**: Luo tai upsertaa yritys `POST /api/companies` laskurista; liitä käyttäjään `user_companies` (owner)
- **Chatbot 2.0 (rinnalla)**: Rajattu scope factoring-aiheisiin; max 5 kysymystä, 10min timeout; sääntö+AI; talletus `calculator_chat_logs`; näkyy sivun oikeassa laidassa tai kelluvana komponenttina
- **Analytiikka**: Tallenna `sourcePage`, käyttäytymisdata (aika, drop-off), input/result snapshot liidiin; yksinkertainen lead scoring (heuristiikka) → talletus liidiin
- **Tietoturva**: Rate limit yrityshakuun, server-validoinnit Zodilla, selkeät virheilmoitukset

### ⏱️ Hyväksymiskriteerit
- Sivulle `/<locale>/calculator/factoring` voi navigoida
- Yrityshaku ja manuaalinen täyttö toimivat
- Laskenta päivittyy reaaliajassa ja näyttää haarukan (edullinen–premium)
- Liidi tallentuu; ei-kirjautuneena email → käyttäjän invite luodaan automaattisesti
- Yritys tallennetaan Supabaseen laskurista ja linkitetään käyttäjään
- Chatbot toimii rinnalla rajatulla skoopilla ja keskustelu lokittuu
- Täysin responsiivinen 