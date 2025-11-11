// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import OnboardingProxy from './OnboardingProxy';

// Generate static params for all locales
export function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'fi' },
    { locale: 'sv' },
  ];
}

// Simple server component that just renders the client proxy
export default async function OnboardingPage({ params }: { params: Promise<{ locale: string }> }) {
  // Await params to ensure Next.js 15 compatibility
  await params;
  
  // Simply render the client component - no server-side logic
  return <OnboardingProxy />;
} 