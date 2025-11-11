"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, DollarSign, Info } from "lucide-react";
import { showQuickFeedback } from "@/lib/utils/ui-feedback";

interface ManualFinancialInputProps {
  companyId: string;
  session: any;
  onSuccess?: (data: any) => void;
  onCancel?: () => void;
}

export default function ManualFinancialInput({
  companyId,
  session,
  onSuccess,
  onCancel,
}: ManualFinancialInputProps) {
  const t = useTranslations("Onboarding");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputText, setInputText] = useState("");
  const [parseResult, setParseResult] = useState<any>(null);

  const handleSubmit = async () => {
    if (!inputText.trim() || !session?.access_token) {
      return;
    }

    setIsSubmitting(true);
    setParseResult(null);

    try {
      const response = await fetch("/api/financial-data/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          text: inputText,
          companyId,
          fiscalYear: new Date().getFullYear(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to parse financial data");
      }

      if (data.needsMoreInfo) {
        // AI needs more information
        setParseResult(data);
        showQuickFeedback(
          "info",
          data.question || t("financial.needMoreInfo", { default: "Tarvitsen lisätietoja" }),
          "",
          5000
        );
      } else {
        // Success - data saved
        setParseResult(data);
        showQuickFeedback(
          "success",
          t("financial.dataSaved", { default: "Taloustiedot tallennettu!" }),
          "",
          3000
        );
        
        if (onSuccess) {
          onSuccess(data);
        }
      }
    } catch (error: any) {
      console.error("❌ [ManualFinancialInput] Error:", error);
      showQuickFeedback(
        "error",
        error.message || t("financial.parseFailed", { default: "Tietojen käsittely epäonnistui" }),
        "",
        5000
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
      <div className="flex items-start gap-2 mb-3">
        <DollarSign className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-200 mb-1">
            {t("financial.manualInputTitle", { default: "Kerro taloustiedot minulle" })}
          </p>
          <p className="text-xs text-blue-300/80 mb-3">
            {t("financial.manualInputDescription", { 
              default: "Voit kertoa viimeisimmän tilinpäätöksen tiedot luonnollisella kielellä. Tarvitsen vähintään liikevaihdon ja tilikauden." 
            })}
          </p>

          {/* Example prompt */}
          <div className="mb-3 p-2 bg-blue-500/10 rounded text-xs text-blue-200/80 italic">
            {t("financial.manualInputExample", { 
              default: "Esim: \"Liikevaihto oli 500 000 €, liikevoitto 50 000 € ja oma pääoma 200 000 €. Tilikausi 2024.\"" 
            })}
          </div>

          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t("financial.manualInputPlaceholder", { 
              default: "Kirjoita tähän..." 
            })}
            className="mb-3 min-h-[100px] bg-black/40 border-blue-500/30 text-gray-200 placeholder:text-gray-500"
            disabled={isSubmitting}
          />

          {/* Show parsed result if needs more info */}
          {parseResult?.needsMoreInfo && (
            <div className="mb-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-200">
                  <p className="font-medium mb-1">{parseResult.question}</p>
                  {parseResult.extracted && (
                    <div className="mt-2 text-amber-300/80">
                      <p className="font-medium mb-1">{t("financial.extracted", { default: "Löydetyt tiedot:" })}</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        {parseResult.extracted.revenue && (
                          <li>{t("financial.revenue", { default: "Liikevaihto" })}: {parseResult.extracted.revenue.toLocaleString()} €</li>
                        )}
                        {parseResult.extracted.operating_profit && (
                          <li>{t("financial.operatingProfit", { default: "Liikevoitto" })}: {parseResult.extracted.operating_profit.toLocaleString()} €</li>
                        )}
                        {parseResult.extracted.equity && (
                          <li>{t("financial.equity", { default: "Oma pääoma" })}: {parseResult.extracted.equity.toLocaleString()} €</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Show success with calculated metrics */}
          {parseResult?.success && (
            <div className="mb-3 p-3 bg-green-500/10 border border-green-500/30 rounded">
              <div className="text-xs text-green-200">
                <p className="font-medium mb-2">✅ {t("financial.saveSuccess", { default: "Taloustiedot tallennettu!" })}</p>
                {parseResult.calculated && (
                  <div className="mt-2 space-y-1 text-green-300/80">
                    {parseResult.calculated.return_on_equity && (
                      <p>• {t("financial.roe", { default: "Oman pääoman tuotto" })}: {parseResult.calculated.return_on_equity.toFixed(1)}%</p>
                    )}
                    {parseResult.calculated.current_ratio && (
                      <p>• {t("financial.currentRatio", { default: "Current ratio" })}: {parseResult.calculated.current_ratio.toFixed(2)}</p>
                    )}
                    {parseResult.calculated.profit_margin && (
                      <p>• {t("financial.profitMargin", { default: "Voittomarginaali" })}: {parseResult.calculated.profit_margin.toFixed(1)}%</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Warnings */}
          {parseResult?.warnings && parseResult.warnings.length > 0 && (
            <div className="mb-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded">
              <div className="text-xs text-amber-200">
                <p className="font-medium mb-1">⚠️ {t("financial.warnings", { default: "Huomiot:" })}</p>
                <ul className="list-disc list-inside space-y-0.5 text-amber-300/80">
                  {parseResult.warnings.map((warning: string, idx: number) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="mb-3 p-2 bg-gray-800/40 border border-gray-700/40 rounded">
            <p className="text-xs text-gray-400">
              ℹ️ {t("financial.manualDisclaimer", { 
                default: "Rahoituskumppani tarkistaa luvut ennen lopullista rahoituspäätöstä." 
              })}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="default"
              className="bg-blue-500 hover:bg-blue-600 text-white"
              disabled={isSubmitting || !inputText.trim()}
              onClick={handleSubmit}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                  {t("financial.processing", { default: "Käsitellään..." })}
                </>
              ) : (
                <>
                  <Send className="h-3 w-3 mr-1.5" />
                  {t("financial.submit", { default: "Lähetä" })}
                </>
              )}
            </Button>
            
            {onCancel && !parseResult?.success && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-gray-400 hover:text-gray-200"
                disabled={isSubmitting}
                onClick={onCancel}
              >
                {t("cancel", { default: "Peruuta" })}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

