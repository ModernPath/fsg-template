'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/app/i18n/navigation';
import { useState, useEffect } from 'react';
import { languages as availableLanguages } from '@/app/i18n/languages';
import { staticLocales } from '@/app/i18n/config';
import { createClient } from '@/utils/supabase/client';
import { dedupingFetch } from '@/lib/utils/deduplication';

interface Language {
  code: string;
  name: string;
  native_name: string;
  enabled: boolean;
}

export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('Common.languageSelector');
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Memoize fetchLanguages to prevent recreation on each render
  const fetchLanguages = async () => {
    try {
      // Use dedupingFetch instead of regular fetch
      const response = await dedupingFetch('/api/languages');
      const { data, error } = await response.json();
      
      if (error) throw new Error(error);
      
      // Filter enabled languages
      const enabledLanguages = data?.filter((lang: Language) => lang.enabled);
      
      if (!enabledLanguages?.length) {
        // If no enabled languages found, use static locales
        const staticLanguages = staticLocales.map(code => {
          const lang = availableLanguages.find(l => l.code === code);
          return {
            code,
            name: lang?.name || code,
            native_name: lang?.native_name || code,
            enabled: true
          };
        });
        setLanguages(staticLanguages);
        return;
      }
      
      setLanguages(enabledLanguages);
    } catch (err) {
      console.error('Error fetching languages:', err);
      // Fallback to static locales
      const staticLanguages = staticLocales.map(code => {
        const lang = availableLanguages.find(l => l.code === code);
        return {
          code,
          name: lang?.name || code,
          native_name: lang?.native_name || code,
          enabled: true
        };
      });
      setLanguages(staticLanguages);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchLanguages();

    // Setup WebSocket subscription with proper cleanup
    let channel: ReturnType<typeof supabase.channel>;

    // Only setup WebSocket if page is visible and not in development
    if (document.visibilityState === 'visible' && process.env.NODE_ENV === 'production') {
      channel = supabase
        .channel('languages_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'languages'
          },
          // Debounce the refetch to prevent multiple rapid updates
          () => {
            const timeoutId = setTimeout(() => {
              fetchLanguages();
            }, 1000); // 1 second debounce
            return () => clearTimeout(timeoutId);
          }
        )
        .subscribe();
    }

    // Cleanup function
    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, []);  // Empty dependency array since fetchLanguages is now stable

  // Funktio joka muuntaa nykyisen polun oikeaan kielikohtaiseen muotoon uudelle kielelle
  const convertPathToLocale = (currentPath: string, currentLocale: string, targetLocale: string): string => {
    // Poista nykyinen kieli polusta
    const pathWithoutLocale = currentPath.replace(`/${currentLocale}`, '') || '/';
    
    // Kielikohtaiset polkumääritykset
    const pathMappings: Record<string, Record<string, string>> = {
      // Rahoitus
      '/funding': { fi: '/rahoitus', sv: '/finansiering', en: '/funding' },
      '/funding/business-loan': { fi: '/rahoitus/yrityslaina', sv: '/finansiering/foretagslan', en: '/funding/business-loan' },
      '/funding/credit-line': { fi: '/rahoitus/luottoraja', sv: '/finansiering/kreditgrans', en: '/funding/credit-line' },
      '/funding/factoring-ar': { fi: '/rahoitus/factoring', sv: '/finansiering/factoring', en: '/funding/factoring-ar' },
      '/funding/leasing': { fi: '/rahoitus/leasing', sv: '/finansiering/leasing', en: '/funding/leasing' },
      
      // Ratkaisut
      '/solutions': { fi: '/ratkaisut', sv: '/losningar', en: '/solutions' },
      '/solutions/retail': { fi: '/ratkaisut/kauppa', sv: '/losningar/handel', en: '/solutions/retail' },
      '/solutions/manufacturing': { fi: '/ratkaisut/teollisuus', sv: '/losningar/tillverkning', en: '/solutions/manufacturing' },
      '/solutions/construction': { fi: '/ratkaisut/rakentaminen', sv: '/losningar/byggande', en: '/solutions/construction' },
      '/solutions/technology': { fi: '/ratkaisut/teknologia', sv: '/losningar/teknologi', en: '/solutions/technology' },
      '/solutions/health': { fi: '/ratkaisut/terveys', sv: '/losningar/halsa', en: '/solutions/health' },
      '/solutions/logistics': { fi: '/ratkaisut/logistiikka', sv: '/losningar/logistik', en: '/solutions/logistics' },
      
      // Rahoitustilanteet
      '/situations': { fi: '/rahoitustilanteet', sv: '/finansieringssituationer', en: '/situations' },
      '/situations/growth': { fi: '/rahoitustilanteet/kasvun-rahoitus', sv: '/finansieringssituationer/tillvaxt-finansiering', en: '/situations/growth' },
      '/situations/working-capital': { fi: '/rahoitustilanteet/kassavirran-hallinta', sv: '/finansieringssituationer/kassaflode-hantering', en: '/situations/working-capital' },
      '/situations/investment': { fi: '/rahoitustilanteet/investointien-rahoitus', sv: '/finansieringssituationer/investering-finansiering', en: '/situations/investment' },
      '/situations/business-acquisitions': { fi: '/rahoitustilanteet/yrityskaupat', sv: '/finansieringssituationer/foretag-farvarvning', en: '/situations/business-acquisitions' },
      '/situations/crisis-financing': { fi: '/rahoitustilanteet/kriisirahoitus', sv: '/finansieringssituationer/kris-finansiering', en: '/situations/crisis-financing' },
      
      // Tietopankki
      '/knowledge': { fi: '/tietopankki', sv: '/kunskapsbank', en: '/knowledge' },
      '/knowledge/guide': { fi: '/tietopankki/opas', sv: '/kunskapsbank/guide', en: '/knowledge/guide' },
      '/knowledge/calculators': { fi: '/tietopankki/laskurit', sv: '/kunskapsbank/kalkylatorer', en: '/knowledge/calculators' },
      '/knowledge/glossary': { fi: '/tietopankki/sanasto', sv: '/kunskapsbank/ordlista', en: '/knowledge/glossary' },
      '/knowledge/faq': { fi: '/tietopankki/ukk', sv: '/kunskapsbank/faq', en: '/knowledge/faq' },
      
      // Tietoa
      '/about': { fi: '/tietoa', sv: '/om-oss', en: '/about' },
      '/about/team': { fi: '/tietoa/tiimi', sv: '/om-oss/team', en: '/about/team' },
      '/about/why-trusty': { fi: '/tietoa/miksi-trusty', sv: '/om-oss/varfor-trusty', en: '/about/why-trusty' },
      '/about/customer-stories': { fi: '/tietoa/asiakastarinat', sv: '/om-oss/kundberattelser', en: '/about/customer-stories' },
      
      // Muut
      '/contact': { fi: '/yhteystiedot', sv: '/kontakt', en: '/contact' },
      '/blog': { fi: '/blogi', sv: '/blogg', en: '/blog' },
    };
    
    // Etsi nykyistä polkua vastaava englanninkielinen polku
    let englishPath = pathWithoutLocale;
    
    // Jos nykyinen polku on kielikohtainen, muunna se ensin englanninkieliseksi
    for (const [enPath, locales] of Object.entries(pathMappings)) {
      if (locales[currentLocale] === pathWithoutLocale) {
        englishPath = enPath;
        break;
      }
    }
    
    // Hae kohdepolku uudelle kielelle
    const targetPath = pathMappings[englishPath]?.[targetLocale] || englishPath;
    
    // Palauta polku kielitunnuksen kanssa
    return `/${targetLocale}${targetPath}`;
  };

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value;
    try {
      // Muunna nykyinen polku oikeaan kielikohtaiseen muotoon uudelle kielelle
      const newPath = convertPathToLocale(pathname, locale, newLocale);
      // Poista kielitunnus polusta koska router.replace lisää sen automaattisesti
      const pathWithoutLocale = newPath.replace(`/${newLocale}`, '');
      await router.replace(pathWithoutLocale, { locale: newLocale });
    } catch (err) {
      console.error('Error changing locale:', err);
    }
  };

  if (loading) {
    return (
      <div className="h-7 w-16 animate-pulse bg-muted rounded-md" />
    );
  }

  return (
    <div className="flex items-center">
      <label 
        htmlFor="language-select" 
        className="sr-only"
      >
        {t('label')}
      </label>
      <select
        id="language-select"
        value={locale}
        onChange={handleChange}
        aria-label={t('ariaLabel')}
        className="h-7 w-16 px-3 py-0 text-sm font-medium bg-muted border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring hover:border-ring transition-colors appearance-none"
      >
        {languages.map((lang) => (
          <option 
            key={lang.code} 
            value={lang.code} 
            className="bg-background text-foreground py-1 px-2 font-medium"
            aria-label={`${lang.name} - ${lang.native_name}`}
          >
            {lang.code.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );
}
