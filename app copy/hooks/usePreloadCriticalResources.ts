'use client'

import { useEffect } from 'react'

export function usePreloadCriticalResources() {
  useEffect(() => {
    // Note: No custom fonts needed - using Tailwind system fonts
    
    // Preload critical images
    const criticalImages = [
      '/images/trusty-finance-logo-optimized.webp',
      '/images/other/rento_laiskiainen_puku.jpeg'
    ]

    criticalImages.forEach(imageUrl => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = imageUrl
      document.head.appendChild(link)
    })

    // DNS prefetch for external domains
    const dnsPrefetchDomains = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://vercel-insights.com',
      'https://va.vercel-scripts.com'
    ]

    dnsPrefetchDomains.forEach(domain => {
      const link = document.createElement('link')
      link.rel = 'dns-prefetch'
      link.href = domain
      document.head.appendChild(link)
    })

    // Preconnect to critical origins
    const preconnectDomains = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com'
    ]

    preconnectDomains.forEach(domain => {
      const link = document.createElement('link')
      link.rel = 'preconnect'
      link.href = domain
      link.crossOrigin = 'anonymous'
      document.head.appendChild(link)
    })

  }, [])
}

// Hook for lazy loading non-critical resources
export function useLazyLoadResources() {
  useEffect(() => {
    // Lazy load non-critical CSS
    const lazyCSS = [
      'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css'
    ]

    const loadLazyCSS = () => {
      lazyCSS.forEach(cssUrl => {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = cssUrl
        link.media = 'print'
        link.onload = () => {
          if (link.media !== 'all') {
            link.media = 'all'
          }
        }
        document.head.appendChild(link)
      })
    }

    // Load after initial render
    if (typeof window !== 'undefined') {
      if (document.readyState === 'complete') {
        loadLazyCSS()
      } else {
        window.addEventListener('load', loadLazyCSS)
        return () => window.removeEventListener('load', loadLazyCSS)
      }
    }
  }, [])
}

// Hook for optimizing third-party scripts
export function useOptimizedThirdPartyScripts() {
  useEffect(() => {
    // Load analytics after user interaction
    let analyticsLoaded = false

    const loadAnalytics = () => {
      if (analyticsLoaded) return
      analyticsLoaded = true

      // Google Analytics 4
      if (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
        const script = document.createElement('script')
        script.async = true
        script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`
        document.head.appendChild(script)

        script.onload = () => {
          window.gtag = window.gtag || function() {
            (window.gtag.q = window.gtag.q || []).push(arguments)
          }
          window.gtag('js', new Date())
          window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!)
        }
      }
    }

    // Load on first user interaction
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    const handleFirstInteraction = () => {
      loadAnalytics()
      events.forEach(event => {
        document.removeEventListener(event, handleFirstInteraction, true)
      })
    }

    events.forEach(event => {
      document.addEventListener(event, handleFirstInteraction, {
        once: true,
        passive: true,
        capture: true
      })
    })

    // Fallback: load after 5 seconds
    const fallbackTimeout = setTimeout(loadAnalytics, 5000)

    return () => {
      clearTimeout(fallbackTimeout)
      events.forEach(event => {
        document.removeEventListener(event, handleFirstInteraction, true)
      })
    }
  }, [])
}

// Combined hook for all optimizations
export function usePerformanceOptimizations() {
  usePreloadCriticalResources()
  useLazyLoadResources()
  useOptimizedThirdPartyScripts()
}
