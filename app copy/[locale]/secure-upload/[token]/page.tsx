import React from 'react';
import SecureUploadClient from './SecureUploadClient';
import { setupServerLocale } from '@/app/i18n/server-utils';
import { notFound } from 'next/navigation';

interface SecureUploadPageProps {
  params: {
    locale: string;
    token: string;
  };
}

// Basic metadata - can be enhanced
export const metadata = {
  title: 'Secure Document Upload | TrustyFinance',
  description: 'Upload requested financial documents securely.',
  robots: 'noindex, nofollow', // Prevent indexing of upload pages
};

export default async function SecureUploadPage({ params }: SecureUploadPageProps) {
  const { locale, token } = params;

  // Validate token format briefly (more thorough validation in client/API)
  if (!token || typeof token !== 'string' || token.length !== 64) { // Basic hex check
    console.warn('[SecureUploadPage] Invalid token format in URL');
    notFound(); // Or redirect to an error page
  }

  // Set locale for server context (layout, etc.)
  await setupServerLocale(locale);

  return (
    <div className="min-h-screen bg-gray-very-dark text-gray-light flex items-center justify-center p-4">
      <SecureUploadClient token={token} />
    </div>
  );
} 