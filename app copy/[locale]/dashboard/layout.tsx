'use client'

import React, { useState, createContext, useContext, useEffect } from 'react'
import { usePathname, useRouter, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/components/auth/AuthProvider'
import DashboardSidebar from './components/DashboardSidebar'
import { DASHBOARD_STEPS } from './lib/routes'
import { createClient } from '@/utils/supabase/client'

// Dashboard context type
type DashboardContextType = {
  activeStep: string;
  completedSteps: string[];
  setCompletedSteps: (steps: string[]) => void;
  analysisCompleted: boolean;
};

// Create dashboard context
const DashboardContext = createContext<DashboardContextType>({
  activeStep: DASHBOARD_STEPS.COMPANY_PROFILE,
  completedSteps: [],
  setCompletedSteps: () => {},
  analysisCompleted: false,
});

// Hook to use dashboard context
export const useDashboard = () => useContext(DashboardContext);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const { session, loading: authLoading } = useAuth()
  const [activeStep, setActiveStep] = useState<string>(DASHBOARD_STEPS.COMPANY_PROFILE)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [isClient, setIsClient] = useState(false)

  // Set isClient to true when component mounts to avoid hydration issues
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Authentication check and redirect
  useEffect(() => {
    if (isClient && !authLoading && !session) {
      // Ensure params.locale is a string before using it
      const locale = typeof params.locale === 'string' ? params.locale : 'en'; // Default to 'en' or your app's default
      const redirectTo = `/${locale}/auth/sign-in?next=${encodeURIComponent(pathname)}`;
      router.push(redirectTo);
    }
  }, [isClient, authLoading, session, router, pathname, params.locale]);

  // Determine the active step based on the current pathname
  useEffect(() => {
    if (!pathname || !isClient) return

    // Extract the path after /[locale]/dashboard
    const dashboardPath = pathname.split('/dashboard')[1] || '/'

    if (dashboardPath === '/company-profile') {
      setActiveStep(DASHBOARD_STEPS.COMPANY_PROFILE)
    } else if (dashboardPath.startsWith('/documents')) {
      setActiveStep(DASHBOARD_STEPS.DOCUMENTS)
    } else if (dashboardPath === '/') {
      setActiveStep(DASHBOARD_STEPS.FINANCIAL_DASHBOARD)
    } else if (dashboardPath === '/recommendations') {
      setActiveStep(DASHBOARD_STEPS.RECOMMENDATIONS)
    }
  }, [pathname, isClient])

  // Check if all steps are completed
  const analysisCompleted = completedSteps.length >= 4

  // Dashboard context value
  const dashboardContextValue = {
    activeStep,
    completedSteps,
    setCompletedSteps,
    analysisCompleted,
  }

  // After session, loading check
  // Completely removed onboarding check to allow unconditional dashboard access
  useEffect(() => {
    // No redirects - user can stay on the dashboard page
  }, []);

  if (authLoading || !isClient || (!session && !authLoading)) {
    return (
      <div className="flex h-screen animate-pulse">
        <div className="hidden md:flex md:w-64 md:flex-col">
          <div className="flex flex-col flex-grow bg-gray-200 dark:bg-gray-800"></div>
        </div>
        <div className="flex flex-col flex-1">
          <div className="h-16 bg-gray-100 dark:bg-gray-700"></div>
          <main className="flex-1 p-6">
            <div className="h-full w-full bg-gray-100 dark:bg-gray-700 rounded-lg"></div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <DashboardContext.Provider value={dashboardContextValue}>
      <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-black">
        
        {/* Comment out the Sidebar rendering */}
        {/* 
        <DashboardSidebar 
          activeStep={activeStep} 
          isAdmin={session?.user?.app_metadata?.role === 'admin'} 
        /> 
        */}

        {/* Main content area should now take full width */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Top navigation bar (assuming it exists or is handled elsewhere) */}
          {/* <DashboardHeader /> */}

          {/* Page content */}
          {/* Apply max-width and center the main content */}
          <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            {children}
          </main>
        </div>
      </div>
    </DashboardContext.Provider>
  );
} 