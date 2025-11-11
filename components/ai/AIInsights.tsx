/**
 * BizExit - AI Insights Component
 * Automaattiset AI-insightit jokaiseen korttiin
 * 
 * AI-NATIIVI: Näkyy automaattisesti, ei tarvitse erikseen pyytää
 */

'use client'

import { useAIInsights } from '@/hooks/useAI'
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, Award } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

interface AIInsightsProps {
  resourceType: 'company' | 'deal' | 'listing'
  resourceId: string
  variant?: 'compact' | 'full'
  className?: string
}

export function AIInsights({ 
  resourceType, 
  resourceId, 
  variant = 'full',
  className 
}: AIInsightsProps) {
  const { insights, loading } = useAIInsights(resourceType, resourceId)

  if (loading) {
    return (
      <div className={cn('space-y-2', className)}>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    )
  }

  if (!insights) {
    return null
  }

  if (variant === 'compact') {
    return (
      <CompactInsights insights={insights} className={className} />
    )
  }

  return (
    <FullInsights insights={insights} className={className} />
  )
}

// ============================================================================
// COMPACT VARIANT - Näkyy korteissa ja listauksissa
// ============================================================================

function CompactInsights({ insights, className }: any) {
  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      <Sparkles className="h-4 w-4 text-purple-600 flex-shrink-0" />
      <span className="text-gray-700 dark:text-gray-300 line-clamp-1">
        {insights.summary}
      </span>
      {insights.score && (
        <Badge 
          variant={insights.score >= 70 ? 'success' : insights.score >= 40 ? 'warning' : 'destructive'}
          className="ml-auto"
        >
          {insights.score}/100
        </Badge>
      )}
    </div>
  )
}

// ============================================================================
// FULL VARIANT - Näkyy detail-sivuilla
// ============================================================================

function FullInsights({ insights, className }: any) {
  return (
    <div className={cn('bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              AI-Analyysi
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Automaattinen arviointi
            </p>
          </div>
        </div>
        {insights.score && (
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {insights.score}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              / 100
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      {insights.summary && (
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
          {insights.summary}
        </p>
      )}

      {/* Highlights */}
      {insights.highlights && insights.highlights.length > 0 && (
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300">
            <Award className="h-3 w-3 text-green-600" />
            <span>Vahvuudet</span>
          </div>
          <div className="space-y-1">
            {insights.highlights.map((highlight: string, idx: number) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                <TrendingUp className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                <span>{highlight}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {insights.warnings && insights.warnings.length > 0 && (
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300">
            <AlertTriangle className="h-3 w-3 text-yellow-600" />
            <span>Huomioitavaa</span>
          </div>
          <div className="space-y-1">
            {insights.warnings.map((warning: string, idx: number) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                <AlertTriangle className="h-3 w-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                <span>{warning}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {insights.suggestions && insights.suggestions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300">
            <Lightbulb className="h-3 w-3 text-purple-600" />
            <span>Suositukset</span>
          </div>
          <div className="space-y-1">
            {insights.suggestions.map((suggestion: string, idx: number) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                <Lightbulb className="h-3 w-3 text-purple-600 mt-0.5 flex-shrink-0" />
                <span>{suggestion}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          AI-analyysi päivitetty juuri äsken • Tiedot voivat sisältää virheitä
        </p>
      </div>
    </div>
  )
}

// ============================================================================
// AI SCORE BADGE - Yksinkertainen badge scorelle
// ============================================================================

export function AIScoreBadge({ score }: { score: number }) {
  const getColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    if (score >= 60) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    if (score >= 40) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  }

  return (
    <div className={cn(
      'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
      getColor(score)
    )}>
      <Sparkles className="h-3 w-3" />
      <span>AI: {score}/100</span>
    </div>
  )
}

// ============================================================================
// AI LOADING INDICATOR - Kun AI analysoi
// ============================================================================

export function AILoading({ message = 'AI analysoi...' }: { message?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
      <Sparkles className="h-4 w-4 animate-pulse" />
      <span className="animate-pulse">{message}</span>
    </div>
  )
}

