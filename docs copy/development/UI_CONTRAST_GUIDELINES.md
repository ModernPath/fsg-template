# UI Contrast Guidelines

## ✅ Audit Completed: 2025-01-10

Tämä dokumentti sisältää ohjeistukset tekstin kontrastin ja näkyvyyden varmistamiseen koko TrustyFinance-sovelluksessa.

---

## 📋 Audit Yhteenveto

### Tarkistetut Komponentit

| Komponentti | Status | Huomiot |
|-------------|--------|---------|
| **Combobox/Select** | ✅ OK | `text-gray-light` lisätty yrityshaun nimiin |
| **Dropdown Menu** | ✅ OK | `text-popover-foreground` & `focus:text-accent-foreground` |
| **Input Fields** | ✅ OK | `dark:text-white` & `placeholder:text-gray-400` |
| **Card Components** | ✅ OK | `text-card-foreground` & `text-muted-foreground` |
| **Dialog/Modal** | ✅ OK | `text-muted-foreground` |
| **CompanySelector** | ✅ OK | `text-gold-primary` |
| **RadioGroup** | ✅ OK | `text-white` labelissa |

### Löydetyt Ongelmat

1. **✅ KORJATTU: Company Search Results** (`Step2CompanyInfo.tsx`)
   - **Ongelma:** Yrityksen nimi näkymätön (ei tekstin väriä)
   - **Ratkaisu:** Lisätty `text-gray-light` classiin

2. **✅ KORJATTU: Input Fields Text Visibility** (`styles/onboarding.css`)
   - **Ongelma:** Teksti näkyi vain focus-tilassa, ei normaalitilassa
   - **Syy:** `@apply text-white` ei toimi luotettavasti input-elementeille
   - **Ratkaisu:** Vaihdettu suoraan `color: #ffffff !important`
   - **Affected:** `.onboarding-input`, `.onboarding-textarea`, `.onboarding-input-large`

---

## 🎨 Kontrasti-standardit

### Väripaletti

TrustyFinance käyttää seuraavaa väripalettia:

```css
--gold-primary: 51 75% 65%;      /* Kulta (pääväri) */
--gold-secondary: 48 70% 55%;    /* Tummempi kulta */
--gold-highlight: 50 80% 70%;    /* Vaalea kulta (hover/focus) */
--gray-light: 216 12% 84%;       /* Vaalea harmaa */
--gray-medium: 220 9% 46%;       /* Keskiharmaa */
--gray-dark: 222 47% 11%;        /* Tumma harmaa (taustat) */
--gray-very-dark: 220 71% 4%;    /* Erittäin tumma (pohja) */
```

### Kontrasti-suhteet (WCAG 2.1)

| Käyttö | Vaatimus | Suositus |
|--------|----------|----------|
| **Iso teksti** (18pt+/14pt bold+) | 3:1 | 4.5:1 |
| **Normaali teksti** | 4.5:1 | 7:1 |
| **UI-komponentit** | 3:1 | 4.5:1 |

---

## 📐 Design Patterns

### 1. Dropdown/Select Items

**✅ OIKEIN:**
```tsx
<Combobox.Option
  className={({ active }) =>
    `select-none py-2 px-4 ${
      active ? 'bg-gold-primary/10 text-gold-primary' : 'text-gray-light'
    }`
  }
>
  {({ selected }) => (
    <span className={selected ? 'font-medium text-gold-primary' : 'font-normal text-gray-light'}>
      {text}
    </span>
  )}
</Combobox.Option>
```

**❌ VÄÄRIN:**
```tsx
<span className={selected ? 'font-medium text-gold-primary' : 'font-normal'}>
  {/* EI tekstin väriä! */}
</span>
```

### 2. Form Inputs

**✅ OIKEIN:**
```tsx
<input
  className="
    text-sm
    placeholder:text-gray-400
    dark:text-white
    dark:placeholder-gray-400
  "
/>
```

### 3. Card Content

**✅ OIKEIN:**
```tsx
<Card className="bg-card text-card-foreground">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription className="text-muted-foreground">
      Description
    </CardDescription>
  </CardHeader>
</Card>
```

### 4. Modal/Dialog

**✅ OIKEIN:**
```tsx
<DialogContent>
  <DialogTitle>Title</DialogTitle>
  <DialogDescription className="text-muted-foreground">
    Description
  </DialogDescription>
</DialogContent>
```

---

## 🔍 Tarkistuslista (Checklist)

Käytä tätä listaa kun luot uusia komponentteja:

- [ ] **Teksti on näkyvä kaikissa tiloissa**
  - [ ] Normal (lepotila)
  - [ ] Hover
  - [ ] Focus
  - [ ] Active
  - [ ] Disabled

- [ ] **Tekstillä on määritelty väri**
  - [ ] Ei pelkkää `font-*` ilman `text-*`
  - [ ] Dark mode -värit määritelty (`dark:text-*`)
  - [ ] Placeholder-värit määritelty

- [ ] **Kontrasti on riittävä**
  - [ ] Normaali teksti: min. 4.5:1
  - [ ] Iso teksti: min. 3:1
  - [ ] UI-elementit: min. 3:1

- [ ] **Interaktiiviset tilat toimivat**
  - [ ] Hover-tila näkyvä
  - [ ] Focus-tila näkyvä (outline/ring)
  - [ ] Active/Selected-tila selkeä

---

## 🛠️ Työkalut

### 1. Kontrasti-testaus

**Chromessa:**
1. Avaa DevTools (F12)
2. Elements → Styles
3. Klikkaa väri-boxia
4. Näet kontrasti-suhteen automaattisesti

**Online-työkalut:**
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Coolors Contrast Checker](https://coolors.co/contrast-checker)

### 2. Accessibility Testing

```bash
# Lighthouse audit
npm run build
npx lighthouse http://localhost:3000 --view

# Axe DevTools (Chrome Extension)
# https://chrome.google.com/webstore/detail/axe-devtools
```

---

## 📝 Muutosten Dokumentointi

Kun korjaat kontrasti-ongelmia:

1. **Lisää entry `ai_changelog.md`:**
```markdown
## YYYY-MM-DD - UI FIX: [Komponentin nimi]

### Ongelma
- Teksti ei näy...

### Ratkaisu
- Lisätty `text-*` class...

**Tiedosto:** `path/to/file.tsx`
**Rivi:** 123
```

2. **Päivitä tämä dokumentti** jos löydät uusia pattern-esimerkkejä

---

## 🎯 Best Practices

### DO ✅

1. **Käytä Tailwind-muuttujia:**
   ```tsx
   className="text-gold-primary" // ✅
   ```

2. **Määrittele dark-mode värit:**
   ```tsx
   className="text-gray-900 dark:text-gray-100" // ✅
   ```

3. **Käytä semantic color tokens:**
   ```tsx
   className="text-foreground"           // Body text
   className="text-muted-foreground"     // Secondary text
   className="text-card-foreground"      // Card content
   className="text-popover-foreground"   // Dropdown content
   ```

4. **Testaa accessibility:**
   - Tab-navigointi
   - Screen reader
   - Kontrasti-työkalut

### DON'T ❌

1. **Älä jätä tekstiä ilman väriä:**
   ```tsx
   className="font-normal" // ❌ Ei väriä!
   ```

2. **Älä käytä vain inline-styles:**
   ```tsx
   style={{ color: '#fff' }} // ❌ Ei dark-mode tukea
   ```

3. **Älä unohda hover/focus tiloja:**
   ```tsx
   className="text-gray-500" // ❌ Ei hover-väriä!
   ```

4. **Älä käytä liian matalan kontrastin värejä:**
   ```tsx
   className="text-gray-300 bg-gray-200" // ❌ Huono kontrasti!
   ```

5. **⚠️ KRIITTINEN: Älä luota @apply-direktiiviin input-kentissä!**
   ```css
   /* ❌ VÄÄRIN - Ei toimi luotettavasti: */
   .my-input {
     @apply text-white;  /* Teksti ei näy! */
   }
   
   /* ✅ OIKEIN - Käytä suoraa CSS-määritystä: */
   .my-input {
     color: #ffffff !important;  /* Aina näkyvä */
   }
   ```
   
   **Syy:** Tailwindin `@apply` ei toimi luotettavasti natiiville HTML-elementeille (input, textarea, select).  
   **Ratkaisu:** Käytä aina suoraa `color:`-määritystä `!important`-flagilla.

---

## 🔄 Ylläpito

### Säännöllinen Tarkistus

**Kuukausittain:**
- [ ] Aja Lighthouse audit
- [ ] Tarkista uudet komponentit
- [ ] Päivitä tämä dokumentti

**Ennen Jokaista Releasea:**
- [ ] Manuaalinen kontrasti-testaus kaikilla sivuilla
- [ ] Accessibility audit (Axe/Lighthouse)
- [ ] Dark mode testaus
- [ ] Mobile testaus

---

## 📚 Resurssit

### Dokumentaatio
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN: Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [Tailwind CSS Colors](https://tailwindcss.com/docs/customizing-colors)

### Työkalut
- [Contrast Ratio Calculator](https://contrast-ratio.com/)
- [Color Safe](http://colorsafe.co/)
- [Accessible Colors](https://accessible-colors.com/)

---

**Viimeksi päivitetty:** 2025-01-10  
**Seuraava audit:** 2025-02-10

