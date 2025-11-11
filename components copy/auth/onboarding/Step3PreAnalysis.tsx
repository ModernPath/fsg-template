'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { 
  Building2 as BuildingOffice2Icon, 
  CheckCircle as CheckCircleIcon, 
  ChevronRight as ChevronRightIcon,
  FileText as DocumentTextIcon,
  Calendar as CalendarIcon,
  Users as UsersIcon,
  Euro as CurrencyEuroIcon,
  BarChart3 as ChartBarIcon,
  Banknote as BanknotesIcon,
  Scale as ScaleIcon,
  TrendingUp as ArrowTrendingUpIcon,
  TrendingDown as ArrowTrendingDownIcon,
  Star as StarIcon,
  CreditCard as CreditCardIcon,
  Clock as ClockIcon,
  Truck as TruckIcon,
  Monitor as ComputerDesktopIcon,
  ClipboardList as ClipboardDocumentListIcon,
  Plus as PlusIcon,
  Info as InformationCircleIcon
} from 'lucide-react';
import { getCurrencyCode, formatCurrency as formatCurrencyUtils } from '@/lib/utils/currency-utils';

interface Step3PreAnalysisProps {
  loading: boolean;
  error: string | null;
  companyData: any;
  companyId: string | null;
  onContinue: () => void;
  isAnalysisRunning: boolean;
  analysisResult: any;
  showInfoPopup: (title: string, content: React.ReactNode) => void;
}

// Kielikäännökset
const translations = {
  fi: {
    title: 'Yritysanalyysi',
    subtitle: 'Välianalyysi perustuu julkisiin tietoihin ja antaa yleiskuvan yrityksestäsi',
    analysisRunning: 'Välianalyysi käynnissä',
    loadingMessages: [
      'Analysoidaan yritystietoja...',
      'Haetaan julkisia tietoja...',
      'Käsitellään taloustietoja...',
      'Viimeistellään analyysiä...'
    ],
    companyInfo: 'Yritystiedot',
    basicInfoSubtitle: 'Perustiedot julkisista rekistereistä',
    companyDescription: 'Yrityksen kuvaus',
    aiAnalysis: 'AI-analyysi julkisista lähteistä',
    productsServices: 'Tuotteet ja palvelut:',
    financialData: 'Talousluvut ja kehitys',
    financialSubtitle: 'Taloudellinen kehitys ja viimeisimmät luvut',
    revenueGrowth: 'Liikevaihdon kehitys',
    noFinancialData: 'Ei taloustietoja saatavilla',
    noFinancialDataDesc: 'Julkisia taloustietoja ei löytynyt. Tarkemmat tiedot saadaan tilinpäätösasiakirjoista.',
    preliminaryRecommendations: 'Alustavat rahoitussuositukset',
    preliminarySubtitle: 'Suositukset perustuen yrityksen julkisiin tietoihin',
    competitors: 'Keskeiset kilpailijat',
    competitorsSubtitle: 'Tunnistettu markkinaympäristöstä',
    analysisComplete: 'Välianalyysi valmis',
    needsAssessmentLink: 'Tarvekartoitukseen tarkempaa rahoitusanalyysiä varten',
    applyFundingLink: 'Rahoituksen hakemiseen',
    nextSteps: 'Seuraavaksi',
    nextStepsText: 'Tee tarvekartoitus saadaksesi henkilökohtaiset rahoitussuositukset tai siirry suoraan rahoituksen hakemiseen',
    fields: {
      name: 'Yrityksen nimi',
      businessId: 'Y-tunnus',
      industry: 'Toimiala',
      founded: 'Perustettu',
      employees: 'Henkilöstömäärä',
      registrationDate: 'Rekisteröintipäivä',
      website: 'Verkkosivusto',
      revenue: 'Liikevaihto',
      operatingProfit: 'Liikevoitto (EBIT)',
      ebitda: 'Käyttökate (EBITDA)',
      netProfit: 'Nettotulos',
      totalAssets: 'Varat yhteensä',
      equity: 'Oma pääoma',
      totalLiabilities: 'Velat yhteensä'
    },
    financing: {
      businessLoan: {
        title: 'Yrityslaina',
        description: 'Yksittäisiin investointeihin ja kasvuhankkeisiin'
      },
      creditLine: {
        title: 'Yrityslimiitti',
        description: 'Joustoa käyttöpääomaan ja kausivaihteluiden hallintaan'
      },
      factoring: {
        title: 'Factoring',
        description: 'Pitkien myyntilaskujen rahoittamiseen ja kassavirran parantamiseen'
      },
      leasing: {
        title: 'Leasing',
        description: 'Laitteistojen investointeihin tai pääomien vapauttamiseen'
      }
    }
  }
};

// Käännösfunktio englanninkieliselle deepsearch-datalle
const translateToFinnish = (text: string): string => {
  if (!text) return text;
  
  // Yksinkertainen käännösmappaus yleisimmille termeille
  const translations: { [key: string]: string } = {
    // Toimialat
    'accounting': 'tilitoimisto',
    'accounting services': 'tilitoimistopalvelut',
    'financial services': 'rahoituspalvelut',
    'consulting': 'konsultointi',
    'business consulting': 'liikkeenjohdon konsultointi',
    'management consulting': 'liikkeenjohdon konsultointi',
    'technology': 'teknologia',
    'software': 'ohjelmisto',
    'software development': 'ohjelmistokehitys',
    'information technology': 'tietotekniikka',
    'construction': 'rakentaminen',
    'manufacturing': 'valmistus',
    'retail': 'vähittäiskauppa',
    'wholesale': 'tukkukauppa',
    'healthcare': 'terveydenhuolto',
    'education': 'koulutus',
    'real estate': 'kiinteistöala',
    'transportation': 'kuljetus',
    'logistics': 'logistiikka',
    'marketing': 'markkinointi',
    'advertising': 'mainonta',
    'design': 'suunnittelu',
    'engineering': 'insinööripalvelut',
    
    // Tuotteet ja palvelut
    'services': 'palvelut',
    'products': 'tuotteet',
    'solutions': 'ratkaisut',
    'development': 'kehitys',
    'management': 'hallinta',
    'support': 'tuki',
    'maintenance': 'ylläpito',
    'training': 'koulutus',
    'implementation': 'toteutus',
    'integration': 'integraatio',
    'optimization': 'optimointi',
    'analysis': 'analyysi',
    'planning': 'suunnittelu',
    'strategy': 'strategia',
    
    // Yleiset termit
    'company': 'yritys',
    'business': 'liiketoiminta',
    'enterprise': 'yritys',
    'corporation': 'yhtiö',
    'firm': 'yritys',
    'organization': 'organisaatio',
    'professional': 'ammattilainen',
    'expert': 'asiantuntija',
    'specialist': 'erikoisosaaja',
    'provider': 'palveluntarjoaja',
    'supplier': 'toimittaja',
    'partner': 'kumppani',
    'client': 'asiakas',
    'customer': 'asiakas',
    'market': 'markkina',
    'industry': 'toimiala',
    'sector': 'sektori',
    'digital': 'digitaalinen',
    'modern': 'moderni',
    'innovative': 'innovatiivinen',
    'comprehensive': 'kattava',
    'full-service': 'täyden palvelun',
    'based': 'sijaitseva',
    'located': 'sijaitseva',
    'offering': 'tarjoava',
    'providing': 'tarjoava',
    'specializing': 'erikoistunut',
    'focused': 'keskittynyt'
  };
  
  let translatedText = text.toLowerCase();
  
  // Korvaa tunnetut termit
  Object.entries(translations).forEach(([english, finnish]) => {
    const regex = new RegExp(`\\b${english}\\b`, 'gi');
    translatedText = translatedText.replace(regex, finnish);
  });
  
  // Palauta alkuperäinen teksti jos käännös ei ole merkittävästi erilainen
  const significantChange = Object.keys(translations).some(term => 
    text.toLowerCase().includes(term.toLowerCase())
  );
  
  return significantChange ? 
    translatedText.charAt(0).toUpperCase() + translatedText.slice(1) : 
    text;
};

// Käännösfunktio tuotteille ja kilpailijoille
const translateArray = (items: string[]): string[] => {
  return items.map(item => translateToFinnish(item));
};

export default function Step3PreAnalysis({
  loading,
  error,
  companyData,
  companyId,
  onContinue,
  isAnalysisRunning,
  analysisResult,
  showInfoPopup
}: Step3PreAnalysisProps) {
  const [loadingMessage, setLoadingMessage] = useState('');
  const [currentLanguage] = useState('fi'); // Globaali kieli, tässä kovakoodattu suomeksi
  
  const t = translations[currentLanguage as keyof typeof translations];

  // Simulating analysis process with changing messages
  useEffect(() => {
    if (isAnalysisRunning) {
      const messages = t.loadingMessages;
      
      let currentIndex = 0;
      setLoadingMessage(messages[currentIndex]);
      
      const interval = setInterval(() => {
        currentIndex = (currentIndex + 1) % messages.length;
        setLoadingMessage(messages[currentIndex]);
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [isAnalysisRunning, t.loadingMessages]);

  const analysisComplete = companyData && companyId && !loading && !isAnalysisRunning;

  useEffect(() => {
    if (analysisComplete) {
      showInfoPopup(
        '💡 Tärkeä huomio',
        <>
          <p className="text-base leading-relaxed mb-4">
            Tämä on <strong>alustava yritysanalyysi</strong> julkisten saatavilla olevien tietojen perusteella. 
            Suosittelemme <strong>tarkemman rahoitusanalyysin aloittamista tarvekartoituksen täyttämisellä</strong>.
          </p>
          <div className="flex items-start space-x-3 text-sm">
            <div className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full mt-1.5"></div>
            <div className="text-blue-300">
              Tarvekartoituksessa saat henkilökohtaisen rahoitusasiantuntijan arvion ja 
              räätälöidyt rahoitussuositukset juuri sinun yritykseesi sopiviksi.
            </div>
          </div>
        </>
      );
    }
  }, [analysisComplete, showInfoPopup]);

  if (loading || isAnalysisRunning) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 py-16">
        <div className="relative">
          <Spinner className="h-16 w-16 onboarding-text-accent" />
          <div className="absolute inset-0 rounded-full border-2 onboarding-border-accent animate-pulse"></div>
        </div>
        <div className="text-center">
          <h3 className="text-xl font-semibold onboarding-text-white mb-2">{t.analysisRunning}</h3>
          <p className="text-lg text-gray-300">{loadingMessage}</p>
          <p className="text-sm text-gray-400 mt-2">Tämä kestää hetken...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 mb-6 text-red-100">
        <h3 className="text-lg font-semibold mb-2">Virhe analyysissä</h3>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!companyData || !companyId) {
    return (
      <div className="bg-amber-900/20 border border-amber-700 rounded-lg p-6 mb-6 text-amber-100">
        <h3 className="text-lg font-semibold mb-2">Yritystä ei valittu</h3>
        <p className="text-sm">Palaa takaisin ja valitse yritys jatkaaksesi.</p>
      </div>
    );
  }

  // Helper function to check if data exists and is not empty
  const hasData = (value: any) => {
    return value !== null && value !== undefined && value !== '' && value !== 'preAnalysis.noDataAvailable';
  };

  // Get currency from company financial data or determine by country_code
  const companyCurrency = (() => {
    // Try to get currency from financial_data metadata first
    if (companyData?.metadata?.financial_data?.currency) {
      return companyData.metadata.financial_data.currency;
    }
    
    // Determine by company country_code (NOT locale)
    if (companyData?.country_code) {
      if (companyData.country_code === 'SE') return 'SEK';
      if (companyData.country_code === 'NO') return 'NOK';
      if (companyData.country_code === 'DK') return 'DKK';
      if (companyData.country_code === 'FI') return 'EUR';
    }
    
    // Fallback: detect from business_id format
    if (companyData?.business_id) {
      // Finnish: 1234567-8
      if (/^\d{7}-[\dA-Za-z]$/.test(companyData.business_id)) return 'EUR';
      // Swedish: 556677-8899
      if (/^\d{6}-\d{4}$/.test(companyData.business_id)) return 'SEK';
      // Norwegian: 123456789
      if (/^\d{9}$/.test(companyData.business_id)) return 'NOK';
      // Danish: 12345678
      if (/^\d{8}$/.test(companyData.business_id)) return 'DKK';
    }
    
    return 'EUR'; // Default to EUR
  })();

  // Helper function to format currency with dynamic currency
  const formatCurrency = (value: number) => {
    return formatCurrencyUtils(value, companyCurrency);
  };

  // Helper function to format large numbers
  const formatNumber = (value: number) => {
    const currencySymbol = companyCurrency === 'SEK' ? 'kr' : companyCurrency === 'NOK' ? 'kr' : companyCurrency === 'DKK' ? 'kr' : '€';
    
    // For SEK, use different thresholds since values are ~10x larger than EUR
    const millionThreshold = companyCurrency === 'SEK' ? 10_000_000 : 1_000_000;
    const thousandThreshold = companyCurrency === 'SEK' ? 10_000 : 1_000;
    
    if (value >= millionThreshold) {
      const millions = value / millionThreshold;
      return `${millions.toFixed(1)}M ${currencySymbol}`;
    } else if (value >= thousandThreshold) {
      const thousands = value / thousandThreshold;
      return `${thousands.toFixed(0)}k ${currencySymbol}`;
    }
    return formatCurrency(value);
  };

  // Extract enriched data from metadata if available
  const enrichedData = companyData.metadata?.enriched_data || {};
  const financialData = companyData.metadata?.financial_data || {};
  const latestFinancials = financialData.latest || {};
  const yearlyFinancials = financialData.yearly || [];

  // Filter available basic company data (tiivistetysti)
  const availableBasicInfo = [
    { key: 'name', label: t.fields.name, value: companyData.name, icon: BuildingOffice2Icon },
    { key: 'business_id', label: t.fields.businessId, value: companyData.business_id, icon: DocumentTextIcon },
    { 
      key: 'industry', 
      label: t.fields.industry, 
      value: translateToFinnish(enrichedData.industry) || companyData.business_area || companyData.industry, 
      icon: ChartBarIcon 
    },
    { 
      key: 'employee_count', 
      label: t.fields.employees, 
      value: enrichedData.personnel?.count || companyData.employee_count || companyData.employees, 
      icon: UsersIcon 
    }
  ].filter(item => hasData(item.value));

  // Helper function to parse financial values
  const parseFinancialValue = (value: any): number | null => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value !== 'Not available') {
      const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
      return !isNaN(parsed) ? parsed : null;
    }
    return null;
  };

  // Get the most recent financial data
  const revenueValue = parseFinancialValue(latestFinancials.revenue) || parseFinancialValue(companyData.revenue);
  const profitValue = parseFinancialValue(latestFinancials.profit) || parseFinancialValue(companyData.profit);
  const operatingProfitValue = parseFinancialValue(latestFinancials.operating_profit);
  const ebitdaValue = parseFinancialValue(latestFinancials.ebitda);

  // Prepare yearly data for chart (sorted from oldest to newest)
  const sortedYearlyData = [...yearlyFinancials]
    .sort((a, b) => parseInt(a.year) - parseInt(b.year))
    .slice(-5); // Show last 5 years

  // Calculate max value for chart scaling
  const maxValue = Math.max(
    ...sortedYearlyData.map(year => parseFinancialValue(year.revenue) || 0),
    revenueValue || 0
  );

  // Generate financing recommendations based on company data
  const generateFinancingRecommendations = () => {
    const recommendations = [];
    
    // Business loan recommendation
    if (revenueValue && revenueValue > 100000) {
      recommendations.push({
        type: 'businessLoan',
        icon: BanknotesIcon,
        priority: 'high'
      });
    }
    
    // Credit line recommendation
    if (revenueValue && revenueValue > 50000) {
      recommendations.push({
        type: 'creditLine',
        icon: CreditCardIcon,
        priority: 'medium'
      });
    }
    
    // Factoring recommendation (if revenue is significant)
    if (revenueValue && revenueValue > 200000) {
      recommendations.push({
        type: 'factoring',
        icon: ClockIcon,
        priority: 'medium'
      });
    }
    
    // Leasing recommendation
    recommendations.push({
      type: 'leasing',
      icon: ComputerDesktopIcon,
      priority: 'low'
    });
    
    return recommendations;
  };

  const financingRecommendations = generateFinancingRecommendations();

  return (
    <div className="onboarding-container">
      <div className="flex items-center justify-between mb-8">
        <h2 className="onboarding-title text-2xl lg:text-3xl font-bold">
          {t.title}
        </h2>
      </div>
      
      <p className="onboarding-description text-lg mb-10">
        {t.subtitle}
      </p>

      {/* 1. Yritystiedot (tiivistetysti) */}
      {availableBasicInfo.length > 0 && (
        <Card className="mb-8 bg-card border-border shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-xl text-foreground">
              <BuildingOffice2Icon className="h-6 w-6 mr-3" />
              {t.companyInfo}
          </CardTitle>
            <CardDescription className="text-muted-foreground">
              {t.basicInfoSubtitle}
            </CardDescription>
        </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {availableBasicInfo.map((item) => {
                const IconComponent = item.icon;
                return (
                  <div key={item.key} className="bg-muted/50 rounded-lg p-4 border border-border">
                    <div className="flex items-center mb-2">
                      <IconComponent className="h-5 w-5 text-white mr-2" />
                      <h4 className="text-sm font-medium text-muted-foreground">{item.label}</h4>
          </div>
                    <p className="text-lg font-semibold text-foreground">{item.value}</p>
          </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
      )}

      {/* 2. Yrityksen kuvaus (tiivistetysti) */}
      {enrichedData.description && (
        <Card className="mb-8 bg-card border-border shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-xl text-foreground">
              <DocumentTextIcon className="h-6 w-6 mr-3" />
              {t.companyDescription}
          </CardTitle>
            <CardDescription className="text-muted-foreground">
              {t.aiAnalysis}
          </CardDescription>
        </CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed mb-4">
              {translateToFinnish(enrichedData.description)}
            </p>
            {enrichedData.products && enrichedData.products.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">{t.productsServices}</h4>
                <div className="flex flex-wrap gap-2">
                  {translateArray(enrichedData.products).slice(0, 6).map((product: string, index: number) => (
                    <span key={index} className="px-3 py-1 bg-primary/10 text-foreground rounded-full text-sm border border-primary/20">
                      {product}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

            {/* 3. Talousluvut ja kehitys (graafisesti) */}
      {(revenueValue || sortedYearlyData.length > 0) ? (
        <Card className="mb-8 bg-gray-very-dark border-gray-dark shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-xl onboarding-text-white">
              <ChartBarIcon className="h-6 w-6 mr-3" />
              {t.financialData}
            </CardTitle>
            <CardDescription className="onboarding-text-secondary">
              {t.financialSubtitle}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Individual Financial Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              
              {/* 1. Liikevaihto Chart */}
              {sortedYearlyData.length > 0 && (
                <div className="rounded-xl p-6 border border-yellow-200/20 hover:border-yellow-300/30 transition-all duration-300">
                  <div className="mb-6">
                    <h4 className="text-xl font-semibold onboarding-text-white mb-2">Liikevaihto</h4>
                    <p className="text-sm onboarding-text-secondary">Kehitys {sortedYearlyData.length} vuoden ajalta</p>
                  </div>
                  
                  {/* Current value display */}
                  <div className="mb-8">
                    <div className="text-3xl font-bold onboarding-text-accent mb-3">
                      {revenueValue ? formatNumber(revenueValue) : 'Ei tietoa'}
                    </div>
                    {sortedYearlyData.length > 1 && (() => {
                      const currentRevenue = parseFinancialValue(sortedYearlyData[sortedYearlyData.length - 1]?.revenue);
                      const previousRevenue = parseFinancialValue(sortedYearlyData[sortedYearlyData.length - 2]?.revenue);
                      if (currentRevenue && previousRevenue) {
                        const growth = ((currentRevenue - previousRevenue) / previousRevenue) * 100;
                        return (
                          <div className={`flex items-center text-sm font-medium ${growth >= 0 ? 'onboarding-text-accent' : 'text-orange-300'}`}>
                            <ArrowTrendingUpIcon className={`w-4 h-4 mr-2 ${growth < 0 ? 'rotate-180' : ''}`} />
                            <span>{growth >= 0 ? '+' : ''}{growth.toFixed(1)}% edellisestä vuodesta</span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* Bar chart */}
                  <div className="relative">
                    <div className="flex items-end justify-between h-40 mb-4 bg-yellow-900/20 rounded-lg p-4">
                      {sortedYearlyData.map((yearData: any, index: number) => {
                        const revenue = parseFinancialValue(yearData.revenue);
                        const maxRev = Math.max(...sortedYearlyData.map((y: any) => parseFinancialValue(y.revenue) || 0));
                        const height = revenue ? (revenue / maxRev) * 100 : 5;
                        
                        return (
                          <div key={index} className="flex flex-col items-center flex-1 h-full">
                            <div className="w-full flex flex-col items-center justify-end h-full relative group">
                              <div 
                                className="w-full max-w-12 bg-gradient-to-t from-yellow-500/60 to-yellow-400/40 rounded-t-md transition-all duration-700 hover:from-yellow-400/80 hover:to-yellow-300/60 cursor-pointer shadow-lg"
                                style={{ height: `${Math.max(height, 8)}%` }}
                              >
                                {/* Tooltip */}
                                <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 bg-yellow-900/90 border border-yellow-400/30 text-yellow-100 text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-xl">
                                  <div className="font-semibold">{yearData.year}</div>
                                  <div>{revenue ? formatNumber(revenue) : 'Ei tietoa'}</div>
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 text-xs onboarding-text-secondary text-center font-medium">
                              {yearData.year}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

                             {/* 2. Liikevoitto Chart */}
               {(operatingProfitValue !== null || sortedYearlyData.some((y: any) => parseFinancialValue(y.operating_profit) !== null)) && (
                 <div className="bg-amber-50/10 rounded-xl p-6 border border-amber-200/20 hover:border-amber-300/30 transition-all duration-300">
                   <div className="mb-6">
                     <h4 className="text-xl font-semibold onboarding-text-white mb-2">Liikevoitto (EBIT)</h4>
                     <p className="text-sm onboarding-text-secondary">Operatiivinen kannattavuus</p>
                   </div>
                   
                   {/* Current value display */}
                   <div className="mb-8">
                     <div className={`text-3xl font-bold mb-3 ${
                       operatingProfitValue !== null && operatingProfitValue >= 0 ? 'onboarding-text-accent' : 'text-orange-300'
                     }`}>
                       {operatingProfitValue !== null ? formatNumber(operatingProfitValue) : 'Ei tietoa'}
                     </div>
                     {revenueValue && operatingProfitValue !== null && (
                       <div className="text-sm onboarding-text-secondary font-medium">
                         {((operatingProfitValue / revenueValue) * 100).toFixed(1)}% liikevaihdosta
                       </div>
                     )}
                   </div>

                   {/* Line chart for operating profit */}
                   <div className="relative">
                     <div className="h-40 bg-amber-900/20 rounded-lg p-4 relative">
                       {sortedYearlyData.length > 1 ? (
                         <div className="flex items-center justify-between h-full relative">
                           {/* Zero line */}
                           <div className="absolute left-0 right-0 border-t border-amber-400/30" style={{ bottom: '50%' }}></div>
                           
                           {/* SVG Line Chart */}
                           <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                             <defs>
                               <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                 <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
                                 <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.6" />
                               </linearGradient>
                             </defs>
                             {(() => {
                               const points = sortedYearlyData.map((yearData: any, index: number) => {
                                 const profit = parseFinancialValue(yearData.operating_profit);
                                 const maxAbsValue = Math.max(...sortedYearlyData.map((y: any) => Math.abs(parseFinancialValue(y.operating_profit) || 0)));
                                 const x = (index / (sortedYearlyData.length - 1)) * 100;
                                 const y = profit !== null ? 50 - ((profit / maxAbsValue) * 40) : 50; // 50 is zero line
                                 return `${x},${Math.max(Math.min(y, 95), 5)}`;
                               }).join(' ');
                               
                               return (
                                 <polyline
                                   points={points}
                                   fill="none"
                                   stroke="url(#lineGradient)"
                                   strokeWidth="2"
                                   strokeLinecap="round"
                                   strokeLinejoin="round"
                                   className="drop-shadow-sm"
                                 />
                               );
                             })()}
                           </svg>
                           
                           {/* Data points */}
                           {sortedYearlyData.map((yearData: any, index: number) => {
                             const profit = parseFinancialValue(yearData.operating_profit);
                             const maxAbsValue = Math.max(...sortedYearlyData.map((y: any) => Math.abs(parseFinancialValue(y.operating_profit) || 0)));
                             const height = profit !== null ? ((profit / maxAbsValue) * 40) + 50 : 50; // 50% is zero line
                             
                             return (
                               <div 
                                 key={index} 
                                 className="absolute flex flex-col items-center group"
                                 style={{ 
                                   left: `${(index / (sortedYearlyData.length - 1)) * 100}%`,
                                   bottom: `${Math.max(Math.min(height, 95), 5)}%`,
                                   transform: 'translateX(-50%)'
                                 }}
                               >
                                 <div 
                                   className={`w-3 h-3 rounded-full transition-all duration-700 ${
                                     profit !== null && profit >= 0 ? 'bg-amber-300 border-2 border-amber-100' : 'bg-orange-400 border-2 border-orange-200'
                                   } hover:scale-150 cursor-pointer shadow-lg`}
                                 >
                                   {/* Tooltip */}
                                   <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-amber-900/90 border border-amber-400/30 text-amber-100 text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-xl">
                                     <div className="font-semibold">{yearData.year}</div>
                                     <div>{profit !== null ? formatNumber(profit) : 'Ei tietoa'}</div>
                                   </div>
                                 </div>
                               </div>
                             );
                           })}
                           
                           {/* Year labels */}
                           {sortedYearlyData.map((yearData: any, index: number) => (
                             <div 
                               key={index}
                               className="absolute text-xs onboarding-text-secondary text-center font-medium"
                               style={{ 
                                 left: `${(index / (sortedYearlyData.length - 1)) * 100}%`,
                                 bottom: '-24px',
                                 transform: 'translateX(-50%)'
                               }}
                             >
                               {yearData.year}
                             </div>
                           ))}
                         </div>
                       ) : (
                         <div className="flex items-center justify-center h-full">
                           <span className="text-sm onboarding-text-secondary">Ei riittävästi dataa trendin näyttämiseen</span>
                         </div>
                       )}
                     </div>
                   </div>
                 </div>
               )}

                             {/* 3. Käyttökate (EBITDA) Chart */}
               {(ebitdaValue !== null || sortedYearlyData.some((y: any) => parseFinancialValue(y.ebitda) !== null)) && (
                 <div className="bg-orange-50/10 rounded-xl p-6 border border-orange-200/20 hover:border-orange-300/30 transition-all duration-300">
                   <div className="mb-6">
                     <h4 className="text-xl font-semibold onboarding-text-white mb-2">Käyttökate (EBITDA)</h4>
                     <p className="text-sm onboarding-text-secondary">Kassavirta ennen rahoituseriä</p>
                   </div>
                   
                   {/* Current value display */}
                   <div className="mb-8">
                     <div className={`text-3xl font-bold mb-3 ${
                       ebitdaValue !== null && ebitdaValue >= 0 ? 'onboarding-text-accent' : 'text-red-300'
                     }`}>
                       {ebitdaValue !== null ? formatNumber(ebitdaValue) : 'Ei tietoa'}
                     </div>
                     {revenueValue && ebitdaValue !== null && (
                       <div className="text-sm onboarding-text-secondary font-medium">
                         {((ebitdaValue / revenueValue) * 100).toFixed(1)}% liikevaihdosta
                       </div>
                     )}
                   </div>

                   {/* Area chart for EBITDA */}
                   <div className="relative">
                     <div className="h-40 bg-orange-900/20 rounded-lg p-4 relative overflow-hidden">
                       {sortedYearlyData.length > 1 ? (
                         <div className="flex items-end justify-between h-full space-x-1">
                           {sortedYearlyData.map((yearData: any, index: number) => {
                             const ebitda = parseFinancialValue(yearData.ebitda);
                             const maxEbitda = Math.max(...sortedYearlyData.map((y: any) => parseFinancialValue(y.ebitda) || 0));
                             const height = ebitda ? (ebitda / maxEbitda) * 100 : 5;
                             
                             return (
                               <div key={index} className="flex flex-col items-center flex-1 h-full relative group">
                                 <div className="w-full flex flex-col items-center justify-end h-full relative">
                                   <div 
                                     className="w-full bg-gradient-to-t from-orange-500/50 to-orange-300/30 transition-all duration-700 hover:from-orange-400/70 hover:to-orange-200/50 cursor-pointer"
                                     style={{ height: `${Math.max(height, 8)}%` }}
                                   >
                                     {/* Tooltip */}
                                     <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 bg-orange-900/90 border border-orange-400/30 text-orange-100 text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-xl">
                                       <div className="font-semibold">{yearData.year}</div>
                                       <div>{ebitda ? formatNumber(ebitda) : 'Ei tietoa'}</div>
                                     </div>
                                   </div>
                                 </div>
                                 <div className="mt-3 text-xs onboarding-text-secondary text-center font-medium">
                                   {yearData.year}
                                 </div>
                               </div>
                             );
                           })}
                         </div>
                       ) : (
                         <div className="flex items-center justify-center h-full">
                           <span className="text-sm onboarding-text-secondary">Ei riittävästi dataa trendin näyttämiseen</span>
                         </div>
                       )}
                     </div>
                   </div>
                 </div>
               )}

                             {/* 4. Nettotulos Chart */}
               {(profitValue !== null || sortedYearlyData.some((y: any) => parseFinancialValue(y.profit) !== null)) && (
                 <div className="bg-amber-50/10 rounded-xl p-6 border border-amber-200/20 hover:border-amber-300/30 transition-all duration-300">
                   <div className="mb-6">
                     <h4 className="text-xl font-semibold onboarding-text-white mb-2">Nettotulos</h4>
                     <p className="text-sm onboarding-text-secondary">Tilikauden lopputulos</p>
                   </div>
                   
                   {/* Current value display */}
                   <div className="mb-8">
                     <div className={`text-3xl font-bold mb-3 ${
                       profitValue !== null && profitValue >= 0 ? 'onboarding-text-accent' : 'text-orange-300'
                     }`}>
                       {profitValue !== null ? formatNumber(profitValue) : 'Ei tietoa'}
                     </div>
                     {revenueValue && profitValue !== null && (
                       <div className="text-sm onboarding-text-secondary font-medium">
                         {((profitValue / revenueValue) * 100).toFixed(1)}% liikevaihdosta
                       </div>
                     )}
                   </div>

                   {/* Combined bar and line chart for net profit */}
                   <div className="relative">
                     <div className="h-40 bg-amber-900/20 rounded-lg p-4 relative">
                       {sortedYearlyData.length > 1 ? (
                         <div className="flex items-end justify-between h-full relative">
                           {/* Zero line */}
                           <div className="absolute left-0 right-0 border-t border-amber-400/30" style={{ bottom: '50%' }}></div>
                           
                           {sortedYearlyData.map((yearData: any, index: number) => {
                             const profit = parseFinancialValue(yearData.profit);
                             const maxAbsValue = Math.max(...sortedYearlyData.map((y: any) => Math.abs(parseFinancialValue(y.profit) || 0)));
                             const height = profit !== null ? Math.abs(profit / maxAbsValue) * 40 : 5; // Height from zero line
                             const isPositive = profit !== null && profit >= 0;
                             
                             return (
                               <div key={index} className="flex flex-col items-center flex-1 h-full relative group">
                                 <div className="w-full flex flex-col items-center justify-center h-full relative">
                                   <div 
                                     className={`w-full max-w-8 transition-all duration-700 hover:opacity-80 cursor-pointer ${
                                       isPositive ? 'bg-gradient-to-t from-amber-500/60 to-amber-400/40' : 'bg-gradient-to-b from-orange-600/60 to-orange-500/40'
                                     }`}
                                     style={{ 
                                       height: `${Math.max(height, 4)}%`,
                                       position: 'absolute',
                                       [isPositive ? 'bottom' : 'top']: '50%'
                                     }}
                                   >
                                     {/* Tooltip */}
                                     <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 bg-amber-900/90 border border-amber-400/30 text-amber-100 text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-xl">
                                       <div className="font-semibold">{yearData.year}</div>
                                       <div>{profit !== null ? formatNumber(profit) : 'Ei tietoa'}</div>
                                     </div>
                                   </div>
                                 </div>
                                 <div className="mt-3 text-xs onboarding-text-secondary text-center font-medium">
                                   {yearData.year}
                                 </div>
                               </div>
                             );
                           })}
                         </div>
                       ) : (
                         <div className="flex items-center justify-center h-full">
                           <span className="text-sm onboarding-text-secondary">Ei riittävästi dataa trendin näyttämiseen</span>
                         </div>
                       )}
          </div>
          </div>
          </div>
               )}

          </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-8 bg-gray-very-dark border-gray-dark shadow-xl">
          <CardContent className="text-center py-12">
            <ChartBarIcon className="h-16 w-16 text-gray-medium mx-auto mb-4" />
            <h3 className="text-xl font-semibold onboarding-text-white mb-2">{t.noFinancialData}</h3>
            <p className="text-gray-light">
              {t.noFinancialDataDesc}
            </p>
            <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
              <p className="text-sm text-blue-200">
                💡 <strong>Vinkki:</strong> Taloustiedot haetaan automaattisesti Finder.fi ja muista julkisista lähteistä. 
                Jos tietoja ei löydy, ne voidaan täydentää tilinpäätösasiakirjoista myöhemmin.
            </p>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Analysis Complete Status */}
      <div className="text-center mb-8">
        {analysisResult ? (
          <div className="onboarding-info-card inline-flex items-center justify-center space-x-3 px-6 py-4 mb-6">
            <CheckCircleIcon className="h-6 w-6 onboarding-text-accent" />
            <span className="onboarding-text-accent font-medium">{t.analysisComplete}</span>
          </div>
        ) : null}

        {/* Action Links */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
          <Button 
            onClick={onContinue}
            className="onboarding-btn-primary px-6 py-3 font-semibold text-base shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center"
          >
            <ClipboardDocumentListIcon className="mr-2 h-5 w-5" />
            {t.needsAssessmentLink}
          </Button>

        <Button 
            onClick={() => window.location.href = '/fi/finance-application?step=application'}
            className="onboarding-btn-outline px-6 py-3 font-semibold text-base transition-all duration-200 flex items-center justify-center"
        >
            <PlusIcon className="mr-2 h-5 w-5" />
            {t.applyFundingLink}
        </Button>
        </div>
      </div>

      {/* Info Box - lisätty väli footeriin */}
      <div className="bg-gray-very-dark border border-gray-dark rounded-lg p-6 text-center mb-16">
        <h4 className="text-lg font-semibold onboarding-text-white mb-2">{t.nextSteps}</h4>
        <p className="onboarding-text-secondary">
          {t.nextStepsText}
        </p>
      </div>
    </div>
  );
} 