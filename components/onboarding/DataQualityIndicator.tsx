"use client";

import { AlertCircle, CheckCircle2, Info, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface DataQualityIndicatorProps {
  dataQuality: {
    verified: boolean;
    aiGenerated: boolean;
    needsVerification: boolean;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    missingFields: string[];
  };
}

/**
 * Data Quality Indicator - Shows data reliability warnings
 * Finnish only - other languages on request
 */
export function DataQualityIndicator({ dataQuality }: DataQualityIndicatorProps) {

  // Don't show anything if data quality is good
  if (dataQuality.verified && !dataQuality.aiGenerated && !dataQuality.needsVerification) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Warning for AI-generated data */}
      {dataQuality.aiGenerated && (
        <Alert variant="default" className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <Sparkles className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-900 dark:text-amber-100">
            ⚠️ Tarkista tiedot ennen tallennusta
          </AlertTitle>
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            Osa tiedoista on AI-generoituja. Varmista että ne ovat oikein.
          </AlertDescription>
        </Alert>
      )}

      {/* Success for YTJ-verified data */}
      {dataQuality.verified && (
        <Alert variant="default" className="border-green-500 bg-green-50 dark:bg-green-950/20">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-900 dark:text-green-100">
            ✅ Tiedot vahvistettu
          </AlertTitle>
          <AlertDescription className="text-green-800 dark:text-green-200">
            Perustiedot haettu virallisesta YTJ-rekisteristä.
          </AlertDescription>
        </Alert>
      )}

      {/* Warning for data that needs verification */}
      {dataQuality.needsVerification && !dataQuality.verified && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Vaatii vahvistuksen</AlertTitle>
          <AlertDescription>
            Tarkista tiedot huolellisesti ennen jatkamista.
            {dataQuality.missingFields.length > 0 && (
              <div className="mt-2">
                <strong>Puuttuvat kentät:</strong> {dataQuality.missingFields.join(', ')}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Confidence indicator */}
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <Info className="h-4 w-4" />
        <span>
          {dataQuality.confidence === 'HIGH' && 'Korkea luotettavuus'}
          {dataQuality.confidence === 'MEDIUM' && 'Keskitason luotettavuus'}
          {dataQuality.confidence === 'LOW' && 'Matala luotettavuus'}
        </span>
      </div>
    </div>
  );
}

