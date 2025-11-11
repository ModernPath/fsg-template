'use client'

import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useParams, useSearchParams } from 'next/navigation'
import { Spinner } from '@/components/ui/spinner'

// Sign-in form loading skeleton that matches the split layout
const SignInFormSkeleton = () => (
  <div className="flex min-h-screen bg-black">
    {/* Left side - Form skeleton */}
    <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 lg:p-16">
      <div className="max-w-xl w-full">
        <div className="h-14 bg-gray-dark animate-pulse rounded-lg mb-4 w-3/4"></div>
        <div className="h-6 bg-gray-dark animate-pulse rounded-lg mb-12 w-full"></div>
        
        <div className="space-y-10">
          <div>
            <div className="h-6 bg-gray-dark animate-pulse rounded-lg mb-3 w-1/3"></div>
            <div className="h-14 bg-gray-dark animate-pulse rounded-lg w-full"></div>
          </div>
          
          <div>
            <div className="h-6 bg-gray-dark animate-pulse rounded-lg mb-3 w-1/3"></div>
            <div className="h-14 bg-gray-dark animate-pulse rounded-lg w-full"></div>
          </div>
          
          <div className="h-10 bg-gray-dark animate-pulse rounded-lg w-full mt-6"></div>
          <div className="h-10 bg-gray-dark animate-pulse rounded-lg w-2/3 mx-auto"></div>
        </div>
      </div>
    </div>
    
    {/* Right side - Image placeholder */}
    <div className="hidden md:block md:w-1/2 relative bg-black animate-pulse">
      <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-black/70 to-black/50 flex flex-col justify-center items-center">
        <div className="h-12 bg-gray-dark/50 animate-pulse rounded-lg w-3/4 mb-8"></div>
        <div className="space-y-6 w-3/4">
          <div className="flex items-start">
            <div className="h-8 w-8 bg-green-400/50 rounded-full mr-4"></div>
            <div className="h-6 bg-gray-light/20 animate-pulse rounded-lg w-full"></div>
          </div>
          <div className="flex items-start">
            <div className="h-8 w-8 bg-green-400/50 rounded-full mr-4"></div>
            <div className="h-6 bg-gray-light/20 animate-pulse rounded-lg w-full"></div>
          </div>
          <div className="flex items-start">
            <div className="h-8 w-8 bg-green-400/50 rounded-full mr-4"></div>
            <div className="h-6 bg-gray-light/20 animate-pulse rounded-lg w-full"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
)

// Dynamically import SignInForm with no SSR
const SignInForm = dynamic(() => import('@/components/auth/SignInForm'), {
  ssr: false,
  loading: () => <SignInFormSkeleton />
})

export default function SignInPage() {
  const t = useTranslations('Auth')
  const { session, loading } = useAuth()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const params = useParams()
  const searchParams = useSearchParams()
  const locale = params.locale as string
  const nextUrl = searchParams.get('next') || `/${locale}/dashboard`

  useEffect(() => {
    // Add debug logging
    console.log('Sign-in page state:', {
      hasSession: !!session,
      loading,
      isRedirecting,
      nextUrl
    })

    // Only redirect if we have a session and loading is complete
    if (session?.user && !loading) {
      setIsRedirecting(true)
      // Small delay to ensure state is settled
      const redirectTimer = setTimeout(() => {
        window.location.href = nextUrl
      }, 100)
      return () => clearTimeout(redirectTimer)
    }
  }, [session, loading, nextUrl, isRedirecting])

  // Show loading state when redirecting or initial auth loading
  if (loading || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center">
          <Spinner className="h-10 w-10 text-gold-primary" />
          <p className="ml-3 text-xl text-gold-secondary">
            {isRedirecting ? t('redirecting') : t('loading')}
          </p>
        </div>
      </div>
    )
  }

  // If we have a session but not redirecting yet, don't render anything
  if (session?.user) {
    return null
  }

  return <SignInForm />
}
