/**
 * 📋 Company Background Data Transparency Component
 * 
 * Displays data sources, confidence, and language for company background information
 * (overview, products, market, team) fetched via AI enrichment.
 * 
 * USAGE:
 * ```tsx
 * <CompanyBackgroundTransparency 
 *   enrichmentStatus="enriched"
 *   enrichmentMethod="gemini_grounding"
 *   confidence={85}
 *   metadata={company.metadata}
 *   sources={['https://company.fi', 'https://linkedin.com/company/...']}
 * />
 * ```
 */

'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Info, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Globe,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface CompanyBackgroundTransparencyProps {
  enrichmentStatus?: 'pending' | 'enriching' | 'enriched' | 'pending_documents' | 'failed' | null;
  enrichmentMethod?: string | null;
  confidence?: number | null;
  metadata?: {
    company_info?: {
      method?: string;
      confidence?: number;
      sources?: string[];
      last_updated?: string;
      language?: string;
    };
  } | null;
  sources?: string[] | null;
  className?: string;
}

export function CompanyBackgroundTransparency({
  enrichmentStatus,
  enrichmentMethod,
  confidence,
  metadata,
  sources,
  className
}: CompanyBackgroundTransparencyProps) {
  const t = useTranslations('dashboard.transparency');

  // Extract company info from metadata
  const companyInfo = metadata?.company_info;
  const actualConfidence = companyInfo?.confidence || confidence || 0;
  const actualSources = companyInfo?.sources || sources || [];
  const language = companyInfo?.language || 'fi';
  const lastUpdated = companyInfo?.last_updated;
  const method = companyInfo?.method || enrichmentMethod || 'unknown';

  // Get status information
  const getStatusInfo = () => {
    switch (enrichmentStatus) {
      case 'enriched':
      case 'pending_documents': // Company info enriched, awaiting financial docs
        return {
          icon: CheckCircle,
          label: t('status.enriched', { default: '✅ Taustatiedot haettu' }),
          description: t('status.enrichedDesc', { default: 'Yrityksen perustiedot haettu automaattisesti' }),
          color: 'text-green-700',
          bgColor: 'bg-green-500/10 border-green-500/30'
        };
      case 'enriching':
        return {
          icon: Clock,
          label: t('status.enriching', { default: '⏳ Haetaan tietoja...' }),
          description: t('status.enrichingDesc', { default: 'AI hakee yrityksen taustatietoja' }),
          color: 'text-blue-700',
          bgColor: 'bg-blue-500/10 border-blue-500/30'
        };
      case 'pending':
        return {
          icon: Clock,
          label: t('status.pending', { default: '⏳ Jonossa' }),
          description: t('status.pendingDesc', { default: 'Tietojen haku aloitetaan pian' }),
          color: 'text-gray-700',
          bgColor: 'bg-gray-500/10 border-gray-500/30'
        };
      case 'failed':
        return {
          icon: AlertCircle,
          label: t('status.failed', { default: '❌ Haku epäonnistui' }),
          description: t('status.failedDesc', { default: 'Tietoja ei voitu hakea automaattisesti' }),
          color: 'text-red-700',
          bgColor: 'bg-red-500/10 border-red-500/30'
        };
      default:
        return {
          icon: Info,
          label: t('status.unknown', { default: 'Ei tietoja' }),
          description: t('status.unknownDesc', { default: 'Tietojen tila tuntematon' }),
          color: 'text-gray-700',
          bgColor: 'bg-gray-500/10 border-gray-500/30'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  // Get confidence level info
  const getConfidenceInfo = (conf: number) => {
    if (conf >= 80) {
      return {
        label: t('confidence.high', { default: 'Korkea luotettavuus' }),
        color: 'text-green-700',
        bgColor: 'bg-green-500/10'
      };
    } else if (conf >= 50) {
      return {
        label: t('confidence.medium', { default: 'Kohtalainen luotettavuus' }),
        color: 'text-yellow-700',
        bgColor: 'bg-yellow-500/10'
      };
    } else {
      return {
        label: t('confidence.low', { default: 'Matala luotettavuus' }),
        color: 'text-orange-700',
        bgColor: 'bg-orange-500/10'
      };
    }
  };

  const confidenceInfo = getConfidenceInfo(actualConfidence);

  // Get language display name
  const getLanguageName = (lang: string) => {
    const names: Record<string, string> = {
      fi: '🇫🇮 Suomi',
      sv: '🇸🇪 Svenska',
      en: '🇬🇧 English'
    };
    return names[lang] || lang;
  };

  // Get method display name
  const getMethodName = (m: string) => {
    const names: Record<string, string> = {
      'gemini_grounding': 'Gemini AI + Google Search',
      'company_info_only': 'Gemini AI (vain taustatiedot)',
      'unified_gemini_grounding': 'Gemini AI (kaikki tiedot)',
      'unknown': 'Tuntematon menetelmä'
    };
    return names[m] || m;
  };

  // Don't show component if no enrichment data
  if (!enrichmentStatus || enrichmentStatus === 'pending') {
    return null;
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Info className="h-4 w-4" />
          {t('title', { default: 'Tietojen lähteet ja luotettavuus' })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                "flex items-center justify-between p-3 rounded-lg border cursor-help",
                statusInfo.bgColor
              )}>
                <div className="flex items-center gap-2">
                  <StatusIcon className={cn("h-4 w-4", statusInfo.color)} />
                  <div>
                    <p className={cn("text-sm font-medium", statusInfo.color)}>
                      {statusInfo.label}
                    </p>
                    {lastUpdated && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(lastUpdated).toLocaleDateString('fi-FI', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p className="text-xs">{statusInfo.description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Confidence & Language */}
        {(enrichmentStatus === 'enriched' || enrichmentStatus === 'pending_documents') && (
          <div className="grid grid-cols-2 gap-3">
            {/* Confidence */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "p-3 rounded-lg border cursor-help",
                    confidenceInfo.bgColor
                  )}>
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className={cn("h-3 w-3", confidenceInfo.color)} />
                      <p className="text-xs font-medium text-muted-foreground">
                        {t('confidence.title', { default: 'Luotettavuus' })}
                      </p>
                    </div>
                    <p className={cn("text-lg font-bold", confidenceInfo.color)}>
                      {actualConfidence}%
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="text-xs">{confidenceInfo.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('confidence.description', { 
                      default: 'Arvio tietojen tarkkuudesta ja kattavuudesta' 
                    })}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Language */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-3 rounded-lg border bg-blue-500/10 border-blue-500/30 cursor-help">
                    <div className="flex items-center gap-2 mb-1">
                      <Globe className="h-3 w-3 text-blue-700" />
                      <p className="text-xs font-medium text-muted-foreground">
                        {t('language.title', { default: 'Kieli' })}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-blue-700">
                      {getLanguageName(language)}
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="text-xs">
                    {t('language.description', { 
                      default: 'Tiedot haettu tällä kielellä' 
                    })}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Method */}
        {method && method !== 'unknown' && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">
              {t('method.title', { default: 'Menetelmä' })}:
            </span>{' '}
            {getMethodName(method)}
          </div>
        )}

        {/* Sources */}
        {actualSources.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {t('sources.title', { default: 'Lähteet' })} ({actualSources.length})
            </p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {actualSources.slice(0, 5).map((source, index) => {
                try {
                  const url = new URL(source);
                  const domain = url.hostname.replace('www.', '');
                  return (
                    <a
                      key={index}
                      href={source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 hover:underline group"
                    >
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="truncate">{domain}</span>
                    </a>
                  );
                } catch {
                  return (
                    <div key={index} className="text-xs text-muted-foreground truncate">
                      {source}
                    </div>
                  );
                }
              })}
              {actualSources.length > 5 && (
                <p className="text-xs text-muted-foreground italic">
                  {t('sources.more', { 
                    default: `...ja ${actualSources.length - 5} muuta lähdettä` 
                  })}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Important Note about Financial Data */}
        {enrichmentStatus === 'pending_documents' && (
          <div className="mt-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
            <p className="text-xs font-medium text-orange-900 flex items-center gap-2">
              <AlertCircle className="h-3 w-3" />
              {t('note.financialDataMissing', { 
                default: 'Taloustiedot puuttuvat' 
              })}
            </p>
            <p className="text-xs text-orange-700 mt-1">
              {t('note.uploadDocument', { 
                default: 'Lataa tilinpäätös saadaksesi tarkat talousluvut ja rahoitussuositukset.' 
              })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

