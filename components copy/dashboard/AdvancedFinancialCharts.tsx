'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Download,
  Maximize2,
  Info,
  FileText
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Chart colors matching your brand
const COLORS = {
  primary: ['#4F46E5', '#6366F1', '#818CF8', '#A5B4FC'],
  success: ['#10B981', '#34D399', '#6EE7B7'],
  warning: ['#F59E0B', '#FBBF24', '#FCD34D'],
  danger: ['#EF4444', '#F87171', '#FCA5A5'],
  neutral: ['#6B7280', '#9CA3AF', '#D1D5DB']
};

export interface FinancialDataPoint {
  fiscal_year: number;
  revenue?: number;
  ebitda?: number;
  netProfit?: number;
  totalAssets?: number;
  totalEquity?: number;
  totalLiabilities?: number;
  cashAndEquivalents?: number;
  dso?: number;
  currentRatio?: number;
  quickRatio?: number;
  debtToEquity?: number;
  dscr?: number;
  roe?: number;
}

export interface AdvancedFinancialChartsProps {
  data: FinancialDataPoint[];
  currency?: string;
  locale?: string;
  onExportPDF?: () => void;
  onExportExcel?: () => void;
}

// Helper function to format currency
const formatCurrency = (value: number, currency: string = 'EUR'): string => {
  if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M €`;
  } else if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(0)}k €`;
  }
  return `${Math.round(value)} €`;
};

// Helper function to format percentage
const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

// Calculate profitability margins (safe calculation with null checks)
const calculateMargins = (data: FinancialDataPoint[]) => {
  return data
    .filter(item => item.revenue && item.revenue > 0) // Only include items with valid revenue
    .map(item => ({
      fiscal_year: item.fiscal_year,
      ebitdaMargin: item.revenue && item.ebitda 
        ? (item.ebitda / item.revenue) * 100 
        : null,
      netProfitMargin: item.revenue && item.netProfit
        ? (item.netProfit / item.revenue) * 100
        : null,
      revenue: item.revenue || 0
    }));
};

// Calculate growth rates (safe calculation with null checks)
const calculateGrowthRates = (data: FinancialDataPoint[]) => {
  const sorted = [...data].sort((a, b) => a.fiscal_year - b.fiscal_year);
  return sorted.map((item, index) => {
    if (index === 0) {
      return {
        fiscal_year: item.fiscal_year,
        revenueGrowth: null,
        ebitdaGrowth: null,
        assetsGrowth: null
      };
    }
    const prev = sorted[index - 1];
    return {
      fiscal_year: item.fiscal_year,
      revenueGrowth: prev.revenue && item.revenue && prev.revenue > 0
        ? ((item.revenue - prev.revenue) / prev.revenue) * 100
        : null,
      ebitdaGrowth: prev.ebitda && item.ebitda && prev.ebitda !== 0
        ? ((item.ebitda - prev.ebitda) / Math.abs(prev.ebitda)) * 100
        : null,
      assetsGrowth: prev.totalAssets && item.totalAssets && prev.totalAssets > 0
        ? ((item.totalAssets - prev.totalAssets) / prev.totalAssets) * 100
        : null
    };
  });
};

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="font-semibold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {entry.value.toFixed(1)}
            {entry.unit || ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function AdvancedFinancialCharts({
  data,
  currency = 'EUR',
  locale = 'fi',
  onExportPDF,
  onExportExcel
}: AdvancedFinancialChartsProps) {
  const t = useTranslations('Dashboard');
  const [selectedChart, setSelectedChart] = useState<'profitability' | 'growth' | 'cashflow' | 'debt'>('profitability');

  const marginsData = calculateMargins(data);
  const growthData = calculateGrowthRates(data);
  
  // Check which data sets are available
  const hasProfitabilityData = marginsData.length > 0 && marginsData.some(d => d.ebitdaMargin !== null || d.netProfitMargin !== null);
  const hasGrowthData = growthData.length > 1 && growthData.some(d => d.revenueGrowth !== null);
  const hasCashflowData = data.some(d => d.cashAndEquivalents !== undefined || d.dso !== undefined);
  const hasDebtData = data.some(d => d.totalEquity !== undefined || d.totalLiabilities !== undefined);

  // Check if we have minimal data to show charts
  const hasMinimalData = data && data.length > 0 && data.some(item => 
    item.revenue !== undefined || item.ebitda !== undefined || item.totalAssets !== undefined
  );

  if (!hasMinimalData) {
    return (
      <Card className="border-2 border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            {t('advancedCharts.title', { default: 'Kehittyneet Talousanalyysi-kaaviot' })}
          </CardTitle>
          <CardDescription>
            {t('advancedCharts.subtitle', { default: 'Syvällinen analyysi yrityksen taloudellisesta kehityksestä' })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {t('advancedCharts.noDataTitle', { default: 'Lataa tilinpäätös saadaksesi laajemmat analyysit' })}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {t('advancedCharts.noDataDescription', { 
                default: 'Liittämällä yrityksesi tilinpäätöksen saat käyttöösi kehittyneet taloudelliset analyysit, kaaviot ja raportit, jotka auttavat ymmärtämään liiketoimintasi kehitystä paremmin.' 
              })}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <a href={`/${locale}/dashboard/documents`}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  {t('advancedCharts.uploadDocuments', { default: 'Lataa tilinpäätös' })}
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href={`/${locale}/finance-application?step=kyc-ubo`}>
                  {t('advancedCharts.applyFunding', { default: 'Hae rahoitusta' })}
                </a>
              </Button>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-3 text-left max-w-2xl mx-auto">
              <div className="p-4 rounded-lg bg-muted/50">
                <TrendingUp className="h-5 w-5 text-primary mb-2" />
                <p className="text-sm font-medium">Kannattavuusanalyysi</p>
                <p className="text-xs text-muted-foreground mt-1">
                  EBITDA-% ja nettovoitto-% kehitys
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <BarChart3 className="h-5 w-5 text-primary mb-2" />
                <p className="text-sm font-medium">Kasvuvauhti</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Liikevaihdon ja taseen kasvu
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <LineChartIcon className="h-5 w-5 text-primary mb-2" />
                <p className="text-sm font-medium">Kassavirtaanalyysi</p>
                <p className="text-xs text-muted-foreground mt-1">
                  DSO ja käteisvarojen kehitys
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Export Buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t('advancedCharts.title', { default: 'Kehittyneet Talousanalyysi-kaaviot' })}
          </h2>
          <p className="text-muted-foreground">
            {t('advancedCharts.subtitle', { default: 'Syvällinen analyysi yrityksen taloudellisesta kehityksestä' })}
          </p>
        </div>
        <div className="flex gap-2">
          {onExportExcel && (
            <Button variant="outline" size="sm" onClick={onExportExcel}>
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
          )}
          {onExportPDF && (
            <Button variant="outline" size="sm" onClick={onExportPDF}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          )}
        </div>
      </div>

      {/* Chart Selection Tabs */}
      <Tabs value={selectedChart} onValueChange={(value: any) => setSelectedChart(value)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profitability">
            <DollarSign className="h-4 w-4 mr-2" />
            Kannattavuus
          </TabsTrigger>
          <TabsTrigger value="growth">
            <TrendingUp className="h-4 w-4 mr-2" />
            Kasvu
          </TabsTrigger>
          <TabsTrigger value="cashflow">
            <BarChart3 className="h-4 w-4 mr-2" />
            Kassavirta
          </TabsTrigger>
          <TabsTrigger value="debt">
            <LineChartIcon className="h-4 w-4 mr-2" />
            Velkaisuus
          </TabsTrigger>
        </TabsList>

        {/* Profitability Charts */}
        <TabsContent value="profitability" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Kannattavuuskehitys</CardTitle>
                  <CardDescription>
                    EBITDA-% ja nettovoitto-% kehitys vuosittain
                  </CardDescription>
                </div>
                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Info className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Kannattavuusmarginaalit kertovat, kuinka tehokkaasti yritys muuttaa liikevaihdon tulokseksi.
                        Korkeammat prosentit ovat parempia.
                      </p>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={marginsData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="fiscal_year" 
                    className="text-sm"
                  />
                  <YAxis 
                    yAxisId="left"
                    className="text-sm"
                    label={{ value: '%', position: 'insideLeft', angle: -90 }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    className="text-sm"
                    label={{ value: '€', position: 'insideRight', angle: 90 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  
                  {/* Area for revenue (background) */}
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    fill={COLORS.neutral[2]}
                    fillOpacity={0.2}
                    stroke="none"
                    name="Liikevaihto"
                  />
                  
                  {/* Lines for margins */}
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="ebitdaMargin"
                    stroke={COLORS.primary[0]}
                    strokeWidth={3}
                    name="EBITDA-%"
                    dot={{ fill: COLORS.primary[0], r: 5 }}
                    connectNulls={true}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="netProfitMargin"
                    stroke={COLORS.success[0]}
                    strokeWidth={3}
                    name="Nettovoitto-%"
                    dot={{ fill: COLORS.success[0], r: 5 }}
                    connectNulls={true}
                  />
                </ComposedChart>
              </ResponsiveContainer>

              {/* Key Insights */}
              {hasProfitabilityData && marginsData.length > 0 && (
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">
                        {marginsData[marginsData.length - 1]?.ebitdaMargin !== null 
                          ? `${marginsData[marginsData.length - 1]?.ebitdaMargin.toFixed(1)}%`
                          : 'N/A'}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        EBITDA-marginaali ({marginsData[marginsData.length - 1]?.fiscal_year})
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">
                        {marginsData[marginsData.length - 1]?.netProfitMargin !== null
                          ? `${marginsData[marginsData.length - 1]?.netProfitMargin.toFixed(1)}%`
                          : 'N/A'}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Nettovoitto-% ({marginsData[marginsData.length - 1]?.fiscal_year})
                      </p>
                    </CardContent>
                  </Card>
                  {marginsData.length > 1 && (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                          {(marginsData[marginsData.length - 1]?.ebitdaMargin || 0) > 
                           (marginsData[marginsData.length - 2]?.ebitdaMargin || 0) ? (
                            <TrendingUp className="h-5 w-5 text-green-500" />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-red-500" />
                          )}
                          <div className="text-2xl font-bold">
                            {((marginsData[marginsData.length - 1]?.ebitdaMargin || 0) - 
                               (marginsData[marginsData.length - 2]?.ebitdaMargin || 0)).toFixed(1)}%
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          EBITDA-% muutos
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Growth Charts */}
        <TabsContent value="growth" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Kasvuvauhti</CardTitle>
                  <CardDescription>
                    Vuosittaiset kasvuprosentit eri osa-alueilla
                  </CardDescription>
                </div>
                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Info className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Kasvuvauhti osoittaa, kuinka nopeasti yritys kasvaa eri mittareilla mitattuna.
                        Positiiviset luvut tarkoittavat kasvua.
                      </p>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="fiscal_year" className="text-sm" />
                  <YAxis 
                    className="text-sm"
                    label={{ value: '%', position: 'insideLeft', angle: -90 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="revenueGrowth" 
                    fill={COLORS.primary[0]}
                    name="Liikevaihdon kasvu-%"
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar 
                    dataKey="ebitdaGrowth" 
                    fill={COLORS.success[0]}
                    name="EBITDA kasvu-%"
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar 
                    dataKey="assetsGrowth" 
                    fill={COLORS.warning[0]}
                    name="Taseen kasvu-%"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>

              {/* Growth Summary */}
              {hasGrowthData && growthData.length > 1 && (
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {['revenueGrowth', 'ebitdaGrowth', 'assetsGrowth'].map((key, index) => {
                    const labels = ['Liikevaihto', 'EBITDA', 'Tase'];
                    const latestGrowth = growthData[growthData.length - 1]?.[key as keyof typeof growthData[0]] as number | null;
                    
                    if (latestGrowth === null) return null;
                    
                    return (
                      <Card key={key}>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-2">
                            {latestGrowth > 0 ? (
                              <Badge variant="default" className="bg-green-500">
                                +{latestGrowth.toFixed(1)}%
                              </Badge>
                            ) : latestGrowth < 0 ? (
                              <Badge variant="destructive">
                                {latestGrowth.toFixed(1)}%
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                0.0%
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            {labels[index]} ({growthData[growthData.length - 1]?.fiscal_year})
                          </p>
                        </CardContent>
                      </Card>
                    );
                  }).filter(Boolean)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cash Flow Charts */}
        <TabsContent value="cashflow" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Kassavirta ja DSO</CardTitle>
                  <CardDescription>
                    Käteisen ja myyntisaamisten kehitys sekä DSO-päivät
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="fiscal_year" className="text-sm" />
                  <YAxis 
                    yAxisId="left"
                    className="text-sm"
                    label={{ value: '€', position: 'insideLeft', angle: -90 }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    className="text-sm"
                    label={{ value: 'Päivät', position: 'insideRight', angle: 90 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="cashAndEquivalents"
                    fill={COLORS.primary[0]}
                    fillOpacity={0.6}
                    stroke={COLORS.primary[0]}
                    strokeWidth={2}
                    name="Käteisvarat"
                  />
                  
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="dso"
                    stroke={COLORS.warning[0]}
                    strokeWidth={3}
                    name="DSO (päivät)"
                    dot={{ fill: COLORS.warning[0], r: 5 }}
                    connectNulls={true}
                  />
                </ComposedChart>
              </ResponsiveContainer>

              {/* Cash Flow Insights */}
              {hasCashflowData && (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {data[data.length - 1]?.cashAndEquivalents !== undefined && (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                          {formatCurrency(data[data.length - 1]?.cashAndEquivalents || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Käteisvarat ({data[data.length - 1]?.fiscal_year})
                        </p>
                      </CardContent>
                    </Card>
                  )}
                  {data[data.length - 1]?.dso !== undefined && (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                          {data[data.length - 1]?.dso || 0} päivää
                        </div>
                        <p className="text-xs text-muted-foreground">
                          DSO - Myyntisaamisten kiertoaika
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
              {!hasCashflowData && (
                <Alert className="mt-6">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Lataa yksityiskohtaisempi tilinpäätös nähdäksesi kassavirtaanalyysin
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Debt Analysis Charts */}
        <TabsContent value="debt" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Velkaisuusanalyysi</CardTitle>
                  <CardDescription>
                    Velkojen ja oman pääoman suhde sekä velkaisuusaste
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="fiscal_year" className="text-sm" />
                  <YAxis 
                    yAxisId="left"
                    className="text-sm"
                    label={{ value: '€', position: 'insideLeft', angle: -90 }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    className="text-sm"
                    label={{ value: 'Suhde', position: 'insideRight', angle: 90 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  
                  <Bar
                    yAxisId="left"
                    dataKey="totalEquity"
                    fill={COLORS.success[0]}
                    name="Oma pääoma"
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="totalLiabilities"
                    fill={COLORS.danger[0]}
                    name="Velat"
                    radius={[8, 8, 0, 0]}
                  />
                  
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="debtToEquity"
                    stroke={COLORS.warning[0]}
                    strokeWidth={3}
                    name="Debt/Equity"
                    dot={{ fill: COLORS.warning[0], r: 5 }}
                    connectNulls={true}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="dscr"
                    stroke={COLORS.primary[0]}
                    strokeWidth={3}
                    name="DSCR"
                    dot={{ fill: COLORS.primary[0], r: 5 }}
                    connectNulls={true}
                  />
                </ComposedChart>
              </ResponsiveContainer>

              {/* Debt Insights */}
              {hasDebtData && (
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {data[data.length - 1]?.totalEquity !== undefined && (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                          {formatCurrency(data[data.length - 1]?.totalEquity || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Oma pääoma
                        </p>
                      </CardContent>
                    </Card>
                  )}
                  {data[data.length - 1]?.totalLiabilities !== undefined && (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                          {formatCurrency(data[data.length - 1]?.totalLiabilities || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Velat yhteensä
                        </p>
                      </CardContent>
                    </Card>
                  )}
                  {data[data.length - 1]?.debtToEquity !== undefined && (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                          {(data[data.length - 1]?.debtToEquity || 0).toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Debt/Equity suhde
                        </p>
                        {(data[data.length - 1]?.debtToEquity || 0) < 1 ? (
                          <Badge variant="default" className="mt-2 bg-green-500">Hyvä</Badge>
                        ) : (data[data.length - 1]?.debtToEquity || 0) < 2 ? (
                          <Badge variant="default" className="mt-2 bg-yellow-500">Kohtuullinen</Badge>
                        ) : (
                          <Badge variant="destructive" className="mt-2">Korkea</Badge>
                        )}
                      </CardContent>
                    </Card>
                  )}
                  {data[data.length - 1]?.dscr !== undefined && (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                          {(data[data.length - 1]?.dscr || 0).toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          DSCR (Velanhoitokyky)
                        </p>
                        {(data[data.length - 1]?.dscr || 0) >= 1.25 ? (
                          <Badge variant="default" className="mt-2 bg-green-500">Hyvä</Badge>
                        ) : (data[data.length - 1]?.dscr || 0) >= 1.0 ? (
                          <Badge variant="default" className="mt-2 bg-yellow-500">Kohtalainen</Badge>
                        ) : (
                          <Badge variant="destructive" className="mt-2">Huono</Badge>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
              {!hasDebtData && (
                <Alert className="mt-6">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Lataa tasetta sisältävä tilinpäätös nähdäksesi velkaisuusanalyysin
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

