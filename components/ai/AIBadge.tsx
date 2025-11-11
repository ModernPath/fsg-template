/**
 * BizExit - AI Badge
 * Universal badge that shows AI is working
 * 
 * AI-NATIIVI: Näkyy kaikkialla missä AI on aktiivinen
 */

'use client'

import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AIBadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
  pulse?: boolean
  children?: React.ReactNode
  className?: string
}

export function AIBadge({ 
  variant = 'default',
  size = 'md',
  pulse = false,
  children,
  className
}: AIBadgeProps) {
  const variants = {
    default: 'bg-gradient-to-r from-purple-600 to-blue-600 text-white',
    success: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white',
    warning: 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white',
    error: 'bg-gradient-to-r from-red-600 to-rose-600 text-white'
  }

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4'
  }

  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full font-medium',
      variants[variant],
      sizes[size],
      pulse && 'animate-pulse',
      className
    )}>
      <Sparkles className={iconSizes[size]} />
      {children || 'AI'}
    </span>
  )
}

// Specialized badges
export function AIProcessingBadge() {
  return <AIBadge pulse>AI käsittelee...</AIBadge>
}

export function AIRecommendedBadge() {
  return <AIBadge variant="success">AI suosittelee</AIBadge>
}

export function AIWarningBadge() {
  return <AIBadge variant="warning">AI varoittaa</AIBadge>
}

export function AIMatchBadge({ score }: { score: number }) {
  const variant = score >= 80 ? 'success' : score >= 60 ? 'default' : 'warning'
  return <AIBadge variant={variant}>Match: {score}%</AIBadge>
}

