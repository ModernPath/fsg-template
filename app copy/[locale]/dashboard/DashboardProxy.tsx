'use client';

import { Suspense, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';

// Use Next.js dynamic import with no SSR to ensure component is only loaded on client
const DynamicDashboardPage = dynamic(
  () => import('./DashboardPageOptimized').then((mod) => {
    // Safely handle both ESM and CommonJS module formats
    const Component = typeof mod === 'function' ? mod : mod.default;
    if (typeof Component !== 'function') {
      throw new Error(`DashboardPage is not a valid component function: ${typeof Component}`);
    }
    return Component;
  }),
  { 
    ssr: false,
    loading: () => <DashboardLoading />
  }
);

// Loading component for dynamic import
function DashboardLoading() {
  // You can use a more specific loading spinner/component if you have one for the dashboard
  return (
    <div className="fixed inset-0 bg-black flex justify-center items-center z-[200]">
      {/* Consider using your existing Spinner component if available and styled */}
      <div className="w-16 h-16 border-4 border-gold-primary border-t-transparent rounded-full animate-spin"></div>
      {/* <p className="mt-4 text-gold-secondary">Loading dashboard...</p> */}
    </div>
  );
}

// Error fallback component
function ErrorFallback({ error }: { error: Error }) {
  const t = useTranslations('Dashboard'); // Assuming you have Dashboard translations
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-gold-secondary">
      <div className="bg-gray-very-dark p-8 rounded-lg shadow-lg border border-red-500/50 max-w-md w-full">
        <h2 className="text-2xl font-bold text-red-500 mb-4">
          {t('error.title', { default: 'Something went wrong' })}
        </h2>
        <p className="mb-4">
          {t('error.description', { default: 'We encountered an error loading the dashboard.' })}
        </p>
        <pre className="bg-black p-4 rounded text-sm overflow-auto mb-4 max-h-40 border border-gray-dark">
          {error.message}
        </pre>
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-gold-primary text-black py-2 px-4 rounded hover:bg-gold-highlight transition-colors focus-visible:ring-gold-primary"
        >
          {t('error.tryAgain', { default: 'Try Again' })}
        </button>
      </div>
    </div>
  );
}

export default function DashboardProxy() {
  const [error, setError] = useState<Error | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    console.log('PROXY: DashboardProxy component mounted on client side');
  }, []);
  
  if (!isClient) {
    // You might want to show a more specific Dashboard loading state or the generic one
    return <DashboardLoading />;
  }
  
  if (error) {
    return <ErrorFallback error={error} />;
  }
  
  return (
    <>
      {/* You can add debug banners or other proxy-level elements here if needed */}
      <ErrorBoundary onError={(err) => setError(err)}>
        <Suspense fallback={<DashboardLoading />}>
          <DynamicDashboardPage />
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
  
  // This effect hook will be used to reset the error state when the component unmounts
  // or when the children it's wrapping change in a way that might resolve the error.
  useEffect(() => {
    if (hasError) {
      // When children change, we can try to reset the error state,
      // hoping the new children don't throw an error.
      // This is a simple reset; more complex logic might be needed depending on the app.
      setHasError(false);
    }
  // Watching children directly in deps array is tricky.
  // For simplicity, this effect doesn't have children in deps,
  // meaning error reset mainly happens on unmount/remount of ErrorBoundary
  // or if a parent component causes ErrorBoundary to re-render with new children.
  }, [children, hasError]); // Added hasError to dependencies

  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('PROXY: Error caught in Dashboard ErrorBoundary:', error, errorInfo);
    setHasError(true);
    onError(error); // Propagate the error to the parent proxy component
  };
  
  if (hasError) {
    // Don't render children if an error has occurred.
    // The parent DashboardProxy will render the ErrorFallback.
    return null; 
  }
  
  // React's <ErrorBoundary> pattern typically uses componentDidCatch, 
  // but with functional components and hooks, we manage error state manually.
  // The actual "catching" happens implicitly by rendering children and handling exceptions.
  // For robust client-side error catching for rendering,
  // a class component ErrorBoundary or a library might be used.
  // This simplified version relies on direct try-catch or letting errors bubble up.
  try {
    return <>{children}</>;
  } catch (error) {
    handleError(error instanceof Error ? error : new Error(String(error || 'Unknown error')), { componentStack: '' });
    return null; // Render nothing from here, parent shows fallback
  }
} 