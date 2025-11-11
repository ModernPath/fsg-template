"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, ExternalLink, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FinancialDataTransparencyProps {
  confidence?: number | null;
  sources?: string[] | null;
  dataSource?: string | null;
  dataSourceType?: 'document' | 'manual' | 'ai_extracted' | null;
  dataSourcePriority?: number | null;
  lastUpdated?: string | null;
  validationErrors?: Array<{
    field: string;
    error: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  }> | null;
  validationWarnings?: Array<{
    field: string;
    warning: string;
    suggestion?: string;
  }> | null;
  className?: string;
  compact?: boolean;
}

/**
 * Displays transparency information about financial data:
 * - Confidence score (color-coded)
 * - Data sources (with links)
 * - Validation errors/warnings
 * - Last updated timestamp
 */
export default function FinancialDataTransparency({
  confidence,
  sources,
  dataSource,
  dataSourceType,
  dataSourcePriority,
  lastUpdated,
  validationErrors,
  validationWarnings,
  className,
  compact = false
}: FinancialDataTransparencyProps) {
  const t = useTranslations('Financial');

  // Get data source type information
  const getDataSourceTypeInfo = (type: string | null): {
    label: string;
    description: string;
    color: string;
    bgColor: string;
    priority: number;
  } => {
    switch (type) {
      case 'document':
        return {
          label: t('sourceType.document', { default: '📄 Asiakirja' }),
          description: t('sourceType.documentDesc', { default: 'Data ladatusta tilinpäätöksestä - Korkein luotettavuus' }),
          color: 'text-green-700',
          bgColor: 'bg-green-500/10 border-green-500/30',
          priority: 100
        };
      case 'manual':
        return {
          label: t('sourceType.manual', { default: '✍️ Manuaalinen' }),
          description: t('sourceType.manualDesc', { default: 'Käsin syötetty tieto - Kohtalainen luotettavuus' }),
          color: 'text-blue-700',
          bgColor: 'bg-blue-500/10 border-blue-500/30',
          priority: 50
        };
      case 'ai_extracted':
        return {
          label: t('sourceType.aiExtracted', { default: '🤖 AI-haettu' }),
          description: t('sourceType.aiExtractedDesc', { default: 'Automaattisesti haettu tieto - Alin luotettavuus' }),
          color: 'text-orange-700',
          bgColor: 'bg-orange-500/10 border-orange-500/30',
          priority: 10
        };
      default:
        return {
          label: t('sourceType.unknown', { default: '❓ Tuntematon' }),
          description: t('sourceType.unknownDesc', { default: 'Tiedon lähde tuntematon' }),
          color: 'text-gray-700',
          bgColor: 'bg-gray-500/10 border-gray-500/30',
          priority: 0
        };
    }
  };

  const sourceTypeInfo = dataSourceType ? getDataSourceTypeInfo(dataSourceType) : null;

  // Determine confidence level and color
  const getConfidenceLevel = (score: number): {
    level: string;
    color: string;
    bgColor: string;
    icon: React.ReactNode;
  } => {
    if (score >= 80) {
      return {
        level: t('confidence.high', { default: 'Korkea luotettavuus' }),
        color: 'text-green-600',
        bgColor: 'bg-green-500/10 border-green-500/30',
        icon: <CheckCircle2 className="h-4 w-4 text-green-500" />
      };
    } else if (score >= 50) {
      return {
        level: t('confidence.medium', { default: 'Kohtalainen luotettavuus' }),
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-500/10 border-yellow-500/30',
        icon: <AlertCircle className="h-4 w-4 text-yellow-500" />
      };
    } else if (score >= 20) {
      return {
        level: t('confidence.low', { default: 'Matala luotettavuus' }),
        color: 'text-orange-600',
        bgColor: 'bg-orange-500/10 border-orange-500/30',
        icon: <AlertTriangle className="h-4 w-4 text-orange-500" />
      };
    } else {
      return {
        level: t('confidence.none', { default: 'Ei luotettavaa dataa' }),
        color: 'text-red-600',
        bgColor: 'bg-red-500/10 border-red-500/30',
        icon: <AlertTriangle className="h-4 w-4 text-red-500" />
      };
    }
  };

  const confidenceInfo = confidence !== null && confidence !== undefined ? getConfidenceLevel(confidence) : null;

  // Don't render if no transparency data
  if (!confidenceInfo && (!sources || sources.length === 0) && !dataSource && !validationErrors && !validationWarnings) {
    return null;
  }

  // Compact mode: Just show badge with tooltip
  if (compact && confidenceInfo) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border", confidenceInfo.bgColor, className)}>
              {confidenceInfo.icon}
              <span className={cn("text-xs font-medium", confidenceInfo.color)}>
                {confidence}%
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p className="font-medium">{confidenceInfo.level}</p>
            {sources && sources.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {t('transparency.sources', { default: 'Lähteet' })}: {sources.length}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full mode: Show detailed card
  return (
    <Card className={cn("p-4 space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Info className="h-4 w-4 text-blue-500" />
        <h4 className="text-sm font-semibold">
          {t('transparency.title', { default: 'Tiedon luotettavuus' })}
        </h4>
      </div>

      {/* Data Source Type - Priority Badge */}
      {sourceTypeInfo && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn("flex items-center justify-between p-3 rounded-lg border cursor-help", sourceTypeInfo.bgColor)}>
                <div className="flex items-center gap-2">
                  <div>
                    <p className={cn("text-sm font-medium", sourceTypeInfo.color)}>{sourceTypeInfo.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('transparency.priority', { default: 'Prioriteetti' })}: {dataSourcePriority || sourceTypeInfo.priority}/100
                    </p>
                  </div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p className="text-xs">{sourceTypeInfo.description}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {dataSourcePriority === 100 && '✅ Korkein prioriteetti - Ei voi ylikirjoittaa'}
                {dataSourcePriority === 50 && 'ℹ️ Keskiprioriteetti - Asiakirja voi ylikirjoittaa'}
                {dataSourcePriority === 10 && '⚠️ Alin prioriteetti - Asiakirja tai manuaalinen voi ylikirjoittaa'}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Confidence Score */}
      {confidenceInfo && (
        <div className={cn("flex items-center justify-between p-3 rounded-lg border", confidenceInfo.bgColor)}>
          <div className="flex items-center gap-2">
            {confidenceInfo.icon}
            <div>
              <p className="text-sm font-medium">{confidenceInfo.level}</p>
              <p className="text-xs text-muted-foreground">
                {t('transparency.confidenceScore', { default: 'Luotettavuuspisteet' })}: {confidence}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Data Source */}
      {dataSource && (
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">{t('transparency.method', { default: 'Menetelmä' })}:</span>{' '}
          <Badge variant="outline" className="ml-1 text-xs">
            {dataSource === 'google_custom_search' && 'Google Custom Search'}
            {dataSource === 'gemini_grounding' && 'Gemini Grounding'}
            {dataSource === 'manual_input' && t('transparency.manual', { default: 'Manuaalinen syöttö' })}
            {dataSource === 'ytj_api' && 'YTJ API'}
            {!['google_custom_search', 'gemini_grounding', 'manual_input', 'ytj_api'].includes(dataSource) && dataSource}
          </Badge>
        </div>
      )}

      {/* Sources */}
      {sources && sources.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            {t('transparency.sources', { default: 'Lähteet' })} ({sources.length}):
          </p>
          <div className="space-y-1">
            {sources.slice(0, 3).map((source, index) => {
              try {
                const url = new URL(source);
                const domain = url.hostname.replace('www.', '');
                return (
                  <a
                    key={index}
                    href={source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{domain}</span>
                  </a>
                );
              } catch {
                return (
                  <p key={index} className="text-xs text-muted-foreground truncate">
                    {source}
                  </p>
                );
              }
            })}
            {sources.length > 3 && (
              <p className="text-xs text-muted-foreground">
                {t('transparency.moreSources', { default: 'ja {count} muuta lähdettä', count: sources.length - 3 })}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors && validationErrors.length > 0 && (
        <div className="space-y-1.5 p-2 bg-red-500/5 border border-red-500/20 rounded-md">
          <p className="text-xs font-medium text-red-600">
            {t('transparency.errors', { default: 'Virheet' })}:
          </p>
          {validationErrors.slice(0, 3).map((error, index) => (
            <div key={index} className="flex items-start gap-1.5">
              <AlertTriangle className="h-3 w-3 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-600">
                <span className="font-medium">{error.field}:</span> {error.error}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Validation Warnings */}
      {validationWarnings && validationWarnings.length > 0 && (
        <div className="space-y-1.5 p-2 bg-yellow-500/5 border border-yellow-500/20 rounded-md">
          <p className="text-xs font-medium text-yellow-600">
            {t('transparency.warnings', { default: 'Huomiot' })}:
          </p>
          {validationWarnings.slice(0, 2).map((warning, index) => (
            <div key={index} className="space-y-0.5">
              <div className="flex items-start gap-1.5">
                <AlertCircle className="h-3 w-3 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-600">
                  <span className="font-medium">{warning.field}:</span> {warning.warning}
                </p>
              </div>
              {warning.suggestion && (
                <p className="text-xs text-muted-foreground ml-5">
                  💡 {warning.suggestion}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Last Updated */}
      {lastUpdated && (
        <p className="text-xs text-muted-foreground">
          {t('transparency.lastUpdated', { default: 'Päivitetty' })}:{' '}
          {new Date(lastUpdated).toLocaleDateString('fi-FI', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      )}
    </Card>
  );
}

