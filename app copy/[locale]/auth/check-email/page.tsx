'use client'

import { useTranslations } from 'next-intl'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { EnvelopeIcon, ArrowPathIcon, KeyIcon } from '@heroicons/react/24/outline'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function CheckEmailPage() {
  const t = useTranslations('Auth')
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const locale = params.locale as string
  const email = searchParams?.get('email')
  const next = searchParams?.get('next') || `/${locale}/dashboard`
  const [timeLeft, setTimeLeft] = useState(5 * 60) // 5 minutes in seconds
  const [expired, setExpired] = useState(false)
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState('')

  // Countdown timer for link expiration
  useEffect(() => {
    if (timeLeft <= 0) {
      setExpired(true)
      return
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [timeLeft])

  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  // Handle resend magic link
  const handleResend = () => {
    window.location.href = `/${locale}/auth/sign-in?email=${encodeURIComponent(email || '')}`
  }

  // Handle manual code verification
  const handleManualVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !verificationCode.trim()) return
    
    setIsVerifying(true)
    setError('')
    
    try {
      const supabase = createClient()
      
      // Verify the OTP code
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: verificationCode.trim(),
        type: 'email'
      })
      
      if (error) {
        setError(t('invalidCode', { default: 'Virheellinen koodi. Tarkista koodi ja yritä uudelleen.' }))
        return
      }
      
      if (data.user) {
        // Successful verification - redirect to next page
        router.push(next)
      }
    } catch (err) {
      console.error('Verification error:', err)
      setError(t('verificationFailed', { default: 'Vahvistus epäonnistui. Yritä uudelleen.' }))
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#111111] py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-gold-secondary/30">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gold-primary/10 mb-6">
              <EnvelopeIcon className="h-8 w-8 text-gold-primary" aria-hidden="true" />
            </div>
            
            <h2 className="text-2xl font-extrabold text-gold-primary mb-6">
              {t('checkEmail')}
            </h2>
            
            {email && (
              <p className="mb-4 text-lg font-medium text-gold-secondary">
                {email}
              </p>
            )}
            
            <div className="mb-6 text-base text-gray-400 space-y-3">
              <p>{t('emailSent')}</p>
              <p>{t('checkSpam')}</p>
            </div>
            
            {!expired ? (
              <div className="mb-6 p-3 bg-gold-primary/5 dark:bg-gold-primary/10 rounded-lg border border-gold-primary/20">
                <p className="text-sm text-gold-secondary">
                  {t('linkExpires', { 
                    time: formatTime(timeLeft),
                    default: `Linkki vanhenee ${formatTime(timeLeft)} kuluttua`
                  })}
                </p>
              </div>
            ) : (
              <div className="mb-6 p-3 bg-red-900/20 rounded-lg border border-red-500/50">
                <p className="text-sm text-yellow-300">
                  {t('linkExpired', { 
                    default: 'Linkki on vanhentunut. Pyydä uusi linkki.'
                  })}
                </p>
              </div>
            )}

            {/* Manual code entry section */}
            {showManualEntry ? (
              <div className="mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <div className="flex items-center justify-center mb-4">
                  <KeyIcon className="h-5 w-5 text-gold-primary mr-2" />
                  <h3 className="text-lg font-medium text-gold-primary">
                    {t('enterCodeManually', { default: 'Syötä koodi manuaalisesti' })}
                  </h3>
                </div>
                
                <form onSubmit={handleManualVerification} className="space-y-4">
                  <div>
                    <label htmlFor="verification-code" className="sr-only">
                      {t('verificationCode', { default: 'Vahvistuskoodi' })}
                    </label>
                    <input
                      id="verification-code"
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder={t('enterVerificationCode', { default: 'Syötä 6-numeroinen koodi' })}
                      className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-primary focus:border-transparent"
                      maxLength={6}
                      pattern="[0-9]{6}"
                      required
                    />
                  </div>
                  
                  {error && (
                    <div className="p-3 bg-red-900/20 rounded-lg border border-red-500/50">
                      <p className="text-sm text-red-300">{error}</p>
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={isVerifying || !verificationCode.trim()}
                      className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-gold-primary hover:bg-gold-highlight focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isVerifying ? (
                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      ) : (
                        t('verify', { default: 'Vahvista' })
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setShowManualEntry(false)}
                      className="flex-1 py-2 px-4 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-transparent hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      {t('cancel', { default: 'Peruuta' })}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="mb-6">
                <button
                  onClick={() => setShowManualEntry(true)}
                  className="inline-flex items-center text-sm text-gold-secondary hover:text-gold-primary transition-colors"
                >
                  <KeyIcon className="h-4 w-4 mr-1" />
                  {t('haveCode', { default: 'Onko sinulla jo koodi? Klikkaa tästä' })}
                </button>
              </div>
            )}
            
            <p className="mb-6 text-sm text-gray-400">
              {t('afterConfirmation', {
                destination: t('dashboard'),
                default: 'Vahvistuksen jälkeen sinut ohjataan hallintapaneeliin'
              })}
            </p>
            
            <div className="mt-6 grid gap-4">
              {expired && (
                <button
                  onClick={handleResend}
                  className="w-full flex justify-center items-center py-3 px-4 border-2 border-gold-primary rounded-xl shadow-sm text-base font-medium text-gold-primary bg-transparent hover:bg-gold-primary/10 hover:text-gold-highlight focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-primary/50 focus:ring-offset-black"
                >
                  <ArrowPathIcon className="h-5 w-5 mr-2" />
                  {t('resendLink', { default: 'Lähetä uusi linkki' })}
                </button>
              )}
              
              <Link
                href={`/${locale}/auth/sign-in`}
                className="w-full flex justify-center py-3 px-4 border border-gold-secondary/50 rounded-xl shadow-sm text-base font-medium text-gold-secondary bg-transparent hover:bg-gold-primary/10 hover:text-gold-highlight focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-primary/50 focus:ring-offset-black"
              >
                {t('backToSignIn')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 