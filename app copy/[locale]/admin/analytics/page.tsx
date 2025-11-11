'use client'

import dynamic from 'next/dynamic'

const AnalyticsDashboard = dynamic(
  () => import('./AnalyticsDashboard'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Analytics Dashboard...</p>
        </div>
      </div>
    )
  }
)

export default function AnalyticsPage() {
  return <AnalyticsDashboard />
}
