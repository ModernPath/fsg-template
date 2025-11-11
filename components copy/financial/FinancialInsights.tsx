"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Lightbulb, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface FinancialData {
  fiscal_year: number;
  revenue?: number | null;
  ebitda?: number | null;
  net_profit?: number | null;
  total_assets?: number | null;
  total_equity?: number | null;
  total_liabilities?: number | null;
  current_ratio?: number | null;
  debt_to_equity_ratio?: number | null;
  dscr?: number | null; // Debt Service Coverage Ratio
  interest_expenses?: number | null;
  loan_repayments?: number | null;
}

interface FinancialInsightsProps {
  data: FinancialData[];
  companyName?: string;
}

interface Insight {
  type: "positive" | "negative" | "neutral" | "warning";
  category: "growth" | "profitability" | "liquidity" | "solvency" | "recommendation";
  title: string;
  description: string;
  icon: React.ReactNode;
}

export default function FinancialInsights({ data, companyName }: FinancialInsightsProps) {
  const t = useTranslations('Financial.insights');

  const insights = useMemo((): Insight[] => {
    if (!data || data.length === 0) return [];

    const sortedData = [...data].sort((a, b) => a.fiscal_year - b.fiscal_year);
    const latest = sortedData[sortedData.length - 1];
    const previous = sortedData.length > 1 ? sortedData[sortedData.length - 2] : null;

    const results: Insight[] = [];

    // 1. REVENUE GROWTH
    if (latest.revenue && previous?.revenue) {
      const growth = ((latest.revenue - previous.revenue) / previous.revenue) * 100;
      if (growth > 5) {
        results.push({
          type: "positive",
          category: "growth",
          title: `Liikevaihto kasvoi ${growth.toFixed(1)}%`,
          description: `Liikevaihto nousi ${(previous.revenue / 1000).toFixed(0)}k€:sta ${(latest.revenue / 1000).toFixed(0)}k€:oon vuodessa ${previous.fiscal_year}-${latest.fiscal_year}. Vahva kasvu viittaa kysynnän kasvuun.`,
          icon: <TrendingUp className="h-5 w-5" />
        });
      } else if (growth < -5) {
        results.push({
          type: "warning",
          category: "growth",
          title: `Liikevaihto laski ${Math.abs(growth).toFixed(1)}%`,
          description: `Liikevaihto laski ${(previous.revenue / 1000).toFixed(0)}k€:sta ${(latest.revenue / 1000).toFixed(0)}k€:oon. Harkitse kasvuinvestointeja tai uusia markkinoita.`,
          icon: <TrendingDown className="h-5 w-5" />
        });
      }
    }

    // 2. PROFITABILITY (EBITDA margin)
    if (latest.revenue && latest.ebitda) {
      const ebitdaMargin = (latest.ebitda / latest.revenue) * 100;
      if (ebitdaMargin > 15) {
        results.push({
          type: "positive",
          category: "profitability",
          title: `Erinomainen kannattavuus ${ebitdaMargin.toFixed(1)}%`,
          description: `EBITDA-kate on ${ebitdaMargin.toFixed(1)}%, mikä on erinomainen tulos. Vahva kate antaa joustavuutta investointeihin.`,
          icon: <CheckCircle className="h-5 w-5" />
        });
      } else if (ebitdaMargin < 5) {
        results.push({
          type: "warning",
          category: "profitability",
          title: `Matala kannattavuus ${ebitdaMargin.toFixed(1)}%`,
          description: `EBITDA-kate on vain ${ebitdaMargin.toFixed(1)}%. Harkitse kustannustehokkuuden parantamista tai hinnoittelun tarkistamista.`,
          icon: <AlertCircle className="h-5 w-5" />
        });
      }
    }

    // 3. LIQUIDITY (Current Ratio)
    if (latest.current_ratio) {
      if (latest.current_ratio > 2) {
        results.push({
          type: "positive",
          category: "liquidity",
          title: `Vahva maksuvalmius ${latest.current_ratio.toFixed(2)}x`,
          description: `Current ratio on ${latest.current_ratio.toFixed(2)}, mikä tarkoittaa erinomaista maksuvalmiutta. Yritys pystyy hoitamaan lyhyen aikavälin velvoitteet.`,
          icon: <CheckCircle className="h-5 w-5" />
        });
      } else if (latest.current_ratio < 1) {
        results.push({
          type: "negative",
          category: "liquidity",
          title: `Heikko maksuvalmius ${latest.current_ratio.toFixed(2)}x`,
          description: `Current ratio on alle 1.0, mikä voi viitata maksuvalmiusongelmiin. Harkitse käyttöpääomarahoitusta tai kassavirran parantamista.`,
          icon: <AlertCircle className="h-5 w-5" />
        });
      }
    }

    // 4. SOLVENCY (Debt to Equity)
    if (latest.debt_to_equity_ratio !== null && latest.debt_to_equity_ratio !== undefined) {
      if (latest.debt_to_equity_ratio < 0.5) {
        results.push({
          type: "positive",
          category: "solvency",
          title: `Matala velkaantuneisuus ${latest.debt_to_equity_ratio.toFixed(2)}`,
          description: `Velkaantuneisuusaste on ${latest.debt_to_equity_ratio.toFixed(2)}, mikä on terve taso. Yrityksellä on tilaa ottaa lisää velkaa kasvuun.`,
          icon: <CheckCircle className="h-5 w-5" />
        });
      } else if (latest.debt_to_equity_ratio > 2) {
        results.push({
          type: "warning",
          category: "solvency",
          title: `Korkea velkaantuneisuus ${latest.debt_to_equity_ratio.toFixed(2)}`,
          description: `Velkaantuneisuusaste on ${latest.debt_to_equity_ratio.toFixed(2)}. Harkitse oman pääoman vahvistamista tai velkojen uudelleenjärjestelyä.`,
          icon: <AlertCircle className="h-5 w-5" />
        });
      }
    }

    // 4.5 DEBT SERVICE COVERAGE RATIO (DSCR) - Velanhoitokyky
    if (latest.total_liabilities && latest.total_equity) {
      // Use existing DSCR if available, otherwise calculate
      let dscr = latest.dscr;
      
      if (dscr === null || dscr === undefined) {
        // Simplified DSCR calculation using available data
        // DSCR = Net Operating Cash Flow / Total Debt Service
        // We estimate debt service as: (Total Liabilities × assumed interest rate) + assumed principal repayment
        
        const totalLiabilities = latest.total_liabilities;
        const assumedInterestRate = 0.05; // 5% estimated interest rate
        const assumedRepaymentPeriod = 5; // 5 years estimated repayment
        
        // Estimated annual debt service
        const estimatedInterestExpense = totalLiabilities * assumedInterestRate;
        const estimatedPrincipalRepayment = totalLiabilities / assumedRepaymentPeriod;
        const estimatedDebtService = estimatedInterestExpense + estimatedPrincipalRepayment;
        
        // Net cash flow (simplified: EBITDA as proxy for operating cash flow)
        const netCashFlow = latest.ebitda ?? 0;
        
        // Calculate DSCR only if EBITDA is positive
        dscr = netCashFlow > 0 && estimatedDebtService > 0 ? netCashFlow / estimatedDebtService : null;
      }
      
      if (dscr !== null) {
        const netCashFlow = latest.ebitda ?? 0;
        const totalLiabilities = latest.total_liabilities;
        const estimatedDebtService = totalLiabilities * 0.05 + totalLiabilities / 5; // Simplified calculation
        
        const calculationNote = `\n\n📊 Laskentaperuste: DSCR = EBITDA ÷ Velanhoitokulut. Velanhoitokulut arvioitu: Velat (${(totalLiabilities / 1000).toFixed(0)}k €) × 5% korko + 20% vuosittainen lyhennys = ${(estimatedDebtService / 1000).toFixed(0)}k €/v. Tarkempi luku vaatisi todelliset lainakorot ja lyhennyserät.`;
        
        if (dscr >= 1.25) {
          results.push({
            type: "positive",
            category: "solvency",
            title: `Hyvä velanhoitokyky (DSCR ${dscr.toFixed(2)})`,
            description: `DSCR-luku on ${dscr.toFixed(2)}, mikä tarkoittaa että yritys tuottaa ${dscr.toFixed(1)}x enemmän kassavirtaa (EBITDA ${(netCashFlow / 1000).toFixed(0)}k €) kuin tarvitsee velkojen hoitoon (arv. ${(estimatedDebtService / 1000).toFixed(0)}k €/v). Rahoittajat pitävät tätä hyvänä tasona.${calculationNote}`,
            icon: <CheckCircle className="h-5 w-5" />
          });
        } else if (dscr >= 1.0 && dscr < 1.25) {
          results.push({
            type: "neutral",
            category: "solvency",
            title: `Riittävä velanhoitokyky (DSCR ${dscr.toFixed(2)})`,
            description: `DSCR-luku on ${dscr.toFixed(2)}. Yritys pystyy hoitamaan velkansa (EBITDA ${(netCashFlow / 1000).toFixed(0)}k € vs. velanhoitokulut arv. ${(estimatedDebtService / 1000).toFixed(0)}k €/v), mutta puskuri on kapea. Rahoittajat saattavat vaatia lisävakuuksia.${calculationNote}`,
            icon: <Lightbulb className="h-5 w-5" />
          });
        } else if (dscr < 1.0 && dscr > 0) {
          results.push({
            type: "warning",
            category: "solvency",
            title: `Heikko velanhoitokyky (DSCR ${dscr.toFixed(2)})`,
            description: `DSCR-luku on ${dscr.toFixed(2)}, mikä tarkoittaa että kassavirta (EBITDA ${(netCashFlow / 1000).toFixed(0)}k €) ei täysin riitä velkojen hoitoon (arv. ${(estimatedDebtService / 1000).toFixed(0)}k €/v). Harkitse velkajärjestelyä tai kannattavuuden parantamista.${calculationNote}`,
            icon: <AlertCircle className="h-5 w-5" />
          });
        }
      } else if ((latest.ebitda ?? 0) <= 0 && latest.total_liabilities > 0) {
        // Negative EBITDA - company is not generating cash flow for debt service
        results.push({
          type: "warning",
          category: "solvency",
          title: "DSCR-lukua ei voida laskea (negatiivinen EBITDA)",
          description: `Yrityksen EBITDA on ${((latest.ebitda ?? 0) / 1000).toFixed(0)}k €, eli yritys ei tuota kassavirtaa velkojen hoitoon. DSCR-tunnusluku vaatii positiivisen käyttökatteen. Keskity ensin kannattavuuden parantamiseen ennen lisärahoituksen hakemista.`,
          icon: <AlertCircle className="h-5 w-5" />
        });
      }
    }

    // 5. PRELIMINARY FINANCING RECOMMENDATIONS
    if (latest.revenue && latest.ebitda && latest.current_ratio && latest.debt_to_equity_ratio !== null) {
      const ebitdaMargin = (latest.ebitda / latest.revenue) * 100;
      
      // Strong company → Growth financing
      if (ebitdaMargin > 10 && latest.current_ratio > 1.5 && latest.debt_to_equity_ratio < 1) {
        results.push({
          type: "positive",
          category: "recommendation",
          title: "Soveltuva kasvurahoitukseen",
          description: "Vahva kannattavuus ja tasapaino tekevät yrityksestä houkuttelevan kasvurahoituksen saajalle. Harkitse laiterahoitusta, investointilainaa tai pääomasijoitusta.",
          icon: <Target className="h-5 w-5" />
        });
      }
      // Good liquidity → Working capital financing
      else if (latest.current_ratio > 1.2 && ebitdaMargin > 5) {
        results.push({
          type: "neutral",
          category: "recommendation",
          title: "Käyttöpääomarahoitus sopiva",
          description: "Terve maksuvalmius ja kannattavuus mahdollistavat käyttöpääomarahoituksen. Harkitse tililimiittiä, factoringa tai invoice-rahoitusta.",
          icon: <Lightbulb className="h-5 w-5" />
        });
      }
      // Needs improvement → Restructuring
      else if (ebitdaMargin < 3 || latest.current_ratio < 1 || latest.debt_to_equity_ratio > 1.5) {
        results.push({
          type: "warning",
          category: "recommendation",
          title: "Rahoitusrakenteen vahvistaminen tarpeen",
          description: "Taloudellinen tilanne vaatii huomiota. Harkitse business angel -sijoitusta, pääomalainaa tai yrityssaneerausta tilanteen mukaan.",
          icon: <AlertCircle className="h-5 w-5" />
        });
      }
    }

    return results;
  }, [data]);

  if (insights.length === 0) return null;

  const positiveInsights = insights.filter(i => i.type === "positive");
  const warningInsights = insights.filter(i => i.type === "warning" || i.type === "negative");
  const neutralInsights = insights.filter(i => i.type === "neutral");

  return (
    <Card className="bg-gradient-to-br from-blue-950/30 to-purple-950/20 border-blue-800/30 overflow-hidden">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Lightbulb className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-100">
              Taloudelliset oivallukset
            </h3>
            <p className="text-sm text-gray-400">
              Analyysi perustuu viimeisimpään tilinpäätökseen
            </p>
          </div>
        </div>

        {/* Positive Insights */}
        {positiveInsights.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm font-semibold text-green-400 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Vahvuudet
            </div>
            {positiveInsights.map((insight, idx) => (
              <div
                key={idx}
                className="p-4 bg-green-950/20 border border-green-800/30 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-green-500/20 rounded text-green-400">
                    {insight.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-green-300 mb-1">
                      {insight.title}
                    </div>
                    <div className="text-sm text-gray-300">
                      {insight.description}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Warning/Negative Insights */}
        {warningInsights.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm font-semibold text-orange-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Kehityskohteet
            </div>
            {warningInsights.map((insight, idx) => (
              <div
                key={idx}
                className="p-4 bg-orange-950/20 border border-orange-800/30 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-orange-500/20 rounded text-orange-400">
                    {insight.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-orange-300 mb-1">
                      {insight.title}
                    </div>
                    <div className="text-sm text-gray-300">
                      {insight.description}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Neutral/Recommendation Insights */}
        {neutralInsights.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm font-semibold text-blue-400 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Alustavat rahoitussuositukset
            </div>
            {neutralInsights.map((insight, idx) => (
              <div
                key={idx}
                className="p-4 bg-blue-950/20 border border-blue-800/30 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-blue-500/20 rounded text-blue-400">
                    {insight.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-blue-300 mb-1">
                      {insight.title}
                    </div>
                    <div className="text-sm text-gray-300">
                      {insight.description}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer note */}
        <div className="pt-4 border-t border-gray-700/30">
          <p className="text-xs text-gray-400 italic">
            💡 Nämä ovat alustavia havaintoja. CFO-avustaja antaa tarkemman analyysin ja henkilökohtaiset suositukset keskustelun aikana.
          </p>
        </div>
      </div>
    </Card>
  );
}

