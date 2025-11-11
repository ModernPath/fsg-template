'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { partnerQueryKeys } from '@/hooks/usePartnerQueries'
import { useAuth } from '@/components/auth/AuthProvider'

interface PartnerBackgroundSyncProps {
  partnerId: string | null
  enabled?: boolean
  interval?: number // in milliseconds
}

/**
 * Background sync component for partner data
 * Automatically refreshes critical data at intervals
 */
export function PartnerBackgroundSync({ 
  partnerId, 
  enabled = true, 
  interval = 5 * 60 * 1000 // 5 minutes default
}: PartnerBackgroundSyncProps) {
  const queryClient = useQueryClient()
  const intervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!enabled || !partnerId) return

    const syncData = () => {
      // Invalidate and refetch critical partner data
      queryClient.invalidateQueries({
        queryKey: partnerQueryKeys.commissions(partnerId),
        refetchType: 'active' // Only refetch if component is mounted
      })

      // Invalidate partner stats (less frequently)
      queryClient.invalidateQueries({
        queryKey: partnerQueryKeys.detail(partnerId),
        refetchType: 'active'
      })

      console.log('🔄 [Background Sync] Refreshed partner data for:', partnerId)
    }

    // Set up interval for background sync
    intervalRef.current = setInterval(syncData, interval)

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, partnerId, interval, queryClient])

  // Sync on window focus (user returns to tab)
  useEffect(() => {
    if (!enabled || !partnerId) return

    const handleFocus = () => {
      // Check if data is stale (older than 2 minutes)
      const commissionQuery = queryClient.getQueryState(partnerQueryKeys.commissions(partnerId))
      const partnerQuery = queryClient.getQueryState(partnerQueryKeys.detail(partnerId))
      
      const now = Date.now()
      const staleTime = 2 * 60 * 1000 // 2 minutes
      
      if (commissionQuery && (now - commissionQuery.dataUpdatedAt > staleTime)) {
        queryClient.invalidateQueries({
          queryKey: partnerQueryKeys.commissions(partnerId)
        })
      }
      
      if (partnerQuery && (now - partnerQuery.dataUpdatedAt > staleTime)) {
        queryClient.invalidateQueries({
          queryKey: partnerQueryKeys.detail(partnerId)
        })
      }

      console.log('👁️ [Focus Sync] Checked data freshness for:', partnerId)
    }

    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [enabled, partnerId, queryClient])

  // Sync on network reconnection
  useEffect(() => {
    if (!enabled || !partnerId) return

    const handleOnline = () => {
      // Refetch all partner data when coming back online
      queryClient.invalidateQueries({
        queryKey: partnerQueryKeys.all
      })

      console.log('🌐 [Network Sync] Refreshed all data after reconnection')
    }

    window.addEventListener('online', handleOnline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
    }
  }, [enabled, partnerId, queryClient])

  return null
}

/**
 * Hook to control background sync
 */
export function usePartnerBackgroundSync(options?: {
  enabled?: boolean
  interval?: number
}) {
  const { partnerId } = useAuth()
  
  return {
    BackgroundSyncComponent: () => (
      <PartnerBackgroundSync 
        partnerId={partnerId}
        enabled={options?.enabled}
        interval={options?.interval}
      />
    )
  }
}
