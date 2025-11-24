# Fuengirolan Veneretket - Eriyttämissuunnitelma

## Tavoite
Eriyttää Fuengirolan Veneretket -sivusto omaksi itsenäiseksi Next.js-projektiksi, joka voidaan hostata erikseen.

## Vaihtoehdot

### Vaihtoehto 1: Kevyt eriytys - Subdomain (SUOSITUS)
**Toteutus:** Käytä olemassa olevaa projektia, mutta hostaa subdomain-osoitteessa
- **URL:** `veneretket.fuengirola.fi` tai `fuengirola-veneretket.lastbot.com`
- **Edut:**
  - ✅ Nopea toteutus (1-2h)
  - ✅ Ei tarvitse duplikoida koodia
  - ✅ Yhteinen Next.js-projekti, helppo ylläpitää
  - ✅ Voi käyttää samaa Supabase-tietokantaa
  - ✅ Middleware voi ohjata subdomain-pyynnöt oikeaan paikkaan
- **Haitat:**
  - ⚠️ Ei täysin itsenäinen projekti
  - ⚠️ Riippuvainen pääprojektista

**Toteutus:**
1. Lisää middleware-sääntö subdomainille
2. Luo erillinen layout subdomainille
3. Konfiguroi Vercel/hosting subdomainille
4. Päivitä DNS-asetukset

### Vaihtoehto 2: Täysi eriytys - Oma Next.js-projekti
**Toteutus:** Luo täysin uusi Next.js-projekti
- **URL:** `fuengirolanveneretket.fi` (oma domain)
- **Edut:**
  - ✅ Täysin itsenäinen projekti
  - ✅ Ei riippuvuuksia pääprojektista
  - ✅ Oma deployment-pipeline
  - ✅ Pienempi bundle size
  - ✅ Voi optimoida vain tälle sivustolle
- **Haitat:**
  - ⚠️ Enemmän työtä (4-8h)
  - ⚠️ Duplikoitu koodi (i18n, Supabase config, jne.)
  - ⚠️ Kaksi projektia ylläpidettävänä
  - ⚠️ Tarvitsee oman Vercel-projektin

**Toteutus:**
1. Luo uusi Next.js-projekti
2. Kopioi tarvittavat komponentit
3. Kopioi käännökset
4. Konfiguroi i18n
5. Konfiguroi Supabase (jos tarvitaan)
6. Deploy Verceliin
7. Konfiguroi domain

### Vaihtoehto 3: Monorepo-rakenne
**Toteutus:** Käytä Turborepo/NX monorepo-rakennetta
- **Edut:**
  - ✅ Jaetut komponentit ja utilit
  - ✅ Yhtenäinen development workflow
  - ✅ Itsenäiset deploymentit
  - ✅ Skaalautuva ratkaisu
- **Haitat:**
  - ⚠️ Monimutkainen setup (8-16h)
  - ⚠️ Vaatii monorepo-osaamista
  - ⚠️ Ylimääräinen kompleksisuus pienelle projektille

## Suositus: Vaihtoehto 1 - Subdomain

Tämä on nopein ja yksinkertaisin ratkaisu, joka säilyttää koodin yhtenäisyyden mutta mahdollistaa erillisen URL:n.

## Toteutussuunnitelma (Vaihtoehto 1)

### 1. Middleware-muutokset
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  
  // Ohjaa veneretket-subdomain oikeaan paikkaan
  if (hostname.includes('veneretket') || hostname.includes('fuengirola-veneretket')) {
    const locale = getLocaleFromPath(request.nextUrl.pathname)
    return NextResponse.rewrite(
      new URL(`/${locale}/fuengirola-veneretket`, request.url)
    )
  }
  
  // Normaali i18n-käsittely
  return i18nMiddleware(request)
}
```

### 2. Layout-muutokset
Luo erillinen layout veneretket-sivulle:
```typescript
// app/[locale]/fuengirola-veneretket/layout.tsx
export default function VeneretketLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BoatTripsHeader />
      {children}
      <BoatTripsFooter />
    </>
  )
}
```

### 3. Vercel-konfiguraatio
```json
// vercel.json
{
  "rewrites": [
    {
      "source": "/:locale(fi|en|sv|es)",
      "destination": "/:locale/fuengirola-veneretket",
      "has": [
        {
          "type": "host",
          "value": "veneretket.fuengirola.fi"
        }
      ]
    }
  ]
}
```

### 4. DNS-asetukset
- Lisää CNAME-tietue: `veneretket.fuengirola.fi` → Vercel
- Tai A-tietue: `veneretket.fuengirola.fi` → Vercel IP

## Toteutussuunnitelma (Vaihtoehto 2 - Täysi eriytys)

### 1. Luo uusi Next.js-projekti
```bash
npx create-next-app@latest fuengirola-veneretket
cd fuengirola-veneretket
npm install next-intl @supabase/supabase-js lucide-react
```

### 2. Kopioi tiedostot
```
Kopioitavat tiedostot:
├── app/
│   ├── [locale]/
│   │   ├── fuengirola-veneretket/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── i18n/
│   │   ├── config.ts
│   │   ├── request.ts
│   │   ├── routing.ts
│   │   └── navigation.ts
│   └── globals.css
├── components/
│   └── boat-trips/
│       ├── BoatTripsHeader.tsx
│       ├── BoatTripsFooter.tsx
│       ├── HeroSection.tsx
│       ├── TripsSection.tsx
│       ├── CharterFeaturesSection.tsx
│       ├── CaptainSection.tsx
│       ├── VideoGallerySection.tsx
│       ├── ImageGallerySection.tsx
│       ├── FeaturesSection.tsx
│       ├── TestimonialsSection.tsx
│       ├── BlogPreviewSection.tsx
│       ├── ContactSection.tsx
│       ├── BoatTripsChatbot.tsx
│       └── AOSInit.tsx
├── messages/
│   ├── fi/
│   │   └── BoatTrips.json
│   ├── en/
│   │   └── BoatTrips.json
│   ├── sv/
│   │   └── BoatTrips.json
│   └── es/
│       └── BoatTrips.json
├── middleware.ts
├── next.config.mjs
├── tailwind.config.ts
└── .env.local
```

### 3. Päivitä konfiguraatiot
- `next.config.mjs`: Poista turhat pluginit
- `middleware.ts`: Yksinkertaista vain i18n-käsittelyyn
- `app/[locale]/layout.tsx`: Poista turhat providerit
- `package.json`: Poista tarpeettomat riippuvuudet

### 4. Yksinkertaista rakennetta
- Poista admin-reitit
- Poista autentikaatio (jos ei tarvita)
- Poista Supabase (jos ei tarvita)
- Säilytä vain veneretket-sivuston komponentit

### 5. Deploy
```bash
# Vercel
vercel --prod

# Tai GitHub + Vercel
git init
git add .
git commit -m "Initial commit"
gh repo create fuengirola-veneretket --private
git push -u origin main
# Yhdistä Vercel GitHubiin
```

## Aikataulu ja työmäärä

### Vaihtoehto 1 (Subdomain):
- Setup: 1h
- Testaus: 30min
- DNS-konfiguraatio: 30min
- **Yhteensä: 2h**

### Vaihtoehto 2 (Oma projekti):
- Projektin luonti: 1h
- Tiedostojen kopiointi: 2h
- Konfiguraatioiden päivitys: 2h
- Testaus ja debuggaus: 2h
- Deployment: 1h
- **Yhteensä: 8h**

### Vaihtoehto 3 (Monorepo):
- Monorepo-setup: 4h
- Projektin migraatio: 4h
- Shared packages: 4h
- Testaus: 2h
- Deployment-pipeline: 2h
- **Yhteensä: 16h**

## Kustannukset

### Hosting (Vercel):
- **Vaihtoehto 1:** Ei lisäkustannuksia (sama projekti)
- **Vaihtoehto 2:** €0-20/kk (Hobby/Pro plan)
- **Vaihtoehto 3:** €0-20/kk per projekti

### Domain:
- `fuengirolanveneretket.fi`: ~€10-20/vuosi
- Subdomain: Ilmainen (jos päädomaini on jo olemassa)

## Päätös

**Suositus:** Aloita **Vaihtoehdolla 1 (Subdomain)**
- Nopea toteutus
- Helppo ylläpitää
- Voidaan myöhemmin siirtyä Vaihtoehtoon 2 tarvittaessa

Jos myöhemmin tarvitaan täysi eriytys, voidaan siirtyä Vaihtoehtoon 2 ilman suurta riskiä.

