'use client'

import { useEffect, useState } from 'react'

interface LastBotWidgetProps {
  className?: string
}

export default function LastBotWidget({ className }: LastBotWidgetProps) {
  const [isWidgetReady, setIsWidgetReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if LastBot is enabled
  const isEnabled = process.env.NEXT_PUBLIC_ENABLE_LASTBOT_ONE === 'true'
  const baseUrl = process.env.NEXT_PUBLIC_LASTBOT_BASE_URL
  const widgetId = process.env.NEXT_PUBLIC_LASTBOT_WIDGET_ID

  // Check if we're in development mode and on localhost
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1' ||
     window.location.hostname.includes('localhost'))

  // Debug logging (only in development)
  if (isDevelopment) {
    console.log('LastBot Widget Debug:', {
      isEnabled,
      baseUrl,
      widgetId,
      isLocalhost,
      shouldRender: isEnabled && baseUrl && widgetId && !isLocalhost
    })
  }

  useEffect(() => {
    // Don't render widget on localhost in development
    if (isLocalhost && isDevelopment) {
      setError('LastBot Widget is disabled on localhost for development. Please deploy to a production domain or configure LastBot to allow localhost.')
      return
    }

    // Only proceed if enabled and required config is available
    if (!isEnabled || !baseUrl || !widgetId) {
      setError('LastBot Widget is not properly configured. Please check environment variables.')
      return
    }

    // Check if script is already loaded
    if (document.querySelector('script[src="https://assets.lastbot.com/lastbot-chat.js"]')) {
      setIsWidgetReady(true)
      return
    }

    // Create and append the script
    const script = document.createElement('script')
    script.src = 'https://assets.lastbot.com/lastbot-chat.js'
    script.defer = true
    script.onload = () => {
      console.log('LastBot chat script loaded successfully')
      setIsWidgetReady(true)
      setError(null)
    }
    script.onerror = () => {
      console.error('Failed to load LastBot chat script')
      setError('Failed to load LastBot chat script')
    }

    document.head.appendChild(script)

    // Cleanup function
    return () => {
      const existingScript = document.querySelector('script[src="https://assets.lastbot.com/lastbot-chat.js"]')
      if (existingScript) {
        existingScript.remove()
      }
    }
  }, [isEnabled, baseUrl, widgetId, isLocalhost, isDevelopment])

  // Don't render if not enabled or missing required config
  if (!isEnabled || !baseUrl || !widgetId) {
    return null
  }

  // Show error message if there's an error
  if (error) {
    return (
      <div className={`p-4 bg-yellow-50 border border-yellow-200 rounded-md ${className || ''}`}>
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              LastBot Widget Notice
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Don't render widget on localhost in development
  if (isLocalhost && isDevelopment) {
    return null
  }

  // Only render widget when script is loaded and ready
  if (!isWidgetReady) {
    return (
      <div className={`p-4 bg-blue-50 border border-blue-200 rounded-md ${className || ''}`}>
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-sm text-blue-800">Loading LastBot Widget...</span>
        </div>
      </div>
    )
  }

  return (
    <div
      dangerouslySetInnerHTML={{
        __html: `<lastbot-chat
          auto-open="false"
          base-url="${baseUrl}"
          fullscreen="false"
          widget-id="${widgetId}"
        ></lastbot-chat>`
      }}
      className={className}
    />
  )
} 