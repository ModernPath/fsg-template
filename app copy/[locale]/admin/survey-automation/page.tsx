'use client'

import dynamic from 'next/dynamic'

const SurveyAutomationDashboard = dynamic(
  () => import('@/components/admin/survey-automation/SurveyAutomationDashboard').then(mod => mod.SurveyAutomationDashboard),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Survey Automation Dashboard...</p>
        </div>
      </div>
    )
  }
)

export default function SurveyAutomationPage() {
  return <SurveyAutomationDashboard />
}
