import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale } from './config';

// FINNISH (fi)
import fiAbout from '@/messages/fi/About.json';
import fiAccount from '@/messages/fi/Account.json';
import fiAdmin from '@/messages/fi/Admin.json';
import fiAuth from '@/messages/fi/Auth.json';
import fiBlog from '@/messages/fi/Blog.json';
import fiBoatTrips from '@/messages/fi/BoatTrips.json';
import fiCommon from '@/messages/fi/Common.json';
import fiContact from '@/messages/fi/Contact.json';
import fiCookieConsent from '@/messages/fi/CookieConsent.json';
import fiFooter from '@/messages/fi/Footer.json';
import fiIndex from '@/messages/fi/Index.json';
import fiLandingPages from '@/messages/fi/LandingPages.json';
import fiMedia from '@/messages/fi/Media.json';
import fiNavigation from '@/messages/fi/Navigation.json';
import fiPresentations from '@/messages/fi/Presentations.json';
import fiPrivacy from '@/messages/fi/Privacy.json';
import fiProfile from '@/messages/fi/Profile.json';

// ENGLISH (en)
import enAbout from '@/messages/en/About.json';
import enAccount from '@/messages/en/Account.json';
import enAdmin from '@/messages/en/Admin.json';
import enAuth from '@/messages/en/Auth.json';
import enBlog from '@/messages/en/Blog.json';
import enBoatTrips from '@/messages/en/BoatTrips.json';
import enCommon from '@/messages/en/Common.json';
import enContact from '@/messages/en/Contact.json';
import enCookieConsent from '@/messages/en/CookieConsent.json';
import enFooter from '@/messages/en/Footer.json';
import enIndex from '@/messages/en/Index.json';
import enLandingPages from '@/messages/en/LandingPages.json';
import enMedia from '@/messages/en/Media.json';
import enNavigation from '@/messages/en/Navigation.json';
import enPresentations from '@/messages/en/Presentations.json';
import enPrivacy from '@/messages/en/Privacy.json';
import enProfile from '@/messages/en/Profile.json';

// SWEDISH (sv)
import svAbout from '@/messages/sv/About.json';
import svAccount from '@/messages/sv/Account.json';
import svAdmin from '@/messages/sv/Admin.json';
import svAuth from '@/messages/sv/Auth.json';
import svBlog from '@/messages/sv/Blog.json';
import svBoatTrips from '@/messages/sv/BoatTrips.json';
import svCommon from '@/messages/sv/Common.json';
import svContact from '@/messages/sv/Contact.json';
import svCookieConsent from '@/messages/sv/CookieConsent.json';
import svFooter from '@/messages/sv/Footer.json';
import svIndex from '@/messages/sv/Index.json';
import svLandingPages from '@/messages/sv/LandingPages.json';
import svMedia from '@/messages/sv/Media.json';
import svNavigation from '@/messages/sv/Navigation.json';
import svPresentations from '@/messages/sv/Presentations.json';
import svPrivacy from '@/messages/sv/Privacy.json';
import svProfile from '@/messages/sv/Profile.json';

// SPANISH (es)
import esAbout from '@/messages/es/About.json';
import esAccount from '@/messages/es/Account.json';
import esAdmin from '@/messages/es/Admin.json';
import esAuth from '@/messages/es/Auth.json';
import esBlog from '@/messages/es/Blog.json';
import esBoatTrips from '@/messages/es/BoatTrips.json';
import esCommon from '@/messages/es/Common.json';
import esContact from '@/messages/es/Contact.json';
import esCookieConsent from '@/messages/es/CookieConsent.json';
import esFooter from '@/messages/es/Footer.json';
import esIndex from '@/messages/es/Index.json';
import esLandingPages from '@/messages/es/LandingPages.json';
import esMedia from '@/messages/es/Media.json';
import esNavigation from '@/messages/es/Navigation.json';
import esPresentations from '@/messages/es/Presentations.json';
import esPrivacy from '@/messages/es/Privacy.json';
import esProfile from '@/messages/es/Profile.json';

export default getRequestConfig(async ({ locale }) => {
  console.log('🌐 [i18n/request] Locale:', locale);
  
  // Validate that the incoming `locale` parameter is valid
  const validLocale = locales.includes(locale as any) ? locale : defaultLocale;
  console.log('✅ [i18n/request] Valid locale:', validLocale);

  let messages;
  
  // Käytä staattisia importteja KAIKILLE kielille
  switch (validLocale) {
    case 'fi':
      console.log('🇫🇮 [i18n/request] Loading Finnish static imports...');
      messages = {
        About: fiAbout,
        Account: fiAccount,
        Admin: fiAdmin,
        Auth: fiAuth,
        Blog: fiBlog,
        BoatTrips: fiBoatTrips,
        Common: fiCommon,
        Contact: fiContact,
        CookieConsent: fiCookieConsent,
        Footer: fiFooter,
        Index: fiIndex,
        LandingPages: fiLandingPages,
        Media: fiMedia,
        Navigation: fiNavigation,
        Presentations: fiPresentations,
        Privacy: fiPrivacy,
        Profile: fiProfile
      };
      break;
    
    case 'en':
      console.log('🇬🇧 [i18n/request] Loading English static imports...');
      messages = {
        About: enAbout,
        Account: enAccount,
        Admin: enAdmin,
        Auth: enAuth,
        Blog: enBlog,
        BoatTrips: enBoatTrips,
        Common: enCommon,
        Contact: enContact,
        CookieConsent: enCookieConsent,
        Footer: enFooter,
        Index: enIndex,
        LandingPages: enLandingPages,
        Media: enMedia,
        Navigation: enNavigation,
        Presentations: enPresentations,
        Privacy: enPrivacy,
        Profile: enProfile
      };
      break;
    
    case 'sv':
      console.log('🇸🇪 [i18n/request] Loading Swedish static imports...');
      messages = {
        About: svAbout,
        Account: svAccount,
        Admin: svAdmin,
        Auth: svAuth,
        Blog: svBlog,
        BoatTrips: svBoatTrips,
        Common: svCommon,
        Contact: svContact,
        CookieConsent: svCookieConsent,
        Footer: svFooter,
        Index: svIndex,
        LandingPages: svLandingPages,
        Media: svMedia,
        Navigation: svNavigation,
        Presentations: svPresentations,
        Privacy: svPrivacy,
        Profile: svProfile
      };
      break;
    
    case 'es':
      console.log('🇪🇸 [i18n/request] Loading Spanish static imports...');
      messages = {
        About: esAbout,
        Account: esAccount,
        Admin: esAdmin,
        Auth: esAuth,
        Blog: esBlog,
        BoatTrips: esBoatTrips,
        Common: esCommon,
        Contact: esContact,
        CookieConsent: esCookieConsent,
        Footer: esFooter,
        Index: esIndex,
        LandingPages: esLandingPages,
        Media: esMedia,
        Navigation: esNavigation,
        Presentations: esPresentations,
        Privacy: esPrivacy,
        Profile: esProfile
      };
      break;
    
    default:
      console.error('❌ Unknown locale, falling back to Finnish');
      messages = {
        About: fiAbout,
        Account: fiAccount,
        Admin: fiAdmin,
        Auth: fiAuth,
        Blog: fiBlog,
        BoatTrips: fiBoatTrips,
        Common: fiCommon,
        Contact: fiContact,
        CookieConsent: fiCookieConsent,
        Footer: fiFooter,
        Index: fiIndex,
        LandingPages: fiLandingPages,
        Media: fiMedia,
        Navigation: fiNavigation,
        Presentations: fiPresentations,
        Privacy: fiPrivacy,
        Profile: fiProfile
      };
  }
  
  console.log('🎯 [i18n/request] Returning config for locale:', validLocale);
  console.log('📦 [i18n/request] BoatTrips.hero.title:', (messages as any).BoatTrips?.hero?.title);
  
  return {
    locale: validLocale,
    messages,
    timeZone: 'Europe/Helsinki',
    // Estä fallback muille kielille
    getMessageFallback: ({ namespace, key }) => {
      return `${namespace}.${key}`;
    }
  };
});
