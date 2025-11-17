import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale } from './config';

// Staattiset importit espanjalle (kaikki paitsi BizExit)
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
  // Validate that the incoming `locale` parameter is valid
  const validLocale = locales.includes(locale as any) ? locale : defaultLocale;

  let messages;
  
  // Käytä staattisia importteja espanjalle
  if (validLocale === 'es') {
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
  } else {
    // Muille kielille käytä vanhaa systeemiä
    const { getI18nConfig } = await import('./config');
    const config = await getI18nConfig({ locale: validLocale });
    messages = config.messages;
  }
  
  return {
    locale: validLocale,
    messages,
    timeZone: 'Europe/Helsinki',
    // Estä fallback muille kielille - näytä vain valitun kielen käännökset
    getMessageFallback: ({ namespace, key }) => {
      // Palauta avain sellaisenaan jos käännöstä ei löydy
      return `${namespace}.${key}`;
    }
  };
});
