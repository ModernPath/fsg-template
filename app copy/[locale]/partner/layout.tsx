'use client'

import { useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter, useParams, usePathname } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { PartnerDataPrefetcher } from '@/components/partner/PartnerDataPrefetcher'
import { PartnerBackgroundSync } from '@/components/partner/PartnerBackgroundSync'

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { session, loading, isPartner, partnerId } = useAuth()
  const router = useRouter()
  const params = useParams()
  const pathname = usePathname()
  const locale = params.locale as string

  // Extract current page from pathname for prefetching
  const currentPage = pathname?.split('/').pop() || 'dashboard'

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!loading && !session) {
      const currentPath = window.location.pathname + window.location.search
      router.replace(`/${locale}/auth/sign-in?next=${encodeURIComponent(currentPath)}`)
    }
  }, [session, loading, locale, router])

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Ladataan...</div>
      </div>
    )
  }

  // Redirect if not authenticated
  if (!session) {
    return null
  }

  // Check if user is a partner
  if (!isPartner || !partnerId) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Sinulla ei ole oikeuksia nähdä tätä sivua. Tämä osio on tarkoitettu vain yhteistyökumppaneille.
            {!isPartner && (
              <div className="mt-2">
                <a href={`/${locale}/partner-signup`} className="text-blue-600 hover:underline">
                  Rekisteröidy yhteistyökumppaniksi täällä
                </a>
              </div>
            )}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <>
      {/* Intelligent data prefetching */}
      <PartnerDataPrefetcher 
        partnerId={partnerId} 
        currentPage={currentPage}
      />
      
      {/* Background data synchronization */}
      <PartnerBackgroundSync 
        partnerId={partnerId}
        enabled={true}
        interval={5 * 60 * 1000} // 5 minutes
      />
      
      {children}
    </>
  )
} 