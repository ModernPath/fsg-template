import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);

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