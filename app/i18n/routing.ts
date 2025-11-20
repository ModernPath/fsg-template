import { defineRouting } from 'next-intl/routing';
import { staticLocales, defaultLocale } from './config';

export const routing = defineRouting({
  locales: staticLocales,
  defaultLocale: defaultLocale,
  localePrefix: 'always' // Always show locale in URL
});
