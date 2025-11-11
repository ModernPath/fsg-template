'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface ErrorMessageProps {
  error: string | Error | null | undefined
  title?: string
}

export function ErrorMessage({ error, title }: ErrorMessageProps) {
  const t = useTranslations('common')
  
  if (!error) return null

  const errorMessage = typeof error === 'string' ? error : error.message
  const displayTitle = title || t('error.title', { default: 'An error occurred' })

  return (
    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md" role="alert">
      <div className="flex items-center">
        <div className="py-1">
          <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
        </div>
        <div>
          <p className="font-bold">{displayTitle}</p>
          <p className="text-sm">{errorMessage}</p>
        </div>
      </div>
    </div>
  )
} 