'use client'

import { useAdminAuth } from '@/app/hooks/useAdminAuth'
import { redirect } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Toaster } from '@/components/ui/toaster'
import { HomeIcon, BuildingOfficeIcon, UsersIcon, BanknotesIcon, DocumentTextIcon } from '@heroicons/react/24/outline'

interface AdminLayoutClientProps {
  children: React.ReactNode
  params: { locale: string }
}

export default function AdminLayoutClient({
  children,
  params: { locale }
}: AdminLayoutClientProps) {
  const { loading, isAuthorized } = useAdminAuth({ 
    redirectOnUnauthorized: true,
    allowInDevelopment: false 
  })

  // Handle loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LoadingSpinner />
      </div>
    )
  }

  // Don't render anything while redirecting
  if (!isAuthorized) {
    return null
  }

  // Render admin layout with proper sidebar spacing and updated theme
  return (
    <div className="min-h-screen bg-background text-white">
      {/* Navigation.tsx already contains AdminSidebar which is rendered globally */}
      <main className="ml-64 pt-16 transition-all duration-300 p-6 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <Toaster />
    </div>
  )
} 