'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js'

// Enable this for detailed debugging of authentication issues
const DEBUG_AUTH = false;

const logDebug = (...args: any[]) => {
  if (DEBUG_AUTH) {
    console.log('[Auth]', ...args);
  }
};

type AuthContextType = {
  session: Session | null
  loading: boolean
  isAuthenticated: boolean
  user: User | null
  isAdmin: boolean
  isPartner: boolean
  partnerId: string | null
  error: string | null
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  isAuthenticated: false,
  user: null,
  isAdmin: false,
  isPartner: false,
  partnerId: null,
  error: null
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Add debounce utility
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const SESSION_STORAGE_KEY = 'sb-session-state'

// Add error types
const enum AuthErrorType {
  TIMEOUT = 'TIMEOUT',
  NETWORK = 'NETWORK',
  UNAUTHORIZED = 'UNAUTHORIZED',
  UNKNOWN = 'UNKNOWN'
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  
  // Clear any existing session storage on startup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(SESSION_STORAGE_KEY)
    }
  }, [])
  
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isPartner, setIsPartner] = useState(false)
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])
  const isMountedRef = useRef(true)
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)

  // Removed request caching for simplicity

  // Improved error handling
  const handleAuthError = useCallback((error: any): string => {
    if (error?.message?.includes('timeout')) {
      return AuthErrorType.TIMEOUT
    }
    if (error?.message?.includes('network')) {
      return AuthErrorType.NETWORK  
    }
    if (error?.status === 401) {
      return AuthErrorType.UNAUTHORIZED
    }
    return AuthErrorType.UNKNOWN
  }, [])

  // Store session in storage - DISABLED for debugging
  // useEffect(() => {
  //   if (typeof window !== 'undefined' && session) {
  //     sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
  //       data: session,
  //       timestamp: Date.now()
  //     }))
  //   }
  // }, [session])

  // Removed loading timeout - let the functions handle their own timeouts

  const fetchAdminStatus = useCallback(async (userId: string) => {
    console.log('[AuthProvider] fetchAdminStatus called for user:', userId)
    
    try {
      // Use a simple API call instead of direct Supabase query to avoid RLS issues
      const response = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      })

      if (!response.ok) {
        console.warn('[AuthProvider] Profile API call failed:', response.status)
        // Use safe defaults
        setIsAdmin(false)
        setIsPartner(false)
        setPartnerId(null)
        setError(null)
        return
      }

      const data = await response.json()
      console.log('[AuthProvider] Profile data received successfully:', data)
      
      setIsAdmin(data?.is_admin ?? false)
      setIsPartner(data?.is_partner ?? false)
      setPartnerId(data?.partner_id || null)
      setError(null)
      
    } catch (error: any) {
      console.warn('[AuthProvider] fetchAdminStatus failed:', error.message)
      // Use safe defaults
      setIsAdmin(false)
      setIsPartner(false)
      setPartnerId(null)
      setError(null)
    } finally {
      // ALWAYS set loading to false
      console.log('[AuthProvider] fetchAdminStatus complete - setting loading to false')
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [supabase])

  const handleAuthStateChange = useCallback(async (session: Session | null, event: AuthChangeEvent = 'INITIAL_SESSION') => {
    // Skip if component is unmounted
    if (!isMountedRef.current) return

    console.log('[AuthProvider] Auth state change:', event, 'Session:', !!session, 'User ID:', session?.user?.id)

    setSession(session)
    
    if (!session?.user) {
      console.log('[AuthProvider] No session or user, setting loading to false')
      setIsAdmin(false)
      setIsPartner(false)
      setPartnerId(null)
      setError(null)
      setLoading(false)
      return
    }

    console.log('[AuthProvider] Found user:', session.user.id, 'fetching admin status...')

    // Always fetch admin status, but don't fail if it doesn't work
    await fetchAdminStatus(session.user.id)
  }, [fetchAdminStatus])

  useEffect(() => {
    let mounted = true
    isMountedRef.current = true

    const initialize = async () => {
      try {
        logDebug('Initializing auth session...');
        
        // Get initial session
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession()
        
        if (!mounted) return

        // Set loading to false *after* getSession completes, regardless of session existence
        // NOTE: Do NOT set loading to false here. HandleAuthStateChange will update the
        // loading state after it has also determined the admin status (if any).
        // Prematurely setting loading to false caused admin pages to redirect before
        // the admin check finished because `isAdmin` was still the default `false`.
        // We now keep loading as `true` until the auth & admin state are fully
        // resolved inside `handleAuthStateChange` & `fetchAdminStatus`.

        if (sessionError) {
          console.error('Error getting initial session:', sessionError)
          setError('Error initializing authentication')
          // Ensure loading state is cleared even on initialization failure
          setLoading(false)
          return
        }

        logDebug('Initial session:', initialSession ? 'Found' : 'Not found', 
          initialSession?.user?.id ? `User ID: ${initialSession.user.id}` : '');
        
        // Handle initial session state *without* necessarily blocking initial load anymore
        await handleAuthStateChange(initialSession, 'INITIAL_SESSION') // Pass event explicitly

        // Subscribe to auth changes
        const { data: { subscription } } = await supabase.auth.onAuthStateChange(
          async (event: AuthChangeEvent, session: Session | null) => {
            logDebug('Auth state changed:', event, session ? `User ID: ${session.user?.id}` : 'No session');
            if (mounted) {
              await handleAuthStateChange(session, event)
            }
          }
        )

        if (mounted) {
          subscriptionRef.current = subscription
        } else {
          subscription.unsubscribe()
        }
      } catch (error) {
        if (mounted) {
          console.error('Unexpected auth error:', error)
          setError('Unexpected authentication error')
          setLoading(false)
        }
      }
    }

    initialize()

    return () => {
      mounted = false
      isMountedRef.current = false
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [supabase.auth, handleAuthStateChange])

  const value = useMemo(() => ({
    session,
    loading,
    isAuthenticated: !!session?.user,
    user: session?.user ?? null,
    isAdmin,
    isPartner,
    partnerId,
    error
  }), [session, loading, isAdmin, isPartner, partnerId, error])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
