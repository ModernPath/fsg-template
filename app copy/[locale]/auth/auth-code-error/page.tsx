'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { usePathname, useSearchParams } from 'next/navigation'

export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export default function AuthCodeErrorPage() {
  const t = useTranslations('Auth')
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const locale = pathname.split('/')[1]
  const [errorType, setErrorType] = useState<string>('unknown')

  useEffect(() => {
    // Check URL hash for error parameters (Supabase redirects with hash params)
    if (typeof window !== 'undefined') {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const errorCode = hashParams.get('error_code') || searchParams.get('error_code')
      const error = hashParams.get('error') || searchParams.get('error')
      
      if (errorCode === 'otp_expired') {
        setErrorType('expired')
      } else if (errorCode === '401') {
        setErrorType('unauthorized')
      } else if (error === 'verification_failed') {
        setErrorType('verification_failed')
      } else if (error === 'missing_parameters') {
        setErrorType('missing_parameters')
      } else if (errorCode) {
        setErrorType(errorCode)
      } else if (error) {
        setErrorType(error)
      }
      
      // Log for debugging
      console.log('Auth error parameters:', {
        hash: window.location.hash,
        errorCode,
        error,
        errorDescription: hashParams.get('error_description') || searchParams.get('error_description')
      })
    }
  }, [searchParams])

  // Get the appropriate error message based on the error type
  const getErrorMessage = () => {
    switch (errorType) {
      case 'expired':
      case 'otp_expired':
        return t('authError.otpExpired')
      case 'invalid_grant':
      case 'invalid_request':
        return t('authError.invalidLink')
      case 'unauthorized':
        return t('authError.unauthorized')
      case 'verification_failed':
        return t('authError.verificationFailed')
      case 'missing_parameters':
        return t('authError.missingParameters', { default: 'The authentication link is missing required parameters.' })
      default:
        return t('authError.description')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {t('authError.title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {getErrorMessage()}
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <Link
              href={`/${locale}/auth/sign-in`}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-medium"
            >
              {t('authError.backToSignIn')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
