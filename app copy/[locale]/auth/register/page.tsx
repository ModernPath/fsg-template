'use client'

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function RegisterPage() {
  const router = useRouter();
  const { locale } = useParams();
  const t = useTranslations('Auth');

  useEffect(() => {
    // Redirect to the new onboarding flow
    router.replace(`/${locale}/onboarding`);
  }, [router, locale]);

  // Show a simple loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
} 