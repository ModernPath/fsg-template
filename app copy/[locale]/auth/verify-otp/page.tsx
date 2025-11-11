'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Spinner } from '@/components/ui/spinner'

export default function VerifyOTPPage() {
  const t = useTranslations('Auth')
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams?.get('email')
  const locale = params.locale as string
  const [otpCode, setOtpCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const nextUrl = searchParams?.get('next') || `/${locale}/dashboard`
  const supabase = createClient()

  // Handle OTP verification
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setError(t('emailRequired', { default: 'Email is required' }))
      return
    }
    
    if (!otpCode || otpCode.length < 6) {
      setError(t('invalidOTP', { default: 'Please enter a valid verification code' }))
      return
    }
    
    try {
      setIsLoading(true)
      setError(null)
      
      // Verify the OTP code
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'magiclink'
      })
      
      if (verifyError) {
        console.error('OTP verification error:', verifyError)
        setError(verifyError.message || t('invalidOTP', { default: 'Invalid verification code' }))
        return
      }

      // Redirect to the intended destination
      router.push(nextUrl)
    } catch (err) {
      console.error('Error verifying OTP:', err)
      setError(t('verificationError', { default: 'An error occurred during verification' }))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#111111] py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-gold-secondary/30">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-extrabold text-gold-primary">
              {t('verifyOTP', { default: 'Enter Verification Code' })}
            </h2>
            
            {email && (
              <p className="mt-2 text-gold-secondary">
                {t('forEmail', { default: 'For email' })}: <span className="font-medium text-gold-primary">{email}</span>
              </p>
            )}
          </div>
          
          <form onSubmit={handleVerify} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-900/30 text-sm text-yellow-300 rounded-lg border border-red-500/50">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="otp" className="block text-base font-medium text-gold-secondary mb-2">
                {t('otpCode', { default: 'Verification Code' })}
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="appearance-none block w-full px-4 py-3 border-2 border-gold-secondary/50 rounded-xl shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-primary focus:border-gold-primary bg-black text-gold-primary text-center text-xl tracking-widest"
                placeholder="000000"
              />
              <p className="mt-2 text-sm text-gray-400">
                {t('otpInstructions', { default: 'Enter the 6-digit code from your email' })}
              </p>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-base font-medium text-black bg-gold-primary hover:bg-gold-highlight focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-primary/50 focus:ring-offset-black disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Spinner className="h-5 w-5 mr-2 text-black" />
                    {t('verifying', { default: 'Verifying...' })}
                  </>
                ) : (
                  t('verifyAndSignIn', { default: 'Verify & Sign In' })
                )}
              </button>
            </div>
            
            <div className="text-center mt-4">
              <Link
                href={`/${locale}/auth/sign-in`}
                className="text-base font-medium text-gold-secondary hover:text-gold-highlight"
              >
                {t('backToSignIn')}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 