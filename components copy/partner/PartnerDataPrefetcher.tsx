'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePrefetchPartnerData } from '@/hooks/usePartnerQueries'
import { useAuth } from '@/components/auth/AuthProvider'

interface PartnerDataPrefetcherProps {
  partnerId: string | null
  currentPage?: string
}

/**
 * Intelligent prefetching component for partner data
 * Prefetches likely next pages based on user behavior patterns
 */
export function PartnerDataPrefetcher({ partnerId, currentPage }: PartnerDataPrefetcherProps) {
  const { prefetchPartner, prefetchCommissions } = usePrefetchPartnerData()
  const router = useRouter()

  useEffect(() => {
    if (!partnerId) return

    // Define prefetching strategies based on current page
    const prefetchStrategies = {
      dashboard: () => {
        // From dashboard, users often go to commissions or customers
        prefetchCommissions(partnerId)
        // Prefetch partner details if not already cached
        prefetchPartner(partnerId)
      },
      
      commissions: () => {
        // From commissions, users might check customers or go back to dashboard
        prefetchPartner(partnerId)
      },
      
      customers: () => {
        // From customers, users might check commissions
        prefetchCommissions(partnerId)
      },
      
      reports: () => {
        // From reports, users might want to see detailed commissions
        prefetchCommissions(partnerId)
      }
    }

    // Execute prefetching strategy based on current page
    const strategy = prefetchStrategies[currentPage as keyof typeof prefetchStrategies]
    if (strategy) {
      // Delay prefetching to avoid interfering with current page load
      const timeoutId = setTimeout(() => {
        strategy()
      }, 1000) // 1 second delay

      return () => clearTimeout(timeoutId)
    }
  }, [partnerId, currentPage, prefetchPartner, prefetchCommissions])

  // Prefetch on hover for navigation links
  useEffect(() => {
    const handleLinkHover = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const link = target.closest('a[href*="/partner/"]')
      
      if (link && partnerId) {
        const href = link.getAttribute('href')
        
        if (href?.includes('/partner/commissions')) {
          prefetchCommissions(partnerId)
        } else if (href?.includes('/partner/customers')) {
          // Could add customer prefetching here when implemented
        }
      }
    }

    // Add hover listeners to navigation elements
    document.addEventListener('mouseover', handleLinkHover)
    
    return () => {
      document.removeEventListener('mouseover', handleLinkHover)
    }
  }, [partnerId, prefetchCommissions])

  // This component doesn't render anything
  return null
}

/**
 * Hook to use prefetcher in partner pages
 */
export function usePartnerPrefetcher(currentPage: string) {
  const { partnerId } = useAuth()
  
  return {
    PrefetcherComponent: () => (
      <PartnerDataPrefetcher 
        partnerId={partnerId} 
        currentPage={currentPage} 
      />
    )
  }
}
