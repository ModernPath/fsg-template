'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ChevronDownIcon, ChevronUpIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  Cell,
  PieChart,
  Pie,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip
} from 'recharts';
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { formatCurrency, getCurrencyCode } from '@/lib/utils/currency-utils';
import { 
  MasterChartWrapper, 
  MasterGrid, 
  MasterXAxis, 
  MasterYAxis, 
  MasterTooltip,
  MasterEmptyState,
  MasterChartSkeleton,
  MasterInsight,
  MasterGradientDefs,
  MASTER_COLORS,
  formatters
} from '@/components/charts/MasterChartStyle';

// Data structures
export interface YearlyFinancialData {
  fiscal_year: number;
  // Core metrics
  revenue?: number | null;
  revenue_growth_pct?: number | null;
  ebitda?: number | null;
  
  // Profitability
  operating_profit?: number | null;
  operating_profit_pct?: number | null;
  net_result?: number | null;
  netProfit?: number | null; // Alias for net_result
  gross_margin?: number | null;
  gross_margin_pct?: number | null;
  
  // Balance sheet
  totalAssets?: number | null;
  total_assets?: number | null; // Alias
  totalEquity?: number | null;
  totalLiabilities?: number | null;
  equity?: number | null; // Alias
  cashAndReceivables?: number | null;
  
  // Ratios
  roe?: number | null;
  roa?: number | null;
  return_on_equity_pct?: number | null; // Alias
  return_on_assets_pct?: number | null; // Alias
  debtToEquity?: number | null;
  equity_ratio_pct?: number | null;
  debt_ratio_pct?: number | null;
  quick_ratio?: number | null;
  current_ratio?: number | null;
  dscr?: number | null; // Debt Service Coverage Ratio
  
  // Other
  dso?: number | null;
  employees?: number | null;
  fiscal_period_months?: number | null;
}

export interface CurrentFinancialRatios {
  currentRatio?: number | null;
  quickRatio?: number | null;
  equityRatio?: number | null;
  debtRatio?: number | null;
  debtToEquity?: number | null;
  dscr?: number | null; // Debt Service Coverage Ratio
  roe?: number | null;
  roa?: number | null;
}

// Chart type identifiers
export type ChartKey = 
  | 'revenue'
  | 'revenueGrowth'
  | 'ebitda'
  | 'operatingProfit'
  | 'operatingProfitPct'
  | 'netResult'
  | 'grossMargin'
  | 'grossMarginPct'
  | 'roe'
  | 'roa'
  | 'debtToEquity'
  | 'equityRatio'
  | 'debtRatio'
  | 'currentRatio'
  | 'quickRatio'
  | 'dscr'
  | 'totalAssets'
  | 'totalEquity'
  | 'equityAndAssetsCombo'
  | 'cashAndReceivables'
  | 'employees'
  | 'dso';

export interface FinancialChartsDisplayProps {
  yearlyData: YearlyFinancialData[];
  latestRatios: CurrentFinancialRatios;
  isLoading: boolean;
  error?: string | null;
  locale: string;
  currency?: string;
  title?: string;
  defaultChartsToShow?: number;
  chartKeysAndTypes: Array<{ key: ChartKey; type: 'bar' | 'line' | 'gauge' | 'combo'; titleKey: string }>;
  chartHeight?: number;
}

const DEFAULT_CHART_HEIGHT = 300;

// Enhanced helper functions using MasterChartStyle
const formatAxisValue = (value: number, currency: string = 'EUR'): string => {
  if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(0)}k`;
  }
  return `${Math.round(value)}`;
};

const formatFinancialTooltipValue = (value: number, name: string, currency: string = 'EUR'): [React.ReactNode, React.ReactNode] => {
  // Handle null/undefined values
  if (value === null || value === undefined) {
    return [
      <span key="value" style={{ color: '#9CA3AF', fontWeight: 600 }}>
        Ei dataa
      </span>, 
      <span key="label" style={{ color: '#374151', fontWeight: 500 }}>
        {name}
      </span>
    ];
  }

  let formattedValue: string;
  
  // Format based on value type and currency
  if (name.includes('%') || name.toLowerCase().includes('roe') || name.toLowerCase().includes('kasvu')) {
    // Percentage values
    formattedValue = `${value.toFixed(1)}%`;
  } else if (
    name.toLowerCase().includes('ratio') || 
    name.toLowerCase().includes('suhde') ||
    name.toLowerCase().includes('velkaantumisaste') ||
    name.toLowerCase().includes('d/e') ||
    name.toLowerCase().includes('dscr') ||
    name.toLowerCase().includes('skuldsättningsgrad') // Swedish
  ) {
    // Ratio values (e.g., Debt-to-Equity, Current Ratio, Quick Ratio)
    formattedValue = value.toFixed(2);
  } else {
    // Currency values
    formattedValue = value.toLocaleString('fi-FI', {
      style: 'currency',
      currency: currency === 'SEK' ? 'SEK' : 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }
  
  return [
    <span key="value" style={{ color: MASTER_COLORS.primary[0], fontWeight: 600 }}>
      {formattedValue}
    </span>, 
    <span key="label" style={{ color: '#374151', fontWeight: 500 }}>
      {name}
    </span>
  ];
};

// Custom tooltip component for better formatting
const CustomTooltip = ({ active, payload, label, currency = 'EUR', locale = 'fi', coordinate }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const value = data.value;
    const name = data.name || data.dataKey;
    
    // Handle null/undefined values
    if (value === null || value === undefined) {
      return (
        <div className="rounded-lg shadow-xl p-4 max-w-xs" style={{ 
          backgroundColor: '#1f2937',
          border: '1px solid #374151',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
          pointerEvents: 'none'
        }}>
          <p className="text-sm font-medium mb-1" style={{ color: '#d1d5db' }}>
            {name}
          </p>
          <p className="text-lg font-bold" style={{ color: '#9ca3af' }}>
            Ei dataa
          </p>
          <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
            Vuosi {label}
          </p>
        </div>
      );
    }
    
    // Format the value based on type
    let formattedValue;
    if (typeof value === 'number') {
      // Check if it's a percentage value
      if (name && (name.includes('%') || name.toLowerCase().includes('roe') || name.toLowerCase().includes('kasvu'))) {
        formattedValue = `${value.toFixed(1)}%`;
      } else if (name && (
        name.toLowerCase().includes('ratio') || 
        name.toLowerCase().includes('suhde') || 
        name.toLowerCase().includes('velkaantumisaste') ||
        name.toLowerCase().includes('d/e') ||
        name.toLowerCase().includes('dscr') ||
        name.toLowerCase().includes('skuldsättningsgrad') // Swedish
      )) {
        // Ratio values (e.g., Debt-to-Equity, Current Ratio, Quick Ratio)
        formattedValue = value.toFixed(2);
      } else {
        // Currency values
        const localeCode = locale === 'sv' ? 'sv-SE' : locale === 'fi' ? 'fi-FI' : 'en-US';
        formattedValue = value.toLocaleString(localeCode, {
          style: 'currency',
          currency: currency === 'SEK' ? 'SEK' : 'EUR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        });
      }
    } else {
      formattedValue = value;
    }

    const yearLabel = locale === 'sv' ? 'År' : locale === 'fi' ? 'Vuosi' : 'Year';

    return (
      <div className="rounded-lg shadow-xl p-4 max-w-xs" style={{ 
        backgroundColor: '#1f2937',
        border: '1px solid #374151',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
        pointerEvents: 'none'
      }}>
        <p className="text-sm font-medium mb-1" style={{ color: '#d1d5db' }}>
          {name}
        </p>
        <p className="text-lg font-bold" style={{ color: '#e5c07b' }}>
          {formattedValue}
        </p>
        <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
          {yearLabel} {label}
        </p>
      </div>
    );
  }
  return null;
};

// Enhanced GaugeChart component using MasterChartStyle
const GaugeChart = ({ value, title, initialMaxValue = 3, chartKey }: { value: number, title: string, initialMaxValue?: number, chartKey: ChartKey }) => {
  const percentage = Math.min(Math.max(value / initialMaxValue, 0), 1) * 100;
  
  const gaugeData = [
    { name: 'value', value: percentage, color: MASTER_COLORS.primary[0] },
    { name: 'remaining', value: 100 - percentage, color: '#374151' },
  ];

  // Get quality assessment
  const getQuality = () => {
    if (chartKey === 'currentRatio' || chartKey === 'quickRatio') {
      if (value >= 2) return { text: 'Erinomainen', color: 'green' as const };
      if (value >= 1.5) return { text: 'Hyvä', color: 'blue' as const };
      if (value >= 1) return { text: 'Riittävä', color: 'yellow' as const };
      return { text: 'Heikko', color: 'red' as const };
    }
    if (chartKey === 'dscr') {
      if (value >= 1.25) return { text: 'Hyvä', color: 'green' as const };
      if (value >= 1.0) return { text: 'Kohtalainen', color: 'yellow' as const };
      return { text: 'Huono', color: 'red' as const };
    }
    return { text: 'Normaali', color: 'blue' as const };
  };

  const quality = getQuality();
  
  return (
    <div className="space-y-4">
      {/* Gauge visualization */}
      <MasterChartWrapper height={200}>
        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <Pie
            data={gaugeData}
            cx="50%"
            cy="70%"
            startAngle={180}
            endAngle={0}
            innerRadius="60%"
            outerRadius="80%"
            paddingAngle={0}
            dataKey="value"
            cornerRadius={5}
          >
            {gaugeData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} />
            ))}
          </Pie>
          <MasterTooltip
            formatter={(val: number, name: string) => {
              if (name === 'value') return [
                <span key="value" style={{ color: MASTER_COLORS.primary[0], fontWeight: 600 }}>
                  {value.toFixed(2)}
                </span>, 
                <span key="label" style={{ color: '#374151', fontWeight: 500 }}>
                  {title}
                </span>
              ];
              return [null, null];
            }}
            colors={[MASTER_COLORS.primary[0]]}
          />
        </PieChart>
      </MasterChartWrapper>

      {/* Value display */}
      <div className="text-center">
        <div className="text-3xl font-bold mb-2" style={{ color: MASTER_COLORS.primary[0] }}>
          {value.toFixed(2)}
        </div>
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
          quality.color === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
          quality.color === 'blue' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
          quality.color === 'yellow' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
        }`}>
          <span>{quality.text}</span>
        </div>
      </div>
    </div>
  );
};

const FinancialChartsDisplay: React.FC<FinancialChartsDisplayProps> = ({
  yearlyData,
  latestRatios,
  isLoading,
  error,
  locale,
  currency = 'EUR',
  title,
  defaultChartsToShow = 3,
  chartKeysAndTypes,
  chartHeight = DEFAULT_CHART_HEIGHT,
}) => {
  const t = useTranslations('Financials');
  const tChartTooltips = useTranslations('ChartTooltips');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Fix for Recharts SSR issues - set immediately on mount to prevent flash
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Memoize filtered yearly data to prevent unnecessary re-renders
  const filteredYearlyData = useMemo(() => {
    return yearlyData.filter(yearData => 
      Object.values(yearData).some(value => value !== null && value !== undefined && value !== '')
    );
  }, [yearlyData]);

  // Memoize charts to show based on expansion state
  const chartsToShow = useMemo(() => {
    return isExpanded ? chartKeysAndTypes : chartKeysAndTypes.slice(0, defaultChartsToShow);
  }, [isExpanded, chartKeysAndTypes, defaultChartsToShow]);

  // Memoize tooltip content function to prevent re-renders - MUST be before any early returns
  const tooltipContent = useCallback((props: any) => {
    return <CustomTooltip {...props} currency={currency} locale={locale} />;
  }, [currency, locale]);

  // Helper function to get appropriate Y-axis label
  const getYAxisLabel = (chartKey: ChartKey): string => {
    switch (chartKey) {
      case 'roe':
        return t('axisLabels.percentage');
      case 'debtToEquity':
      case 'currentRatio':
      case 'quickRatio':
      case 'dscr':
        return t('axisLabels.ratio');
      case 'dso':
        return t('axisLabels.days');
      default:
        return currency === 'SEK' ? 'Belopp (kr)' : t('axisLabels.amount');
    }
  };

  // Helper function to get short Y-axis label for better spacing
  const getShortYAxisLabel = (chartKey: ChartKey): string => {
    switch (chartKey) {
      case 'roe':
        return '%';
      case 'debtToEquity':
      case 'currentRatio':
      case 'quickRatio':
      case 'dscr':
      case 'dso':
        return '';
      default:
        return ''; // Remove currency label from axis as it's already in chart title
    }
  };

  // Show loading state only when actually loading (not during SSR client check)
  if (isLoading) {
    return (
      <div className="space-y-6">
        <MasterChartSkeleton height={DEFAULT_CHART_HEIGHT} />
        <MasterChartSkeleton height={DEFAULT_CHART_HEIGHT} />
        <MasterChartSkeleton height={DEFAULT_CHART_HEIGHT} />
      </div>
    );
  }

  // For SSR, render empty div initially to prevent flash, then render charts after hydration
  if (!isClient) {
    return <div className="space-y-6" style={{ minHeight: `${DEFAULT_CHART_HEIGHT * 3}px` }} />;
  }

  if (error) {
    return (
      <MasterEmptyState
        icon="⚠️"
        title="Virhe ladattaessa kaavioita"
        description={`${t('errorLoadingCharts', { default: 'Virhe ladattaessa talouskaavioita:' })} ${error}`}
      />
    );
  }

  if (!yearlyData.length && !Object.keys(latestRatios).some(k => latestRatios[k as keyof CurrentFinancialRatios] !== null && latestRatios[k as keyof CurrentFinancialRatios] !== undefined)) {
    return (
      <MasterEmptyState
        icon="📊"
        title="Ei talousdata saatavilla"
        description={t('noDataAvailable', { default: 'Lataa talousasiakirjoja nähdäksesi kaaviot ja analyysit.' })}
      />
    );
  }
  
  // Log data availability for debugging
  console.log('📊 [FinancialChartsDisplay] Data summary:', {
    yearlyDataCount: yearlyData.length,
    yearRange: yearlyData.length > 0 ? `${Math.min(...yearlyData.map(d => d.fiscal_year))}-${Math.max(...yearlyData.map(d => d.fiscal_year))}` : 'N/A',
    availableMetrics: Object.keys(latestRatios).filter(k => latestRatios[k as keyof CurrentFinancialRatios] !== null),
    chartsToShow: chartKeysAndTypes.length
  });

  // Charts are working! Debug logs removed for cleaner console

  const renderChart = (chartConfig: { key: ChartKey; type: 'bar' | 'line' | 'gauge' | 'combo'; titleKey: string }) => {
    const chartTitle = t(chartConfig.titleKey, { default: chartConfig.titleKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()) });
    const tooltipWhatItMeasures = tChartTooltips(`${chartConfig.key}.whatItMeasures`);
    const tooltipHowToInterpret = tChartTooltips(`${chartConfig.key}.howToInterpret`);

    // Chart rendering successfully

    const chartHeader = (
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-gold-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-gradient-to-b from-gold-primary to-gold-secondary rounded-full"></div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-gold-primary to-gold-secondary bg-clip-text text-transparent">{chartTitle}</h3>
        </div>
        {tooltipWhatItMeasures && tooltipWhatItMeasures !== `${chartConfig.key}.whatItMeasures` &&
          <TooltipProvider>
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <InformationCircleIcon className="h-5 w-5 text-gold-secondary/70 hover:text-gold-primary cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent className="bg-black border-gold-primary text-gold-secondary max-w-xs p-3">
                <p className="font-semibold text-gold-primary mb-1.5">{t('tooltip.whatItMeasuresTitle', { default: 'Mitä mittaa:'})}</p>
                <p className="text-sm mb-2.5">{tooltipWhatItMeasures}</p>
                <p className="font-semibold text-gold-primary mb-1.5">{t('tooltip.howToInterpretTitle', { default: 'Miten tulkita:'})}</p>
                <p className="text-sm">{tooltipHowToInterpret}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        }
      </div>
    );

    switch (chartConfig.type) {
      case 'bar':
        const barDataKey = chartConfig.key as keyof YearlyFinancialData;
        
        // Filter out years with no data for this specific chart
        const filteredData = filteredYearlyData.filter(d => d[barDataKey] !== null && d[barDataKey] !== undefined);
        
        if (filteredData.length === 0) {
          return (
            <div key={chartConfig.key} className="chart-wrapper bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-2xl border border-gold-primary/20 p-6">
              {chartHeader}
              <MasterEmptyState
                icon="📊"
                title="Ei dataa saatavilla"
                description={t('noDataForChart', { default: 'Tälle kaaviolle ei ole dataa saatavilla.' })}
              />
            </div>
          );
        }

        return (
          <div key={chartConfig.key} className="chart-wrapper bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-2xl border border-gold-primary/20 p-6">
            {chartHeader}
            <div style={{ width: '100%', height: `${chartHeight}px`, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%" key={`chart-${chartConfig.key}`}>
                <BarChart 
                  data={filteredData}
                  margin={{ top: 20, right: 40, left: 80, bottom: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
                  {/* Add reference line at zero for negative values */}
                  {filteredData.some(d => d[barDataKey] && d[barDataKey] < 0) && (
                    <CartesianGrid 
                      horizontalPoints={[0]} 
                      stroke="#ef4444" 
                      strokeWidth={1} 
                      strokeOpacity={0.6}
                    />
                  )}
                  <XAxis 
                    dataKey="fiscal_year" 
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    label={{ 
                      value: t('axisLabels.year'), 
                      position: 'insideBottom', 
                      offset: -10,
                      style: { textAnchor: 'middle', fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }
                    }}
                  />
                  <YAxis 
                    tick={{ fill: '#9CA3AF', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={70}
                    tickCount={6}
                    domain={[(dataMin: number) => {
                      // For negative values, show from a bit below the minimum to zero
                      if (dataMin < 0) {
                        return Math.min(dataMin * 1.2, dataMin - Math.abs(dataMin) * 0.1);
                      }
                      return 0;
                    }, (dataMax: number) => {
                      // For negative values, show zero as maximum for context
                      if (dataMax <= 0) {
                        return Math.max(0, dataMax * 0.1);
                      }
                      return dataMax * 1.1;
                    }]}
                    tickFormatter={(value) => chartConfig.key === 'roe' ? `${Math.round(value)}%` : formatAxisValue(value, currency)}
                    label={{ 
                      value: getShortYAxisLabel(chartConfig.key), 
                      angle: -90, 
                      position: 'outside',
                      offset: -5,
                      style: { textAnchor: 'middle', fill: '#9CA3AF', fontSize: 10, fontWeight: 500 }
                    }}
                  />
                  <RechartsTooltip 
                    content={tooltipContent}
                    cursor={{ fill: 'rgba(229, 192, 123, 0.1)' }}
                    wrapperStyle={{ zIndex: 1000, pointerEvents: 'none' }}
                    allowEscapeViewBox={{ x: true, y: true }}
                    offset={-20}
                  />
                  <Bar 
                    dataKey={barDataKey} 
                    fill={MASTER_COLORS.primary[0]}
                    name={chartTitle}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'line':
        const lineDataKey = chartConfig.key as keyof YearlyFinancialData;
        
        // Filter out years with no data for this specific chart
        const lineFilteredData = filteredYearlyData.filter(d => d[lineDataKey] !== null && d[lineDataKey] !== undefined);
        
        if (lineFilteredData.length === 0) {
          return (
            <div key={chartConfig.key} className="chart-wrapper bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-2xl border border-gold-primary/20 p-6">
              {chartHeader}
              <MasterEmptyState
                icon="📈"
                title="Ei dataa saatavilla"
                description={t('noDataForChart', { default: 'Tälle kaaviolle ei ole dataa saatavilla.' })}
              />
            </div>
          );
        }

        return (
          <div key={chartConfig.key} className="chart-wrapper bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-2xl border border-gold-primary/20 p-6">
            {chartHeader}
            <div style={{ width: '100%', height: `${chartHeight}px`, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%" key={`chart-${chartConfig.key}`}>
                <LineChart 
                  data={lineFilteredData}
                  margin={{ top: 20, right: 40, left: 80, bottom: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
                  {/* Add reference line at zero for negative values */}
                  {lineFilteredData.some(d => d[lineDataKey] && d[lineDataKey] < 0) && (
                    <CartesianGrid 
                      horizontalPoints={[0]} 
                      stroke="#ef4444" 
                      strokeWidth={1} 
                      strokeOpacity={0.6}
                    />
                  )}
                  <XAxis 
                    dataKey="fiscal_year" 
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    label={{ 
                      value: t('axisLabels.year'), 
                      position: 'insideBottom', 
                      offset: -10,
                      style: { textAnchor: 'middle', fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }
                    }}
                  />
                  <YAxis 
                    tick={{ fill: '#9CA3AF', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={70}
                    tickCount={6}
                    domain={[(dataMin: number) => {
                      // For negative values, show from a bit below the minimum to zero
                      if (dataMin < 0) {
                        return Math.min(dataMin * 1.2, dataMin - Math.abs(dataMin) * 0.1);
                      }
                      return 0;
                    }, (dataMax: number) => {
                      // For negative values, show zero as maximum for context
                      if (dataMax <= 0) {
                        return Math.max(0, dataMax * 0.1);
                      }
                      return dataMax * 1.1;
                    }]}
                    tickFormatter={(value) => chartConfig.key === 'roe' ? `${Math.round(value)}%` : formatAxisValue(value, currency)}
                    label={{ 
                      value: getShortYAxisLabel(chartConfig.key), 
                      angle: -90, 
                      position: 'outside',
                      offset: -5,
                      style: { textAnchor: 'middle', fill: '#9CA3AF', fontSize: 10, fontWeight: 500 }
                    }}
                  />
                  <RechartsTooltip 
                    content={tooltipContent}
                    cursor={{ stroke: MASTER_COLORS.primary[0], strokeWidth: 1, strokeDasharray: '5 5' }}
                    wrapperStyle={{ zIndex: 1000, pointerEvents: 'none' }}
                    allowEscapeViewBox={{ x: true, y: true }}
                    offset={-20}
                  />
                  <Line 
                    type="monotone" 
                    dataKey={lineDataKey} 
                    name={chartTitle}
                    stroke={MASTER_COLORS.primary[0]}
                    strokeWidth={3}
                    dot={{ fill: MASTER_COLORS.primary[0], strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: MASTER_COLORS.primary[0], strokeWidth: 2, fill: '#fff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'gauge':
        const ratioValue = latestRatios[chartConfig.key as keyof CurrentFinancialRatios];
        
        if (ratioValue === null || ratioValue === undefined) {
          return (
            <div key={chartConfig.key} className="chart-wrapper bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-2xl border border-gold-primary/20 p-6">
              {chartHeader}
              <MasterEmptyState
                icon="⚡"
                title="Ei dataa saatavilla"
                description={t('noDataForChart', { default: 'Tälle mittarille ei ole dataa saatavilla.' })}
              />
            </div>
          );
        }

        return (
          <div key={chartConfig.key} className="chart-wrapper bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-2xl border border-gold-primary/20 p-6">
            {chartHeader}
            <GaugeChart 
              value={ratioValue} 
              title={chartTitle} 
              chartKey={chartConfig.key}
              initialMaxValue={chartConfig.key === 'currentRatio' || chartConfig.key === 'quickRatio' ? 3 : 
                              chartConfig.key === 'dscr' ? 2 : 5}
            />
          </div>
        );

      case 'combo':
        // Enhanced combo chart for equity and assets
        // Filter out years with no data for either totalAssets or totalEquity
        const comboFilteredData = yearlyData.filter(d => 
          (d.totalAssets !== null && d.totalAssets !== undefined) || 
          (d.totalEquity !== null && d.totalEquity !== undefined)
        );
        
        if (comboFilteredData.length === 0) {
          return (
            <div key={chartConfig.key} className="chart-wrapper bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-2xl border border-gold-primary/20 p-6">
              {chartHeader}
              <MasterEmptyState
                icon="📊"
                title="Ei dataa saatavilla"
                description={t('noDataForChart', { default: 'Tälle kaaviolle ei ole dataa saatavilla.' })}
              />
            </div>
          );
        }

        return (
          <div key={chartConfig.key} className="chart-wrapper bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-2xl border border-gold-primary/20 p-6">
            {chartHeader}
            <MasterChartWrapper height={chartHeight}>
              <ComposedChart data={comboFilteredData}>
                <MasterGradientDefs />
                <MasterGrid />
                <MasterXAxis 
                  dataKey="fiscal_year" 
                  tickFormatter={(value) => `${value}`}
                  label={t('axisLabels.year')}
                />
                <MasterYAxis 
                  tickFormatter={(value) => formatAxisValue(value, currency)}
                  label={currency === 'SEK' ? 'Belopp (kr)' : t('axisLabels.amount')}
                />
                <MasterTooltip
                  formatter={(value: number, name: string) => formatFinancialTooltipValue(value, name, currency)}
                  labelFormatter={(label) => `Vuosi ${label}`}
                  colors={[MASTER_COLORS.primary[0], MASTER_COLORS.primary[1]]}
                />
                <Bar 
                  dataKey="totalAssets" 
                  name="Varat yhteensä"
                  fill={MASTER_COLORS.primary[0]}
                  radius={[4, 4, 0, 0]}
                />
                <Line 
                  type="monotone" 
                  dataKey="totalEquity" 
                  name="Oma pääoma"
                  stroke={MASTER_COLORS.primary[1]}
                  strokeWidth={3}
                  dot={{ fill: MASTER_COLORS.primary[1], strokeWidth: 2, r: 4 }}
                />
              </ComposedChart>
            </MasterChartWrapper>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {title && (
        <div className="text-center">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gold-primary to-gold-secondary bg-clip-text text-transparent mb-2">
            {title}
          </h2>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
        {chartsToShow.map(renderChart)}
      </div>

      {/* Expand/Collapse Button */}
      {chartKeysAndTypes.length > defaultChartsToShow && (
        <div className="text-center">
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            variant="outline"
            className="bg-gray-900 border-gold-primary/30 text-gold-secondary hover:bg-gold-primary/10 hover:border-gold-primary"
          >
            {isExpanded ? (
              <>
                <ChevronUpIcon className="h-4 w-4 mr-2" />
                {t('showLess', { default: 'Näytä vähemmän' })}
              </>
            ) : (
              <>
                <ChevronDownIcon className="h-4 w-4 mr-2" />
                {t('showMore', { default: 'Näytä lisää' })} ({chartKeysAndTypes.length - defaultChartsToShow} {t('moreCharts', { default: 'kaaviota' })})
              </>
            )}
          </Button>
        </div>
      )}

      {/* Financial Insights */}
      {yearlyData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <MasterInsight
            icon="📈"
            title={t('insights.financialDevelopment.title')}
            description={t('insights.financialDevelopment.description', {
              years: yearlyData.length,
              analysis: yearlyData.length >= 3 
                ? t('insights.financialDevelopment.sufficientData')
                : t('insights.financialDevelopment.moreDataNeeded')
            })}
            color="blue"
          />
          
          {Object.keys(latestRatios).length > 0 && (
            <MasterInsight
              icon="⚡"
              title={t('insights.ratios.title')}
              description={t('insights.ratios.description', {
                count: Object.keys(latestRatios).filter(k => latestRatios[k as keyof CurrentFinancialRatios] !== null).length,
                assessment: latestRatios.currentRatio && latestRatios.currentRatio >= 1.5 
                  ? t('insights.ratios.liquidityGood')
                  : latestRatios.currentRatio && latestRatios.currentRatio >= 1 
                  ? t('insights.ratios.liquiditySufficient')
                  : t('insights.ratios.liquidityWatch')
              })}
              color={latestRatios.currentRatio && latestRatios.currentRatio >= 1.5 ? 'green' : 
                     latestRatios.currentRatio && latestRatios.currentRatio >= 1 ? 'blue' : 'yellow'}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default FinancialChartsDisplay;