// Server component - renders client component FinanceApplicationFlow
import FinanceApplicationFlow from '@/components/auth/FinanceApplicationFlow';
import { getTranslations } from 'next-intl/server';

// Force dynamic rendering to ensure route is always available
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs'; // Explicitly set runtime

// Generate metadata for the page
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale;
  const t = await getTranslations({ locale, namespace: 'Onboarding' });

  return {
    title: t('application.pageTitle', { default: 'Funding Application - Trusty Finance' }),
    description: t('application.pageDescription', { default: 'Apply for business funding with our streamlined application process.' }),
  };
}

export default async function ApplyPage({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale;
  
  console.log('SERVER: ApplyPage executing, locale:', locale);
  
  try {
    return <FinanceApplicationFlow />;
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    console.error('SERVER: Error in apply page:', errorObj);
    
    return (
      <div className="p-8 bg-red-50 min-h-screen">
        <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Server Error</h1>
          <p>There was an error loading the application page:</p>
          <pre className="bg-gray-100 p-3 rounded mt-2 text-sm overflow-auto">
            {errorObj.message}
          </pre>
          <div className="mt-6">
            <a 
              href={`/${locale}/finance-application`} 
              className="block w-full text-center bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
            >
              Try Alternative Route
            </a>
          </div>
        </div>
      </div>
    );
  }
}
