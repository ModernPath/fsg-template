import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, getI18nConfig } from './config';

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound();

  const config = await getI18nConfig({ locale });
  
  return {
    messages: config.messages,
    timeZone: config.timeZone
  };
});
