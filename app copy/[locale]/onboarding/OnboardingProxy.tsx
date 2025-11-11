'use client';

import { Suspense, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';

// Use Next.js dynamic import with no SSR to ensure component is only loaded on client
const DynamicOnboardingFlow = dynamic(
  () => import('@/components/auth/OnboardingFlow').then((mod) => {
    // Safely handle both ESM and CommonJS module formats
    const Component = typeof mod === 'function' ? mod : mod.default;
    if (typeof Component !== 'function') {
      throw new Error(`OnboardingFlow is not a valid component function: ${typeof Component}`);
    }
    return Component;
  }),
  { 
    ssr: false,
    loading: () => <OnboardingLoading />
  }
);

// Loading component for dynamic import
function OnboardingLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-600">Loading onboarding component...</p>
    </div>
  );
}

// Error fallback component
function ErrorFallback({ error }: { error: Error }) {
  const t = useTranslations('Onboarding');
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h2 className="text-2xl font-bold text-red-600 mb-4">
          {t('error.title', { default: 'Something went wrong' })}
        </h2>
        <p className="text-gray-700 mb-4">
          {t('error.description', { default: 'We encountered an error loading this page.' })}
        </p>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto mb-4 max-h-40">
          {error.message}
        </pre>
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
        >
          {t('error.tryAgain', { default: 'Try Again' })}
        </button>
      </div>
    </div>
  );
}

export default function OnboardingProxy() {
  const [error, setError] = useState<Error | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    
    // Log debug info
    console.log('PROXY: Proxy component mounted on client side');
  }, []);
  
  if (!isClient) {
    return <OnboardingLoading />;
  }
  
  if (error) {
    return <ErrorFallback error={error} />;
  }
  
  return (
    <>
      {/* Debug banner */}
      
      {/* Wrap in error boundary to catch any rendering errors */}
      <ErrorBoundary onError={(err) => setError(err)}>
        <Suspense fallback={<OnboardingLoading />}>
          <DynamicOnboardingFlow />
        </Suspense>
      </ErrorBoundary>
    </>
  );
}

// Simple error boundary component
function ErrorBoundary({ 
  children, 
  onError 
}: { 
  children: React.ReactNode, 
  onError: (error: Error) => void
}) {
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    return () => {
      // Reset error state when component unmounts
      setHasError(false);
    };
  }, []);
  
  if (hasError) {
    return null; // Parent will handle rendering the fallback
  }
  
  const handleError = (error: Error) => {
    console.error('PROXY: Error caught in error boundary:', error);
    setHasError(true);
    onError(error);
  };
  
  try {
    return (
      <>{children}</>
    );
  } catch (error) {
    handleError(error instanceof Error ? error : new Error('Unknown error'));
    return null;
  }
} 