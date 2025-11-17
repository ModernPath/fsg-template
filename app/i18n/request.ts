import { getRequestConfig } from 'next-intl/server';
import { locales, getI18nConfig, defaultLocale } from './config';

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  // If invalid, use default locale instead of throwing notFound()
  const validLocale = locales.includes(locale as any) ? locale : defaultLocale;

  const config = await getI18nConfig({ locale: validLocale });
  
  return {
    messages: config.messages,
    timeZone: config.timeZone
  };
});
