import { createNavigation } from 'next-intl/navigation';
import { staticLocales, defaultLocale } from './config';

export const { Link, redirect, usePathname, useRouter } = createNavigation({
  locales: staticLocales
});

export type NavigationPath =
  | '/'
  | '/about'
  | '/services'
  | '/tech'
  | '/solutions'
  | '/blog'
  | '/admin'
  | '/admin/blog'
  | '/admin/contacts'
  | '/admin/analytics'
  | '/admin/translations'
  | '/admin/media'
  | '/admin/users'
  | '/domains/healthcare'; 