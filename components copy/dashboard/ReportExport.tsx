'use client';

import React, { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Download, FileText, Table } from 'lucide-react';
import { toast } from 'sonner';

export interface ExportData {
  fiscalYear: number;
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

export interface ReportExportProps {
  data: ExportData[];
  companyName?: string;
  currency?: string;
}

// Format currency for export
const formatCurrency = (value: number | undefined, currency: string = 'EUR'): string => {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('fi-FI', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Format percentage for export
const formatPercentage = (value: number | undefined): string => {
  if (value === undefined || value === null) return '-';
  return `${value.toFixed(2)}%`;
};

// Format ratio for export
const formatRatio = (value: number | undefined): string => {
  if (value === undefined || value === null) return '-';
  return value.toFixed(2);
};

export function ReportExport({ data, companyName = 'Yritys', currency = 'EUR' }: ReportExportProps) {
  const t = useTranslations('Dashboard.export');

  // Excel Export Function
  const exportToExcel = () => {
    try {
      // Create CSV content
      const headers = [
        'Tilikausi',
        'Liikevaihto',
        'EBITDA',
        'Nettovoitto',
        'Taseen loppusumma',
        'Oma pääoma',
        'Velat',
        'Käteisvarat',
        'DSO (päivät)',
        'Current Ratio',
        'Quick Ratio',
        'Debt/Equity',
        'DSCR',
        'ROE %'
      ];

      const rows = data.map(item => [
        item.fiscalYear,
        formatCurrency(item.revenue, currency),
        formatCurrency(item.ebitda, currency),
        formatCurrency(item.netProfit, currency),
        formatCurrency(item.totalAssets, currency),
        formatCurrency(item.totalEquity, currency),
        formatCurrency(item.totalLiabilities, currency),
        formatCurrency(item.cashAndEquivalents, currency),
        item.dso?.toFixed(0) || '-',
        formatRatio(item.currentRatio),
        formatRatio(item.quickRatio),
        formatRatio(item.debtToEquity),
        formatRatio(item.dscr),
        formatPercentage(item.roe)
      ]);

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      // Create blob and download
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${companyName}_talousraportti_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Excel-raportti ladattu onnistuneesti');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Virhe Excel-raportin latauksessa');
    }
  };

  // PDF Export Function
  const exportToPDF = async () => {
    try {
      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${companyName} - Talousraportti</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 40px;
              color: #333;
            }
            h1 {
              color: #4F46E5;
              border-bottom: 3px solid #4F46E5;
              padding-bottom: 10px;
            }
            h2 {
              color: #4F46E5;
              margin-top: 30px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            th {
              background-color: #4F46E5;
              color: white;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .summary {
              background-color: #f0f0f0;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .summary-item {
              display: inline-block;
              margin: 10px 20px 10px 0;
            }
            .summary-label {
              font-size: 12px;
              color: #666;
            }
            .summary-value {
              font-size: 24px;
              font-weight: bold;
              color: #4F46E5;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <h1>${companyName} - Talousraportti</h1>
          <p>Raportin luontipäivä: ${new Date().toLocaleDateString('fi-FI')}</p>
          
          <div class="summary">
            <h2>Yhteenveto (Viimeisin tilikausi: ${data[data.length - 1]?.fiscalYear})</h2>
            <div class="summary-item">
              <div class="summary-label">Liikevaihto</div>
              <div class="summary-value">${formatCurrency(data[data.length - 1]?.revenue, currency)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">EBITDA</div>
              <div class="summary-value">${formatCurrency(data[data.length - 1]?.ebitda, currency)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Oma pääoma</div>
              <div class="summary-value">${formatCurrency(data[data.length - 1]?.totalEquity, currency)}</div>
            </div>
          </div>

          <h2>Taloudelliset tunnusluvut</h2>
          <table>
            <thead>
              <tr>
                <th>Tilikausi</th>
                <th>Liikevaihto</th>
                <th>EBITDA</th>
                <th>Nettovoitto</th>
                <th>Taseen loppusumma</th>
                <th>Oma pääoma</th>
                <th>Velat</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(item => `
                <tr>
                  <td>${item.fiscalYear}</td>
                  <td>${formatCurrency(item.revenue, currency)}</td>
                  <td>${formatCurrency(item.ebitda, currency)}</td>
                  <td>${formatCurrency(item.netProfit, currency)}</td>
                  <td>${formatCurrency(item.totalAssets, currency)}</td>
                  <td>${formatCurrency(item.totalEquity, currency)}</td>
                  <td>${formatCurrency(item.totalLiabilities, currency)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h2>Tunnusluvut</h2>
          <table>
            <thead>
              <tr>
                <th>Tilikausi</th>
                <th>Current Ratio</th>
                <th>Quick Ratio</th>
                <th>Debt/Equity</th>
                <th>DSCR</th>
                <th>ROE %</th>
                <th>DSO (päivät)</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(item => `
                <tr>
                  <td>${item.fiscalYear}</td>
                  <td>${formatRatio(item.currentRatio)}</td>
                  <td>${formatRatio(item.quickRatio)}</td>
                  <td>${formatRatio(item.debtToEquity)}</td>
                  <td>${formatRatio(item.dscr)}</td>
                  <td>${formatPercentage(item.roe)}</td>
                  <td>${item.dso?.toFixed(0) || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>Raportti luotu automaattisesti Trusty Finance -palvelussa</p>
            <p>© ${new Date().getFullYear()} Trusty Finance. Kaikki oikeudet pidätetään.</p>
          </div>
        </body>
        </html>
      `;

      // Create blob and download
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${companyName}_talousraportti_${new Date().toISOString().split('T')[0]}.html`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('PDF-raportti ladattu onnistuneesti');
      toast.info('Avaa HTML-tiedosto selaimessa ja tulosta PDF:ksi (Ctrl+P)');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast.error('Virhe PDF-raportin latauksessa');
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={exportToExcel}
        disabled={!data || data.length === 0}
      >
        <Table className="h-4 w-4 mr-2" />
        {t('exportExcel', { default: 'Lataa Excel' })}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={exportToPDF}
        disabled={!data || data.length === 0}
      >
        <FileText className="h-4 w-4 mr-2" />
        {t('exportPDF', { default: 'Lataa PDF' })}
      </Button>
    </div>
  );
}

