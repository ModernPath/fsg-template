'use client';

import React, { useState, useRef } from 'react';
import { ArrowUpIcon, ArrowDownIcon, ChartBarIcon, BanknotesIcon, PresentationChartLineIcon, PrinterIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import FinancialSummaryCard from './FinancialSummaryCard';
import FinancialChartsDisplay from '@/components/financial/FinancialChartsDisplay';
import type { YearlyFinancialData, CurrentFinancialRatios } from '@/components/financial/FinancialChartsDisplay';
import FinancialDataTransparency from '@/components/financial/FinancialDataTransparency';

interface RecommendationDetail {
  type?: string;
  details?: string;
  suitability_rationale?: string;
  amount_suggestion?: number;
}

interface Recommendation {
  id: string;
  summary?: string | null;
  analysis?: string | null;
  recommendation_details?: RecommendationDetail[] | null;
  action_plan?: string | null;
  outlook?: string | null;
}

interface FullAnalysisViewProps {
  recommendation: Recommendation;
  companyName: string;
  yearlyFinancialData?: YearlyFinancialData[];
  latestFinancialRatios?: CurrentFinancialRatios;
  locale?: string;
  currency?: string;
  financialTransparency?: {
    confidence: number | null;
    sources: string[] | null;
    dataSource: string | null;
    lastUpdated: string | null;
  } | null;
}

const FullAnalysisView: React.FC<FullAnalysisViewProps> = ({ 
  recommendation, 
  companyName, 
  yearlyFinancialData = [], 
  latestFinancialRatios = {},
  locale = 'fi',
  currency = 'EUR',
  financialTransparency = null
}) => {
  const chartsRef = useRef<HTMLDivElement>(null);

  // Lasketaan oikeat talousluvut saatavilla olevasta datasta
  const calculateFinancialMetrics = () => {
    const latestYear = yearlyFinancialData[yearlyFinancialData.length - 1];
    const previousYear = yearlyFinancialData[yearlyFinancialData.length - 2];
    
    let revenueGrowth = null;
    let profitMargin = null;
    let latestRevenue = 0;

    // Vain jos on kahden vuoden data
    if (latestYear?.revenue && previousYear?.revenue && latestYear.revenue > 0 && previousYear.revenue > 0) {
      revenueGrowth = ((latestYear.revenue - previousYear.revenue) / previousYear.revenue) * 100;
      latestRevenue = latestYear.revenue;
    } else if (latestYear?.revenue) {
      latestRevenue = latestYear.revenue;
    }

    // Käyttökate (EBITDA margin) prosenttina liikevaihdosta
    if (latestYear?.ebitda && latestYear?.revenue && latestYear.revenue > 0) {
      profitMargin = (latestYear.ebitda / latestYear.revenue) * 100;
    }

    // Käytetään sekä ROE:ta että Current Ratioa jos saatavilla
    const roe = latestFinancialRatios.roe || latestYear?.roe || null;
    const currentRatio = latestFinancialRatios.currentRatio || null;

    return {
      revenueGrowth: revenueGrowth !== null ? Number(revenueGrowth.toFixed(1)) : null,
      profitMargin: profitMargin !== null ? Number(profitMargin.toFixed(1)) : null,
      roe: roe !== null ? Number(roe.toFixed(1)) : null,
      currentRatio: currentRatio !== null ? Number(currentRatio.toFixed(2)) : null,
      latestRevenue
    };
  };

  const financialMetrics = calculateFinancialMetrics();
  const t = useTranslations('Onboarding');

  // Funktio trendin määrittämiseen
  const getTrendInfo = (value: number | null, type: 'revenue' | 'profit' | 'roe' | 'currentRatio') => {
    if (value === null || value === undefined) {
      return {
        icon: null,
        text: 'Ei dataa saatavilla',
        color: 'text-gray-400',
        show: false
      };
    }

    switch (type) {
      case 'revenue':
        if (value > 0) {
          return {
            icon: 'up',
            text: 'Positiivinen trendi',
            color: 'text-green-400',
            show: true
          };
        } else {
          return {
            icon: 'down',
            text: 'Negatiivinen trendi',
            color: 'text-red-400',
            show: true
          };
        }
      
      case 'profit':
        if (value > 15) {
          return {
            icon: 'up',
            text: 'Hyvä kannattavuus',
            color: 'text-green-400',
            show: true
          };
        } else if (value > 0) {
          return {
            icon: 'up',
            text: 'Kohtalainen',
            color: 'text-amber-400',
            show: true
          };
        } else {
          return {
            icon: 'down',
            text: 'Parannettavissa',
            color: 'text-red-400',
            show: true
          };
        }
      
      case 'roe':
        if (value > 10) {
          return {
            icon: 'trend',
            text: 'Hyvä tuotto',
            color: 'text-green-400',
            show: true
          };
        } else if (value > 5) {
          return {
            icon: 'trend',
            text: 'Kohtalainen tuotto',
            color: 'text-amber-400',
            show: true
          };
        } else if (value > 0) {
          return {
            icon: 'down',
            text: 'Heikko tuotto',
            color: 'text-red-400',
            show: true
          };
        } else {
          return {
            icon: 'down',
            text: 'Negatiivinen tuotto',
            color: 'text-red-400',
            show: true
          };
        }

      case 'currentRatio':
        if (value >= 2) {
          return {
            icon: 'up',
            text: 'Hyvä maksuvalmius',
            color: 'text-green-400',
            show: true
          };
        } else if (value >= 1) {
          return {
            icon: 'trend',
            text: 'Riittävä maksuvalmius',
            color: 'text-amber-400',
            show: true
          };
        } else {
          return {
            icon: 'down',
            text: 'Heikko maksuvalmius',
            color: 'text-red-400',
            show: true
          };
        }
      
      default:
        return {
          icon: null,
          text: 'Ei dataa',
          color: 'text-gray-400',
          show: false
        };
    }
  };

  // Hakee trend-ikonin komponentin
  const getTrendIcon = (iconType: string | null) => {
    switch (iconType) {
      case 'up':
        return <ArrowUpIcon className="h-4 w-4 mr-1" />;
      case 'down':
        return <ArrowDownIcon className="h-4 w-4 mr-1" />;
      case 'trend':
        return <TrendingUp className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };

  // Funktio rahoitustyyppien kääntämiseen
  const translateFundingType = (type: string) => {
    return t(`recommendationType.${type}`, { default: type?.replace(/_/g, ' ') || 'Suositus' });
  };

  // Staattinen käännösmappaus PDF:ää varten
  const fundingTypeTranslations: { [key: string]: string } = {
    'bank_loan': 'Pankkilaina',
    'government_grant': 'Valtionavustus',
    'unknown': 'Muu/Määrittämätön',
    'credit_line': 'Luottolimiitti',
    'factoring_ar': 'Laskurahoitus (Myyntisaamiset)',
    'business_loan': 'Yrityslaina',
    'business_loan_unsecured': 'Yrityslaina (vakuudeton)',
    'business_loan_secured': 'Yrityslaina (vakuudellinen)',
    'leasing': 'Leasing',
    'bank_guarantee': 'Pankkitakaus',
    'crowdfunding': 'Joukkorahoitus',
    'refinancing': 'Uudelleenrahoitus',
    'equity_financing': 'Oman pääoman ehtoinen rahoitus',
    'invoice_financing': 'Laskurahoitus',
    'venture_capital': 'Pääomasijoitus',
    'r_d_financing': 'T&K-rahoitus'
  };

  const translateFundingTypeStatic = (type: string) => {
    return fundingTypeTranslations[type] || type?.replace(/_/g, ' ') || 'Suositus';
  };

  // Funktio kaavioiden muuntamiseksi kuviksi tulostusta varten
  const captureChartsAsImages = async (): Promise<{ [key: string]: string }> => {
    if (!chartsRef.current) return {};
    
    try {
      // Tarkista onko html2canvas käytettävissä
      if (typeof window === 'undefined') return {};
      
      const html2canvas = (await import('html2canvas')).default;
      const chartsImages: { [key: string]: string } = {};
      
      // Etsi kaikki kaavioelementit käyttämällä chart-wrapper luokkaa
      const chartElements = chartsRef.current.querySelectorAll('.chart-wrapper[data-chart-key]');
      
      for (let i = 0; i < chartElements.length; i++) {
        const element = chartElements[i] as HTMLElement;
        const chartKey = element.getAttribute('data-chart-key');
        const chartTitle = element.getAttribute('data-chart-title') || chartKey || 'Tuntematon kaavio';
        
        if (chartKey) {
          try {
            const canvas = await html2canvas(element, {
              backgroundColor: '#2A2A2A',
              scale: 2,
              useCORS: true,
              allowTaint: true,
              logging: false
            } as any);
            
            chartsImages[chartTitle] = canvas.toDataURL('image/png');
          } catch (error) {
            console.warn(`Kaavion ${chartTitle} tallentaminen epäonnistui:`, error);
          }
        }
      }
      
      return chartsImages;
    } catch (error) {
      console.error('Kaavioiden tallentaminen epäonnistui:', error);
      return {};
    }
  };

  // PDF-tulostustoiminnot
  const generatePDF = async () => {
    try {
      // Tallenna kaaviot kuviksi
      const chartImages = await captureChartsAsImages();
      
      // Lasketaan arvot ennen template literalia
      const revenueGrowthValue = financialMetrics.revenueGrowth;
      const profitMarginValue = financialMetrics.profitMargin;
      const currentRatioValue = financialMetrics.currentRatio;
      const roeValue = financialMetrics.roe;
      
      // Valmistele talousluvut template stringiä varten
      const financialDataForPdf = yearlyFinancialData || [];
      const ratiosForPdf = latestFinancialRatios || {};
      
      // Luo graafikuvat HTML:ään
      const chartImagesHtml = Object.entries(chartImages).map(([key, imageData]) => `
        <div style="margin: 10px; page-break-inside: avoid; display: inline-block; width: 300px; vertical-align: top;">
          <h4 style="color: #d4af37; margin-bottom: 5px; font-size: 14px;">${key}</h4>
          <img src="${imageData}" alt="${key} chart" style="width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px;">
        </div>
      `).join('');
      
      // Käytetään browser-pohjaista PDF-generointia
      const printContent = document.createElement('div');
      printContent.innerHTML = `
        <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: white; min-height: 100vh; padding: 0;">
          <!-- Header Section -->
          <div style="background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); padding: 40px 20px; text-align: center; margin-bottom: 0;">
            <h1 style="font-size: 32px; font-weight: 700; margin: 0 0 10px 0; color: #1a1a1a; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">${companyName}</h1>
            <h2 style="font-size: 20px; font-weight: 500; margin: 0 0 15px 0; color: #2d2d2d; letter-spacing: 0.5px;">LAAJA RAHOITUSANALYYSI</h2>
            <div style="width: 60px; height: 3px; background: #1a1a1a; margin: 20px auto; border-radius: 2px;"></div>
            <p style="font-size: 14px; color: #444; margin: 0; font-weight: 500;">Luotu: ${new Date().toLocaleDateString('fi-FI')}</p>
          </div>
          
                     <!-- Main Content -->
           <div style="padding: 40px 20px;">
          
                      <div style="margin-bottom: 40px;">
            <h2 style="color: #d4af37; font-size: 24px; margin-bottom: 20px; font-weight: 600;">Yhteenveto</h2>
            <p style="line-height: 1.8; margin-bottom: 30px; color: #e0e0e0; font-size: 16px;">${recommendation.summary || 'Ei yhteenvetoa saatavilla.'}</p>
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 30px;">
              ${revenueGrowthValue !== null ? `
              <div style="background: linear-gradient(135deg, #374151 0%, #4b5563 100%); border: 1px solid #6b7280; padding: 24px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <h3 style="margin: 0 0 12px 0; color: #d4af37; font-size: 16px; font-weight: 600;">Liikevaihdon kasvu</h3>
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <p style="font-size: 32px; font-weight: 700; margin: 0; color: ${revenueGrowthValue > 0 ? '#10b981' : '#ef4444'};">${revenueGrowthValue}%</p>
                  <span style="margin-left: 8px; color: ${revenueGrowthValue > 0 ? '#10b981' : '#ef4444'}; font-size: 20px;">${revenueGrowthValue > 0 ? '↗' : '↘'}</span>
                </div>
                <p style="margin: 0; color: #9ca3af; font-size: 14px; font-weight: 500;">${revenueGrowthValue > 0 ? 'Positiivinen trendi' : 'Negatiivinen trendi'}</p>
              </div>` : ''}
              ${profitMarginValue !== null ? `
              <div style="background: linear-gradient(135deg, #374151 0%, #4b5563 100%); border: 1px solid #6b7280; padding: 24px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <h3 style="margin: 0 0 12px 0; color: #d4af37; font-size: 16px; font-weight: 600;">Kulutaso</h3>
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <p style="font-size: 32px; font-weight: 700; margin: 0; color: ${profitMarginValue > 15 ? '#10b981' : profitMarginValue > 0 ? '#f59e0b' : '#ef4444'};">${profitMarginValue}%</p>
                  <span style="margin-left: 8px; color: ${profitMarginValue > 15 ? '#10b981' : profitMarginValue > 0 ? '#f59e0b' : '#ef4444'}; font-size: 20px;">${profitMarginValue > 15 ? '↗' : profitMarginValue > 0 ? '→' : '↘'}</span>
                </div>
                <p style="margin: 0; color: #9ca3af; font-size: 14px; font-weight: 500;">${profitMarginValue > 15 ? 'Hyvä kannattavuus' : profitMarginValue > 0 ? 'Kohtalainen' : 'Parannettavissa'}</p>
              </div>` : ''}
              ${currentRatioValue !== null ? `
              <div style="background: linear-gradient(135deg, #374151 0%, #4b5563 100%); border: 1px solid #6b7280; padding: 24px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <h3 style="margin: 0 0 12px 0; color: #d4af37; font-size: 16px; font-weight: 600;">Maksuvalmius</h3>
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <p style="font-size: 32px; font-weight: 700; margin: 0; color: ${currentRatioValue >= 2 ? '#10b981' : currentRatioValue >= 1 ? '#f59e0b' : '#ef4444'};">${currentRatioValue.toFixed(2)}</p>
                  <span style="margin-left: 8px; color: ${currentRatioValue >= 2 ? '#10b981' : currentRatioValue >= 1 ? '#f59e0b' : '#ef4444'}; font-size: 20px;">${currentRatioValue >= 2 ? '↗' : currentRatioValue >= 1 ? '→' : '↘'}</span>
                </div>
                <p style="margin: 0; color: #9ca3af; font-size: 14px; font-weight: 500;">${currentRatioValue >= 2 ? 'Hyvä maksuvalmius' : currentRatioValue >= 1 ? 'Riittävä maksuvalmius' : 'Heikko maksuvalmius'}</p>
              </div>` : ''}

              ${revenueGrowthValue === null && profitMarginValue === null && currentRatioValue === null ? `
              <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #999;">
                <p>Taloudellisia tunnuslukuja ei ole saatavilla analysoitavasta datasta.</p>
              </div>` : ''}
            </div>
          </div>

          ${recommendation.analysis ? `
          <div style="margin-bottom: 30px;">
            <h2 style="color: #d4af37; font-size: 20px; margin-bottom: 15px;">Analyysi</h2>
            <div style="line-height: 1.6; margin-bottom: 20px;">${recommendation.analysis}</div>
          </div>
          ` : ''}

          ${chartImagesHtml ? `
          <div style="margin-bottom: 30px; page-break-inside: avoid;">
            <h2 style="color: #d4af37; font-size: 20px; margin-bottom: 15px;">Taloudelliset kaaviot</h2>
            <div class="charts-container">
              ${chartImagesHtml}
            </div>
          </div>
          ` : ''}
          
          <div style="margin-bottom: 30px;">
            <h2 style="color: #d4af37; font-size: 20px; margin-bottom: 15px;">Taloudelliset tunnusluvut</h2>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 20px;">
              ${financialDataForPdf.map((data, index) => `
                <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px;">
                  <h3 style="margin: 0 0 10px 0; color: #d4af37;">Vuosi ${data.fiscal_year}</h3>
                  ${data.revenue ? `<p style="margin: 5px 0;"><strong>Liikevaihto:</strong> ${data.revenue.toLocaleString()} €</p>` : ''}
                  ${data.ebitda ? `<p style="margin: 5px 0;"><strong>Käyttökate (EBITDA):</strong> ${data.ebitda.toLocaleString()} €</p>` : ''}
                  ${data.roe ? `<p style="margin: 5px 0;"><strong>ROE:</strong> ${data.roe.toFixed(1)}%</p>` : ''}
                  ${data.debtToEquity ? `<p style="margin: 5px 0;"><strong>Velkaantumisaste:</strong> ${data.debtToEquity.toFixed(2)}</p>` : ''}
                  ${data.totalAssets ? `<p style="margin: 5px 0;"><strong>Varat yhteensä:</strong> ${data.totalAssets.toLocaleString()} €</p>` : ''}
                  ${data.totalEquity ? `<p style="margin: 5px 0;"><strong>Oma pääoma:</strong> ${data.totalEquity.toLocaleString()} €</p>` : ''}
                  ${data.cashAndReceivables ? `<p style="margin: 5px 0;"><strong>Rahat ja saamiset:</strong> ${data.cashAndReceivables.toLocaleString()} €</p>` : ''}
                  ${data.dso ? `<p style="margin: 5px 0;"><strong>DSO:</strong> ${data.dso} päivää</p>` : ''}
                </div>
              `).join('')}
            </div>
            ${Object.keys(ratiosForPdf).length > 0 ? `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
              <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px;">
                <h3 style="margin: 0 0 10px 0; color: #d4af37;">Viimeisimmät tunnusluvut</h3>
                ${ratiosForPdf.currentRatio ? `<p style="margin: 5px 0;"><strong>Current Ratio:</strong> ${ratiosForPdf.currentRatio.toFixed(2)}</p>` : ''}
                ${ratiosForPdf.quickRatio ? `<p style="margin: 5px 0;"><strong>Quick Ratio:</strong> ${ratiosForPdf.quickRatio.toFixed(2)}</p>` : ''}
                ${ratiosForPdf.debtToEquity ? `<p style="margin: 5px 0;"><strong>Velkaantumisaste:</strong> ${ratiosForPdf.debtToEquity.toFixed(2)}</p>` : ''}
                ${ratiosForPdf.roe ? `<p style="margin: 5px 0;"><strong>ROE:</strong> ${ratiosForPdf.roe.toFixed(1)}%</p>` : ''}
              </div>
            </div>
            ` : ''}
          </div>

          <div style="margin-bottom: 30px;">
            <h2 style="color: #d4af37; font-size: 20px; margin-bottom: 15px;">Rahoitussuositukset</h2>
            ${recommendation.recommendation_details && recommendation.recommendation_details.length > 0 ? 
              recommendation.recommendation_details.map((detail, index) => `
                <div style="border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 8px;">
                  <h3 style="margin: 0 0 10px 0; color: #d4af37;">${fundingTypeTranslations[detail.type || 'unknown'] || detail.type || 'Tuntematon'}</h3>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                      <h4 style="margin: 0 0 5px 0; color: #333;">Kuvaus</h4>
                      <p style="margin: 0; line-height: 1.4;">${detail.details || 'Ei kuvausta saatavilla'}</p>
                    </div>
                    <div>
                      <h4 style="margin: 0 0 5px 0; color: #333;">Soveltuvuus</h4>
                      <p style="margin: 0; line-height: 1.4;">${detail.suitability_rationale || 'Ei soveltuvuusarviota saatavilla'}</p>
                      ${detail.amount_suggestion ? `<p style="margin: 10px 0 0 0; font-weight: bold; color: #d4af37;">Suositeltu määrä: ${detail.amount_suggestion.toLocaleString()} €</p>` : ''}
                    </div>
                  </div>
                </div>
              `).join('') : 
              '<p>Ei rahoitussuosituksia saatavilla.</p>'
            }
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px;">
              <h2 style="color: #d4af37; font-size: 18px; margin-bottom: 15px;">Toimintasuunnitelma</h2>
              <p style="line-height: 1.6; margin: 0;">${recommendation.action_plan || 'Ei toimintasuunnitelmaa saatavilla.'}</p>
            </div>
            <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px;">
              <h2 style="color: #d4af37; font-size: 18px; margin-bottom: 15px;">Tulevaisuuden näkymät</h2>
              <p style="line-height: 1.6; margin: 0;">${recommendation.outlook || 'Ei tulevaisuuden näkymiä saatavilla.'}</p>
            </div>
          </div>

          <!-- Footer -->
          <div style="margin-top: 60px; padding: 30px 0; text-align: center; border-top: 1px solid #4b5563;">
            <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 14px; font-weight: 500;">Tämä analyysi on luotu FSG Trusty Finance -palvelulla</p>
            <p style="margin: 0; color: #6b7280; font-size: 12px;">© ${new Date().getFullYear()} FSG Financial Services Group Oy</p>
          </div>
          
          </div> <!-- Close main content -->
        </div> <!-- Close main container -->
      `;

      // Avaa uusi ikkuna tulostusta varten
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${companyName} - Laaja Rahoitusanalyysi</title>
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                
                * { box-sizing: border-box; }
                
                body { 
                  margin: 0; 
                  padding: 0;
                  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
                }
                
                @media print {
                  .no-print { display: none; }
                  img { page-break-inside: avoid; }
                  .chart-container { page-break-inside: avoid; }
                  .charts-container { display: flex; flex-wrap: wrap; justify-content: flex-start; }
                  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
                
                .charts-container { 
                  display: flex; 
                  flex-wrap: wrap; 
                  justify-content: flex-start; 
                  align-items: flex-start; 
                  gap: 20px;
                }
                
                .summary-card {
                  background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
                  border: 1px solid #6b7280;
                  border-radius: 12px;
                  padding: 24px;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        
        // Odota hetki että sisältö latautuu ja avaa tulostusikkuna
        setTimeout(() => {
          printWindow.print();
        }, 1000);
      }
    } catch (error) {
      console.error('PDF-generointi epäonnistui:', error);
      alert('PDF-tiedoston luominen epäonnistui. Yritä uudelleen.');
    }
  };

  const downloadPDF = async () => {
    try {
      // Tallenna kaaviot kuviksi
      const chartImages = await captureChartsAsImages();
      
      // Lasketaan arvot ennen template literalia
      const revenueGrowthValue = financialMetrics.revenueGrowth;
      const profitMarginValue = financialMetrics.profitMargin;
      const currentRatioValue = financialMetrics.currentRatio;
      const roeValue = financialMetrics.roe;
      
      // Valmistele talousluvut template stringiä varten
      const financialDataForPdf = yearlyFinancialData || [];
      const ratiosForPdf = latestFinancialRatios || {};
      
      // Luo graafikuvat HTML:ään
      const chartImagesHtml = Object.entries(chartImages).map(([key, imageData]) => `
        <div style="margin: 10px; page-break-inside: avoid; display: inline-block; width: 300px; vertical-align: top;">
          <h4 style="color: #d4af37; margin-bottom: 5px; font-size: 14px;">${key}</h4>
          <img src="${imageData}" alt="${key} chart" style="width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px;">
        </div>
      `).join('');
      
      // Luodaan blob HTML-sisällöstä ja ladataan se
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>${companyName} - Laaja Rahoitusanalyysi</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
              h1 { color: #d4af37; text-align: center; }
              h2 { color: #d4af37; border-bottom: 2px solid #d4af37; padding-bottom: 5px; }
              .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
              .financial-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
              .card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
              .recommendation { border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 8px; }
              .recommendation-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
              .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #666; }
              .charts-container { display: flex; flex-wrap: wrap; justify-content: flex-start; align-items: flex-start; }
              @media print {
                img { page-break-inside: avoid; }
                .chart-container { page-break-inside: avoid; }
                .charts-container { display: flex; flex-wrap: wrap; justify-content: flex-start; }
              }
            </style>
          </head>
          <body>
            <h1>${companyName}</h1>
            <h2>LAAJA RAHOITUSANALYYSI</h2>
            <p><strong>Luotu:</strong> ${new Date().toLocaleDateString('fi-FI')}</p>
            
            <h2>Yhteenveto</h2>
            <p>${recommendation.summary || 'Ei yhteenvetoa saatavilla.'}</p>
            
            <div class="summary-grid">
              <div class="card">
                <h3>Liikevaihdon kasvu</h3>
                <h2 style="color: #4ade80; margin: 10px 0;">${revenueGrowthValue}%</h2>
                <p>Positiivinen trendi</p>
              </div>
              <div class="card">
                <h3>Kulutaso</h3>
                <h2 style="color: #f59e0b; margin: 10px 0;">${profitMarginValue}%</h2>
                <p>Vähennettävissä</p>
              </div>
              <div class="card">
                <h3>Maksuvalmius</h3>
                                  <h2 style="color: #4ade80; margin: 10px 0;">${currentRatioValue?.toFixed(2) || 'N/A'}</h2>
                <p>Kasvussa</p>
              </div>
            </div>

            ${recommendation.analysis ? `
            <h2>Analyysi</h2>
            <div>${recommendation.analysis}</div>
            ` : ''}

            ${chartImagesHtml ? `
            <h2>Taloudelliset kaaviot</h2>
            <div class="charts-container">
              ${chartImagesHtml}
            </div>
            ` : ''}

            ${(financialDataForPdf.length > 0 || Object.keys(ratiosForPdf).length > 0) ? `
            <h2>Taloudelliset tunnusluvut</h2>
            <div class="financial-grid">
              ${financialDataForPdf.map((data, index) => `
                <div class="card">
                  <h3>Vuosi ${data.fiscal_year}</h3>
                  ${data.revenue ? `<p><strong>Liikevaihto:</strong> ${data.revenue.toLocaleString()} €</p>` : ''}
                  ${data.ebitda ? `<p><strong>Käyttökate (EBITDA):</strong> ${data.ebitda.toLocaleString()} €</p>` : ''}
                  ${data.roe ? `<p><strong>ROE:</strong> ${data.roe.toFixed(1)}%</p>` : ''}
                  ${data.debtToEquity ? `<p><strong>Velkaantumisaste:</strong> ${data.debtToEquity.toFixed(2)}</p>` : ''}
                  ${data.totalAssets ? `<p><strong>Varat yhteensä:</strong> ${data.totalAssets.toLocaleString()} €</p>` : ''}
                  ${data.totalEquity ? `<p><strong>Oma pääoma:</strong> ${data.totalEquity.toLocaleString()} €</p>` : ''}
                  ${data.cashAndReceivables ? `<p><strong>Rahat ja saamiset:</strong> ${data.cashAndReceivables.toLocaleString()} €</p>` : ''}
                  ${data.dso ? `<p><strong>DSO:</strong> ${data.dso} päivää</p>` : ''}
                </div>
              `).join('')}
            </div>
            ${Object.keys(ratiosForPdf).length > 0 ? `
            <div class="card">
              <h3>Viimeisimmät tunnusluvut</h3>
              ${ratiosForPdf.currentRatio ? `<p><strong>Current Ratio:</strong> ${ratiosForPdf.currentRatio.toFixed(2)}</p>` : ''}
              ${ratiosForPdf.quickRatio ? `<p><strong>Quick Ratio:</strong> ${ratiosForPdf.quickRatio.toFixed(2)}</p>` : ''}
              ${ratiosForPdf.debtToEquity ? `<p><strong>Velkaantumisaste:</strong> ${ratiosForPdf.debtToEquity.toFixed(2)}</p>` : ''}
              ${ratiosForPdf.roe ? `<p><strong>ROE:</strong> ${ratiosForPdf.roe.toFixed(1)}%</p>` : ''}
            </div>
            ` : ''}
            ` : ''}

            <h2>Rahoitussuositukset</h2>
            ${recommendation.recommendation_details && recommendation.recommendation_details.length > 0 ? 
              recommendation.recommendation_details.map((detail, index) => `
                <div class="recommendation">
                  <h3>${fundingTypeTranslations[detail.type || 'unknown'] || detail.type || 'Tuntematon'}</h3>
                  <div class="recommendation-grid">
                    <div>
                      <h4>Kuvaus</h4>
                      <p>${detail.details || 'Ei kuvausta saatavilla'}</p>
                    </div>
                    <div>
                      <h4>Soveltuvuus</h4>
                      <p>${detail.suitability_rationale || 'Ei soveltuvuusarviota saatavilla'}</p>
                      ${detail.amount_suggestion ? `<p><strong>Suositeltu määrä: ${detail.amount_suggestion.toLocaleString()} €</strong></p>` : ''}
                    </div>
                  </div>
                </div>
              `).join('') : 
              '<p>Ei rahoitussuosituksia saatavilla.</p>'
            }

            <h2>Toimintasuunnitelma</h2>
            <p>${recommendation.action_plan || 'Ei toimintasuunnitelmaa saatavilla.'}</p>

            <h2>Tulevaisuuden näkymät</h2>
            <p>${recommendation.outlook || 'Ei tulevaisuuden näkymiä saatavilla.'}</p>

            <div class="footer">
              <p>Tämä analyysi on luotu FSG Trusty Finance -palvelulla</p>
              <p>© ${new Date().getFullYear()} FSG Financial Services Group Oy</p>
            </div>
          </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${companyName.replace(/[^a-zA-Z0-9äöåÄÖÅ]/g, '_')}_laaja_rahoitusanalyysi_${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Lataus epäonnistui:', error);
      alert('Tiedoston lataaminen epäonnistui. Yritä uudelleen.');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 bg-black/90 min-h-screen">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gold-primary mb-2">{companyName}</h1>
        <p className="text-gray-light">LAAJA RAHOITUSANALYYSI</p>
        
        {/* Tulostus- ja latauspainikkeet */}
        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={generatePDF}
            className="flex items-center gap-2 bg-gold-primary text-black px-6 py-3 rounded-lg font-medium hover:bg-gold-highlight transition-colors"
          >
            <PrinterIcon className="h-5 w-5" />
            Tulosta PDF
          </button>
          <button
            onClick={downloadPDF}
            className="flex items-center gap-2 bg-gray-dark text-gold-primary border border-gold-primary px-6 py-3 rounded-lg font-medium hover:bg-gold-primary hover:text-black transition-colors"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            Lataa analyysi
          </button>
        </div>
      </div>

      {/* Yhteenveto-osio */}
      <div className="mb-12 bg-gray-very-dark p-6 rounded-lg border border-gray-dark shadow-md">
        <h2 className="text-xl font-bold mb-4 text-gold-primary">Yhteenveto</h2>
        <p className="text-gray-light mb-6">{recommendation.summary || 'Ei yhteenvetoa saatavilla.'}</p>
        
        {/* Avainluvut */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {financialMetrics.revenueGrowth !== null && (
            <FinancialSummaryCard
              title="Liikevaihdon kasvu"
              value={financialMetrics.revenueGrowth}
              valueSuffix="%"
              highlight
            >
              {(() => {
                const trend = getTrendInfo(financialMetrics.revenueGrowth, 'revenue');
                return (
                  <div className={`flex items-center ${trend.color}`}>
                    {getTrendIcon(trend.icon)}
                    <span className="text-sm">{trend.text}</span>
                  </div>
                );
              })()}
            </FinancialSummaryCard>
          )}
          
          {financialMetrics.profitMargin !== null && (
            <FinancialSummaryCard
              title="Kulutaso"
              value={financialMetrics.profitMargin}
              valueSuffix="%"
            >
              {(() => {
                const trend = getTrendInfo(financialMetrics.profitMargin, 'profit');
                return (
                  <div className={`flex items-center ${trend.color}`}>
                    {getTrendIcon(trend.icon)}
                    <span className="text-sm">{trend.text}</span>
                  </div>
                );
              })()}
            </FinancialSummaryCard>
          )}
          
          {financialMetrics.currentRatio !== null && (
                         <FinancialSummaryCard
               title="Maksuvalmius"
               value={financialMetrics.currentRatio}
               valueSuffix=""
             >
              {(() => {
                const trend = getTrendInfo(financialMetrics.currentRatio, 'currentRatio');
                return trend.show ? (
                  <div className={`mt-2 flex items-center text-sm ${trend.color}`}>
                    {getTrendIcon(trend.icon)}
                    <span>{trend.text}</span>
                  </div>
                                 ) : null;
               })()}
             </FinancialSummaryCard>
          )}

          

          {/* Näytä "Ei dataa saatavilla" -viesti jos kaikki arvot ovat null */}
                  {financialMetrics.revenueGrowth === null && 
         financialMetrics.profitMargin === null && 
         financialMetrics.currentRatio === null && (
            <div className="col-span-full bg-gray-very-dark rounded-lg p-8 border border-gray-dark text-center">
              <p className="text-gray-light">Taloudellisia tunnuslukuja ei ole saatavilla analysoitavasta datasta.</p>
            </div>
          )}
        </div>
      </div>

      {/* Analyysi-osio */}
      {recommendation.analysis && (
        <div className="mb-12 bg-gray-very-dark p-6 rounded-lg border border-gray-dark shadow-md">
          <h2 className="text-xl font-bold mb-4 text-gold-primary">Analyysi</h2>
          <div className="text-gray-light prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: recommendation.analysis }} />
        </div>
      )}

      {/* Taloudelliset tunnusluvut */}
      {(yearlyFinancialData.length > 0 || Object.keys(latestFinancialRatios).length > 0) && (
        <div className="mb-12" ref={chartsRef}>
          {(() => {
            // Filter out null/undefined values from latestRatios
            const filteredRatios: CurrentFinancialRatios = {};
            Object.entries(latestFinancialRatios).forEach(([key, value]) => {
              if (value !== null && value !== undefined && value !== '') {
                (filteredRatios as any)[key] = value;
              }
            });

            // Filter yearlyData to only include years with actual data
            const filteredYearlyData = yearlyFinancialData.filter(yearData => 
              Object.values(yearData).some(value => value !== null && value !== undefined && value !== '')
            );

            const allCharts = [
              { key: 'revenue' as const, type: 'bar' as const, titleKey: 'revenueTitle' },
              { key: 'ebitda' as const, type: 'bar' as const, titleKey: 'ebitdaTitle' },
                      { key: 'currentRatio' as const, type: 'gauge' as const, titleKey: 'currentRatioTitle' },
        { key: 'debtToEquity' as const, type: 'bar' as const, titleKey: 'debtToEquityTitle' },
              { key: 'quickRatio' as const, type: 'gauge' as const, titleKey: 'quickRatioTitle' },
              { key: 'totalAssets' as const, type: 'bar' as const, titleKey: 'totalAssetsTitle' }, 
              { key: 'equityAndAssetsCombo' as const, type: 'combo' as const, titleKey: 'equityAndAssetsComboTitle' },
              { key: 'cashAndReceivables' as const, type: 'line' as const, titleKey: 'cashAndReceivablesTitle' },
              { key: 'dso' as const, type: 'line' as const, titleKey: 'dsoTitle' },
              { key: 'roe' as const, type: 'bar' as const, titleKey: 'roeTitle' },
            ];

            const filteredCharts = allCharts.filter(chart => {
              // Show chart only if there's data for it
              if (chart.key === 'currentRatio' || chart.key === 'quickRatio') {
                return filteredRatios[chart.key as keyof CurrentFinancialRatios] !== undefined;
              }
              return filteredYearlyData.some(data => (data as any)[chart.key] !== null && (data as any)[chart.key] !== undefined);
            });

            return (
              <FinancialChartsDisplay
                title="Taloudelliset tunnusluvut"
                yearlyData={filteredYearlyData}
                latestRatios={filteredRatios}
                isLoading={false}
                error={null}
                locale={locale}
                currency={currency}
                defaultChartsToShow={9}
                chartHeight={250}
                chartKeysAndTypes={filteredCharts}
              />
            );
          })()}
          
          {/* Financial Data Transparency */}
          {financialTransparency && (
            <div className="mt-6">
              <FinancialDataTransparency
                confidence={financialTransparency.confidence}
                sources={financialTransparency.sources}
                dataSource={financialTransparency.dataSource}
                lastUpdated={financialTransparency.lastUpdated}
                compact={false}
              />
            </div>
          )}
        </div>
      )}

      {/* Rahoitussuositukset */}
      <div className="mb-12 bg-gray-very-dark p-6 rounded-lg border border-gray-dark shadow-md">
        <h2 className="text-xl font-bold mb-4 text-gold-primary">Rahoitussuositukset</h2>
        
        {recommendation.recommendation_details && recommendation.recommendation_details.length > 0 ? (
          <div className="space-y-6">
            {recommendation.recommendation_details.map((detail, index) => {
              const typeKey = detail.type || 'unknown';
              const translatedType = translateFundingType(typeKey);
              
              return (
                <div key={index} className="border border-gray-dark rounded-lg p-4 bg-black/30">
                  <div className="flex items-center mb-3">
                    <BanknotesIcon className="h-5 w-5 text-gold-primary mr-2" />
                    <h3 className="text-lg font-medium text-gold-secondary">{translatedType}</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-light mb-1">Kuvaus</h4>
                      <p className="text-sm text-white">{detail.details || 'Ei kuvausta saatavilla'}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-light mb-1">Soveltuvuus</h4>
                      <p className="text-sm text-white">{detail.suitability_rationale || 'Ei soveltuvuusarviota saatavilla'}</p>
                      
                      {detail.amount_suggestion && (
                        <div className="mt-3 flex items-baseline">
                          <span className="text-sm text-gray-light mr-2">Suositeltu määrä:</span>
                          <span className="text-lg font-medium text-gold-primary">{detail.amount_suggestion.toLocaleString()} €</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-light">Ei rahoitussuosituksia saatavilla.</p>
        )}
      </div>

      {/* Toimintasuunnitelma ja tulevaisuuden näkymät */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-very-dark p-6 rounded-lg border border-gray-dark shadow-md">
          <div className="flex items-center mb-4">
            <ChartBarIcon className="h-5 w-5 text-gold-primary mr-2" />
            <h2 className="text-xl font-bold text-gold-primary">Toimintasuunnitelma</h2>
          </div>
          <p className="text-gray-light">{recommendation.action_plan || 'Ei toimintasuunnitelmaa saatavilla.'}</p>
        </div>
        
        <div className="bg-gray-very-dark p-6 rounded-lg border border-gray-dark shadow-md">
          <div className="flex items-center mb-4">
            <PresentationChartLineIcon className="h-5 w-5 text-gold-primary mr-2" />
            <h2 className="text-xl font-bold text-gold-primary">Tulevaisuuden näkymät</h2>
          </div>
          <p className="text-gray-light">{recommendation.outlook || 'Ei tulevaisuuden näkymiä saatavilla.'}</p>
        </div>
      </div>
    </div>
  );
};

export default FullAnalysisView; 