'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useAuth } from '@/components/auth/AuthProvider';

export default function Footer() {
  const t = useTranslations('Footer');
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale(); // Use next-intl's useLocale for correct locale
  const { session, isPartner, loading } = useAuth();

  // Helper function to get localized URLs
  const getFooterUrl = (basePath: string) => {
    const urls: Record<string, Record<string, string>> = {
      fi: {
        '/funding/business-loan': '/rahoitus/yrityslaina',
        '/funding/credit-line': '/rahoitus/luottoraja',
        '/funding/factoring-ar': '/rahoitus/factoring',
        '/funding/leasing': '/rahoitus/leasing',
        '/solutions/retail': '/ratkaisut/kauppa',
        '/solutions/manufacturing': '/ratkaisut/teollisuus',
        '/solutions/construction': '/ratkaisut/rakentaminen',
        '/solutions/technology': '/ratkaisut/teknologia',
        '/solutions/health': '/ratkaisut/terveys',
        '/solutions/logistics': '/ratkaisut/logistiikka',
        '/situations/growth': '/rahoitustilanteet/kasvun-rahoitus',
        '/situations/working-capital': '/rahoitustilanteet/kassavirran-hallinta',
        '/situations/investment': '/rahoitustilanteet/investointien-rahoitus',
        '/situations/business-acquisitions': '/rahoitustilanteet/yrityskaupat',
        '/situations/crisis-financing': '/rahoitustilanteet/kriisirahoitus',
      },
      sv: {
        '/funding/business-loan': '/finansiering/foretagslan',
        '/funding/credit-line': '/finansiering/kreditgrans',
        '/funding/factoring-ar': '/finansiering/factoring',
        '/funding/leasing': '/finansiering/leasing',
        '/solutions/retail': '/losningar/handel',
        '/solutions/manufacturing': '/losningar/tillverkning',
        '/solutions/construction': '/losningar/byggande',
        '/solutions/technology': '/losningar/teknologi',
        '/solutions/health': '/losningar/halsa',
        '/solutions/logistics': '/losningar/logistik',
        '/situations/growth': '/finansieringssituationer/tillvaxt-finansiering',
        '/situations/working-capital': '/finansieringssituationer/kassaflode-hantering',
        '/situations/investment': '/finansieringssituationer/investering-finansiering',
        '/situations/business-acquisitions': '/finansieringssituationer/foretag-farvarvning',
        '/situations/crisis-financing': '/finansieringssituationer/kris-finansiering',
      },
      en: {} // English uses base paths
    };
    
    return `/${locale}${urls[locale]?.[basePath] || basePath}`;
  };

  const handleSignIn = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/${locale}/auth/sign-in?next=${encodeURIComponent(pathname)}`);
  };

  const handleExtranetClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!session && !loading) {
      // Käyttäjä ei ole kirjautunut - ohjaa kirjautumiseen partner dashboard:in kanssa
      router.push(`/${locale}/auth/sign-in?next=${encodeURIComponent(`/${locale}/partner/dashboard`)}`);
    } else if (session && isPartner) {
      // Käyttäjä on kirjautunut partner - ohjaa suoraan dashboard:iin
      router.push(`/${locale}/partner/dashboard`);
    } else if (session && !isPartner) {
      // Käyttäjä on kirjautunut mutta ei partner - näytä varoitus
      alert('Extranet on tarkoitettu vain yhteistyökumppaneille. Ota yhteyttä jos haluat liittyä kumppaniverkostoomme.');
    }
  };

  return (
    <footer className="bg-background text-foreground border-t border-border transition-colors duration-200">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gold-primary">FSG Financial Services Group Oy</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Trusty Finance</p>
              <p>Nuottakuninkaantie 6 A 3</p>
              <p>02230 Espoo</p>
              <p>+358 (0) 40 042 9736</p>
              <p>info@trustyfinance.fi</p>
            </div>
          </div>

          {/* Solutions */}
          <div className="space-y-4">
            <Link href={`/${locale}/funding`} className="block">
              <h3 className="text-lg font-semibold text-gold-primary hover:text-gold-highlight transition-colors cursor-pointer">{t('solutions')}</h3>
            </Link>
            <div className="space-y-2 text-sm">
              <Link href={getFooterUrl('/funding/business-loan')} className="block text-foreground hover:text-gold-primary transition-colors">
                {t('businessLoan')}
              </Link>
              <Link href={getFooterUrl('/funding/credit-line')} className="block text-foreground hover:text-gold-primary transition-colors">
                {t('creditLine')}
              </Link>
              <Link href={getFooterUrl('/funding/factoring-ar')} className="block text-foreground hover:text-gold-primary transition-colors">
                {t('factoring')}
              </Link>
              <Link href={getFooterUrl('/funding/leasing')} className="block text-foreground hover:text-gold-primary transition-colors">
                {t('leasing')}
              </Link>
            </div>
          </div>

          {/* Industries */}
          <div className="space-y-4">
            <Link href={`/${locale}/solutions`} className="block">
              <h3 className="text-lg font-semibold text-gold-primary hover:text-gold-highlight transition-colors cursor-pointer">{t('industries')}</h3>
            </Link>
            <div className="space-y-2 text-sm">
              <Link href={getFooterUrl('/solutions/retail')} className="block text-foreground hover:text-gold-primary transition-colors">
                {t('retail')}
              </Link>
              <Link href={getFooterUrl('/solutions/manufacturing')} className="block text-foreground hover:text-gold-primary transition-colors">
                {t('manufacturing')}
              </Link>
              <Link href={getFooterUrl('/solutions/construction')} className="block text-foreground hover:text-gold-primary transition-colors">
                {t('construction')}
              </Link>
              <Link href={getFooterUrl('/solutions/technology')} className="block text-foreground hover:text-gold-primary transition-colors">
                {t('technology')}
              </Link>
              <Link href={getFooterUrl('/solutions/health')} className="block text-foreground hover:text-gold-primary transition-colors">
                {t('health')}
              </Link>
              <Link href={getFooterUrl('/solutions/logistics')} className="block text-foreground hover:text-gold-primary transition-colors">
                {t('logistics')}
              </Link>
            </div>
          </div>

          {/* Situations */}
          <div className="space-y-4">
            <Link href={`/${locale}/situations`} className="block">
              <h3 className="text-lg font-semibold text-gold-primary hover:text-gold-highlight transition-colors cursor-pointer">{t('situations')}</h3>
            </Link>
            <div className="space-y-2 text-sm">
              <Link href={getFooterUrl('/situations/growth')} className="block text-foreground hover:text-gold-primary transition-colors">
                {t('growth')}
              </Link>
              <Link href={getFooterUrl('/situations/working-capital')} className="block text-foreground hover:text-gold-primary transition-colors">
                {t('workingCapital')}
              </Link>
              <Link href={getFooterUrl('/situations/investment')} className="block text-foreground hover:text-gold-primary transition-colors">
                {t('investment')}
              </Link>
              <Link href={getFooterUrl('/situations/business-acquisitions')} className="block text-foreground hover:text-gold-primary transition-colors">
                {t('businessAcquisitions')}
              </Link>
              <Link href={getFooterUrl('/situations/crisis-financing')} className="block text-foreground hover:text-gold-primary transition-colors">
                {t('crisisFinancing')}
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-foreground text-sm">
              © {new Date().getFullYear()} FSG Financial Services Group Oy / Trusty Finance {t('rights')}
            </p>
            <div className="flex items-center space-x-4 text-xs">
              <Link
                href="/privacy"
                className="text-foreground hover:text-gold-primary transition-colors"
              >
                {t('privacy')}
              </Link>
              <Link
                href={`/auth/sign-in?next=${encodeURIComponent(pathname)}`}
                className="text-foreground hover:text-gold-primary transition-colors"
              >
                {t('signIn')}
              </Link>
              <button
                onClick={handleExtranetClick}
                className="text-foreground hover:text-gold-primary transition-colors cursor-pointer bg-transparent border-none text-xs p-0"
              >
                {t('extranet')}
              </button>
              <Link
                href="/admin"
                className="text-foreground hover:text-gold-primary transition-colors"
              >
                {t('admin')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
