import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale } from './config';

// Staattiset importit espanjalle
import esBoatTrips from '@/messages/es/BoatTrips.json';
import esNavigation from '@/messages/es/Navigation.json';
import esCommon from '@/messages/es/Common.json';
import esFooter from '@/messages/es/Footer.json';
import esIndex from '@/messages/es/Index.json';

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  const validLocale = locales.includes(locale as any) ? locale : defaultLocale;

  let messages;
  
  // Käytä staattisia importteja espanjalle
  if (validLocale === 'es') {
    messages = {
      BoatTrips: esBoatTrips,
      Navigation: esNavigation,
      Common: esCommon,
      Footer: esFooter,
      Index: esIndex
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
    timeZone: 'Europe/Helsinki'
  };
});
