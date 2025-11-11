import React from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Check, ChevronRight } from 'lucide-react'
import { useDashboard } from '../layout'
import { DASHBOARD_ROUTES, getLocalizedRoute } from '../lib/routes'
import { usePathname } from 'next/navigation'

interface DashboardSidebarProps {
  activeStep: string;
  isAdmin?: boolean;
}

export default function DashboardSidebar({ activeStep, isAdmin = false }: DashboardSidebarProps) {
  const t = useTranslations('Dashboard')
  const { completedSteps, analysisCompleted } = useDashboard()
  const pathname = usePathname()
  const locale = pathname.split('/')[1]

  // Get main dashboard steps
  const dashboardSteps = Object.values(DASHBOARD_ROUTES).filter(route => 'requiredSteps' in route)

  return (
    <div className="hidden md:flex md:w-72 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800">
        <div className="px-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('analysisWizard')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('completeEachStep')}
          </p>
        </div>
        
        {/* Navigation steps */}
        <nav className="mt-5 flex-1 px-4 space-y-1">
          {dashboardSteps.map((step, index) => {
            const isActive = activeStep === step.id
            const isCompleted = completedSteps.includes(step.id)
            const StepIcon = step.icon
            
            return (
              <div key={step.id} className="relative">
                {/* Connection line between steps */}
                {index > 0 && (
                  <div 
                    className={`absolute left-6 -top-5 w-0.5 h-5 
                      ${isCompleted || completedSteps.includes(dashboardSteps[index-1].id)
                        ? 'bg-indigo-500 dark:bg-indigo-400' 
                        : 'bg-gray-200 dark:bg-gray-700'}`}
                  ></div>
                )}
              
                <Link
                  href={getLocalizedRoute(locale, step.path)}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-md 
                    ${isActive 
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750'}`}
                >
                  <div 
                    className={
                      isCompleted ? 'step-number-amber' :
                      isActive ? 'step-number-amber-inactive' :
                      'step-number-amber-pending'
                      + ' mr-3 flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center'
                    }
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5 text-black" />
                    ) : (
                      <StepIcon className="h-5 w-5" />
                    )}
                  </div>
                  <span className="flex-1">{t(step.label)}</span>
                  <ChevronRight className="h-4 w-4 opacity-70" />
                </Link>
              </div>
            )
          })}
        </nav>
        
        {/* Completion status */}
        <div className="px-4 py-4 mt-auto">
          <div 
            className={`p-3 rounded-lg border 
              ${analysisCompleted 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200' 
                : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'}`}
          >
            <h3 className="text-sm font-medium mb-1">
              {analysisCompleted 
                ? t('analysisComplete') 
                : t('analysisInProgress')}
            </h3>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${analysisCompleted 
                  ? 'bg-green-600 dark:bg-green-500' 
                  : 'bg-amber-500 dark:bg-amber-400'}`} 
                style={{ width: `${Math.min((completedSteps.length / dashboardSteps.length) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs mt-1">
              {analysisCompleted 
                ? t('viewFinancialDashboard') 
                : t('stepsRemaining', { count: dashboardSteps.length - completedSteps.length })}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 