'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface UseAdminAuthOptions {
  redirectOnUnauthorized?: boolean
  allowInDevelopment?: boolean
}

export function useAdminAuth(options: UseAdminAuthOptions = {}) {
  const {
    redirectOnUnauthorized = true,
    allowInDevelopment = true
  } = options

  const { session, isAdmin, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  const isAuthenticated = !!session?.user
  const hasAdminAccess = isAdmin
  const isAuthorized = isAuthenticated && hasAdminAccess
  const isDevelopment = process.env.NODE_ENV === 'development'

  useEffect(() => {
    if (!loading && redirectOnUnauthorized) {
      if (!isAuthenticated) {
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
        router.replace(`/${locale}/auth/sign-in?next=${encodeURIComponent(currentPath)}`)
      } else if (!hasAdminAccess) {
        router.replace(`/${locale}/auth/unauthorized`)
      }
    }
  }, [loading, isAuthenticated, hasAdminAccess, redirectOnUnauthorized, router, locale])

  return {
    isAuthenticated,
    isAdmin,
    hasAdminAccess,
    isAuthorized,
    loading,
    isDevelopment,
    session
  }
}
