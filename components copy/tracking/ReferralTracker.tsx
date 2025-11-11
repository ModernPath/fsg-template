'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import { ConversionType } from '@/types/referral'

interface ReferralTrackerProps {
  // Optional: Override default tracking behavior
  enableAutoTracking?: boolean
  // Custom session ID (defaults to localStorage)
  sessionId?: string
  // Debug mode for development
  debug?: boolean
}

export default function ReferralTracker({
  enableAutoTracking = true,
  sessionId: providedSessionId,
  debug = false
}: ReferralTrackerProps) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [trackingId, setTrackingId] = useState<string | null>(null)
  const [attribution, setAttribution] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)
  const initializedRef = useRef(false)
  const sessionIdRef = useRef<string>('')

  // Set client flag after hydration
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Generate or get session ID
  useEffect(() => {
    if (providedSessionId) {
      sessionIdRef.current = providedSessionId
    } else {
      // Get or create session ID from localStorage
      let sessionId = localStorage.getItem('trusty_session_id')
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        localStorage.setItem('trusty_session_id', sessionId)
      }
      sessionIdRef.current = sessionId
    }
  }, [providedSessionId])

  // Device fingerprinting
  const generateDeviceFingerprint = () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx?.fillText('TrustyFinance', 2, 2)
    
    const fingerprint = {
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      canvas: canvas.toDataURL()
    }
    
    // Simple hash of fingerprint data
    const hash = btoa(JSON.stringify(fingerprint)).slice(0, 16)
    return hash
  }

  // Detect device info
  const getDeviceInfo = () => {
    const userAgent = navigator.userAgent.toLowerCase()
    
    let deviceType = 'desktop'
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      deviceType = 'tablet'
    } else if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
      deviceType = 'mobile'
    }

    let browser = 'unknown'
    if (userAgent.includes('chrome')) browser = 'chrome'
    else if (userAgent.includes('firefox')) browser = 'firefox'
    else if (userAgent.includes('safari')) browser = 'safari'
    else if (userAgent.includes('edge')) browser = 'edge'

    let os = 'unknown'
    if (userAgent.includes('windows')) os = 'windows'
    else if (userAgent.includes('mac')) os = 'macos'
    else if (userAgent.includes('linux')) os = 'linux'
    else if (userAgent.includes('android')) os = 'android'
    else if (userAgent.includes('ios')) os = 'ios'

    return {
      device_type: deviceType,
      browser,
      os,
      screen_resolution: `${screen.width}x${screen.height}`
    }
  }

  // Get location info (optional - would need service)
  const getLocationInfo = async () => {
    try {
      // Could integrate with IP geolocation service
      // For now, just return basic info from Intl API
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const locale = navigator.language
      
      return {
        timezone,
        locale
      }
    } catch (error) {
      if (debug) console.warn('Could not get location info:', error)
      return {}
    }
  }

  // Track referral click
  const trackReferralClick = async (refCode: string) => {
    try {
      if (debug) console.log('🔍 [ReferralTracker] Starting trackReferralClick with code:', refCode)
      
      const deviceInfo = getDeviceInfo()
      const locationInfo = await getLocationInfo()
      
      const payload = {
        ref_code: refCode,
        landing_page: window.location.href,
        referrer_url: document.referrer || undefined,
        session_id: sessionIdRef.current,
        fingerprint: generateDeviceFingerprint(),
        device_info: deviceInfo,
        location: locationInfo
      }

      if (debug) console.log('🔍 [ReferralTracker] API request payload:', payload)
      
      const response = await fetch('/api/tracking/referral-click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (debug) console.log('🔍 [ReferralTracker] API response status:', response.status)

      const result = await response.json()
      
      if (debug) console.log('🔍 [ReferralTracker] API response data:', result)
      
      if (response.ok) {
        setTrackingId(result.click_id)
        localStorage.setItem('trusty_click_id', result.click_id)
        localStorage.setItem('trusty_tracking_expires', result.tracking_expires_at)
        
        if (debug) {
          console.log('✅ [ReferralTracker] Referral click tracked successfully:', result)
        }
        
        return result
      } else {
        if (debug) {
          console.error('❌ [ReferralTracker] Failed to track referral click:', result)
        }
      }
    } catch (error) {
      if (debug) {
        console.error('❌ [ReferralTracker] Error tracking referral click:', error)
      }
    }
  }

  // Get current attribution
  const getAttribution = async () => {
    try {
      if (debug) console.log('🔍 [ReferralTracker] Getting attribution for session:', sessionIdRef.current)
      
      const response = await fetch(`/api/tracking/referral-click?session_id=${sessionIdRef.current}`)
      
      if (debug) console.log('🔍 [ReferralTracker] Attribution API response status:', response.status)
      
      const result = await response.json()
      
      if (debug) console.log('🔍 [ReferralTracker] Attribution API response data:', result)
      
      if (response.ok && result.attributed) {
        setAttribution(result.attribution)
        localStorage.setItem('trusty_attribution', JSON.stringify(result.attribution))
        
        if (debug) {
          console.log('✅ [ReferralTracker] Attribution found:', result.attribution)
        }
        
        return result.attribution
      } else {
        if (debug) {
          console.log('ℹ️ [ReferralTracker] No attribution found for session')
        }
      }
    } catch (error) {
      if (debug) {
        console.error('❌ [ReferralTracker] Error getting attribution:', error)
      }
    }
    return null
  }

  // Track conversion
  const trackConversion = async (
    conversionType: ConversionType,
    conversionValue?: number,
    companyId?: string,
    userId?: string,
    metadata?: Record<string, any>
  ) => {
    try {
      const response = await fetch('/api/tracking/conversion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: sessionIdRef.current,
          conversion_type: conversionType,
          conversion_value: conversionValue || 0,
          company_id: companyId,
          user_id: userId,
          metadata: metadata || {}
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        if (debug) {
          console.log('Conversion tracked:', result)
        }
        
        // Store conversion for analytics
        const conversions = JSON.parse(localStorage.getItem('trusty_conversions') || '[]')
        conversions.push({
          type: conversionType,
          value: conversionValue,
          timestamp: new Date().toISOString(),
          attributed: result.attributed
        })
        localStorage.setItem('trusty_conversions', JSON.stringify(conversions))
        
        return result
      } else {
        if (debug) {
          console.error('Failed to track conversion:', result)
        }
      }
    } catch (error) {
      if (debug) {
        console.error('Error tracking conversion:', error)
      }
    }
  }

  // Initialize tracking on mount
  useEffect(() => {
    if (!enableAutoTracking || initializedRef.current) return
    
    const init = async () => {
      if (debug) console.log('🔍 [ReferralTracker] Initializing with searchParams:', Object.fromEntries(searchParams))
      
      // Check for referral code in URL
      const refCode = searchParams.get('ref')
      
      if (debug) console.log('🔍 [ReferralTracker] Ref code from URL:', refCode)
      
      if (refCode) {
        if (debug) console.log('🔍 [ReferralTracker] Found ref code, tracking click...')
        
        // Track the referral click
        await trackReferralClick(refCode)
        
        // Clean URL (remove ref parameter) without page reload
        const url = new URL(window.location.href)
        url.searchParams.delete('ref')
        window.history.replaceState({}, '', url.toString())
        
        if (debug) console.log('🔍 [ReferralTracker] URL cleaned, new URL:', url.toString())
      } else {
        if (debug) console.log('ℹ️ [ReferralTracker] No ref code in URL')
      }
      
      // Always check for existing attribution
      if (debug) console.log('🔍 [ReferralTracker] Checking for existing attribution...')
      await getAttribution()
      
      // Check for existing tracking ID
      const existingTrackingId = localStorage.getItem('trusty_click_id')
      const trackingExpires = localStorage.getItem('trusty_tracking_expires')
      
      if (debug) console.log('🔍 [ReferralTracker] Existing localStorage data:', {
        trackingId: existingTrackingId,
        expires: trackingExpires
      })
      
      if (existingTrackingId && trackingExpires) {
        const expiresAt = new Date(trackingExpires)
        if (expiresAt > new Date()) {
          setTrackingId(existingTrackingId)
          if (debug) console.log('✅ [ReferralTracker] Restored existing tracking ID')
        } else {
          // Clean up expired tracking
          localStorage.removeItem('trusty_click_id')
          localStorage.removeItem('trusty_tracking_expires')
          localStorage.removeItem('trusty_attribution')
          if (debug) console.log('🧹 [ReferralTracker] Cleaned up expired tracking data')
        }
      }
      
      initializedRef.current = true
      if (debug) console.log('✅ [ReferralTracker] Initialization complete')
    }

    init()
  }, [searchParams, enableAutoTracking])

  // Expose tracking functions to window for manual use
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).trustyTracker = {
        trackConversion,
        getAttribution: () => attribution,
        getSessionId: () => sessionIdRef.current,
        trackCustomEvent: async (eventType: string, data: any) => {
          if (debug) {
            console.log('Custom event tracked:', eventType, data)
          }
          // Could extend to track custom events
        }
      }
    }
  }, [attribution])

  // Auto-track page views
  useEffect(() => {
    if (!enableAutoTracking || !trackingId) return
    
    // Track page view if user is attributed
    if (attribution) {
      if (debug) {
        console.log('Page view tracked for attributed user:', pathname)
      }
      // Could send page view event to analytics
    }
  }, [pathname, trackingId, attribution, enableAutoTracking])

  // Development helper - show attribution status
  if (debug && isClient) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white p-4 rounded-lg text-xs max-w-sm z-[9998]">
        <div className="font-bold mb-2">🔍 Referral Tracker (Debug)</div>
        <div>Session: {sessionIdRef.current.slice(-8)}</div>
        <div>Tracking ID: {trackingId ? trackingId.slice(-8) : 'None'}</div>
        <div>Attribution: {attribution ? attribution.partner_name : 'None'}</div>
        <div>Page: {pathname}</div>
        {attribution && (
          <div className="mt-2 text-green-300">
            ✅ Partner: {attribution.partner_name}<br/>
            💰 Commission: {attribution.commission_rate}%<br/>
            📊 Source: {attribution.referral_source}
          </div>
        )}
      </div>
    )
  }

  // Component doesn't render anything in production
  return null
}

// Export tracking functions for use in other components
export const useReferralTracking = () => {
  const trackConversion = async (
    conversionType: ConversionType,
    conversionValue?: number,
    companyId?: string,
    userId?: string,
    metadata?: Record<string, any>
  ) => {
    if (typeof window !== 'undefined' && (window as any).trustyTracker) {
      return (window as any).trustyTracker.trackConversion(
        conversionType,
        conversionValue,
        companyId,
        userId,
        metadata
      )
    }
  }

  const getAttribution = () => {
    if (typeof window !== 'undefined' && (window as any).trustyTracker) {
      return (window as any).trustyTracker.getAttribution()
    }
    return null
  }

  const getSessionId = () => {
    if (typeof window !== 'undefined' && (window as any).trustyTracker) {
      return (window as any).trustyTracker.getSessionId()
    }
    return null
  }

  return {
    trackConversion,
    getAttribution,
    getSessionId
  }
} 