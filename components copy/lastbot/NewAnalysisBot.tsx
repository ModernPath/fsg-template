'use client'

import { useEffect } from 'react'

interface NewAnalysisBotProps {
  className?: string
  context?: Record<string, any>
}

/**
 * Embeds a dedicated analysis bot instance (separate widget) on the page.
 * Requires the following env vars:
 *  - NEXT_PUBLIC_ENABLE_LASTBOT_ANALYSIS=true
 *  - NEXT_PUBLIC_LASTBOT_BASE_URL
 *  - NEXT_PUBLIC_LASTBOT_ANALYSIS_WIDGET_ID
 */
export default function NewAnalysisBot({ className, context }: NewAnalysisBotProps) {
  const isEnabled = process.env.NEXT_PUBLIC_ENABLE_LASTBOT_ANALYSIS === 'true'
  const baseUrl = process.env.NEXT_PUBLIC_LASTBOT_BASE_URL
  const widgetId = process.env.NEXT_PUBLIC_LASTBOT_ANALYSIS_WIDGET_ID
  const isDev = process.env.NODE_ENV === 'development'

  useEffect(() => {
    if (!isEnabled || !baseUrl || !widgetId) return

    // load script once
    if (!document.querySelector('script[src="https://assets.lastbot.com/lastbot-chat.js"]')) {
      const script = document.createElement('script')
      script.src = 'https://assets.lastbot.com/lastbot-chat.js'
      script.defer = true
      document.head.appendChild(script)
    }

    // Optionally set page-specific context via global
    if (context) {
      ;(window as any).__NEW_ANALYSIS_BOT_CONTEXT__ = context
    }
  }, [isEnabled, baseUrl, widgetId, context])

  if (!isEnabled || !baseUrl || !widgetId) {
    if (isDev) {
      console.warn('NewAnalysisBot disabled or missing config', {
        NEXT_PUBLIC_ENABLE_LASTBOT_ANALYSIS: isEnabled,
        hasBaseUrl: !!baseUrl,
        hasWidgetId: !!widgetId,
      })
    }
    return null
  }

  // Pass context via data-attrs if supported later; for now use global above
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


