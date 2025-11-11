'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time: Data is considered fresh for 5 minutes
        staleTime: 5 * 60 * 1000,
        // Cache time: Data stays in cache for 10 minutes after becoming unused
        gcTime: 10 * 60 * 1000,
        // Retry failed requests 3 times
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors (client errors)
          if (error?.status >= 400 && error?.status < 500) {
            return false
          }
          return failureCount < 3
        },
        // Retry delay increases exponentially
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Refetch on window focus for critical data
        refetchOnWindowFocus: (query) => {
          // Refetch user profile and auth-related data on focus
          return query.queryKey[0] === 'profile' || 
                 query.queryKey[0] === 'adminUsers' ||
                 query.queryKey[0] === 'partner'
        },
        // Refetch on reconnect
        refetchOnReconnect: true,
        // Network mode: online first, then cache
        networkMode: 'online',
      },
      mutations: {
        // Retry failed mutations once, but not on client errors
        retry: (failureCount, error: any) => {
          if (error?.status >= 400 && error?.status < 500) {
            return false
          }
          return failureCount < 1
        },
        // Network mode for mutations
        networkMode: 'online',
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
